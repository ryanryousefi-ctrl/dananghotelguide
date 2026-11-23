#!/usr/bin/env node
// End-of-guide "compare hotels" modules for informational pages with real accommodation intent (explicit page list, hand-written copy).
// Buttons use the verified registry search destinations (Da Nang / Hoi An) copied verbatim from data/tripcom/registry.json; nothing is generated.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'); const CHECK = process.argv.includes('--check');
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/registry.json'), 'utf8')).entries;
const DEST = {
  danang: { e: reg.find(e => e.key === 'search:Da Nang Municipality, Vietnam|6232|region'), label: 'Compare Da Nang Hotel Prices' },
  hoian: { e: reg.find(e => e.key === 'search:Hoi An, Vietnam|-3723930|city'), label: 'Compare Hoi An Hotel Prices' },
};
for (const d of Object.values(DEST)) if (!d.e || d.e.status !== 'VERIFIED' || !d.e.affiliate_url) throw new Error('registry destination missing or unverified');
const L = {
  best: ['best-hotels-in-da-nang.html', 'Best hotels in Da Nang'], stay: ['where-to-stay-in-da-nang.html', 'Where to stay in Da Nang'], beach: ['best-hotels-near-my-khe-beach.html', 'Hotels near My Khe Beach'],
  family: ['family-hotels-da-nang.html', 'Family hotels in Da Nang'], budget: ['best-budget-hotels-in-da-nang.html', 'Budget hotels in Da Nang'], hoibest: ['best-hotels-in-hoi-an.html', 'Best hotels in Hoi An'], hoistay: ['where-to-stay-in-hoi-an.html', 'Where to stay in Hoi An'],
  vs: ['da-nang-vs-hoi-an.html', 'Da Nang or Hoi An: where to stay'], river: ['da-nang-riverfront-hotels.html', 'Han River hotels'], luxury: ['best-luxury-resort-couples-da-nang.html', 'Luxury resorts for couples'], dir: ['da-nang-hotel-directory.html', 'Hotel directory'], boutique: ['boutique-hotels-da-nang.html', 'Boutique hotels'], thuong: ['best-hotels-an-thuong-da-nang.html', 'Hotels in An Thuong'], oldtown: ['hoi-an-old-town-hotels.html', 'Hoi An Old Town hotels'],
};
// page -> [heading, text, [destinations], [link keys]]
const PAGES = {
  'best-time-to-visit-da-nang.html': ['Booking around the season', 'Weather and prices shift through the year. Once you have your dates, compare what is available and read where to stay.', ['danang'], ['stay', 'best', 'beach']],
  'rainy-season-da-nang-guide.html': ['Choosing a hotel for the rainy season', 'In wet weather the pool, spa and indoor options matter more than the view. Compare hotels for your dates and pick with that in mind.', ['danang'], ['best', 'stay', 'luxury']],
  'da-nang-airport-to-hoi-an.html': ['Choosing between a Da Nang and a Hoi An base', 'Your arrival day is easier if the hotel is already decided. Check both bases for your dates.', ['danang', 'hoian'], ['vs', 'hoistay', 'stay']],
  'da-nang-airport-to-my-khe.html': ['Booking near My Khe Beach', 'A beachfront or near-beach hotel shortens the ride from the airport. Compare options for your dates.', ['danang'], ['beach', 'stay', 'best']],
  'da-nang-budget-guide.html': ['Finding a good-value hotel', 'Where you stay sets most of the budget. Compare current rates for your dates before settling on an area.', ['danang'], ['budget', 'stay', 'beach']],
  'da-nang-travel-budget-guide.html': ['Finding a good-value hotel', 'Accommodation is usually the biggest line in a Da Nang budget. Compare current rates for your dates.', ['danang'], ['budget', 'stay', 'best']],
  'da-nang-first-time-travel-guide.html': ['Ready to choose where to stay?', 'First-timers do best by deciding the area first, then the hotel. Compare options for your dates.', ['danang'], ['stay', 'best', 'beach']],
  'da-nang-first-time-visitors.html': ['Ready to choose where to stay?', 'Pick the area first (beach, river or Old Quarter side), then compare hotels for your dates.', ['danang'], ['stay', 'best', 'vs']],
  'hoi-an-first-time-visitors.html': ['Choosing where to stay in Hoi An', 'Old Town charm, rice-field quiet or an An Bang beach base: decide the area, then compare hotels for your dates.', ['hoian'], ['hoistay', 'hoibest', 'oldtown']],
  'da-nang-itinerary.html': ['Pick a base for this itinerary', 'A central base saves hours on a multi-day plan. Compare hotels for your travel dates.', ['danang'], ['stay', 'best', 'river']],
  'how-many-days-in-da-nang.html': ['Once you know how many nights', 'Choose the area that fits your plan, then compare hotels for those nights.', ['danang'], ['stay', 'vs', 'best']],
  'is-da-nang-walkable.html': ['Where walkability matters most', 'If you want to walk to dinner and the river, stay central; for the beach, stay near My Khe. Compare hotels for your dates.', ['danang'], ['river', 'beach', 'stay']],
  'da-nang-with-kids-guide.html': ['Hotels that work for families', 'Pools, kids’ facilities and room layouts differ a lot. Read our family picks, then compare for your dates.', ['danang'], ['family', 'best', 'beach']],
  'dragon-bridge-da-nang.html': ['Staying near the Dragon Bridge', 'The riverfront puts the bridge, the night market and the weekend fire show within a short walk. Compare Han River hotels for your dates.', ['danang'], ['river', 'stay', 'best']],
  'things-to-do-in-da-nang.html': ['Choose a base for what you want to do', 'Beach days, city sights and day trips each favour a different area. Compare hotels for your dates.', ['danang'], ['stay', 'best', 'beach']],
  'what-to-pack-for-da-nang.html': ['Planning the trip?', 'With your dates fixed, check hotel availability and rates.', ['danang'], ['stay', 'best', 'family']],
  'da-nang-transport-guide.html': ['Pick a base that suits how you get around', 'Hotels near the river and the beach are easiest to reach; compare options for your dates.', ['danang'], ['stay', 'river', 'beach']],
  'da-nang-nightlife-guide.html': ['Staying close to the nightlife', 'The riverfront and city centre are the easiest bases for evenings out. Compare hotels for your dates.', ['danang'], ['river', 'stay', 'best']],
  'da-nang-travel-mistakes.html': ['Avoid a wrong-area booking', 'Picking the wrong part of the city is the most common mistake. Read where to stay, then compare hotels for your dates.', ['danang'], ['stay', 'beach', 'best']],
  'da-nang-tourist-mistakes.html': ['Avoid a wrong-area booking', 'Where you stay changes the whole trip. Read where to stay, then compare hotels for your dates.', ['danang'], ['stay', 'beach', 'best']],
  'an-bang-beach-hotels.html': ['Compare An Bang and Hoi An hotels', 'Check what is available for your dates and read the Hoi An area guide first.', ['hoian'], ['hoistay', 'hoibest', 'vs']],
  'is-hoi-an-cheaper-than-da-nang.html': ['Compare the actual prices for your dates', 'Hotel rates swing by season and area, so check both destinations for the dates you plan to travel.', ['danang', 'hoian'], ['vs', 'budget', 'hoibest']],
  'where-to-stay-in-hoi-an.html': ['Ready to compare Hoi An hotels?', 'You have the areas. Now check current rates and availability for your dates.', ['hoian'], ['hoibest', 'oldtown', 'vs']],
};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const btn = (d, pageLoc) => { const x = DEST[d], href = x.e.affiliate_url.replace(/&/g, '&amp;'); return `<a data-provider="tripcom" data-tc-key="${esc(x.e.key)}" aria-label="${x.label} on Trip.com, opens in a new tab" class="dn-booklink affiliate-link dn-btn dn-btn--book tc-btn tc-btn--solid" href="${href}" target="_blank" rel="nofollow noopener sponsored" data-cta-location="${pageLoc}"><span class="tc-btn__text">${x.label} &rarr;</span></a>`; };
let changed = 0; const miss = [];
for (const [f, [h, t, dests, keys]] of Object.entries(PAGES)) {
  const p = path.join(ROOT, f); if (!fs.existsSync(p)) { miss.push(f); continue; } let html = fs.readFileSync(p, 'utf8');
  if (/<!--dn-revenue:guide-->/.test(html)) continue;
  const i = html.lastIndexOf('</main>'); if (i < 0) { miss.push(f + ' (no </main>)'); continue; }
  const links = keys.map(k => L[k]).filter(l => l && l[0] !== f && fs.existsSync(path.join(ROOT, l[0]))).slice(0, 3).map(l => `<a href="${l[0]}">${esc(l[1])}</a>`).join('');
  const mod = `<!--dn-revenue:guide--><section class="dn-decide dn-decide--guide" aria-labelledby="dnd-${path.basename(f, '.html').slice(0, 24)}"><div class="dn-decide__wrap"><p class="dn-decide__kicker" id="dnd-${path.basename(f, '.html').slice(0, 24)}">${esc(h)}</p><p class="dn-decide__text">${esc(t)}</p><div class="dn-decide__row">${dests.map(d => btn(d, 'guide_end')).join('')}</div>${links ? `<p class="dn-decide__links">Read first: ${links}</p>` : ''}<p class="dn-decide__note">Prices and availability are shown on Trip.com for your dates. We may earn a commission if you book, at no extra cost to you.</p></div></section><!--/dn-revenue:guide-->\n`;
  html = html.slice(0, i) + mod + html.slice(i); changed++; if (!CHECK) fs.writeFileSync(p, html);
}
console.log(`guide modules: ${changed} pages${CHECK ? ' (dry run)' : ''}${miss.length ? ' | missing: ' + miss.join(', ') : ''}`);
