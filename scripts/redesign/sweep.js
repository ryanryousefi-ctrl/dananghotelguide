#!/usr/bin/env node
// Browser sweep for the redesign: every served page at several widths.
//   node scripts/redesign/sweep.js [--widths 1280,390] [--pages a.html,b.html] [--conc 4]
// External analytics, ads and affiliate hosts are blocked (no fake traffic or clicks).
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/Users/ryanyousefi/dananghotelguide/node_modules/playwright'); }
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const widths = arg('--widths', '1280,390').split(',').map(Number);
const conc = +arg('--conc', 4);
const BASE = fs.readFileSync(path.join(ROOT, 'docs/redesign/BASELINE.txt'), 'utf8').match(/[0-9a-f]{40}/)[0];
const vj = JSON.parse(cp.execFileSync('git', ['show', `${BASE}:vercel.json`], { cwd: ROOT }).toString());
const redirected = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
let pages = cp.execFileSync('git', ['ls-tree', '-r', '--name-only', BASE], { cwd: ROOT }).toString().split('\n')
  .filter(f => /^(kr\/)?[^/]+\.html$/.test(f) && !['site-preview.html', 'favicon-html-snippet.html'].includes(f) && !redirected.has(f)).sort();
if (arg('--pages')) pages = arg('--pages').split(',');

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.avif': 'image/avif', '.txt': 'text/plain', '.xml': 'application/xml' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
const BLOCK = /yceml|cjtrack|kqzyfj|booking\.com|google-analytics|googletagmanager|doubleclick|googlesyndication|adservice|ahrefs|clarity|unsplash\.com|youtube|ytimg|openstreetmap|arcgisonline|cartocdn|open-meteo/;

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await pw.chromium.launch({ channel: 'chrome' });
  const fails = []; let checked = 0;
  for (const w of widths) {
    const mobile = w <= 900;
    const ctx = await browser.newContext({ viewport: { width: w, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    await ctx.route(u => BLOCK.test(u.toString()), r => r.abort());
    const queue = pages.slice();
    const work = async () => {
      while (queue.length) {
        const pg = queue.shift(); const p = await ctx.newPage(); const errs = [], bad = [];
        p.on('pageerror', e => errs.push(e.message.slice(0, 100)));
        p.on('response', r => { const u = r.url(); if (u.startsWith(base) && r.status() >= 400) bad.push(`${r.status()} ${u.slice(base.length)}`); });
        try {
          await p.goto(base + pg, { waitUntil: 'load', timeout: 45000 });
          await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
          await p.waitForTimeout(250);
          const r = await p.evaluate(() => {
            const out = {};
            out.overflow = document.documentElement.scrollWidth - innerWidth;
            out.h1 = document.querySelectorAll('h1').length;
            out.main = document.querySelectorAll('main').length;
            out.header = !!document.querySelector('.dn-header');
            out.footer = !!document.querySelector('.dn-footer');
            out.imgs = [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src && i.src.startsWith(location.origin) && getComputedStyle(i).display !== 'none').map(i => (i.getAttribute('src') || '').slice(0, 70));
            out.emptyLinks = [...document.querySelectorAll('a[href]')].filter(a => !a.textContent.trim() && !a.querySelector('img, svg') && !a.getAttribute('aria-label')).length;
            out.noAltImg = [...document.querySelectorAll('main img, .dn-hero img')].filter(i => !i.hasAttribute('alt')).length;
            return out;
          });
          let menu = null;
          if (mobile) {
            await p.locator('#navHamburger').click({ timeout: 3000 }).catch(() => {});
            menu = await p.evaluate(() => { const m = document.getElementById('mobileMenu'); return !!m && m.classList.contains('open') && m.getBoundingClientRect().height > 150; });
            if (!menu) fails.push(`${pg} @${w}: mobile menu did not open`);
          }
          if (errs.length) fails.push(`${pg} @${w}: JS error ${errs[0]}`);
          if (bad.length) fails.push(`${pg} @${w}: failed local request ${bad.slice(0, 2).join(', ')}`);
          if (r.overflow > 1) fails.push(`${pg} @${w}: horizontal overflow ${r.overflow}px`);
          if (r.imgs.length) fails.push(`${pg} @${w}: broken image ${r.imgs.slice(0, 2).join(', ')}`);
          if (!r.header || !r.footer) fails.push(`${pg} @${w}: missing header/footer`);
          if (r.h1 !== 1) fails.push(`${pg} @${w}: ${r.h1} h1 elements`);
          if (r.main !== 1) fails.push(`${pg} @${w}: ${r.main} main landmarks`);
        } catch (e) { fails.push(`${pg} @${w}: ${e.message.split('\n')[0].slice(0, 90)}`); }
        await p.close(); checked++;
      }
    };
    await Promise.all(Array.from({ length: conc }, work));
    await ctx.close();
  }
  await browser.close(); srv.close();
  const byKind = fails.reduce((a, f) => { const k = f.replace(/^[^:]+: /, '').split(/[ (]/).slice(0, 2).join(' '); a[k] = (a[k] || 0) + 1; return a; }, {});
  console.log(`Checked ${checked} page-loads (${pages.length} pages × ${widths.join('/')}px). Failures: ${fails.length}`, JSON.stringify(byKind));
  for (const f of fails.slice(0, 80)) console.log('  ' + f);
  if (fails.length > 80) console.log(`  … ${fails.length - 80} more`);
  process.exit(fails.length ? 1 : 0);
})();
