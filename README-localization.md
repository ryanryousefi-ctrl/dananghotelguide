# 🇰🇷 Korean Localization Pipeline — dananghotelguide.com

Fully automated pipeline to duplicate and translate the entire site into `/kr/` for Korean SEO.

---

## What it does

| Step | Action |
|------|--------|
| 1 | Reads every `.html` from repo root |
| 2 | Translates visible text → Korean via Claude API |
| 3 | Rewrites internal links to `/kr/` versions |
| 4 | Updates `<title>`, `<meta name="description">` for Korean search intent |
| 5 | Sets `<link rel="canonical">` → Korean URL |
| 6 | Adds hreflang pairs (`en` + `ko` + `x-default`) |
| 7 | Updates `og:url`, `og:locale`, adds `og:locale:alternate` |
| 8 | Sets `<html lang="ko">` |
| 9 | Writes files to `/kr/` (creates dir if needed) |
| 10 | Sitemap updater adds all `/kr/` URLs |

**Does NOT touch:** CSS, JS, affiliate links, image URLs, schema markup, layout.

---

## Setup

### 1. Add files to your repo root

```
localize-kr.js
sitemap-kr.js
package.json
.github/workflows/localize-kr.yml
```

### 2. Install dependencies (local only)

```bash
npm install cheerio node-fetch
```

### 3. Set your Anthropic API key

**Locally:**
```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**GitHub Actions:**  
Go to `Settings → Secrets → Actions` → add secret named `ANTHROPIC_API_KEY`

---

## Usage

### Local (recommended for first run)

```bash
# Dry run — no API calls, just shows what would happen
node localize-kr.js --all --dry-run

# Localize ALL pages
ANTHROPIC_API_KEY=sk-ant-xxx SITE_ROOT=/path/to/repo node localize-kr.js --all

# Localize a single file
ANTHROPIC_API_KEY=sk-ant-xxx SITE_ROOT=/path/to/repo node localize-kr.js --file index.html

# Update sitemap after localization
SITE_ROOT=/path/to/repo node sitemap-kr.js
```

### GitHub Actions

Go to **Actions → Korean Localization → Run workflow**

Choose:
- `all` — localize everything (commits `/kr/` back to repo)  
- `dry-run` — preview only
- Or enter a single filename to localize just that page

Vercel auto-deploys on push, so the Korean pages go live automatically.

---

## Estimated cost & time

| Pages | API calls | Estimated time | Estimated cost |
|-------|-----------|---------------|---------------|
| 10 | ~50 | ~3 min | ~$0.10 |
| 30 | ~150 | ~8 min | ~$0.30 |
| 60 | ~300 | ~15 min | ~$0.60 |

*Costs based on Claude Sonnet 4 pricing. Batch size of 8 strings per call.*

---

## What gets translated

✅ `<title>`  
✅ `<meta name="description">`  
✅ `<h1>` through `<h6>`  
✅ `<p>` paragraphs  
✅ `<li>` list items  
✅ `<a>` link text  
✅ `<button>` text  
✅ `<span>`, `<strong>`, `<em>`  
✅ `alt` attributes on images  
✅ `placeholder` on inputs  
✅ Hotel names, descriptions, CTAs  

❌ CSS classes / IDs  
❌ JavaScript  
❌ Booking.com affiliate links  
❌ Image URLs / src attributes  
❌ Schema.org JSON-LD  
❌ HTML tag names  
❌ `data-*` attributes  
❌ Proper nouns: Da Nang, Hoi An, My Khe, etc.  

---

## SEO output per page

Every `/kr/*.html` gets:

```html
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>[Korean title]</title>
  <meta name="description" content="[Korean description]">
  <link rel="canonical" href="https://dananghotelguide.com/kr/page.html">
  <link rel="alternate" hreflang="en" href="https://dananghotelguide.com/page.html">
  <link rel="alternate" hreflang="ko" href="https://dananghotelguide.com/kr/page.html">
  <link rel="alternate" hreflang="x-default" href="https://dananghotelguide.com/page.html">
  <meta property="og:url" content="https://dananghotelguide.com/kr/page.html">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:locale:alternate" content="en_US">
```

---

## After running

1. Check a few `/kr/` files manually in browser
2. Run `node sitemap-kr.js` to update `sitemap.xml`
3. Submit updated sitemap to Google Search Console
4. Add Korean property in GSC: `dananghotelguide.com/kr/`
5. Monitor Korean impressions in GSC after ~4–6 weeks

---

## Troubleshooting

**`Missing dependencies`** → Run `npm install cheerio node-fetch`

**`ANTHROPIC_API_KEY not set`** → Export the env var before running

**Translation count mismatch warning** → Usually fine; fallback keeps original text for that batch

**Link still points to English page** → Check if link uses an unusual format (JS-generated, data-href, etc.)
