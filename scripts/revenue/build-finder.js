#!/usr/bin/env node
// Builds find-your-hotel.html: a no-framework hotel matcher over the hotels we have reviewed.
// Facts (category, area, best-for, who-it-suits, trade-off) are read from each review page; tags below are our own editorial classification of those reviews.
// Trip.com buttons reuse each review's existing primary anchor (same href). No prices, no live availability, no scores.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&rarr;/g, '→');
const txt = x => unesc(x.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const sentences = (t, n, max) => { const parts = t.split(/(?<=[.!?])\s+/); let out = ''; for (const p of parts.slice(0, n)) { if ((out + ' ' + p).trim().length > max && out) break; out = (out + ' ' + p).trim(); } return out; };
// setting: beach | city ; style: resort | hotel | villa ; budget: value | upscale | luxury ; audience: families couples business solo wellness ; priorities: pool quiet walkable lounge beachfront
const TAGS = {
  'a-la-carte-da-nang': ['beach', 'hotel', 'value', ['couples', 'solo'], ['pool', 'beachfront']],
  'brilliant-hotel-da-nang': ['city', 'hotel', 'value', ['solo', 'couples'], ['walkable']],
  'four-points-sheraton-da-nang': ['beach', 'hotel', 'value', ['families', 'business'], ['beachfront']],
  'furama-resort-da-nang': ['beach', 'resort', 'upscale', ['families', 'couples'], ['pool', 'quiet', 'beachfront']],
  'grand-mercure-da-nang': ['city', 'hotel', 'upscale', ['business', 'couples'], ['walkable', 'pool']],
  'hilton-da-nang': ['city', 'hotel', 'upscale', ['business', 'couples'], ['lounge', 'walkable']],
  'hyatt-regency-da-nang': ['beach', 'resort', 'luxury', ['families', 'couples'], ['pool', 'quiet', 'beachfront']],
  'intercontinental-da-nang': ['beach', 'resort', 'luxury', ['couples'], ['quiet', 'lounge', 'beachfront']],
  'marriott-resort-da-nang': ['beach', 'villa', 'luxury', ['couples', 'families'], ['pool', 'quiet', 'beachfront']],
  'melia-da-nang': ['beach', 'resort', 'upscale', ['couples'], ['quiet', 'lounge', 'beachfront']],
  'melia-vinpearl-da-nang': ['city', 'hotel', 'upscale', ['couples', 'families'], ['pool', 'walkable']],
  'muong-thanh-luxury-da-nang': ['beach', 'hotel', 'value', ['families', 'solo'], ['beachfront']],
  'naman-retreat-da-nang': ['beach', 'villa', 'luxury', ['couples'], ['pool', 'quiet', 'beachfront']],
  'novotel-da-nang-han-river': ['city', 'hotel', 'value', ['business', 'solo'], ['lounge', 'walkable']],
  'premier-village-da-nang': ['beach', 'villa', 'luxury', ['families', 'couples'], ['pool', 'quiet', 'beachfront']],
  'pullman-da-nang': ['beach', 'resort', 'upscale', ['families', 'couples'], ['pool', 'beachfront']],
  'radisson-blu-da-nang': ['beach', 'resort', 'upscale', ['families'], ['pool', 'beachfront']],
  'sheraton-grand-da-nang': ['beach', 'resort', 'upscale', ['families'], ['pool', 'beachfront']],
  'tia-wellness-resort-da-nang': ['beach', 'resort', 'luxury', ['couples', 'wellness'], ['quiet', 'beachfront']],
  'tms-hotel-da-nang': ['beach', 'hotel', 'value', ['couples', 'solo'], ['pool', 'beachfront']],
  'wyndham-soleil-da-nang': ['beach', 'hotel', 'value', ['couples'], ['beachfront']],
};
const FALLBACK_DRAWBACK = { 'naman-retreat-da-nang': 'Value depends entirely on room type; our reviewer stayed in a high-rise room rather than a villa, so choose your room carefully.' };
const FALLBACK_REASON = { 'naman-retreat-da-nang': 'A destination stay on Non Nuoc Beach built around settling into the property, with direct beachfront, a long infinity pool and Hoi An roughly 25 minutes south by car.' };
const primary = h => { const c = [...h.matchAll(/<a [^>]*data-tc-key="hotel:[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map(m => m[0]).filter(a => /data-hotel="/.test(a) && /href="https:\/\/www\.trip\.com\//.test(a)); return c[0] || null; };
const attr = (a, n) => { const m = a.match(new RegExp(`\\s${n}="([^"]*)"`)); return m ? unesc(m[1]) : ''; };
const hotels = [];
for (const [slug, [setting, style, budget, audience, priorities]] of Object.entries(TAGS)) {
  const f = slug + '.html'; if (!fs.existsSync(path.join(ROOT, f))) throw new Error('missing review ' + f);
  const h = fs.readFileSync(path.join(ROOT, f), 'utf8'); const a = primary(h); if (!a) throw new Error('no verified anchor: ' + f);
  const meta = (h.match(/<p class="dn-hero__meta">([^<]*)/) || [, ''])[1]; const sn = Object.fromEntries([...h.matchAll(/hr-snap-key">([^<]*)<\/div><div class="hr-snap-val">([^<]*)/g)].map(m => [m[1], unesc(m[2])]));
  const suits = (h.match(/Who It Suits[\s\S]*?<\/h2>([\s\S]*?)<\/section>/) || [])[1]; const trade = (h.match(/The Tradeoff<\/[^>]+>([\s\S]*?)<\/section>/) || h.match(/Tradeoff([\s\S]*?)<\/section>/) || [])[1];
  hotels.push({ id: slug, name: attr(a, 'data-hotel'), review: f, key: attr(a, 'data-tc-key'), href: attr(a, 'href'), category: txt(meta) || null, bestFor: sn['Best for'] || null, setting, style, budget, audience, priorities,
    reason: FALLBACK_REASON[slug] || (suits ? sentences(txt(suits), 2, 260) : ''), drawback: FALLBACK_DRAWBACK[slug] || (trade ? sentences(txt(trade).replace(/^What you give up\s*/i, ''), 2, 260) : '') });
}
// Final-audit: objective tags come from the verified facts dataset (data/hotels/facts.json + routes.json); opinion tags (quiet, a good pool) stay editorial.
{ const F = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/facts.json'), 'utf8')).hotels; const RT = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/routes.json'), 'utf8')).hotels;
  for (const h of hotels) { const f = F[h.id], d = (f && f.display) || {}, r = ((RT[h.id] || {}).distances) || {};
    const pr = new Set(h.priorities.filter(p => p === 'quiet' || p === 'pool'));
    if (d.beach === 'Beachfront') pr.add('beachfront'); if (/^Yes/.test(d.lounge || '')) pr.add('lounge'); if (/^Yes/.test(d.kids_club || '')) pr.add('kids');
    if (r.airport && r.airport.driving && r.airport.driving.minutes <= 15) pr.add('airport');
    if (r.han_market && r.han_market.walking && r.han_market.walking.minutes <= 20) pr.add('walkable');
    if (f && ['Han River / city centre', 'Han River east bank', 'My Khe (Son Tra side)', 'My Khe Beach'].includes(f.area_label)) pr.add('nightlife');
    h.priorities = [...pr]; if (d.beach === 'Not a beach hotel') h.setting = 'city'; else if (/^(Beachfront|Short walk)/.test(d.beach || '')) h.setting = 'beach';
    if (f && f.official_name) h.name = f.official_name; if (f) h.area = f.area_label; } }
const bad = hotels.filter(h => !h.reason || !h.drawback || !h.name); if (bad.length) throw new Error('incomplete data: ' + bad.map(b => b.id).join(', '));
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/registry.json'), 'utf8')).entries;
const hoi = reg.find(e => e.key === 'search:Hoi An, Vietnam|-3723930|city'), dn = reg.find(e => e.key === 'search:Da Nang Municipality, Vietnam|6232|region');
const T = fs.readFileSync(path.join(ROOT, 'da-nang-hotels-near-airport.html'), 'utf8');
const title = 'Find Your Ideal Da Nang Hotel: Hotel Finder', desc = 'Answer a few questions and see which Da Nang hotels we have reviewed fit your trip, with the reason, the trade-off and a link to check prices on Trip.com.';
const url = 'https://www.dananghotelguide.com/find-your-hotel.html';
let head = T.slice(0, T.indexOf('</head>')); let rest = T.slice(T.indexOf('</head>'));
head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`).replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`).replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`).replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`).replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`).replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
const ld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description: desc, url }, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.dananghotelguide.com/' }, { '@type': 'ListItem', position: 2, name: 'Hotel Finder', item: url }] }];
let k = 0; head = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, () => (k < 2 ? `<script type="application/ld+json">${JSON.stringify(ld[k++])}</script>` : ''));
while (k < 2) head += `<script type="application/ld+json">${JSON.stringify(ld[k++])}</script>`;
rest = rest.replace(/<script[^>]*dn-banner\.js[^>]*><\/script>\s*/g, '');
const chrome = rest.slice(0, rest.indexOf('<main id="dn-main">')), foot = rest.slice(rest.indexOf('</main>'));
const radio = (name, items) => items.map(([v, l], i) => `<label class="fy-opt"><input type="radio" name="${name}" value="${v}"${i === 0 ? ' checked' : ''}><span>${esc(l)}</span></label>`).join('');
const check = (name, items) => items.map(([v, l]) => `<label class="fy-opt"><input type="checkbox" name="${name}" value="${v}"><span>${esc(l)}</span></label>`).join('');
const btn = (e, label) => `<a data-provider="tripcom" data-tc-key="${esc(e.key)}" aria-label="${label} on Trip.com, opens in a new tab" class="dn-booklink affiliate-link dn-btn dn-btn--book tc-btn tc-btn--solid" href="${e.affiliate_url.replace(/&/g, '&amp;')}" target="_blank" rel="nofollow noopener sponsored" data-cta-location="finder"><span class="tc-btn__text">${label} &rarr;</span></a>`;
const css = `<style>.fy{max-width:980px;margin:0 auto;padding:2rem var(--gutter,1.25rem) 3rem}.fy form{display:grid;gap:1.25rem}.fy fieldset{border:1px solid rgba(0,0,0,.18);border-radius:10px;padding:1rem 1.1rem;margin:0}.fy legend{font-weight:700;font-size:.95rem;padding:0 .4rem}.fy-row{display:flex;flex-wrap:wrap;gap:.5rem}.fy-opt{display:inline-flex;align-items:center;gap:.4rem;min-height:44px;padding:.35rem .8rem;border:1px solid rgba(0,0,0,.25);border-radius:999px;cursor:pointer;font-size:.9rem;background:#fff}.fy-opt input{accent-color:#111}.fy-opt:has(input:checked){background:#111;color:#fff;border-color:#111}.fy-opt:has(input:focus-visible){outline:3px solid #fbbf24;outline-offset:2px}.fy-go{justify-self:start;min-height:48px;padding:.6rem 1.4rem;background:#111;color:#fff;border:0;border-radius:8px;font-weight:700;cursor:pointer}.fy-note{font-size:.8rem;color:#555;margin:.75rem 0 0}.fy-res{margin-top:2rem}.fy-card{border:1px solid rgba(0,0,0,.18);border-radius:12px;padding:1.2rem 1.3rem;margin:0 0 1rem;background:#fff}.fy-card h3{margin:0 0 .2rem;font-size:1.15rem}.fy-meta{font-size:.8rem;color:#555;margin:0 0 .6rem}.fy-why,.fy-con{font-size:.92rem;line-height:1.6;margin:.4rem 0}.fy-tags{display:flex;flex-wrap:wrap;gap:.35rem;margin:.5rem 0}.fy-tag{font-size:.72rem;border:1px solid rgba(0,0,0,.25);border-radius:999px;padding:.1rem .55rem}.fy-act{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-top:.8rem}.fy-act a.fy-rev{color:#111;text-decoration:underline;text-underline-offset:2px}.fy-hoi{border:1px solid #111;border-radius:12px;padding:1.2rem 1.3rem}</style>`;
const main = `<main id="dn-main">\n<header class="dn-hero"><div class="dn-hero__media"><img src="images/my-khe-beach-aerial-da-nang.jpeg" alt="" fetchpriority="high" decoding="async"></div><div class="dn-hero__inner">\n<p class="dn-eyebrow">Hotel Finder · Da Nang</p>\n<h1>Find Your Ideal <em>Da Nang Hotel</em></h1>\n<p class="dn-lede">Tell us how you travel and we will show the hotels we have reviewed that fit, with the reason, the trade-off and a link to check prices.</p>\n</div></header>\n${css}\n<div class="fy">\n<form id="fyForm" aria-describedby="fyHow">\n<fieldset><legend>Where are you staying?</legend><div class="fy-row">${radio('dest', [['danang', 'Da Nang'], ['hoian', 'Hoi An']])}</div></fieldset>\n<div id="fyDN" class="fy-group">\n<fieldset><legend>Beach or city?</legend><div class="fy-row">${radio('setting', [['any', 'No preference'], ['beach', 'Beach area (on or near the sand)'], ['city', 'City / Han River']])}</div></fieldset>\n<fieldset><legend>Who is travelling?</legend><div class="fy-row">${radio('audience', [['any', 'Not sure'], ['families', 'Family with children'], ['couples', 'Couple'], ['solo', 'Solo or friends'], ['business', 'Business'], ['wellness', 'Wellness retreat']])}</div></fieldset>\n<fieldset><legend>Hotel category (star rating, not price)</legend><div class="fy-row">${radio('budget', [['any', 'Any'], ['value', '4-star'], ['upscale', '5-star'], ['luxury', '5-star luxury (villas, top resorts)']])}</div></fieldset>\n<fieldset><legend>Style</legend><div class="fy-row">${radio('style', [['any', 'Any'], ['resort', 'Resort'], ['hotel', 'City or beach hotel'], ['villa', 'Villa or boutique']])}</div></fieldset>\n<fieldset><legend>What matters most? (optional)</legend><div class="fy-row">${check('prio', [['beachfront', 'Beachfront (on the sand)'], ['walkable', 'Walk to Han Market in 20 min or less'], ['nightlife', 'Restaurants and nightlife nearby (our judgement)'], ['airport', 'Short drive to the airport (about 15 min, no traffic)'], ['kids', "Kids' club"], ['lounge', 'Club or executive lounge'], ['pool', 'A good pool (our judgement)'], ['quiet', 'Quiet surroundings (our judgement)']])}</div></fieldset>\n</div>\n<button type="submit" class="fy-go">Show matching hotels</button>\n<p class="fy-note" id="fyHow">How matching works: choices of beach or city, hotel category (star rating, not price) and style narrow the list; who is travelling and what matters most rank what is left. Budget levels reflect star category and our reviews, not live rates. Nothing you choose is stored or sent anywhere.</p>\n</form>\n<div class="fy-res" id="fyRes" aria-live="polite" tabindex="-1"></div>\n<div class="fy-hoi" id="fyHoi" hidden><h2 style="margin:0 0 .4rem;font-size:1.2rem">Staying in Hoi An?</h2><p class="fy-why">Hoi An is a different decision: Old Town, rice fields or An Bang beach. Start with these guides, then check rates for your dates.</p><div class="fy-act"><a class="fy-rev" href="where-to-stay-in-hoi-an.html">Where to stay in Hoi An</a><a class="fy-rev" href="best-hotels-in-hoi-an.html">Best hotels in Hoi An</a><a class="fy-rev" href="hoi-an-old-town-hotels.html">Old Town hotels</a>${btn(hoi, 'Compare Hoi An Hotel Prices')}</div></div>\n<noscript><p class="fy-why">The finder needs JavaScript. Without it, browse <a href="hotel-reviews.html">all hotel reviews</a> or <a href="where-to-stay-in-da-nang.html">where to stay in Da Nang</a>.</p></noscript>\n<p class="fy-note">Not sure which area? Read <a href="where-to-stay-in-da-nang.html">where to stay in Da Nang</a> or <a href="my-khe-or-han-river-where-to-stay-da-nang.html">My Khe Beach or Han River</a>. We may earn a commission if you book through Trip.com links, at no extra cost to you.</p>\n</div>\n<script type="application/json" id="fyData">${JSON.stringify({ hotels, danang: { key: dn.key, href: dn.affiliate_url } }).replace(/</g, '\\u003c')}</script>\n<script src="dn-finder.js" defer></script>\n`;
// Phase 3: shortlist + commerce styles (finder results get Save and Compare)
const head3 = head.replace('<link rel="stylesheet" href="tripcom-cta.css">', '<link rel="stylesheet" href="tripcom-cta.css">\n<link rel="stylesheet" href="dn-commerce.css">');
const foot3 = /dn-shortlist\.js/.test(foot) ? foot : foot.replace('<script src="tripcom-cta.js" defer></script>', '<script src="tripcom-cta.js" defer></script>\n<script src="dn-shortlist.js" defer></script>');
fs.writeFileSync(path.join(ROOT, 'find-your-hotel.html'), require('../revenue3/components').dedupeAssets(head3 + chrome + main + foot3));
console.log('finder built with', hotels.length, 'hotels');
