#!/usr/bin/env node
/**
 * dananghotelguide.com — Korean Localization Pipeline
 * Usage: node localize-kr.js [--file filename.html] [--all] [--missing] [--dry-run]
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
const ROOT_DIR = process.env.SITE_ROOT || ".";
const KR_DIR = path.join(ROOT_DIR, "kr");
const BASE_URL = "https://www.dananghotelguide.com";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-5";
const BATCH_SIZE = 10;
const DELAY_MS = 300;
const MAX_RETRIES = 3;

// Non-public pages to skip
const SKIP_FILES = new Set([
  "favicon-html-snippet.html",
  "site-preview.html",
]);

// ── CLI args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const MISSING_ONLY = args.includes("--missing");
const TARGET_FILE = (() => {
  const i = args.indexOf("--file");
  return i !== -1 ? args[i + 1] : null;
})();
const ALL = args.includes("--all") || MISSING_ONLY;

// ── helpers ────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

/**
 * Translate an array of English strings → Korean via Claude API.
 */
async function translateBatch(texts, retries = 0) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set in environment");
  }

  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const systemPrompt = `You are a professional travel content translator specializing in Korean SEO.
Translate the provided numbered English strings into natural, fluent Korean suitable for a travel website targeting Korean tourists visiting Da Nang, Vietnam.

Rules:
- Return ONLY the translated strings in the same numbered format: "1. translation"
- Preserve any HTML entities (&amp; &nbsp; &lt; &gt; etc.) exactly as-is
- Preserve placeholder tokens like {YEAR}, {PRICE} etc.
- Do NOT translate proper nouns: Da Nang, Hoi An, Ba Na Hills, My Khe, Non Nuoc, Son Tra, Han River, An Bang, Booking.com, Agoda
- Do NOT translate hotel brand names: Hyatt, Marriott, Intercontinental, Melia, Furama, Pullman, Hilton, Novotel, Sheraton, Radisson, Naman, Premier Village, Muong Thanh, Mikazuki, TMS, Wyndham, Vinpearl, A La Carte, Azura, Brilliant, Fusion, Grand Mercure, Four Points, Tia Wellness, Silk Path, Arbora
- Use formal polite Korean (합쇼체/존댓말)
- Write naturally for Korean travelers — use Korean travel search phrasing where natural:
  다낭 호텔 추천, 다낭 오션뷰 호텔, 다낭 가족여행, 다낭 리조트, 미케비치, 다낭 여행, 호이안 당일치기
- Return EXACTLY the same number of numbered lines as input
- Do not add extra lines or commentary`;

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
      messages: [{ role: "user", content: `Translate these strings to Korean:\n\n${numbered}` }],
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

  const lines = raw.split(/\n+/);
  const results = [];
  for (const line of lines) {
    const match = line.match(/^\d+\.\s+(.+)$/);
    if (match) results.push(match[1].trim());
  }

  if (results.length !== texts.length) {
    log(`  Warning: expected ${texts.length} translations, got ${results.length}. Using fallback.`);
    return texts.map((_, i) => results[i] || texts[i]);
  }

  return results;
}

/**
 * Collect all translatable text nodes from a cheerio document.
 */
function collectTextNodes($) {
  const nodes = [];

  const TRANSLATE_SELECTORS = [
    "title",
    "meta[name='description']",
    "meta[property='og:title']",
    "meta[property='og:description']",
    "meta[name='twitter:title']",
    "meta[name='twitter:description']",
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
    "strong",
    "em",
    "[aria-label]",
    "[placeholder]",
    "img[alt]",
  ];

  const SKIP_TAGS = new Set(["script", "style", "code", "pre", "noscript", "svg"]);

  function isInsideSkipTag(el) {
    let p = el.parent;
    while (p && p.tagName) {
      if (SKIP_TAGS.has(p.tagName.toLowerCase())) return true;
      p = p.parent;
    }
    return false;
  }

  $(TRANSLATE_SELECTORS.join(",")).each((_, el) => {
    const $el = $(el);
    if (isInsideSkipTag(el)) return;

    const tag = el.tagName ? el.tagName.toLowerCase() : "";

    // meta content attributes
    if (tag === "meta") {
      const content = $el.attr("content");
      if (content && content.trim().length > 1) {
        nodes.push({ type: "attr", el, attr: "content", text: content.trim() });
      }
      return;
    }

    // img alt
    if (tag === "img") {
      const alt = $el.attr("alt");
      if (alt && alt.trim().length > 1) {
        nodes.push({ type: "attr", el, attr: "alt", text: alt.trim() });
      }
      return;
    }

    // aria-label
    const ariaLabel = $el.attr("aria-label");
    if (ariaLabel && ariaLabel.trim().length > 1) {
      nodes.push({ type: "attr", el, attr: "aria-label", text: ariaLabel.trim() });
    }

    // placeholder
    if (tag === "input" || tag === "textarea") {
      const ph = $el.attr("placeholder");
      if (ph && ph.trim().length > 1) {
        nodes.push({ type: "attr", el, attr: "placeholder", text: ph.trim() });
      }
      return;
    }

    // Direct text content only (skip if it only has child elements)
    const directText = $el.contents()
      .filter((_, n) => n.type === "text")
      .map((_, n) => n.data)
      .get()
      .join("")
      .trim();

    if (directText && directText.length > 1) {
      nodes.push({ type: "text", el, text: directText });
    }
  });

  // Deduplicate
  const seen = new Set();
  return nodes.filter((n) => {
    const key = `${n.type}:${n.attr || ""}:${n.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Fix all internal links to point to /kr/ versions.
 * Never creates /kr/kr/ links.
 */
function fixInternalLinks($) {
  $("[href]").each((_, el) => {
    const $el = $(el);
    let href = $el.attr("href") || "";

    // Skip: anchors, external, mailto, tel, already /kr/, known affiliate domains
    if (
      href.startsWith("#") ||
      href.startsWith("mailto") ||
      href.startsWith("tel") ||
      href.startsWith("/kr/") ||
      href.startsWith("kr/") ||
      href === "" ||
      href === "/" ||
      /^https?:\/\/(www\.)?(booking\.com|awin1\.com|agoda\.com)/.test(href)
    ) return;

    // External links — leave alone
    if (href.startsWith("http")) return;

    // Root homepage: href="/" or href="index.html"
    if (href === "index.html") {
      $el.attr("href", "/kr/");
      return;
    }

    // Root-relative .html links: /filename.html
    if (href.match(/^\/[^/].+\.html$/)) {
      $el.attr("href", "/kr" + href);
      return;
    }

    // Relative .html links: filename.html
    if (href.match(/^[^/].+\.html$/)) {
      $el.attr("href", "/kr/" + href);
      return;
    }

    // Root-relative non-html paths (e.g. /images/foo.jpg, /sitemap.xml) — leave alone
  });
}

/**
 * Update SEO tags: lang, canonical, hreflang, og:url, og:locale.
 */
function updateSeoTags($, filename) {
  const isIndex = filename === "index.html";
  const enUrl = isIndex ? `${BASE_URL}/` : `${BASE_URL}/${filename}`;
  const krUrl = isIndex ? `${BASE_URL}/kr/` : `${BASE_URL}/kr/${filename}`;

  // lang="ko" on <html>
  $("html").attr("lang", "ko");

  // charset
  if (!$("meta[charset]").length) {
    $("head").prepend('<meta charset="UTF-8">');
  }

  // canonical
  if ($('link[rel="canonical"]').length) {
    $('link[rel="canonical"]').attr("href", krUrl);
  } else {
    $("head").append(`<link rel="canonical" href="${krUrl}">`);
  }

  // Remove existing hreflang
  $('link[rel="alternate"]').remove();

  // Add hreflang set
  $("head").append(
    `<link rel="alternate" hreflang="en" href="${enUrl}">` + "\n" +
    `<link rel="alternate" hreflang="ko" href="${krUrl}">` + "\n" +
    `<link rel="alternate" hreflang="x-default" href="${enUrl}">`
  );

  // og:url
  if ($('meta[property="og:url"]').length) {
    $('meta[property="og:url"]').attr("content", krUrl);
  } else {
    $("head").append(`<meta property="og:url" content="${krUrl}">`);
  }

  // og:locale → ko_KR
  if ($('meta[property="og:locale"]').length) {
    $('meta[property="og:locale"]').attr("content", "ko_KR");
  } else {
    $("head").append('<meta property="og:locale" content="ko_KR">');
  }

  // og:locale:alternate
  $('meta[property="og:locale:alternate"]').remove();
  $("head").append('<meta property="og:locale:alternate" content="en_US">');
}

/**
 * Apply translations back to DOM nodes.
 */
function applyTranslations($, nodes, translations) {
  nodes.forEach((node, i) => {
    const translated = translations[i];
    if (!translated || translated === node.text) return;

    const $el = $(node.el);

    if (node.type === "attr") {
      $el.attr(node.attr, translated);
    } else {
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

  const nodes = collectTextNodes($);
  log(`  Found ${nodes.length} translatable nodes`);

  if (!DRY_RUN && nodes.length > 0) {
    const texts = nodes.map((n) => n.text);
    const allTranslations = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} strings)...`);
      const translated = await translateBatch(batch);
      allTranslations.push(...translated);
      if (i + BATCH_SIZE < texts.length) await sleep(DELAY_MS);
    }

    applyTranslations($, nodes, allTranslations);
  }

  fixInternalLinks($);
  updateSeoTags($, filename);

  if (!DRY_RUN) {
    if (!fs.existsSync(KR_DIR)) fs.mkdirSync(KR_DIR, { recursive: true });
    fs.writeFileSync(destPath, $.html(), "utf8");
    log(`  ✓ Written: kr/${filename}`);
  } else {
    log(`  [DRY RUN] Would write: kr/${filename}`);
  }

  return true;
}

/**
 * Get all root .html files, optionally filtering to only missing ones.
 */
function getRootHtmlFiles() {
  const allFiles = fs
    .readdirSync(ROOT_DIR)
    .filter(
      (f) =>
        f.endsWith(".html") &&
        !SKIP_FILES.has(f) &&
        fs.statSync(path.join(ROOT_DIR, f)).isFile()
    )
    .sort();

  if (MISSING_ONLY) {
    const existing = new Set(
      fs.existsSync(KR_DIR)
        ? fs.readdirSync(KR_DIR).filter((f) => f.endsWith(".html"))
        : []
    );
    return allFiles.filter((f) => !existing.has(f));
  }

  return allFiles;
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  log("=== Da Nang Hotel Guide — Korean Localization Pipeline ===");

  if (!ANTHROPIC_API_KEY && !DRY_RUN) {
    console.error("ERROR: ANTHROPIC_API_KEY environment variable not set.");
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
    log(`${MISSING_ONLY ? "Missing-only" : "All files"} mode: ${files.length} files to process`);
  } else {
    console.log(`
Usage:
  node localize-kr.js --all               Localize all root HTML files
  node localize-kr.js --missing           Localize only files not yet in /kr/
  node localize-kr.js --file index.html   Localize a single file
  node localize-kr.js --all --dry-run     Dry run (no writes, no API calls)

Environment:
  ANTHROPIC_API_KEY=sk-ant-...            Required (unless --dry-run)
  SITE_ROOT=/path/to/repo                 Default: current directory
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
    await sleep(200);
  }

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
