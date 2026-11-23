'use strict';
// Shared verified-facts table for Phase 4 pages (facts.json + routes.json + curated.js; all sourced in data/hotels/research2).
const fs = require('fs'), path = require('path'); const C = require('../revenue3/components'); const CU = require('./curated');
const ROOT = path.resolve(__dirname, '..', '..'); const F = C.FACTS, esc = C.esc, NV = CU.NV;
const RT = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/routes.json'), 'utf8')).hotels;
const road = (s, k) => { const x = ((RT[s] || {}).distances || {})[k]; return x && x.driving ? `about ${Math.max(1, x.driving.minutes)} min (${x.driving.km} km)` : NV; };
const toMkt = s => { const x = ((RT[s] || {}).distances || {}).han_market; if (!x) return NV; return x.walking && x.walking.minutes <= 25 ? `about ${x.walking.minutes} min walk` : x.driving ? `about ${Math.max(1, x.driving.minutes)} min by road` : NV; };
const cell = v => (v === NV || !v ? '<span class="nv">Not verified</span>' : esc(v));
const COLS = {
  area: ['Area', s => F[s].area_label], beach: ['Beach access', s => F[s].display.beach], pools: ['Pools', s => F[s].display.pools], kids: ["Children's facilities", s => CU.family[s][1]],
  rooms: ['Family rooms / multi-bedroom', s => CU.family[s][0]], lounge: ['Club lounge', s => CU.lounge[s] || F[s].display.lounge], airport: ['Airport by road', s => road(s, 'airport')],
  market: ['Han Market', s => toMkt(s)], hoian: ['Hoi An Old Town by road', s => road(s, 'hoi_an_old_town')], best: ['Best for (our view)', s => F[s].editorial.bestFor],
};
function table(id, title, intro, slugs, cols, loc) {
  const head = cols.map(c => `<th scope="col">${esc(COLS[c][0])}</th>`).join('');
  const rows = slugs.map(s => `<tr><th scope="row" style="width:auto"><a href="${F[s].review}">${esc(C.nm(F[s]))}</a></th>${cols.map(c => `<td>${cell(COLS[c][1](s))}</td>`).join('')}<td>${C.hotelBtn(s, loc, { compact: true, label: 'Check Prices' })}</td></tr>`).join('');
  return `<section class="dnc dnc-sec" aria-labelledby="${id}"><div class="dnc-wrap"><p class="dnc-kicker">Verified facts</p><h2 class="dnc-h" id="${id}">${esc(title)}</h2><p class="dnc-sub" style="max-width:70ch">${intro}</p>
<div class="dnc-table"><table style="min-width:${260 + cols.length * 150}px"><thead><tr><th scope="col">Hotel</th>${head}<th scope="col">Rates</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="dnc-note">Facts come from official hotel pages where reachable and booking listings otherwise, checked 23 November 2026; road and walking times are routing estimates without traffic. "Best for" is our opinion. Rates and availability are on Trip.com. <a href="compare-hotels.html?h=${slugs.slice(0, 3).join(',')}">Compare any of these side by side</a>.</p></div></section>`;
}
module.exports = { table, COLS, road, toMkt };
