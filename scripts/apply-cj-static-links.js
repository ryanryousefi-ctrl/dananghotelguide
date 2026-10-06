#!/usr/bin/env node
/*
 * Replaces every plain booking.com href= in every root-level .html file
 * (and kr/*.html) with the official CJ-generated static tracking URL, so
 * attribution no longer depends on the client-side DLA script rewriting
 * the href at click time.
 *
 * Canonical format, confirmed directly from the CJ Account Manager for
 * this account (website DaNang Hotel Guide / 101820678, advertiser
 * Booking.com North America / 7864295, Evergreen Link ID 17293132):
 *
 *   https://www.kqzyfj.com/click-101820678-17293132?sid=<SID>&url=<encoded booking.com URL>
 *
 * Verified end-to-end via real browser redirect-chain tracing (not just
 * an HTTP status check): kqzyfj.com -> cj.dotomi.com -> emjcd.com ->
 * booking.com, landing on the correct hotel property with the `sid`
 * value correctly surfacing as `clkid` in Booking.com's own CJ
 * attribution label. CJ substitutes its own Booking.com aid (observed:
 * aid=8133101) regardless of what aid, if any, is present in the
 * destination URL, so our aid=1784897 is dropped from the destination
 * here rather than carried through inertly.
 *
 * - Only touches href="https://www.booking.com/..." inside <a ...> tags.
 * - Leaves JSON-LD "url":"https://www.booking.com/..." fields untouched
 *   (structured data is read by crawlers, not clicked; CJ-wrapping it
 *   would misrepresent the declared resource and risks looking like
 *   cloaking to Google).
 * - Idempotent: if a href is already a kqzyfj.com CJ link, it is skipped.
 * - Does not touch data-booking-url (kept as the clean, human-readable
 *   destination for reference; nothing in the current JS reads it).
 */

const fs = require('fs');
const path = require('path');

const CJ_WEBSITE_ID = '101820678';
const CJ_EVERGREEN_LINK_ID = '17293132';
const CJ_CLICK_BASE = `https://www.kqzyfj.com/click-${CJ_WEBSITE_ID}-${CJ_EVERGREEN_LINK_ID}`;

/* Pulls the existing sid= value out of a booking.com href's query string,
   or derives one from the page's own basename if the link has none, so
   every generated CJ click carries a meaningful, page-specific sub-ID. */
function extractSid(bookingHref, fallbackSid) {
  const m = bookingHref.match(/[?&]sid=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  return fallbackSid;
}

function stripAidAndSid(bookingHref) {
  // Remove our own aid= and sid= from the destination URL: CJ overrides
  // aid unconditionally, and sid is passed as its own top-level CJ param
  // instead, not as part of the wrapped destination.
  return bookingHref
    .replace(/([?&])aid=1784897&?/, '$1')
    .replace(/([?&])sid=[^&]*&?/, '$1')
    .replace(/[?&]$/, '');
}

function buildCjUrl(bookingHref, fallbackSid) {
  const sid = extractSid(bookingHref, fallbackSid);
  const cleanedDest = stripAidAndSid(bookingHref);
  return `${CJ_CLICK_BASE}?sid=${encodeURIComponent(sid)}&url=${encodeURIComponent(cleanedDest)}`;
}

function isAlreadyCjLink(href) {
  return href.startsWith('https://www.kqzyfj.com/click-');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const baseName = path.basename(filePath, '.html');
  let changed = 0;
  let skippedAlreadyWrapped = 0;

  // Pass 1: static HTML href="https://www.booking.com/...".
  const hrefPattern = /href="(https:\/\/www\.booking\.com\/[^"]*)"/g;
  content = content.replace(hrefPattern, (match, rawHref) => {
    if (isAlreadyCjLink(rawHref)) {
      skippedAlreadyWrapped++;
      return match;
    }
    const decodedHref = rawHref.replace(/&amp;/g, '&');
    const cjUrl = buildCjUrl(decodedHref, baseName);
    changed++;
    return `href="${cjUrl}"`;
  });

  // Pass 2: JS object-literal fields that hold a raw booking.com string
  // and get rendered into a real href at runtime (bookingUrl:'...',
  // bk:'...' — the two field names found in use sitewide for this).
  const jsFieldPattern = /\b(bookingUrl|bk):'(https:\/\/www\.booking\.com\/[^']*)'/g;
  content = content.replace(jsFieldPattern, (match, fieldName, rawHref) => {
    if (isAlreadyCjLink(rawHref)) {
      skippedAlreadyWrapped++;
      return match;
    }
    const cjUrl = buildCjUrl(rawHref, baseName);
    changed++;
    return `${fieldName}:'${cjUrl}'`;
  });

  if (changed > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return { changed, skippedAlreadyWrapped };
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const targets = [];

  for (const f of fs.readdirSync(rootDir)) {
    if (f.endsWith('.html')) targets.push(path.join(rootDir, f));
  }
  const krDir = path.join(rootDir, 'kr');
  if (fs.existsSync(krDir)) {
    for (const f of fs.readdirSync(krDir)) {
      if (f.endsWith('.html')) targets.push(path.join(krDir, f));
    }
  }

  let totalChanged = 0;
  let totalSkipped = 0;
  let filesChanged = 0;
  const report = [];

  for (const filePath of targets) {
    const { changed, skippedAlreadyWrapped } = processFile(filePath);
    if (changed > 0) {
      filesChanged++;
      report.push({ file: path.relative(rootDir, filePath), changed });
    }
    totalChanged += changed;
    totalSkipped += skippedAlreadyWrapped;
  }

  console.log(`Files scanned: ${targets.length}`);
  console.log(`Files modified: ${filesChanged}`);
  console.log(`Total href= links wrapped: ${totalChanged}`);
  console.log(`Already-wrapped (skipped): ${totalSkipped}`);
  console.log('');
  report.sort((a, b) => b.changed - a.changed);
  for (const r of report) {
    console.log(`  ${r.changed.toString().padStart(3)}  ${r.file}`);
  }
}

main();
