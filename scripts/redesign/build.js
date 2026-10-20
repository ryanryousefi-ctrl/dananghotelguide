#!/usr/bin/env node
// Da Nang Hotel Guide 2.0: sitewide transformer.
//
//   node scripts/redesign/build.js            transform every served page in place
//   node scripts/redesign/build.js --check    dry run: report only, write nothing
//
// Source of truth is the recorded baseline commit (docs/redesign/BASELINE.txt),
// NOT the working tree, so the build is repeatable: re-running always starts
// from the original page. Nothing outside the page HTML is edited except the
// shared legacy stylesheets, which get the new palette.
//
// Per page: new masthead / mobile menu / footer (page facts preserved: nav
// links per language, the booking-button URL with its CJ sid, the page's own
// legal and disclosure text), a normalised hero, <main>, the new CSS/JS stack,
// one unified button system. Page bodies, JSON-LD, meta, canonical/hreflang,
// analytics and every other script are spliced through untouched.
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
let cheerio;
try { cheerio = require('cheerio'); } catch (e) { cheerio = require('/Users/ryanyousefi/dananghotelguide/node_modules/cheerio'); }
const chrome = require('./chrome');

// Pages Vercel serves: root + kr/ HTML minus files vercel.json redirects away and two internal pages.
function servedPages() {
  const vj = JSON.parse(show('vercel.json'));
  const redirected = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
  const skip = new Set(['site-preview.html', 'favicon-html-snippet.html']);
  const list = cp.execFileSync('git', ['ls-tree', '-r', '--name-only', BASE], { cwd: ROOT }).toString().split('\n');
  return list.filter(f => /^(kr\/)?[^/]+\.html$/.test(f) && !skip.has(f) && !redirected.has(f)).sort();
}

const CHECK = process.argv.includes('--check');
const BASE = fs.readFileSync(path.join(ROOT, 'docs/redesign/BASELINE.txt'), 'utf8').match(/[0-9a-f]{40}/)[0];
const show = f => cp.execFileSync('git', ['show', `${BASE}:${f}`], { cwd: ROOT, maxBuffer: 64 << 20 }).toString('utf8');

// ── Palette: literal colours in page and legacy CSS follow the new tokens ───
const PALETTE = [[/#0D3535/gi, '#12201f'], [/#1B5C5C/gi, '#25544f'], [/#C8604A/gi, '#80622a'], [/#E07A62/gi, '#97762f'], [/#F6F1E9/gi, '#f3efe6'], [/#D9CDBB/gi, '#e0dacc'],
  [/#1A1A18/gi, '#161d1c'], [/#3C3C38/gi, '#38413f'], [/#7A7A70/gi, '#5b6563'], [/#B8901E/gi, '#80622a'],
  [/rgba\(\s*13\s*,\s*53\s*,\s*53\s*,/g, 'rgba(18,32,31,'], [/rgba\(\s*200\s*,\s*96\s*,\s*74\s*,/g, 'rgba(128,98,42,'],
  [/'Instrument Serif'/g, "'Newsreader'"], [/"Instrument Serif"/g, '"Newsreader"'], [/'Satoshi'/g, "'Hanken Grotesk'"], [/"Satoshi"/g, '"Hanken Grotesk"']];
const repaint = s => PALETTE.reduce((a, [re, to]) => a.replace(re, to), s);

const FONT_LINK = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&display=swap">';
// Consent Mode v2 defaults, written before any Google tag runs. Denied where consent is
// required or the law needs a refusal option (EEA, UK, Switzerland, Vietnam); granted elsewhere.
const NO_CONSENT = process.argv.includes('--no-consent');
const REGIONS = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH','VN'];
const CONSENT_HEAD = NO_CONSENT ? '' : `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:${JSON.stringify(REGIONS)},wait_for_update:500});gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});try{var c=JSON.parse(localStorage.getItem('dn_consent')||'null');if(c&&Date.now()-c.t<31536e6){var v=c.v==='granted'?'granted':'denied';gtag('consent','update',{ad_storage:v,ad_user_data:v,ad_personalization:v,analytics_storage:v});(window.adsbygoogle=window.adsbygoogle||[]).requestNonPersonalizedAds=v==='granted'?0:1}}catch(e){}</script>\n`;
const CONSENT_JS = NO_CONSENT ? '' : p => `<script src="${p}dn-consent.js" defer></script>\n`;
const LEGACY_CSS = /(?:cta-polish|bk-widget|premium|phase10_5)\.css/;

const exists = f => fs.existsSync(path.join(ROOT, f));
const norm = h => (h || '').split('#')[0].replace(/^\.\//, '').replace(/^https?:\/\/(www\.)?dananghotelguide\.com\/?/, '');
const base = h => norm(h).split('/').pop() || 'index.html';
const text = s => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// ── Extraction ──────────────────────────────────────────────────────────────
function extractNav($, page) {
  const nav = $('nav.site-nav').first();
  if (!nav.length) return null;
  const home = (page.startsWith('kr/') ? '../' : '') + 'index.html';
  const isHome = (h, l) => /^(\.\.\/)?(index\.html)?$/.test(norm(h)) || /^(home|홈)$/i.test(text(l));
  const top = [];
  nav.find('.nav-links').first().children().each((i, c) => {
    const el = $(c);
    if (el.is('a')) { if (!isHome(el.attr('href'), el.html())) top.push({ label: el.html().trim(), href: el.attr('href'), items: [] }); return; }
    if (!el.hasClass('nav-dropdown')) return;
    const tg = el.find('a.nav-dropdown-toggle').first();
    top.push({ label: tg.html().trim(), href: tg.attr('href'), items: el.find('a.nav-dropdown-item').map((j, a) => ({ label: $(a).html().trim(), href: $(a).attr('href') })).get() });
  });
  const mark = t => { const b = base(page); t.active = base(t.href) === b || t.items.some(i => base(i.href) === b); return t; };
  top.forEach(mark);
  const kr = ($('html').attr('lang') || '') === 'ko';
  // Desktop: the lower-priority items collapse into "More" so the bar stays calm.
  const keep = [], more = [];
  top.forEach(t => (/^(about|videos|소개|영상)/i.test(text(t.label)) ? more : keep).push(t));
  const desktop = keep.slice();
  if (more.length) desktop.push({ label: kr ? '더보기' : 'More', href: more[0].href, active: more.some(m => m.active), items: more.map(m => ({ label: m.label, href: m.href })) });
  const sb = nav.find('a.nav-stays-btn').first(), mb = $('#mobileMenu a.mobile-stays-btn').first();
  const stays = sb.length ? { href: sb.attr('href'), aria: sb.attr('aria-label') || 'Search stays', text: $(sb).find('.btn-text').html() || sb.text().trim(), mobileText: mb.length ? mb.html().replace(/\s*(&rarr;|→)\s*$/, '').trim() : null } : null;
  return { home, top: desktop, all: top, stays, search: !!$('#searchOverlay').length };
}

function extractFooter($) {
  const f = $('footer').filter((i, e) => !$(e).closest('nav, article, main').length).last();
  if (!f.length) return null;
  const columns = f.find('.footer-col').map((i, c) => ({ title: $(c).find('.footer-col-title, h4').first().html() || '', links: $(c).find('a').map((j, a) => ({ href: $(a).attr('href'), label: $(a).html() })).get() })).get().filter(c => c.links.length);
  const clone = $('<div></div>').html(f.html());
  clone.find('.footer-col, .footer-brand, .footer-brand-desc').remove();
  clone.find('footer').remove();
  clone.find('.footer-inner, .footer-grid').each((i, e) => { $(e).replaceWith($(e).contents()); });
  clone.find('.footer-inner, .footer-grid').each((i, e) => { $(e).replaceWith($(e).contents()); });
  const cjFooter = (f.html().match(/kqzyfj\.com\/click-101820678-/g) || []).length;
  return { columns, legalHtml: clone.html().trim(), cjFooter, el: f };
}

const HERO_SELECTORS = ['header.hr-hero', 'header.bb-hero', 'section.hero', 'header.hero', '.hvh-hero', '.vs-hero', 'header.gd-guides-hero', 'header[class*="-hero"]', 'section[class*="-hero"]', 'div[class*="-hero"]', 'header.dhd-head', 'header:has(h1)'];
function findHero($) {
  for (const s of HERO_SELECTORS) {
    const el = $(s).filter((i, e) => !$(e).closest('nav, footer, #mobileMenu, #searchOverlay').length && $(e).find('h1').length).first();
    if (el.length) return el;
  }
  return null;
}

function resolveHeroImage($, hero, html, page) {
  const img = hero.find('img').filter((i, e) => !$(e).closest('.hvh-split, .vs-hero-split, .vs-hero-half').length).first();
  if (img.length && img.attr('src')) return { src: img.attr('src'), alt: img.attr('alt') || '' };
  const m = html.match(/\.(?:hr-hero-img|bb-hero-img|hero-img|hero-slide|hero-bg)[^{}]*\{[^}]*url\(\s*['"]?([^'")]+)/);
  if (m && !/^data:/.test(m[1])) return { src: m[1], alt: '' };
  const og = (html.match(/property="og:image"\s+content="([^"]+)"/) || [])[1];
  if (og) { const rel = og.replace(/^https?:\/\/(www\.)?dananghotelguide\.com\//, ''); if (rel !== og ? exists(rel.split('?')[0]) : /^https:\/\/images\.unsplash\.com\//.test(og)) return { src: rel, alt: '' }; }
  return null;
}

// Replace the page hero with the unified editorial hero. Returns { html, mode } or null.
function buildHero($, hero, html, page) {
  const h1 = hero.find('h1').first();
  if (!h1.length) return null;
  const content = h1.parent();
  const isVs = hero.is('.hvh-hero, .vs-hero') || hero.find('.hvh-split, .vs-hero-split').length > 0;
  const free = (i, e) => !$(e).closest('a, button').length;
  let eyebrow = content.find('[class*="eyebrow"], [class*="kicker"]').filter(free).first();
  if (!eyebrow.length) { const p = h1.prevAll('p, span, div').first(); if (p.length && text(p.html()).length && text(p.html()).length < 90 && !p.find('p, div, h1').length) eyebrow = p; }
  let sub = content.find('[class*="-sub"], [class*="hero-line"], [class*="lede"]').filter(free).not(eyebrow).first();
  if (!sub.length) { const p = h1.nextAll('p').first(); if (p.length) sub = p; }
  const meta = content.find('[class$="-meta"], [class*="hero-meta"]').filter(free).not(eyebrow).not(sub).first();
  const used = new Set([eyebrow[0], h1[0], sub[0], meta[0]].filter(Boolean));
  const heroImg = isVs ? null : hero.find('img').filter((i, e) => !$(e).closest('.hvh-split, .vs-hero-split, .vs-hero-half').length).first()[0];
  const MEDIA = /hero-(img|slides?|overlay|grain|bg|nav|counter)\b|-hero-img\b/;
  const extras = [];
  // Everything in the hero that is not eyebrow/title/sub/meta/background media is kept (nothing is dropped silently).
  const walk = el => el.children().each((i, c) => {
    if (used.has(c)) return;
    const n = $(c);
    if ([...used].some(u => $.contains(c, u))) { walk(n); return; }
    if (MEDIA.test(n.attr('class') || '')) return;
    const imgs = n.find('img').addBack('img');
    if (heroImg && imgs.length === 1 && imgs[0] === heroImg && !text(n.html())) return;
    if (!text(n.html()) && !n.find('a[href], img, svg').length && !n.is('img, svg')) return;
    extras.push($.html(c));
  });
  walk(hero);
  const image = isVs ? null : resolveHeroImage($, hero, html, page);
  const deepOnly = !image && extras.length && !isVs;
  const mode = image ? 'image' : (deepOnly ? 'deep' : 'plain');
  const media = image ? `<div class="dn-hero__media"><img src="${chrome.esc(image.src)}" alt="${chrome.esc(image.alt)}" fetchpriority="high" decoding="async"></div>` : '';
  const out = `<header class="dn-hero${image ? '' : (deepOnly ? ' dn-hero--deep' : ' dn-hero--plain')}${isVs ? ' dn-hero--vs' : ''}">${media}<div class="dn-hero__inner">` +
    (eyebrow.length ? `\n<p class="dn-eyebrow">${eyebrow.html()}</p>` : '') + `\n<h1>${h1.html()}</h1>` +
    (sub.length ? `\n<p class="dn-lede">${sub.html()}</p>` : '') + (meta.length ? `\n<p class="dn-hero__meta">${meta.html()}</p>` : '') +
    (extras.length ? `\n<div class="dn-hero__extra">\n${extras.join('\n')}\n</div>` : '') + `\n</div></header>`;
  return { html: out, mode };
}

// ── Booking-button unification (string level, so it also covers hero extras) ─
const CJ = /kqzyfj\.com\/click-101820678-/;
const BTNCLASS = /(^|[\s_-])(btn|button|cta)([\s_-]|$)|-(btn|cta)\b|\b(btn|cta)-/;
function addClass(tag, cls) { return /\sclass="/.test(tag) ? tag.replace(/\sclass="([^"]*)"/, (m, c) => ` class="${c} ${cls}"`) : tag.replace(/^<a\b/, `<a class="${cls}"`); }
function unify(html) {
  return html.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/g, (m, inner) => {
    const tag = m.slice(0, m.indexOf('>') + 1);
    if (/\bdn-(btn|booklink|imglink)\b|nav-stays-btn|mobile-stays-btn|dn-menu__cta/.test(tag)) return m;
    const cls = (tag.match(/\sclass="([^"]*)"/) || [, ''])[1];
    if (CJ.test(tag)) {
      if (/<img\b/i.test(inner)) return addClass(tag, 'dn-imglink') + m.slice(tag.length);
      const isBtn = cls.replace(/\baffiliate-link\b/g, '').trim() && BTNCLASS.test(cls.replace(/\baffiliate-link\b/g, '')) || /\sdata-cta-location="[^"]*(card|primary|hero|price|review|compar|featured|pick|band|strip|cta|directory|map)[^"]*"/.test(tag) && !/<(p|div)\b/i.test(inner) && text(inner).length < 60;
      return addClass(tag, isBtn ? 'dn-btn dn-btn--book' : 'dn-booklink') + m.slice(tag.length);
    }
    if (cls && BTNCLASS.test(cls) && !/<img\b/i.test(inner) && !/\b(dn-|nav-|mobile-|search-|footer-|shr-|sh-)/.test(cls) && text(inner).length < 60) return addClass(tag, 'dn-btn dn-btn--ghost') + m.slice(tag.length);
    return m;
  });
}

// One booking button per hotel (and per generic search) on a page: earlier
// duplicates become text links. Links and tracking attributes are untouched.
function dedupeButtons(html) {
  const re = /<a\b[^>]*\bdn-btn--book\b[^>]*>/g;
  const items = [];
  let m;
  while ((m = re.exec(html))) {
    let dest = '';
    try { dest = decodeURIComponent((m[0].match(/[?&]url=([^&"']+)/) || [, ''])[1]); } catch (e) { /* keep empty */ }
    const hotel = dest.match(/\/hotel\/vn\/([^.?]+)\.html/);
    const key = hotel ? 'h:' + hotel[1] : 's:' + ((dest.match(/dest_id=([^&]+)/) || [, ''])[1] || (dest.match(/[?&]ss=([^&]+)/) || [, dest])[1]);
    items.push({ i: m.index, len: m[0].length, key, tag: m[0] });
  }
  const last = new Map(items.map((it, n) => [it.key, n]));
  let out = html, demoted = 0;
  for (let n = items.length - 1; n >= 0; n--) {
    if (last.get(items[n].key) === n) continue;
    const t = items[n].tag.replace(/\bdn-btn dn-btn--book\b/, 'dn-booklink');
    out = out.slice(0, items[n].i) + t + out.slice(items[n].i + items[n].len); demoted++;
  }
  return { out, demoted };
}


// ── Content overrides applied to the baseline source before transformation ──
// Each replacement must match exactly once or the build reports it (nothing is edited silently).
const OVERRIDES = {
  'privacy.html': [
    ['Last updated: February 2026', 'Last updated: October 2026'],
    ['<p>Images are served via <a href="https://unsplash.com/privacy" target="_blank" rel="noopener">Unsplash</a>. We do not use Google Analytics, advertising pixels, or any other tracking scripts.</p>',
     '<p>Some images are served via <a href="https://unsplash.com/privacy" target="_blank" rel="noopener">Unsplash</a>, videos via YouTube, and map tiles via OpenStreetMap, Esri and CARTO. These services receive your IP address when they deliver content.</p>\n    <h2>Analytics and advertising</h2>\n    <p>We use Google Analytics to understand how the site is used: which pages are read and which hotel booking buttons are clicked, together with your device type (mobile, tablet or desktop). We use Google AdSense to show ads. Some pages also use Ahrefs Web Analytics, which its provider describes as cookieless. We do not use other advertising pixels.</p>'],
    ['<p>Da Nang Hotel Guide itself does not set any cookies. Third-party services (Booking.com, Google Fonts) may set cookies according to their own policies when you navigate to their services or load their resources.</p>',
     '<p>This site uses these cookies and similar technologies:</p>\n    <ul>\n      <li><strong>Google Analytics</strong> sets first-party cookies (<code>_ga</code> and <code>_ga_0T1H4G2N80</code>, lasting up to two years) to measure visits and button clicks.</li>\n      <li><strong>Google AdSense</strong> may set advertising cookies to serve and measure ads.</li>\n      <li><strong>Booking.com and the CJ Affiliate network</strong> may set cookies when you follow a booking link, so a booking can be credited to us. A CJ script on our pages also reports page views to CJ.</li>\n      <li><strong>YouTube, Google Maps and Google Fonts</strong> may set cookies or log your IP address when they load.</li>\n    </ul>\n    <p><strong>Your choice.</strong> A banner on your first visit lets you accept or reject Google Analytics and Google advertising cookies. In the European Economic Area, the United Kingdom, Switzerland and Vietnam these stay off until you accept. Elsewhere they are on unless you reject. You can change your choice at any time with &ldquo;Privacy settings&rdquo; in the footer. Refusing does not affect how the site works. Cookies set by sites you visit through our links (Booking.com, CJ) or embeds (YouTube) follow those services&rsquo; own policies and are not controlled by this choice. You can also block or delete cookies in your browser settings.</p>'],
  ],
};
function applyOverrides(page, src, rep) {
  let out = src;
  for (const [from, to] of OVERRIDES[page] || []) {
    const n = out.split(from).length - 1;
    if (n !== 1) { (rep.overrideMissing = rep.overrideMissing || []).push(from.slice(0, 50)); continue; }
    out = out.replace(from, () => to);
  }
  // YouTube embeds: the privacy-enhanced domain sets no cookies until the video is played.
  out = out.replace(/(<iframe[^>]+src=["'])https:\/\/www\.youtube\.com\/embed\//g, (m, a) => { rep.ytNoCookie = (rep.ytNoCookie || 0) + 1; return a + 'https://www.youtube-nocookie.com/embed/'; });
  return out;
}

// ── Transform one page ──────────────────────────────────────────────────────
function transform(page, report) {
  const rep0 = {};
  const src = applyOverrides(page, show(page), rep0);
  const $ = cheerio.load(src, { sourceCodeLocationInfo: true });
  const lang = $('html').attr('lang') || 'en';
  const prefix = page.startsWith('kr/') ? '../' : '';
  const ops = [];
  const loc = el => el[0].sourceCodeLocation;
  const span = el => [loc(el).startOffset, loc(el).endOffset];
  const replace = (el, html) => { const [s, e] = span(el); ops.push({ s, e, t: html }); };
  const rep = { ...rep0, page, lang, cjFooter: 0, nav: false, footer: false, hero: 'none', main: false, cj: (src.match(/kqzyfj\.com\/click-101820678-/g) || []).length };

  // chrome
  const nav = extractNav($, page);
  const navEl = $('nav.site-nav').first();
  if (nav) {
    rep.nav = true;
    replace(navEl, chrome.header(nav, lang));
    const mob = $('#mobileMenu').first();
    if (mob.length) replace(mob, chrome.mobileMenu(nav, lang)); else ops.push({ s: span(navEl)[1], e: span(navEl)[1], t: chrome.mobileMenu(nav, lang) });
  }
  const foot = extractFooter($);
  const footEl = foot ? foot.el : $();
  if (foot) {
    rep.footer = true; rep.cjFooter = foot.cjFooter;
    replace(footEl, chrome.footer({ home: nav ? nav.home : 'index.html', prefix, lang, columns: foot.columns.map(c => ({ title: c.title, links: c.links })), legalHtml: foot.legalHtml, exists }));
  }
  $('aside.shr-bar').each((i, e) => { if (!$(e).closest('footer').length) replace($(e), ''); });

  // <main>
  const overlay = $('#searchOverlay').length ? $('#searchOverlay').first() : ($('#mobileMenu').length ? $('#mobileMenu').first() : navEl);
  if ($('main').length) { const m = $('main').first(); const [s, e] = [loc(m).startTag.startOffset, loc(m).startTag.endOffset]; const tag = src.slice(s, e); if (!/\sid=/.test(tag)) ops.push({ s, e, t: tag.replace(/^<main/, '<main id="dn-main"') }); rep.main = 'existing'; }
  else if (overlay.length && foot) { ops.push({ s: span(overlay)[1], e: span(overlay)[1], t: '\n<main id="dn-main">' }); ops.push({ s: span(footEl)[0], e: span(footEl)[0], t: '</main>\n' }); rep.main = 'wrapped'; }

  // hero
  const hero = findHero($);
  if (hero && nav) {
    const built = buildHero($, hero, src, page);
    if (built) { replace(hero, built.html); rep.hero = built.mode + (hero.is('.hvh-hero, .vs-hero') ? '+vs' : ''); }
    else rep.hero = 'kept(no h1)';
  }

  // scripts and head tags that the new chrome replaces
  $('script').each((i, e) => {
    const el = $(e), s = el.attr('src') || '', body = el.html() || '';
    if (s === 'bk-widget.js') replace(el, '');
    else if (!s && (/getElementById\('navHamburger'\)/.test(body) || /getElementById\('shr-x'\)/.test(body)) && body.length < 2600) replace(el, '');
  });
  $('link[rel="stylesheet"]').each((i, e) => { const h = $(e).attr('href') || ''; if (LEGACY_CSS.test(h) || /fonts\.googleapis\.com\/css2|fontshare\.com/.test(h)) replace($(e), ''); });
  $('style#nav-fit').each((i, e) => replace($(e), ''));
  if (nav && CONSENT_HEAD) { const m = src.match(/<head[^>]*>/); const hs = m.index + m[0].length; ops.push({ s: hs, e: hs, t: '\n' + CONSENT_HEAD }); }
  if (nav) {
    const hc = src.indexOf('</head>'); ops.push({ s: hc, e: hc, t: `${lang === 'ko' ? FONT_LINK.replace('family=Hanken+Grotesk', 'family=Noto+Sans+KR:wght@400;500;700&family=Hanken+Grotesk') : FONT_LINK}<meta name="theme-color" content="#faf8f3"><link rel="stylesheet" href="${prefix}dn-design.css">\n` });
    const bc = src.lastIndexOf('</body>'); ops.push({ s: bc, e: bc, t: `<script src="${prefix}dn.js" defer></script>\n${CONSENT_JS ? CONSENT_JS(prefix) : ''}` });
  }

  // splice (back to front; drop ops nested inside a replaced range)
  let out = src;
  const ranges = ops.filter(o => o.e > o.s);
  const final = ops.filter(o => !ranges.some(r => r !== o && r.s <= o.s && r.e >= o.e && (r.e - r.s) > (o.e - o.s) && !(o.s === o.e && (o.s === r.s || o.s === r.e))));
  final.sort((a, b) => b.s - a.s || b.e - a.e);
  for (const o of final) out = out.slice(0, o.s) + o.t + out.slice(o.e);
  out = unify(repaint(out));
  const dd = dedupeButtons(out); out = dd.out; rep.demoted = dd.demoted;
  rep.cjAfter = (out.match(/kqzyfj\.com\/click-101820678-/g) || []).length;
  rep.cjExpected = rep.cj - rep.cjFooter + (nav && nav.stays ? 0 : 0);
  return { out, rep };
}

// ── Homepage (own template) ─────────────────────────────────────────────────
function buildHome(page, served) {
  const src = show(page);
  const $ = cheerio.load(src);
  const nav = extractNav($, page), foot = extractFooter($);
  const metaCache = {};
  const meta = p => metaCache[p] || (metaCache[p] = (() => { try { const h = show(p); return { desc: (h.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'") }; } catch (e) { return { desc: '' }; } })());
  const grep = pat => cp.execFileSync('git', ['grep', '-l', pat, BASE, '--', '*.html'], { cwd: ROOT }).toString().split('\n').map(l => l.replace(`${BASE}:`, '')).filter(f => served.includes(f)).length;
  const stats = { directory: JSON.parse(show('assets/data/da-nang-hotels.json')).length, reviews: grep('class="hr-hero"'), comparisons: grep('class="hvh-hero"') };
  const footerHtml = chrome.footer({ home: 'index.html', prefix: '', lang: 'en', columns: null, legalHtml: foot.legalHtml, exists });
  const body = require('./home').render({
    headerHtml: chrome.header(nav, 'en'), menuHtml: chrome.mobileMenu(nav, 'en'), overlayHtml: $('#searchOverlay').toString(),
    footerHtml, meta, stats, staysHref: nav.stays.href, exists });
  let head = src.slice(0, src.indexOf('</head>'));
  head = head.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<link rel="stylesheet"[^>]*>/g, '').replace(/<link [^>]*fonts\.googleapis\.com[^>]*>/g, '').replace(/<link rel="preconnect"[^>]*fonts[^>]*>/g, '');
  head = head.replace(/<head[^>]*>/, m => m + '\n' + CONSENT_HEAD);
  head = repaint(head) + `${FONT_LINK}<meta name="theme-color" content="#faf8f3"><link rel="stylesheet" href="search-ui.css"><link rel="stylesheet" href="dn-design.css"><link rel="stylesheet" href="dn-home.css">\n</head>\n<body class="dn-home">\n`;
  const tail = `\n<script src="https://www.yceml.net/am_gen/101820678/impressions/page/am.js"></script>\n<script src="search-engine.js"></script>\n<script src="search-ui.js"></script>\n<script src="booking-cta-tracking.js"></script>\n<script src="dn.js" defer></script>\n<script src="dn-home.js" defer></script>\n${CONSENT_JS ? CONSENT_JS('') : ''}</body>\n</html>\n`;
  const out = unify(head + body + tail);
  return { out, rep: { page, lang: 'en', nav: true, footer: true, hero: 'home', main: 'own', cj: (src.match(/kqzyfj\.com\/click-101820678-/g) || []).length, cjAfter: (out.match(/kqzyfj\.com\/click-101820678-/g) || []).length, cjFooter: 0, cjExpected: null } };
}

// ── Run ─────────────────────────────────────────────────────────────────────
const pages = servedPages();
const reports = [];
for (const p of pages) {
  try { const { out, rep } = p === 'index.html' ? buildHome(p, pages) : transform(p); reports.push(rep); if (!CHECK) fs.writeFileSync(path.join(ROOT, p), out); }
  catch (e) { reports.push({ page: p, error: e.message.slice(0, 160) }); }
}
// Shared legacy stylesheets follow the new palette (still referenced by pages).
for (const f of ['phase10.css', 'phase13.css', 'hotel-review-modern.css', 'hotel-vs-hotel.css', 'search-ui.css']) {
  if (!CHECK) fs.writeFileSync(path.join(ROOT, f), repaint(show(f)));
}
if (!CHECK) fs.writeFileSync(path.join(ROOT, 'docs/redesign/build-report.json'), JSON.stringify(reports, null, 1));
if (process.env.DUMP) fs.writeFileSync("/tmp/dn-reports.json", JSON.stringify(reports));
const tally = (k) => reports.reduce((a, r) => (a[r[k]] = (a[r[k]] || 0) + 1, a), {});
console.log(JSON.stringify({ base: BASE.slice(0, 8), pages: reports.length, errors: reports.filter(r => r.error).length, nav: tally('nav'), footer: tally('footer'), hero: tally('hero'), main: tally('main'), cjUnexplained: reports.filter(r => !r.error && r.cjExpected !== null && r.cjAfter !== r.cjExpected && !(r.page.startsWith('kr/') && r.cjAfter === r.cjExpected + 1)).map(r => `${r.page} ${r.cj}->${r.cjAfter} (footer ${r.cjFooter})`), overrideProblems: reports.filter(r => r.overrideMissing).map(r => `${r.page}: ${r.overrideMissing.join(' | ')}`), youtubeEmbedsMoved: reports.reduce((a, r) => a + (r.ytNoCookie || 0), 0), demotedButtons: reports.reduce((a, r) => a + (r.demoted || 0), 0), cjRemovedWithFooter: reports.reduce((a, r) => a + (r.cjFooter || 0), 0) }, null, 1));
for (const r of reports.filter(r => r.error)) console.log('ERROR', r.page, r.error);
