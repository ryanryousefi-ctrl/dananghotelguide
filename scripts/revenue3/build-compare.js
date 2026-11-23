#!/usr/bin/env node
// Builds compare-hotels.html (+ embedded JSON read by dn-compare.js) from data/hotels/facts.json. Template chrome is taken from find-your-hotel.html.
'use strict';
const fs = require('fs'), path = require('path'); const C = require('./components');
const ROOT = path.resolve(__dirname, '..', '..'); const esc = C.esc;
const T = fs.readFileSync(path.join(ROOT, 'find-your-hotel.html'), 'utf8');
const title = 'Compare Da Nang Hotels Side by Side', desc = 'Pick two or three Da Nang hotels we have reviewed and compare area, beach access, pools, lounge and trade-offs, then check prices on Trip.com.';
const url = 'https://www.dananghotelguide.com/compare-hotels.html';
let head = T.slice(0, T.indexOf('</head>')), rest = T.slice(T.indexOf('</head>'));
head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`).replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`).replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`).replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`).replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`).replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
head = head.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${esc(title)}"`).replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${esc(desc)}"`);
const ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description: desc, url }, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.dananghotelguide.com/' }, { '@type': 'ListItem', position: 2, name: 'Compare hotels', item: url }] }];
let k = 0; head = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, () => (k < 2 ? `<script type="application/ld+json">${JSON.stringify(ld[k++])}</script>` : ''));
head = head.replace('<link rel="stylesheet" href="tripcom-cta.css">', '<link rel="stylesheet" href="tripcom-cta.css">\n<link rel="stylesheet" href="dn-commerce.css">');
const chrome = rest.slice(0, rest.indexOf('<main id="dn-main">'));
const foot = rest.slice(rest.indexOf('</main>')).replace(/<script[^>]*dn-finder\.js[^>]*><\/script>\s*/g, '').replace('<script src="tripcom-cta.js" defer></script>', '<script src="tripcom-cta.js" defer></script>\n<script src="dn-shortlist.js" defer></script>\n<script src="dn-compare.js" defer></script>');
const H = Object.values(C.FACTS).map(h => { const e = C.hotelEntry(h); return { id: h.slug, name: h.official_name || h.name, review: h.review, area: h.area_label, setting: h.setting === 'beach' ? 'Beach' : 'City', style: { resort: 'Resort', hotel: 'Hotel', villa: 'Villa-style resort' }[h.style], tier: { value: '4-star / value', upscale: '5-star / upscale', luxury: '5-star / luxury' }[h.budget], best: h.editorial.bestFor, why: h.editorial.why, drawback: h.editorial.drawback, d: h.display, key: e.key, href: e.affiliate_url, label: h.name.length <= 28 ? 'Check ' + h.name + ' Prices' : 'Check Room Prices' }; });
const json = JSON.stringify({ hotels: H }).replace(/</g, '\\u003c');
const main = `<main id="dn-main">
<header class="dn-hero"><div class="dn-hero__media"><img src="images/my-khe-beach-aerial-da-nang.jpeg" alt="" fetchpriority="high" decoding="async"></div><div class="dn-hero__inner">
<p class="dn-eyebrow">Hotel comparison · Da Nang</p><h1>Compare Da Nang <em>hotels side by side</em></h1>
<p class="dn-lede">Choose two or three of the hotels we have reviewed and see how they differ. Then check each hotel's price for your dates on Trip.com.</p></div></header>
<section class="dnc dnc-tool" id="dnc-tool" aria-labelledby="cmp-h">
<h2 class="dnc-h" id="cmp-h">1. Pick two or three hotels</h2>
<div class="dnc-sl" id="dnc-sl" hidden><strong>Your saved shortlist</strong> <span class="dnc-note">(stored only in this browser; clear it any time)</span><ul id="dnc-sl-list"></ul><div class="dnc-actions"><button type="button" class="dnc-ghost" id="dnc-sl-load">Compare my shortlist</button><button type="button" class="dnc-ghost" id="dnc-sl-clear">Clear shortlist</button></div></div>
<div class="dnc-pick" id="dnc-pick" role="group" aria-label="Hotels to compare"></div>
<p class="dnc-note" id="dnc-count" aria-live="polite">Choose at least two hotels.</p>
<h2 class="dnc-h" id="cmp-r" style="margin-top:1.5rem">2. Compare</h2>
<div id="dnc-out" aria-live="polite"><p class="dnc-sub">Your comparison appears here.</p></div>
<noscript><p class="dnc-sub">This tool needs JavaScript. Without it, browse our <a href="hotel-reviews.html">hotel reviews</a> or the <a href="best-hotels-in-da-nang.html">best hotels in Da Nang</a>.</p></noscript>
<p class="dnc-note"><strong>How to read this.</strong> Objective rows (area, beach access, pools, lounge, kids' club, rooms) come from public hotel and booking-site listings we checked on 23 November 2026 (official hotel and brand pages where reachable, otherwise booking listings); anything we could not confirm says "Not verified". Official sites were often unreachable, so confirm important details on the hotel's own page. "Best for", "Why choose it" and "Consider another hotel if" are our editorial opinions. Distances are labelled by method: walking and road distances are routing estimates from OpenStreetMap data (OSRM, no traffic, so real taxi times are often longer), and straight-line distance is as the crow flies. We show no live prices or scores: rates and availability are on Trip.com. Trip.com is an affiliate partner and we may earn a commission if you book, at no extra cost to you.</p>
<p class="dnc-note">Not sure where to start? Try the <a href="find-your-hotel.html">hotel finder</a> or read <a href="where-to-stay-in-da-nang.html">where to stay in Da Nang</a>.</p>
</section>
<script type="application/json" id="dnc-data">${json}</script>
`;
fs.writeFileSync(path.join(ROOT, 'compare-hotels.html'), C.dedupeAssets(head + chrome + main + foot));
console.log('compare-hotels.html built,', H.length, 'hotels');
