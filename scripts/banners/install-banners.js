#!/usr/bin/env node
// Applies the sitewide Trip.com dynamic banner from data/tripcom/banner-config.json and banner-placements.json.
//   node scripts/banners/install-banners.js [--check]
// Idempotent: removes any existing banner block and script tag first, then (if enabled) inserts exactly one block per placed page.
// enabled:false in the config removes every banner. Nothing else on any page is touched.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const M = require('./banner-markup');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/banner-config.json'), 'utf8'));
const B = JSON.parse(fs.readFileSync(path.join(ROOT, cfg.banner), 'utf8'));
if (crypto.createHash('sha256').update(B.embed_code).digest('hex') !== B.sha256) { console.error('dynamic-banner.json modified (checksum mismatch)'); process.exit(2); }
const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/banner-placements.json'), 'utf8')).pages;
const OLD = /\n?<!-- TRIP\.COM DYNAMIC BANNER( EXPERIMENT)? -->[\s\S]*?<!-- \/TRIP\.COM DYNAMIC BANNER( EXPERIMENT)? -->\n?/;
let placed = 0, removed = 0; const problems = [];
for (const [page, e] of Object.entries(man)) {
  const f = path.join(ROOT, page); let s = fs.readFileSync(f, 'utf8'); const had = OLD.test(s);
  s = s.replace(OLD, '\n').replace(/<script src="(?:\.\.\/)?dn-banner\.js" defer><\/script>\n?/, '');
  if (had) removed++;
  if (cfg.enabled && !cfg.exclude_pages[page]) {
    const n = s.split(e.anchor).length - 1;
    if (n !== 1) { problems.push(`${page}: anchor found ${n} times`); continue; }
    const prefix = page.startsWith('kr/') ? '../' : '';
    s = s.replace(e.anchor, () => M.block(B, e) + '\n' + e.anchor);
    if (/<script src="(\.\.\/)?dn\.js" defer><\/script>/.test(s)) s = s.replace(/(<script src="(?:\.\.\/)?dn\.js" defer><\/script>)/, `$1\n<script src="${prefix}dn-banner.js" defer></script>`); else s = s.replace('</body>', `<script src="${prefix}dn-banner.js" defer></script>\n</body>`);
    placed++;
  }
  if (!process.argv.includes('--check')) fs.writeFileSync(f, s);
}
console.log(`enabled=${cfg.enabled}; placements in manifest: ${Object.keys(man).length}; blocks written: ${placed}; blocks removed first: ${removed}; problems: ${problems.length}`);
for (const p of problems) console.log('  ' + p);
process.exit(problems.length ? 1 : 0);
