#!/usr/bin/env node
// Withdraws reviews of hotels we could not verify exist (Nov 2026 fact-check). Keeps the URL (no broken inbound links),
// replaces the content with an honest notice, sets noindex,follow, removes Hotel/Review schema and drops the page from the sitemap.
// Idempotent. Original content stays in git history (commit before this change) if the owner can verify the property.
'use strict';
const fs = require('fs'), path = require('path'); const C = require('../revenue3/components'); const ROOT = path.resolve(__dirname, '..', '..');
const PAGES = {
  'azura-da-nang.html': { name: 'Azura Da Nang', why: 'We found no hotel called "Azura Da Nang" on Trip.com, Expedia, Hotels.com or other major listings, or on an official site. The closest name, Azure Hotel Danang, is a different property in Son Tra that we have not reviewed.', alt: [['best-han-river-hotels-da-nang.html', 'Han River hotels we have reviewed'], ['boutique-hotels-da-nang.html', 'Boutique hotels in Da Nang'], ['find-your-hotel.html', 'Da Nang Stay Planner']] },
  'silk-path-grand-da-nang.html': { name: 'Silk Path Grand Resort & Spa Danang', why: 'We found no Silk Path Grand property in Da Nang on Trip.com, Expedia, Hotels.com or the brand\'s own listings. The Silk Path Grand hotels we could find are in Hue and Sapa.', alt: [['best-hotels-near-my-khe-beach.html', 'Hotels near My Khe Beach'], ['luxury-hotels-da-nang.html', 'Luxury resorts in Da Nang'], ['find-your-hotel.html', 'Da Nang Stay Planner']] },
};
let sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
for (const [f, o] of Object.entries(PAGES)) {
  const p = path.join(ROOT, f); let h = fs.readFileSync(p, 'utf8');
  const title = `${o.name}: Review Withdrawn`, desc = `We withdrew our ${o.name} review after a November 2026 fact-check could not confirm the property operates in Da Nang. See our verified alternatives.`;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${C.esc(title)}</title>`).replace(/(<meta name="description" content=")[^"]*(")/, `$1${C.esc(desc)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${C.esc(title)}$2`).replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${C.esc(desc)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${C.esc(title)}$2`).replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${C.esc(desc)}$2`)
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">');
  if (!/name="robots"/.test(h)) h = h.replace('</title>', '</title>\n<meta name="robots" content="noindex, follow">');
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  h = h.replace('</title>', `</title>\n<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebPage', name: title, description: desc })}</script>`);
  const m0 = h.search(/<main\b[^>]*>/), m1 = h.lastIndexOf('</main>'); const open = h.match(/<main\b[^>]*>/)[0];
  const main = `${open}
<header class="dn-hero dn-hero--plain"><div class="dn-hero__inner"><p class="dn-eyebrow">Editorial notice · November 2026</p><h1>${C.esc(o.name)}: review withdrawn</h1>
<p class="dn-lede">We have removed this review. ${C.esc(o.why)}</p></div></header>
<section class="dnc dnc-sec"><div class="dnc-wrap"><h2 class="dnc-h">Why we withdrew it</h2><p class="dnc-sub" style="max-width:70ch">During a fact-check of every hotel on this site we look for the property on official and booking-site listings. When we cannot confirm a hotel exists under the name we used, we take the review down rather than leave unverified information online. If you know this property by another name, contact us and we will check it.</p>
<h2 class="dnc-h">Verified alternatives</h2><ul class="dnc-sub" style="max-width:70ch;padding-left:1.2rem">${o.alt.map(([u, t]) => `<li style="margin:.35rem 0"><a href="${u}">${C.esc(t)}</a></li>`).join('')}</ul>
<div class="dnc-actions">${C.destBtn('danang', 'withdrawn-page', { label: 'Compare Da Nang Hotel Prices' })}</div><p class="dnc-note">Trip.com is an affiliate partner; this search covers all of Da Nang.</p></div></section>
`;
  h = h.slice(0, m0) + main + h.slice(m1);
  if (!/dn-commerce\.css/.test(h)) h = h.replace('<link rel="stylesheet" href="tripcom-cta.css">', '<link rel="stylesheet" href="tripcom-cta.css">\n<link rel="stylesheet" href="dn-commerce.css">');
  fs.writeFileSync(p, h);
  sm = sm.replace(new RegExp(`\\s*<url>\\s*<loc>https://www\\.dananghotelguide\\.com/${f.replace('.', '\\.')}</loc>[\\s\\S]*?</url>`), '');
}
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);
console.log('withdrawn:', Object.keys(PAGES).join(', '));
