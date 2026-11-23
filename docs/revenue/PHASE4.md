# Phase 4: revenue acceleration and organic growth (2026-11-23)

Start: production `89294d5`. Branch `phase4` (worktree `~/dananghotelguide-p4`). Rebuild everything with `NODE_PATH=~/dananghotelguide/node_modules sh scripts/build-all.sh` (idempotent; a second run changes nothing).

## Batch A: baselines and research
- **Analytics access:** no GA4 or Search Console credentials in this environment, so no traffic, ranking or revenue baselines exist. Nothing in this report is a measured outcome. Reporting tools were built instead (Batch E).
- **Lighthouse baseline** (mobile, production, `89294d5`): see the table at the end.
- **Search opportunity study:** `docs/revenue/p4-search-opportunities.json` (22 ranked opportunities with the URLs that rank today and their gaps) and `p4-search-summary.md`. No search volumes were available from a verifiable source; signals are qualitative (who ranks, People-Also-Ask, page gaps). Main finding: the site is already deep (219 pages); near-duplicate pages compete with each other, so the best moves are hub-and-spoke consolidation and data-backed rebuilds, plus a few genuinely missing pages.
- **Trip.com partner products:** `docs/revenue/tripcom-partner-products.md`. Official pages confirm hotels, flights, trains and tours/tickets, commission "up to 7%". Cookie window, cross-product attribution, sub-ID reporting and banner sizes are **not confirmed** by official sources; ask affiliation@trip.com before relying on them. No new travel products were added.

## Editorial integrity finding (fixed)
Two indexed reviews described hotels we could not find anywhere: **"Azura Da Nang"** (no listing; "Azure Hotel Danang" is a different hotel) and **"Silk Path Grand Resort & Spa Danang"** (Silk Path Grand operates in Hue and Sapa only). Both pages now carry a withdrawal notice (URL kept, `noindex, follow`, no hotel/review schema, out of the sitemap) and every recommendation of them was removed from lists, the directory, the map and guides. The original text is in git history (`89294d5`) if the owner can verify either property. The real **Fusion Suites Danang Beach** page was fact-checked (aparthotel across the road from the beach; "all-inclusive" removed).

## Batch B: clusters and rebuilt pages (`scripts/revenue4/apply-clusters.js`)
- Four topic clusters with a hub and a "full guide series" navigation block on 25 pages: **Where to stay** (hub `where-to-stay-in-da-nang`), **Family hotels** (hub `family-hotels-da-nang`; `best-family-resort-da-nang` is the single-pick spoke), **Luxury resorts** (hub `luxury-hotels-da-nang`), **Prices and booking** (hub `da-nang-hotel-prices`). Near-duplicates are differentiated by role rather than redirected, to keep URL equity.
- Verified fact tables (from `data/hotels/facts.json`, `routes.json`, `scripts/revenue4/curated.js`; no prices or scores) rebuilt into 10 pages: family hotels, kids' clubs, private pool and multi-bedroom villas, connecting rooms, club lounges, luxury resorts, beach hotels (beachfront vs across the road), Non Nuoc resorts (with Hoi An times), Da Nang vs Hoi An (travel times by base), rainy season (indoor facilities + flexible booking).
- All 19 hand-written two-hotel comparison pages gained a sourced side-by-side facts table (area, beach, pools, lounge, kids, Han Market, airport, Hoi An) linking to the compare tool.

## Batch C: new pages (`scripts/revenue4/new-pages.js`)
1. `da-nang-hotel-taxes-service-charge.html`: "net" vs "++", VAT (8% under Resolution 204/2025/QH15 until 31 Dec 2026; hotel coverage not named in the text, so readers are told to check the invoice), typical ~5% service charge (practice, not law), how to compare totals. Sources cited on the page. Rank 1 opportunity: no strong competitor answer.
2. `intercontinental-vs-tia-wellness-da-nang.html`: rank 13 opportunity; verified table, who each suits, both verified Trip.com links.
3. `is-a-luxury-resort-in-da-nang-worth-it.html`: rank 14; when the premium pays off, room categories in plain language, verified luxury table.
Pages built: 3 new + 10 substantially rebuilt + 19 comparison upgrades = 32 pieces. Fewer brand-new pages than the 12-20 target on purpose: the research showed most remaining intents already have a page, and new near-duplicates would compete with them.

## Batch D: Stay Planner and shortlist
- **Da Nang Stay Planner** = the existing finder (`find-your-hotel.html`, same URL) extended with nights (1-2 / 3-4 / 5-7 / 8+) and main priority (value / convenience / family / luxury). Documented ranking rules in `dn-finder.js` `score()`. Each result shows verified travel times (airport by road, Han Market walk or road), our "why it fits" and trade-off from `editorial.js`, Save and Compare, and the verified Trip.com link; a "Your stay plan" box says what to compare in the rate (inclusions, refundability, family or club terms). No prices are generated. Event `dn_planner_use` (engagement, not a click).
- **Shortlist:** "Stay Planner" and "Compare & Saved (n)" added to the Hotels menu on 190 pages (count from this browser only); return prompts in the "Still planning?" module; the compare page opens the saved hotels automatically; comparison URLs remain shareable. Still local-only, no accounts, no price tracking claims.
- **Homepage:** the price-check module's second action is now "Plan My Stay"; editor's picks link to the planner and saved hotels. Slider and masthead untouched.

## Batch E: reporting
`scripts/revenue4/seo-dashboard.js` and `revenue-dashboard.js` build static HTML dashboards from Search Console and GA4 CSV exports (exact export steps: `docs/revenue/reporting-workflow.md`). GA4 custom dimensions are still unregistered: `docs/revenue/ga4-setup-checklist.md`.

## Missing Trip.com deep links (owner action in the Partners dashboard)
- **Fusion Suites Danang Beach:** search trip.com for the hotel; if listed, open its hotel page, copy the URL into the Partners dashboard link generator, and add the generated link to `data/tripcom/registry.json` (status VERIFIED). It did not appear in our searches.
- **Azura / Silk Path Grand:** not needed (reviews withdrawn).

## Validation, production and rollback
PHASE4_RESULTS
