# Booking.com / CJ removal plan

Everything below happens in the single cutover commit (`apply.js --write` plus
the manual edits listed). Nothing changes on production before that.

| # | Integration | Count | Action | How |
|---|---|---|---|---|
| 1 | Static CJ links (`kqzyfj.com/click-101820678-17293132`) | 988 | Replace with the official Trip.com link and button markup | `apply.js` |
| 2 | Nav "Search Stays" buttons (desktop + mobile menu) | 394 | Same; compact/block variants | `apply.js` |
| 3 | JS data links (directory `b:`, map `bk:`, review cards `bookingUrl:`, homepage `STATIC_DA_NANG_BOOKING`) | 201 | URL swapped in data; buttons branded at runtime | `apply.js` + `tripcom-cta.js` |
| 4 | Homepage dated widget (`#bkSearchBtn` handler building a CJ URL) | 1 | Replaced (link mode, or dated mode with an official template) | `apply.js` |
| 5 | Sitewide date widget `bk-widget.js` | 152 pages | Include swapped to `tripcom-widget.js`; `bk-widget.css` kept for layout | `apply.js` |
| 6 | GA4 listener `booking-cta-tracking.js` | 201 includes | Swapped to `tripcom-cta.js` | `apply.js` |
| 7 | CJ page-impression tag `yceml.net/am_gen/101820678/…/am.js` | 230 files | Removed (it sends visitor impressions to CJ) | `apply.js` |
| 8 | `data-booking-url` attributes (dead, with `aid=1784897`) | 171 | Removed from migrated links | `apply.js` |
| 9 | JSON-LD ItemList `url` → booking.com (`aid=1784897`) | 17 | `url` dropped. Optional later: point at our own review pages | `apply.js` |
| 10 | Disclosures and footer legal lines | 254 blocks + 20 captions | Rewritten from known patterns; unknown wording stops the run | `apply.js` |
| 11 | Stale comments (`<!-- Affiliate Config: aid=… -->`, `<!-- CJ DLA -->`) | 4 | Removed | `apply.js` |
| 12 | Editorial "Booking.com" mentions | about 90 | Human review: keep legitimate ones, fix misleading ones | `tripcom-editorial-review.csv` |
| 13 | `privacy.html`, `terms.html`, `about.html` legal wording (program, cookies) | 3 pages | Rewrite for Trip.com (owner sign-off) | manual |
| 14 | "Not currently listed on Booking.com" badges (`.bk-unavailable`) | 11 | Re-check each hotel on Trip.com; remove or reword | manual |
| 15 | Prices "per night · via Booking.com" (`.sc-price-sub`) | 3 | Re-source the price or drop the provider | manual |
| 16 | Meta descriptions naming Booking.com | about 2 | Edit | manual |
| 17 | Unserved files still holding CJ links (redirected `hotels.html`, `review-azura-da-nang.html`, `review-fusion-suites-da-nang.html`, internal `site-preview.html`) | 4 | Not published; optionally delete or migrate for tidiness | optional |
| 18 | Maintenance scripts (`scripts/apply-cj-static-links.js`, `audit-cj-*.js`, `fix-cj-affiliate.js`, `fix-booking-links.js`) and `CLAUDE.md` CJ section | n/a | Keep until validated (rollback tooling), then archive | after validation |

**Kept on purpose:**
- the CJ account and Evergreen link, for rollback;
- the historical mapping `data/tripcom/cj-historical-inventory-2026-10-16.csv`;
- legitimate editorial references, e.g. "call the hotel directly, not just
  via Booking.com messaging".

**Leftover check:** `validate.js` fails on any remaining:
- CJ link;
- booking.com `href` or script URL;
- `data-booking-url`;
- CJ tag;
- old include;
- `aid=1784897`;
- disclosure that names Booking.com or CJ.
