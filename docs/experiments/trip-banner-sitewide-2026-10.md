# Trip.com dynamic banner: sitewide rollout (2026-10-21)

Supersedes the single-page controlled test (`trip-dynamic-banner-2026-10.md`): that page keeps its original position, but the banner is now on 162 pages, so the "one page vs the rest" comparison and the 2026-11-20 single-page review no longer apply. Use the new GA4 parameters below and Trip.com's dashboard instead.

- **Banner:** the same official 728 x 90 banner `DB20401215` (`data/tripcom/dynamic-banner.json`, `src` unchanged: Alliance 11013066, SID 333523744), same label, paid-placement note, click-to-load / cookies-accepted loading and GA4 events.
- **Pages with a banner: 162** (47 guide, 37 hotel-list, 30 comparison, 22 hotel-review, 20 korean-article, 6 hoi-an). **Excluded: 40 of 202.**
- **Placement rule** (`scripts/banners/place-banners.js`): between top-level editorial blocks only, about 45% of the way through the page's text (never before 1,200 characters of content, late positions only as fallback), never inside a paragraph, card, table, image, list, header, footer or booking UI, not next to a booking strip, and only where the full 728px box fits at 1024 and 1280 px wide (checked in a browser). The result is recorded in `data/tripcom/banner-placements.json`; `best-hotels-in-da-nang.html` is pinned to its original spot.
- **Not on:** the homepage (the Trip.com search box is there), legal/about/trust pages, hubs and indexes, the directory and the map (many booking buttons and popups), and tool/utility pages.

| Pages | Why excluded | Pages |
|---|---|---|
| 1 | about / trust page | about.html |
| 5 | short page (under about 2,400 characters of text) | airbnb.html, an-bang-beach-hotels.html, best-hotels-in-hoi-an.html, best-value-hotels-hoi-an.html, da-nang-digital-nomad-forbes-2026.html |
| 18 | reading column narrower than 728px (a 728px banner would have to be squeezed) | azura-da-nang.html, da-nang-digital-nomad-guide.html, da-nang-eco-city-merger-2050.html, da-nang-fireworks-festival-diff-2026.html, da-nang-guide-for-russian-travelers.html, da-nang-hotel-prices-by-month.html, da-nang-international-tourism-growth-2026.html, da-nang-national-day-celebration-2026.html, ... |
| 1 | short utility page | contact.html |
| 1 | interactive directory (tables, filters, many booking buttons) | da-nang-hotel-directory.html |
| 1 | interactive map with booking popups | da-nang-hotels-map.html |
| 1 | no natural boundary between top-level sections | da-nang-russia-cis-air-links-2026.html |
| 1 | tool page | da-nang-time-converter.html |
| 1 | video page | da-nang-videos.html |
| 1 | policy page | editorial-policy.html |
| 2 | hub / index page | guides.html, hotel-reviews.html |
| 1 | methodology page | hotel-review-methodology.html |
| 1 | homepage | index.html |
| 1 | Korean homepage / hub | kr/index.html |
| 2 | legal page | privacy.html, terms.html |
| 1 | search utility | search.html |
| 1 | trust page | why-trust-us.html |

## Controls
- **Config:** `data/tripcom/banner-config.json`. `exclude_pages` lists deliberate exclusions; `enabled: false` plus `node scripts/banners/install-banners.js` removes every banner from every page (article content and booking buttons are not touched).
- **Instant switch-off without editing pages:** in `dn-design.css` change `:root { --dn-adband-display: block; }` to `none`. Every band disappears and the loader never contacts Trip.com.
- **Re-place after content changes:** `node scripts/banners/place-banners.js` then `node scripts/banners/install-banners.js`. Pages are generated, so re-run the installer after any rebuild.
- **Narrow screens:** the band is hidden below 840px (the banner has no responsive version). Nothing loads there and no events are sent. The loader also hides a band that would be squeezed below 727px.

## Measurement
GA4 events (where Consent Mode permits): `affiliate_banner_view` (state placeholder/loaded) and `affiliate_banner_load` (trigger click/consent), each with `page_path`, `placement` (e.g. after-43pct) and `page_type` (hotel-review, comparison, hotel-list, guide, hoi-an, korean-article). Clicks inside the Trip.com iframe cannot be observed and are not tracked. Use the Trip.com dashboard for banner performance and bookings; do not credit the banner with bookings without that evidence. Traffic is low (about 623 Search Console clicks per quarter site-wide), so expect little data in the first weeks.

## Tests
`node scripts/banners/banner-sitewide-test.js` (16 checks: static on all 202 pages; browser on every banner page at 1280 and 390 px, 768 sample, consent and click-to-load samples, no duplicate events, CLS) and the existing strict validator (`scripts/tripcom/validate.js --cutover`, which now also enforces one banner per placed page and none elsewhere).
