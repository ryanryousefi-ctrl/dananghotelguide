#!/usr/bin/env node
// Stage A: homepage commercial hierarchy. Idempotent via <!--dn-c3:home:NAME--> markers.
'use strict';
const fs = require('fs'), path = require('path'); const C = require('./components');
const ROOT = path.resolve(__dirname, '..', '..'), F = path.join(ROOT, 'index.html'); let h = fs.readFileSync(F, 'utf8');
const wrap = (n, b) => `<!--dn-c3:home:${n}-->${b}<!--/dn-c3:home:${n}-->`;
h = h.replace(/<!--dn-c3:home:([a-z]+)-->[\s\S]*?<!--\/dn-c3:home:\1-->\n?/g, '');
const after = (marker, html) => { const i = h.indexOf(marker); if (i < 0) throw new Error('marker not found: ' + marker.slice(0, 40)); const j = h.indexOf('</section>', i) + 10; h = h.slice(0, j) + '\n' + html + '\n' + h.slice(j); };
// 1. price-comparison action right after the intro/finder/quick-line block (before collections)
const q = h.indexOf('<!--dn-revenue:home-quick-->'); const qe = h.indexOf('\n', q);
h = h.slice(0, qe) + '\n' + wrap('hero', C.heroPrice({ id: 'dh-pc-h', light: true, kicker: 'Hotel prices', title: 'Find the right area, then check prices for your dates', copy: 'Explore independent hotel recommendations for Da Nang and Hoi An, then check actual room prices on Trip.com for your travel dates.', secondaryLabel: 'Plan My Stay', secondaryHref: 'find-your-hotel.html', loc: 'p3-home-hero' })) + h.slice(qe);
// 2. editor's picks after the neighbourhood section
after('aria-labelledby="dh-h-nb"', wrap('picks', `<section class="dnc dnc-sec" aria-labelledby="dh-picks-h"><div class="dnc-wrap"><p class="dnc-kicker">Editor's hotel picks</p><h2 class="dnc-h" id="dh-picks-h">Six hotels worth checking</h2><p class="dnc-sub">One or two from each part of town. Our opinions; rates and availability are on Trip.com.</p>${C.cards(['novotel-da-nang-han-river', 'a-la-carte-da-nang', 'pullman-da-nang', 'furama-resort-da-nang', 'hyatt-regency-da-nang', 'intercontinental-da-nang'], { loc: 'p3-home-pick' })}<div class="dnc-actions"><a class="dnc-ghost" href="compare-hotels.html" data-dn-saved-nav>Compare &amp; Saved</a><a class="dnc-ghost" href="find-your-hotel.html">Da Nang Stay Planner</a><a class="dnc-ghost" href="where-to-stay-in-da-nang.html">Where to stay in Da Nang</a></div></div></section>`));
// 3. compare module after the reviews section
after('aria-labelledby="dh-h-rv"', wrap('compare', C.compareModule('novotel-da-nang-han-river', 'hilton-da-nang', { loc: 'p3-home-compare', sub: 'Two Han River hotels, one decision.' })));
if (!/dn-commerce\.css/.test(h)) h = h.replace('<link rel="stylesheet" href="tripcom-cta.css">', '<link rel="stylesheet" href="tripcom-cta.css">\n<link rel="stylesheet" href="dn-commerce.css">');
if (!/dn-shortlist\.js/.test(h)) h = h.replace('<script src="tripcom-cta.js" defer></script>', '<script src="tripcom-cta.js" defer></script>\n<script src="dn-shortlist.js" defer></script>');
fs.writeFileSync(F, h); console.log('home updated');
