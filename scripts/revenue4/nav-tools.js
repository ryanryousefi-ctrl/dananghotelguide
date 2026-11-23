#!/usr/bin/env node
// Adds "Stay Planner" and "Compare & Saved" to the Hotels menu (desktop dropdown + mobile menu) on pages using the standard header. Idempotent.
'use strict';
const fs = require('fs'), path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const D_OLD = '<li><a href="da-nang-hotel-directory.html">Hotel Directory</a></li></ul>', D_NEW = '<li><a href="da-nang-hotel-directory.html">Hotel Directory</a></li><li><a href="find-your-hotel.html">Stay Planner</a></li><li><a href="compare-hotels.html" data-dn-saved-nav>Compare &amp; Saved</a></li></ul>';
const M_OLD = '<a href="da-nang-hotel-directory.html">Hotel Directory</a></div></details>', M_NEW = '<a href="da-nang-hotel-directory.html">Hotel Directory</a><a href="find-your-hotel.html">Stay Planner</a><a href="compare-hotels.html" data-dn-saved-nav>Compare &amp; Saved</a></div></details>';
let n = 0; for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) { const p = path.join(ROOT, f); const o = fs.readFileSync(p, 'utf8');
  let h = o.includes('data-dn-saved-nav') ? o : o.split(D_OLD).join(D_NEW).split(M_OLD).join(M_NEW);
  // the saved count needs the (3 KB, deferred, load-once) shortlist script on every page that shows the menu entry
  if (h.includes('data-dn-saved-nav') && !/dn-shortlist\.js/.test(h)) h = h.replace(/(<script src="tripcom-cta\.js"[^>]*><\/script>)/, '$1\n<script src="dn-shortlist.js" defer></script>');
  if (h !== o) { fs.writeFileSync(p, h); n++; } }
console.log('nav tools added on', n, 'pages');
