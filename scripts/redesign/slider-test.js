#!/usr/bin/env node
// Real-browser tests for the homepage hero slider (local server, external traffic blocked).
//   node scripts/redesign/slider-test.js
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/Users/ryanyousefi/dananghotelguide/node_modules/playwright'); }
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const BLOCK = /yceml|cjtrack|kqzyfj|booking\.com|googletagmanager|google-analytics|googlesyndication|doubleclick|ahrefs|youtube|ytimg|fonts\.g/;
const EXPECT = ['best-hotels-in-da-nang.html', 'where-to-stay-in-da-nang.html', 'luxury-hotels-da-nang.html', 'best-hotels-in-hoi-an.html', 'da-nang-beach-hotels.html'];
const results = []; const t = (n, ok, d = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };
const idx = p => p.evaluate(() => [...document.querySelectorAll('.dh-slide')].findIndex(s => s.classList.contains('is-active')));
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const b = await pw.chromium.launch({ channel: 'chrome' });
  const mk = async (o = {}) => { const c = await b.newContext({ viewport: { width: 1280, height: 800 }, ...o }); await c.route(u => BLOCK.test(u.toString()), r => r.abort()); return c; };

  // Structure, first slide, lazy loading, removed sections, errors
  { const c = await mk(); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); const reqs = [];
    p.on('request', r => { if (/slide-\d/.test(r.url())) reqs.push(r.url().split('/').pop()); });
    await p.goto(base + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(3500);
    t('Five slides present', await p.locator('.dh-slide').count() === 5);
    const first = await p.evaluate(() => { const i = document.querySelector('.dh-slide.is-active img'); return i.complete && i.naturalWidth > 0 && i.getAttribute('fetchpriority') === 'high' && i.loading !== 'lazy'; });
    t('First slide image is loaded immediately (high priority, not lazy)', first);
    t('Later slides do not download at load (only slide 1 and the idle-warmed slide 2)', reqs.every(r => /slide-[12]/.test(r)), reqs.join(','));
    t('Removed sections are absent from the DOM', await p.evaluate(() => !document.querySelector('.dh-start, .dh-intro, .dh-stats') && !/New to Da Nang\?|Locally maintained since 2021|hotels in the directory|full hotel reviews|head-to-head comparisons/.test(document.body.innerText)));
    t('Exactly one h1', await p.locator('h1').count() === 1);
    t('Order: slider, then finder, then collections', await p.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect().top; return q('#dhSlider') < q('#dhFind') && q('#dhFind') < q('#dh-h-coll'); }));
    t('Slider sits directly under the masthead', await p.evaluate(() => { const h = document.querySelector('.dn-header').getBoundingClientRect(); const s = document.querySelector('#dhSlider').getBoundingClientRect(); return Math.abs(s.top - h.bottom) < 2; }));
    const hrefs = await p.evaluate(() => [...document.querySelectorAll('.dh-slide .dn-btn')].map(a => a.getAttribute('href')));
    t('Slide CTAs link to the five guides', JSON.stringify(hrefs) === JSON.stringify(EXPECT), hrefs.join(' | '));
    const exist = EXPECT.every(f => fs.existsSync(path.join(ROOT, f))); t('Every destination page exists', exist);
    t('Only the active slide is exposed (inactive ones hidden)', await p.evaluate(() => [...document.querySelectorAll('.dh-slide')].every(s => (getComputedStyle(s).visibility === 'visible') === s.classList.contains('is-active'))));
    t('Carousel semantics (region, slide groups, labelled controls)', await p.evaluate(() => document.querySelector('#dhSlider').getAttribute('aria-roledescription') === 'carousel' && document.querySelectorAll('[aria-roledescription="slide"]').length === 5 && [...document.querySelectorAll('.dh-sl-btn,.dh-dot')].every(x => x.getAttribute('aria-label'))));
    // controls
    await p.click('.dh-next'); await p.waitForTimeout(300); t('Next arrow advances', await idx(p) === 1);
    await p.click('.dh-prev'); await p.waitForTimeout(300); t('Previous arrow goes back', await idx(p) === 0);
    await p.click('.dh-prev'); await p.waitForTimeout(300); t('Previous wraps to the last slide', await idx(p) === 4);
    await p.click('.dh-dot:nth-child(3)'); await p.waitForTimeout(300); t('Pagination dot jumps to its slide', await idx(p) === 2);
    t('Dot reflects the active slide (aria-current)', await p.evaluate(() => document.querySelectorAll('.dh-dot[aria-current="true"]').length === 1 && document.querySelectorAll('.dh-dot')[2].getAttribute('aria-current') === 'true'));
    t('Slide images load on demand when shown', await p.evaluate(() => [...document.querySelectorAll('.dh-slide img')].slice(0, 5).every((i, k) => k > 3 || i.getAttribute('src'))));
    await p.focus('.dh-next'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300); t('Keyboard: ArrowRight advances', await idx(p) === 3);
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300); t('Keyboard: ArrowLeft goes back', await idx(p) === 2);
    // CTA click navigates
    await p.click('.dh-dot:nth-child(1)'); await p.waitForTimeout(1000);
    await Promise.all([p.waitForURL(/best-hotels-in-da-nang/), p.click('.dh-slide.is-active .dn-btn')]).catch(() => {});
    t('Active slide CTA is clickable and navigates', /best-hotels-in-da-nang/.test(p.url()), p.url().replace(base, ''));
    t('No JavaScript errors', errs.length === 0, errs[0] || '');
    await c.close(); }

  // Autoplay, hover pause, pause button
  { const c = await mk(); const p = await c.newPage(); await p.goto(base + 'index.html', { waitUntil: 'load' });
    await p.waitForTimeout(7200); t('Autoplay advances after about six seconds', await idx(p) === 1);
    await p.mouse.move(640, 400); const a = await idx(p); await p.waitForTimeout(7000); t('Pauses while the pointer is over the slider', await idx(p) === a);
    await p.mouse.move(640, 790); await p.waitForTimeout(7000); t('Resumes when the pointer leaves', await idx(p) !== a);
    await p.click('.dh-pause'); const b2 = await idx(p); await p.mouse.move(5, 790); await p.waitForTimeout(7000);
    t('Pause button stops autoplay', await idx(p) === b2 && await p.evaluate(() => document.querySelector('.dh-pause').getAttribute('aria-label') === 'Play slideshow'));
    await p.click('.dh-pause'); await p.mouse.move(5, 790); await p.waitForTimeout(7000); t('Play button restarts autoplay', await idx(p) !== b2);
    await c.close(); }

  // Offscreen pause
  { const c = await mk(); const p = await c.newPage(); await p.goto(base + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
    await p.evaluate(() => window.scrollTo(0, 2200)); await p.waitForTimeout(500); const a = await idx(p); await p.waitForTimeout(7000);
    t('Autoplay pauses while the slider is offscreen', await idx(p) === a);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.mouse.move(5, 790); await p.waitForTimeout(7000); t('Autoplay resumes when it returns to view', await idx(p) !== a);
    await c.close(); }

  // Reduced motion
  { const c = await mk({ reducedMotion: 'reduce' }); const p = await c.newPage(); await p.goto(base + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(7500);
    t('Reduced motion: no autoplay', await idx(p) === 0);
    t('Reduced motion: no transitions or zoom', await p.evaluate(() => getComputedStyle(document.querySelector('.dh-slide')).transitionDuration === '0s' && getComputedStyle(document.querySelector('.dh-slide__media img')).transform === 'none'));
    await p.click('.dh-next'); await p.waitForTimeout(100); t('Reduced motion: manual navigation still works', await idx(p) === 1);
    await c.close(); }

  // Mobile: real touch swipe, widths, overflow, CLS
  { const c = await mk({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const p = await c.newPage(); await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(base + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
    const cdp = await c.newCDPSession(p);
    const swipe = async (x1, x2) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: 300 }] }); for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * i / 6, y: 302 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(400); };
    await swipe(320, 80); t('Swipe left shows the next slide', await idx(p) === 1);
    await swipe(80, 320); t('Swipe right shows the previous slide', await idx(p) === 0);
    const y0 = await p.evaluate(() => scrollY); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 600 }] }); for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 600 - 70 * i }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500);
    t('A vertical drag still scrolls the page (does not change slide)', await idx(p) === 0 && await p.evaluate(() => scrollY) > y0);
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    t('Mobile: pause button hidden, arrows and dots visible and 44px', await p.evaluate(() => { const v = s => document.querySelector(s); const r = s => v(s).getBoundingClientRect(); return getComputedStyle(v('.dh-pause')).display === 'none' && r('.dh-next').width >= 44 && r('.dh-next').height >= 44 && r('.dh-dot').height >= 44; }));
    t('No unexpected layout shift on load (CLS < 0.02)', await p.evaluate(() => window.__cls) < 0.02, String(await p.evaluate(() => +window.__cls.toFixed(4))));
    await c.close(); }
  for (const w of [320, 360, 390, 414, 768, 1280]) {
    const m = w <= 900; const c = await mk({ viewport: { width: w, height: m ? 800 : 800 }, isMobile: m, hasTouch: m, deviceScaleFactor: 2 }); const p = await c.newPage(); await p.goto(base + 'index.html', { waitUntil: 'load' });
    const r = await p.evaluate(() => { const out = { ovf: document.documentElement.scrollWidth - innerWidth, clip: [] }; const hero = document.querySelector('#dhSlider').getBoundingClientRect();
      for (let i = 0; i < 5; i++) { document.querySelectorAll('.dh-slide').forEach((s, k) => s.classList.toggle('is-active', k === i)); const tx = document.querySelectorAll('.dh-slide__txt')[i]; const rr = tx.getBoundingClientRect(); const ui = document.querySelector('.dh-slider__ui').getBoundingClientRect(); const ttl = tx.querySelector('.dh-slide__t').getBoundingClientRect(); const btn = tx.querySelector('.dn-btn').getBoundingClientRect();
        if (ttl.top < hero.top + 8 || btn.bottom > ui.top + 2 || rr.right > innerWidth + 1 || ttl.left < 0) out.clip.push(i + 1); }
      out.h = Math.round(hero.height); return out; });
    t(`${w}px: no overflow, text never overlaps controls or clips (hero ${r.h}px)`, r.ovf <= 1 && r.clip.length === 0, `ovf=${r.ovf} clip=${r.clip.join(',')}`);
    await c.close(); }

  await b.close(); srv.close();
  const bad = results.filter(x => !x).length; console.log(`\n${results.length - bad}/${results.length} passed`); process.exit(bad ? 1 : 0);
})();
