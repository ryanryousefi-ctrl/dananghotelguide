# Revenue Phase 2 report (2026-11-23)

Start: production `094cb1e` (confirmed latest `main`). Branch `revenue-phase2`.

## Access and baseline (A)
- **Search Console / GA4:** no authenticated access from this environment (no credentials, connectors or exports in the repository). No traffic, ranking, CTR or revenue figures are claimed anywhere. GA4 custom dimensions are **not registered**; see `docs/revenue/analytics-playbook.md` for manual steps.
- **Events verified in a real browser:** one `affiliate_click` per click (hotel review early module, sticky bar, finder, guide modules), carrying `cta_location`, `page_type`, `cta_label`, `cta_position`, `link_key`, `hotel_name`, `device_category`.

## Fact-check findings (A): important
Checked the four Batch 1 articles and the four hotel reviews they drew from against hotel and booking-site listings (Accor, Meliá, Hotels.com, Expedia, Trip.com, Hilton/IHG pages), November 2026.
- Our reviews said Novotel, Grand Mercure, Brilliant and Melia Vinpearl are "directly opposite / next to / five minutes from Dragon Bridge" and "3 km" from the airport. Listings put Dragon Bridge about 1.2 km (Brilliant), about 1.8 km (Melia Vinpearl) and roughly 2 to 3 km (Novotel, Grand Mercure) away, and Han Market 0.3 to 1.3 km. Corrected in the reviews (objective distance statements only, commit "fact-check corrections"), in three comparison/guide pages that repeated the claim, and fully rewritten in the new article (now "Hotels Near Han Market and Dragon Bridge").
- Lounge article rebuilt from the hotels' own pages: InterContinental (breakfast, 14:30-16:30 tea, 17:30-19:30 cocktails), Meliá The Level (15:00-17:00 tea, 19:00-22:00 happy hour), Novotel Premier Lounge (breakfast buffet, afternoon tea, canapés), Hilton Executive Lounge (27th floor; lounge breakfast reported inconsistently).
- **Still unverified, needs the owner:** Brilliant Hotel's "rooftop pool looking at Dragon Bridge" (Hotels.com lists an indoor pool; one listing mentions a rooftop bar/sky-deck); Novotel/Grand Mercure "rooftop pool"; "fastest airport transfer" claims; all other reviews' distances (only the hotels above were checked). Treat location/distance claims in the other reviews as unchecked.

## Existing pages
- Hotel reviews already contain who-it-suits, what-we-like, trade-off, "would we stay" and related-hotel sections, so Phase 2 did not rewrite them; Batch 1 modules plus the corrections above stand.
- The 29 comparison pages already carry a side-by-side table, a verdict and per-hotel price-check buttons (8-11 each); not rebuilt.

## New (D)
- **Hotel finder** `find-your-hotel.html` + `dn-finder.js`: 21 reviewed hotels, filters for beach/city, who is travelling, budget level (star category, not rates), style and priorities; each result shows why it fits, the review's own trade-off, a link to the review and the hotel's existing verified Trip.com button. Hoi An choice links to the Hoi An guides and the verified Hoi An search button. Embedded JSON, no network, no storage, no framework. Built by `scripts/revenue/build-finder.js` (hotel list and tags are maintained there; facts are read from the reviews).
- Linked from the homepage, hotel-reviews and where-to-stay hubs; in the sitemap.
- Reporting: `scripts/revenue/ga4-report.js` (reads GA4 CSV exports; no invented numbers) and `docs/revenue/analytics-playbook.md`.
- Sticky bar audit (320/375/390/428/768): appears from 35% scroll, hides at the page end, hides when another booking button is on screen, never shown at 768+, never over the cookie banner or open menu. Early module (about 16% down) and sticky bar (35% to 97%) are complementary; no change.

## Technical SEO
207 served pages: 0 duplicate titles, 0 duplicate descriptions, 0 broken internal links, 0 canonical mismatches, 0 invalid JSON-LD, sitemap matches served pages (search.html excluded). 33 descriptions exceed 170 characters (left: no CTR data). 10 orphans remain, all utility or off-topic news.

## Not done
- No additional new articles: the Batch 1 audit found most topics already covered, and the fact-check showed our own reviews cannot yet be trusted as the sole source for new location guides. A source-verified distance table for every reviewed hotel is the next content priority.
- Hotels without a verified deep link: Azura (NOT_ON_TRIPCOM), Fusion Suites, Silk Path. No CTA published for them.

## Attribution proposal (not implemented)
Trip.com's search-box tool documents an optional Pubref; link-level sub-ID behaviour for `trip_sub1`/`trip_sub3` is not documented publicly. Do not alter links. Ask affiliation@trip.com whether `trip_sub1` can carry a per-placement tag on generated links; until answered, use GA4 click data as the placement signal.

## Affiliate integrity
Existing Trip.com hrefs lost or changed: 0. New anchors are exact registry URLs. Strict validator 0 failures (207 pages); render + GA sample 0 failures; banner suite 16/16 (162 placements); selftest 30/30; mobile overflow 0 pages at 320/390.
