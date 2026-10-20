#!/usr/bin/env node
// Interaction tests for the redesign (local server, external traffic blocked).
//   node scripts/redesign/behavior.js
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/Users/ryanyousefi/dananghotelguide/node_modules/playwright'); }
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const BLOCK = /yceml|cjtrack|kqzyfj|booking\.com|googletagmanager|google-analytics|googlesyndication|doubleclick|adservice|ahrefs|unsplash|youtube|ytimg|openstreetmap|arcgisonline|cartocdn|open-meteo/;
const results = [];
const t = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await pw.chromium.launch({ channel: 'chrome' });
  const mk = async (opts = {}) => { const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts }); await c.route(u => BLOCK.test(u.toString()), r => r.abort()); return c; };
  const prep = async c => c.addInitScript(() => { window.__opened = []; window.open = u => { window.__opened.push(String(u)); return null; }; });

  // 1. Homepage chooser
  { const c = await mk(); const p = await c.newPage(); await p.goto(base + 'index.html');
    await p.selectOption('#dhArea', 'best-hotels-near-my-khe-beach.html'); await Promise.all([p.waitForURL(/best-hotels-near-my-khe-beach/), p.click('.dh-find__go')]).catch(() => {});
    t('Homepage chooser: area → My Khe guide', /best-hotels-near-my-khe-beach/.test(p.url()), p.url().replace(base, ''));
    await p.goto(base + 'index.html'); await p.selectOption('#dhStyle', 'luxury-hotels-da-nang.html'); await Promise.all([p.waitForURL(/luxury-hotels/), p.click('.dh-find__go')]).catch(() => {});
    t('Homepage chooser: style → Luxury guide', /luxury-hotels-da-nang/.test(p.url()), p.url().replace(base, ''));
    await c.close(); }

  // 2. Desktop dropdown (keyboard + hover) and header CTA
  { const c = await mk(); const p = await c.newPage(); await p.goto(base + 'hilton-da-nang.html');
    await p.hover('.dn-has-drop:first-child > a'); await p.waitForTimeout(300);
    t('Desktop dropdown opens on hover', await p.evaluate(() => getComputedStyle(document.querySelector('.dn-has-drop .dn-drop')).visibility === 'visible'));
    await p.mouse.move(0, 0); await p.focus('.dn-has-drop > a'); await p.waitForTimeout(250);
    t('Desktop dropdown opens on keyboard focus', await p.evaluate(() => getComputedStyle(document.querySelector('.dn-has-drop .dn-drop')).visibility === 'visible'));
    t('Header booking button present with sponsored rel', await p.evaluate(() => { const a = document.querySelector('.dn-header .nav-stays-btn'); return !!a && /sponsored/.test(a.rel) && /kqzyfj/.test(a.href); }));
    await c.close(); }

  // 3. Mobile menu open / close / Escape, no sideways scroll
  { const c = await mk({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await c.newPage(); await p.goto(base + 'best-hotels-in-da-nang.html');
    await p.tap('#navHamburger'); await p.waitForTimeout(350);
    t('Mobile menu opens (single toggle)', await p.evaluate(() => document.getElementById('mobileMenu').classList.contains('open') && document.body.style.overflow === 'hidden'));
    t('Mobile menu lists all top-level sections', await p.evaluate(() => document.querySelectorAll('#mobileMenu .dn-menu__group, #mobileMenu .dn-menu__link').length >= 8));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    t('Mobile menu closes on Escape and unlocks scroll', await p.evaluate(() => !document.getElementById('mobileMenu').classList.contains('open') && document.body.style.overflow === ''));
    await c.close(); }

  // 4. Site search overlay
  { const c = await mk(); const p = await c.newPage(); await p.goto(base + 'hilton-da-nang.html');
    await p.click('#searchOpenBtn'); await p.waitForTimeout(400); await p.fill('#searchInput', 'luxury hotels'); await p.waitForTimeout(700);
    const n = await p.evaluate(() => document.querySelectorAll('#searchResultsInline a, #searchResultsInline .sri-item, #searchResultsInline [role="option"]').length);
    t('Search overlay opens and returns results', n > 0, `${n} results`);
    await c.close(); }

  // 5. Map page: pins, popup with booking button
  { const c = await mk(); const p = await c.newPage(); await prep(c); await p.goto(base + 'da-nang-hotels-map.html'); await p.waitForTimeout(1500);
    const pins = await p.locator('.dhm-marker-hotel').count(); t('Map renders hotel pins', pins > 5, `${pins} pins`);
    await p.locator('.dhm-marker-hotel').first().click({ force: true }); await p.waitForTimeout(500);
    t('Map popup opens with a booking button', await p.evaluate(() => !!document.querySelector('.leaflet-popup a[href*="kqzyfj"]')));
    await c.close(); }

  // 6. Directory: filter + booking buttons
  { const c = await mk(); const p = await c.newPage(); await p.goto(base + 'da-nang-hotel-directory.html'); await p.waitForTimeout(800);
    const before = await p.locator('tr.dhd-row:visible').count();
    await p.fill('input[placeholder^="Search hotel"]', 'hilton').catch(() => {}); await p.waitForTimeout(500);
    const after = await p.locator('tr.dhd-row:visible').count();
    t('Directory search filters rows', after > 0 && after < before, `${before} → ${after}`);
    t('Directory rows use the unified booking button', await p.evaluate(() => !!document.querySelector('a.dhd-book.dn-btn')));
    await c.close(); }

  // 7. GA4: exactly one booking_click per click, with context
  { const c = await mk(); const p = await c.newPage();
    await p.goto(base + 'best-hotels-in-da-nang.html'); await p.waitForTimeout(500);
    await p.evaluate(() => { const a = [...document.querySelectorAll('a.dn-btn--book')].find(x => x.getBoundingClientRect().width); a.addEventListener('click', e => e.preventDefault()); a.click(); });
    const ev = await p.evaluate(() => (window.dataLayer || []).map(x => Array.prototype.slice.call(x)).filter(x => x[0] === 'event' && x[1] === 'booking_click'));
    t('GA4 booking_click fires exactly once per click', ev.length === 1, `${ev.length} event(s)`);
    t('GA4 event carries cta_location, hotel_name, page, link_sid', ev.length === 1 && !!ev[0][2].cta_location && !!ev[0][2].page && !!ev[0][2].link_sid, ev[0] ? JSON.stringify({ l: ev[0][2].cta_location, h: ev[0][2].hotel_name, p: ev[0][2].page }) : '');
    await c.close(); }

  // 8. Consent: default, banner, reject, accept, persistence, reopen
  { const c = await mk(); const p = await c.newPage(); await p.addInitScript(() => { window.__dl = []; const o = Array.prototype.push; });
    await p.goto(base + 'about.html'); await p.waitForTimeout(500);
    const dl = await p.evaluate(() => (window.dataLayer || []).map(x => Array.prototype.slice.call(x)));
    const defaults = dl.filter(x => x[0] === 'consent' && x[1] === 'default');
    t('Consent default set before Google tags (regional deny + global grant)', defaults.length === 2 && defaults[0][2].analytics_storage === 'denied' && Array.isArray(defaults[0][2].region) && defaults[0][2].region.includes('GB') && defaults[0][2].region.includes('VN') && defaults[1][2].analytics_storage === 'granted');
    t('Consent banner shown on first visit', await p.locator('.dn-consent').count() === 1);
    await p.click('.dn-consent__b[data-v="denied"]'); await p.waitForTimeout(200);
    const st1 = await p.evaluate(() => ({ s: JSON.parse(localStorage.getItem('dn_consent')).v, u: (window.dataLayer || []).map(x => Array.prototype.slice.call(x)).filter(x => x[0] === 'consent' && x[1] === 'update').pop() }));
    t('Reject stores "denied" and updates Consent Mode', st1.s === 'denied' && st1.u && st1.u[2].analytics_storage === 'denied' && st1.u[2].ad_storage === 'denied');
    await p.reload(); await p.waitForTimeout(400);
    t('Choice persists (no banner after reload)', await p.locator('.dn-consent').count() === 0);
    await p.click('.dn-consent-open'); await p.waitForTimeout(200);
    t('"Privacy settings" reopens the banner', await p.locator('.dn-consent').count() === 1);
    await p.click('.dn-consent__b[data-v="granted"]'); await p.waitForTimeout(200);
    const st2 = await p.evaluate(() => ({ s: JSON.parse(localStorage.getItem('dn_consent')).v, u: (window.dataLayer || []).map(x => Array.prototype.slice.call(x)).filter(x => x[0] === 'consent' && x[1] === 'update').pop() }));
    t('Accept stores "granted" and updates Consent Mode', st2.s === 'granted' && st2.u[2].analytics_storage === 'granted' && st2.u[2].ad_personalization === 'granted');
    await c.close(); }

  // 9. Affiliate safety on the built pages
  { const fs2 = fs.readFileSync(path.join(ROOT, 'best-hotels-in-da-nang.html'), 'utf8').replace(/<style id="dn-dark">[\s\S]*?<\/style>/, '');   // the generated dark-ground CSS mentions :not(.tc-btn) on purpose
    t('No Trip.com branding or provider attributes in the CJ build', !/tripcom-logo|data-provider="tripcom"|tc-btn/.test(fs2) && !/trip\.com\/hotels/.test(fs2)); }

  // 10. Monochrome identity and no emojis in the rendered interface
  { const EMO = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{1F1E6}-\u{1F1FF}]/u;
    const chroma = `(() => { const bad = []; const parse = s => { const m = s.match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)(?:[, /]+([\\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
      for (const e of document.querySelectorAll('.dn-header *, .dn-header, #mobileMenu *, .dn-footer *, .dn-footer, a.dn-btn, .dn-consent *, .dn-hero h1, main h1, main h2, main p')) { const cs = getComputedStyle(e);
        for (const pr of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor']) { const c = parse(cs[pr]); if (c && c[3] > 0 && Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) >= 4) bad.push(e.className + ' ' + pr + ' ' + cs[pr]); } }
      return bad.slice(0, 5); })()`;
    const c = await mk(); const p = await c.newPage();
    for (const pg of ['index.html', 'hilton-da-nang.html', 'best-hotels-in-da-nang.html', 'da-nang-hotel-directory.html', 'kr/index.html']) {
      await p.goto(base + pg); await p.waitForTimeout(300);
      const txt = await p.evaluate(() => document.body.innerText + [...document.querySelectorAll('[alt],[title],[aria-label],[placeholder]')].map(e => (e.alt || '') + (e.title || '') + (e.getAttribute('aria-label') || '') + (e.placeholder || '')).join(' '));
      t(`No emoji characters in rendered text: ${pg}`, !EMO.test(txt), (txt.match(EMO) || [''])[0]);
      const bad = await p.evaluate(chroma);
      t(`UI is monochrome (header, menu, footer, buttons, headings): ${pg}`, bad.length === 0, bad[0] || '');
    }
    await p.goto(base + 'hilton-da-nang.html'); await p.hover('.dn-has-drop:first-child > a'); await p.waitForTimeout(300);
    t('Desktop dropdown items are plain text (no icon spans)', await p.evaluate(() => !document.querySelector('.dn-drop .di-icon') && [...document.querySelectorAll('.dn-drop a')].every(a => !a.querySelector('span'))));
    const st = await p.evaluate(() => { const b = document.querySelector('a.dn-btn'); const cs = getComputedStyle(b); return [cs.backgroundColor, cs.color]; });
    t('Primary booking button is black with white text', /rgb\(17, 17, 17\)/.test(st[0]) && /rgb\(255, 255, 255\)/.test(st[1]), st.join(' / '));
    t('Page background is pure white', await p.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)'));
    await c.close(); }

  await browser.close(); srv.close();
  const bad = results.filter(r => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})();
