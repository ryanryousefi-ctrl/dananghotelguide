#!/usr/bin/env node
/**
 * fix-cj-affiliate.js
 *
 * Fixes all Booking.com affiliate links sitewide for CJ Deep Link Automation.
 *
 * CJ implementation:
 *   Publisher ID: 101820678
 *   Method: CJ Deep Link Automation (DLA)
 *   Script: https://www.anrdoezrs.net/am/101820678/include/allCj/impressions/page/am.js
 *
 * How CJ DLA works:
 *   On DOM ready, the script attaches a click listener to every <a> tag.
 *   On click, if element.href matches a whitelisted domain (booking.com is in the list),
 *   it rewrites element.href to: https://www.qksrv.net/links/101820678/type/am/<original-url>
 *   This CJ redirect fires a click event and forwards to Booking.com.
 *
 * Requirements for CJ DLA to track a click:
 *   1. The <a> href must contain a booking.com URL at click time.
 *   2. The CJ DLA script must have loaded and attached its listener.
 *   3. The Booking.com URL should include aid=1784897 for Booking.com's own tracking.
 *
 * What this script fixes:
 *   1. Adds aid=1784897 to all Booking.com URLs that are missing it.
 *   2. Replaces href="#" on booking CTAs with the actual Booking.com URL
 *      (previously JS set href from data-booking-url on page load —
 *       this makes it direct so CJ DLA and fallback both work without JS).
 *   3. Ensures data-booking-url matches href on all booking CTAs.
 *   4. Removes Awin links from the JS that previously swapped href="#".
 *   5. Adds &sid= placement identifiers to hotel-specific links where page context
 *      can be inferred (best-hotels, luxury-hotels, etc.) — CJ SID parameter.
 *
 * NOT changed:
 *   - Generic Booking.com search URLs (dest_id=6232 region links) — these are correct
 *   - The CJ DLA script tag itself
 *   - Any non-commercial href=# (share buttons, navigation anchors, etc.)
 *   - Internal site links
 *   - Hoi An dest_id=-3723930 links (correct for Hoi An)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let totalFilesScanned = 0;
let totalFilesChanged = 0;
let totalReplacements = 0;
const changedFiles = [];

function walkHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      if (['.git', 'node_modules', 'images', '.claude'].includes(e.name)) continue;
      files.push(...walkHtml(path.join(dir, e.name)));
    } else if (e.isFile() && e.name.endsWith('.html')) {
      files.push(path.join(dir, e.name));
    }
  }
  return files;
}

// Add aid=1784897 to a Booking.com URL if missing.
// Preserves all existing params.
function addAid(url) {
  if (!url || !url.includes('booking.com')) return url;
  if (url.includes('aid=')) return url; // already has aid
  // Don't add aid to error pages, homepage, or non-property/search URLs
  if (!url.includes('/hotel/vn/') && !url.includes('searchresults')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return url + sep + 'aid=1784897';
}

// Fix a single Booking.com URL in an href or data-booking-url attribute value.
// Adds aid=1784897 if missing.
function fixBookingUrl(url) {
  if (!url || !url.includes('booking.com')) return url;
  return addAid(url);
}

// Derive a SID placement identifier from the filename + link context.
// Format: <page-slug>-<hotel-slug>
// This is passed as &sid= in the Booking.com URL for CJ placement tracking.
// Only applied to hotel-specific (/hotel/vn/) links, not generic search links.
function deriveSid(pageBasename, hotelSlug) {
  // Truncate to avoid excessively long SIDs
  const page = pageBasename.replace(/\.html$/, '').replace(/[^a-z0-9-]/g, '-').slice(0, 40);
  const hotel = hotelSlug.replace(/\.html$/, '').replace(/[^a-z0-9-]/g, '-').slice(0, 30);
  return `${page}--${hotel}`;
}

// Add SID to a Booking.com hotel URL.
// SID goes as a query param on the URL itself — CJ reads the full URL including params.
// Only add if not already present.
function addSid(url, pageBasename) {
  if (!url || !url.includes('/hotel/vn/')) return url;
  if (url.includes('&sid=') || url.includes('?sid=')) return url;
  const slugMatch = url.match(/\/hotel\/vn\/([^/?.]+)/);
  if (!slugMatch) return url;
  const hotelSlug = slugMatch[1];
  const sid = deriveSid(pageBasename, hotelSlug);
  return url + (url.includes('?') ? '&' : '?') + 'sid=' + sid;
}

// Fix a full href attribute value:
// - adds aid=1784897 if missing on booking.com URLs
// - adds SID if it's a hotel-specific URL
function fixHref(url, pageBasename) {
  if (!url || !url.includes('booking.com')) return url;
  let fixed = fixBookingUrl(url);
  fixed = addSid(fixed, pageBasename);
  return fixed;
}

const htmlFiles = walkHtml(ROOT);
totalFilesScanned = htmlFiles.length;

for (const filePath of htmlFiles) {
  const pageBasename = path.basename(filePath);
  let original = fs.readFileSync(filePath, 'utf8');
  let content = original;
  let fileChanges = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 1: href="#" booking CTAs — replace # with the data-booking-url value.
  //
  // Pattern: href="#" ... data-booking-url="https://www.booking.com/..."
  // OR:      data-booking-url="https://www.booking.com/..." ... href="#"
  //
  // We need to handle multi-attribute <a> tags where href="#" and
  // data-booking-url are on the same element (possibly across lines).
  // Strategy: find all <a ...> tags, check if they have both href="#" and
  // data-booking-url pointing to booking.com. If so, replace href="#" with
  // the data-booking-url value (with aid added).
  // ─────────────────────────────────────────────────────────────────────────

  // Match <a ...> tags (single or multi-line) that contain both href="#" and data-booking-url
  // We use a non-greedy match up to the closing >
  content = content.replace(/<a\b([^>]*?)>/gs, (fullMatch, attrs) => {
    // Only process if this <a> has href="#"
    if (!/href="#"/.test(attrs)) return fullMatch;
    // Only process if it has a data-booking-url pointing to booking.com
    const dbMatch = attrs.match(/data-booking-url="(https:\/\/[^"]*booking\.com[^"]*)"/);
    if (!dbMatch) return fullMatch;

    const bookingUrl = dbMatch[1];
    // Skip if the booking URL itself is "#" or empty
    if (!bookingUrl || bookingUrl === '#') return fullMatch;

    // Apply aid + SID to the URL
    const fixedUrl = fixHref(bookingUrl, pageBasename);

    // Replace href="#" with href="<fixedUrl>" in the attrs
    const newAttrs = attrs.replace(/href="#"/, `href="${fixedUrl}"`);

    // Also update data-booking-url to match (add aid+SID there too)
    const newAttrs2 = newAttrs.replace(
      /data-booking-url="(https:\/\/[^"]*booking\.com[^"]*)"/,
      `data-booking-url="${fixedUrl}"`
    );

    if (newAttrs2 !== attrs) {
      fileChanges++;
      return `<a${newAttrs2}>`;
    }
    return fullMatch;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 2: Direct Booking.com href values missing aid=1784897.
  //        Matches: href="https://www.booking.com/hotel/vn/..." (no aid)
  // ─────────────────────────────────────────────────────────────────────────
  content = content.replace(
    /href="(https:\/\/(?:www\.)?booking\.com\/hotel\/vn\/[^"]+)"/g,
    (match, url) => {
      const fixed = fixHref(url, pageBasename);
      if (fixed !== url) {
        fileChanges++;
        return `href="${fixed}"`;
      }
      return match;
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 3: data-booking-url values missing aid=1784897 (hotel-specific).
  // ─────────────────────────────────────────────────────────────────────────
  content = content.replace(
    /data-booking-url="(https:\/\/(?:www\.)?booking\.com\/hotel\/vn\/[^"]+)"/g,
    (match, url) => {
      const fixed = fixHref(url, pageBasename);
      if (fixed !== url) {
        fileChanges++;
        return `data-booking-url="${fixed}"`;
      }
      return match;
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 4: Generic searchresults href values missing aid=1784897.
  //        Pattern: href="https://www.booking.com/searchresults..." (no aid)
  // ─────────────────────────────────────────────────────────────────────────
  content = content.replace(
    /href="(https:\/\/(?:www\.)?booking\.com\/searchresults[^"]+)"/g,
    (match, url) => {
      const fixed = addAid(url);
      if (fixed !== url) {
        fileChanges++;
        return `href="${fixed}"`;
      }
      return match;
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 5: data-booking-url generic search values missing aid=1784897.
  // ─────────────────────────────────────────────────────────────────────────
  content = content.replace(
    /data-booking-url="(https:\/\/(?:www\.)?booking\.com\/searchresults[^"]+)"/g,
    (match, url) => {
      const fixed = addAid(url);
      if (fixed !== url) {
        fileChanges++;
        return `data-booking-url="${fixed}"`;
      }
      return match;
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 6: Remove the JS that was used to swap href="#" from data-booking-url.
  //        Now that href is set directly, this JS is no longer needed.
  //        Pattern:
  //          document.querySelectorAll('a[data-booking-url]').forEach(function(el){
  //            var dest = el.getAttribute('data-booking-url');
  //            ...
  //            el.href = dest;
  //          });
  //        We'll keep the block but make it a no-op comment since removing it
  //        entirely risks breaking whitespace-sensitive diffs. Actually, we'll
  //        fully remove it — it served only to set href from data-booking-url,
  //        which we've now done statically.
  // ─────────────────────────────────────────────────────────────────────────
  const dataBookingJsPattern = /\s*document\.querySelectorAll\('a\[data-booking-url\]'\)\.forEach\(function\(el\)\{[\s\S]*?var dest\s*=\s*el\.getAttribute\('data-booking-url'\);[\s\S]*?el\.href\s*=\s*dest;[\s\S]*?\}\);\s*/g;
  content = content.replace(dataBookingJsPattern, (match) => {
    fileChanges++;
    return '\n  ';
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 7: Awin links in JS (STATIC_DA_NANG_AWIN variable etc.)
  //        Replace any remaining awin1.com href or JS variable with
  //        the canonical direct Booking.com search URL (with aid).
  // ─────────────────────────────────────────────────────────────────────────
  const awinHrefPattern = /href="https:\/\/www\.awin1\.com\/cread\.php\?[^"]+ued=(https?[^"&]+)"/g;
  content = content.replace(awinHrefPattern, (match, ued) => {
    try {
      const decodedUed = decodeURIComponent(ued);
      const fixed = addAid(decodedUed);
      fileChanges++;
      return `href="${fixed}"`;
    } catch {
      return match;
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 8: Deduplicate aid=1784897 if it appears twice.
  //        This can happen if the URL already had aid= and we added it again.
  // ─────────────────────────────────────────────────────────────────────────
  content = content.replace(/aid=1784897(&aid=1784897)+/g, 'aid=1784897');

  // ─────────────────────────────────────────────────────────────────────────
  // Write if changed
  // ─────────────────────────────────────────────────────────────────────────
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFilesChanged++;
    totalReplacements += fileChanges;
    changedFiles.push({ file: path.relative(ROOT, filePath), changes: fileChanges });
    process.stdout.write(`FIXED [${fileChanges}]: ${path.relative(ROOT, filePath)}\n`);
  }
}

process.stdout.write('\n========== CJ AFFILIATE FIX COMPLETE ==========\n');
process.stdout.write(`Files scanned:    ${totalFilesScanned}\n`);
process.stdout.write(`Files changed:    ${totalFilesChanged}\n`);
process.stdout.write(`Total replacements: ${totalReplacements}\n`);
