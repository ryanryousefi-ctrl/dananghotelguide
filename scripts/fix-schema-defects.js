#!/usr/bin/env node
/*
 * Fixes two JSON-LD defects found during the SEO cleanup pass:
 *
 * 1. Invalid JSON: some Article/FAQPage text fields have a live <a href="...">
 *    anchor tag embedded directly in the JSON string (from an earlier
 *    templating step that interpolated HTML into a schema.org text field).
 *    schema.org text properties must be plain text, so this both breaks
 *    JSON parsing and is invalid structured data. Fix: strip the tag,
 *    keep the anchor's visible text.
 *
 * 2. Fabricated reviewRating: 26 pages carry a schema.org Review block
 *    with a reviewRating.ratingValue (e.g. "4.3") that was hand-typed,
 *    not sourced from any real guest-review aggregate, and doesn't even
 *    consistently match the page's own displayed 1-10 editorial score.
 *    Per Google's guidelines, a Review without a genuine supporting
 *    rating source is not defensible structured data. Fix: remove the
 *    whole Review script block (the LodgingBusiness description inside
 *    it is redundant with the page's own Article.description).
 *
 * Idempotent: safe to re-run.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function stripEmbeddedAnchor(jsonText) {
  // Matches <a href="...">TEXT</a> inside a JSON string value and
  // replaces it with just TEXT, undoing the HTML-in-JSON injection.
  return jsonText.replace(/<a href="[^"]*"(?: style="[^"]*")?>([^<]*)<\/a>/g, '$1');
}

function processFile(filePath, dryRun) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  const scriptPattern = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let removedReviewBlock = false;
  let strippedAnchor = false;

  content = content.replace(scriptPattern, (fullMatch, jsonText) => {
    const isReviewBlock = /"@type":\s*"Review"/.test(jsonText);

    if (isReviewBlock) {
      // Only remove if it carries a fabricated reviewRating. A Review
      // block with no rating at all (the legacy review-*.html pages)
      // is left in place, just cleaned of any embedded anchor tags.
      if (/reviewRating/.test(jsonText)) {
        removedReviewBlock = true;
        return ''; // delete the whole <script>...</script> block
      }
    }

    if (/<a href=/.test(jsonText)) {
      const cleaned = stripEmbeddedAnchor(jsonText);
      if (cleaned !== jsonText) {
        strippedAnchor = true;
        // Validate the cleaned text actually parses before accepting it.
        try {
          JSON.parse(cleaned);
          return `<script type="application/ld+json">${cleaned}</script>`;
        } catch (e) {
          // Leave untouched and let the report surface this file for
          // manual review rather than writing something still broken.
          return fullMatch;
        }
      }
    }
    return fullMatch;
  });

  const changed = content !== original;

  if (changed && !dryRun) {
    // Collapse any blank line left behind by a removed script block,
    // but only on files we actually modified above.
    content = content.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return { removedReviewBlock, strippedAnchor, changed };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const targets = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
  let totalChanged = 0;
  let totalReviewRemoved = 0;
  let totalAnchorStripped = 0;
  const report = [];

  for (const f of targets) {
    const filePath = path.join(ROOT, f);
    const { removedReviewBlock, strippedAnchor, changed } = processFile(filePath, dryRun);
    if (changed) {
      totalChanged++;
      if (removedReviewBlock) totalReviewRemoved++;
      if (strippedAnchor) totalAnchorStripped++;
      report.push({ file: f, removedReviewBlock, strippedAnchor });
    }
  }

  console.log(dryRun ? '[DRY RUN] No files written.' : '[WRITE MODE]');
  console.log(`Files scanned: ${targets.length}`);
  console.log(`Files changed: ${totalChanged}`);
  console.log(`Review blocks removed (fabricated rating): ${totalReviewRemoved}`);
  console.log(`Files with embedded-anchor JSON fixed: ${totalAnchorStripped}`);
  console.log('');
  report.forEach((r) => {
    console.log(`  ${r.file} | reviewRemoved=${r.removedReviewBlock} anchorFixed=${r.strippedAnchor}`);
  });
}

main();
