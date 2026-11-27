#!/usr/bin/env node
// Operation Revenue Reset: one canonical, shopping-first site navigation (desktop + mobile menu) on every page that has the site header.
// Primary: Find Hotels, Best Hotels, Where to Stay, Compare Hotels, Saved Hotels. Secondary pages move under "More". Idempotent.
// Only the header/menu markup changes; <main> (and therefore every review) is untouched.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const caret = '<svg class="dn-caret" viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
const MENU = [
  { key: 'find', label: 'Find Hotels', href: 'find-your-hotel.html' },
  { key: 'best', label: 'Best Hotels', href: 'best-hotels-in-da-nang.html', items: [['best-hotels-in-da-nang.html', 'Best Hotels in Da Nang'], ['luxury-hotels-da-nang.html', 'Luxury Resorts'], ['family-hotels-da-nang.html', 'Family Hotels'], ['da-nang-beach-hotels.html', 'Beachfront Hotels'], ['da-nang-riverfront-hotels.html', 'City &amp; River Hotels'], ['boutique-hotels-da-nang.html', 'Boutique Hotels'], ['best-budget-hotels-in-da-nang.html', 'Best Value'], ['da-nang-hotels-private-pool-villa.html', 'Private Pool Villas'], ['best-hotels-in-hoi-an.html', 'Hoi An Hotels'], ['da-nang-hotel-directory.html', 'Hotel Directory'], ['da-nang-hotels-map.html', 'Hotels Map']] },
  { key: 'stay', label: 'Where to Stay', href: 'where-to-stay-in-da-nang.html', items: [['where-to-stay-in-da-nang.html', 'Where to Stay in Da Nang'], ['best-hotels-near-my-khe-beach.html', 'My Khe Beach'], ['best-hotels-an-thuong-da-nang.html', 'An Thuong'], ['best-han-river-hotels-da-nang.html', 'Han River'], ['best-resorts-son-tra-peninsula.html', 'Son Tra Peninsula'], ['non-nuoc-beach-da-nang.html', 'Non Nuoc Beach'], ['where-to-stay-in-hoi-an.html', 'Where to Stay in Hoi An'], ['where-to-stay-between-da-nang-and-hoi-an.html', 'Between Da Nang &amp; Hoi An']] },
  { key: 'compare', label: 'Compare Hotels', href: 'compare-hotels.html' },
  { key: 'saved', label: 'Saved', href: 'compare-hotels.html', saved: true },
  { key: 'more', label: 'More', href: 'guides.html', items: [['hotel-reviews.html', 'Hotel Reviews'], ['guides.html', 'Travel Guides'], ['things-to-do-in-da-nang.html', 'Things To Do'], ['da-nang-itinerary.html', 'Itineraries'], ['dining.html', 'Dining'], ['da-nang-nightlife-guide.html', 'Nightlife'], ['hoi-an.html', 'Hoi An Guide'], ['news.html', 'News'], ['da-nang-videos.html', 'Videos'], ['da-nang-guide-for-korean-travelers.html', '한국어 가이드'], ['about.html', 'About']] }
];
function group(f) {
  if (f === 'find-your-hotel.html') return 'find';
  if (f === 'compare-hotels.html') return 'compare';
  if (/^where-to-stay|^best-hotels-near|an-thuong|son-tra|non-nuoc|han-river/.test(f)) return 'stay';
  if (/^(best-|luxury-|family-|boutique-|da-nang-beach-hotels|da-nang-riverfront|da-nang-hotels-|da-nang-hotel-directory)/.test(f) || /hotels/.test(f)) return 'best';
  return null;
}
const savedAttr = 'data-dn-saved-nav data-dn-saved-label="Saved"';
function desktop(active) {
  return `<nav class="dn-nav" aria-label="Main navigation"><ul>${MENU.map(m => {
    const cls = 'dn-top' + (m.key === active ? ' is-active' : '');
    if (!m.items) return `<li><a class="${cls}" href="${m.href}"${m.saved ? ' ' + savedAttr : ''}>${m.label}</a></li>`;
    return `<li class="dn-has-drop"><a class="${cls}" href="${m.href}" aria-haspopup="true" aria-expanded="false">${m.label}${caret}</a><div class="dn-drop"><ul>${m.items.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div></li>`;
  }).join('')}</ul></nav>`;
}
function mobile() {
  return `<div class="dn-menu__inner">\n    <a class="dn-menu__link" href="index.html">Home</a> ${MENU.map(m => m.items ? `<details class="dn-menu__group"><summary>${m.label}</summary><div>${m.items.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</div></details>` : `<a class="dn-menu__link" href="${m.href}"${m.saved ? ' ' + savedAttr : ''}>${m.label}</a>`).join(' ')}\n    `;
}
let n = 0;
for (const f of fs.readdirSync(ROOT).filter(x => x.endsWith('.html'))) {
  const p = path.join(ROOT, f); let h = fs.readFileSync(p, 'utf8'); const o = h;
  const i = h.indexOf('<nav class="dn-nav"'); if (i < 0) continue;
  // the nav contains no nested <nav>, so its first </nav> closes it
  h = h.slice(0, i) + desktop(group(f)) + h.slice(h.indexOf('</nav>', i) + 6);
  const mi = h.indexOf('<div class="dn-menu__inner">');
  if (mi >= 0) { const me = h.indexOf('<a data-provider="tripcom"', mi); const ms = h.indexOf('<p class="dn-menu__social">', mi); const end = me > 0 && (ms < 0 || me < ms) ? me : ms; if (end > mi) h = h.slice(0, mi) + mobile() + h.slice(end); }
  // header city search: label it as what it is (a city-wide search), href untouched
  h = h.replace(/(class="nav-stays-btn[^"]*"[^>]*><span class="tc-btn__text"><span class="btn-text">)Search Stays(<\/span>)/, '$1Da Nang Hotel Prices$2').replace(/aria-label="Search Stays on Trip\.com, opens in a new tab"/g, 'aria-label="Compare Da Nang hotel prices on Trip.com, opens in a new tab"').replace(/(class="mobile-stays-btn[^"]*"[^>]*><span class="tc-btn__text">)Search Stays( &rarr;<\/span>)/, '$1Compare Da Nang Hotel Prices$2');
  if (h !== o) { fs.writeFileSync(p, h); n++; }
}
console.log('nav: updated', n, 'pages');
