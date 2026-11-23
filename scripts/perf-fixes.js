#!/usr/bin/env node
// Targeted, idempotent performance fixes on every served page (no content change):
//  1. below-the-fold <img> without a loading attribute -> loading="lazy" decoding="async"
//     (skips: images before <main>, the first image inside <main>, any image with fetchpriority)
//  2. Google Fonts stylesheet -> non-render-blocking preload + onload swap, with <noscript> fallback (fonts already use display=swap)
//  3. index.html: drop the duplicate synchronous search-engine.js in <head> (the same file is loaded again before search-ui.js)
'use strict';
const fs = require('fs'), path = require('path'); const ROOT = path.resolve(__dirname, '..');
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).concat(fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f));
let lazy = 0, fonts = 0, dup = 0, touched = 0;
for (const f of files) {
  const p = path.join(ROOT, f); let h = fs.readFileSync(p, 'utf8'); const o = h;
  const m = h.indexOf('<main'); if (m > 0) { let first = true;
    h = h.slice(0, m) + h.slice(m).replace(/<img\b[^>]*>/g, tag => { if (first) { first = false; return tag; } if (/\bloading=|fetchpriority=/.test(tag)) return tag; lazy++; return tag.replace(/^<img\b/, '<img loading="lazy" decoding="async"').replace(/decoding="async"([^>]*)decoding="[^"]*"/, 'decoding="async"$1'); }); }
  h = h.replace(/(<noscript>)?<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"\s*\/?>/g, (all, ns, u) => { if (ns) return all; fonts++; return `<link rel="preload" as="style" href="${u}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${u}"></noscript>`; });
  if (f === 'index.html') { const a = h.indexOf('<script src="search-engine.js"></script>'), b = h.lastIndexOf('<script src="search-engine.js"></script>'); if (a >= 0 && b > a) { h = h.slice(0, a) + h.slice(a + '<script src="search-engine.js"></script>'.length); dup++; } }
  if (h !== o) { fs.writeFileSync(p, h); touched++; }
}
console.log(`perf fixes: ${touched} files, ${lazy} images lazy-loaded, ${fonts} font stylesheets made non-blocking, ${dup} duplicate script removed`);
