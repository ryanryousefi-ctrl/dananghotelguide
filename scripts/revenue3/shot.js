#!/usr/bin/env node
// node shot.js <label> <page.html>... : screenshots (desktop 1280 + mobile 390) into docs/revenue/p3-shots/<label>-<page>-<w>.png and horizontal-overflow check at 8 widths.
'use strict';
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), http = require('http');
const ROOT = path.resolve(__dirname, '..', '..'); const [label, ...pages] = process.argv.slice(2);
const out = path.join(ROOT, 'docs/revenue/p3-shots'); fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } const t = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.avif': 'image/avif' }[path.extname(f)] || 'application/octet-stream'; r.writeHead(200, { 'content-type': t }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch(); let bad = 0;
  for (const pg of pages) for (const w of [320, 375, 390, 428, 768, 1024, 1280, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 768, hasTouch: w < 768 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(base + '/' + pg, { waitUntil: 'load' }); await p.waitForTimeout(400);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ov > 1 || errs.length) { bad++; console.log('PROBLEM', pg, w, 'overflow', ov, errs.join('|')); }
    if (w === 1280 || w === 390) await p.screenshot({ path: path.join(out, `${label}-${pg.replace('.html', '')}-${w}.png`), fullPage: false });
    if (w === 390 || w === 1280) await p.screenshot({ path: path.join(out, `${label}-${pg.replace('.html', '')}-${w}-full.png`), fullPage: true });
    await ctx.close();
  }
  await b.close(); srv.close(); console.log(bad ? 'overflow/errors: ' + bad : 'all widths clean for ' + pages.join(', '));
})();
