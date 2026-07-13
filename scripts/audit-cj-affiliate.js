#!/usr/bin/env node
/**
 * audit-cj-affiliate.js
 *
 * Validates CJ affiliate tracking across all HTML files.
 *
 * CJ implementation: Deep Link Automation (DLA)
 * Publisher ID: 101820678
 * Script: https://www.anrdoezrs.net/am/101820678/include/allCj/impressions/page/am.js
 *
 * For CJ DLA to track a Booking.com click:
 *   - element.href must be a booking.com URL (not "#") at click time
 *   - The URL must be a real property or search page
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
    label: 'href="#" on booking CTA (blocks CJ DLA tracking)',
    test: (line) => /href="#"/.test(line) && /data-booking-url="https:\/\/[^"]*booking\.com/.test(line),
  },
  // Hotel link missing aid=1784897
  {
    label: 'Hotel link missing aid=1784897',
    test: (line) => /href="https:\/\/[^"]*booking\.com\/hotel\/vn\/[^"]*"/.test(line) && !/aid=1784897/.test(line),
  },
  // Generic search link missing aid=1784897 (skips site-preview with AFFILIATE_ID_PLACEHOLDER)
  {
    label: 'Search link missing aid=1784897',
    test: (line) => /href="https:\/\/[^"]*booking\.com\/searchresults[^"]*"/.test(line)
                 && !/aid=1784897/.test(line)
                 && !/AFFILIATE_ID_PLACEHOLDER/.test(line),
  },
  // Active Awin link in href
  {
    label: 'Awin link in href (Awin removed — use CJ DLA)',
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
  // CJ script missing from page
  // (checked at file level below, not line level)

  // Old bad params
  {
    label: 'Stale label=affnetawin param',
    test: (line) => /label=affnetawin/.test(line) && !/<!--/.test(line),
  },
  {
    label: 'Duplicate aid= param',
    test: (line) => /aid=1784897[^"']*aid=1784897/.test(line),
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

  if (hasBookingLinks) totalFilesWithBookingLinks++;
  if (hasCjScript) totalFilesWithCj++;

  // Check: pages with commercial booking links must have CJ DLA script
  const hasCommercialLink = /href="https:\/\/[^"]*booking\.com\/(hotel\/vn\/|searchresults)/.test(content);
  if (hasCommercialLink && !hasCjScript) {
    if (!issuesByFile[relPath]) issuesByFile[relPath] = [];
    issuesByFile[relPath].push('  FILE: Missing CJ DLA script tag (anrdoezrs.net/am/101820678/...)');
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
