#!/usr/bin/env node
/**
 * fix-booking-links.js
 *
 * Fixes all bad Booking.com / Awin affiliate links sitewide.
 *
 * Bad pattern: dest_id=-3730689 (city-level ID that resolves to Thôn Mai Ðang)
 * Fixed destination: Da Nang Municipality region (dest_id=6232&dest_type=region)
 *
 * Canonical clean ued value (URL-encoded for Awin wrapper):
 *   https%3A%2F%2Fwww.booking.com%2Fsearchresults.en-us.html%3Fss%3DDa%2BNang%2BMunicipality%252C%2BVietnam%26dest_id%3D6232%26dest_type%3Dregion%26aid%3D1784897%26lang%3Den-us
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// The canonical good ued value (already URL-encoded for the Awin wrapper)
const GOOD_UED = 'https%3A%2F%2Fwww.booking.com%2Fsearchresults.en-us.html%3Fss%3DDa%2BNang%2BMunicipality%252C%2BVietnam%26dest_id%3D6232%26dest_type%3Dregion%26aid%3D1784897%26lang%3Den-us';

// The canonical good STATIC_DA_NANG_AWIN JS value (unencoded, used in encodeURIComponent())
const GOOD_STATIC_JS = "https://www.awin1.com/cread.php?awinmid=18119&awinaffid=2788028&ued=' + encodeURIComponent('https://www.booking.com/searchresults.en-us.html?ss=Da+Nang+Municipality%2C+Vietnam&dest_id=6232&dest_type=region&aid=1784897&lang=en-us')";

// Patterns to detect "bad" generic search links (searchresults + dest_id=-3730689)
// We will replace the entire ued= value in Awin-wrapped links.
// Pattern: &ued=<everything containing dest_id=-3730689 or old Da Nang city ss params>
// We match from &ued= (or ?ued= at start) to end of the href value (quote char)

// Also fix hotel-specific data-booking-url that incorrectly appends dest_id=-3730689&dest_type=city
// Those should just drop the bad trailing params (keep the hotel URL clean)

let totalFilesScanned = 0;
let totalFilesChanged = 0;
let totalReplacements = 0;
const changedFiles = [];

// Walk all .html files recursively
function walkHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      // Skip node_modules, .git, images
      if (['.git', 'node_modules', 'images'].includes(e.name)) continue;
      files.push(...walkHtml(path.join(dir, e.name)));
    } else if (e.isFile() && e.name.endsWith('.html')) {
      files.push(path.join(dir, e.name));
    }
  }
  return files;
}

const htmlFiles = walkHtml(ROOT);
totalFilesScanned = htmlFiles.length;

for (const filePath of htmlFiles) {
  let original = fs.readFileSync(filePath, 'utf8');
  let content = original;
  let fileChanges = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 1: Awin-wrapped generic search links (HTML href attributes)
  // Old ued value contains dest_id=-3730689 (and possibly -3712125)
  // Pattern: &ued=https%3A%2F%2Fwww.booking.com%2Fsearchresults...dest_id%3D-3730689...
  // We need to replace the ENTIRE ued= value up to the next " or '
  //
  // The bad ued has multiple possible forms (all URL-encoded):
  //   searchresults.html?ss=Da+Nang%252C+... or searchresults.html?ss=Da%2BNang...
  // So we match on: ued= followed by anything containing -3730689 or -3712125
  // ─────────────────────────────────────────────────────────────────────────

  // Match: &ued=<url-encoded-string-containing-dest_id=-3730689-or-3712125>
  // Terminated by a double-quote, single-quote, space, or end of attribute
  // We use a regex that captures the clickref if present, then replaces ued=

  // Generic searchresults links: replace bad ued= with good ued=
  // This regex matches the ued=... portion of a bad generic link
  const badUedRegex = /&ued=https%3A%2F%2Fwww\.booking\.com%2Fsearchresults[^"']*?(-3730689|-3712125|Da%2BNang%252C)[^"']*/g;

  let newContent = content.replace(badUedRegex, (match) => {
    fileChanges++;
    return `&ued=${GOOD_UED}`;
  });
  content = newContent;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 2: JS STATIC_DA_NANG_AWIN variable with encodeURIComponent()
  // ─────────────────────────────────────────────────────────────────────────
  const badStaticJs = /var STATIC_DA_NANG_AWIN = 'https:\/\/www\.awin1\.com\/cread\.php\?awinmid=18119&awinaffid=2788028&ued=' \+ encodeURIComponent\('[^']*(-3730689|-3712125|Da\+Nang%2C)[^']*'\);/g;

  newContent = content.replace(badStaticJs, (match) => {
    fileChanges++;
    return `var STATIC_DA_NANG_AWIN = 'https://www.awin1.com/cread.php?awinmid=18119&awinaffid=2788028&ued=' + encodeURIComponent('https://www.booking.com/searchresults.en-us.html?ss=Da+Nang+Municipality%2C+Vietnam&dest_id=6232&dest_type=region&aid=1784897&lang=en-us');`;
  });
  content = newContent;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 3: Hotel-specific data-booking-url attrs that incorrectly append
  //        dest_id=-3730689&dest_type=city to a /hotel/vn/ URL
  //        Keep hotel URL, strip the bad params
  // ─────────────────────────────────────────────────────────────────────────
  const badHotelDataUrl = /(data-booking-url="https:\/\/www\.booking\.com\/hotel\/vn\/[^"?]+\.html)\?dest_id=-3730689&dest_type=city(")/g;

  newContent = content.replace(badHotelDataUrl, (match, hotelUrlPart, closingQuote) => {
    fileChanges++;
    return `${hotelUrlPart}${closingQuote}`;
  });
  content = newContent;

  // Also handle ?dest_id=-3712125&dest_type=city on hotel URLs
  const badHotelDataUrl2 = /(data-booking-url="https:\/\/www\.booking\.com\/hotel\/vn\/[^"?]+\.html)\?dest_id=-3712125&dest_type=city(")/g;

  newContent = content.replace(badHotelDataUrl2, (match, hotelUrlPart, closingQuote) => {
    fileChanges++;
    return `${hotelUrlPart}${closingQuote}`;
  });
  content = newContent;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 4: Comment lines that reference dest_id=-3730689 — update them
  // ─────────────────────────────────────────────────────────────────────────
  const badCommentRegex = /(<!-- Affiliate Config:[^>]*?)dest_id=-3730689 \(Da Nang\)([^>]*?-->)/g;

  newContent = content.replace(badCommentRegex, (match, before, after) => {
    fileChanges++;
    return `${before}dest_id=6232 (Da Nang Municipality region)${after}`;
  });
  content = newContent;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 5: Remove stale ssne=, ssne_untouched=, search_pageview_id=, ac_meta=
  //        from any Booking.com URL (both raw and URL-encoded forms)
  //        These appear inside ued= values or data-booking-url attributes
  // ─────────────────────────────────────────────────────────────────────────
  // URL-encoded form within ued= values: %26ssne%3D..., %26ssne_untouched%3D..., etc.
  // These would appear as %26ssne%3D<value>%26 or at end before quote
  const staleEncodedParams = [
    /%26ssne%3D[^%"'&]*/gi,
    /%26ssne_untouched%3D[^%"'&]*/gi,
    /%26search_pageview_id%3D[^%"'&]*/gi,
    /%26ac_meta%3D[^%"'&]*/gi,
  ];
  for (const re of staleEncodedParams) {
    newContent = content.replace(re, (match) => {
      fileChanges++;
      return '';
    });
    content = newContent;
  }

  // Raw form in data-booking-url or similar: &ssne=..., &ssne_untouched=..., etc.
  const staleRawParams = [
    /&ssne=[^&"'\s]*/gi,
    /&ssne_untouched=[^&"'\s]*/gi,
    /&search_pageview_id=[^&"'\s]*/gi,
    /&ac_meta=[^&"'\s]*/gi,
  ];
  for (const re of staleRawParams) {
    newContent = content.replace(re, (match) => {
      fileChanges++;
      return '';
    });
    content = newContent;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 6: Remove stale hardcoded checkin=/checkout= from static links
  //        Only remove if they appear to be hardcoded dates (checkin=202...)
  //        Don't touch JS form handlers
  // ─────────────────────────────────────────────────────────────────────────
  // URL-encoded form: %26checkin%3D202...
  const staleCheckinEncoded = [
    /%26checkin%3D202[^%"'&]*/gi,
    /%26checkout%3D202[^%"'&]*/gi,
  ];
  for (const re of staleCheckinEncoded) {
    newContent = content.replace(re, (match) => {
      fileChanges++;
      return '';
    });
    content = newContent;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 7: Remove label=affnetawin... junk from URLs
  // ─────────────────────────────────────────────────────────────────────────
  const badLabel = /&label=affnetawin[^&"'\s]*/gi;
  newContent = content.replace(badLabel, (match) => {
    fileChanges++;
    return '';
  });
  content = newContent;

  // URL-encoded form: %26label%3Daffnetawin...
  const badLabelEncoded = /%26label%3Daffnetawin[^%"'&]*/gi;
  newContent = content.replace(badLabelEncoded, (match) => {
    fileChanges++;
    return '';
  });
  content = newContent;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 8: Fix AWIN_BASE JS variable if it doesn't include clickref logic
  //        and points to bad destination
  //        Also fix any inline JS that builds the AWIN URL with dest_id=-3730689
  // ─────────────────────────────────────────────────────────────────────────
  // Pattern: encodeURIComponent('https://www.booking.com/searchresults...dest_id=-3730689...') in JS
  const badJsEncodeUri = /encodeURIComponent\('https:\/\/www\.booking\.com\/searchresults[^']*?(-3730689|-3712125|Da\+Nang%2C|Da\+Nang,)[^']*'\)/g;
  newContent = content.replace(badJsEncodeUri, (match) => {
    fileChanges++;
    return `encodeURIComponent('https://www.booking.com/searchresults.en-us.html?ss=Da+Nang+Municipality%2C+Vietnam&dest_id=6232&dest_type=region&aid=1784897&lang=en-us')`;
  });
  content = newContent;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 9: data-booking-url attributes with searchresults.html + bad dest_id
  //        These are used by JS to build the Awin URL dynamically.
  //        Replace the entire bad URL value with the canonical good URL.
  // ─────────────────────────────────────────────────────────────────────────
  const badDataBookingSearchresults = /(data-booking-url=")https:\/\/www\.booking\.com\/searchresults[^"]*?(-3730689|-3712125)[^"]*(")/g;
  newContent = content.replace(badDataBookingSearchresults, (match, open, badId, close) => {
    fileChanges++;
    return `${open}https://www.booking.com/searchresults.en-us.html?ss=Da+Nang+Municipality%2C+Vietnam&dest_id=6232&dest_type=region&aid=1784897&lang=en-us${close}`;
  });
  content = newContent;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 10: Direct href Booking.com searchresults links (not Awin-wrapped)
  //         These appear in kr/ locale files.
  //         Fix the dest params: dest_id=-3730689&dest_type=city => dest_id=6232&dest_type=region
  //         Also update ss param and remove stale label= junk
  // ─────────────────────────────────────────────────────────────────────────
  // Pattern: href="https://www.booking.com/searchresults.html?...dest_id=-3730689..."
  const badDirectHref = /(href=")https:\/\/www\.booking\.com\/searchresults\.html\?[^"]*(-3730689|-3712125)[^"]*(")/g;
  newContent = content.replace(badDirectHref, (match, open, badId, close) => {
    // Extract label value if present (keep it as-is for kr/ tracking)
    const labelMatch = match.match(/label=([^&"]+)/);
    const labelPart = labelMatch ? `&label=${labelMatch[1]}` : '';
    // Extract aid value
    const aidMatch = match.match(/aid=(\d+)/);
    const aidPart = aidMatch ? `&aid=${aidMatch[1]}` : '&aid=1784897';
    fileChanges++;
    return `${open}https://www.booking.com/searchresults.en-us.html?ss=Da+Nang+Municipality%2C+Vietnam&dest_id=6232&dest_type=region${aidPart}${labelPart}&lang=en-us${close}`;
  });
  content = newContent;

  // ─────────────────────────────────────────────────────────────────────────
  // Write file if changed
  // ─────────────────────────────────────────────────────────────────────────
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFilesChanged++;
    totalReplacements += fileChanges;
    changedFiles.push({ file: path.relative(ROOT, filePath), changes: fileChanges });
    console.log(`FIXED [${fileChanges} changes]: ${path.relative(ROOT, filePath)}`);
  }
}

console.log('\n========== FIX COMPLETE ==========');
console.log(`Files scanned: ${totalFilesScanned}`);
console.log(`Files changed: ${totalFilesChanged}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log('\nChanged files:');
for (const { file, changes } of changedFiles) {
  console.log(`  ${file} (${changes} changes)`);
}
