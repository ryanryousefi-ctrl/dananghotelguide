#!/usr/bin/env node
// Installs the Trip.com dynamic banner experiment on best-hotels-in-da-nang.html (idempotent; re-run after any page rebuild).
//   node scripts/experiments/install-trip-banner.js [--remove]
// One banner (728x90, shown on wide screens only), one page, between the two signature picks and the quick-picks grid. The embed code comes from data/tripcom/dynamic-banner.json.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const B = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/dynamic-banner.json'), 'utf8'));
if (crypto.createHash('sha256').update(B.embed_code).digest('hex') !== B.sha256) { console.error('dynamic-banner.json was modified (checksum mismatch)'); process.exit(2); }
const f = path.join(ROOT, B.page); let s = fs.readFileSync(f, 'utf8');
const BLOCK = /\n?<!-- TRIP\.COM DYNAMIC BANNER EXPERIMENT -->[\s\S]*?<!-- \/TRIP\.COM DYNAMIC BANNER EXPERIMENT -->\n?/;
s = s.replace(BLOCK, '\n').replace(/<script src="dn-banner\.js" defer><\/script>\n?/, '');
if (!process.argv.includes('--remove')) {
  const html = `<!-- TRIP.COM DYNAMIC BANNER EXPERIMENT -->
<aside class="dn-adband" aria-label="Advertisement">
  <p class="dn-adband__label">Advertisement &middot; Trip.com affiliate offer</p>
  <div class="dn-adbox" data-banner="${B.banner_id}"><div class="dn-adbox__ph"><p class="dn-adbox__t">Hotel offers on Trip.com</p><p class="dn-adbox__n">Loads a Trip.com banner; Trip.com may set cookies.</p><button type="button" class="dn-adbox__go">Show hotel offers</button></div><template>${B.embed_code}</template></div>
  <p class="dn-adband__note">Paid placement: we may earn a commission if you book through Trip.com. It never changes how we rank hotels.</p>
</aside>
<!-- /TRIP.COM DYNAMIC BANNER EXPERIMENT -->
`;
  if (!s.includes('<!-- QUICK PICKS GRID -->')) { console.error('placement anchor not found'); process.exit(2); }
  s = s.replace('<!-- QUICK PICKS GRID -->', html + '\n<!-- QUICK PICKS GRID -->').replace(/<script src="dn\.js" defer><\/script>/, '<script src="dn.js" defer></script>\n<script src="dn-banner.js" defer></script>');
}
fs.writeFileSync(f, s); console.log(process.argv.includes('--remove') ? 'removed' : 'installed', B.page);
