#!/usr/bin/env node
// Trip.com migration validation. Run against the migrated working tree before
// any deploy, and against a --preview copy while affiliate links are pending.
//
//   node scripts/tripcom/validate.js [--dir DIR] [--preview] [--render] [--ga] [--destinations]
//
//   (default)       static checks, no network:
//                   leftover Booking/CJ code, affiliate identifiers, fixed
//                   dates, href ↔ registry consistency (wrong matches),
//                   unbranded buttons, accessible names, disclosures.
//   --preview       DIR holds plain (unaffiliated) Trip.com URLs: affiliate
//                   identifier checks become warnings.
//   --render        headless Chrome, desktop 1280 + mobile 390, every served
//                   page: JS errors, unbranded/unstyled booking buttons,
//                   horizontal overflow, map popups, mobile menu, widgets.
//   --ga            GA4 contract: exactly one affiliate_click per click with
//                   provider, hotel_name, page_path, cta_location, device_category.
//   --destinations  loads each PLAIN Trip.com destination (hotel/city page,
//                   never an affiliate link) and checks it still shows the
//                   expected property. Never requests affiliate URLs, so it
//                   cannot create clicks in Trip.com reporting.
//
// External requests are blocked in --render and --ga: no Trip.com, CJ, ad or
// analytics traffic is generated. A click in GA4 is not a commission; bookings
// are confirmed only in the Trip.com Partners dashboard after check-out.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { ROOT, servedPages, loadRegistry, affiliateUrlProblems, loadProfile, profileProblems, sha256, loadPilot, destinationConfirmed, destinationFromUrl, useLogo } = require('./lib');

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const DIR = flag('--dir') ? path.resolve(args[args.indexOf('--dir') + 1]) : ROOT;
const PREVIEW = flag('--preview');
// --pilot: only the pilot pages are Trip.com; every other page must stay 100% CJ (no provider mixing).
// --cutover: strict launch gate (profile approved, every link hash-locked and owner-confirmed).
const PILOT = flag('--pilot') ? loadPilot() : null;
const CUTOVER = flag('--cutover') || !!PILOT;
const PROFILE = loadProfile();

const reg = loadRegistry();
const byKey = new Map(reg.entries.map(e => [e.key, e]));
const failures = [];
const warnings = [];
const fail = (check, msg) => failures.push(`[${check}] ${msg}`);
const warn = (check, msg) => warnings.push(`[${check}] ${msg}`);

function resolved(entry, seen = new Set()) {
  if (PREVIEW) return null;
  if (entry.affiliate_url) return entry.affiliate_url;
  if (entry.fallback_key && !seen.has(entry.key)) { seen.add(entry.key); const fb = byKey.get(entry.fallback_key); if (fb) return resolved(fb, seen); }
  return null;
}

// ── Static checks ───────────────────────────────────────────────────────────
const only = args.includes('--pages') ? args[args.indexOf('--pages') + 1].split(',') : null;
const pages = only || servedPages(DIR);
const decode = s => s.replace(/&amp;/g, '&');
const editorial = [];
const EMBED_SRCS = ['search-box.json', 'dynamic-banner.json'].map(f => { try { const m = JSON.parse(fs.readFileSync(path.join(DIR, 'data/tripcom', f), 'utf8')).embed_code.match(/src="([^"]+)"/); return m ? m[1] : null; } catch (e) { return null; } }).filter(Boolean);   // official iframe URLs (search box, dynamic banner)
const registryUrls = new Set(reg.entries.map(e => e.affiliate_url).filter(Boolean));
let tripLinks = 0;

for (const page of pages) {
  const src = fs.readFileSync(path.join(DIR, page), 'utf8');
  const noComments = src.replace(/<!--[\s\S]*?-->/g, '');
  if (PILOT && !PILOT.pages.includes(page)) {          // non-pilot page: must be untouched CJ
    if (/data-provider="tripcom"|tripcom-cta\.(js|css)|https:\/\/(?:[a-z0-9-]+\.)*trip\.com\/hotels\//.test(src)) fail('provider-mixing', `${page}: Trip.com content on a non-pilot page`);
    if (!/kqzyfj\.com\/click-101820678-17293132/.test(src) && !/^(privacy|terms|contact|about)/.test(page)) warn('provider-mixing', `${page}: no CJ link (expected on a non-pilot page)`);
    continue;
  }

  // 1. Remaining Booking.com / CJ integration
  const leftovers = {
    'CJ tracking link': /kqzyfj\.com\/click-/g,
    'Booking.com href': /href=["']https?:\/\/[a-z.]*booking\.com/g,
    'Booking.com URL in script': /["']https?:\/\/[a-z.]*booking\.com\/(?:hotel|searchresults)/g,
    'data-booking-url attribute': /data-booking-url=/g,
    'CJ page-impression tag': /yceml\.net\/am_gen/g,
    'booking-cta-tracking.js include': /<script[^>]+booking-cta-tracking\.js/g,
    'bk-widget.js include': /<script[^>]+bk-widget\.js/g,
    'Booking aid parameter': /aid=1784897/g,
  };
  for (const [what, re] of Object.entries(leftovers)) {
    const n = (noComments.match(re) || []).length;
    if (n) fail('booking-leftover', `${page}: ${n} × ${what}`);
  }

  // 2. Every Trip.com URL (attribute or script string)
  const urls = [...src.matchAll(/https:\/\/(?:[a-z0-9-]+\.)*trip\.com\/[^"'\s<>\\)]*/g)].map(m => decode(m[0]));
  for (const u of urls) {
    if (/\/assets\/|tripcdn/.test(u) || EMBED_SRCS.includes(u)) continue;
    if (!/trip\.com\/hotels\//.test(u) && !/allianceid=/i.test(u)) { warn('editorial-link', `${page}: non-hotel Trip.com link left as editorial: ${u.slice(0, 80)}`); continue; }
    tripLinks++;
    const problems = affiliateUrlProblems(u);
    const dateProblems = problems.filter(p => /fixed date/.test(p));
    if (dateProblems.length) fail('fixed-dates', `${page}: ${u.slice(0, 90)} has ${dateProblems.join(', ')}`);
    const idProblems = problems.filter(p => !/fixed date/.test(p));
    if (idProblems.length) (PREVIEW ? warn : fail)('affiliate-id', `${page}: ${u.slice(0, 90)}: ${idProblems.join(', ')}`);
  }

  // 3. Anchors: registry consistency, branding, accessible name
  for (const m of src.matchAll(/<a\b([^>]*\bdata-provider="tripcom"[^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = m[1], inner = m[2];
    const href = decode((attrs.match(/\shref="([^"]*)"/) || [, ''])[1]);
    const key = decode((attrs.match(/\sdata-tc-key="([^"]*)"/) || [, ''])[1]);
    const cls = (attrs.match(/\sclass="([^"]*)"/) || [, ''])[1];
    const entry = byKey.get(key);
    if (entry && entry.decision === 'remove') fail('wrong-match', `${page}: button still present for removed destination ${key}`);
    if (!key || !entry) { if (key && !key.startsWith('city:')) fail('wrong-match', `${page}: unknown data-tc-key "${key}"`); }
    else {
      const expected = PREVIEW ? null : resolved(entry);
      if (expected && href !== expected) fail('wrong-match', `${page}: ${key} links to ${href.slice(0, 80)}, registry says ${expected.slice(0, 80)}`);
      if (PREVIEW && entry.tripcom_destination && !/\/hotels\/list\?city=/.test(href) && href !== entry.tripcom_destination) fail('wrong-match', `${page}: ${key} → ${href} ≠ ${entry.tripcom_destination}`);
    }
    if (CUTOVER && !PREVIEW && entry) {
      const t = (entry.affiliate_url ? entry : byKey.get(entry.fallback_key)) || entry;
      if (href !== t.affiliate_url_original) fail('modified-link', `${page}: ${key} href is not the exact originally generated link`);
      if (t.affiliate_url_sha256 !== sha256(href)) fail('modified-link', `${page}: ${key} href SHA-256 does not match the registry`);
      if (!destinationConfirmed(t, PROFILE)) fail('unverified-link', `${page}: ${key} not confirmed to open the correct property`);
      const dd = destinationFromUrl(href); if (dd && String(t.tripcom_id) !== dd.id) fail('wrong-match', `${page}: ${key} generated link points at Trip.com ${dd.type} ${dd.id}, registry expects ${t.tripcom_id}`);
      if (!/target="_blank"/.test(attrs)) fail('rel', `${page}: Trip.com link without target=_blank`);
      if (!/rel="[^"]*nofollow/.test(attrs) || !/rel="[^"]*noopener/.test(attrs)) fail('rel', `${page}: Trip.com link missing nofollow/noopener`);
    }
    if (/<img\b/.test(inner) && !/tc-(btn|link)__logo/.test(inner)) continue; // image-card link
    if (useLogo() && /\btc-btn\b/.test(cls) && !/tc-btn__logo/.test(inner)) fail('unbranded', `${page}: button without Trip.com logo (${cls})`);
    if (useLogo() && /\btc-link\b/.test(cls) && !/tc-link__logo/.test(inner)) fail('unbranded', `${page}: link without Trip.com logo`);
    if (!/\btc-(btn|link)\b/.test(cls)) fail('unbranded', `${page}: Trip.com link without component class`);
    const aria = decode((attrs.match(/\saria-label="([^"]*)"/) || [, ''])[1]);
    const visible = inner.replace(/<[^>]+>/g, ' ').replace(/&rarr;|&#8594;|&#8599;|→|↗|›|»/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (!aria) fail('a11y', `${page}: Trip.com link without aria-label`);
    else if (visible && !aria.toLowerCase().includes(visible.toLowerCase().slice(0, 20))) warn('a11y', `${page}: aria-label "${aria.slice(0, 60)}" does not contain visible text "${visible.slice(0, 40)}"`);
    if (!/rel="[^"]*sponsored/.test(attrs)) fail('rel', `${page}: Trip.com link without rel="sponsored"`);
  }

  // 3b. Destinations: no empty booking buttons, no unapproved redirects or shorteners, no unregistered Trip.com URLs
  for (const m of noComments.matchAll(/<a\b([^>]*)>/g)) {
    const href = decode((m[1].match(/\shref=["']([^"']*)["']/) || [, null])[1] || '');
    const cls = (m[1].match(/\sclass="([^"]*)"/) || [, ''])[1];
    if (/\b(dn-btn--book|tc-btn)\b/.test(cls) && (!href || href === '#')) fail('missing-destination', `${page}: booking button without a destination`);
    if (/^https?:\/\/(bit\.ly|t\.co|tinyurl\.com|goo\.gl|ow\.ly|rebrand\.ly|is\.gd|buff\.ly)\//i.test(href) || /^(\/|https?:\/\/(www\.)?dananghotelguide\.com\/)(go|out|redirect|r|l|aff)\//i.test(href)) fail('unapproved-redirect', `${page}: redirect/shortener link ${href.slice(0, 80)}`);
    if (CUTOVER && !PREVIEW && /^https?:\/\/([a-z0-9-]+\.)*trip\.com\/(?!assets|.*tripcdn)/i.test(href) && !registryUrls.has(href)) {
      const ed = /\/(partners|help|about|news|travel-guide)\b/i.test(href); if (!ed) fail('unregistered-url', `${page}: Trip.com URL not from the registry: ${href.slice(0, 90)}`);
    }
  }
  // 4. Disclosures: any page with Trip.com links needs a Trip.com disclosure
  const hasTrip = /data-provider="tripcom"|https:\/\/(?:[a-z0-9-]+\.)*trip\.com\/(?!.*tripcdn)/.test(src);
  // Accept any visible affiliate disclosure that names Trip.com or no provider
  // ("Some links on this page are affiliate links"); Korean: 제휴 (affiliate).
  const visibleText = noComments.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const named = /Trip\.com[^.]{0,160}(commission|affiliate)|(commission|affiliate)[^.]{0,160}Trip\.com|제휴[^.]{0,40}Trip\.com/i.test(visibleText);
  const neutral = /affiliate disclosure|affiliate links?\b[\s\S]{0,120}commission|contains affiliate links|제휴 링크|제휴 공개/i.test(visibleText);
  if (hasTrip && !named && !neutral) fail('disclosure', `${page}: Trip.com links but no affiliate disclosure`);
  if (/(disclos|footer-legal)[^>]*>[^<]{0,600}?(Booking\.com|via CJ)|Affiliate disclosure:<\/strong>[^<]{0,200}Booking\.com/.test(noComments)) fail('disclosure', `${page}: disclosure still mentions Booking.com/CJ`);

  // 5. Editorial mentions left for human review (not a failure)
  const text = noComments.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  for (const mm of text.matchAll(/Booking\.com/g)) {
    const a = text.lastIndexOf('>', mm.index), b = text.indexOf('<', mm.index);
    editorial.push([page, text.slice(a + 1, b).replace(/\s+/g, ' ').trim().slice(0, 200)]);
  }
}
const W = reg.widget || {};
for (const k of ['dated_template_danang', 'dated_template_hoian']) {
  if (W[k] && /\d{4}-\d{2}-\d{2}/.test(W[k])) fail('fixed-dates', `widget.${k} contains a literal date`);
}
// Registry sanity
for (const e of reg.entries) {
  if (['hold', 'investigate', 'undecided'].includes(e.decision) && e.link_count > 0) (PREVIEW ? warn : fail)('decision', `registry ${e.key}: decision "${e.decision}" (${e.link_count} links) must be resolved before launch`);
  if (e.affiliate_url && e.tripcom_id && !e.affiliate_url.includes(e.tripcom_id)) warn('wrong-match', `registry ${e.key}: affiliate_url does not contain Trip.com ID ${e.tripcom_id}; confirm the generated link targets the right property`);
}
if (CUTOVER && !PREVIEW) {
  for (const pr of profileProblems(PROFILE)) fail('profile', pr);
  const used = new Set();
  for (const e of reg.entries) if (e.decision !== 'remove' && e.link_count > 0) used.add(e.fallback_key && !e.affiliate_url ? e.fallback_key : e.key);
  for (const k of used) {
    const e = byKey.get(k); if (!e) continue;
    if (PILOT && !(e.pages || []).some(p => PILOT.pages.includes(p.page))) continue;
    const pr = affiliateUrlProblems(e.affiliate_url, PROFILE); if (pr.length) fail('registry-link', `${k}: ${pr.join('; ')}`);
  }
}
if (CUTOVER && !PREVIEW && !PILOT && fs.existsSync(path.join(DIR, 'data/tripcom/search-box.json'))) {
  const sb = JSON.parse(fs.readFileSync(path.join(DIR, 'data/tripcom/search-box.json'), 'utf8'));
  const home = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  if (sb.sha256 !== sha256(sb.embed_code)) fail('search-box', 'search-box.json embed code was modified (SHA-256 mismatch)');
  if (!home.includes(sb.embed_code)) fail('search-box', 'index.html does not contain the exact official embed code');
  if (!/<iframe[^>]+src="https:\/\/www\.trip\.com\/partners\/ad\/[A-Za-z0-9]+\?Allianceid=11013066&SID=333523744/.test(sb.embed_code)) fail('search-box', 'embed code does not carry the account identifiers');
}
if (CUTOVER && !PREVIEW && !PILOT && fs.existsSync(path.join(DIR, 'data/tripcom/dynamic-banner.json'))) {
  const db = JSON.parse(fs.readFileSync(path.join(DIR, 'data/tripcom/dynamic-banner.json'), 'utf8'));
  if (db.sha256 !== sha256(db.embed_code)) fail('dynamic-banner', 'dynamic-banner.json embed code was modified (SHA-256 mismatch)');
  if (db.source_url_sha256 !== sha256(db.source_url) || !db.embed_code.includes('src="' + db.source_url + '"')) fail('dynamic-banner', 'banner URL is not the exact recorded dashboard URL');
  if (!/Allianceid=11013066&SID=333523744/.test(db.source_url)) fail('dynamic-banner', 'banner URL does not carry the account identifiers');
  for (const pg of pages) {
    const n = (fs.readFileSync(path.join(DIR, pg), 'utf8').match(/id="DB20401215"/g) || []).length;
    if (pg === db.page && n !== 1) fail('dynamic-banner', `${pg}: expected exactly one banner, found ${n}`);
    if (pg !== db.page && n) fail('dynamic-banner', `${pg}: banner present outside its experiment page`);
  }
}
const out = path.join(DIR, 'tripcom-editorial-review.csv');
if (DIR !== ROOT) fs.writeFileSync(out, 'page,text\n' + editorial.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n') + '\n');

// ── Browser checks ──────────────────────────────────────────────────────────
function serve(dir) {
  return new Promise(res => {
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(dir, p);
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

async function browserChecks() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.join(require('os').homedir(), 'dananghotelguide/node_modules/playwright'))); }
  const srv = await serve(DIR);
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch({ channel: 'chrome' });
  const devices = { desktop: { viewport: { width: 1280, height: 800 } }, mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } };
  const local = u => u.startsWith(base) || /unpkg|cdnjs|jsdelivr|openstreetmap|tile/.test(u);

  if (flag('--render')) {
    for (const [dev, opts] of Object.entries(devices)) {
      const ctx = await browser.newContext(opts);
      await ctx.route(u => !local(u.toString()), r => r.abort());
      for (const page of pages) {
        const p = await ctx.newPage(); const errs = [];
        p.on('pageerror', e => errs.push(e.message));
        await p.goto(base + page, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
        await p.waitForTimeout(250);
        if (page === 'da-nang-hotels-map.html') await p.locator('.dhm-marker-hotel').first().click({ force: true, timeout: 4000 }).catch(() => fail('map-popup', `${dev}: could not open a hotel popup`));
        if (dev === 'mobile') await p.locator('#navHamburger, .nav-hamburger').first().click({ timeout: 2000 }).catch(() => {});
        // Move the pointer off any button so hover transitions don't skew colours.
        await p.mouse.move(0, 0).catch(() => {});
        await p.waitForTimeout(450);
        const r = await p.evaluate((LOGO_ON) => {
          const o = { unbranded: 0, unstyled: 0, popup: null, overflow: document.documentElement.scrollWidth - window.innerWidth, menuBtn: null };
          // Booking links only (same rule as tripcom-cta.js); editorial Trip.com guide links are not buttons.
          document.querySelectorAll('a[data-provider="tripcom"], a[href*="trip.com/hotels/"], a[href*="trip.com/t/"]').forEach(a => {
            const r = a.getBoundingClientRect(); if (!r.width || !r.height) return;
            if (a.querySelector('img') && !a.querySelector('.tc-btn__logo,.tc-link__logo')) return;
            if (LOGO_ON && !a.querySelector('.tc-btn__logo img, .tc-link__logo')) o.unbranded++;
            if (!LOGO_ON && !/trip\.com/i.test(a.getAttribute('aria-label') || a.textContent)) o.unbranded++;
            if (a.classList.contains('tc-btn') && !/rgb\((29, 78, 216|30, 64, 175|30, 58, 138)\)/.test(getComputedStyle(a).backgroundColor)) o.unstyled++;
          });
          o.emptyHref = [...document.querySelectorAll('a[data-provider="tripcom"], a.affiliate-link')].filter(a => { const h = a.getAttribute('href'); return !h || /undefined|null$/.test(h); }).length;
          const pop = document.querySelector('.leaflet-popup a[data-provider="tripcom"]'); if (document.querySelector('.leaflet-popup')) o.popup = !!(pop && (LOGO_ON ? pop.querySelector('.tc-btn__logo') : pop.classList.contains('tc-btn') || pop.querySelector('.tc-btn__text')));
          const mb = document.querySelector('.mobile-stays-btn'); if (mb && mb.getBoundingClientRect().height) o.menuBtn = LOGO_ON ? !!mb.querySelector('.tc-btn__logo') : true;
          return o;
        }, useLogo());
        if (errs.length) fail('render', `${dev} ${page}: JS error ${errs[0].slice(0, 100)}`);
        if (r.unbranded) fail('unbranded', `${dev} ${page}: ${r.unbranded} visible Trip.com link(s) without logo`);
        if (r.unstyled) fail('unbranded', `${dev} ${page}: ${r.unstyled} .tc-btn not rendered in component blue`);
        if (r.emptyHref) fail('render', `${dev} ${page}: ${r.emptyHref} booking link(s) with an empty or undefined href`);
        if (r.overflow > 1) fail('render', `${dev} ${page}: horizontal overflow ${r.overflow}px`);
        if (r.popup === false) fail('map-popup', `${dev} ${page}: popup booking button missing or unbranded`);
        if (dev === 'mobile' && r.menuBtn === false) fail('mobile-button', `${page}: mobile menu booking button unbranded`);
        await p.close();
      }
      await ctx.close();
    }
  }

  if (flag('--ga')) {
    const ctx = await browser.newContext(devices.mobile);
    await ctx.route(u => !local(u.toString()), r => r.abort());
    await ctx.addInitScript(() => { window.__ga = []; window.gtag = function () { window.__ga.push([].slice.call(arguments)); }; window.open = () => null; });
    for (const page of ['index.html', 'best-hotels-in-da-nang.html', 'da-nang-hotel-directory.html', 'da-nang-hotels-map.html']) {
      const p = await ctx.newPage();
      p.on('popup', np => np.close().catch(() => {}));
      await p.goto(base + page, { waitUntil: 'load' }).catch(() => {});
      await p.waitForTimeout(400);
      if (page === 'da-nang-hotels-map.html') { await p.locator('.dhm-marker-hotel').first().click({ force: true }).catch(() => {}); await p.waitForTimeout(300); }
      const sel = page === 'da-nang-hotels-map.html' ? '.leaflet-popup a[data-provider="tripcom"]' : 'a[data-provider="tripcom"]:not(.nav-stays-btn)';
      // Stop navigation; only the tracking listener should see the click.
      await p.evaluate(s => { const a = [...document.querySelectorAll(s)].find(x => x.getBoundingClientRect().height); if (a) { a.addEventListener('click', e => e.preventDefault()); a.click(); } }, sel);
      await p.waitForTimeout(150);
      const ev = (await p.evaluate(() => window.__ga.concat((window.dataLayer || []).map(a => Array.prototype.slice.call(a))))).filter(x => x[0] === 'event' && x[1] === 'affiliate_click');
      if (ev.length !== 1) fail('ga4', `${page}: ${ev.length} affiliate_click events for one click (expected 1)`);
      else {
        const prm = ev[0][2];
        for (const k of ['provider', 'page_path', 'cta_location', 'device_category']) if (!prm[k]) fail('ga4', `${page}: affiliate_click missing ${k}`);
        if (prm.provider !== 'tripcom') fail('ga4', `${page}: provider=${prm.provider}`);
        if (prm.device_category !== 'mobile') fail('ga4', `${page}: device_category=${prm.device_category} on a 390px phone`);
        if (page !== 'index.html' && !prm.hotel_name && prm.destination_type === 'hotel') warn('ga4', `${page}: hotel link without hotel_name`);
      }
      const old = (await p.evaluate(() => window.__ga.concat((window.dataLayer || []).map(a => Array.prototype.slice.call(a))))).filter(x => x[1] === 'booking_click');
      if (old.length) fail('ga4', `${page}: legacy booking_click still fired`);
      await p.close();
    }
    await ctx.close();
  }

  if (flag('--destinations')) {
    const ctx = await browser.newContext({ locale: 'en-US' });
    await ctx.route(/google|doubleclick|facebook|criteo|bing/, r => r.abort());
    const seen = new Set();
    for (const e of reg.entries) {
      if (!e.tripcom_destination || seen.has(e.tripcom_destination)) continue;
      seen.add(e.tripcom_destination);
      const p = await ctx.newPage();
      await p.goto(e.tripcom_destination, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
      await p.waitForSelector('h1', { timeout: 15000 }).catch(() => {});
      const h1 = await p.evaluate(() => (document.querySelector('h1') || {}).innerText || '').catch(() => '');
      const title = await p.title().catch(() => '');
      if (e.tripcom_type === 'hotel' && !h1) fail('broken-destination', `${e.key}: Trip.com hotel ${e.tripcom_id} shows no hotel page (redirected or removed)`);
      else if (e.tripcom_type === 'hotel' && e.tripcom_name && h1.trim() !== e.tripcom_name.trim()) warn('broken-destination', `${e.key}: Trip.com now shows "${h1}" (registry: "${e.tripcom_name}")`);
      if (e.tripcom_type === 'city' && !/Hotels/.test(title)) fail('broken-destination', `${e.key}: city list ${e.tripcom_id} did not load`);
      await p.close();
      await new Promise(r => setTimeout(r, 1500)); // polite pacing
    }
    await ctx.close();
  }

  await browser.close();
  srv.close();
}

(async () => {
  if (flag('--render') || flag('--ga') || flag('--destinations')) await browserChecks();
  console.log(`Pages: ${pages.length} | Trip.com URLs: ${tripLinks} | editorial Booking.com mentions for review: ${editorial.length}`);
  const tally = list => list.reduce((a, s) => (a[s.slice(1, s.indexOf(']'))] = (a[s.slice(1, s.indexOf(']'))] || 0) + 1, a), {});
  console.log('Reminder: a GA4 click event proves a click on our site only. Attribution is proven solely by a booking appearing in Trip.com\'s Booking report (T+1) and, after check-out, the Commission report (5th of the next month).');
  console.log('Failures:', JSON.stringify(tally(failures)), '| Warnings:', JSON.stringify(tally(warnings)));
  for (const f of failures.slice(0, 60)) console.log('  FAIL ' + f);
  if (failures.length > 60) console.log(`  ... ${failures.length - 60} more`);
  if (flag('--verbose')) for (const w of warnings) console.log('  warn ' + w);
  process.exit(failures.length ? 1 : 0);
})();
