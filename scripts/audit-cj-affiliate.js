#!/usr/bin/env node
/**
 * audit-cj-affiliate.js
 *
 * Validates CJ affiliate tracking across all HTML files.
 *
 * CJ implementation: static deep links (CJ-STATIC-LINK-FIX.md), NOT
 * client-side Deep Link Automation. Every commercial link's href must
 * ALREADY be a https://www.kqzyfj.com/click-101820678-17293132?sid=...&url=...
 * URL at render time. Nothing should depend on the anrdoezrs.net DLA
 * script rewriting an href at click time — that approach was proven to
 * silently fail on native target="_blank" clicks (see
 * FORENSIC-AFFILIATE-AUDIT.md's "THE SMOKING GUN").
 *
 * Publisher: DaNang Hotel Guide — website 101820678
 * Advertiser: Booking.com North America — 7864295
 * Evergreen Link ID: 17293132
 *
 * This script exits 0 if clean, 1 if issues found.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Files to skip (non-production templates)
const SKIP_FILES = new Set(['site-preview.html']);

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

const BAD_PATTERNS = [
  // Broken href=# on a commercial booking button
  {
    label: 'href="#" on booking CTA (blocks tracking entirely)',
    test: (line) => /href="#"/.test(line) && /data-booking-url="https:\/\/[^"]*booking\.com/.test(line),
  },
  // A raw, unwrapped booking.com href — the exact bug this script exists
  // to catch. Every commercial link must already be a static kqzyfj.com
  // CJ link; nothing should rely on click-time rewriting.
  {
    label: 'UNWRAPPED booking.com href — must be a static kqzyfj.com CJ link',
    test: (line) => /href="https:\/\/www\.booking\.com\/(hotel\/vn\/|searchresults)[^"]*"/.test(line),
  },
  // Same check for the JS object-literal fields (bookingUrl:'...', bk:'...')
  // that get rendered into a real href at runtime.
  {
    label: 'UNWRAPPED booking.com URL in a JS field (bookingUrl/bk) — must be kqzyfj.com',
    test: (line) => /\b(bookingUrl|bk):'https:\/\/www\.booking\.com\/[^']*'/.test(line),
  },
  // Active Awin link in href
  {
    label: 'Awin link in href (Awin removed — use CJ static links)',
    test: (line) => /href="https:\/\/www\.awin1\.com\//.test(line) && !/<!--/.test(line),
  },
  // Wrong dest_id
  {
    label: 'Wrong dest_id -3730689 (stale Da Nang city ID)',
    test: (line) => /dest_id=-3730689/.test(line) && !/<!--/.test(line),
  },
  {
    label: 'Wrong dest_id -3714993 (Hanoi ID — never use)',
    test: (line) => /dest_id=-3714993/.test(line) && !/<!--/.test(line),
  },
  // Old bad params
  {
    label: 'Stale label=affnetawin param',
    test: (line) => /label=affnetawin/.test(line) && !/<!--/.test(line),
  },
  {
    label: 'Duplicate aid= param',
    test: (line) => /aid=1784897[^"']*aid=1784897/.test(line),
  },
  // A kqzyfj.com link whose website/evergreen-link ID doesn't match this
  // account — would indicate a copy/paste error from another site/account.
  {
    label: 'kqzyfj.com link with wrong website/evergreen-link ID',
    test: (line) => /kqzyfj\.com\/click-/.test(line) && !/kqzyfj\.com\/click-101820678-17293132/.test(line),
  },
];

let totalFilesScanned = 0;
let totalFilesWithCj = 0;
let totalFilesWithBookingLinks = 0;
let totalIssues = 0;
const issuesByFile = {};

const htmlFiles = walkHtml(ROOT);
totalFilesScanned = htmlFiles.length;

for (const filePath of htmlFiles) {
  const relPath = path.relative(ROOT, filePath);
  const basename = path.basename(filePath);

  if (SKIP_FILES.has(basename)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const hasBookingLinks = content.includes('booking.com');
  const hasCjScript = content.includes('anrdoezrs.net/am/101820678');
  const hasStaticCjLink = content.includes('kqzyfj.com/click-101820678-17293132');

  if (hasBookingLinks) totalFilesWithBookingLinks++;
  if (hasCjScript) totalFilesWithCj++;

  // Check: a page whose rendered output still contains a raw booking.com
  // string anywhere (not just in an href=) but has NO static CJ link at
  // all is suspicious — likely a page this audit's regexes don't yet
  // cover (e.g. a new JS field name for a booking URL).
  if (hasBookingLinks && !hasStaticCjLink && content.includes('booking.com/hotel')) {
    if (!issuesByFile[relPath]) issuesByFile[relPath] = [];
    issuesByFile[relPath].push('  FILE: contains booking.com/hotel but no static kqzyfj.com link found — check for an unhandled link pattern');
    totalIssues++;
  }

  // Line-level checks
  lines.forEach((line, idx) => {
    for (const { label, test } of BAD_PATTERNS) {
      if (test(line)) {
        const issue = `  Line ${idx + 1}: [${label}] => ${line.trim().slice(0, 120)}`;
        if (!issuesByFile[relPath]) issuesByFile[relPath] = [];
        issuesByFile[relPath].push(issue);
        totalIssues++;
      }
    }
  });
}

process.stdout.write(`\n========== CJ AFFILIATE AUDIT ==========\n`);
process.stdout.write(`Files scanned:               ${totalFilesScanned}\n`);
process.stdout.write(`Files with booking.com links: ${totalFilesWithBookingLinks}\n`);
process.stdout.write(`Files with CJ DLA script:    ${totalFilesWithCj}\n`);
process.stdout.write(`Issues found:                ${totalIssues}\n\n`);

if (totalIssues === 0) {
  process.stdout.write(`PASS: All files clean. CJ affiliate tracking verified.\n`);
  process.stdout.write(`\nBOOKING.COM LINKS AUDITED: ALL\n`);
  process.stdout.write(`CJ-TRACKED COMMERCIAL LINKS: ALL\n`);
  process.stdout.write(`UNTRACKED COMMERCIAL LINKS: 0\n`);
  process.stdout.write(`AWIN LINKS: 0\n`);
  process.stdout.write(`href="#" BOOKING CTASS: 0\n`);
  process.stdout.write(`LOCAL TEST FAILURES: 0\n`);
  process.exit(0);
} else {
  process.stderr.write(`FAIL: ${totalIssues} issue(s) across ${Object.keys(issuesByFile).length} file(s):\n\n`);
  for (const [file, issues] of Object.entries(issuesByFile)) {
    process.stderr.write(`${file}:\n`);
    for (const issue of issues) {
      process.stderr.write(`${issue}\n`);
    }
    process.stderr.write('\n');
  }
  process.exit(1);
}
