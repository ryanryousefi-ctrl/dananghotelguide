'use strict';
// Shared page shell for generated Phase 3 pages: chrome (nav, footer, consent, scripts) comes from find-your-hotel.html, which was built from a site template.
const fs = require('fs'), path = require('path'); const C = require('./components');
const ROOT = path.resolve(__dirname, '..', '..'); const esc = C.esc;
const T = fs.readFileSync(path.join(ROOT, 'find-your-hotel.html'), 'utf8');
module.exports = function shell({ file, title, desc, crumb, eyebrow, h1, lede, heroImg, main, sticky }) {
  const url = 'https://www.dananghotelguide.com/' + file;
  let head = T.slice(0, T.indexOf('</head>')), rest = T.slice(T.indexOf('</head>'));
  head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`).replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`).replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`).replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`).replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`).replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`).replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${esc(title)}"`).replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${esc(desc)}"`);
  const ld = [{ '@context': 'https://schema.org', '@type': 'Article', headline: title, description: desc, mainEntityOfPage: url, dateModified: '2026-11-23', author: { '@type': 'Person', name: 'Ryan Yousefi' }, publisher: { '@type': 'Organization', name: 'Da Nang Hotel Guide' } }, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.dananghotelguide.com/' }, { '@type': 'ListItem', position: 2, name: crumb, item: url }] }];
  let k = 0; head = head.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, () => (k < 2 ? `<script type="application/ld+json">${JSON.stringify(ld[k++])}</script>` : ''));
  head = head.replace('<link rel="stylesheet" href="tripcom-cta.css">', '<link rel="stylesheet" href="tripcom-cta.css">\n<link rel="stylesheet" href="dn-commerce.css">');
  const chrome = rest.slice(0, rest.indexOf('<main id="dn-main">'));
  let foot = rest.slice(rest.indexOf('</main>')).replace(/<script[^>]*dn-finder\.js[^>]*><\/script>\s*/g, '').replace(/<script[^>]*dn-banner\.js[^>]*><\/script>\s*/g, '').replace('<script src="tripcom-cta.js" defer></script>', '<script src="tripcom-cta.js" defer></script>\n<script src="dn-shortlist.js" defer></script>' + (sticky ? '\n<script src="dn-sticky-cta.js" defer></script>' : ''));
  const hero = `<header class="dn-hero"><div class="dn-hero__media"><img src="${heroImg || 'images/my-khe-beach-aerial-da-nang.jpeg'}" alt="" fetchpriority="high" decoding="async"></div><div class="dn-hero__inner"><p class="dn-eyebrow">${esc(eyebrow)}</p><h1>${h1}</h1><p class="dn-lede">${lede}</p><p class="dn-hero__meta">Updated November 2026 · Independent, affiliate-supported</p></div></header>`;
  return head + chrome + `<main id="dn-main">\n${hero}\n${main}\n` + foot;
};
