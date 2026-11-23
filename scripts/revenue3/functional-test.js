#!/usr/bin/env node
// Browser functional tests for Phase 3 components (real Chromium, local static server, external requests aborted).
'use strict';
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'); const R = [];
const t = (n, ok, d) => { R.push(!!ok); console.log((ok ? 'PASS' : 'FAIL') + '  ' + n + (ok ? '' : '  -- ' + d)); };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]); const f = path.join(ROOT, p === '/' ? 'index.html' : p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } const ty = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(f)] || 'application/octet-stream'; r.writeHead(200, { 'content-type': ty }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}/`; const b = await chromium.launch();
  const mk = async (w, consent) => { const c = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 768, hasTouch: w < 768 }); await c.route(u => !/127\.0\.0\.1/.test(u.toString()), r => r.abort()); if (consent) await c.addInitScript(() => { try { localStorage.setItem('dn_consent', JSON.stringify({ v: 'denied', t: Date.now() })); } catch (e) {} }); return c; };
  const clicks = p => p.evaluate(() => (window.dataLayer || []).map(x => Array.prototype.slice.call(x)).filter(x => x[0] === 'event' && x[1] === 'affiliate_click').map(x => x[2]));
  // 1. where-to-stay hero + card buttons: one affiliate_click each, no auto-open
  { const c = await mk(1280, true); const p = await c.newPage(); let popups = 0; c.on('page', () => popups++); await p.goto(base + 'where-to-stay-in-da-nang.html'); await p.waitForTimeout(600);
    t('where-to-stay: no Trip.com tab opens without a click', popups === 0, popups);
    await p.click('.dnc-hero a.tc-btn'); await p.waitForTimeout(400); let k = await clicks(p);
    t('hero button: exactly one affiliate_click, cta_location p3-hero, page_type present', k.length === 1 && k[0].cta_location === 'p3-hero' && !!k[0].page_type, JSON.stringify(k));
    const hrefOk = await p.evaluate(() => [...document.querySelectorAll('a[data-provider="tripcom"]')].every(a => /^https:\/\/www\.trip\.com\/hotels\//.test(a.href) && /Allianceid=11013066/.test(a.href) && /SID=333523744/.test(a.href)));
    t('where-to-stay: every Trip.com anchor carries Alliance ID and Site ID', hrefOk);
    await p.locator('.dnc-card a.tc-btn').first().click(); await p.waitForTimeout(300); k = await clicks(p);
    t('hotel card button: one more affiliate_click with hotel_name and cta_location p3-ws-pick', k.length === 2 && k[1].cta_location === 'p3-ws-pick' && !!k[1].hotel_name, JSON.stringify(k[1]));
    const heads = await p.evaluate(() => ({ h1: document.querySelectorAll('h1').length, ids: [...document.querySelectorAll('[id]')].map(e => e.id).filter((x, i, a) => a.indexOf(x) !== i).length }));
    t('where-to-stay: exactly one h1, no duplicate ids', heads.h1 === 1 && heads.ids === 0, JSON.stringify(heads)); await c.close(); }
  // 2. shortlist + compare
  { const c = await mk(390, true); const p = await c.newPage(); await p.goto(base + 'where-to-stay-in-da-nang.html'); await p.waitForTimeout(500);
    const sv = p.locator('[data-dn-save="hyatt-regency-da-nang"]').first(); await sv.scrollIntoViewIfNeeded(); await sv.click();
    t('save button toggles to Saved (aria-pressed true), stored locally', (await sv.getAttribute('aria-pressed')) === 'true' && (await p.evaluate(() => JSON.parse(localStorage.getItem('dn_shortlist_v1')))).join() === 'hyatt-regency-da-nang');
    await p.locator('[data-dn-save="novotel-da-nang-han-river"]').first().click();
    await p.goto(base + 'compare-hotels.html'); await p.waitForTimeout(500);
    t('compare page lists the saved hotels', (await p.locator('#dnc-sl-list li').count()) === 2);
    await p.click('#dnc-sl-load'); await p.waitForTimeout(300);
    t('shortlist loads into the comparison table', (await p.locator('.dnc-table th[scope=col]').count()) >= 3 && (await p.locator('.dnc-table a.tc-btn').count()) === 2);
    await p.locator('.dnc-table a.tc-btn').first().click(); await p.waitForTimeout(300); const k = await clicks(p);
    t('compare-table button: one affiliate_click, cta_location compare-tool', k.length === 1 && k[0].cta_location === 'compare-tool', JSON.stringify(k));
    const ev = await p.evaluate(() => (window.dataLayer || []).map(x => Array.prototype.slice.call(x)).filter(x => x[0] === 'event').map(x => x[1]));
    t('tool engagement is tracked separately (dn_compare_use), not as affiliate_click', ev.includes('dn_compare_use') && ev.filter(e => e === 'affiliate_click').length === 1, ev.join());
    const nv = await p.evaluate(() => /Not verified/.test(document.querySelector('.dnc-table').textContent)); t('unknown fields show "Not verified"', nv);
    await p.reload(); await p.waitForTimeout(400); t('shortlist survives a reload', (await p.locator('#dnc-sl-list li').count()) === 2);
    await p.click('#dnc-sl-clear'); await p.waitForTimeout(200); t('clear shortlist works', (await p.evaluate(() => JSON.parse(localStorage.getItem('dn_shortlist_v1')).length)) === 0);
    await p.goto(base + 'compare-hotels.html?h=hilton-da-nang,novotel-da-nang-han-river,hyatt-regency-da-nang,melia-da-nang'); await p.waitForTimeout(300); t('deep link caps the selection at three hotels', (await p.locator('.dnc-table thead th').count()) === 4);
    t('compare page: no horizontal page overflow at 390', (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1); await c.close(); }
  // 3. sticky: one bar, phones only, on a list page
  { const c = await mk(390, true); const p = await c.newPage(); await p.goto(base + 'best-hotels-in-da-nang.html'); await p.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.5)); await p.waitForTimeout(800);
    const n = await p.locator('.dn-sticky').count(); t('list page: at most one sticky bar (script loaded once)', n <= 1 && (await p.evaluate(() => document.querySelectorAll('script[src*="dn-sticky-cta"]').length)) === 1, n); await c.close(); }
  { const c = await mk(1280, true); const p = await c.newPage(); await p.goto(base + 'best-hotels-in-da-nang.html'); await p.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.5)); await p.waitForTimeout(500); t('desktop: no sticky bar', (await p.locator('.dn-sticky:not([hidden])').count()) === 0); await c.close(); }
  // 4. consent: with no stored choice the banner shows and the Trip.com buttons are plain links
  { const c = await mk(390, false); const p = await c.newPage(); await p.goto(base + 'where-to-stay-in-da-nang.html'); await p.waitForTimeout(800); t('consent banner still appears for new visitors', (await p.locator('.dn-consent').count()) > 0); await c.close(); }
  await b.close(); srv.close(); const nb = R.filter(x => !x).length; console.log(`\n${R.length - nb}/${R.length} passed`); process.exit(nb ? 1 : 0);
})();
