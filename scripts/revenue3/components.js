'use strict';
// Central commercial component library (Phase 3). Pure functions -> static HTML strings. Every Trip.com anchor is built from
// data/tripcom/registry.json (VERIFIED entries only); nothing here creates or edits an affiliate URL.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/registry.json'), 'utf8')).entries;
const FACTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/facts.json'), 'utf8')).hotels;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const byKey = k => { const e = reg.find(r => r.key === k); if (!e || e.status !== 'VERIFIED' || !e.affiliate_url) throw new Error('unverified registry key: ' + k); return e; };
const DEST = { danang: byKey('search:Da Nang Municipality, Vietnam|6232|region'), hoian: byKey('search:Hoi An, Vietnam|-3723930|city') };
const DEST_NAME = { danang: 'Da Nang', hoian: 'Hoi An' };

// Approved CTA wording only (see docs/revenue/PHASE3.md "language policy").
function tc(entry, label, loc, o = {}) {
  const cls = ['dn-booklink', 'affiliate-link', 'dn-btn', 'dn-btn--book', 'tc-btn', o.ghost ? '' : 'tc-btn--solid', o.lg ? 'tc-btn--lg' : '', o.block ? 'tc-btn--block' : ''].filter(Boolean).join(' ');
  const hotel = o.hotel ? ` data-hotel="${esc(o.hotel)}"` : '';
  return `<a data-provider="tripcom" data-tc-key="${esc(entry.key)}" aria-label="${esc(label)} on Trip.com, opens in a new tab" class="${cls}" href="${entry.affiliate_url.replace(/&/g, '&amp;')}" target="_blank" rel="nofollow noopener sponsored" data-cta-location="${esc(loc)}"${hotel}><span class="tc-btn__text">${esc(label)} &rarr;</span></a>`;
}
const hotel = slug => { const h = FACTS[slug]; if (!h) throw new Error('unknown hotel ' + slug); return h; };
const hotelEntry = h => byKey(h.tripcom_key);
const shortName = n => n.replace(/^(Danang|Da Nang)\s+/i, '').replace(/ (Da Nang|Danang).*$/i, m => m).trim();
const hotelLabel = name => name.length <= 28 ? `Check ${name} Prices` : 'Check Room Prices';
const hotelBtn = (slug, loc, o = {}) => { const h = hotel(slug); return tc(hotelEntry(h), o.label || hotelLabel(h.name), loc, Object.assign({ hotel: h.name }, o)); };
const destBtn = (d, loc, o = {}) => tc(DEST[d], o.label || `Compare ${DEST_NAME[d]} Hotel Prices`, loc, o);
const uid = (() => { let n = 0; return p => `${p}${++n}`; })();

// Facts rendering: objective facts only from research (sourced). Unknown -> "Not verified".
const AREA_LABEL = { 'my-khe': 'My Khe Beach', 'han-river': 'Han River / city centre', 'son-tra': 'Son Tra Peninsula', 'non-nuoc': 'Non Nuoc Beach', 'an-thuong': 'An Thuong' };
function area(h) { return h.area_label || null; }
function beach(h) { const r = h.research; if (!r || !r.beach_access || r.beach_access === 'not_verified') return null; return { beachfront: 'Beachfront', short_walk: 'Short walk to the beach', not_beach: 'Not a beach hotel' }[r.beach_access] || null; }

// ---- A: hero price-check module -------------------------------------------------------------
function heroPrice(o) {
  const d = o.dest || 'danang';
  return `<!--dn-c3:hero--><section class="dnc dnc-hero${o.light ? ' dnc-hero--light' : ''}" aria-labelledby="${o.id || 'dnc-hero-h'}"><div class="dnc-wrap">
<p class="dnc-kicker">${esc(o.kicker || 'Planning a trip?')}</p><h2 class="dnc-h" id="${o.id || 'dnc-hero-h'}">${esc(o.title || `Planning a trip to ${DEST_NAME[d]}?`)}</h2>
<p class="dnc-sub">${esc(o.copy || `Compare hotel options and check available room rates for your actual travel dates.`)}</p>
<div class="dnc-actions">${destBtn(d, o.loc || 'p3-hero', { lg: true, label: o.label })}${o.secondary === false ? '' : `<a class="dnc-ghost" href="${o.secondaryHref || 'find-your-hotel.html'}">${esc(o.secondaryLabel || 'Find My Ideal Hotel')}</a>`}</div>
<p class="dnc-note">${esc(o.note || 'Trip.com is an affiliate partner. We may earn a commission if you book, at no extra cost to you. Prices and availability are shown on Trip.com, not on this site.')}</p></div></section>`;
}

// ---- B: hotel price card ---------------------------------------------------------------------
function priceCard(slug, o = {}) {
  const h = hotel(slug), ed = h.editorial, loc = o.loc || 'p3-card';
  const meta = [area(h), beach(h)].filter(Boolean).join(' · ');
  return `<article class="dnc-card" data-dn-hotel="${esc(slug)}">${h.image ? `<img class="dnc-card__img" src="${esc(h.image)}" alt="${esc(h.name)}" loading="lazy" decoding="async" width="600" height="400">` : ''}
<div class="dnc-card__b"><h3>${esc(h.name)}</h3>${meta ? `<p class="dnc-meta">${esc(meta)}</p>` : ''}
<p><span class="dnc-lab">Best for</span>${esc(ed.bestFor)}</p><p><span class="dnc-lab">Why choose it</span>${esc(ed.why)}</p><p><span class="dnc-lab">Consider another hotel if</span>${esc(ed.drawback)}</p>
<div class="dnc-card__f">${hotelBtn(slug, loc, { block: true })}<div class="dnc-card__links"><a href="${esc(h.review)}">Read our review</a><button type="button" class="dnc-save" data-dn-save="${esc(slug)}" aria-pressed="false">Save</button><a href="compare-hotels.html?h=${esc(slug)}" data-dn-compare-link>Compare</a></div></div></div></article>`;
}
const cards = (slugs, o) => `<div class="dnc-cards">${slugs.map(s => priceCard(s, o)).join('')}</div>`;

// ---- C: compare module (two hotels) ----------------------------------------------------------
function diffLine(a, b) {
  const A = hotel(a), B = hotel(b), bits = [];
  if (A.setting !== B.setting) bits.push(`${A.name} is the ${A.setting === 'beach' ? 'beach' : 'city'} option and ${B.name} the ${B.setting === 'beach' ? 'beach' : 'city'} option.`);
  const aa = area(A), ab = area(B); if (aa && ab && aa !== ab) bits.push(`Area: ${aa} versus ${ab}.`);
  if (!bits.length) bits.push('Both are similar in setting and style; compare the trade-offs above against the rates for your dates.');
  return bits.join(' ');
}
function compareModule(a, b, o = {}) {
  const loc = o.loc || 'p3-compare', A = hotel(a), B = hotel(b), id = uid('dnc-cmp');
  const col = (s, h) => `<div class="dnc-cmp__col"><h3>${esc(h.name)}</h3><p><span class="dnc-lab">Best for</span>${esc(h.editorial.bestFor)}</p><p><span class="dnc-lab">Consider another hotel if</span>${esc(h.editorial.drawback)}</p>${hotelBtn(s, loc, { block: true })}</div>`;
  return `<!--dn-c3:compare--><section class="dnc dnc-sec" aria-labelledby="${id}"><div class="dnc-wrap"><div class="dnc-cmp"><p class="dnc-kicker">Compare two hotels</p><h2 class="dnc-h" id="${id}">Compare these hotels for your dates</h2>
<p class="dnc-sub">${esc(o.sub || 'The right choice can depend on the price difference for your dates.')} ${esc(diffLine(a, b))}</p><div class="dnc-cmp__grid">${col(a, A)}${col(b, B)}</div>
<p class="dnc-note"><a href="compare-hotels.html?h=${esc(a)},${esc(b)}">Open the side-by-side comparison tool</a>. Rates are shown on Trip.com.</p></div></div></section>`;
}

// ---- D: editor's booking verdict ---------------------------------------------------------------
function verdict(slug, o = {}) {
  const h = hotel(slug), ed = h.editorial, id = uid('dnc-v');
  return `<!--dn-c3:verdict--><section class="dnc dnc-sec" aria-labelledby="${id}"><div class="dnc-wrap"><div class="dnc-verdict"><p class="dnc-kicker">Editor's verdict</p><h2 class="dnc-h" id="${id}">Is ${esc(h.name)} right for you?</h2>
<dl><dt>Best for</dt><dd>${esc(ed.bestFor)}</dd><dt>Why choose it</dt><dd>${esc(ed.why)}</dd><dt>Consider another hotel if</dt><dd>${esc(ed.drawback)}</dd></dl>
<div class="dnc-actions">${hotelBtn(slug, o.loc || 'p3-verdict', { label: h.name.length <= 24 ? `Check ${h.name} Rooms & Rates` : 'Check Rooms & Rates' })}</div>
<p class="dnc-note">Our verdict is editorial opinion. Room availability and rates are shown on Trip.com.</p></div></div></section>`;
}

// ---- E: booking band --------------------------------------------------------------------------
function band(o) {
  const id = uid('dnc-b');
  return `<!--dn-c3:band--><section class="dnc dnc-sec" aria-labelledby="${id}"><div class="dnc-wrap"><div class="dnc-band"><div class="dnc-band__t"><h2 class="dnc-h" id="${id}">${esc(o.title)}</h2><p>${esc(o.copy)}</p></div><div class="dnc-band__a">${o.button}${o.link ? `<a class="dnc-ghost" href="${esc(o.link[0])}">${esc(o.link[1])}</a>` : ''}</div></div></div></section>`;
}
// ---- F: travel-dates reminder -------------------------------------------------------------------
function datesReminder(d = 'danang', loc = 'p3-dates') {
  return band({ title: 'Your dates change the price', copy: 'Hotel rates can vary by season, weekday, room category and demand. Check the available options for your travel dates before deciding.', button: destBtn(d, loc, { label: 'Check Prices for Your Dates' }) });
}
// ---- G: return later / bookmark -------------------------------------------------------------------
function returnModule(d = 'danang') {
  const id = uid('dnc-r');
  return `<!--dn-c3:return--><section class="dnc dnc-sec" aria-labelledby="${id}"><div class="dnc-wrap"><div class="dnc-band"><div class="dnc-band__t"><h2 class="dnc-h" id="${id}">Still planning your trip?</h2>
<p>Save this guide so you can return when your travel dates are clearer, then compare our hotel recommendations again and check rates on Trip.com. Your shortlist stays in this browser only; we do not track prices or send alerts.</p></div>
<div class="dnc-band__a"><button type="button" class="dnc-ghost" data-dn-copylink>Copy Link to This Guide</button><a class="dnc-ghost" href="compare-hotels.html">My Shortlist &amp; Compare</a>${destBtn(d, 'p3-return', { label: 'Compare Hotel Prices' })}</div></div></div></section>`;
}
// ---- H: seasonal booking advice -----------------------------------------------------------------
function seasonal(d = 'danang') {
  const id = uid('dnc-s');
  return `<!--dn-c3:seasonal--><section class="dnc dnc-sec" aria-labelledby="${id}"><div class="dnc-wrap"><p class="dnc-kicker">Planning</p><h2 class="dnc-h" id="${id}">When should you book your Da Nang hotel?</h2>
<p class="dnc-sub">There is no single best day to book. What matters is which demand pattern your dates fall into. These patterns come from our own <a href="da-nang-hotel-prices-by-month.html">monthly price index</a> and <a href="best-time-to-visit-da-nang.html">best-time guide</a>; they describe typical seasons, not current rates.</p>
<div class="dnc-season"><div><h3>Summer beach season (about May to August)</h3><p>Vietnamese domestic demand peaks and beachfront resorts are busiest. Decide earlier if you need a specific resort or room type.</p></div>
<div><h3>Tet (late January to mid-February)</h3><p>Our index shows the highest rates of the year around Lunar New Year. Check <a href="da-nang-tet-2027-hotels.html">Tet hotel advice</a> and compare early if you are travelling then.</p></div>
<div><h3>Rainy season (about September to November)</h3><p>Rain and typhoon risk are highest in October and November and rates are typically lower. Choose hotels with good indoor options and keep plans flexible.</p></div>
<div><h3>Resort or city hotel?</h3><p>Resort stays depend on pools, beach and room type, so compare room categories. City hotels are easier to swap if plans change.</p></div></div>
<p class="dnc-sub">Because rates depend on dates, room type and demand, the only reliable way to know the price for your trip is to check your actual dates.</p>
<div class="dnc-actions">${destBtn(d, 'p3-seasonal', { label: 'Check Prices for Your Dates' })}</div></div></section>`;
}

module.exports = { esc, tc, DEST, DEST_NAME, FACTS, hotel, hotelBtn, destBtn, heroPrice, priceCard, cards, compareModule, verdict, band, datesReminder, returnModule, seasonal, area, beach, diffLine, hotelEntry, AREA_LABEL };
