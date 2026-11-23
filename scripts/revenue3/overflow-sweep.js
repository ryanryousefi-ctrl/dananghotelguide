#!/usr/bin/env node
// Horizontal-overflow + page-error sweep of every page changed vs origin/main at 320/390/768/1280.
'use strict';
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const pages = cp.execSync('git diff --name-only origin/main -- "*.html"; git ls-files --others --exclude-standard -- "*.html"', { cwd: ROOT }).toString().split('\n').filter(f => f && !f.includes('/'));
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } const ty = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' }[path.extname(f)] || 'application/octet-stream'; r.writeHead(200, { 'content-type': ty }); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}/`; const b = await chromium.launch(); const bad = [];
  for (const w of [320, 390, 768, 1280]) { const c = await b.newContext({ viewport: { width: w, height: 800 } }); await c.route(u => !/127\.0\.0\.1/.test(u.toString()), r => r.abort()); const q = pages.slice();
    await Promise.all(Array.from({ length: 4 }, async () => { while (q.length) { const pg = q.shift(); const p = await c.newPage(); const errs = []; p.on('pageerror', e => { if (!/^L is not defined$/.test(e.message)) errs.push(e.message); }); await p.goto(base + pg, { waitUntil: 'load' }).catch(() => {}); const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 1 || errs.length) bad.push(`${pg}@${w}: overflow ${o} ${errs.join('|')}`); await p.close(); } })); await c.close(); }
  await b.close(); srv.close(); console.log(`${pages.length} changed pages x 4 widths: ${bad.length ? bad.length + ' problems\n' + bad.slice(0, 15).join('\n') : 'no overflow, no page errors'}`);
})();
