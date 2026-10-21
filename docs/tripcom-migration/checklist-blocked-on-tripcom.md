# Blocked on Trip.com's reply

These match the questions already sent to Trip.com affiliate support. Each
answer unblocks the step named.

| # | Question | Unblocks | Default if they don't answer |
|---|---|---|---|
| 1 | Bulk link generation (CSV, API) for Alliance 11013066 / SID 333523744? | Step 2: speed of generating 102 links | Use the dashboard generator with `data/tripcom/link-worksheet.csv` (~1.5–2 h) |
| 2 | Must every link come from the generator, or is a documented parameter format valid? What exact format do generated links have? | `lib.affiliateUrlProblems()` format check; the import step | Generator only. Adjust the check to the real format of the first generated link |
| 3 | Do date-less hotel links (`/hotels/detail/?hotelId=`) and city lists (`/hotels/list?city=`) track correctly? Is there a dated deep-link format for the widget? | Widget Mode 2 (dates); confidence in date-less links | Date-less links + widget Mode 1 |
| 4 | Is a first-party redirect allowed? | Not needed: the plan uses direct links | Direct links |
| 5 | Logo/brand guidelines for affiliates: may the wordmark appear on buttons, and is there an official asset? | Final logo file | Current trip.com header wordmark, replace when advised |
| 6 | Which domain must links use: www.trip.com or vn.trip.com (the VN program page says vn.trip.com)? | **Everything**: must be settled before generating any link | Don't generate links until answered |
| 7 | Attribution window (30-day web / 7-day app?) and app bookings after a web click | Disclosure and privacy wording; revenue expectations | Generic wording ("may earn a commission") |
| 8 | Sub-ID parameter (e.g. `trip_sub1`) for per-page/placement reporting, and may it be set in the generator? | Per-placement reporting in Trip.com (GA4 already covers clicks) | No sub-IDs; GA4 only |
| 9 | Which Da Nang Marriott listing is bookable/preferred: 993558 or 7362595? | One hotel (31 links) | 993558 (main resort) |
| 10 | Any required disclosure wording or placement? | Final disclosure text | Current rewritten wording |

## Owner decisions (not Trip.com)

- [ ] Hotels in `manual-verification.md` A–D: confirm, set a fallback, or remove the button.
- [ ] Widget mode: 1 (link, recommended now), 2 (dated, if Trip.com allows) or 3 (official search box).
- [ ] Privacy, terms and about wording for Trip.com.
- [ ] When to deploy, and keeping CJ active (do not close it) until Trip.com commissions confirm.

## Then

`worksheet.js import` → `apply.js` (dry run, 0 blocked) → `apply.js --write` →
editorial pass → `validate.js` (static, `--render --ga`, `--destinations`) all
green → owner deploys. See README "Cutover runbook".
