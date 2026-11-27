# Operation Revenue Reset (2026-11-27)

Start: production `e6b9fd4`. Branch `revenue-reset` (worktree `~/dananghotelguide-rr`). Full rebuild: `NODE_PATH=~/dananghotelguide/node_modules sh scripts/build-all.sh` (byte-stable: a second run changes nothing). The reset layer is `scripts/reset/` and runs last in the build.

**Technical completion is not revenue proof.** Nothing here shows more bookings or commission. That needs the post-launch data described at the end.

## 1. What was wrong (teardown, measured in a real browser at 390 and 1280 px)

| Problem | Evidence (before, `e6b9fd4`) |
|---|---|
| Homepage was a magazine | Full-screen editorial carousel; the only first-screen action was "Explore the hotels". No hotel, no hotel-specific price check above the fold. 12 actions on the first phone screen, 21 on desktop. |
| Hotel lists started below a cinematic hero | On every category page the first hotel card sat at about 1.4 phone screens. Pages ran 17–48 phone screens. |
| Duplicate commercial modules | Every list page carried four machine-inserted modules: a city-search price band under the hero, a "check dates" band, a two-hotel compare box and a "still planning?" box. Where to Stay carried 11 (hero band, neighbourhood chooser, picks, per-area cards, compare, season, return, final). 66 such blocks across the 20 key pages. |
| Generic searches posing as recommendations | 63 city-wide search buttons on those 20 pages, often the first booking action a visitor saw. |
| Too many tools | Finder ("Stay Planner"), compare, shortlist, directory and map were five separate entry points with five-question forms before any hotel appeared. |
| Navigation | 8 top-level menus (Hotels, Where to Stay, Guides, Food & Nightlife, Reviews, Hoi An, News, More); shopping was one dropdown among many. |

Not claimed: that these caused the low earnings. Visual inspection cannot prove conversion; see "Commercial baseline".

## 2. What was rebuilt, removed and consolidated

**One design system** (`dn-shop.css`, `dn-shop.js`, `scripts/reset/shop.js`): hotel card (photo, tier, name, verified area and beach access, one-line verdict, best for, drawback, one blue hotel-specific Trip.com button, Read review / Save / Compare), compact card, "lite" card, recommendation grid, area decision card, category tiles, quick-answer box, comparison table, jump bar, disclosure. Every fact comes from `data/hotels/facts.json`; unknown facts are omitted. No prices, scores, discounts or scarcity are shown.

**Homepage (`index.html`, `<main>` replaced):** compact hero "Find Your Perfect Hotel in Da Nang" with one primary action (Find Hotels & Check Prices) and one secondary link (top picks). Immediately below, an instant filter (no quiz): Da Nang / Hoi An, beach / city, luxury / upscale / value, with kids / as a couple, and verified must-haves (on the beach, infinity pool, private pool villa, kids' club, club lounge). Results are pre-rendered cards of all 21 verified hotels in our published Best Hotels order, 6 shown until a filter is used. Then: top picks by trip type (each badge names the published guide it comes from), the official Trip.com search box (click to load, exact embed code), category tiles, areas, "How we choose" with the commission disclosure, and links to reviews and travel guides (demoted, not deleted). The carousel and its scripts are gone.

**Where to Stay (`where-to-stay-in-da-nang.html`):** new H1 and subheading as specified, primary "Compare Da Nang Hotel Prices" (labelled as a city search), jump bar, short answer, six area decision cards (who should stay, why, drawback, our verified hotels there with hotel-specific buttons; An Thuong and Hoi An have no verified-dataset hotels, so they link to their guides and a clearly labelled city search), best hotels by trip type, then the full original long-form guide, and a "Ready to choose?" recap table. Area claims come from the page's own comparison table. Removed: all 11 Phase 3 `dn-c3:ws:*` modules.

**Category and area pages (15):** best hotels, luxury, family, beach, boutique, budget, Hoi An, infinity pool, private pool villa, Han River, riverfront, My Khe, An Thuong, Son Tra, Non Nuoc. Each gets a slim hero (same H1 and lede text), then "Our picks": a short answer naming the page's **own published** top and signature picks, shopping cards, an "At a glance" table of the verified hotels, a labelled city search, and the untouched long-form guide below. Where a page's own pick is not in the verified dataset (Mikazuki, Caro, Wink, CHICLAND, Four Seasons The Nam Hai, Anantara, Minh Boutique, M Hotel, Saha Casa) it gets a "lite" card built only from that page's pick text and the verified registry button already on the page. Budget has no verified picks, so it gets the short answer and search only. Removed on each: the four duplicate rollout modules.

**Tools (Find → Compare → Save → Check prices):** "Find Hotels" (`find-your-hotel.html`, same URL) now opens with the same instant filter; the Stay Planner stays below as the optional tailored step. Every card has its own price button, so saving or comparing is never required. Directory and map: slim hero, shortcut tiles to the curated shortlists, duplicate price band and "still planning?" removed; the tools themselves are unchanged.

**Navigation (193 pages):** Find Hotels · Best Hotels ▾ · Where to Stay ▾ · Compare Hotels · Saved (count) · More ▾ (reviews, guides, things to do, itineraries, dining, nightlife, Hoi An guide, news, videos, Korean guide, about). The header city-search button now says "Da Nang Hotel Prices" (same URL).

**Retired generators:** `apply-home.js` and `apply-where-to-stay.js` were removed from `build-all.sh` (their output is replaced by `scripts/reset/apply-reset.js`). `page-shell.js` strips the reset marker and finder script from the template it borrows.

### Commercial inventory, 20 key pages (inside `<main>`)

| | Before | After |
|---|---|---|
| Trip.com links | 452 | 544 (15 of the homepage cards are hidden until a filter is used) |
| Hotel-specific links | 389 (86%) | 515 (95%) |
| City-wide search links | 63 | 29 |
| Duplicate rollout modules | 66 | 0 |

Per page: `docs/revenue/reset-inventory.json`.

## 3. Review protection

`node scripts/reset/review-guard.js` compares 71 protected pages with `e6b9fd4`: every hotel review, every `review-*` page, both withdrawn reviews (status unchanged), every page with single-hotel Review/Hotel schema, and every page linked from the reviews index (including the hand-written hotel-vs-hotel comparisons). Protected: the article (`<main>`, or H1-to-footer where a page has no `<main>`), title, meta description, canonical, robots and every JSON-LD block. Machine-inserted booking modules (between `dn-c3`/`dn-c4`/`dn-revenue`/`rr` markers, and the Trip.com banner) are reported separately.

Result: **71 protected pages; editorial content identical on all 71, changed on 0. 49 are byte-identical including their booking modules; on the other 22 the only difference is an auto-generated element ID inside a machine-inserted Trip.com compare module.**

## 4. Affiliate integrity

- `node scripts/tripcom/validate.js --cutover`: **0 failures (1 existing editorial-link warning); the official search box embed is present on the homepage, byte-exact**
- `affiliate-proof.js` vs production: **193 changed pages, 142 new Trip.com anchors, 0 not in the registry; 50 fewer occurrences of existing URLs**. Its "lost" count is occurrences: the duplicate modules removed on purpose. 0 new anchors outside the registry.
- Destinations that left a page entirely (7): on the Private Pool Villa guide, Novotel, Wyndham Soleil, Pullman and Furama (non-villa hotels that sat in a generic compare module); on Where to Stay, Four Points, Melia and Pullman (retired per-area cards). Each remains bookable from its own review and category pages.
- Every new button is built from the verified registry (`components.js` refuses unverified keys). Hotel buttons go to that hotel; city searches say "Compare Da Nang/Hoi An Hotel Prices". No outbound visit without a click; the search box iframe loads only on click (tested).
- GA4: one `affiliate_click` per click (tested), now with `layout_version` (`reset1` on rebuilt pages, `legacy` elsewhere). New engagement event `dn_shop_filter`. Consent banner unchanged (tested).
- Trip.com dynamic banner suite: **16/16 passed, 162 banner pages**

## 5. Tests, performance, SEO

- Functional browser tests (`functional-test.js`, updated for the new layout, 6 new homepage tests): **39/39 passed**
- Overflow and page-error sweep, every changed page at 320, 375, 390, 428, 768, 1024, 1280, 1440: **193 changed pages at 8 widths: no horizontal overflow, no new page errors (`best-budget-hotels-in-da-nang.html` has one script error that also exists on production)**
- Facts: `fact-consistency.js` 216 pages, 0 errors (1 existing warning). Module guardrail `cta-audit.js`: no adjacent duplicates.
- SEO (`scripts/revenue/seo-check.js`): 0 canonical mismatches, 0 missing or multiple H1, 0 invalid JSON-LD, 0 hreflang errors; orphans equal the baseline (11); the only "broken" internal links are `news.html`, which Vercel serves through a rewrite (unchanged). URLs, titles, meta descriptions, canonicals, structured data and sitemap are unchanged. H1 changed on three pages: homepage, Where to Stay (both as specified) and Find Hotels.
- Lighthouse (mobile, production, single runs, nothing else running): RESULT_LIGHTHOUSE

## 6. Deployment and rollback

RESULT_DEPLOY

## 7. Affiliate economics and second-partner evaluation

What our own account shows can only be read in the Trip.com Partners dashboard (no API or credentials here). Owner check, monthly: clicks, unique visitors, bookings, pending vs approved commission, cancellations, and the commission rate shown for **our** account (do not assume the advertised maximum).

| Program | Hotel commission (published, unverified for our account) | Attribution window | Notes for Da Nang |
|---|---|---|---|
| Trip.com (current) | "up to 7%" on hotels (Trip.com); 5.5% default for hotels on Awin's listing | 30 days web, 7 days app (Trip.com partner page) | Strong Asian inventory; deep links in use; the longest window of the three |
| Agoda Partners | tiered by monthly bookings, roughly 4–7% per third-party guides; Agoda's FAQ describes "up to 60% of margin" | short (one source: 1 day) | Very strong Vietnam inventory and price competitiveness; paid after check-out |
| Booking.com (via CJ since 2025) | 4% on completed stays per CJ partner page (secondary sources quote 25–40% of Booking's commission) | session / about 2 days | We migrated away in Oct 2026; short window |

Sources: [Trip.com affiliate guide](https://www.trip.com/ask/questions/trip.com-affliate-program.html), [Trip.com partners](https://in.trip.com/partners/index), [Awin: Trip.com](https://ui.awin.com/merchant-profile/22405), [Agoda partner FAQ](https://partners.agoda.com/en-us/faq.html), [Track360 Agoda teardown](https://track360.io/blog/agoda-affiliate-program-operator-teardown-2026), [Make Influence: Booking.com via CJ](https://www.makeinfluence.com/en/academy/booking-coms-affiliate-program-how-travel-creators-earn-commission), [Awin: Booking.com](https://ui.awin.com/merchant-profile/6776).

**Recommendation:** do not migrate. Trip.com's 30-day window is the most forgiving for a research-heavy site like this one. The candidate worth testing is **Agoda** (Vietnam price strength), as a controlled A/B on hotel buttons for a few hotels, only after the owner is approved and generates real Agoda deep links. Not done here: no account was created and no partner link was invented. The `data-provider` attribute and `layout_version`/`cta_location` parameters already let a second provider be tracked separately.

## 8. Commercial baseline: what can and cannot be measured

- **Cannot (from this environment):** GA4, Search Console and Trip.com reporting need the owner's login; no credentials are available, so there is no traffic, click, booking or commission baseline here. Lifetime pageviews divided by October-to-November earnings is not a conversion rate: Trip.com links only went live in October 2026.
- **Can, once exported:** `scripts/revenue4/revenue-dashboard.js` (GA4 CSV) now has a "Layout cohort" table (`layout_version` reset1 vs legacy) and a table of clicks on the new cards (`cta_location` `rr-*`). Register `layout_version`, `filter_group` and `filter_value` as custom dimensions (`docs/revenue/ga4-setup-checklist.md`).
- **Experiment design:** this is a dated before/after, not a randomized test. Compare the 28 days before 2026-11-27 with the 28 days after, for the same page types: affiliate clicks per 100 page views (GA4), then Trip.com bookings and approved commission for the same windows (Partners dashboard; per-page booking attribution is not available, only per-link `trip_sub3` where Trip.com reports it). Treat small samples (fewer than ~30 bookings per window) as inconclusive; seasonality (rainy season Oct–Dec) also moves the numbers.
- **Success criterion:** approved commission per 1,000 hotel-intent sessions rises in the after window. Until that is shown, the rebuild is technically complete and commercially unproven.
