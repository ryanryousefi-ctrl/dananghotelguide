# Request to Trip.com Affiliate Support (Option C, send only if dashboard automation is not permitted)

To: affiliation@trip.com (from the registered email; include the account ID)
Subject: Alliance ID 11013066 / Site ID 333523744: bulk affiliate link generation and tracking confirmation

Hello,

We run Da Nang Hotel Guide (https://www.dananghotelguide.com), Alliance ID 11013066, Site ID 333523744. We are moving our hotel booking links to Trip.com and need affiliate links for 106 destinations (97 hotel detail pages and 9 city hotel lists). We have generated two with the Affiliate Link tool and they work as expected (date-neutral).

1. Is there an approved bulk method (CSV/API/partner integration) for the Affiliate Link tool? If not, could your team generate the links for the attached CSV (destination URL, Trip.com ID, name) for Site ID 333523744 and return them unmodified?
2. May we automate the normal Affiliate Link form in the dashboard (one request every few seconds, from our own logged-in session) to avoid pasting 106 URLs by hand? If this is not permitted, please say so.
3. Which domain must links use for a Vietnam-focused site: www.trip.com (what the generator returns) or vn.trip.com?
4. Are date-neutral hotel and city-list links credited normally, and how are app bookings after a web click attributed?
5. Can you confirm in your logs that clicks carrying Site ID 333523744 from dananghotelguide.com are being received (click-level confirmation), before the first booking?
6. What does `trip_sub3` (for example D20397190 on our generated links) represent? Is it constant per account/site?
7. May the Trip.com wordmark appear on our booking buttons, and which asset should we use?

Attached: support-bulk-request.csv (106 rows: destination URL, type, Trip.com ID, name; last column for the generated link).

Thank you.

## How the returned links are imported (no hand-editing)

Paste each returned link, exactly as received, into `affiliate_url` of `data/tripcom/link-worksheet.csv` (matching row), set `generation_method` to `support-bulk`, then run
`node scripts/tripcom/worksheet.js import`. The importer stores the exact string, its SHA-256, the date and method, checks host/path/parameters against the learned profile and that the destination ID in the path equals the row's Trip.com ID. Keep Trip.com's reply email as the provenance evidence.
