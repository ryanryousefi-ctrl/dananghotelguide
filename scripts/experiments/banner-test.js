#!/usr/bin/env node
// Browser tests for the Trip.com dynamic banner experiment (local server; Trip.com hosts blocked and observed, never contacted).
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/Users/ryanyousefi/dananghotelguide/node_modules/playwright'); }
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const SRC = 'https://www.trip.com/partners/ad/DB20401215?Allianceid=11013066&SID=333523744&trip_sub1=';
// GA4 events go through the page's own gtag(), which queues into dataLayer
const EVJS = "window.__evf = n => (window.dataLayer || []).map(x => Array.prototype.slice.call(x)).filter(x => x[0] === 'event' && x[1] === n)";
const R = []; const t = (n, ok, d = '') => { R.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}/`;
  const b = await pw.chromium.launch({ channel: 'chrome' });
  const PAGE = 'best-hotels-in-da-nang.html';
  for (const w of [320, 390, 768, 1280]) {
    const m = w < 900; const c = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: m, hasTouch: m, deviceScaleFactor: 2 });
    const trip = []; await c.route(u => { const s = u.toString(); if (/trip\.com\/partners|tripcdn/.test(s)) trip.push(s); return !/127\.0\.0\.1/.test(s); }, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(base + PAGE, { waitUntil: 'load' }); await p.evaluate(EVJS); await p.waitForTimeout(500);
    if (w === 320) {
      t('Exactly one banner on the page', await p.locator('.dn-adbox[data-banner]').count() === 1 && (await p.content()).split('id="DB20401215"').length === 2);
      t('Marked as advertising (label and paid-placement note)', await p.evaluate(() => /Advertisement/.test(document.querySelector('.dn-adband__label').textContent) && /may earn a commission/.test(document.querySelector('.dn-adband__note').textContent)));
      t('Placed between sections (not inside a paragraph, card or hero)', await p.evaluate(() => { const a = document.querySelector('.dn-adband'); return a.parentElement.tagName === 'MAIN' && a.previousElementSibling && a.previousElementSibling.tagName === 'SECTION' && !a.closest('p,.hotel-card,.dn-hero'); }));
    }
    await p.evaluate(() => document.querySelector('.dn-adbox').scrollIntoView({ block: 'center' })); await p.waitForTimeout(800);
    t(`${w}px: no request to Trip.com banner servers before the visitor acts`, !trip.some(s => /partners\/ad/.test(s)) && await p.locator('.dn-adbox iframe').count() === 0);
    const before = await p.evaluate(() => document.querySelector('.dn-adbox').getBoundingClientRect().height);
    t(`${w}px: view event recorded once as placeholder`, await p.evaluate(() => window.__evf('affiliate_banner_view').length === 1 && window.__evf('affiliate_banner_view')[0][2].state === 'placeholder'));
    await p.click('.dn-adbox__go'); await p.waitForTimeout(900);
    const f = await p.evaluate(() => { const i = document.querySelector('.dn-adbox iframe'); const bx = document.querySelector('.dn-adbox').getBoundingClientRect(); return i && { src: i.getAttribute('src'), w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height), boxH: Math.round(bx.height), boxW: Math.round(bx.width), ovf: document.documentElement.scrollWidth - innerWidth, ev: window.__evf('affiliate_banner_load').map(e => e[2].trigger) }; });
    t(`${w}px: click loads the exact official iframe`, !!f && f.src === SRC && trip.some(s => s === SRC), JSON.stringify(f));
    t(`${w}px: iframe stays inside its 300x250 box (${f && f.w}x${f && f.h}) and the page does not scroll sideways`, !!f && f.h === 250 && f.w <= 300 && f.w <= f.boxW + 1 && f.ovf <= 1);
    t(`${w}px: container height does not change on activation (no layout shift)`, !!f && Math.abs(f.boxH - before) <= 1);
    t(`${w}px: load event recorded (trigger click)`, !!f && f.ev.length === 1 && f.ev[0] === 'click');
    t(`${w}px: layout shift score < 0.02`, await p.evaluate(() => window.__cls) < 0.02, String(await p.evaluate(() => +window.__cls.toFixed(4))));
    if (w === 390) {
      const n = await p.evaluate(() => document.querySelectorAll('a[data-provider="tripcom"]').length);
      t('Existing Trip.com booking buttons unchanged (40)', n === 40, String(n));
      t('Existing booking buttons keep their exact affiliate hrefs', await p.evaluate(() => [...document.querySelectorAll('a[data-provider="tripcom"]')].every(a => /^https:\/\/www\.trip\.com\/hotels\/.*Allianceid=11013066&SID=333523744/.test(a.href))));
    }
    t(`${w}px: no JavaScript errors`, errs.length === 0, errs[0] || '');
    await c.close();
  }
  { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); const trip = []; await c.route(u => { const s = u.toString(); if (/trip\.com\/partners/.test(s)) trip.push(s); return !/127\.0\.0\.1/.test(s); }, r => r.abort());
    const p = await c.newPage(); await p.addInitScript(() => { localStorage.setItem('dn_consent', JSON.stringify({ v: 'granted', t: Date.now() })); });
    await p.goto(base + PAGE, { waitUntil: 'load' }); await p.evaluate(EVJS); await p.evaluate(() => document.querySelector('.dn-adbox').scrollIntoView({ block: 'center' })); await p.waitForTimeout(1200);
    t('Already-accepted cookies: banner loads by itself when scrolled into view (trigger consent)', await p.locator('.dn-adbox iframe').count() === 1 && await p.evaluate(() => window.__evf('affiliate_banner_load').some(e => e[2].trigger === 'consent')));
    await c.close(); }
  { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); const trip = []; await c.route(u => { const s = u.toString(); if (/trip\.com\/partners/.test(s)) trip.push(s); return !/127\.0\.0\.1/.test(s); }, r => r.abort());
    const p = await c.newPage(); await p.goto(base + 'hilton-da-nang.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
    t('Banner is not on other pages', await p.locator('.dn-adbox, .dn-adband').count() === 0 && !trip.some(s => /DB20401215/.test(s)));
    await c.close(); }
  await b.close(); srv.close(); const bad = R.filter(x => !x).length; console.log(`\n${R.length - bad}/${R.length} passed`); process.exit(bad ? 1 : 0);
})();
