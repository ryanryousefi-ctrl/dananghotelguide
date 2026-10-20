// Homepage template for Da Nang Hotel Guide 2.0. Pure function: given the
// extracted chrome and a meta lookup, returns the <body> inner HTML.
// All descriptive copy comes from the existing pages' own meta descriptions or
// from the site's existing statements; counts are computed at build time.
'use strict';
const { esc } = require('./chrome');

const COLLECTIONS = [
  { page: 'best-hotels-in-da-nang.html', title: 'Best Hotels in Da Nang', img: 'best-hotels', w: [800, 1400], alt: 'A beachfront resort on the Son Tra Peninsula seen from above', cls: 'dh-c--lead', kicker: 'The ranked list' },
  { page: 'luxury-hotels-da-nang.html', title: 'Luxury Resorts', img: 'luxury', w: [640, 1000], alt: 'A beachfront resort and its pool seen from above', cls: 'dh-c--a' },
  { page: 'da-nang-beach-hotels.html', title: 'Beachfront Hotels', img: 'beachfront', w: [640, 1000], alt: 'My Khe Beach with the city and mountains behind', cls: 'dh-c--b' },
  { page: 'boutique-hotels-da-nang.html', title: 'Boutique Hotels', img: 'boutique', w: [800], alt: 'A boutique hotel tower among apartment buildings', cls: 'dh-c--s' },
  { page: 'family-hotels-da-nang.html', title: 'Family-Friendly Hotels', img: 'family', w: [800], alt: 'A resort pool with sun loungers', cls: 'dh-c--s' },
  { page: 'best-luxury-resort-couples-da-nang.html', title: 'Romantic Hotels', img: 'romantic', w: [800], alt: 'Private-pool villas surrounded by palms', cls: 'dh-c--s' },
  { page: 'best-hotels-in-hoi-an.html', title: 'Best Hotels in Hoi An', img: 'hoi-an', w: [800], alt: 'Hoi An Ancient Town rooftops at sunset', cls: 'dh-c--s' },
];
const NEIGHBOURHOODS = [
  { page: 'best-hotels-near-my-khe-beach.html', name: 'My Khe Beach', img: 'nb-my-khe', w: 900, alt: 'My Khe Beach', cls: 'dh-n--wide' },
  { page: 'best-hotels-an-thuong-da-nang.html', name: 'An Thuong', img: 'nb-an-thuong', w: 640, alt: 'The coast near An Thuong with a hotel tower' },
  { page: 'best-han-river-hotels-da-nang.html', name: 'Han River &amp; City Centre', img: 'nb-han-river', w: 640, alt: 'Dragon Bridge over the Han River' },
  { page: 'best-resorts-son-tra-peninsula.html', name: 'Son Tra', img: 'nb-son-tra', w: 640, alt: 'The Lady Buddha on the Son Tra Peninsula' },
  { page: 'non-nuoc-beach-da-nang.html', name: 'Non Nuoc Beach', img: 'nb-non-nuoc', w: 640, alt: 'Non Nuoc Beach at sunset' },
  { page: 'hoi-an-old-town-hotels.html', name: 'Hoi An Ancient Town', img: 'nb-hoi-an', w: 900, alt: 'Lanterns in Hoi An Ancient Town', cls: 'dh-n--wide' },
  { page: 'an-bang-beach-hotels.html', name: 'An Bang Beach', img: 'nb-an-bang', w: 1400, alt: 'Beach resorts on An Bang beach seen from above', cls: 'dh-n--banner' },
];
const REVIEWS = [
  { page: 'hilton-da-nang.html', name: 'Hilton Da Nang', img: 'rv-hilton', alt: 'The Hilton Da Nang building at dusk' },
  { page: 'sheraton-grand-da-nang.html', name: 'Sheraton Grand Danang', img: 'rv-sheraton', alt: 'The Sheraton Grand Danang resort and its pool' },
  { page: 'naman-retreat-da-nang.html', name: 'Naman Retreat', img: 'rv-naman', alt: 'The Naman Retreat pool and beach' },
];
const GUIDES = [
  { page: 'da-nang-itinerary.html', title: 'The Da Nang Itinerary', img: 'g-itinerary', w: 900, alt: 'The Da Nang coastline', lead: true },
  { page: 'things-to-do-in-da-nang.html', title: 'Things to Do in Da Nang', img: 'g-things', w: 500, alt: 'Dragon Bridge' },
  { page: 'da-nang-transport-guide.html', title: 'Getting Around Da Nang', img: 'g-transport', w: 500, alt: 'Traffic on a Da Nang street' },
  { page: 'dining.html', title: 'Where to Eat', img: 'g-dining', w: 500, alt: 'A table of Vietnamese dishes' },
  { page: 'best-time-to-visit-da-nang.html', title: 'When to Visit', img: null },
];
const AREAS = [['', 'Anywhere'], ['best-hotels-near-my-khe-beach.html', 'My Khe Beach'], ['best-hotels-an-thuong-da-nang.html', 'An Thuong'], ['best-han-river-hotels-da-nang.html', 'Han River & City Centre'], ['best-resorts-son-tra-peninsula.html', 'Son Tra'], ['non-nuoc-beach-da-nang.html', 'Non Nuoc Beach'], ['hoi-an-old-town-hotels.html', 'Hoi An Ancient Town'], ['an-bang-beach-hotels.html', 'An Bang Beach']];
const STYLES = [['best-hotels-in-da-nang.html', 'Any style'], ['luxury-hotels-da-nang.html', 'Luxury'], ['da-nang-beach-hotels.html', 'Beachfront'], ['boutique-hotels-da-nang.html', 'Boutique'], ['family-hotels-da-nang.html', 'Family'], ['best-budget-hotels-in-da-nang.html', 'Affordable'], ['best-luxury-resort-couples-da-nang.html', 'Romantic']];

const pic = (name, w, alt, lazy = true, sizes = '100vw') => {
  const ws = Array.isArray(w) ? w : [w];
  const src = `images/dn/${name}-${ws[ws.length - 1]}.webp`;
  const set = ws.length > 1 ? ` srcset="${ws.map(x => `images/dn/${name}-${x}.webp ${x}w`).join(', ')}" sizes="${sizes}"` : '';
  return `<img src="${src}"${set} alt="${esc(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high" decoding="async"'}>`;
};
const cut = (s, n) => { s = (s || '').replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const t = s.slice(0, n); return t.slice(0, t.lastIndexOf(' ')).replace(/[,;:–-]$/, '') + '…'; };

function render({ headerHtml, menuHtml, overlayHtml, footerHtml, meta, stats, staysHref, exists }) {
  const ok = c => exists(c.page);
  const desc = (p, n = 118) => esc(cut(meta(p).desc, n));
  const col = c => `<a class="dh-c ${c.cls}" href="${c.page}">
      <span class="dh-c__img">${pic(c.img, c.w, c.alt, true, c.cls === 'dh-c--lead' ? '(min-width:900px) 58vw, 100vw' : '(min-width:900px) 30vw, 100vw')}</span>
      <span class="dh-c__body">${c.kicker ? `<span class="dh-kicker">${c.kicker}</span>` : ''}<span class="dh-c__title">${c.title}</span><span class="dh-c__desc">${desc(c.page, c.cls === 'dh-c--lead' ? 150 : 96)}</span></span></a>`;
  const cols = COLLECTIONS.filter(ok);
  const lead = cols.filter(c => ['dh-c--lead', 'dh-c--a', 'dh-c--b'].includes(c.cls)), small = cols.filter(c => c.cls === 'dh-c--s');
  const nbs = NEIGHBOURHOODS.filter(ok);
  const rvs = REVIEWS.filter(ok);
  const gds = GUIDES.filter(ok);
  const lg = gds.find(g => g.lead), rest = gds.filter(g => !g.lead);
  const opt = (arr) => arr.filter(([p]) => !p || exists(p)).map(([p, l]) => `<option value="${esc(p)}">${esc(l)}</option>`).join('');

  return `${headerHtml}
${menuHtml}
${overlayHtml}
<main id="dn-main" class="dh">

<section class="dh-hero" aria-labelledby="dh-title">
  <div class="dh-hero__media"><img src="images/dn/hero-son-tra-1920.webp" srcset="images/dn/hero-son-tra-1000.webp 1000w, images/dn/hero-son-tra-1920.webp 1920w" sizes="100vw" alt="The Son Tra Peninsula and the Da Nang coastline from above" fetchpriority="high" decoding="async"></div>
  <div class="dh-hero__inner">
    <p class="dh-kicker dh-kicker--light">Independent since 2021 · Da Nang &amp; Hoi An</p>
    <h1 id="dh-title">Where to stay in <em>Da Nang</em> and Hoi An</h1>
    <p class="dh-hero__lede">My Khe, Son Tra, Han River, Non Nuoc, five neighbourhoods, one honest guide. Find the right part of the city before you book.</p>
    <div class="dh-hero__actions"><a class="dn-btn" href="where-to-stay-in-da-nang.html">Read the guide</a><a class="dn-btn dn-btn--ghost" href="best-hotels-in-da-nang.html">Best hotels 2026</a></div>
  </div>
  <p class="dh-hero__cap">Son Tra Peninsula, Da Nang</p>
</section>

<form class="dh-find" id="dhFind" aria-label="Find a hotel guide">
  <p class="dh-find__label">Find your hotel</p>
  <label class="dh-find__field"><span>Where</span><select id="dhArea">${opt(AREAS)}</select></label>
  <label class="dh-find__field"><span>Style</span><select id="dhStyle">${opt(STYLES)}</select></label>
  <button class="dh-find__go" type="submit">Show hotels</button>
</form>

<section class="dh-intro">
  <div class="dh-wrap dh-intro__grid">
    <p class="dh-intro__lead">Independent hotel and travel advice for Da Nang and Hoi An. No sponsored content. Locally maintained since 2021.</p>
    <ul class="dh-stats" aria-label="The guide in numbers">
      <li><b>${stats.directory}</b><span>hotels in the directory</span></li>
      <li><b>${stats.reviews}</b><span>full hotel reviews</span></li>
      <li><b>${stats.comparisons}</b><span>head-to-head comparisons</span></li>
    </ul>
  </div>
</section>

<section class="dh-section" aria-labelledby="dh-h-coll">
  <div class="dh-wrap">
    <header class="dh-head"><p class="dh-kicker">Curated collections</p><h2 id="dh-h-coll">Start with the kind of stay you want</h2></header>
    <div class="dh-coll">${lead.map(col).join('\n')}</div>
    <div class="dh-coll dh-coll--row">${small.map(col).join('\n')}</div>
    ${exists('best-budget-hotels-in-da-nang.html') ? `<p class="dh-more">Watching the budget? <a href="best-budget-hotels-in-da-nang.html">Affordable hotels in Da Nang</a> · <a href="da-nang-hotel-directory.html">Browse all ${stats.directory} hotels</a> · <a href="da-nang-hotels-map.html">See them on the map</a></p>` : ''}
  </div>
</section>

<section class="dh-section dh-section--tint" aria-labelledby="dh-h-nb">
  <div class="dh-wrap">
    <header class="dh-head"><p class="dh-kicker">Discover by neighbourhood</p><h2 id="dh-h-nb">Pick the part of town, then the hotel</h2></header>
    <div class="dh-nb">${nbs.map(n => `<a class="dh-n ${n.cls || ''}" href="${n.page}"><span class="dh-n__img">${pic(n.img, n.w, n.alt, true, '(min-width:900px) 30vw, 80vw')}</span><span class="dh-n__body"><span class="dh-n__name">${n.name}</span><span class="dh-n__desc">${desc(n.page, 84)}</span></span></a>`).join('\n')}</div>
  </div>
</section>

<section class="dh-section" aria-labelledby="dh-h-rv">
  <div class="dh-wrap">
    <header class="dh-head dh-head--row"><div><p class="dh-kicker">Hotel reviews</p><h2 id="dh-h-rv">Reviewed, with the trade-offs</h2></div><a class="dh-link" href="hotel-reviews.html">All hotel reviews</a></header>
    <div class="dh-rv">${rvs.map(r => `<a class="dh-r" href="${r.page}"><span class="dh-r__img">${pic(r.img, 800, r.alt, true, '(min-width:900px) 30vw, 100vw')}</span><span class="dh-r__name">${r.name}</span><span class="dh-r__desc">${desc(r.page, 130)}</span><span class="dh-r__cta">Read the review</span></a>`).join('\n')}</div>
  </div>
</section>

<section class="dh-section dh-section--tint" aria-labelledby="dh-h-gd">
  <div class="dh-wrap">
    <header class="dh-head dh-head--row"><div><p class="dh-kicker">Travel guides</p><h2 id="dh-h-gd">Plan the rest of the trip</h2></div><a class="dh-link" href="guides.html">All guides</a></header>
    <div class="dh-gd">
      ${lg ? `<a class="dh-g dh-g--lead" href="${lg.page}"><span class="dh-g__img">${pic(lg.img, lg.w, lg.alt, true, '(min-width:900px) 50vw, 100vw')}</span><span class="dh-g__title">${lg.title}</span><span class="dh-g__desc">${desc(lg.page, 150)}</span></a>` : ''}
      <ul class="dh-gd__list">${rest.map(g => `<li><a class="dh-g" href="${g.page}">${g.img ? `<span class="dh-g__img">${pic(g.img, g.w, g.alt, true, '140px')}</span>` : ''}<span class="dh-g__text"><span class="dh-g__title">${g.title}</span><span class="dh-g__desc">${desc(g.page, 96)}</span></span></a></li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="dh-book" aria-labelledby="dh-h-book">
  <div class="dh-wrap dh-book__grid">
    <div>
      <p class="dh-kicker dh-kicker--light">When you've decided</p>
      <h2 id="dh-h-book">Booking is the easy part.</h2>
      <p>Every guide and review links straight to the hotel's rates. Or search Da Nang directly.</p>
    </div>
    <div class="dh-book__act">
      <a class="dn-btn dn-btn--book affiliate-link" href="${esc(staysHref)}" target="_blank" rel="nofollow noopener sponsored" data-cta-location="home_book_band">Search hotels in Da Nang</a>
      <p>Affiliate disclosure: some links on this site are affiliate links. If you book through them, we may earn a small commission at no extra cost to you. It never changes how we rank hotels. <a href="why-trust-us.html">How we choose</a></p>
    </div>
  </div>
</section>

<section class="dh-ess" aria-label="Before you go">
  <div class="dh-wrap dh-ess__row">
    <p><b>Before you go</b> Get $3 off your first Airalo eSIM with code RYAN6986.</p>
    <a class="dh-link" href="https://www.airalo.com/auth/signup" target="_blank" rel="nofollow noopener sponsored">Get an eSIM</a>
  </div>
</section>

</main>
${footerHtml}`;
}
module.exports = { render, COLLECTIONS, NEIGHBOURHOODS, REVIEWS, GUIDES, AREAS, STYLES };
