#!/usr/bin/env node
// SEO validation script — run with: node scripts/seo-audit.js
// Checks local HTML files for SEO issues across the dananghotelguide.com site

const fs = require('fs');
const path = require('path');

const SITE_ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://www.dananghotelguide.com';
const TODAY = new Date().toISOString().slice(0, 10);

// Pages intentionally excluded from indexing checks
const NOINDEX_ALLOWED = new Set([
  'favicon-html-snippet.html',
  'site-preview.html',
  'search.html',
  'where-to-stay.html', // redirects via vercel.json
]);

// Pages excluded from sitemap by design (redirects, utilities, review pages with canonical to hotel)
const SITEMAP_EXCLUDED = new Set([
  'favicon-html-snippet.html',
  'site-preview.html',
  'search.html',
  'where-to-stay.html',
]);

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i');
  const m = html.match(re) || html.match(re2);
  return m ? m[1] : null;
}

function extractCanonical(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
         || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return m ? m[1] : null;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

function countH1(html) {
  return (html.match(/<h1[\s>]/gi) || []).length;
}

function hasRobotsDirective(html) {
  return extractMeta(html, 'robots') !== null;
}

function isNoindex(html) {
  const robots = extractMeta(html, 'robots') || '';
  return /noindex/i.test(robots);
}

function getHtmlFiles(dir, prefix) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name === 'kr') {
      const krDir = path.join(dir, 'kr');
      const krEntries = fs.readdirSync(krDir, { withFileTypes: true });
      for (const krEntry of krEntries) {
        if (krEntry.isFile() && krEntry.name.endsWith('.html')) {
          results.push({ file: path.join(krDir, krEntry.name), rel: `kr/${krEntry.name}` });
        }
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push({ file: path.join(dir, entry.name), rel: entry.name });
    }
  }
  return results;
}

function parseSitemapUrls(sitemapPath) {
  const xml = readFile(sitemapPath);
  if (!xml) return new Set();
  const urls = new Set();
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.add(m[1].trim());
  }
  return urls;
}

// -----------------------------------------------------------------------
// Audit
// -----------------------------------------------------------------------

const findings = {
  errors: [],
  warnings: [],
  info: [],
};

function error(file, msg) { findings.errors.push({ file, msg }); }
function warn(file, msg)  { findings.warnings.push({ file, msg }); }
function info(file, msg)  { findings.info.push({ file, msg }); }

const sitemapPath = path.join(SITE_ROOT, 'sitemap.xml');
const sitemapUrls = parseSitemapUrls(sitemapPath);

const htmlFiles = getHtmlFiles(SITE_ROOT);

// Track review pages (canonicalize to hotel pages)
const reviewPagePattern = /^review-/;

let checkedCount = 0;

for (const { file, rel } of htmlFiles) {
  const html = readFile(file);
  if (!html) {
    error(rel, 'Could not read file');
    continue;
  }
  checkedCount++;

  const isReviewPage = reviewPagePattern.test(rel);
  const isKrPage = rel.startsWith('kr/');
  const isUtilityPage = NOINDEX_ALLOWED.has(rel);

  // --- noindex check ---
  if (isNoindex(html)) {
    if (!isUtilityPage) {
      error(rel, `Has noindex — should be "index, follow" for a content page`);
    }
  }

  // --- robots directive presence ---
  if (!hasRobotsDirective(html)) {
    warn(rel, 'Missing <meta name="robots"> directive');
  }

  // --- structural checks (skip pure utility snippet files) ---
  const isSnippetFile = rel === 'favicon-html-snippet.html' || rel === 'site-preview.html';

  if (!isSnippetFile) {
    // --- title check ---
    const title = extractTitle(html);
    if (!title) {
      error(rel, 'Missing <title> tag');
    } else if (title.length < 20) {
      warn(rel, `Title too short (${title.length} chars): "${title}"`);
    } else if (title.length > 70) {
      warn(rel, `Title may be truncated in SERPs (${title.length} chars): "${title.substring(0, 60)}..."`);
    }

    // --- meta description check ---
    const desc = extractMeta(html, 'description');
    if (!desc) {
      warn(rel, 'Missing meta description');
    } else if (desc.length < 50) {
      warn(rel, `Meta description too short (${desc.length} chars)`);
    } else if (desc.length > 165) {
      warn(rel, `Meta description may be truncated (${desc.length} chars)`);
    }

    // --- H1 check ---
    const h1Count = countH1(html);
    if (h1Count === 0) {
      error(rel, 'No H1 found on page');
    } else if (h1Count > 1) {
      warn(rel, `Multiple H1 tags found (${h1Count}) — should be exactly 1`);
    }
  }

  // --- canonical check ---
  const canonical = extractCanonical(html);
  if (!canonical) {
    if (!isUtilityPage) {
      warn(rel, 'Missing canonical tag');
    }
  } else {
    // Check canonical format uses www
    if (!canonical.startsWith('https://www.dananghotelguide.com/')) {
      error(rel, `Canonical does not use www: ${canonical}`);
    }

    // For review pages, canonical should NOT point to self (should point to hotel page)
    if (isReviewPage) {
      const selfUrl = `${BASE_URL}/${rel}`;
      if (canonical === selfUrl) {
        warn(rel, 'Review page canonical points to itself — expected to point to hotel page');
      }
    } else if (!isUtilityPage) {
      // Non-review pages should have self-referencing canonical
      const selfUrl = isKrPage
        ? `${BASE_URL}/${rel}`
        : `${BASE_URL}/${rel}`;
      if (canonical !== selfUrl && !(rel === 'index.html' && canonical === `${BASE_URL}/`)) {
        warn(rel, `Canonical mismatch — expected: ${selfUrl} got: ${canonical}`);
      }
    }
  }

  // --- sitemap inclusion check ---
  const pageUrl = rel === 'index.html'
    ? `${BASE_URL}/`
    : `${BASE_URL}/${rel}`;

  const shouldBeInSitemap = !isUtilityPage && !SITEMAP_EXCLUDED.has(rel) && !isReviewPage;

  if (shouldBeInSitemap) {
    if (!sitemapUrls.has(pageUrl)) {
      warn(rel, `Page not found in sitemap.xml — add: <loc>${pageUrl}</loc>`);
    }
  }

  // --- CJ affiliate script check (for non-utility pages) ---
  if (!isUtilityPage) {
    if (!html.includes('anrdoezrs.net')) {
      warn(rel, 'CJ affiliate script (anrdoezrs.net) not found');
    }
  }

  // --- booking.com aid check ---
  if (html.includes('booking.com') && !isUtilityPage) {
    const bookingLinks = (html.match(/href="[^"]*booking\.com[^"]*"/gi) || []);
    const missingAid = bookingLinks.filter(l => !l.includes('aid=1784897'));
    if (missingAid.length > 0) {
      error(rel, `${missingAid.length} Booking.com link(s) missing aid=1784897`);
    }
    const badHref = bookingLinks.filter(l => l.includes('href="#"'));
    if (badHref.length > 0) {
      error(rel, `${badHref.length} Booking.com link(s) use href="#" (breaks CJ tracking)`);
    }
  }
}

// --- Sitemap stale URL check ---
for (const url of sitemapUrls) {
  const relativePath = url.replace(`${BASE_URL}/`, '');
  const filePath = relativePath === ''
    ? path.join(SITE_ROOT, 'index.html')
    : path.join(SITE_ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    error('sitemap.xml', `URL in sitemap has no corresponding file: ${url}`);
  }
}

// --- robots.txt check ---
const robotsTxt = readFile(path.join(SITE_ROOT, 'robots.txt'));
if (!robotsTxt) {
  error('robots.txt', 'File missing — crawlers may not find the sitemap');
} else {
  if (!robotsTxt.includes('Sitemap:')) {
    error('robots.txt', 'No Sitemap: directive found');
  }
  if (robotsTxt.includes('Disallow: /') && !robotsTxt.includes('Allow: /')) {
    error('robots.txt', 'robots.txt may be blocking all crawlers');
  }
}

// -----------------------------------------------------------------------
// Report
// -----------------------------------------------------------------------

const totalIssues = findings.errors.length + findings.warnings.length;

console.log('\n===================================================');
console.log(`  Da Nang Hotel Guide — SEO Audit (${TODAY})`);
console.log('===================================================\n');
console.log(`  Files checked: ${checkedCount}`);
console.log(`  Sitemap URLs: ${sitemapUrls.size}`);
console.log(`  Errors: ${findings.errors.length}`);
console.log(`  Warnings: ${findings.warnings.length}`);
console.log(`  Info: ${findings.info.length}`);
console.log('');

if (findings.errors.length > 0) {
  console.log('--- ERRORS (must fix) ---');
  for (const { file, msg } of findings.errors) {
    console.log(`  [ERROR] ${file}`);
    console.log(`          ${msg}`);
  }
  console.log('');
}

if (findings.warnings.length > 0) {
  console.log('--- WARNINGS (should fix) ---');
  for (const { file, msg } of findings.warnings) {
    console.log(`  [WARN]  ${file}`);
    console.log(`          ${msg}`);
  }
  console.log('');
}

if (findings.info.length > 0) {
  console.log('--- INFO ---');
  for (const { file, msg } of findings.info) {
    console.log(`  [INFO]  ${file}: ${msg}`);
  }
  console.log('');
}

if (totalIssues === 0) {
  console.log('  All checks passed.\n');
  process.exit(0);
} else {
  console.log(`  Total issues: ${totalIssues} (${findings.errors.length} errors, ${findings.warnings.length} warnings)\n`);
  process.exit(findings.errors.length > 0 ? 1 : 0);
}
