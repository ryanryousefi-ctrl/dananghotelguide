#!/usr/bin/env node
/**
 * dananghotelguide.com — Korean Localization Pipeline
 * Usage: node localize-kr.js [--file filename.html] [--all] [--dry-run]
 *
 * Requires: ANTHROPIC_API_KEY in environment
 * Install deps: npm install cheerio node-fetch
 */

const fs = require("fs");
const path = require("path");

// ── deps (graceful load so script can self-check) ──────────────────────────
let cheerio, fetch;
try {
  cheerio = require("cheerio");
  fetch = globalThis.fetch ?? require("node-fetch");
} catch (e) {
  console.error("Missing dependencies. Run: npm install cheerio node-fetch");
  process.exit(1);
}

// ── config ─────────────────────────────────────────────────────────────────
const ROOT_DIR = process.env.SITE_ROOT || ".";           // repo root
const KR_DIR = path.join(ROOT_DIR, "kr");
const BASE_URL = "https://dananghotelguide.com";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514";
const BATCH_SIZE = 8;          // text nodes per API call
const DELAY_MS = 500;          // ms between API calls (rate limiting)
const MAX_RETRIES = 3;

// Pages to skip (already perfect or non-translatable)
const SKIP_FILES = new Set([]);

// ── CLI args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const TARGET_FILE = (() => {
  const i = args.indexOf("--file");
  return i !== -1 ? args[i + 1] : null;
})();
const ALL = args.includes("--all");

// ── helpers ────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

/**
 * Translate an array of English strings → Korean via Claude API.
 * Returns array in same order.
 */
async function translateBatch(texts, retries = 0) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set in environment");
  }

  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const systemPrompt = `You are a professional travel content translator specializing in Korean SEO.
Translate the provided numbered English strings into natural, fluent Korean suitable for a luxury travel website targeting Korean tourists visiting Da Nang, Vietnam.

Rules:
- Return ONLY the translated strings in the same numbered format
- Preserve any HTML entities (&amp; &nbsp; etc.) exactly
- Preserve placeholder tokens like {YEAR}, {PRICE} etc.
- Do not translate proper nouns: Da Nang, Hoi An, Ba Na Hills, My Khe, Han River, Booking.com, brand names, hotel names
- Use formal polite Korean (존댓말/합쇼체)
- Optimize for Korean Google search intent where relevant
- Return exactly the same number of lines as input`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Translate these strings to Korean:\n\n${numbered}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (retries < MAX_RETRIES) {
      log(`  API error (attempt ${retries + 1}): ${err.slice(0, 120)} — retrying...`);
      await sleep(2000 * (retries + 1));
      return translateBatch(texts, retries + 1);
    }
    throw new Error(`API failed after ${MAX_RETRIES} retries: ${err}`);
  }

  const data = await response.json();
  const raw = data.content[0].text.trim();

  // Parse numbered output back to array
  const lines = raw.split(/\n+/);
  const results = [];
  for (const line of lines) {
    const match = line.match(/^\d+\.\s+(.+)$/);
    if (match) results.push(match[1].trim());
  }

  if (results.length !== texts.length) {
    // Fallback: return raw split by newline
    log(`  Warning: expected ${texts.length} translations, got ${results.length}. Using fallback.`);
    return texts.map((_, i) => results[i] || texts[i]);
  }

  return results;
}

/**
 * Collect all translatable text nodes from a cheerio document.
 * Returns array of { selector, index, text } objects.
 */
function collectTextNodes($) {
  const nodes = [];

  // Elements that contain visible text we want to translate
  const TRANSLATE_SELECTORS = [
    "title",
    "meta[name='description']",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p",
    "li",
    "td", "th",
    "a",
    "button",
    "span",
    "label",
    "figcaption",
    "blockquote",
    "dt", "dd",
    ".hotel-name",
    ".hotel-desc",
    ".cta-text",
    ".card-body",
    ".guide-text",
    ".btn",
    "strong",
    "em",
  ];

  // Elements to NEVER translate
  const SKIP_PARENTS = new Set([
    "script", "style", "code", "pre", "noscript",
    "[data-no-translate]", "svg",
  ]);

  $(TRANSLATE_SELECTORS.join(",")).each((i, el) => {
    const $el = $(el);

    // Skip if inside a skip-parent
    let parent = el.parent;
    let skip = false;
    while (parent && parent.tagName) {
      if (SKIP_PARENTS.has(parent.tagName.toLowerCase())) {
        skip = true;
        break;
      }
      parent = parent.parent;
    }
    if (skip) return;

    // For meta[name=description], translate content attribute
    if (el.tagName === "meta") {
      const content = $el.attr("content");
      if (content && content.trim()) {
        nodes.push({ type: "attr", el, attr: "content", text: content.trim() });
      }
      return;
    }

    // For title tag
    if (el.tagName === "title") {
      const text = $el.text().trim();
      if (text) nodes.push({ type: "text", el, text });
      return;
    }

    // For regular elements: only translate direct text, not nested
    // (to avoid double-translating)
    const directText = $el
      .contents()
      .filter((_, n) => n.type === "text")
      .map((_, n) => n.data)
      .get()
      .join("")
      .trim();

    if (directText && directText.length > 1) {
      nodes.push({ type: "text", el, text: directText });
    }

    // Also handle alt attributes on images
    if (el.tagName === "img") {
      const alt = $el.attr("alt");
      if (alt && alt.trim()) {
        nodes.push({ type: "attr", el, attr: "alt", text: alt.trim() });
      }
    }

    // placeholder attributes
    if (el.tagName === "input" || el.tagName === "textarea") {
      const ph = $el.attr("placeholder");
      if (ph && ph.trim()) {
        nodes.push({ type: "attr", el, attr: "placeholder", text: ph.trim() });
      }
    }
  });

  // Deduplicate by text+el combo
  const seen = new Set();
  return nodes.filter((n) => {
    const key = `${n.text}::${n.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Fix all internal links to point to /kr/ versions.
 */
function fixInternalLinks($) {
  // href attributes
  $("[href]").each((_, el) => {
    const $el = $(el);
    let href = $el.attr("href") || "";

    // Skip anchors, external links, mailto, tel, affiliate links
    if (
      href.startsWith("#") ||
      href.startsWith("http") ||
      href.startsWith("mailto") ||
      href.startsWith("tel") ||
      href.includes("booking.com") ||
      href.includes("awin") ||
      href === ""
    )
      return;

    // Convert root-relative .html links
    if (href.match(/^\/[^/].*\.html/) && !href.startsWith("/kr/")) {
      $el.attr("href", "/kr" + href);
    } else if (href.match(/^[^/].*\.html/) && !href.startsWith("kr/")) {
      // relative link like "best-hotels-in-da-nang.html"
      $el.attr("href", "/kr/" + href);
    }
  });
}

/**
 * Update SEO tags: canonical, hreflang, og:url, og:locale
 */
function updateSeoTags($, filename) {
  const enUrl = `${BASE_URL}/${filename}`;
  const krUrl = `${BASE_URL}/kr/${filename}`;

  // Canonical → Korean URL
  $('link[rel="canonical"]').attr("href", krUrl);

  // Remove existing hreflang
  $('link[rel="alternate"]').remove();

  // Add hreflang pair after canonical
  const hreflangEn = `<link rel="alternate" hreflang="en" href="${enUrl}">`;
  const hreflangKr = `<link rel="alternate" hreflang="ko" href="${krUrl}">`;
  const hreflangX  = `<link rel="alternate" hreflang="x-default" href="${enUrl}">`;

  $("head").append(hreflangEn + "\n" + hreflangKr + "\n" + hreflangX);

  // og:url
  $('meta[property="og:url"]').attr("content", krUrl);

  // og:locale
  $('meta[property="og:locale"]').attr("content", "ko_KR");

  // og:locale:alternate
  $('meta[property="og:locale:alternate"]').remove();
  $("head").append('<meta property="og:locale:alternate" content="en_US">');

  // lang attribute on <html>
  $("html").attr("lang", "ko");

  // charset
  if (!$('meta[charset]').length) {
    $("head").prepend('<meta charset="UTF-8">');
  }
}

/**
 * Apply translations back to the DOM.
 */
function applyTranslations($, nodes, translations) {
  nodes.forEach((node, i) => {
    const translated = translations[i];
    if (!translated || translated === node.text) return;

    const $el = $(node.el);

    if (node.type === "attr") {
      $el.attr(node.attr, translated);
    } else {
      // Replace only the direct text nodes, preserving child elements
      $el.contents().each((_, n) => {
        if (n.type === "text" && n.data.trim()) {
          n.data = n.data.replace(node.text.trim(), translated);
        }
      });
    }
  });
}

/**
 * Localize a single HTML file.
 */
async function localizeFile(filename) {
  const srcPath = path.join(ROOT_DIR, filename);
  const destPath = path.join(KR_DIR, filename);

  if (!fs.existsSync(srcPath)) {
    log(`  SKIP (not found): ${filename}`);
    return false;
  }

  log(`Processing: ${filename}`);

  const html = fs.readFileSync(srcPath, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });

  // 1. Collect translatable text
  const nodes = collectTextNodes($);
  log(`  Found ${nodes.length} translatable nodes`);

  if (!DRY_RUN && nodes.length > 0) {
    // 2. Translate in batches
    const texts = nodes.map((n) => n.text);
    const allTranslations = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      log(`  Translating batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} strings)...`);
      const translated = await translateBatch(batch);
      allTranslations.push(...translated);
      if (i + BATCH_SIZE < texts.length) await sleep(DELAY_MS);
    }

    // 3. Apply translations
    applyTranslations($, nodes, allTranslations);
  }

  // 4. Fix internal links
  fixInternalLinks($);

  // 5. Update SEO tags
  updateSeoTags($, filename);

  if (!DRY_RUN) {
    // Ensure /kr dir exists
    if (!fs.existsSync(KR_DIR)) fs.mkdirSync(KR_DIR, { recursive: true });

    // Write output
    const output = $.html();
    fs.writeFileSync(destPath, output, "utf8");
    log(`  ✓ Written: kr/${filename}`);
  } else {
    log(`  [DRY RUN] Would write: kr/${filename}`);
  }

  return true;
}

/**
 * Get all root .html files.
 */
function getRootHtmlFiles() {
  return fs
    .readdirSync(ROOT_DIR)
    .filter(
      (f) =>
        f.endsWith(".html") &&
        !SKIP_FILES.has(f) &&
        fs.statSync(path.join(ROOT_DIR, f)).isFile()
    )
    .sort();
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  log("=== Da Nang Hotel Guide — Korean Localization Pipeline ===");

  if (!ANTHROPIC_API_KEY && !DRY_RUN) {
    console.error("ERROR: ANTHROPIC_API_KEY environment variable not set.");
    console.error("Export it: export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  if (!fs.existsSync(ROOT_DIR)) {
    console.error(`ERROR: SITE_ROOT not found: ${ROOT_DIR}`);
    process.exit(1);
  }

  let files;
  if (TARGET_FILE) {
    files = [TARGET_FILE];
    log(`Single file mode: ${TARGET_FILE}`);
  } else if (ALL) {
    files = getRootHtmlFiles();
    log(`All files mode: ${files.length} files found`);
  } else {
    // Default: show help
    console.log(`
Usage:
  node localize-kr.js --all                    Localize all root HTML files
  node localize-kr.js --file index.html        Localize a single file
  node localize-kr.js --all --dry-run          Dry run (no writes, no API calls)

Environment:
  ANTHROPIC_API_KEY=sk-ant-...                 Required (unless --dry-run)
  SITE_ROOT=/path/to/repo                      Default: current directory

Example:
  ANTHROPIC_API_KEY=sk-ant-xxx SITE_ROOT=/home/user/dananghotelguide node localize-kr.js --all
`);
    process.exit(0);
  }

  const results = { success: [], failed: [] };

  for (const file of files) {
    try {
      const ok = await localizeFile(file);
      if (ok) results.success.push(file);
    } catch (err) {
      log(`  ERROR on ${file}: ${err.message}`);
      results.failed.push(file);
    }
    // Small pause between files
    await sleep(200);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`✅ Successfully localized (${results.success.length}):`);
  results.success.forEach((f) => console.log(`   kr/${f}`));

  if (results.failed.length) {
    console.log(`\n❌ Failed (${results.failed.length}):`);
    results.failed.forEach((f) => console.log(`   ${f}`));
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
