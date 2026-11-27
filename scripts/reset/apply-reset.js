#!/usr/bin/env node
// Operation Revenue Reset (2026-11-27): replaces the homepage and the Where to Stay commercial layout with the shopping-first design.
// Idempotent: owns <main> on index.html and the <!--rr:*--> blocks elsewhere; a second run changes nothing. Runs last in scripts/build-all.sh.
// Reviews are never touched here (see scripts/reset/review-guard.js).
'use strict';
const fs = require('fs'), path = require('path');
const S = require('./shop'); const { esc, destBtn, hotelBtn } = S;
const ROOT = path.resolve(__dirname, '..', '..'); const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8'); const wr = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
const LAYOUT = 'reset1';
const block = (name, body) => `<!--rr:${name}-->\n${body}\n<!--/rr:${name}-->`;
const putBlock = (h, name, body) => h.replace(new RegExp(`<!--rr:${name}-->[\\s\\S]*?<!--/rr:${name}-->`), () => block(name, body));
function assets(h, { js } = {}) {
  if (!/dn-shop\.css/.test(h)) h = h.replace('</head>', '<link rel="stylesheet" href="dn-shop.css">\n</head>');
  if (js && !/dn-shop\.js/.test(h)) h = h.replace('</body>', '<script src="dn-shop.js" defer></script>\n</body>');
  if (!/dn-shortlist\.js/.test(h)) h = h.replace('</body>', '<script src="dn-shortlist.js" defer></script>\n</body>');
  if (!/<html[^>]*data-layout=/.test(h)) h = h.replace(/<html([^>]*)>/, `<html$1 data-layout="${LAYOUT}">`);
  return S.preloadHero(h);
}
const hero = ({ h1, lede, acts, img, srcset, slim, meta }) => `<header class="rr-hero${slim ? ' rr-hero--slim' : ''}">${img ? `<img class="rr-hero__img" src="${img}"${srcset ? ` srcset="${srcset}" sizes="100vw"` : ''} alt="" fetchpriority="high" decoding="async">` : ''}<div class="rr-hero__in"><h1>${h1}</h1><p class="rr-lede">${lede}</p><div class="rr-hero__acts">${acts}</div>${meta ? `<p class="rr-hero__meta">${meta}</p>` : ''}</div></header>`;

// ---------------- homepage ----------------
function finderBlock(loc, page, title) {
  const all = S.ranked();
  return `<section class="rr-sec" id="find" aria-labelledby="rr-find-h" data-rr-finder data-page="${page}"><div class="rr-wrap">
<div class="rr-find" role="group" aria-labelledby="rr-find-h"><h2 class="rr-h2" id="rr-find-h">${title || 'Find hotels that fit your trip'}</h2>
<div class="rr-find__row"><div class="rr-find__g"><span class="rr-find__lab">Destination</span>${chips('dest', [['danang', 'Da Nang', true], ['hoian', 'Hoi An']])}</div></div>
<div class="rr-find__row" data-danang-only><div class="rr-find__g"><span class="rr-find__lab">Setting</span>${chips('setting', [['beach', 'Beach'], ['city', 'City']])}</div>
<div class="rr-find__g"><span class="rr-find__lab">Budget</span>${chips('budget', [['luxury', 'Luxury'], ['upscale', 'Upscale'], ['value', 'Value']])}</div>
<div class="rr-find__g"><span class="rr-find__lab">Travelling</span>${chips('aud', [['families', 'With kids'], ['couples', 'As a couple']])}</div></div>
<div class="rr-find__row" data-danang-only><div class="rr-find__g"><span class="rr-find__lab">Must have</span>${chips('amen', [['beachfront', 'On the beach'], ['infinity', 'Infinity pool'], ['villa', 'Private pool villa'], ['kids', 'Kids’ club'], ['lounge', 'Club lounge']])}</div></div>
<p class="rr-find__status" aria-live="polite">Showing our top picks of ${all.length} verified Da Nang hotels.</p></div>
<div class="rr-results">${S.grid(all, { loc: loc + '-results', limit: 6 })}
<button type="button" class="rr-more">Show all ${all.length} hotels</button>
<p class="rr-none">No hotel in our verified list matches every filter. Remove one filter, or <a href="da-nang-hotel-directory.html">browse the full directory</a>.</p></div>
<div class="rr-hoian"><h3>Hoi An hotels</h3><p>Old Town lanes, tailors and riverside cafes, or the quieter An Bang beach. Start with our Hoi An picks, then check prices for your dates.</p>
<ul><li><a href="best-hotels-in-hoi-an.html">Best hotels in Hoi An</a></li><li><a href="where-to-stay-in-hoi-an.html">Where to stay in Hoi An</a></li><li><a href="hoi-an-old-town-hotels.html">Old Town hotels</a></li><li><a href="an-bang-beach-hotels.html">An Bang beach hotels</a></li><li><a href="best-value-hotels-hoi-an.html">Best value in Hoi An</a></li></ul>
${destBtn('hoian', loc + '-hoian', { label: 'Compare Hoi An Hotel Prices' })}</div>
${S.disclosure('Hotel buttons open that hotel on Trip.com, where you see real prices and availability for your dates. We are an independent guide; if you book we may earn a commission, at no extra cost to you.')}</div></section>`;
}

function chips(g, items) { return items.map(([v, l, on]) => `<button type="button" class="rr-chip" data-g="${g}" data-v="${v}" aria-pressed="${on ? 'true' : 'false'}">${esc(l)}</button>`).join(''); }
function home() {
  let h = rd('index.html');
  const all = S.ranked();
  const finder = finderBlock('rr-home', 'home');
  const picks = `<section class="rr-sec rr-sec--soft" id="picks" aria-labelledby="rr-picks-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-picks-h">Our top hotel picks by trip type</h2><p class="rr-sub">Each pick comes from one of our published guides. Read the review, or check room prices for your dates.</p>${S.picks('rr-home-picks')}</div></section>`;
  // Official Trip.com search box (exact embed code from data/tripcom/search-box.json), loaded only when the visitor asks for it
  const SB = JSON.parse(rd('data/tripcom/search-box.json')).embed_code;
  const sbox = `<section class="rr-sec" aria-labelledby="rr-sb-h"><div class="rr-wrap rr-sbwrap"><div><h2 class="rr-h2" id="rr-sb-h">Already know your dates?</h2><p class="rr-sub">Search every Da Nang and Hoi An hotel on Trip.com directly. Prefer our shortlist? <a href="#find">Filter our verified picks</a>.</p><div class="rr-bottom">${destBtn('danang', 'rr-home-search', { label: 'Compare Da Nang Hotel Prices' })}${destBtn('hoian', 'rr-home-search', { ghost: true, label: 'Compare Hoi An Hotel Prices' })}</div></div>
<div class="rr-sbox" data-rr-sbox><p class="rr-sbox__t">Trip.com search box</p><p class="rr-sbox__n">This loads Trip.com\u2019s own search box. Trip.com may set cookies when it loads.</p><button type="button" class="rr-more rr-sbox__go">Show the search box</button><template>${SB}</template></div></div></section>`;
  const cats = `<section class="rr-sec" aria-labelledby="rr-cat-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-cat-h">Browse by hotel type</h2><p class="rr-sub">Shortlists for the most common Da Nang and Hoi An hotel searches.</p>${S.tiles()}</div></section>`;
  const AREAS = [['where-to-stay-in-da-nang.html#area-my-khe', 'My Khe Beach', 'Easiest all-round base: beach, food and bars.'], ['where-to-stay-in-da-nang.html#area-an-thuong', 'An Thuong', 'Walkable streets, cafes and nightlife near the beach.'], ['where-to-stay-in-da-nang.html#area-han-river', 'Han River', 'Downtown Da Nang, Dragon Bridge and river views.'], ['where-to-stay-in-da-nang.html#area-non-nuoc', 'Non Nuoc coast', 'Big resorts, pools and quiet beaches for families.'], ['where-to-stay-in-da-nang.html#area-son-tra', 'Son Tra Peninsula', 'Secluded luxury and scenery, away from the city.'], ['where-to-stay-in-hoi-an.html', 'Hoi An', 'Old Town charm and An Bang beach, south of Da Nang.']];
  const areas = `<section class="rr-sec rr-sec--soft" aria-labelledby="rr-area-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-area-h">Not sure which area?</h2><p class="rr-sub">Pick the area first, then the hotel. Our Where to Stay guide compares all of them.</p>
<ul class="rr-links">${AREAS.map(([u, n, t]) => `<li><a href="${u}">${esc(n)}</a><br><span class="sc__meta">${esc(t)}</span></li>`).join('')}</ul><p style="margin:20px 0 0"><a class="rr-btn rr-btn--main" style="border:1px solid #14181f" href="where-to-stay-in-da-nang.html">Where to stay in Da Nang</a></p></div></section>`;
  const trust = `<section class="rr-sec" aria-labelledby="rr-trust-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-trust-h">How we choose</h2>
<ul class="rr-links"><li><strong>Independent.</strong> Hotels do not pay to be listed or ranked.</li><li><strong>Local.</strong> Written by <a href="about.html">Ryan Yousefi</a>, who lives in Da Nang.</li><li><strong>Checked facts.</strong> Locations, beach access and facilities are checked against official and listing sources; anything unconfirmed is left out.</li><li><strong>Real prices on Trip.com.</strong> We never show made-up prices. Trip.com shows live rates and handles the booking.</li></ul>
${S.disclosure()}</div></section>`;
  const more = `<section class="rr-sec rr-sec--soft" aria-labelledby="rr-more-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-more-h">Reviews and travel guides</h2>
<ul class="rr-links"><li><a href="hotel-reviews.html">All hotel reviews</a></li><li><a href="compare-hotels.html">Compare hotels side by side</a></li><li><a href="da-nang-hotel-directory.html">Hotel directory</a></li><li><a href="da-nang-hotels-map.html">Hotels map</a></li><li><a href="guides.html">Travel guides</a></li><li><a href="things-to-do-in-da-nang.html">Things to do</a></li><li><a href="da-nang-itinerary.html">Itineraries</a></li><li><a href="best-time-to-visit-da-nang.html">Best time to visit</a></li><li><a href="da-nang-airport-guide.html">Airport guide</a></li><li><a href="da-nang-transport-guide.html">Getting around</a></li><li><a href="dining.html">Dining</a></li><li><a href="da-nang-nightlife-guide.html">Nightlife</a></li><li><a href="hoi-an.html">Hoi An travel guide</a></li><li><a href="news.html">Da Nang news</a></li></ul></div></section>`;
  const top = hero({ h1: 'Find Your Perfect Hotel in Da Nang', lede: 'Independent local recommendations. Compare the hotels that fit your trip, then check real room prices on Trip.com.', img: 'images/dn/slide-1-1000.webp', srcset: 'images/dn/slide-1-640.webp 640w, images/dn/slide-1-1000.webp 1000w, images/dn/slide-1-1600.webp 1600w', acts: `<a class="rr-btn rr-btn--main" href="#find">Find Hotels &amp; Check Prices</a><a class="rr-link" href="#picks">Explore our top hotel picks</a>`, meta: 'By Ryan Yousefi, a Da Nang local · Independent · Trip.com affiliate' });
  const main = `<main id="dn-main" class="rr">\n${block('home', [top, finder, picks, sbox, cats, areas, trust, more].join('\n'))}\n</main>`;
  h = h.replace(/<main id="dn-main"[^>]*>[\s\S]*?<\/main>/, () => main);
  h = h.replace(/<link rel="stylesheet" href="dn-home\.css">\n?/, '').replace(/<script src="dn-home\.js" defer><\/script>\n?/, '');
  wr('index.html', assets(h, { js: true }));
}

// ---------------- where to stay ----------------
const AREAS = [
  { id: 'my-khe', name: 'My Khe Beach', groups: ['my-khe', 'south-my-khe'], who: 'it is your first trip, or you want the beach with food and bars nearby.', why: 'The easiest all-round base in Da Nang: an excellent beach, good walkability and plenty to eat.', con: 'Busy; limited if you want quiet.', href: '#hotels-my-khe', more: 'Read the My Khe guide' },
  { id: 'han-river', name: 'Han River', groups: ['han-river-city'], who: 'you want city life, Dragon Bridge and river views.', why: 'Downtown Da Nang: walkable streets, markets and the river at night.', con: 'Limited beach access: My Khe is a taxi ride away.', href: '#hotels-han-river', more: 'Read the Han River guide' },
  { id: 'an-thuong', name: 'An Thuong', groups: [], who: 'you want to walk out of the door and find something to do.', why: 'The most walkable area, with cafes, restaurants and nightlife a few blocks from the beach.', con: 'Lively and busy; limited if you want quiet.', href: 'best-hotels-an-thuong-da-nang.html', more: 'Best hotels in An Thuong' },
  { id: 'son-tra', name: 'Son Tra Peninsula', groups: ['son-tra'], who: 'you want luxury, seclusion and scenery, and plan to stay on the property.', why: 'Extraordinary views and private bays, removed from city life.', con: 'Limited walkability, food and nightlife; the city is a drive away.', href: 'best-resorts-son-tra-peninsula.html', more: 'Best Son Tra resorts' },
  { id: 'non-nuoc', name: 'Non Nuoc / Truong Sa coast', groups: ['non-nuoc', 'truong-sa-coast'], who: 'you are travelling with family, or want resort time with pools and a quieter beach.', why: 'Large beach resorts where the hotel does more of the work, between My Khe and Hoi An.', con: 'Limited walkability and dining outside the resorts.', href: 'non-nuoc-beach-da-nang.html', more: 'Non Nuoc Beach guide' },
  { id: 'hoi-an', name: 'Hoi An', groups: [], dest: 'hoian', who: 'you want Old Town lanes, tailors and riverside evenings more than a city beach.', why: 'A different trip from a Da Nang beach stay, with Old Town and An Bang beach.', con: 'Further from Da Nang airport and the city’s beaches.', href: 'where-to-stay-in-hoi-an.html', more: 'Where to stay in Hoi An' }
];
function whereToStay() {
  const F = 'where-to-stay-in-da-nang.html'; let h = rd(F);
  const top = [
    hero({ slim: true, h1: 'Where to Stay in Da Nang — Find the Right Area and Hotel', lede: 'Beach resorts, central city hotels and family-friendly stays. Choose the right area, then compare real room prices for your dates.', img: 'images/my-khe-beach-aerial-da-nang.jpeg', acts: destBtn('danang', 'rr-ws-hero', { lg: true, label: 'Compare Da Nang Hotel Prices' }), meta: 'By Ryan Yousefi, a Da Nang local · Updated November 2026 · Independent, affiliate-supported' }),
    `<nav class="rr-jumpbar" aria-label="On this page"><div class="rr-wrap"><ul class="rr-jump"><li><a href="#areas">Areas at a glance</a></li><li><a href="#best-by-type">Best hotels by trip type</a></li><li><a href="#area-guide">Full area guide</a></li><li><a href="#hotels-by-area">Hotels by area</a></li><li><a href="#areas-side-by-side">Areas side by side</a></li><li><a href="#ws-faq">FAQ</a></li></ul></div></nav>`,
    `<section class="rr-sec" id="areas" aria-labelledby="rr-ws-areas-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-ws-areas-h">Which area suits you?</h2><div class="rr-answer"><p><strong>Short answer:</strong> first trip or a beach holiday, stay at <a href="#area-my-khe">My Khe</a>. Families and resort time: <a href="#area-non-nuoc">Non Nuoc</a>. City life: <a href="#area-han-river">Han River</a>. Seclusion and luxury: <a href="#area-son-tra">Son Tra</a>. Walkable nightlife: <a href="#area-an-thuong">An Thuong</a>.</p></div>
<div class="ac-grid">${AREAS.map(S.areaCard).join('\n')}</div>${S.disclosure('Area buttons for An Thuong and Hoi An open a city-wide Trip.com search, not an area filter. Hotel buttons open that hotel on Trip.com.')}</div></section>`,
    `<section class="rr-sec rr-sec--soft" id="best-by-type" aria-labelledby="rr-ws-best-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-ws-best-h">Best hotels by trip type</h2><p class="rr-sub">Our picks, each from one of our published guides. Check prices for your dates on Trip.com.</p>${S.picks('rr-ws-picks')}</div></section>`
  ].join('\n');
  if (/<!--rr:ws:top-->/.test(h)) h = putBlock(h, 'ws:top', top);
  else { const a = h.indexOf('<!-- HERO -->'), z = h.indexOf('<!--/dn-c3:ws:picks-->'); if (a < 0 || z < 0) throw new Error('where-to-stay: unexpected layout'); h = h.slice(0, a) + block('ws:top', top) + '\n' + h.slice(z + '<!--/dn-c3:ws:picks-->'.length); }
  // retire the Phase 3 modules this layout replaces (duplicate price bands, per-area cards, seasonal/return/final modules)
  h = h.replace(/<!--dn-c3:ws:([a-z-]+)-->[\s\S]*?<!--\/dn-c3:ws:\1-->\n?/g, '');
  // anchors for the jump bar on the preserved long-form sections
  const anchor = (marker, id) => { if (h.includes(`id="${id}"`)) return; const i = h.indexOf(marker); if (i < 0) throw new Error('missing ' + marker); h = h.slice(0, i) + `<span id="${id}" class="rr-anchor"></span>\n` + h.slice(i); };
  anchor('<!-- QUICK ANSWER: WHERE SHOULD YOU STAY? -->', 'area-guide'); anchor('<!-- HOTELS TO CONSIDER -->', 'hotels-by-area'); anchor('<!-- COMPARISON TABLE -->', 'areas-side-by-side'); anchor('<section class="ws-faq">', 'ws-faq');
  const recap = `<section class="rr-sec rr-sec--soft" aria-labelledby="rr-ws-final-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-ws-final-h">Ready to choose?</h2>
<div class="rr-cmp-wrap"><table class="rr-cmp"><thead><tr><th>If you want</th><th>Stay in</th><th>Start with</th></tr></thead><tbody>
${[['A first trip or beach holiday', 'My Khe', 'tms-hotel-da-nang'], ['Resort time with kids', 'Non Nuoc', 'hyatt-regency-da-nang'], ['Seclusion and luxury', 'Son Tra', 'intercontinental-da-nang'], ['City life on the river', 'Han River', 'novotel-da-nang-han-river']].map(([w, a, s]) => `<tr><td>${esc(w)}</td><td>${esc(a)}</td><td><a href="${esc(S.FACTS[s].review)}">${esc(S.nm(S.FACTS[s]))}</a><br>${hotelBtn(s, 'rr-ws-final', { compact: true, label: 'Check Room Prices' })}</td></tr>`).join('')}
</tbody></table></div><div class="rr-bottom" style="margin-top:18px">${destBtn('danang', 'rr-ws-final', { label: 'Compare All Da Nang Hotel Prices' })}<a href="compare-hotels.html">Compare hotels side by side</a></div>${S.disclosure()}</div></section>`;
  if (/<!--rr:ws:final-->/.test(h)) h = putBlock(h, 'ws:final', recap);
  else { const i = h.indexOf('<!--dn-c4:nav-->'); if (i < 0) throw new Error('no cluster nav'); h = h.slice(0, i) + block('ws:final', recap) + '\n' + h.slice(i); }
  wr(F, assets(h));
}

// ---------------- Find Hotels (finder page): instant filter first, the Stay Planner as the optional tailored step ----------------
function findPage() {
  const F = 'find-your-hotel.html'; let h = rd(F);
  const top = hero({ slim: true, h1: 'Find Hotels in Da Nang', lede: 'Filter our verified hotels in one tap, then check real room prices on Trip.com. Want a shortlist for your trip length and priorities? Use the Stay Planner below.', img: 'images/my-khe-beach-aerial-da-nang.jpeg', acts: '<a class="rr-btn rr-btn--main" href="#find">Filter Hotels</a><a class="rr-link" href="#planner">Use the Stay Planner</a>' }) + '\n' + finderBlock('rr-find', 'finder', 'Filter verified Da Nang hotels') + '\n<section class="rr-sec rr-sec--soft" id="planner" aria-labelledby="rr-planner-h" style="padding-bottom:0"><div class="rr-wrap"><h2 class="rr-h2" id="rr-planner-h">Stay Planner: a shortlist for your trip</h2><p class="rr-sub">Optional. Tell us nights, area and priority; we rank our verified hotels with travel times and the trade-offs.</p></div></section>';
  if (/<!--rr:find-->/.test(h)) h = putBlock(h, 'find', top);
  else { const m = h.indexOf('<main'); const a = h.indexOf('<header class="dn-hero"', m); const z = h.indexOf('</header>', a) + 9; if (a < 0) throw new Error('find: no hero'); h = h.slice(0, a) + block('find', top) + h.slice(z); }
  wr(F, assets(h, { js: true }));
}

home(); whereToStay(); findPage();
console.log('reset: index.html, where-to-stay-in-da-nang.html');
