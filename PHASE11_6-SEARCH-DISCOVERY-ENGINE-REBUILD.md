# PHASE 11.6 — Search Discovery Engine Rebuild
**Committed:** TBD · **Date:** 2026-05-27 · **Files:** `search.html`, `search-engine.js`, 67 HTML pages

---

## Problems Fixed

### Before Phase 11.6
- Searching "dining" did NOT return `dining.html` first (scored below unrelated pages)
- Searching "marble" returned only a partial match with no intent understanding
- `marble-mountains-da-nang.html`, `dragon-bridge-da-nang.html`, `ba-na-hills-guide.html`, `best-bars-in-da-nang.html`, `best-cafes-da-nang.html`, `da-nang-food-guide.html` all had **priority 30** — identical to placeholder pages
- The scoring algorithm had no slug matching — canonical pages had no special advantage
- Priority multiplier too weak (0.3×) — priority 97 vs 65 barely differentiated results
- 67 sitewide pages had stale 12-entry inline SEARCH_INDEX
- No keyword arrays per page — scoring relied only on title/excerpt text matching

---

## What Was Built

### 1. `search-engine.js` — Sitewide Search Engine (NEW)
Full 174-entry search engine injected into all 67 pages that previously had stale inline search:
- Replaces `window.SEARCH_INDEX = [12 entries]` on every page
- Replaces stale `function runSearch()` with v2 intent-based scorer
- Injected via `<script src="search-engine.js">` before `</head>`
- Backward-compatible: still exposes `window.SEARCH_INDEX` for any legacy code

### 2. Full Priority Map (corrected)

| Priority | Pages |
|----------|-------|
| 85+ | Tier 1: Core booking pages + dining.html |
| 70-84 | Tier 2: Attraction guides, hotel reviews, food/bars |
| 60-69 | Tier 3: Hubs, itineraries, comparisons |
| 40-59 | Tier 4: Specialty features, area guides, individual hotels |
| 30-39 | Tier 5: Long-stay, expat, niche |

**Key corrections:**
- `dining.html`: 30 → 85
- `da-nang-food-guide.html`: 30 → 84
- `best-bars-in-da-nang.html`: 30 → 77
- `da-nang-nightlife-guide.html`: 30 → 76
- `marble-mountains-da-nang.html`: 30 → 75
- `best-cafes-da-nang.html`: 30 → 65
- `dragon-bridge-da-nang.html`: 30 → 73
- `ba-na-hills-guide.html`: 30 → 72
- `son-tra-peninsula-da-nang.html`: 30 → 70
- `da-nang-hotels-rooftop-pool.html`: 30 → 58

### 3. Keyword Arrays Per Page
Every page now has an explicit `k` (keywords) field with:
- Synonyms, alternate phrasings, hotel names, landmarks, intent terms
- Examples: `dining.html` has "michelin cafes bars cuisine pho banh mi"
- `marble-mountains-da-nang.html` has "caves pagoda chua tam thai non nuoc"

### 4. New Scoring Algorithm (v2)

| Signal | Points |
|--------|--------|
| Exact URL slug match | +200 |
| Slug contains query | +80 |
| Exact title match | +160 |
| Title starts with query / "best [query]" | +100 |
| Title contains query | +60 |
| Keywords field match | +30× weight |
| Title term match | +22× weight |
| Category match | +12× weight |
| Excerpt match | +8× weight |
| Slug term match | +18× weight |
| Priority boost | +0.8× priority |

Priority multiplier increased from 0.3× to 0.8× — pillar pages now dominate correctly.

### 5. Synonym Expansion System (44 intent clusters)
Full bidirectional synonym mapping. Examples:

| Query | Expands to |
|-------|-----------|
| dining | food, restaurant, eat, cafe, michelin, bars, nightlife, cuisine, pho, street food |
| marble | marble mountains, non nuoc, caves, pagoda, chua tam thai |
| bar/bars | nightlife, cocktails, craft beer, rooftop bar, happy hour |
| family | kids, children, waterpark, kids club, lazy river, connecting rooms |
| luxury | 5-star, five star, premium, resort, villas |
| airport | DAD, da nang airport, arrivals, transfer, grab from airport |
| rooftop | rooftop pool, sky pool, infinity pool, views |
| honeymoon | romantic, couples, villas, private pool |

### 6. QA Test Results

| Query | Top Result | Status |
|-------|-----------|--------|
| "dining" | dining.html | ✅ FIXED |
| "marble" | marble-mountains-da-nang.html | ✅ FIXED |
| "bars" | best-bars-in-da-nang.html | ✅ FIXED |
| "nightlife" | da-nang-nightlife-guide.html | ✅ FIXED |
| "michelin" | dining.html | ✅ FIXED |
| "cafes" | best-cafes-da-nang.html | ✅ FIXED |
| "dragon bridge" | dragon-bridge-da-nang.html | ✅ FIXED |
| "ba na hills" | ba-na-hills-guide.html | ✅ FIXED |
| "son tra" | son-tra-peninsula-da-nang.html | ✅ FIXED |
| "airport" | da-nang-airport-guide.html | ✅ |
| "beach" | da-nang-beach-hotels.html | ✅ |
| "luxury" | luxury-hotels-da-nang.html | ✅ |
| "family" | family-hotels-da-nang.html | ✅ |
| "My Khe" | my-khe-beach-da-nang.html | ✅ |
| "spa" | da-nang-hotels-spa-packages.html | ✅ |
| "rooftop" | da-nang-hotels-rooftop-pool.html | ✅ |
| "hoi an" | hoi-an.html | ✅ |
| "itinerary" | da-nang-itinerary.html (top 2) | ✅ |
| "budget" | da-nang-budget-guide.html | ✅ |
| "kids" | da-nang-with-kids-guide.html | ✅ |
| "han river" | han-river-night-cruise-da-nang.html | ✅ |
| "transport" | da-nang-transport-guide.html | ✅ |
| "shopping" | best-shopping-da-nang.html | ✅ |
| "couples" | best-luxury-resort-couples-da-nang.html | ✅ |
| "honeymoon" | da-nang-honeymoon-hotels.html | ✅ |
| "villas" | da-nang-hotels-private-pool-villa.html | ✅ |
| "weather" | da-nang-weather-by-month.html | ✅ |

### 7. search.html — Complete Redesign

**Search page hero:**
- Dark ocean hero with large serif heading
- Embedded search form with coral CTA button
- 10 popular pill buttons: Dining, Marble Mountains, Luxury Hotels, Family Hotels, Hoi An, Beach Hotels, Bars, 3-Day Itinerary, Airport, Budget Guide

**Discovery section (before search):**
- 9-card grid showing top priority pages
- "Popular searches" pill row for quick access
- Collapses to single column on mobile

**Search results:**
- Colored left-border accent per category (dining=orange, attractions=green, hotels=teal, hoi an=purple, etc.)
- Category badge on each result
- Query term highlighted in result titles
- Result count shown
- Empty state with fallback pills

**Search overlay (all pages):**
- Updated placeholder: "Hotels, dining, marble mountains, Hoi An…"
- 8 popular pills: Dining, Marble Mountains, Luxury Resorts, Family Hotels, Hoi An, Beach Hotels, Bars & Nightlife, Itinerary, Budget, Airport
- Trending guides grid before typing
- Up to 10 results with left-accent stripe
- Arrow key navigation, Escape to close, / to open
- Result count label

### 8. Sitewide Updates

- **67 pages**: `search-engine.js` injected, stale inline index removed
- **46 pages**: Overlay pills updated to new 8-pill set
- **65 pages**: Overlay placeholder text updated
- **174 pages**: All now benefit from `search-engine.js` when overlay is opened

---

## Files Changed

| File | Change |
|------|--------|
| `search.html` | Complete rebuild — new engine, redesigned UI |
| `search-engine.js` | NEW — 174-entry index + v2 scoring |
| 67 HTML pages | Injected search-engine.js, removed stale inline search |
| 46 HTML pages | Updated overlay search pills |
| 65 HTML pages | Updated overlay placeholder text |
