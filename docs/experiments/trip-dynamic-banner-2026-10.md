# Experiment: Trip.com dynamic banner on best-hotels-in-da-nang.html

- **Banner:** official Trip.com dynamic banner `DB20401215`, now **728 x 90** (it was 300 x 250 for the first part of launch day, 2026-10-21; replaced the same day), Alliance ID 11013066, Site ID 333523744. URL used byte for byte: `https://www.trip.com/partners/ad/DB20401215?Allianceid=11013066&SID=333523744&trip_sub1=` (record, checksums and embed code: `data/tripcom/dynamic-banner.json`).
- **Page:** https://www.dananghotelguide.com/best-hotels-in-da-nang.html. Placement: a full-width band between the two signature picks (InterContinental, Sheraton) and the "Hotels We'd Send Friends to First" grid, centered on desktop (screens 840px and wider), labelled "Advertisement · Trip.com affiliate offer" with a paid-placement note. One banner, this page only. **Shown on screens 840px and wider only:** 728 x 90 has no responsive version from Trip.com, so below that the whole band is hidden (not squeezed, scaled or cropped), nothing is loaded and no events are sent. Phone visitors therefore never see this banner, which lowers the evidence it can produce.
- **Launch:** 2026-10-21. **Review date:** 2026-11-20 (30 days). Any change to the placement or the page's booking buttons during the window should be logged here so results stay interpretable.
- **Privacy:** nothing is requested from Trip.com until the visitor clicks "Show hotel offers", or has already accepted cookies on this site (then it loads when scrolled into view).
- **Installer / revert:** `node scripts/experiments/install-trip-banner.js` (re-run after any page rebuild); `--remove` takes it out; or revert the experiment commit.

## Destination check (2026-10-21, after the 728 x 90 change)
The first 300 x 250 version displayed New York hotels. The 728 x 90 version, with the identical `src`, was loaded once from a Vietnam connection and showed **Da Nang hotels**: Diamond Sea Hotel (Phuoc My), The Now Boutique Hotel & Apartment (My Khe Beach), Hotel Soco (Phuoc My) and Nesta Celia Danang Hotel (Phuoc My), each "from US$16-62", rotating as a carousel. The hotels are chosen by Trip.com, not by us, and are not our editorial picks (hence the advertisement label). Not verified: whether the destination depends on the visitor's location or is fixed for every visitor; re-check from another country before judging results. We never changed the URL or added targeting parameters.

## What is measured
| Signal | Where | Meaning |
|---|---|---|
| `affiliate_banner_view` (state placeholder/loaded) | GA4 | the banner area was at least half visible, once per page view |
| `affiliate_banner_load` (trigger click/consent) | GA4 | the banner was activated |
| `affiliate_click` on the 40 existing booking buttons | GA4 | outbound clicks from this page (compare before/after) |
| Banner performance, bookings, commission | Trip.com dashboard (Reports, filter Site ID 333523744; the banner id appears under the banner tool) | the only evidence of bookings or earnings |

Clicks **inside** the Trip.com iframe cannot be seen by our code and are not tracked. GA4 events are sent where Consent Mode permits.

## Baseline (before launch)
- Search Console, last 3 months before 2026-10-21: this page **9 clicks, 1,699 impressions, CTR 0.53%, average position 11.9** (Korean version: 1 click, 92 impressions). Site-wide in the same export: 623 clicks.
- The page had **40 Trip.com booking links** (buttons and links); no banner.
- **GA4 baseline not captured here** (no GA4 access). Before or soon after launch, export from GA4 for 2026-09-21..2026-10-20: sessions and `affiliate_click` events for page_path `/best-hotels-in-da-nang.html`, and paste the numbers below.
  - Sessions: ____  `affiliate_click`: ____  by device: ____

## Reading the result (decision rules)
At about 9 organic clicks per quarter this page gets very little traffic, so expect few or no banner views and probably no bookings in 30 days. A result of "no bookings" is **inconclusive, not negative**. Suggested decision on 2026-11-20:
- **Keep** if the banner was loaded by a meaningful share of viewers and the Trip.com dashboard shows banner-attributed activity, or if traffic is simply too low to judge and it harms nothing (no drop in `affiliate_click`, no complaints).
- **Move or add elsewhere** only to a page with enough traffic (check Search Console first).
- **Remove** if `affiliate_click` on the page falls versus baseline, the page loads slower, or Trip.com reports nothing after the window and traffic was adequate.
Do not credit the banner with bookings without Trip.com report evidence.
