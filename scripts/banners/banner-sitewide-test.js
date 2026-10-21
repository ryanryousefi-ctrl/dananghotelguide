#!/usr/bin/env node
// Sitewide banner tests: static (all pages) + browser (every placed page at 1280 and 390, samples for consent/events/lazy loading).
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
let pw, cheerio; for (const nm of ['', '/Users/ryanyousefi/dananghotelguide/node_modules/']) { try { pw = require(nm + 'playwright'); cheerio = require(nm + 'cheerio'); break; } catch (e) { } }
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/banner-config.json'), 'utf8')), man = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/banner-placements.json'), 'utf8'));
const B = JSON.parse(fs.readFileSync(path.join(ROOT, cfg.banner), 'utf8')); const SRC = B.source_url;
const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')); const red = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
const pages = [...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')), ...fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f)].filter(f => !red.has(f) && !['site-preview.html', 'favicon-html-snippet.html'].includes(f)).sort();
const placed = Object.keys(man.pages), excluded = pages.filter(p => !man.pages[p]);
const R = []; const t = (n, ok, d = '') => { R.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } const ext = path.extname(f); r.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' }[ext] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
(async () => {
  // ── static ──
  let bad = [];
  for (const p of pages) { const s = fs.readFileSync(path.join(ROOT, p), 'utf8'); const n = (s.match(/id="DB20401215"/g) || []).length; const want = man.pages[p] ? 1 : 0; if (n !== want) bad.push(`${p}: ${n} banners, expected ${want}`); }
  t(`Static: at most one banner per page; ${placed.length} pages have exactly one; ${excluded.length} excluded pages have none`, !bad.length, bad.slice(0, 3).join(' | '));
  bad = []; for (const p of placed) { const s = fs.readFileSync(path.join(ROOT, p), 'utf8'); if (!s.includes('src="' + SRC + '"') || !s.includes(B.embed_code)) bad.push(p); }
  t('Static: every banner uses the exact official iframe (src byte for byte, Alliance 11013066, SID 333523744)', !bad.length && /Allianceid=11013066&SID=333523744&trip_sub1=$/.test(SRC), bad.slice(0, 3).join(','));
  bad = []; for (const p of placed) { const s = fs.readFileSync(path.join(ROOT, p), 'utf8'); const ko = p.startsWith('kr/'); if (!(ko ? /광고 &middot; Trip\.com 제휴 상품/ : /Advertisement &middot; Trip\.com affiliate offer/).test(s) || !(ko ? /유료 제휴 광고/ : /Paid placement: we may earn a commission/).test(s)) bad.push(p); }
  t('Static: existing advertising label and paid-placement disclosure on every banner page (Korean localized)', !bad.length, bad.slice(0, 3).join(','));
  bad = []; for (const p of placed) { const $ = cheerio.load(fs.readFileSync(path.join(ROOT, p), 'utf8')); const a = $('.dn-adband'); if (a.length !== 1 || a.closest('p,table,figure,.hotel-card,nav,footer,header,li,details,#dhSbox,.leaflet-popup').length) bad.push(p); }
  t('Static: banner never inside a paragraph, table, card, figure, list, nav, header, footer or search box', !bad.length, bad.slice(0, 3).join(','));
  t('Static: no banner on homepage, legal, hub, directory, map or utility pages', ['index.html', 'privacy.html', 'terms.html', 'about.html', 'contact.html', 'guides.html', 'da-nang-hotel-directory.html', 'da-nang-hotels-map.html', 'kr/index.html'].every(p => !man.pages[p]));
  t('Static: original best-hotels-in-da-nang placement kept', man.pages['best-hotels-in-da-nang.html'] && man.pages['best-hotels-in-da-nang.html'].anchor === '<!-- QUICK PICKS GRID -->' && /<!-- \/TRIP\.COM DYNAMIC BANNER -->\s*<!-- QUICK PICKS GRID -->/.test(fs.readFileSync(path.join(ROOT, 'best-hotels-in-da-nang.html'), 'utf8')));
  // ── browser ──
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}/`;
  const b = await pw.chromium.launch({ channel: 'chrome' });
  const run = async (w, pagesList, consent, dwell) => {
    const m = w < 900; const c = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: m, hasTouch: m }); const trip = []; await c.route(u => { const s = u.toString(); if (/trip\.com\/partners\/ad/.test(s)) trip.push(s); return !/127\.0\.0\.1/.test(s); }, r => r.abort());
    if (consent) await c.addInitScript(() => { try { localStorage.setItem('dn_consent', JSON.stringify({ v: 'granted', t: Date.now() })); } catch (e) { /* blocked frames (embeds the test aborts) have no storage */ } });
    const out = []; const q = pagesList.slice();
    const work = async () => { while (q.length) { const pg = q.shift(); const p = await c.newPage(); const errs = []; p.on('pageerror', e => { if (!/^L is not defined$/.test(e.message)) errs.push(e.message); }); /* Leaflet comes from a CDN that the test blocks */ const before = trip.length;
      await p.goto(base + pg, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
      if (dwell) { await p.evaluate(() => { const x = document.querySelector('.dn-adbox'); if (x) x.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(1000); } else { await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 25)); } }).catch(() => {}); await p.waitForTimeout(250); }
      const r = await p.evaluate(() => { const b = document.querySelector('.dn-adband'), x = document.querySelector('.dn-adbox'); const rc = x && x.getBoundingClientRect(); return { n: document.querySelectorAll('.dn-adbox').length, shown: !!b && getComputedStyle(b).display !== 'none', w: rc && Math.round(rc.width), h: rc && Math.round(rc.height), ovf: document.documentElement.scrollWidth - innerWidth, ifr: document.querySelectorAll('.dn-adbox iframe').length, ev: (window.dataLayer || []).map(x => Array.prototype.slice.call(x)).filter(x => x[0] === 'event' && /affiliate_banner/.test(x[1])).map(x => x[1]) }; });
      out.push({ pg, r, errs, req: trip.length - before }); await p.close(); } };
    await Promise.all(Array.from({ length: 4 }, work)); await c.close(); return out;
  };
  let o = await run(1280, placed, false);
  let f = o.filter(x => x.r.n !== 1 || !x.r.shown || x.r.w < 727 || x.r.h !== 90 || x.r.ovf > 1 || x.errs.length);
  t(`1280px: all ${placed.length} placed pages show one 728x90 band, no squeeze, no overflow, no JS errors`, !f.length, f.slice(0, 3).map(x => x.pg + JSON.stringify(x.r)).join(' | '));
  f = o.filter(x => x.r.ifr || x.req); t('1280px: nothing loaded from Trip.com banner servers on any page before the visitor acts (lazy/consent-gated)', !f.length, f.slice(0, 3).map(x => x.pg).join(','));
  f = o.filter(x => x.r.ev.filter(e => e === 'affiliate_banner_view').length > 1); t('1280px: no duplicate view events', !f.length, f.slice(0, 3).map(x => x.pg).join(','));
  o = await run(390, placed, true);
  f = o.filter(x => x.r.shown || x.r.ifr || x.req || x.r.ev.length || x.r.ovf > 1 || x.errs.length);
  t(`390px: all ${placed.length} placed pages hide the banner (even with cookies accepted): no iframe, no Trip.com request, no events, no overflow, no JS errors`, !f.length, f.slice(0, 3).map(x => x.pg + JSON.stringify(x.r)).join(' | '));
  o = await run(768, placed.filter((p, i) => i % 6 === 0), true);
  f = o.filter(x => x.r.shown || x.r.ifr || x.req || x.r.ovf > 1); t('768px (sample): hidden, nothing loaded, no overflow', !f.length, f.slice(0, 3).map(x => x.pg).join(','));
  o = await run(1280, ['hilton-da-nang.html', 'hyatt-vs-marriott-da-nang.html', 'luxury-hotels-da-nang.html', 'where-to-stay-in-da-nang.html', 'kr/best-hotels-in-da-nang.html'].filter(p => man.pages[p]), true, true);
  f = o.filter(x => x.r.ifr !== 1 || x.req < 1); t('1280px with cookies already accepted: banner loads by itself when scrolled into view (samples)', !f.length, f.map(x => x.pg).join(','));
  // click-to-load + events on samples
  for (const pg of ['hilton-da-nang.html', 'kr/best-hotels-in-da-nang.html', 'hyatt-vs-marriott-da-nang.html'].filter(p => man.pages[p])) {
    const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); const trip = []; await c.route(u => { const s = u.toString(); if (/trip\.com\/partners\/ad/.test(s)) trip.push(s); return !/127\.0\.0\.1/.test(s); }, r => r.abort());
    const p = await c.newPage(); await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(base + pg, { waitUntil: 'load' }); await p.evaluate(() => document.querySelector('.dn-adbox').scrollIntoView({ block: 'center' })); await p.waitForTimeout(700);
    const pre = trip.length; const bh = await p.evaluate(() => document.querySelector('.dn-adbox').getBoundingClientRect().height); await p.click('.dn-adbox__go'); await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const i = document.querySelector('.dn-adbox iframe'); const ev = (window.dataLayer || []).map(x => Array.prototype.slice.call(x)).filter(x => x[0] === 'event' && /affiliate_banner/.test(x[1])); return { src: i && i.getAttribute('src'), w: i && Math.round(i.getBoundingClientRect().width), h: i && Math.round(i.getBoundingClientRect().height), boxH: Math.round(document.querySelector('.dn-adbox').getBoundingClientRect().height), ev: ev.map(x => x[1] + ':' + (x[2].state || x[2].trigger) + ':' + x[2].placement + ':' + x[2].page_type), cls: window.__cls, ovf: document.documentElement.scrollWidth - innerWidth }; });
    t(`${pg}: click loads the exact iframe (728x90), no shift (CLS ${r.cls.toFixed(3)}), view+load events once each with placement and page type`, pre === 0 && r.src === SRC && r.w === 728 && r.h === 90 && Math.abs(r.boxH - bh) <= 1 && r.cls < .02 && r.ovf <= 1 && r.ev.length === 2 && r.ev[0].startsWith('affiliate_banner_view') && r.ev[1].startsWith('affiliate_banner_load:click'), JSON.stringify(r.ev));
    await c.close();
  }
  // existing affiliate buttons unchanged on a few banner pages
  { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c.route(u => !/127\.0\.0\.1/.test(u.toString()), r => r.abort()); const p = await c.newPage(); const bad2 = [];
    for (const pg of ['hilton-da-nang.html', 'best-hotels-in-da-nang.html', 'luxury-hotels-da-nang.html', 'kr/best-hotels-in-da-nang.html']) { await p.goto(base + pg, { waitUntil: 'load' }); const n = await p.evaluate(() => [...document.querySelectorAll('a[data-provider="tripcom"]')].filter(a => /^https:\/\/www\.trip\.com\/hotels\/.*Allianceid=11013066&SID=333523744/.test(a.href)).length === document.querySelectorAll('a[data-provider="tripcom"]').length); if (!n) bad2.push(pg); }
    t('Existing Trip.com booking buttons keep their affiliate hrefs on banner pages', !bad2.length, bad2.join(',')); await c.close(); }
  await b.close(); srv.close(); const nb = R.filter(x => !x).length; console.log(`\n${R.length - nb}/${R.length} passed | banner pages: ${placed.length}, excluded pages: ${excluded.length}`); process.exit(nb ? 1 : 0);
})();
