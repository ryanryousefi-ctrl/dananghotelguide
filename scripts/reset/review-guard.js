#!/usr/bin/env node
// Review protection: every hotel review's editorial content must be byte-identical to the starting production SHA.
//   node scripts/reset/review-guard.js [baseSha]      (default: e6b9fd4, production when Operation Revenue Reset began)
// Protected per review page: the whole <main> element, <title>, meta description, canonical, robots, and every JSON-LD block.
// Review pages = the review of every hotel in data/hotels/facts.json + every page whose baseline JSON-LD declares a Review or Hotel/LodgingBusiness
// + review-*.html + withdrawn reviews. Exit 1 on any difference.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..'); const BASE = process.argv[2] || 'e6b9fd4';
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
const baseFiles = git('ls-tree', '--name-only', BASE).split('\n').filter(f => /\.html$/.test(f));
const show = f => { try { return git('show', `${BASE}:${f}`); } catch (e) { return null; } };
const facts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/facts.json'), 'utf8')).hotels;
const set = new Set(Object.values(facts).map(h => h.review).filter(Boolean));
const base = {};
// + every page the reviews index links to from its <main> (catches reviews without hotel schema)
{ const idx = show('hotel-reviews.html') || ''; const m = (idx.match(/<main[\s\S]*<\/main>/) || [''])[0]; for (const x of m.matchAll(/href="([a-z0-9-]+\.html)"/g)) if (!/^(index|hotel-reviews|about|contact|privacy|terms|compare-hotels|find-your-hotel)\.html$/.test(x[1]) && !/^(best-|where-|da-nang-|luxury-|family-|boutique-|hoi-an)/.test(x[1])) set.add(x[1]); }
for (const f of baseFiles) {
  const h = show(f); if (!h) continue; base[f] = h;
  const ld = (h.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []).join('');
  const single = /"@type"\s*:\s*"(Review|Hotel|LodgingBusiness|Resort)"/.test(ld) && !/"ItemList"/.test(ld); // a list page (ItemList of hotels) is a category page, not a review
  if (/^review-/.test(f) || single || /<meta name="robots" content="noindex/.test(h) && /This review (has been|is) withdrawn|withdrawn/i.test(h)) set.add(f);
}
// Machine-inserted booking modules are delimited by marker comments; they are commercial UI, not the review's editorial content.
const MOD = /<!--(dn-c3|dn-c4|dn-revenue|rr):([a-z0-9:_-]+)-->[\s\S]*?<!--\/\1:\2-->|<!-- TRIP\.COM DYNAMIC BANNER -->[\s\S]*?<!-- \/TRIP\.COM DYNAMIC BANNER -->/g;
const editorial = m => m.replace(MOD, '[module]');
const parts = h => ({
  // the article: <main> when the page has one; otherwise everything from the first <h1> to the footer (the header and menus are chrome)
  main: (h.match(/<main[\s\S]*<\/main>/) || [])[0] || ('NO-MAIN ' + h.slice(h.indexOf('<h1'), h.indexOf('<footer') > 0 ? h.indexOf('<footer') : h.length)),
  title: (h.match(/<title>[\s\S]*?<\/title>/) || [''])[0],
  desc: (h.match(/<meta name="description"[^>]*>/) || [''])[0],
  canonical: (h.match(/<link rel="canonical"[^>]*>/) || [''])[0],
  robots: (h.match(/<meta name="robots"[^>]*>/) || [''])[0],
  ld: (h.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []).join('\n')
});
let bad = 0, full = 0; const rows = [];
for (const f of [...set].sort()) {
  if (!base[f]) { rows.push([f, 'not in baseline (skipped)']); continue; }
  if (!fs.existsSync(path.join(ROOT, f))) { bad++; rows.push([f, 'MISSING']); continue; }
  const a = parts(base[f]), b = parts(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  if (Object.keys(a).every(k => a[k] === b[k])) full++;
  a.main = editorial(a.main); b.main = editorial(b.main);
  const diff = Object.keys(a).filter(k => a[k] !== b[k]);
  if (diff.length) bad++;
  rows.push([f, diff.length ? 'CHANGED: ' + diff.join(', ') : 'identical']);
}
for (const [f, s] of rows) if (s !== 'identical' || process.env.VERBOSE) console.log(f.padEnd(52), s);
console.log(`review-guard vs ${BASE}: ${rows.length} protected review pages; editorial content (article, title, description, canonical, robots, JSON-LD) identical on ${rows.filter(r => r[1] === 'identical').length}, changed on ${bad}; fully byte-identical including booking modules: ${full}`);
process.exit(bad ? 1 : 0);
