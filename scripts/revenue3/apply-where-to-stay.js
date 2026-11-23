#!/usr/bin/env node
// Stage A: flagship rebuild of where-to-stay-in-da-nang.html. Idempotent: every block sits between <!--dn-c3:ws:NAME--> ... <!--/dn-c3:ws:NAME--> markers and is replaced on re-run.
'use strict';
const fs = require('fs'), path = require('path');
const C = require('./components');
const ROOT = path.resolve(__dirname, '..', '..'), FILE = path.join(ROOT, 'where-to-stay-in-da-nang.html');
let html = fs.readFileSync(FILE, 'utf8');
const wrap = (n, body) => `<!--dn-c3:ws:${n}-->${body}<!--/dn-c3:ws:${n}-->`;
const strip = n => { html = html.replace(new RegExp(`<!--dn-c3:ws:${n}-->[\\s\\S]*?<!--/dn-c3:ws:${n}-->\\n?`, 'g'), ''); };
const esc = C.esc;
['hero', 'chooser', 'picks', 'compare', 'season', 'return', 'final'].forEach(strip);
html = html.replace(/<!--dn-c3:ws:card-[a-z-]+-->[\s\S]*?<!--\/dn-c3:ws:card-[a-z-]+-->/g, '');

// 1. hero price-check (right after the page hero, so the lede still answers the question first)
const hero = wrap('hero', C.heroPrice({ id: 'ws-hero-pc', kicker: 'Check prices for your dates', title: 'Where should you stay in Da Nang?', copy: 'Beachfront resorts, Han River hotels, family-friendly stays and boutique hideaways: find the right area, then check real prices for your travel dates.', secondaryLabel: 'Find My Ideal Hotel', secondaryHref: 'find-your-hotel.html', note: 'Choose your neighborhood, compare our hotel recommendations, and check current room availability through Trip.com. Trip.com is an affiliate partner: we may earn a commission if you book, at no extra cost to you. We do not book rooms ourselves.' }));
// 2. neighborhood chooser
const AREAS = [
  ['My Khe Beach', 'images/my-khe-beach-aerial-da-nang.jpeg', 'Beachfront stays and restaurants', 'First-time visitors who want beach plus convenience.', 'Wide beach, hotels at most price points, food within reach.', 'Touristy and hotel-heavy.', 'best-hotels-near-my-khe-beach.html', 'hotels-my-khe'],
  ['Han River', 'images/da-nang-han-river-night.webp', 'City hotels and sightseeing', 'City-minded travellers: bridge, markets, street food.', 'Local city life and easy sightseeing on foot or by short ride.', 'Not on the beach; the sand is a taxi ride away.', 'best-han-river-hotels-da-nang.html', 'hotels-han-river'],
  ['An Thuong', 'images/an-thuong-street-da-nang.jpeg', 'Walkable dining and beach access', 'Longer stays, food lovers, people who hate needing a taxi for dinner.', 'Compact streets full of cafes, restaurants and bars, a short walk from the beach.', 'Busier and more tourist-oriented than it once was.', 'best-hotels-an-thuong-da-nang.html', 'hotels-an-thuong'],
  ['Son Tra', 'images/broll-son-tra-lady-buddha-aerial.jpg', 'Seclusion and luxury', 'Couples and anyone paying for a setting and privacy.', 'Dramatic coast and hillside scenery with real quiet.', 'Far from the city: expect regular taxis.', 'best-resorts-son-tra-peninsula.html', 'hotels-son-tra'],
  ['Non Nuoc', 'images/family-hotels-da-nang-74b58637.webp', 'Large beachfront resorts', 'Families and resort-days travellers.', 'Big resort grounds, pools and space on a quieter beach.', 'Well south of the city centre, so city sights need a ride.', 'non-nuoc-beach-da-nang.html', 'hotels-non-nuoc'],
  ['Hoi An', 'images/market-hoi-an-lanterns.webp', 'Historic atmosphere and boutique stays', 'Travellers who want Old Town charm and boutique hotels.', 'Walkable historic centre and a distinct atmosphere.', 'Not a resort-and-beach base unless you pick An Bang.', 'where-to-stay-in-hoi-an.html', null],
];
const imgOk = p => fs.existsSync(path.join(ROOT, p));
const chooser = wrap('chooser', `<section class="dnc dnc-sec" aria-labelledby="ws-chooser-h"><div class="dnc-wrap"><p class="dnc-kicker">Step 1</p><h2 class="dnc-h" id="ws-chooser-h">Choose your neighborhood</h2>
<p class="dnc-sub">Pick the area first, then the hotel. Each card gives the short version; the full area guide and hotel picks are one click away.</p>
<div class="dnc-areas">${AREAS.map(([n, img, tag, who, adv, dr, guide, anchor]) => `<article class="dnc-area">${imgOk(img) ? `<img src="${img}" alt="${esc(n)}" loading="lazy" width="600" height="400">` : ''}<div class="dnc-area__b"><h3>${esc(n)}</h3><p><strong>${esc(tag)}.</strong></p><p><span class="dnc-k">Suits</span><br>${esc(who)}</p><p><span class="dnc-k">Advantage</span><br>${esc(adv)}</p><p><span class="dnc-k">Drawback</span><br>${esc(dr)}</p><div class="dnc-area__f"><a class="dnc-ghost" href="${guide}">Area guide</a>${anchor ? `<a class="dnc-ghost" href="#${anchor}">Hotels here</a>` : C.destBtn('hoian', 'p3-area', { label: 'Compare Hoi An Hotel Prices' })}</div></div></article>`).join('')}</div>
<p class="dnc-note">Trip.com city search covers all of Da Nang and is not filtered by neighborhood, so area cards link to our hotel picks for that area instead.</p></div></section>`);
// 3. picks
const PICKS = ['novotel-da-nang-han-river', 'a-la-carte-da-nang', 'pullman-da-nang', 'furama-resort-da-nang', 'hyatt-regency-da-nang', 'intercontinental-da-nang'];
const picks = wrap('picks', `<section class="dnc dnc-sec" id="our-hotel-picks" aria-labelledby="ws-picks-h"><div class="dnc-wrap"><p class="dnc-kicker">Step 2</p><h2 class="dnc-h" id="ws-picks-h">Our hotel picks: check prices for your dates</h2>
<p class="dnc-sub">Six hotels we have reviewed, one or two per area. Opinions are ours; rates and availability are on Trip.com.</p>${C.cards(PICKS, { loc: 'p3-ws-pick' })}
<div class="dnc-actions">${C.destBtn('danang', 'p3-ws-picks', { lg: true })}<a class="dnc-ghost" href="compare-hotels.html">Compare hotels side by side</a><a class="dnc-ghost" href="hotel-reviews.html">All hotel reviews</a></div></div></section>`);
// anchor: after the hero header
const ih = html.indexOf('</header>', html.indexOf('<header class="dn-hero"')); if (html.indexOf('<header class="dn-hero"') < 0) throw new Error('no hero header');
html = html.slice(0, ih + 9) + '\n' + hero + '\n' + chooser + '\n' + picks + '\n' + html.slice(ih + 9);

// 4. per-area price-check rows inside area cards (verified hotel buttons only)
const ROWS = { 'area-my-khe': ['a-la-carte-da-nang', 'four-points-sheraton-da-nang'], 'area-han-river': ['novotel-da-nang-han-river', 'hilton-da-nang'], 'area-non-nuoc': ['hyatt-regency-da-nang', 'melia-da-nang'], 'area-son-tra': ['intercontinental-da-nang'] };
for (const [id, slugs] of Object.entries(ROWS)) {
  const i = html.indexOf(`id="${id}"`); if (i < 0) throw new Error('missing ' + id);
  const j = html.indexOf('<a href="#hotels-', i); if (j < 0) throw new Error('no area link ' + id);
  const row = wrap('card-' + id.slice(5), `<div class="dnc dnc-actions" style="flex-direction:column;align-items:stretch;margin:.5rem 0 1rem"><span class="dnc-lab">Check prices for your dates</span>${slugs.map(s => C.hotelBtn(s, 'p3-ws-area', { block: true })).join('')}</div>`);
  html = html.slice(0, j) + row + '\n          ' + html.slice(j);
}
// 5. compare modules after the by-area hotels section
const PAIRS = [['a-la-carte-da-nang', 'four-points-sheraton-da-nang'], ['novotel-da-nang-han-river', 'hilton-da-nang'], ['hyatt-regency-da-nang', 'melia-da-nang']];
const compare = wrap('compare', C.compareGroup(PAIRS, { loc: 'p3-ws-compare', title: 'Compare these hotels for your dates', sub: 'Three pairs, one per area: the main difference and a price check for each.' }));
const sig = html.indexOf('<section class="ws-compare-dark">'); if (sig < 0) throw new Error('no ws-compare-dark');
html = html.slice(0, sig) + compare + '\n' + html.slice(sig);
// 6. seasonal advice before the bottom-line section; final booking section after FAQ
const season = wrap('season', C.seasonal('danang'));
const bl = html.indexOf('<section class="ws-bottom-line">'); if (bl < 0) throw new Error('no bottom line');
html = html.slice(0, bl) + season + '\n' + html.slice(bl);
const finalHtml = wrap('final', `<section class="dnc dnc-final dnc-sec" aria-labelledby="ws-final-h"><div class="dnc-wrap"><p class="dnc-kicker">Next step</p><h2 class="dnc-h" id="ws-final-h">Ready to choose your Da Nang hotel?</h2>
<ul class="dnc-recap"><li><b>First trip, want the beach</b>My Khe Beach</li><li><b>Want to walk to dinner</b>An Thuong</li><li><b>City sights and local life</b>Han River</li><li><b>Resort days with the family</b>Non Nuoc</li><li><b>Privacy and scenery</b>Son Tra</li><li><b>Old Town atmosphere</b>Hoi An</li></ul>
<div class="dnc-actions">${C.destBtn('danang', 'p3-ws-final', { lg: true, label: 'Compare Da Nang Hotel Prices' })}${C.destBtn('hoian', 'p3-ws-final', { label: 'Compare Hoi An Hotel Prices' })}<a class="dnc-ghost" href="find-your-hotel.html">Use the hotel finder</a></div>
<p class="dnc-note">Disclosure: we earn a commission if you book through our Trip.com links, at no extra cost to you. It does not change what we recommend. Trip.com city searches are not filtered by neighborhood.</p></div></section>`);
const retm = wrap('return', C.returnModule('danang')); const fq = html.indexOf('<section class="ws-faq">'); if (fq < 0) throw new Error('no faq'); html = html.slice(0, fq) + retm + '\n' + html.slice(fq);
const rel = html.indexOf('<!--dn-revenue:related-->'); const faqEnd = rel > 0 ? rel : html.lastIndexOf('</main>');
html = html.slice(0, faqEnd) + finalHtml + '\n' + html.slice(faqEnd);
// 7. assets
if (!/dn-commerce\.css/.test(html)) html = html.replace('<link rel="stylesheet" href="tripcom-cta.css">', '<link rel="stylesheet" href="tripcom-cta.css">\n<link rel="stylesheet" href="dn-commerce.css">');
if (!/dn-shortlist\.js/.test(html)) html = html.replace('<script src="tripcom-cta.js" defer></script>', '<script src="tripcom-cta.js" defer></script>\n<script src="dn-shortlist.js" defer></script>');
fs.writeFileSync(FILE, html);
console.log('where-to-stay rebuilt');
