#!/usr/bin/env node
// Builds new decision-support guides from the site's own reviewed facts (each hotel claim below is taken from that hotel's review page on this site).
// Hotel CTAs reuse each hotel's own primary Trip.com anchor from its review page (same href), so no affiliate URL is created.
//   node scripts/revenue/new-articles.js [--check]
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'); const CHECK = process.argv.includes('--check');
const TODAY = '2026-11-23'; const SITE = 'https://www.dananghotelguide.com/';
const T = fs.readFileSync(path.join(ROOT, 'da-nang-hotels-near-airport.html'), 'utf8'); // template: head, chrome and footer
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsEsc = s => String(s).replace(/’/g, "'");
const attr = (a, n) => { const m = a.match(new RegExp(`\\s${n}="([^"]*)"`)); return m ? m[1] : ''; };
function primary(file) { const h = fs.readFileSync(path.join(ROOT, file), 'utf8'); const c = [...h.matchAll(/<a [^>]*data-tc-key="hotel:[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map(m => m[0]).filter(a => /data-hotel="/.test(a) && /href="https:\/\/www\.trip\.com\//.test(a)); if (!c.length) throw new Error('no verified primary anchor in ' + file); return c[0]; }
function cta(file, text, loc, cls) { let a = primary(file); a = a.replace(/class="[^"]*"/, `class="${cls || 'hotel-card-cta dn-booklink affiliate-link dn-btn dn-btn--book tc-btn'}"`).replace(/data-cta-location="[^"]*"/, `data-cta-location="${loc}"`); if (!/data-cta-location=/.test(a)) a = a.replace(/<a /, `<a data-cta-location="${loc}" `); a = a.replace(/aria-label="[^"]*"/, `aria-label="${esc(text)} on Trip.com, opens in a new tab"`); return a.replace(/>[\s\S]*<\/a>$/, `><span class="tc-btn__text">${esc(text)} &rarr;</span></a>`); }
const hotelCard = (h, i) => `<div class="hotel-card">${h.img ? `\n      <img class="hotel-card-img" src="${h.img}" alt="${esc(h.alt || h.name)}" loading="lazy" width="800" height="220">` : ''}
      <div class="hotel-card-header">
        <div class="hotel-card-rank">${String(i + 1).padStart(2, '0')}</div>
        <div style="flex:1;"><div class="hotel-card-title"><a href="${h.review}" style="color:var(--ocean)">${esc(h.name)}</a></div><div style="font-size:.8rem;color:var(--ink-muted);margin-top:2px;">${esc(h.meta)}</div></div>
        ${h.badge ? `<div class="hotel-card-time">${esc(h.badge)}</div>` : ''}
      </div>
      ${h.paras.map(p => `<p>${p}</p>`).join('\n')}
      ${cta(h.review, h.cta, 'article_hotel')}
      <p style="margin:.6rem 0 0;font-size:.85rem;"><a href="${h.review}">Read our full ${esc(h.short || h.name)} review</a></p>
    </div>`;
const ARTICLES = require('./articles-data.js');
let wrote = 0;
for (const A of ARTICLES) {
  const out = path.join(ROOT, A.slug + '.html'); if (fs.existsSync(out) && !process.argv.includes('--force')) { console.log('exists, skipped:', A.slug); continue; }
  const url = SITE + A.slug + '.html';
  let h = T;
  const cut = h.indexOf('</head>'); let head = h.slice(0, cut), rest = h.slice(cut);
  head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(A.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(A.description)}$2`).replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(A.title)}$2`).replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(A.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`).replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${SITE}${A.hero}$2`);
  const ld = [{ '@context': 'https://schema.org', '@type': 'Article', headline: A.title, description: A.description, url, datePublished: TODAY, dateModified: TODAY, author: { '@type': 'Person', name: 'Ryan Yousefi' }, publisher: { '@type': 'Organization', name: 'Da Nang Hotel Guide', url: 'https://www.dananghotelguide.com' }, image: SITE + A.hero },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE }, { '@type': 'ListItem', position: 2, name: 'Guides', item: SITE + 'guides.html' }, { '@type': 'ListItem', position: 3, name: A.crumb, item: url }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: A.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]*>/g, '') } })) }];
  let k = 0; head = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, () => (k < 3 ? `<script type="application/ld+json">${JSON.stringify(ld[k++])}</script>` : ''));
  while (k < 3) head += `<script type="application/ld+json">${JSON.stringify(ld[k++])}</script>`;
  rest = rest.replace(/<script[^>]*dn-banner\.js[^>]*><\/script>\s*/g, ''); // new pages carry no dynamic banner (they are not in the banner placement list)
  const bodyStart = rest.indexOf('<main id="dn-main">'); const chrome = rest.slice(0, bodyStart); const foot = rest.slice(rest.indexOf('</main>'));
  const nav = A.sections.map(s => `<a href="#${s.id}" style="color:var(--ocean);font-size:.83rem;font-weight:600;text-decoration:none;padding:4px 12px;background:rgba(77,77,77,.1);border-radius:100px">${esc(s.nav)}</a>`).join('\n    ');
  const sections = A.sections.map(s => `  <div class="guide-section" id="${s.id}">\n    <h2>${s.h2}</h2>\n    ${(s.paras || []).map(p => `<p>${p}</p>`).join('\n    ')}${s.box ? `\n    <div class="${s.box.type || 'info-box'}"><p><strong>${esc(s.box.title)}</strong> ${s.box.text}</p></div>` : ''}${s.hotels ? '\n    ' + s.hotels.map(hotelCard).join('\n\n    ') : ''}${s.after ? '\n    ' + s.after.map(p => `<p>${p}</p>`).join('\n    ') : ''}\n  </div>`).join('\n\n');
  const faq = `  <div class="guide-section" id="faq">\n    <h2>Frequently <em>Asked Questions</em></h2>\n    <div style="border-top:1px solid var(--sand-dark);">${A.faq.map(f => `<details style="border-bottom:1px solid var(--sand-dark);"><summary style="font-size:.95rem;font-weight:600;color:var(--ink);padding:1rem 0;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">${esc(f.q)}<span style="font-size:1.2rem;color:var(--ocean);flex-shrink:0;margin-left:1rem;">+</span></summary><p style="font-size:.9rem;color:var(--ink-soft);line-height:1.8;padding:.5rem 0 1rem;max-width:65ch;">${f.a}</p></details>`).join('')}</div>\n  </div>`;
  const links = `  <div class="guide-links">\n    ${A.links.map(l => `<a href="${l[0]}" class="guide-link-btn dn-btn dn-btn--ghost">${esc(l[1])}</a>`).join('\n    ')}\n  </div>`;
  const decide = '';
  const hero = `<header class="dn-hero"><div class="dn-hero__media"><img src="${A.hero}" alt="${esc(A.heroAlt)}" fetchpriority="high" decoding="async"></div><div class="dn-hero__inner">\n<p class="dn-eyebrow">${esc(A.eyebrow)}</p>\n<h1>${A.h1}</h1>\n<p class="dn-lede">${esc(A.lede)}</p>\n<p class="dn-hero__meta">By <strong>Ryan Yousefi</strong> · Updated November 2026</p>\n</div></header>`;
  const main = `<main id="dn-main">\n\n${hero}\n\n<div class="guide-body">\n  <nav aria-label="Page sections" style="background:var(--sand);border-radius:var(--r-lg);padding:1.25rem 1.5rem;margin-bottom:2.5rem;display:flex;flex-wrap:wrap;gap:.5rem">\n    ${nav}\n  </nav>\n\n${sections}\n\n${faq}\n\n${links}\n</div>\n${decide}`;
  fs.writeFileSync ? (CHECK || fs.writeFileSync(out, head + chrome + main + foot)) : 0; wrote++;
}
console.log('new articles written:', wrote, CHECK ? '(dry run)' : '');
