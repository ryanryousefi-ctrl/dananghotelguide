#!/usr/bin/env node
/**
 * audit-booking-links.js — DEPRECATED. DO NOT USE.
 *
 * This script checked for Awin-era bad link patterns. Awin has been replaced by CJ.
 * Use scripts/audit-cj-affiliate.js instead.
 *
 * Original description (historical):
 * Scans all .html files for bad Booking.com / Awin affiliate link patterns.
 * Reports file + line number + matched text for each issue found.
 * Exit code: 0 if clean, 1 if issues found.
 *
 * No external dependencies — uses only Node.js built-ins.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const BAD_PATTERNS = [
  { pattern: /Th.n\s*Mai/gi, label: 'Thon Mai Dang destination (literal Vietnamese)' },
  { pattern: /dest_id=-3730689/g, label: 'Wrong dest_id -3730689' },
  { pattern: /dest_id=-3712125/g, label: 'Wrong dest_id -3712125' },
  { pattern: /dest_id=-3714993/g, label: 'Wrong dest_id -3714993 (Da Nang city — use 6232 region)' },
  { pattern: /value="-3714993"/g, label: 'Form input with wrong dest_id -3714993' },
  { pattern: /value="-3730689"/g, label: 'Form input with wrong dest_id -3730689' },
  { pattern: /ssne=/g, label: 'Stale ssne param' },
  { pattern: /ssne_untouched=/g, label: 'Stale ssne_untouched param' },
  { pattern: /search_pageview_id=/g, label: 'Stale search_pageview_id param' },
  { pattern: /ac_meta=/g, label: 'Stale ac_meta param' },
  { pattern: /aid=1784897[^&"'\s]*aid=1784897/g, label: 'Duplicate aid param' },
  { pattern: /label=affnetawin/g, label: 'Old label=affnetawin junk' },
  { pattern: /_pname=/g, label: 'Old _pname placeholder' },
  { pattern: /_plc=/g, label: 'Old _plc placeholder' },
  // 3730689 in any context (could be in a comment or elsewhere)
  { pattern: /3730689/g, label: 'Old dest_id 3730689 (check context — comments OK)' },
  // dest_type=city in a searchresults link (should be dest_type=region now)
  { pattern: /searchresults[^"']*dest_type=city/g, label: 'searchresults link with dest_type=city (should be region)' },
];

// Walk all .html files recursively
function walkHtml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      if (['.git', 'node_modules', 'images'].includes(e.name)) continue;
      files.push(...walkHtml(path.join(dir, e.name)));
    } else if (e.isFile() && e.name.endsWith('.html')) {
      files.push(path.join(dir, e.name));
    }
  }
  return files;
}

let totalIssues = 0;
let totalFiles = 0;
const issuesByFile = {};

const htmlFiles = walkHtml(ROOT);
totalFiles = htmlFiles.length;

for (const filePath of htmlFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(ROOT, filePath);

  // site-preview.html is a noindex staging/preview template with AFFILIATE_ID_PLACEHOLDER
  // it is NOT a live page and intentionally has old patterns — skip it
  const isSitePreview = relPath === 'site-preview.html';

  lines.forEach((line, idx) => {
    for (const { pattern, label } of BAD_PATTERNS) {
      pattern.lastIndex = 0; // reset regex state
      let m;
      while ((m = pattern.exec(line)) !== null) {
        // Skip 3730689 if it's inside an HTML comment (those are intentional annotations)
        if (label.startsWith('Old dest_id 3730689') && /<!--/.test(line)) {
          continue;
        }
        // Skip label=affnetawin if it's inside an HTML comment (legacy comment annotation)
        if (label.startsWith('Old label=affnetawin') && /<!--/.test(line)) {
          continue;
        }
        // Skip site-preview.html entirely — it's a noindex template with AFFILIATE_ID_PLACEHOLDER
        if (isSitePreview) {
          continue;
        }
        // Skip Hoi An specific dest_type=city link (dest_id=-3723930 is correct for Hoi An city)
        if (label.startsWith('searchresults') && line.includes('-3723930')) {
          continue;
        }
        const issue = `  Line ${idx + 1}: [${label}] => ${line.trim().slice(0, 120)}`;
        if (!issuesByFile[relPath]) issuesByFile[relPath] = [];
        issuesByFile[relPath].push(issue);
        totalIssues++;
      }
    }
  });
}

if (totalIssues === 0) {
  console.log(`PASS: All ${totalFiles} HTML files are clean. No bad Booking.com link patterns found.`);
  process.exit(0);
} else {
  console.error(`FAIL: Found ${totalIssues} issue(s) across ${Object.keys(issuesByFile).length} file(s):\n`);
  for (const [file, issues] of Object.entries(issuesByFile)) {
    console.error(`${file}:`);
    for (const issue of issues) {
      console.error(issue);
    }
    console.error('');
  }
  process.exit(1);
}
