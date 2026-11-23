# Revenue journey project: summary (2026-11-23)

Branch `revenue-journey`. Baseline production commit: `00d193d`. Every change is a template/script run (scripts/revenue/*) and is reversible with `git revert`.

## Audit (docs/revenue/audit.json, seo-check.json)
- 229 HTML files, 202 served pages before this project (206 after). 53 hotel-review files (29 served; the 24 `review-*` files are redirects).
- Before: served hotel reviews carried 1 booking CTA each, near the end. The homepage had no direct price-check action outside the header. 38 informational pages had zero booking actions.
- 49 page/width combinations overflowed horizontally on phones (320/390 px): now 0.
- 21 orphan pages: now 10 (the rest are utility pages or off-topic news).
- 0 broken internal links, 0 canonical mismatches, 0 invalid JSON-LD (checked), hreflang reciprocal.
- Not available: Search Console and GA4 exports (no access from this environment). Nothing below is a measured performance claim.

## What changed
1. Hotel reviews (21 pages using the `hr-` template): early "Considering <Hotel>?" decision module after the quick verdict; price-check buttons for the genuine alternatives each review already links to; hotel-specific end CTA label. Each button reuses the page's own existing primary Trip.com anchor (same href).
2. 23 informational guides with real accommodation intent: one end-of-guide "compare hotels" module (Da Nang or Hoi An verified search destination from the registry), plus "Read first" links.
3. Homepage: a direct "Compare Da Nang Hotel Prices" action under the hotel finder and Da Nang/Hoi An buttons in the booking band. No third-party load.
4. Mobile sticky price-check bar on review pages (phones only, after 35% of the article, hidden while any booking button is on screen, while the cookie banner or menu is open, dismissible, loads nothing from Trip.com).
5. GA4 `affiliate_click` now also sends `page_type`, `cta_label`, `cta_position` (% down the page) and infers `cta_location` for older buttons (header, mobile_menu, comparison_table, map_popup, directory, hero, inline). Same event, same dedupe, no personal data.
6. Four new decision guides built only from facts in our own reviews: hotels near Dragon Bridge and Han Market; My Khe Beach or Han River; hotels with executive lounges; where to stay between Da Nang and Hoi An. All in the sitemap, linked from hubs. Not translated into Korean.
7. Internal links: comparisons and decision guides now have inbound links (hotel-reviews hub, guides, where-to-stay hubs).
8. Mobile containment CSS (tables scroll inside themselves, footer legal links wrap).
9. Honest labels: six airport-guide buttons said "Book <Hotel>" but point to the Da Nang search; they now say "Compare Da Nang Hotel Prices". (Their URLs are unchanged.)

## Affiliate integrity (proved by diff against production)
- Existing Trip.com hrefs lost or changed: 0. New anchors: 143, every one an exact `affiliate_url` from data/tripcom/registry.json. Registry untouched.
- Strict validator: 0 failures on all pages; render + GA check on a 9-page sample: 0 failures; banner suite 16/16 (162 placements); selftest 30/30.

## Measurement
GA4 custom dimensions to register once (Admin > Custom definitions, event scope): `cta_location`, `page_type`, `cta_label`, `cta_position`, `link_key`, `hotel_name`, `device_category`. Then in Explore: rows `page_path`, columns `cta_location`, metric `Event count` for `affiliate_click`; divide by page `Views` for outbound CTR. A click is not a booking: only the Trip.com Booking/Commission reports confirm bookings, and they cannot be matched to a page without a per-page sub-ID (not added; needs Trip.com authorisation).

## Experiments (no claims until data exists)
Run one at a time, 4 weeks each, compare against the same page types in the prior 4 weeks: (1) early module on vs off on a subset of reviews (revert 5 pages by deleting the `dn-revenue:early` block); (2) hotel-specific vs generic label; (3) sticky bar on vs off; (4) homepage quick action. Low traffic means expect only large effects to be visible.

## Not done / needs data or access
- 15-25 new articles: 4 published. The topic list is mostly already covered by existing pages (connecting rooms, kids clubs, private beach, rooftop pools, spa, adults-only, near airport, price by month); more would cannibalise.
- Search Console-driven title/CTR work and keyword research with real demand data.
- Hotels without a verified deep link (azura NOT_ON_TRIPCOM; fusion-suites and silk-path have none): no direct CTA published.
- Titles longer than ~62 characters (about 40 pages) left alone: no CTR data to justify changing indexed titles.

## Rollback
`git revert -m 1 <merge commit>` (see deployment notes), or promote the previous Vercel deployment of `00d193d`.
