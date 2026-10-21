# Trip.com cutover readiness

Generated 2026-10-21 by `node scripts/tripcom/readiness.js`. **Not a guarantee of payment.** Links that pass technical checks can still fail to attribute; only gates 4a/4b are evidence of attribution.

| Gate | Evidence from | Status | Detail |
|---|---|---|---|
| 1 Affiliate account readiness (attested) | Owner | OPEN | 0/11 confirmed. Open: account_activated, site_registered_as_intended, alliance_id_matches, site_id_matches, profile_and_payment_details_complete, commission_plan_read, publisher_terms_read, regional_domain_answered_by_support, attribution_window_confirmed_in_writing, date_neutral_links_confirmed_by_support, logo_use_permission |
| 2a Official links generated in the dashboard and imported | Owner | OPEN | 0/123 registry entries (106 unique destinations) have a link; 0 fail checks |
| 2b Every link opened by hand and confirmed to show the right property | Owner | OPEN | 0/123 confirmed |
| 2c Link-format profile derived, reviewed and approved; regional domain decided | Owner + support | OPEN | no link-format profile yet (run link-profile.js derive after the first real links are imported) |
| 3a apply.js dry run reports 0 blockers (needs real links) | Engineering | OPEN | Blocked: 124 reason(s) covering 1504 link(s) |
| 3b Pipeline self-test (synthetic fixtures: accepts good, rejects 15 kinds of bad) | Engineering | PASS | 19/19 passed |
| 3c All served pages convert in a plain-URL preview (no affiliate tracking) and validate | Engineering | PASS | Pages: 202 | Trip.com URLs: 1503 | editorial Booking.com mentions for review: 89 | Failures: {} | Warnings: {"editorial-link":1} |
| 4a Pilot: a genuine customer booking from a pilot-page link appears in the Booking report (T+1) | Trip.com Booking report | OPEN | 0 genuine booking row(s) recorded; GA4 clicks on pilot pages: not recorded |
| 4b Pilot: that stay is checked out and appears as eligible commission (5th of the following month) | Trip.com Commission report | OPEN | 0 matching commission row(s) recorded |

**Open gates: 7 of 9.** Cutover requires explicit owner approval even when all gates pass.

Pilot pages (5): hyatt-regency-da-nang.html, intercontinental-da-nang.html, brilliant-hotel-da-nang.html, furama-resort-da-nang.html, four-points-sheraton-da-nang.html
