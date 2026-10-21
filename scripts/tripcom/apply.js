#!/usr/bin/env node
// Booking.com (CJ) → Trip.com cutover.
//
//   node scripts/tripcom/apply.js                 dry run: readiness report, no writes
//   node scripts/tripcom/apply.js --write         migrate pages in this working tree
//   node scripts/tripcom/apply.js --preview DIR   copy of the site with PLAIN Trip.com
//                                                 URLs (no affiliate tracking), for
//                                                 screenshots only; DIR must be outside
//                                                 the repo
//
// --write refuses to run unless EVERY destination resolves to an official
// affiliate URL (its own affiliate_url, or the affiliate_url of the entry named
// in its fallback_key) that passes lib.affiliateUrlProblems(), and the widget
// links are set. There is no partial cutover: a page never mixes providers.
//
// Per page, --write / --preview:
//   - swaps each CJ URL for the resolved Trip.com URL (hrefs and JS data);
//   - upgrades each booking <a>: .tc-btn (or .tc-link for in-text links),
//     data-provider/data-tc-key, aria-label, logo badge, "Booking.com" → "Trip.com"
//     in the label; removes the dead data-booking-url attribute;
//   - rewrites affiliate disclosures (known patterns only; unknown wording fails);
//   - drops Booking.com URLs from JSON-LD ItemLists (no affiliate links in schema);
//   - swaps booking-cta-tracking.js → tripcom-cta.js, bk-widget.js →
//     tripcom-widget.js, adds tripcom-cta.css, removes the CJ page-impression
//     tag (yceml.net); fills the widget CONFIG.
// Editorial mentions of Booking.com elsewhere are left alone and listed.
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, REGISTRY, servedPages, findCjLinks, loadRegistry, affiliateUrlProblems, planFor, loadProfile, profileProblems, sha256, loadPilot, destinationConfirmed, destinationFromUrl } = require('./lib');

const args = process.argv.slice(2);
const MODE = args.includes('--write') ? 'write' : args.includes('--preview') ? 'preview' : 'dry';
const PILOT = args.includes('--pilot') ? loadPilot() : null;
if (args.includes('--pilot') && !PILOT) { console.error('data/tripcom/pilot.json missing'); process.exit(2); }
const PREVIEW_DIR = MODE === 'preview' ? path.resolve(args[args.indexOf('--preview') + 1] || '') : null;

const reg = loadRegistry();
const byKey = new Map(reg.entries.map(e => [e.key, e]));
const LOGO = '/assets/brand/tripcom-logo.webp';

// ── Resolution ──────────────────────────────────────────────────────────────
// Each link occurrence follows its registry plan (data/tripcom/decisions.json):
// map / fallback → the target entry's official link; remove → button dropped;
// hold / investigate / undecided → blocks --write (dropped in --preview only).
const PROFILE = loadProfile();
// Why a registry entry's link may not be used on a page (empty = usable).
function linkProblems(entry) {
  if (!entry.affiliate_url) return ['no official affiliate_url yet'];
  const p = affiliateUrlProblems(entry.affiliate_url, PROFILE);
  if (entry.affiliate_url_sha256 !== sha256(entry.affiliate_url)) p.push('link was modified after import (SHA-256 mismatch)');
  if (entry.affiliate_url_original && entry.affiliate_url_original !== entry.affiliate_url) p.push('differs from the originally generated link');
  if (!/dashboard link generator/i.test(entry.affiliate_url_source || '')) p.push('no dashboard-generator provenance');
  if (!destinationConfirmed(entry, PROFILE)) p.push('not confirmed to open the correct property (owner check, or Trip.com ID in the generated path matching the registry)');
  const d = destinationFromUrl(entry.affiliate_url); if (d && String(entry.tripcom_id) !== d.id) p.push(`generated path points at Trip.com ${d.type} ${d.id}, registry expects ${entry.tripcom_id}`);
  return p;
}
function urlFor(entry) {
  if (!entry) return null;
  if (MODE === 'preview') return entry.tripcom_destination || null;
  return linkProblems(entry).length ? null : entry.affiliate_url;
}
function planLink(page, l) {
  const entry = byKey.get(l.key);
  if (!entry) return { action: 'block', reason: `${l.key}: not in registry (run build-registry.js)` };
  const p = planFor(entry, page, l.sid);
  if (p.decision === 'remove') return { action: 'remove', entry };
  if (['hold', 'investigate', 'undecided'].includes(p.decision)) {
    if (MODE === 'preview') return { action: 'remove', entry, held: true };
    return { action: 'block', reason: `${entry.key}: decision is "${p.decision}"` };
  }
  const target = byKey.get(p.key);
  const url = urlFor(target);
  if (!url) return { action: 'block', reason: target ? `${target.key}: ${linkProblems(target).join('; ')}` : `${entry.key}: plan points at unknown ${p.key}` };
  return { action: 'link', url, entry, target, relabel: p.relabel, fallback: p.decision === 'fallback' };
}

const PAGES = PILOT ? PILOT.pages : servedPages();
const blockers = new Map(); // reason → link count
if (MODE !== 'preview') for (const r of profileProblems(PROFILE)) blockers.set(r, 1);
for (const page of PAGES) {
  for (const l of findCjLinks(fs.readFileSync(path.join(ROOT, page), 'utf8'))) {
    const pl = planLink(page, l);
    if (pl.action === 'block') blockers.set(pl.reason, (blockers.get(pl.reason) || 0) + 1);
  }
}
const W = reg.widget || {};
// The 2.0 redesign has no booking widget; require widget links only if some page still uses one.
const WIDGET_USED = PAGES.some(pg => /bk-widget\.js|id="bkSearchBtn"/.test(fs.readFileSync(path.join(ROOT, pg), 'utf8')));
for (const k of ['danang', 'hoian']) {
  if (WIDGET_USED && MODE !== 'preview' && affiliateUrlProblems(W[k], PROFILE).length) blockers.set(`widget.${k}: ${affiliateUrlProblems(W[k], PROFILE).join(', ')}`, 1);
}
for (const k of ['dated_template_danang', 'dated_template_hoian']) {
  if (W[k] && !(/\{checkin\}/.test(W[k]) && /\{checkout\}/.test(W[k]))) blockers.set(`widget.${k}: must contain {checkin} and {checkout}`, 1);
}

// ── Page transformation ─────────────────────────────────────────────────────
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const textOf = html => html.replace(/<[^>]+>/g, ' ').replace(/&rarr;|&#8594;|&#8599;|&nearr;|→|↗|›|»/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const COMPACT = /\b(nav-stays-btn|dhd-book|dhd-pop-book|dhm-pop-link|dhm-card-cta|ws-hotel-mini-cta)\b/;
const BLOCK = /\b(mobile-stays-btn|mobile-cta-bar-btn)\b/;

// Containers whose CSS turns a plain <a> into a button.
const BUTTON_PARENTS = /<(?:div|aside|section)[^>]*(?:id="mobileStickyBar"|class="[^"]*\bsidebar-cta\b)[^>]*>(?:(?!<\/(?:div|aside|section)>)[\s\S])*$/;

function upgradeAnchor(openTag, inner, url, entry, before = '', opts = {}) {
  let tag = openTag.replace(/\s+data-booking-url="[^"]*"/g, '');
  if (opts.fallback) tag = tag.replace(/\sdata-hotel="[^"]*"/, ''); // general search: not that hotel
  if (opts.relabel) inner = inner.replace(/^(\s*)[\s\S]*?(\s*(?:&rarr;|&#8594;|→)?\s*)$/, (m, a, b) => a + opts.relabel + (/(&rarr;|&#8594;|→)/.test(m) ? ' &rarr;' : '') );
  tag = tag.replace(/href=(["'])[^"']*\1/, `href="${esc(url)}"`);
  const cls = (tag.match(/\sclass="([^"]*)"/) || [, ''])[1];
  const isImage = /<img\b/i.test(inner);
  // Buttons: any layout class, or data-cta-location (cta-polish.css styles
  // every [data-cta-location] link as a button). Bare links in text stay links.
  const isButton = cls.replace(/\baffiliate-link\b/g, '').trim().length > 0 || /\sdata-cta-location=/.test(tag) || /\sstyle="[^"]*background/.test(tag) || BUTTON_PARENTS.test(before);
  let newInner = inner.replace(/Booking\.com/g, 'Trip.com');
  let add = isImage ? [] : isButton ? ['tc-btn'] : ['tc-link'];
  if (isButton && COMPACT.test(cls)) add.push('tc-btn--compact');
  if (isButton && BLOCK.test(cls)) add.push('tc-btn--block');
  if (add.length) {
    tag = /\sclass="/.test(tag) ? tag.replace(/\sclass="([^"]*)"/, (m, c) => ` class="${(c + ' ' + add.join(' ')).trim()}"`) : tag.replace(/^<a\b/, `<a class="${add.join(' ')}"`);
  }
  const attrs = [`data-provider="tripcom"`, `data-tc-key="${esc(entry.key)}"`];
  if (opts.ref && opts.ref !== entry.key) attrs.push(`data-tc-ref="${esc(opts.ref)}"`);
  if (!isImage) {
    const hotel = (tag.match(/\sdata-hotel="([^"]*)"/) || [, ''])[1];
    let name = textOf(newInner) || 'Check prices';
    if (hotel && !name.toLowerCase().includes(hotel.toLowerCase().replace(/&amp;/g, '&'))) name += ` for ${hotel.replace(/&amp;/g, '&')}`;
    if (!/trip\.com/i.test(name)) name += ' on Trip.com';
    tag = tag.replace(/\saria-label="[^"]*"/, '');
    attrs.push(`aria-label="${esc(name + ', opens in a new tab')}"`);
    newInner = isButton
      ? `<span class="tc-btn__logo"><img src="${LOGO}" alt="" width="58" height="14"></span><span class="tc-btn__text">${newInner}</span>`
      : `${newInner}<img class="tc-link__logo" src="${LOGO}" alt="" width="41" height="10">`;
  }
  tag = tag.replace(/^<a\b/, `<a ${attrs.join(' ')}`);
  return tag + newInner;
}

// Disclosure wording: known variants only. Anything else fails the page.
const DISCLOSURE_RULES = [
  [/earns commission through CJ Affiliate when you book via Booking\.com links/g, 'earns a commission when you book through Trip.com links'],
  [/Booking\.com affiliate links use aid=\d+\.?/g, 'Hotel links are Trip.com affiliate links.'],
  [/\bBooking links (go to|earn)/g, 'Hotel booking links $1'],
  [/Booking\.com affiliate(?: programme| program)?/g, 'Trip.com affiliate'],
  [/Booking\.com and Airbnb/g, 'Trip.com'],
  [/\s+via (?:the )?CJ(?: affiliate network)?/g, ''],
  [/Booking\.com is a registered trademark of Booking\.com(?:&nbsp;|\s)B\.V\.?/g, 'Trip.com is a trademark of Trip.com Group Limited.'],
  [/completed bookings/g, 'completed stays'],
  [/Booking\.com/g, 'Trip.com'],
];
function rewriteDisclosures(src, report) {
  // Button captions that say where the link goes ("on Booking.com" under a button).
  // Owner decision: the "on Booking.com" caption under hotel-card buttons is dropped
  // (the logo already says where the link goes).
  src = src.replace(/\s*<span class="hotel-card-cta-sub">\s*on Booking\.com\s*<\/span>/g, () => { report.captionsRemoved++; return ''; });
  src = src.replace(/(<(?:span|p|div)[^>]*class="[^"]*\b(?:hotel-card-cta-sub|cta-sub|dhd-searchcta-note)\b[^"]*"[^>]*>)([^<]*)Booking\.com/g,
    (m, open, pre) => { report.captions++; return open + pre + 'Trip.com'; });
  // Inline "<strong>Affiliate disclosure:</strong> ... Booking.com ..." paragraphs.
  src = src.replace(/(<strong>Affiliate disclosure:<\/strong>[^<]*?)Booking\.com/g, (m, pre) => { report.disclosures++; return pre + 'Trip.com'; });
  // Exact disclosure sentences that appear in unclassed footer text.
  for (const [re, to] of [
    [/Hotel links earn affiliate commission via Booking\.com\./g, 'Hotel links earn affiliate commission via Trip.com.'],
    [/commission on Booking\.com reservations/g, 'commission on Trip.com reservations'],
    [/Affiliate commission from Booking\.com has no influence/g, 'Affiliate commission from Trip.com has no influence'],
    [/Booking links are affiliate links\./g, 'Hotel booking links are affiliate links.'],
  ]) src = src.replace(re, () => { report.disclosures++; return to; });
  // Korean footer line (unclassed <span>).
  src = src.replace(/제휴 공개: Booking\.com 링크/g, () => { report.disclosures++; return '제휴 공개: Trip.com 링크'; });
  // Disclosure blocks and footer legal lines.
  return src.replace(/<(\w+)([^>]*class="[^"]*(?:disclos|footer-legal)[^"]*"[^>]*)>([\s\S]*?)<\/\1>/g, (m, el, attrs, body) => {
    if (!/Booking|CJ\b/.test(body)) return m;
    let out = body;
    for (const [re, to] of DISCLOSURE_RULES) out = out.replace(re, to);
    if (/Booking\.com|\bCJ\b/.test(out)) report.unknownDisclosure.push(textOf(body).slice(0, 140));
    report.disclosures++;
    return `<${el}${attrs}>${out}</${el}>`;
  });
}

function rewriteJsonLd(src, report) {
  return src.replace(/(<script[^>]+ld\+json[^>]*>)([\s\S]*?)(<\/script>)/g, (m, a, body, c) => {
    if (!/booking\.com/.test(body)) return m;
    const out = body.replace(/,\s*"url"\s*:\s*"https:\/\/www\.booking\.com[^"]*"/g, '').replace(/"url"\s*:\s*"https:\/\/www\.booking\.com[^"]*"\s*,\s*/g, '');
    report.jsonLd += (body.match(/booking\.com/g) || []).length - (out.match(/booking\.com/g) || []).length;
    if (/booking\.com/.test(out)) report.unknownJsonLd++;
    return a + out + c;
  });
}

function rewriteIncludes(src, page) {
  const pre = page.startsWith('kr/') ? '../' : '';
  let out = src
    .replace(/<script src="(\.\.\/)?booking-cta-tracking\.js"( defer)?><\/script>/g, (m, p) => `<script src="${p || ''}tripcom-cta.js" defer></script>`)
    .replace(/<script src="bk-widget\.js" defer><\/script>/g, '<script src="tripcom-widget.js" defer></script>')
    // Stale Booking.com affiliate-config comments.
    .replace(/[ \t]*<!-- Affiliate Config:[^>]*?-->\n?/g, '')
    .replace(/[ \t]*<!-- CJ DLA -->\n?/g, '')
    // CJ publisher page-impression tag: no CJ links remain after cutover.
    .replace(/[ \t]*<script src="https:\/\/www\.yceml\.net\/am_gen\/101820678\/impressions\/page\/am\.js"><\/script>\n?/g, '');
  if (!/tripcom-cta\.js/.test(out)) out = out.replace(/<\/body>/i, `<script src="${pre}tripcom-cta.js" defer></script>\n</body>`);
  if (!/tripcom-cta\.css/.test(out)) out = out.replace(/<\/head>/i, `<link rel="stylesheet" href="${pre}tripcom-cta.css">\n</head>`);
  return out;
}

// Homepage hero widget (index.html): its own markup and a dated Booking URL
// built by string concatenation, so it is replaced explicitly.
function migrateHomepageWidget(src, report) {
  const btnRe = /<button class="bk-btn" id="bkSearchBtn" type="button">[^<]*<\/button>/;
  if (!btnRe.test(src)) return src;
  const cfg = JSON.parse(widgetConfig());
  const url = cfg.danang;
  const dated = /\{checkin\}/.test(cfg.datedTemplateDanang) && /\{checkout\}/.test(cfg.datedTemplateDanang);
  const anchor = `<a class="bk-btn tc-btn tc-btn--block" id="bkSearchBtn" href="${esc(url)}" target="_blank" rel="nofollow noopener sponsored" data-provider="tripcom" data-tc-key="city:1356" data-cta-location="homepage_widget" aria-label="See Da Nang hotel prices on Trip.com, opens in a new tab"><span class="tc-btn__logo"><img src="${LOGO}" alt="" width="58" height="14"></span><span class="tc-btn__text">See Da Nang hotel prices</span></a>`;
  let out = src.replace(btnRe, anchor);
  if (!dated) {
    const datesRe = /<div class="bk-dates">\s*<div class="bk-date-field">(?:(?!<\/div>)[\s\S])*<\/div>\s*<div class="bk-date-field">(?:(?!<\/div>)[\s\S])*<\/div>\s*<\/div>/;
    const m = out.match(datesRe);
    if (!m || m[0].length > 1200) throw new Error('index.html: homepage date fields not found in the expected shape; not migrating');
    out = out.replace(datesRe, '<p class="tc-widget-note">Compare rooms and choose your dates on Trip.com.</p>');
  }
  // Old click handler: the <script> block that builds cjUrl.
  const i = out.indexOf("var cjUrl='https://www.kqzyfj.com");
  if (i !== -1) {
    const a = out.lastIndexOf('<script>', i);
    const b = out.indexOf('</script>', i) + '</script>'.length;
    const repl = !dated ? '' : `<script>
(function(){
  /* Dated mode: dates go into the official Trip.com template only. */
  var T=${JSON.stringify(cfg.datedTemplateDanang)};
  var ci=document.getElementById('bkCheckin'),co=document.getElementById('bkCheckout'),a=document.getElementById('bkSearchBtn');
  if(!ci||!co||!a)return;
  function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function add(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
  var today=new Date();today.setHours(0,0,0,0);
  ci.min=iso(today);ci.value=iso(add(today,1));co.value=iso(add(today,4));
  function sync(){
    var inD=new Date(ci.value+'T00:00:00');
    if(!ci.value||inD<today){inD=add(today,1);ci.value=iso(inD);}
    co.min=iso(add(inD,1));
    if(!co.value||new Date(co.value+'T00:00:00')<=inD)co.value=iso(add(inD,3));
    a.href=T.replace('{checkin}',ci.value).replace('{checkout}',co.value);
  }
  ci.addEventListener('change',sync);co.addEventListener('change',sync);sync();
})();
</script>`;
    out = out.slice(0, a) + repl + out.slice(b);
  }
  report.homepageWidget = dated ? 'dated' : 'link';
  return out;
}

// ── Removing a booking button (decision "remove") ───────────────────────────
// Drops the <a>, a caption right after it, and the wrapper if that leaves it
// empty. Script and style bodies are skipped while finding the wrapper.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
function tags(html, from, to) {
  const out = []; const re = /<(\/?)([a-zA-Z][\w-]*)\b[^>]*>/g; re.lastIndex = from; let m;
  while ((m = re.exec(html)) && m.index < to) {
    const name = m[2].toLowerCase();
    out.push({ close: !!m[1], name, start: m.index, end: re.lastIndex, self: VOID.has(name) || /\/>$/.test(m[0]), raw: m[0] });
    if (!m[1] && (name === 'script' || name === 'style')) { const c = html.indexOf(`</${name}`, re.lastIndex); if (c === -1 || c >= to) break; re.lastIndex = c; }
  }
  return out;
}
function removeAnchor(out, start, end, report, page) {
  let tail = out.slice(end).replace(/^\s*<span class="hotel-card-cta-sub">[^<]*<\/span>/, '');
  const ctxBefore = out.slice(Math.max(0, start - 160), start).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(-80);
  out = out.slice(0, start) + tail;
  // Enclosing element of the removed link.
  const stack = [];
  for (const t of tags(out, 0, start)) {
    if (t.self) continue;
    if (!t.close) stack.push(t); else { const i = stack.map(x => x.name).lastIndexOf(t.name); if (i !== -1) stack.length = i; }
  }
  const parent = stack[stack.length - 1];
  let removedParent = false;
  if (parent && ['div', 'p', 'span', 'li'].includes(parent.name) && !/\sid=/.test(parent.raw)) {
    let depth = 0, closeTag = null;
    for (const t of tags(out, parent.end, out.length)) {
      if (t.name !== parent.name || t.self) continue;
      if (!t.close) depth++; else if (depth === 0) { closeTag = t; break; } else depth--;
    }
    if (closeTag && out.slice(parent.end, closeTag.start).trim() === '') { out = out.slice(0, parent.start) + out.slice(closeTag.end); removedParent = true; }
  }
  report.removedStatic.push(`${page}: …${ctxBefore} [button removed${removedParent ? ', empty wrapper removed' : ''}]`);
  return out;
}

function transformPage(page, src, report) {
  const links = findCjLinks(src).sort((a, b) => b.index - a.index); // back to front
  let out = src;
  for (const l of links) {
    const pl = planLink(page, l);
    if (pl.action === 'block') { report.unresolved.push(`${page}: ${pl.reason}`); continue; }
    if (pl.action === 'remove') {
      report[pl.held ? 'heldDroppedInPreview' : 'removed']++;
      if (l.mechanism === 'js-data') { out = out.slice(0, l.index) + out.slice(l.index + l.raw.length); continue; } // empty URL: renderers skip the button
      const tagStart = out.lastIndexOf('<a', l.index);
      const tagEnd = out.indexOf('>', l.index + l.raw.length);
      const close = out.indexOf('</a>', tagEnd);
      const inner = out.slice(tagEnd + 1, close);
      if (/<img\b/i.test(inner)) { // photo link: keep the photo, drop only the link
        out = out.slice(0, tagStart) + inner + out.slice(close + 4);
        report.removedStatic.push(`${page}: photo link unwrapped (image kept)`);
        continue;
      }
      out = removeAnchor(out, tagStart, close + 4, report, page);
      continue;
    }
    const url = pl.url, entry = pl.target;
    if (l.mechanism === 'js-data') {
      if (/['"\\]/.test(url)) throw new Error(`unsafe characters in URL for ${l.key}`);
      out = out.slice(0, l.index) + url + out.slice(l.index + l.raw.length);
      report.js++;
      continue;
    }
    const tagStart = out.lastIndexOf('<a', l.index);
    const tagEnd = out.indexOf('>', l.index + l.raw.length);
    const close = out.indexOf('</a>', tagEnd);
    const openTag = out.slice(tagStart, tagEnd + 1);
    const inner = out.slice(tagEnd + 1, close);
    out = out.slice(0, tagStart) + upgradeAnchor(openTag, inner, url, entry, out.slice(Math.max(0, tagStart - 600), tagStart), { relabel: pl.relabel, fallback: pl.fallback, ref: pl.entry.key }) + out.slice(close);
    report[l.mechanism === 'nav-button' ? 'nav' : 'static']++;
  }
  if (page === 'index.html') out = migrateHomepageWidget(out, report);
  out = rewriteDisclosures(out, report);
  out = rewriteJsonLd(out, report);
  out = rewriteIncludes(out, page);
  const visible = out.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');
  report.editorialMentions += (visible.match(/Booking\.com/g) || []).length;
  return out;
}

function widgetConfig() {
  const danang = MODE === 'preview' ? 'https://www.trip.com/hotels/list?city=1356' : W.danang;
  const hoian = MODE === 'preview' ? 'https://www.trip.com/hotels/list?city=1775' : W.hoian;
  return JSON.stringify({ danang, hoian, datedTemplateDanang: MODE === 'preview' ? '' : W.dated_template_danang || '', datedTemplateHoian: MODE === 'preview' ? '' : W.dated_template_hoian || '' });
}

// ── Run ─────────────────────────────────────────────────────────────────────
const pages = PAGES;
const report = { pages: 0, static: 0, nav: 0, js: 0, removed: 0, heldDroppedInPreview: 0, removedStatic: [], captionsRemoved: 0, disclosures: 0, captions: 0, jsonLd: 0, unknownJsonLd: 0, unknownDisclosure: [], unresolved: [], editorialMentions: 0 };

if (MODE === 'dry') {
  const t = reg.meta.totals;
  console.log(`Registry: ${reg.entries.length} entries, ${t.links} links: ${t.links_needing_trip_url} need an official Trip.com link, ${t.links_removed} removed by decision.`);
  const total = [...blockers.values()].reduce((a, b) => a + b, 0);
  console.log(`Blocked: ${blockers.size} reason(s) covering ${total} link(s)`);
  for (const [r, n] of [...blockers].sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(`  - [${n}] ${r}`);
  if (blockers.size > 40) console.log(`  ... and ${blockers.size - 40} more`);
  console.log('\nNo files changed (dry run).');
  process.exit(blockers.size ? 2 : 0);
}

if (MODE === 'write' && blockers.size) {
  console.error(`Refusing to write: ${blockers.size} blocker(s). Run without flags for the list.`);
  process.exit(2);
}
if (MODE === 'preview') {
  if (!PREVIEW_DIR || PREVIEW_DIR.startsWith(ROOT + path.sep) || PREVIEW_DIR === ROOT) {
    console.error('--preview needs a directory OUTSIDE the repository.');
    process.exit(2);
  }
  fs.rmSync(PREVIEW_DIR, { recursive: true, force: true });
  fs.cpSync(ROOT, PREVIEW_DIR, { recursive: true, filter: s => !/\/(\.git|node_modules|\.claude)(\/|$)/.test(s) });
}
const outRoot = MODE === 'preview' ? PREVIEW_DIR : ROOT;

for (const page of pages) {
  const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const out = transformPage(page, src, report);
  if (out.length < src.length * 0.85) throw new Error(`${page}: output ${src.length - out.length} bytes shorter than input; aborting`);
  if (out !== src) { fs.writeFileSync(path.join(outRoot, page), out); report.pages++; }
}
const widgetPath = path.join(outRoot, 'tripcom-widget.js');
const w = fs.readFileSync(widgetPath, 'utf8');
if (WIDGET_USED) fs.writeFileSync(widgetPath, w.replace(/\/\*@tripcom-config\*\/[\s\S]*?\/\*@end-tripcom-config\*\//, `/*@tripcom-config*/${widgetConfig()}/*@end-tripcom-config*/`));
if (MODE === 'preview') {
  // Mark every preview link so a stray preview can never be mistaken for production.
  fs.writeFileSync(path.join(outRoot, 'PREVIEW-NOT-FOR-DEPLOYMENT.txt'), 'Generated by scripts/tripcom/apply.js --preview. Links are plain Trip.com URLs with NO affiliate tracking.\n');
}

console.log(JSON.stringify({ mode: MODE, out: outRoot, ...report, removedStatic: report.removedStatic.length, unknownDisclosure: report.unknownDisclosure.length, unresolved: report.unresolved.length }, null, 1));
if (args.includes('--list-removed')) console.log(report.removedStatic.join('\n'));
if (report.unknownDisclosure.length) { console.error('Unrecognised disclosure wording:\n  ' + [...new Set(report.unknownDisclosure)].join('\n  ')); process.exitCode = 3; }
if (report.unresolved.length) { console.error('Unresolved links:\n  ' + report.unresolved.slice(0, 20).join('\n  ')); process.exitCode = 3; }
