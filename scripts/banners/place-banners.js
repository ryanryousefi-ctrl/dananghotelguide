#!/usr/bin/env node
// Chooses ONE natural banner position per eligible page and verifies it in a real browser. Writes data/tripcom/banner-placements.json.
//   node scripts/banners/place-banners.js
// Rules: between top-level editorial blocks (never inside a paragraph, card, table, image or booking UI), roughly 35-55% of the
// way through the page's text, not next to a booking-strip band, and only where the 728px band really fits at 1024 and 1280 px wide.
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..');
const NM = '/Users/ryanyousefi/dananghotelguide/node_modules/';
const cheerio = require(NM + 'cheerio'), pw = require(NM + 'playwright');
const M = require('./banner-markup');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/banner-config.json'), 'utf8'));
const B = JSON.parse(fs.readFileSync(path.join(ROOT, cfg.banner), 'utf8'));
const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')); const red = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
const pages = [...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')), ...fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f)].filter(f => !red.has(f) && !['site-preview.html', 'favicon-html-snippet.html'].includes(f)).sort();
const OLD = /\n?<!-- TRIP\.COM DYNAMIC BANNER( EXPERIMENT)? -->[\s\S]*?<!-- \/TRIP\.COM DYNAMIC BANNER( EXPERIMENT)? -->\n?/;
const txt = e => e.text().replace(/\s+/g, ' ').trim().length;
const SKIPTAG = new Set(['script', 'style', 'template', 'noscript', 'link', 'meta']);
const flow = $c => $c.children().filter((i, e) => e.type === 'tag' && !SKIPTAG.has(e.tagName));
const CTA = /book|cta|strip|disclos|breadcrumb|share|toc|sticky|consent|search|filter|nav/i;

function candidates($, html) {
  let $c = $('main#dn-main'); if (!$c.length) $c = $('main').first(); if (!$c.length) return { why: 'no main element' };   // three older guides use a different main id
  const total = txt($c); if (total < 2400) return { why: `short page (${total} characters of text)` };
  const chain = [$c];   // descend into a dominant wrapper (>= 70% of the text); keep the deepest container that still has >= 3 blocks
  for (let d = 0; d < 6; d++) {
    const kids = flow($c).toArray(); const big = kids.map(k => [k, txt($(k))]).sort((a, b) => b[1] - a[1])[0];
    if (!big || big[1] < txt($c) * .7 || !['div', 'article', 'section', 'main'].includes(big[0].tagName) || flow($(big[0])).length === 0) break;
    $c = $(big[0]); chain.push($c);
  }
  while (chain.length > 1 && flow($c).length < 3) { chain.pop(); $c = chain[chain.length - 1]; }
  const F = flow($c).toArray(); const T = F.reduce((a, e) => a + txt($(e)), 0); const out = []; let cum = 0;
  F.forEach((e, i) => {
    const t = txt($(e)); const prev = F[i - 1];
    if (i >= 1 && cum >= 1200) {
      const tag = e.tagName, own = $(e); const cls = (own.attr('class') || '') + ' ' + (own.attr('id') || '');
      const block = ['section', 'article', 'h2', 'hr'].includes(tag) || (tag === 'div' && (t > 300 || own.find('h2,h3').length)) || (tag === 'span' && /eyebrow|label/.test(cls));
      const pc = (($(prev).attr('class') || '') + ' ' + ($(prev).attr('id') || ''));
      const ctaLike = el => { const x = $(el); return x.text().replace(/\s+/g, ' ').trim().length < 260 && (x.find('[data-provider]').length || CTA.test((x.attr('class') || '') + ' ' + (x.attr('id') || ''))); };
      const frac = cum / T;
      if (block && !ctaLike(e) && !ctaLike(prev) && !/hr/.test(prev.tagName) && frac >= .1 && frac <= .9 && !own.is('header,footer,nav')) out.push({ offset: e.sourceCodeLocation.startOffset, frac, tag, cls: cls.trim().slice(0, 40) });
    }
    cum += t;
  });
  out.sort((a, b) => (a.frac > .75) - (b.frac > .75) || Math.abs(a.frac - .45) - Math.abs(b.frac - .45));   // late positions (> 75%) only as a fallback
  return { list: out, total };
}
const typeOf = ($, p) => $('.hr-snapshot,.hr-section').length ? 'hotel-review' : (/-vs-/.test(p) || $('.hvh-section').length) ? 'comparison' : p.startsWith('kr/') ? 'korean-article' : /hoi-an/.test(p) ? 'hoi-an' : /^best-|hotels|resort|stay/.test(p) ? 'hotel-list' : 'guide';

(async () => {
  const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } const ext = path.extname(f); r.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' }[ext] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await pw.chromium.launch({ channel: 'chrome' }); const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(u => !/127\.0\.0\.1/.test(u.toString()), r => r.abort());
  const manifest = {}, excluded = {}, lastWhy = {};
  for (const page of pages) {
    if (cfg.exclude_pages[page]) { excluded[page] = cfg.exclude_pages[page]; continue; }
    let src = fs.readFileSync(path.join(ROOT, page), 'utf8').replace(OLD, '\n');
    const $ = cheerio.load(src, { sourceCodeLocationInfo: true });
    const type = typeOf($, page), lang = page.startsWith('kr/') ? 'ko' : 'en';
    if (cfg.pinned[page]) { manifest[page] = { anchor: '<!-- QUICK PICKS GRID -->', placement: 'original-experiment', type, lang, pinned: true }; continue; }
    const c = candidates($, src); if (!c.list || !c.list.length) { excluded[page] = c.why || 'no natural boundary between top-level sections'; continue; }
    let done = false;
    for (const cand of c.list.slice(0, 5)) {
      const placement = `after-${Math.round(cand.frac * 100)}pct`;
      const html = src.slice(0, cand.offset) + M.block(B, { lang, placement, type }) + '\n' + src.slice(cand.offset);
      const p = await ctx.newPage(); await p.route(base + page, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
      let ok = true, why = '';
      for (const w of [1024, 1280]) {
        await p.setViewportSize({ width: w, height: 900 });
        await p.goto(base + page, { waitUntil: 'load' }).catch(() => {});
        const r = await p.evaluate(() => { const b = document.querySelector('.dn-adband'), x = document.querySelector('.dn-adbox'); if (!b || !x) return { miss: true }; const r = x.getBoundingClientRect(); return { shown: getComputedStyle(b).display !== 'none', w: Math.round(r.width), h: Math.round(r.height), ovf: document.documentElement.scrollWidth - innerWidth, bandW: Math.round(b.getBoundingClientRect().width), bad: !!b.closest('p,table,figure,.hotel-card,nav,footer,header,#dhSbox,li,details') }; });
        if (r.miss || !r.shown || r.w < 727 || r.h !== 90 || r.ovf > 1 || r.bad) { ok = false; why = JSON.stringify(r) + '@' + w; break; }
      }
      if (!ok) { lastWhy[page] = why;
      }
      await p.close();
      if (ok) { let n = 140, anc = src.substr(cand.offset, n); while (src.split(anc).length - 1 !== 1 && n < 700) { n += 140; anc = src.substr(cand.offset, n); } if (src.split(anc).length - 1 !== 1) continue; manifest[page] = { anchor: anc, placement, type, lang }; done = true; break; }
    }
    if (!done) excluded[page] = 'no candidate position where a 728px band fits at 1024 and 1280 px wide ' + (lastWhy[page] || '');
  }
  await browser.close(); srv.close();
  // anchors must be unique in the cleaned source
  for (const [page, e] of Object.entries(manifest)) { const s = fs.readFileSync(path.join(ROOT, page), 'utf8').replace(OLD, '\n'); const n = s.split(e.anchor).length - 1; if (n !== 1) { delete manifest[page]; excluded[page] = `anchor not unique (${n})`; } }
  fs.writeFileSync(path.join(ROOT, 'data/tripcom/banner-placements.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), pages: manifest, excluded }, null, 1));
  const by = {}; for (const e of Object.values(manifest)) by[e.type] = (by[e.type] || 0) + 1;
  console.log(`placed ${Object.keys(manifest).length}, excluded ${Object.keys(excluded).length}, total ${pages.length}`, JSON.stringify(by));
  const why = {}; for (const [p, r] of Object.entries(excluded)) { const k = r.replace(/\(\d+ characters.*\)/, '').slice(0, 60); (why[k] = why[k] || []).push(p); } for (const [k, v] of Object.entries(why)) console.log(`  ${v.length} × ${k}${v.length < 6 ? ': ' + v.join(', ') : ''}`);
})();
