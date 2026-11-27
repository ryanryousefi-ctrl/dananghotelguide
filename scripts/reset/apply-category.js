#!/usr/bin/env node
// Operation Revenue Reset: category / area pages become hotel-shopping landing pages.
// Per page: slim hero (same H1 and lede text), then <!--rr:cat--> = quick answer naming the page's OWN published top picks, a compact comparison
// of verified hotels, and shopping cards; the long-form guide stays below unchanged. Retires the duplicate Phase 3 rollout modules
// (price band under the hero, dates band, two-hotel compare, "still planning"). Idempotent; runs after apply-rollout in build-all.
// Cards: facts.json hotels use the full card; a page's own pick that is not in facts.json gets a "lite" card built only from that page's
// pick text (name, area line, first sentence) and the verified registry button already on the page.
'use strict';
const fs = require('fs'), path = require('path');
const S = require('./shop'); const C = require('../revenue3/components'); const { esc, FACTS, nm } = S;
const ROOT = path.resolve(__dirname, '..', '..');
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/registry.json'), 'utf8')).entries;
const decode = s => s.replace(/&middot;/g, '\u00b7').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&#8217;/g, '\u2019').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
const strip = s => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// [file, intent phrase for the quick answer, picks]  pick = facts slug | { lite: 'Name as printed on the page', label }
const PAGES = [
  ['best-hotels-in-da-nang.html', 'the best hotel in Da Nang', [{ s: 'intercontinental-da-nang', label: 'Top pick' }, { s: 'sheraton-grand-da-nang', label: 'Signature pick' }, 'hyatt-regency-da-nang', 'tia-wellness-resort-da-nang', 'premier-village-da-nang', 'tms-hotel-da-nang']],
  ['luxury-hotels-da-nang.html', 'a luxury hotel in Da Nang', [{ s: 'intercontinental-da-nang', label: 'Top pick' }, { s: 'sheraton-grand-da-nang', label: 'Signature pick' }, 'hyatt-regency-da-nang', 'naman-retreat-da-nang', 'marriott-resort-da-nang', 'tia-wellness-resort-da-nang']],
  ['family-hotels-da-nang.html', 'a family hotel in Da Nang', [{ s: 'sheraton-grand-da-nang', label: 'Top pick' }, { lite: 'Da Nang Mikazuki Japanese Resorts & Spa', label: 'Signature pick' }, 'hyatt-regency-da-nang', 'furama-resort-da-nang', 'premier-village-da-nang', 'melia-da-nang']],
  ['da-nang-beach-hotels.html', 'a beach hotel in Da Nang', [{ s: 'intercontinental-da-nang', label: 'Top pick' }, { s: 'sheraton-grand-da-nang', label: 'Signature pick' }, 'hyatt-regency-da-nang', 'pullman-da-nang', 'furama-resort-da-nang', 'premier-village-da-nang']],
  ['da-nang-hotels-infinity-pool.html', 'a Da Nang hotel with an infinity pool', [{ s: 'intercontinental-da-nang', label: 'Our #1' }, 'a-la-carte-da-nang', 'naman-retreat-da-nang', 'hyatt-regency-da-nang', 'premier-village-da-nang']],
  ['da-nang-hotels-private-pool-villa.html', 'a private pool villa in Da Nang', ['naman-retreat-da-nang', 'premier-village-da-nang', 'intercontinental-da-nang', 'tia-wellness-resort-da-nang']],
  ['da-nang-riverfront-hotels.html', 'a riverside hotel in Da Nang', [{ lite: 'Caro Hotel Da Nang', label: 'Top pick' }, { lite: 'Wink Hotel Danang Riverside', label: 'Signature pick' }, 'novotel-da-nang-han-river', 'grand-mercure-da-nang']],
  ['best-han-river-hotels-da-nang.html', 'a Han River hotel', [{ lite: 'CARO Hotel', label: 'Top pick' }, 'novotel-da-nang-han-river', 'brilliant-hotel-da-nang', 'grand-mercure-da-nang']],
  ['best-hotels-near-my-khe-beach.html', 'a hotel near My Khe Beach', [{ s: 'tms-hotel-da-nang', label: 'Top pick' }, { lite: 'CHICLAND Hotel', label: 'Signature pick' }, 'muong-thanh-luxury-da-nang', 'a-la-carte-da-nang']],
  ['best-resorts-son-tra-peninsula.html', 'a resort on Son Tra Peninsula', ['intercontinental-da-nang', 'premier-village-da-nang', 'naman-retreat-da-nang']],
  ['non-nuoc-beach-da-nang.html', 'a hotel on Non Nuoc Beach', ['hyatt-regency-da-nang', 'sheraton-grand-da-nang', 'melia-da-nang', 'naman-retreat-da-nang', 'tia-wellness-resort-da-nang', 'furama-resort-da-nang']],
  ['best-hotels-in-hoi-an.html', 'the best hotel in Hoi An', [{ lite: 'Four Seasons Resort The Nam Hai', label: 'Editor\u2019s pick' }, { lite: 'Anantara Hoi An Resort', label: 'Signature pick' }], 'hoian'],
  ['boutique-hotels-da-nang.html', 'a boutique hotel in Da Nang', [{ lite: 'Minh Boutique Hotel', label: 'Top pick' }, { lite: 'CHICLAND Hotel Da Nang', label: 'Signature pick' }]],
  ['best-hotels-an-thuong-da-nang.html', 'a hotel in An Thuong', [{ lite: 'M Hotel Danang', label: 'Top pick' }, { lite: 'Saha Casa Boutique Hotel', label: 'Signature pick' }]],
  ['best-budget-hotels-in-da-nang.html', 'a budget hotel in Da Nang', []]
];

function lite(main, name, label, file) {
  // the pick block: first occurrence of the name in a heading-like element after the old hero, then the next hotel registry button
  const ents = name.replace(/&/g, '&amp;');
  let i = -1; for (const n of [ents, name]) { const re = new RegExp(`>\\s*${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`, 'g'); let m; while ((m = re.exec(main))) { if (main.lastIndexOf('<h', m.index) > main.lastIndexOf('</h', m.index)) { i = m.index; break; } } if (i >= 0) break; }
  if (i < 0) throw new Error(`${file}: pick "${name}" not found in a heading`);
  const k = main.indexOf('data-tc-key="hotel:', i); if (k < 0) throw new Error(`${file}: no hotel button after "${name}"`);
  const key = main.slice(k + 13, main.indexOf("\"", k + 13)); const e = reg.find(r => r.key === key);
  if (!e || e.status !== 'VERIFIED' || !e.affiliate_url) throw new Error(`${file}: unverified key ${key}`);
  // element texts between the name and the button: first one with "·" is the area/type line, first long one is the verdict
  const parts = main.slice(main.indexOf('>', i) + 1, k).split(/<[^>]+>/).map(x => decode(x).replace(/\s+/g, ' ').trim()).filter(Boolean).filter(x => x !== name && x !== decode(ents));
  const areaRaw = parts.find(x => x.includes('\u00b7') && x.length < 120) || '';
  const areaLine = areaRaw.split('\u00b7').map(x => x.trim()).filter(x => x && !/^\$+$/.test(x)).join(' \u00b7 ');
  const para = parts.find(x => x.length > 40 && x !== areaRaw) || ''; const why = (para.match(/^.*?[.!?](?=\s|$)/) || [para])[0];
  const review = (() => { const r = main.lastIndexOf('href="', k); const j = main.indexOf('href="', i); if (j > 0 && j < k + 2000) { const href = main.slice(j + 6, main.indexOf('"', j + 6)); if (/^[a-z0-9-]+\.html$/.test(href)) return href; } return null; })();
  const btn = C.tc(e, 'Check Room Prices', 'rr-cat-card', { block: true, hotel: name });
  return `<article class="sc sc--lite"><div class="sc__body"><p class="sc__tier">${esc(label || '')}</p><h3 class="sc__name">${review ? `<a href="${review}">${esc(name)}</a>` : esc(name)}</h3>${areaLine ? `<p class="sc__meta">${esc(areaLine)}</p>` : ''}${why ? `<p class="sc__why">${esc(why)}</p>` : ''}<div class="sc__cta">${btn}</div>${review ? `<p class="sc__links"><a href="${review}">Read our review</a></p>` : '<p class="sc__links"><a href="#rr-guide">Read why we picked it</a></p>'}</div></article>`;
}

function build(file, intent, picks, dest, h) {
  const a = h.indexOf('<main'), z = h.indexOf('</main>'); const main = h.slice(a, z);
  const cards = [], names = [], rows = [];
  for (const p of picks) {
    const o = typeof p === 'string' ? { s: p } : p;
    if (o.s) { cards.push(S.card(o.s, { badge: o.label, loc: 'rr-cat-card' })); names.push([nm(FACTS[o.s]), FACTS[o.s].review, o.label]); const hh = FACTS[o.s]; rows.push(`<tr><td><a href="${esc(hh.review)}">${esc(nm(hh))}</a></td><td>${esc(hh.area_label || '')}</td><td>${esc(({ beachfront: 'Beachfront', short_walk: 'Short walk', not_beach: 'No' })[((hh.research || {}).beach_access || {}).value] || '')}</td><td>${esc(hh.editorial.bestFor)}</td><td>${C.hotelBtn(o.s, 'rr-cat-table', { compact: true, label: 'Prices' })}</td></tr>`); }
    else { cards.push(lite(main, o.lite, o.label, file)); names.push([o.lite, null, o.label]); }
  }
  const named = names.filter(n => n[2]);
  const answer = named.length ? `<strong>Short answer:</strong> for ${esc(intent)}, ${named.map((n, i) => `${i ? 'our ' + esc(n[2].toLowerCase()) + ' is ' : 'our ' + esc(n[2].toLowerCase()) + ' is '}<strong>${esc(n[0])}</strong>`).join('; ')}.${picks.length > named.length ? ' The other hotels below are strong alternatives for different trips.' : ''} Each card says who it suits and its main drawback.`
    : names.length ? `<strong>Short answer:</strong> for ${esc(intent)}, start with <strong>${esc(names[0][0])}</strong>, then compare the alternatives below.` : `<strong>Short answer:</strong> for ${esc(intent)}, choose the area first, then compare current prices for your dates. Our area-by-area picks are in the guide below.`;
  const table = rows.length > 1 ? `<h3 class="rr-h3">At a glance</h3><div class="rr-cmp-wrap"><table class="rr-cmp"><thead><tr><th>Hotel</th><th>Area</th><th>On the beach</th><th>Best for</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '';
  const body = `<section class="rr-sec rr" id="rr-picks" aria-labelledby="rr-cat-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-cat-h">Our picks</h2><div class="rr-answer"><p>${answer}</p></div>
${cards.length ? `<div class="sc-grid sc-grid--rail">${cards.join('\n')}</div>` : ''}
${table}
<div class="rr-bottom" style="margin-top:18px">${C.destBtn(dest || 'danang', 'rr-cat-search', { ghost: true, label: `Compare All ${dest === 'hoian' ? 'Hoi An' : 'Da Nang'} Hotel Prices` })}<a href="#rr-guide">Read the full guide</a><a href="compare-hotels.html">Compare hotels side by side</a></div>
${S.disclosure('Hotel buttons open that hotel on Trip.com with live prices for your dates; the \u201ccompare all\u201d button opens a city-wide search. We are independent and may earn a commission if you book, at no extra cost to you.')}</div></section>
<span id="rr-guide" class="rr-anchor"></span>`;
  return body;
}

function slimHero(h, file) {
  if (/<header class="rr-hero/.test(h.slice(h.indexOf('<main')))) return h;
  const m = h.indexOf('<main'); const a = h.indexOf('<header class="dn-hero', m); if (a < 0) throw new Error(file + ': no hero'); const z = h.indexOf('</header>', a) + 9;
  const hero = h.slice(a, z);
  const h1 = (hero.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]; if (!h1) throw new Error(file + ': no h1');
  const lede = (hero.match(/<p class="dn-lede">([\s\S]*?)<\/p>/) || [])[1] || '';
  const img = (hero.match(/<img[^>]*src="([^"]+)"/) || [])[1];
  const meta = (hero.match(/<p class="dn-hero__meta">([\s\S]*?)<\/p>/) || hero.match(/<p class="[^"]*(?:byline|meta)[^"]*">([\s\S]*?)<\/p>/) || [])[1] || '';
  const nh = `<header class="rr-hero rr-hero--slim">${img ? `<img class="rr-hero__img" src="${img}" alt="" fetchpriority="high" decoding="async">` : ''}<div class="rr-hero__in"><h1>${h1}</h1>${lede ? `<p class="rr-lede">${lede}</p>` : ''}<div class="rr-hero__acts"><a class="rr-btn rr-btn--main" href="#rr-picks">See our picks &amp; check prices</a></div>${meta ? `<p class="rr-hero__meta">${meta}</p>` : ''}</div></header>`;
  return h.slice(0, a) + nh + h.slice(z);
}

let n = 0;
for (const [file, intent, picks, dest] of PAGES) {
  const p = path.join(ROOT, file); let h = fs.readFileSync(p, 'utf8'); const o = h;
  h = h.replace(/<!--dn-c3:r:(hero|dates|compare|return)-->[\s\S]*?<!--\/dn-c3:r:\1-->\n?/g, '');
  h = h.replace(/<!--rr:cat-->[\s\S]*?<!--\/rr:cat-->\n?/, '');
  h = slimHero(h, file);
  const body = build(file, intent, picks, dest, h);
  const hz = h.indexOf('</header>', h.indexOf('<header class="rr-hero', h.indexOf('<main'))) + 9;
  h = h.slice(0, hz) + `\n<!--rr:cat-->\n${body}\n<!--/rr:cat-->\n` + h.slice(hz).replace(/^\n+/, '');
  if (!/dn-shop\.css/.test(h)) h = h.replace('</head>', '<link rel="stylesheet" href="dn-shop.css">\n</head>');
  if (!/dn-shortlist\.js/.test(h)) h = h.replace('</body>', '<script src="dn-shortlist.js" defer></script>\n</body>');
  if (!/<html[^>]*data-layout=/.test(h)) h = h.replace(/<html([^>]*)>/, '<html$1 data-layout="reset1">');
  if (h !== o) { fs.writeFileSync(p, h); n++; }
}
// Directory and map: optional tools, not steps. Slim hero, shortcuts to the curated shortlists, then the tool itself.
for (const [file, what] of [['da-nang-hotel-directory.html', 'the full directory'], ['da-nang-hotels-map.html', 'the map']]) {
  const p = path.join(ROOT, file); let h = fs.readFileSync(p, 'utf8'); const o = h;
  h = h.replace(/<!--dn-c3:r:(hero|dates|compare|return)-->[\s\S]*?<!--\/dn-c3:r:\1-->\n?/g, '').replace(/<!--rr:cat-->[\s\S]*?<!--\/rr:cat-->\n?/, '');
  h = slimHero(h, file).replace('href="#rr-picks">See our picks &amp; check prices</a>', 'href="#rr-guide">Browse ' + what + '</a>');
  const body = `<section class="rr-sec rr-sec--soft" id="rr-picks" aria-labelledby="rr-tool-h"><div class="rr-wrap"><h2 class="rr-h2" id="rr-tool-h">Want a shortlist instead?</h2><p class="rr-sub">Start from our curated picks by hotel type, or <a href="find-your-hotel.html">filter verified hotels in one tap</a>. Every hotel below links to that hotel on Trip.com for live prices.</p>${S.tiles()}</div></section>\n<span id="rr-guide" class="rr-anchor"></span>`;
  const hz = h.indexOf('</header>', h.indexOf('<header class="rr-hero', h.indexOf('<main'))) + 9;
  h = h.slice(0, hz) + `\n<!--rr:cat-->\n${body}\n<!--/rr:cat-->\n` + h.slice(hz).replace(/^\n+/, '');
  if (!/dn-shop\.css/.test(h)) h = h.replace('</head>', '<link rel="stylesheet" href="dn-shop.css">\n</head>');
  if (!/<html[^>]*data-layout=/.test(h)) h = h.replace(/<html([^>]*)>/, '<html$1 data-layout="reset1">');
  if (h !== o) { fs.writeFileSync(p, h); n++; }
}
console.log('category + tool pages rebuilt:', n);
