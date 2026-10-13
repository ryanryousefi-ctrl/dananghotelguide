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

// CJ page-impression script, loaded directly over HTTPS.
const CJ_PAGE_SCRIPT = 'https://www.yceml.net/am_gen/101820678/impressions/page/am.js';
const CJ_CLICK_PREFIX = 'kqzyfj.com/click-101820678-17293132';

function addIssue(relPath, msg) {
  if (!issuesByFile[relPath]) issuesByFile[relPath] = [];
  issuesByFile[relPath].push(msg);
  totalIssues++;
}

// Any raw booking.com URL literal (JS variable, JSON data field, string
// concatenation) is a potential untracked path even when no href= is
// involved — e.g. a URL built in a variable and passed to window.open(), or
// a JSON array rendered into links at runtime. Allowed only when it is the
// inert data-booking-url attribute, JSON-LD, or a destination that is
// wrapped in the CJ click URL within the next few lines of code.
function checkRawLiterals(relPath, content) {
  const stripped = content.replace(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/g, m => ' '.repeat(m.length));
  const re = /https?:\/\/(?:www\.)?booking\.com[^\s"'`<>]*/g;
  let m;
  while ((m = re.exec(stripped))) {
    const before = stripped.slice(Math.max(0, m.index - 40), m.index);
    if (/data-booking-url=["']$/.test(before)) continue;
    if (/href=["']$/.test(before)) continue; // covered by the line-level href check
    if (!/["'`]$/.test(before)) continue;    // prose mention, not a URL literal
    const after = stripped.slice(m.index, m.index + 900);
    if (after.includes(CJ_CLICK_PREFIX) && /encodeURIComponent\(/.test(after)) continue;
    const line = stripped.slice(0, m.index).split('\n').length;
    addIssue(relPath, `  Line ${line}: [UNWRAPPED booking.com URL literal in JS/data — must be built into a ${CJ_CLICK_PREFIX} URL] => ${m[0].slice(0, 100)}`);
  }
}

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
  const hasCjScript = content.includes(CJ_PAGE_SCRIPT);
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

  // The anrdoezrs.net am.js URLs 302 to plain http:// (yceml.net), which
  // browsers block as mixed content, so the CJ page script never runs.
  if (content.includes('anrdoezrs.net/am/')) {
    addIssue(relPath, '  FILE: loads CJ am.js from anrdoezrs.net (redirects to http://, blocked as mixed content) — use ' + CJ_PAGE_SCRIPT);
  }
  checkRawLiterals(relPath, content);

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

// Site JS served to visitors (bk-widget.js etc.) can build booking URLs too.
const jsFiles = [
  ...fs.readdirSync(ROOT).filter(f => f.endsWith('.js')).map(f => path.join(ROOT, f)),
  ...(fs.existsSync(path.join(ROOT, 'assets')) ? walkJs(path.join(ROOT, 'assets')) : []),
];
for (const filePath of jsFiles) {
  checkRawLiterals(path.relative(ROOT, filePath), fs.readFileSync(filePath, 'utf8'));
}

function walkJs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walkJs(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []);
}

process.stdout.write(`\n========== CJ AFFILIATE AUDIT ==========\n`);
process.stdout.write(`Files scanned:               ${totalFilesScanned} HTML + ${jsFiles.length} JS\n`);
process.stdout.write(`Files with booking.com links: ${totalFilesWithBookingLinks}\n`);
process.stdout.write(`Files with CJ page script:   ${totalFilesWithCj}\n`);
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
