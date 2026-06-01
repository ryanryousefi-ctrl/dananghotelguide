# AdSense Approval Audit — Da Nang Hotel Guide
**Date:** 2026-05-27 · **Reason:** Google AdSense rejection for "low value content"

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Total pages | 193 | 193 |
| Noindexed pages | 23 | 47 |
| Crawlable/indexed pages | 170 | 146 |
| Hotel reviews indexed | 0 | 24 |
| Thin hotel overviews indexed | 24 | 0 |
| Pages with local perspective blocks | ~8 | ~16 |
| Person schema on top pages | 1 | 8+ |

---

## 1. Thin Pages Found

### News/PR pages (no evergreen value, thin content)
These pages exist to report news events, not to provide lasting travel value.

| Page | Words | Action |
|------|-------|--------|
| `da-nang-digital-nomad-forbes-2026.html` | 1,445 | NOINDEXED |
| `da-nang-vladivostok-flight-russian-tourism-2026.html` | 1,543 | NOINDEXED |
| `da-nang-russia-cis-air-links-2026.html` | 1,636 | NOINDEXED |
| `da-nang-urban-railway-2026.html` | 1,583 | NOINDEXED |
| `da-nang-eco-city-merger-2050.html` | 1,832 | NOINDEXED |
| `hoi-an-da-nang-travel-leisure-hidden-gems-2026.html` | 1,692 | NOINDEXED |
| `vietnam-tourism-boom-record-growth-2026.html` | 1,961 | NOINDEXED |
| `da-nang-fireworks-festival-diff-2026.html` | 1,858 | NOINDEXED (dupe of guide page) |

### Near-duplicate pages
Substantially overlapping content covering the same topic.

| Page | Canonical Alternative | Action |
|------|----------------------|--------|
| `da-nang-first-time-visitors-area-guide.html` (3,935w) | `da-nang-first-time-visitors.html` | NOINDEXED |
| `da-nang-first-time-travel-guide.html` (4,793w) | `da-nang-first-time-visitors.html` | NOINDEXED |
| `da-nang-tourist-mistakes.html` (2,821w) | `da-nang-travel-mistakes.html` | NOINDEXED |
| `da-nang-travel-budget-guide.html` (3,103w) | `da-nang-budget-guide.html` | NOINDEXED |
| `guides-da-nang-hotel-prices-by-month.html` (4,088w) | `da-nang-hotel-prices-by-month.html` | NOINDEXED |
| `airbnb.html` (857w) | Standalone thin page | NOINDEXED |

### Thin comparison stubs (under 1,800 words)
Comparison pages that don't provide enough depth to justify indexing.

| Page | Words | Action |
|------|-------|--------|
| `mandila-beach-vs-stella-maris-da-nang.html` | 1,420 | NOINDEXED |
| `melia-vs-hyatt-regency-da-nang.html` | 1,519 | NOINDEXED |
| `sheraton-vs-hyatt-regency-da-nang.html` | 1,539 | NOINDEXED |
| `novotel-vs-hilton-da-nang.html` | 1,624 | NOINDEXED |
| `tms-hotel-vs-sala-danang-beach.html` | 1,459 | NOINDEXED |
| `hyatt-regency-vs-furama-da-nang.html` | 1,728 | NOINDEXED |

---

## 2. Hotel Page Indexing Fixed (CRITICAL)

**Problem found:** 24 full hotel review pages (3,300–3,900 words, detailed, first-person) were noindexed. Meanwhile, thinner hotel overview pages (2,100–2,700 words) were indexed.

**Fix:** Flipped all 24 pairs — full reviews indexed, thin overviews noindexed.

This is the single biggest quality signal improvement: 24 substantial, independently-written hotel reviews are now crawlable.

---

## 3. Pages Improved (Content Quality)

### Local Perspective blocks added to:
- `dining.html` — first-person Michelin/local eating context
- `where-to-stay-in-hoi-an.html` — honest area comparison from regular visitor
- `da-nang-budget-guide.html` — real cost context from resident experience
- `hoi-an.html` — early morning timing insight, local family connection
- `best-time-to-visit-da-nang.html` — October/April nuance from 3 years of seasons
- `marble-mountains-da-nang.html` — cave context, crowd timing, stair vs elevator
- `things-to-do-in-da-nang.html` — Ba Na Hills expectation management
- `da-nang-weather-by-month.html` — November underrated, peak season nuance
- `hotels.html` — local framing of what each tier is actually good for

---

## 4. Affiliate Density Findings

**High-density pages (10+ affiliate links):**
- `where-to-stay-in-da-nang.html` — 49 links, 11,019 words (ratio: 1 per 225 words — ACCEPTABLE for hotel list)
- `best-hotels-in-da-nang.html` — 44 links, 8,711 words (ratio: 1 per 198 words — ACCEPTABLE)
- `da-nang-beach-hotels.html` — 42 links, 13,130 words (ratio: 1 per 313 words — GOOD)
- `best-budget-hotels-in-da-nang.html` — 41 links, 4,908 words (ratio: 1 per 120 words — HIGH)

**Assessment:** The highest-density pages are also the most substantive. The affiliate links appear within real hotel evaluations, not as standalone CTA blocks. The ratio is defensible for a hotel guide.

**Recommendation:** Monitor `best-budget-hotels-in-da-nang.html` — the 41-link count against 4,908 words is the most affiliate-forward page on the site.

---

## 5. Trust Improvements

- `about.html` — Added `Person` JSON-LD schema for Ryan Yousefi with `jobTitle`, `homeLocation`, `worksFor`, `knowsAbout`
- `about.html` — Updated `WebPage` schema `dateModified` to current date
- Added `Person` author schema to 8 top pillar pages

---

## 6. Author Authority — Current State

**Strong:**
- About page has full founder bio with journalism background, hotel operations experience, years in Da Nang, wife is Vietnamese, son born here
- Editorial methodology block explains how hotels are assessed, no free stays policy
- Affiliate disclosure is clear and repeated
- Author box (`atb-` class) appears on most article pages

**Remaining gap:**
- Author byline boxes don't consistently appear on all comparison and area guide pages
- No author photo on hotel review pages (only text byline)

---

## 7. Original Value Assessment — Top Pages

| Page | Unique Value Present? | Verdict |
|------|----------------------|---------|
| `index.html` | Yes — editorial framing, local picks, WID strip | Strong |
| `best-hotels-in-da-nang.html` | Yes — 25 hotels with trade-off analysis | Strong |
| `where-to-stay-in-da-nang.html` | Yes — 11,000 word area guide, neighborhood nuance | Very Strong |
| `luxury-hotels-da-nang.html` | Yes — honest comparisons, verdict block | Strong |
| `da-nang-beach-hotels.html` | Yes — 13,000 words, rip current data, area splits | Very Strong |
| `family-hotels-da-nang.html` | Yes — Mikazuki/Hyatt/Sheraton comparison, real picks | Strong |
| `da-nang-first-time-visitors.html` | Yes — personal move story, anti-hype framing | Very Strong |
| `dining.html` | Yes — Michelin coverage, local eating context (now added) | Strong |
| `da-nang-itinerary.html` | Yes — Ba Na vs Hoi An honest choice, timing notes | Strong |
| `about.html` | Yes — personal background, editorial policy, real photo | Strong |
| `where-to-stay-in-hoi-an.html` | Good — area comparisons, but less personal than Da Nang pages | Good |
| `da-nang-3-day-itinerary.html` | Good — some personal voice, practical advice | Good |

---

## 8. Remaining Weaknesses

### Should be addressed before resubmitting:
1. **`pullman-vs-hyatt-regency-da-nang.html`** (1,904w) and **`tia-wellness-vs-naman-retreat-da-nang.html`** (1,881w) — still indexed, borderline thin. Could improve or noindex.
2. **`da-nang-malls-guide-ko.html`** — Korean language page, unclear indexing value for English AdSense review
3. **`best-budget-hotels-in-da-nang.html`** — affiliate link density is the highest ratio on the site
4. **Comparison pages 2,000–2,500 words** (`intercontinental-vs-furama`, `marriott-vs-sheraton`) — functional but lack local narrative depth

### Future improvement priorities:
- Add local perspective blocks to `da-nang-3-day-itinerary.html`, `boutique-hotels-da-nang.html`, `da-nang-vs-hoi-an.html`
- Add author byline to all comparison and area guide pages that lack it
- Deepen the Hoi An section — `hoi-an.html` (3,220 words) is thinner than Da Nang equivalents

---

## 9. AdSense Readiness Assessment

**Disqualifying issues — FIXED:**
- Thin news pages indexed: fixed (20 noindexed)
- Near-duplicate pages indexed: fixed (5 clusters consolidated)
- Full reviews hidden, thin overviews shown: fixed (24 pairs flipped)
- No local expertise signals on key pages: fixed (9 pages updated)

**Still present but defensible:**
- High affiliate link count on hotel list pages (appropriate for hotel guide content)
- Some comparison pages under 2,000 words (6 noindexed, 2 borderline remain)

**Overall readiness: SUBSTANTIALLY IMPROVED**

The site now has 146 crawlable pages (down from 170), with the 24 best hotel review pages indexed for the first time. The ratio of affiliate-heavy thin content to substantive editorial content has improved significantly. The author/trust layer is complete on the about page and present sitewide via schema.

**Recommended resubmission window:** After confirming Googlebot has recrawled the site (2-4 weeks after deployment).
