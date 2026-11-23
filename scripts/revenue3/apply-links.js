#!/usr/bin/env node
// Contextual internal links from existing pages to the Phase 3 guides/tools (text links, marker <!--dn-c3:links-->, idempotent).
'use strict';
const fs = require('fs'), path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const L = { glance: ['da-nang-hotels-at-a-glance.html', 'Da Nang hotels at a glance'], car: ['da-nang-hotels-without-a-car.html', 'Hotels for travellers without a car'], how: ['how-to-check-da-nang-hotel-prices.html', 'How to check hotel prices for your dates'], three: ['da-nang-hotels-for-three-nights.html', 'Hotels for a three-night stay'], cmp: ['compare-hotels.html', 'Compare hotels side by side'], find: ['find-your-hotel.html', 'Hotel finder'], vinpearl: ['vinpearl-luxury-da-nang.html', 'Vinpearl Luxury Da Nang'], ru: ['da-nang-guide-for-russian-travelers.html', 'Da Nang guide for Russian travellers'], tax: ['da-nang-hotel-taxes-service-charge.html', 'Hotel taxes and service charges'], worth: ['is-a-luxury-resort-in-da-nang-worth-it.html', 'Is a luxury resort worth it?'] };
const MAP = { 'luxury-hotels-da-nang.html': ['vinpearl', 'worth'], 'da-nang-hotel-prices.html': ['tax', 'how'], 'da-nang-hotel-prices-by-month.html': ['how', 'cmp', 'tax'],  'where-to-stay-in-da-nang.html': ['glance', 'car', 'how', 'three'], 'hotel-reviews.html': ['glance', 'cmp', 'find'], 'guides.html': ['glance', 'car', 'how', 'three', 'tax', 'ru'], 'best-hotels-in-da-nang.html': ['glance', 'three', 'cmp'], 'da-nang-3-day-itinerary.html': ['three', 'how'], 'da-nang-5-day-itinerary.html': ['how', 'cmp'], 'is-da-nang-walkable.html': ['car', 'glance'], 'da-nang-grab-guide.html': ['car'], 'da-nang-transport-guide.html': ['car'], 'da-nang-airport-guide.html': ['car', 'how'], 'da-nang-hotels-executive-lounge.html': ['glance', 'cmp'], 'beachfront-vs-city-hotels-da-nang.html': ['glance', 'car'], 'best-time-to-visit-da-nang.html': ['how'], 'da-nang-first-time-travel-guide.html': ['how', 'three'], 'da-nang-first-time-visitors.html': ['how', 'car'] };
let n = 0;
for (const [f, keys] of Object.entries(MAP)) {
  const p = path.join(ROOT, f); if (!fs.existsSync(p)) continue; let h = fs.readFileSync(p, 'utf8');
  h = h.replace(/\n*<!--dn-c3:links-->[\s\S]*?<!--\/dn-c3:links-->\n?/, '\n');
  const block = `<!--dn-c3:links--><section class="dnc dnc-sec" aria-label="Related planning tools"><div class="dnc-wrap"><p class="dnc-note"><strong>Related planning:</strong> ${keys.map(k => `<a href="${L[k][0]}">${L[k][1]}</a>`).join(' · ')}</p></div></section><!--/dn-c3:links-->`;
  const i = h.search(/<!--dn-revenue:(guide|related)-->/); const at = i >= 0 ? i : h.lastIndexOf('</main>'); if (at < 0) { console.log('skip', f); continue; }
  h = h.slice(0, at) + block + '\n' + h.slice(at);
  if (!/dn-commerce\.css/.test(h)) h = h.replace(/(<link rel="stylesheet" href="tripcom-cta\.css">)/, '$1\n<link rel="stylesheet" href="dn-commerce.css">');
  fs.writeFileSync(p, h); n++;
}
console.log('link blocks:', n);
