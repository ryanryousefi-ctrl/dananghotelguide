#!/usr/bin/env node
// Hotel-review conversion modules (idempotent). Reuses each page's OWN primary Trip.com anchor (same href, key, attributes), so no affiliate URL is created or edited.
//   early   : "Considering <Hotel>?" decision module after the quick-verdict section
//   alts    : price-check buttons for the genuine alternatives the page already links to (their own verified primary anchors)
//   end     : hotel-specific label on the existing end CTA; a new end module on pages that lack one
//   node scripts/revenue/apply-reviews.js [--check]
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'); const CHECK = process.argv.includes('--check');
const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')); const redirected = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = s => s.replace(/&amp;/g, '&').replace(/&rarr;/g, '→').replace(/&#39;/g, "'");
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !redirected.has(f));
const ANCHOR = /<a [^>]*data-tc-key="hotel:[^"]*"[^>]*>[\s\S]*?<\/a>/g;
function primary(html) {
  // Prefer the page's dedicated end-CTA anchor, else the first hotel anchor carrying data-hotel.
  const cands = [...html.matchAll(ANCHOR)].map(m => m[0]).filter(a => /data-hotel="/.test(a) && /href="https:\/\/www\.trip\.com\//.test(a));
  return cands[0] || null;
}
const attr = (a, n) => { const m = a.match(new RegExp(`\\s${n}="([^"]*)"`)); return m ? m[1] : ''; };
const pages = new Map();
for (const f of files) { const h = fs.readFileSync(path.join(ROOT, f), 'utf8'); if (!/hr-take/.test(h) || !/class="hr-snapshot"/.test(h)) continue; const a = primary(h); if (a) pages.set(f, { html: h, anchor: a, hotel: unesc(attr(a, 'data-hotel')), key: attr(a, 'data-tc-key'), href: attr(a, 'href') }); }
const label = (name, tail) => (name.length <= 30 ? `Check ${name} ${tail}` : `Check ${tail === 'Prices' ? 'Room Prices' : tail}`);
function build(a, text, loc, cls) {
  let x = a.replace(/class="[^"]*"/, `class="${cls || 'dn-booklink affiliate-link dn-btn dn-btn--book tc-btn'}"`).replace(/data-cta-location="[^"]*"/, `data-cta-location="${loc}"`);
  if (!/data-cta-location=/.test(x)) x = x.replace(/<a /, `<a data-cta-location="${loc}" `);
  x = x.replace(/aria-label="[^"]*"/, `aria-label="${esc(text)} on Trip.com, opens in a new tab"`);
  return x.replace(/>[\s\S]*<\/a>$/, `><span class="tc-btn__text">${esc(text)} &rarr;</span></a>`);
}
const snap = (html, key) => { const m = html.match(new RegExp(`<div class="hr-snap-key">${key}</div><div class="hr-snap-val">([^<]*)</div>`)); return m ? unesc(m[1]).trim() : ''; };
let changed = 0, early = 0, alts = 0, ends = 0, relabeled = 0; const skipped = [];
for (const [f, p] of pages) {
  let h = p.html; const name = p.hotel;
  // 1. early module after the quick-verdict section
  if (!/<!--dn-revenue:early-->/.test(h)) {
    const i = h.indexOf('<section class="hr-section hr-take">'); const j = i < 0 ? -1 : h.indexOf('</section>', i);
    if (i >= 0 && j > 0 && h.slice(i + 10, j).indexOf('<section') < 0) {
      const best = snap(h, 'Best for'), area = snap(h, 'Area');
      const lc = w => (/^[A-Z][a-z]+ [A-Z]/.test(w) || /^(Bonvoy|Han|Dragon|My|Hoi|Da|Non|Son|Hilton|Accor|IHG|Marriott|Hyatt)\b/.test(w)) ? w : w.charAt(0).toLowerCase() + w.slice(1);
      const bits = [best && `Best for ${lc(best)}`, area && `in ${area}`].filter(Boolean).join(' ');
      const copy = `${bits ? bits.replace(/\.$/, '') + '. ' : ''}Rates and availability change daily: check current room prices for your dates on Trip.com.`;
      const mod = `\n<!--dn-revenue:early--><section class="hr-section dn-decide dn-decide--early" aria-label="Check ${esc(name)} prices"><div class="hr-section-inner dn-decide__inner"><div class="dn-decide__copy"><p class="dn-decide__kicker">Considering ${esc(name)}?</p><p class="dn-decide__text">${esc(copy)}</p></div>${build(p.anchor, label(name, 'Prices'), 'early_review')}</div></section><!--/dn-revenue:early-->`;
      h = h.slice(0, j + 10) + mod + h.slice(j + 10); early++;
    } else skipped.push(f + ' (no verdict anchor)');
  }
  // 2. alternatives: price buttons for the related-card pages that have their own verified primary anchor
  if (!/<!--dn-revenue:alts-->/.test(h)) {
    const gi = h.indexOf('<div class="hr-related-grid">'); const ge = gi < 0 ? -1 : h.indexOf('</div></a></div>', gi);
    if (gi >= 0 && ge > 0) {
      const grid = h.slice(gi, ge + 16); const hrefs = [...grid.matchAll(/<a href="([^"#?]+\.html)" class="hr-related-card"/g)].map(m => m[1]).slice(0, 3);
      const btns = []; for (const t of hrefs) { const q = pages.get(t) || (() => { try { const th = fs.readFileSync(path.join(ROOT, t), 'utf8'); const a = primary(th); return a && { anchor: a, hotel: unesc(attr(a, 'data-hotel')) }; } catch { return null; } })(); if (q && q.hotel && q.anchor !== p.anchor) btns.push(build(q.anchor, `${q.hotel.length <= 26 ? q.hotel : q.hotel.split(' ').slice(0, 3).join(' ')} Prices`, 'alternatives', 'dn-booklink affiliate-link tc-btn tc-btn--compact')); }
      if (btns.length >= 2) { const mod = `<!--dn-revenue:alts--><div class="dn-decide__alts"><p class="dn-decide__kicker">Deciding between these hotels? Check each one for your dates</p><div class="dn-decide__row">${btns.join('')}</div></div><!--/dn-revenue:alts-->`; h = h.slice(0, ge + 16) + mod + h.slice(ge + 16); alts++; }
    }
  }
  // 3. end CTA: hotel-specific label on the existing one; a new end module where there is none
  const endRe = /(<section class="hr-section hr-cta">[\s\S]*?)(<a [^>]*data-tc-key="hotel:[^"]*"[^>]*>)<span class="tc-btn__text">([^<]*)<\/span><\/a>/;
  const em = h.match(endRe);
  if (em && !/Rates &amp; Availability/.test(em[3])) {
    const text = name.length <= 34 ? `Check ${name} Rates & Availability` : 'Check Rates & Availability';
    const a2 = em[2].replace(/aria-label="[^"]*"/, `aria-label="${esc(text)} on Trip.com, opens in a new tab"`);
    h = h.replace(endRe, `$1${a2.replace(/\$/g, '$$$$')}<span class="tc-btn__text">${esc(text).replace(/\$/g, '$$$$')} &rarr;</span></a>`); relabeled++;
  } else if (!em && !/<!--dn-revenue:end-->/.test(h)) {
    const ri = h.search(/<section class="hr-section"[^>]*>\s*<div class="hr-section-inner">\s*<span class="hr-label">Compare Before You Book/);
    if (ri >= 0) { const mod = `<!--dn-revenue:end--><section class="hr-section hr-cta"><div class="hr-section-inner hr-cta-inner"><span class="hr-label">Ready to check prices?</span><h2 class="hr-h2">Ready to check prices?</h2><p class="hr-cta-text">You have read the review. Rates change constantly, so check the current price and availability for your dates before you decide.</p>${build(p.anchor, name.length <= 34 ? `Check ${name} Rates & Availability` : 'Check Rates & Availability', 'booking_review')}</div></section><!--/dn-revenue:end-->\n`; h = h.slice(0, ri) + mod + h.slice(ri); ends++; } else skipped.push(f + ' (no end anchor)');
  }
  if (h !== p.html) { changed++; if (!CHECK) fs.writeFileSync(path.join(ROOT, f), h); }
}
console.log(`review pages found ${pages.size} | changed ${changed} | early ${early} | alts ${alts} | new end ${ends} | end relabeled ${relabeled}${CHECK ? ' (dry run)' : ''}`); if (skipped.length) console.log('skipped:', skipped.join('; '));
