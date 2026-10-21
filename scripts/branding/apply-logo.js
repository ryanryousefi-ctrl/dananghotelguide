#!/usr/bin/env node
// One-off, idempotent migration: swaps the text masthead (header + footer brand links) on every served page for the logo image.
//   node scripts/branding/apply-logo.js [--check]
// Only the two brand anchors change; every other byte of every page (links, affiliate URLs, tracking, SEO) is left untouched.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const L = require('./logo-markup');
const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const red = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
const pages = [...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')), ...fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f)]
  .filter(f => !red.has(f) && !['site-preview.html', 'favicon-html-snippet.html'].includes(f)).sort();
const HEAD = /<a class="dn-brand" href="([^"]*)" aria-label="([^"]*)"><b>Da Nang <i>Hotel Guide<\/i><\/b><small>[^<]*<\/small><\/a>/g;
const FOOT = /<a class="dn-brand dn-brand--light" href="([^"]*)"><b>Da Nang <i>Hotel Guide<\/i><\/b><small>[^<]*<\/small><\/a>/g;
let changed = 0; const odd = [];
for (const p of pages) {
  const f = path.join(ROOT, p); const src = fs.readFileSync(f, 'utf8'); const prefix = p.startsWith('kr/') ? '../' : '';
  const nh = (src.match(HEAD) || []).length, nf = (src.match(FOOT) || []).length;
  const done = (src.match(/dn-brand--logo/g) || []).length;
  if (done) { if (done !== 2) odd.push(`${p}: ${done} logo anchors`); continue; }
  if (nh !== 1 || nf !== 1) { odd.push(`${p}: header ${nh}, footer ${nf}`); continue; }
  const out = src.replace(HEAD, (m, href, aria) => L.header(href, aria, prefix)).replace(FOOT, (m, href) => L.footer(href, prefix));
  if (!process.argv.includes('--check')) fs.writeFileSync(f, out);
  changed++;
}
console.log(`pages: ${pages.length}, migrated: ${changed}, exceptions: ${odd.length}`); for (const o of odd) console.log('  ' + o);
process.exit(odd.length ? 1 : 0);
