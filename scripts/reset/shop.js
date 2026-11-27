'use strict';
// Operation Revenue Reset: the one shopping component set (hotel card, recommendation grid, area card, category tile, disclosure, booking bar).
// Every fact comes from data/hotels/facts.json (sourced research); every Trip.com URL comes from the verified registry via revenue3/components.js.
// Unknown facts are omitted, never guessed. No prices, scores, discounts or availability are generated.
const C = require('../revenue3/components');
const { esc, FACTS, nm, hotelBtn, destBtn } = C;

// Photos for hotels whose facts record has none (checked by eye: the photo shows that property). Others stay without a photo.
const IMG = { 'hilton-da-nang': 'images/review-hilton-da-nang-exterior.jpg', 'muong-thanh-luxury-da-nang': 'images/review-muong-thanh-luxury-da-nang-exterior.jpg' };
const img = s => FACTS[s].image || IMG[s] || null;

// Editorial ranking used for "top picks": the published order of best-hotels-in-da-nang.html (our own ranking), then the rest A-Z.
const RANK = ['intercontinental-da-nang', 'sheraton-grand-da-nang', 'hyatt-regency-da-nang', 'tia-wellness-resort-da-nang', 'premier-village-da-nang', 'tms-hotel-da-nang', 'marriott-resort-da-nang', 'pullman-da-nang', 'furama-resort-da-nang', 'wyndham-soleil-da-nang', 'a-la-carte-da-nang', 'novotel-da-nang-han-river', 'radisson-blu-da-nang'];
const ranked = () => RANK.concat(Object.keys(FACTS).filter(s => !RANK.includes(s)).sort());

const yes = v => typeof v === 'string' && /^yes/i.test(v);
function amenities(s) {
  const h = FACTS[s], d = h.display || {}, r = h.research || {}, a = [];
  if (/infinity/i.test(d.pools || '')) a.push('infinity');
  if (h.style === 'villa' || /private pool/i.test(d.pools || '')) a.push('villa');
  if (yes(d.kids_club)) a.push('kids');
  if (yes(d.lounge)) a.push('lounge');
  if (r.beach_access && r.beach_access.value === 'beachfront') a.push('beachfront');
  return a;
}
const BEACH = { beachfront: 'Beachfront', short_walk: 'Short walk to the beach', not_beach: 'City, not on the beach' };
const BUDGET = { luxury: 'Luxury', upscale: 'Upscale', value: 'Value' };
const beachLabel = s => { const b = (FACTS[s].research || {}).beach_access; return b ? BEACH[b.value] || null : null; };

// The main commercial unit. One primary booking action (hotel-specific registry URL), one editorial link, Save, Compare.
function card(s, o = {}) {
  const h = FACTS[s], ed = h.editorial, area = h.area_label && h.area_label !== 'Not verified' ? h.area_label : null;
  const meta = [area, beachLabel(s)].filter(Boolean).join(' · ');
  const im = img(s);
  const data = `data-shop-card data-setting="${h.setting}" data-budget="${h.budget}" data-aud="${(h.audience || []).join(' ')}" data-amen="${amenities(s).join(' ')}"`;
  return `<article class="sc${o.hidden ? ' sc--more' : ''}${o.compact ? ' sc--compact' : ''}" data-dn-hotel="${esc(s)}" ${data}>
<a class="sc__media" href="${esc(h.review)}" tabindex="-1" aria-hidden="true">${im ? `<img src="${esc(im)}" alt="" loading="lazy" decoding="async" width="600" height="400">` : `<span class="sc__ph">${esc(nm(h))}</span>`}${o.badge ? `<span class="sc__badge">${esc(o.badge)}</span>` : ''}</a>
<div class="sc__body"><p class="sc__tier">${esc(BUDGET[h.budget] || '')}${h.style ? ' ' + esc(h.style === 'villa' ? 'villas' : h.style) : ''}</p>
<h3 class="sc__name"><a href="${esc(h.review)}">${esc(nm(h))}</a></h3>${meta ? `<p class="sc__meta">${esc(meta)}</p>` : ''}
${o.compact ? `<p class="sc__why">Best for: ${esc(ed.bestFor)}</p>` : `<p class="sc__why">${esc(ed.why)}</p>
<dl class="sc__facts"><div><dt>Best for</dt><dd>${esc(ed.bestFor)}</dd></div><div><dt>Drawback</dt><dd>${esc(ed.drawback)}</dd></div></dl>`}
<div class="sc__cta">${hotelBtn(s, o.loc || 'rr-card', { block: true, label: 'Check Room Prices' })}</div>
<p class="sc__links"><a href="${esc(h.review)}">Read our review</a><button type="button" class="dnc-save sc__save" data-dn-save="${esc(s)}" aria-pressed="false">Save</button><a href="compare-hotels.html?h=${esc(s)}" data-dn-compare-link>Compare</a></p></div></article>`;
}
const grid = (slugs, o = {}) => `<div class="sc-grid${o.cols ? ' sc-grid--' + o.cols : ''}">${slugs.map((s, i) => card(s, Object.assign({}, o, { badge: o.badges ? o.badges[i] : null, hidden: o.limit != null && i >= o.limit }))).join('\n')}</div>`;

// Traveler-type picks. Each badge states which published ranking it comes from.
const PICKS = [
  ['intercontinental-da-nang', 'Best luxury resort', 'Editor’s top pick in our Best Hotels and Luxury guides'],
  ['hyatt-regency-da-nang', 'Best family resort', 'Top pick in our Best Family Resort guide'],
  ['sheraton-grand-da-nang', 'Best all-rounder', 'Signature pick in our Best Hotels guide'],
  ['a-la-carte-da-nang', 'Best value by the beach', 'Top pick in our Beach Hotels Under $100 guide'],
  ['naman-retreat-da-nang', 'Private pool villas', 'Recommended in our Private Pool Villa guide'],
  ['novotel-da-nang-han-river', 'City hotel pick', 'Recommended in our Han River Hotels guide']
];
function picks(loc) {
  return `<div class="sc-grid sc-grid--3">${PICKS.map(([s, b, src]) => card(s, { badge: b, loc, compact: true }).replace('<p class="sc__why">', `<p class="sc__src">${esc(src)}</p><p class="sc__why">`)).join('\n')}</div>`;
}

// Category entry points: only categories backed by a published, verified recommendation page.
const CATS = [
  ['luxury-hotels-da-nang.html', 'Luxury Resorts', 'intercontinental-da-nang'],
  ['family-hotels-da-nang.html', 'Family Hotels', 'hyatt-regency-da-nang'],
  ['da-nang-beach-hotels.html', 'Beachfront Hotels', 'pullman-da-nang'],
  ['best-han-river-hotels-da-nang.html', 'City Hotels', 'novotel-da-nang-han-river'],
  ['boutique-hotels-da-nang.html', 'Boutique Hotels', 'a-la-carte-da-nang'],
  ['best-budget-hotels-in-da-nang.html', 'Best Value', 'tms-hotel-da-nang'],
  ['da-nang-hotels-private-pool-villa.html', 'Private Villas', 'naman-retreat-da-nang'],
  ['best-hotels-in-hoi-an.html', 'Hoi An Hotels', null]
];
function tiles() {
  return `<div class="cat-grid">${CATS.map(([href, label, s]) => { const im = s ? img(s) : 'images/hoi-an-old-town.jpg'; return `<a class="cat" href="${href}">${im ? `<img src="${esc(im)}" alt="" loading="lazy" decoding="async" width="400" height="260">` : ''}<span class="cat__l">${esc(label)}</span></a>`; }).join('')}</div>`;
}

// Area decision card (Where to Stay). Hotel list = verified hotels in that area group, in ranking order. City-wide search is labelled as such.
function areaCard(a) {
  const hs = ranked().filter(s => a.groups.includes((FACTS[s].research || {}).neighborhood_group)).slice(0, 3);
  const act = hs.length ? `<p class="ac__hl">Our picks here</p><ul class="ac__hotels">${hs.map(s => `<li><a href="${esc(FACTS[s].review)}">${esc(nm(FACTS[s]))}</a>${hotelBtn(s, 'rr-ws-area', { compact: true, label: 'Prices' })}</li>`).join('')}</ul>` : '';
  return `<article class="ac" id="ac-${a.id}"><h3>${esc(a.name)}</h3><p class="ac__who"><strong>Stay here if:</strong> ${esc(a.who)}</p><p><strong>Why:</strong> ${esc(a.why)}</p><p class="ac__con"><strong>Drawback:</strong> ${esc(a.con)}</p>${act}
<p class="ac__more"><a href="${a.href}">${esc(a.more)}</a>${hs.length ? '' : destBtn(a.dest || 'danang', 'rr-ws-area', { compact: true, ghost: true })}</p></article>`;
}

const disclosure = (t) => `<p class="rr-disc">${t || 'We are an independent hotel guide. Our picks are our own; hotels do not pay to be listed. If you book through a Trip.com link we may earn a commission, at no extra cost to you. Prices and availability are shown on Trip.com, not on this site.'}</p>`;

// LCP: preload the rebuilt hero image and decode it synchronously. Idempotent.
function preloadHero(h) {
  h = h.replace(/<link rel="preload" as="image" data-rr-preload[^>]*>\n?/g, '');
  const m = h.match(/<img class="rr-hero__img" src="([^"]+)"(?: srcset="([^"]+)" sizes="([^"]+)")?/); if (!m || /^https?:/.test(m[1])) return h;
  h = h.replace(/(<img class="rr-hero__img"[^>]*?) decoding="async"/, '$1');
  const link = `<link rel="preload" as="image" data-rr-preload href="${m[1]}"${m[2] ? ` imagesrcset="${m[2]}" imagesizes="${m[3]}"` : ''} fetchpriority="high">`;
  return h.replace(/(<meta name="viewport"[^>]*>)/, `$1\n${link}`);
}
module.exports = { preloadHero, card, grid, picks, tiles, areaCard, disclosure, ranked, amenities, img, PICKS, CATS, FACTS, esc, nm, hotelBtn, destBtn };
