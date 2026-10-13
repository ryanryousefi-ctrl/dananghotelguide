# CJ Tracking: Final Resolution Report

**Date:** October 13, 2026
**Supersedes the open questions in:** `CJ-TRACKING-INVESTIGATION-2026-10-13.md`, `CJ-STATIC-LINK-FIX.md`, `FORENSIC-AFFILIATE-AUDIT.md`

**Status key**
- **RESOLVED**: independently confirmed.
- **VERIFIED WORKING**: observed working technically.
- **PENDING CJ CONFIRMATION**: needs evidence from the CJ account or the advertiser.
- **BUSINESS OPTIMIZATION**: revenue work, not a tracking failure.

---

## 1. Summary

The "zero clicks" report was caused by looking at the **wrong CJ publisher account**. It was not a tracking failure. Under the correct account, **CID 8008393**, CJ reports **97 clicks, 0 actions, $0** for Oct 1–13, 2026. That CID matches the `pub-8008393_site-101820678` stamp that Booking.com receives on every production click.

Tracking from the site through CJ to Booking.com is working. Whether CJ will record a commission when a visitor books and stays has **not** been proven, because no booking has happened yet. Given the traffic volume and the share of test clicks in the 97 (Section 4), zero bookings so far is not statistically surprising.

## 2. Reconciliation of the evidence

| # | Claim | Evidence | Status |
|---|---|---|---|
| 1 | Production links use property 101820678 | `audit-cj-live.js` after deploy: 203 live pages, **1,614** CJ links, all `kqzyfj.com/click-101820678-17293132`, 0 wrong IDs | RESOLVED |
| 2 | CJ redirect chain identifies CID 8008393 | Real-Chrome clicks (desktop and mobile, EN and KR) land on Booking.com with `label=affnetcj-17293132_pub-8008393_site-101820678_…_cjevent-…` | RESOLVED |
| 3 | 97 clicks reported under CID 8008393 | Screenshot 2026-10-13 2:57 PM: Program Overview, Accounts filter = "DaNang Hotel Guide (8008393)", Oct 1–13, Net (After corrections): Clicks 97, Actions 0, Commissions $0 | RESOLVED (as reported by CJ) |
| 4 | The earlier zero came from a different account | Screenshot 2026-10-13 2:20 PM: same view, Accounts filter = "Da Nang Hotel Guide (79770…)": Clicks 0. The "1 Active Filter" in both is the account selector. | RESOLVED |
| 5 | Oct 13 repairs still live | `2198192` and `91b9401` are on `main`. Production browser tests pass (homepage widget, directory cards and popups, bk-widget, secure CJ script, impression beacon) | VERIFIED WORKING |

**Revised root-cause assessment for the dashboard zero:** account selection in the CJ UI. The website was not the cause.

The site-side defects fixed earlier were still real:
- the homepage widget had been untracked since Aug 14;
- the directory cards and map popups were untracked;
- the CJ page script was blocked as mixed content.

Each cost tracked clicks. None of them explains a zero under the correct account.

**Caveat on the "251 clicks" in `FORENSIC-AFFILIATE-AUDIT.md`:** that figure was likely read from the same wrong account, or from a different date range. It should not be used as a baseline.

## 3. Production health after commits `2198192`, `91b9401`, `a80cf93`

| Check | Result | Status |
|---|---|---|
| Coverage | Sitemap (202) plus internal-link discovery gives 216 URLs; 203 live pages crawled | VERIFIED WORKING |
| Every commercial path wrapped | 1,614 CJ links. 0 raw booking.com hrefs, 0 raw URL literals in JS or JSON, 0 unwrapped `window.open` | VERIFIED WORKING |
| Homepage widgets | `#bkSearchBtn` opens `kqzyfj…?sid=homepage--booking-widget&url=<search with dates>`; no `aid` | VERIFIED WORKING |
| Directory mobile cards and map popups | All 78 `DHD_HOTELS[].b` entries are CJ links; rendered card and popup links all CJ | VERIFIED WORKING |
| Korean pages | 22 KR pages, 112 CJ links; real click lands with the CJ label and `lang=ko` | VERIFIED WORKING |
| Date-picker (`bk-widget.js`, 179 pages) | Dated search URL wrapped before `window.open`, `noopener` (referrer kept) | VERIFIED WORKING |
| CJ page-impression script | `https://www.yceml.net/am_gen/101820678/impressions/page/am.js` loads, beacon fires, no mixed-content error | VERIFIED WORKING |
| Awin remnants / wrong IDs / double-wrapping / `aid` in destinations | 0 / 0 / 0 / 0 | VERIFIED WORKING |
| Regression guard | `audit-cj-affiliate.js` (local) and `audit-cj-live.js` (production) both pass | VERIFIED WORKING |
| CJ's `anrdoezrs.net` script URL redirects to `http://` | Worked around. Still a CJ-side defect worth reporting | PENDING CJ CONFIRMATION |

## 4. The 97 clicks: what is known and what isn't

**Known from the screenshot:** 97 clicks in the Oct 1–13 window. The chart shows clicks on most days, starting Oct 1, so not only after the Oct 6 fix. CJ reports 0 actions.

**Not known (not visible in the screenshot, and not invented here):**
- how many belong to Booking.com North America;
- how many came from Link ID 17293132;
- the daily counts, and the split before Oct 6 / Oct 6–12 / Oct 13;
- device and country mix.

**Likely test-traffic contamination.** These automated clicks went through real CJ links:
- **Oct 6:** about 110 documented in `CJ-STATIC-LINK-FIX.md` (§8: 20, §9: 20, §10: 50, §16: 20 plus a widget click).
- **Oct 13:** about 8 from this investigation, with SIDs `diag-test-20261013`, `naman-retreat-da-nang`, `best-hotels-in-da-nang`, and `da-nang-hotels-directory-intercontinental-danang-sun-peninsula-resort`.

CJ may or may not filter automated Chrome. If CJ counted the Oct 6 tests, a large share of the 97 is our own traffic. **A spike on Oct 6 in the daily breakdown would confirm this.**

### Exact export instructions (CJ Account Manager, account 8008393)
1. **Reports → Program Analysis → Program Overview**. Accounts filter = *DaNang Hotel Guide (8008393)* only.
2. Date range **Oct 1 – Oct 13, 2026**. Report Type: run once as **Net (After corrections)** and once as **Gross**. Gross shows actions before corrections and locking.
3. In the filter panel:
   - **Partners** → select *Booking.com North America* → Apply → note the click count. Then select all partners except Booking.com and note that count.
   - **Link IDs** → *17293132* → Apply → note the count.
   - **Property IDs** → *101820678* → Apply → note the count.
4. Open **Performance** (left menu, under Program Analysis). Set the time grain to **day**, then use the download icon (top right) to export CSV. Repeat with the breakdown set to **Device Types** and to **Countries/Regions**.
5. If the Clicks tile offers **Expand**, use it on the 97 to see the daily series.
6. Bring back: the daily clicks CSV, and the click totals per partner, per link ID, and per property ID.

| Question | Status |
|---|---|
| Daily split and share that is test traffic | PENDING CJ CONFIRMATION (export above) |
| Clicks credited to property 101820678 / link 17293132 | PENDING CJ CONFIRMATION. Every production link uses both, so a mismatch would itself be a finding. |

## 5. Zero conversions: program terms

**What could be verified, and what could not:**
- **CJ-specific program terms for Booking.com North America (advertiser 7864295) could not be read from here.** They are behind the CJ login. Open them at **Advertisers → (search) Booking.com North America → Program Terms / "View Terms"** and record:
  - the commission rate;
  - the action type (stay vs booking);
  - the locking date;
  - cookie / referral period;
  - geographic or device restrictions;
  - the deep-linking policy.
- Booking.com's own affiliate help-centre pages (the direct Affiliate Partner Programme, *not* the CJ terms) could not be rendered here. The search summaries of those pages say:
  - commission is paid only on **"stayed"** reservations;
  - **cancelled, no-show and fraudulent bookings are not eligible**;
  - status can update **up to 60 days after check-out**.

  Third-party sources describe the CJ and Awin programs as up to ~4% on completed stays with a short (possibly session-based) attribution window. The sources conflict, so **treat all of this as unverified until the CJ terms are read.**

**Implications that hold whatever the exact terms:**
1. **Timing.** If commission is earned on completed stays (Booking.com's stated model), a booking made in October for a December stay cannot become a commission before late December, and may lock up to 60 days after that. **Zero commissions within 7 days of the fix is expected under that model, even with working tracking.** Check whether CJ shows *pending* actions in Gross reporting. Booking.com may post an action at booking time and correct it later. This is unverified.
2. **Short attribution window.** If attribution is session-based, the visitor has to book in the same browsing session. Visitors who click to "check prices" and return days later through Google or the Booking.com app will not be credited. That is a business reality, not a tracking failure.
3. **Cookies and privacy.** The click is a first-party, top-level navigation to booking.com, and Booking.com sets its own `bkng` cookie on landing (observed). Safari ITP and third-party-cookie blocking do not block this pattern. Clearing cookies, private windows, and switching to the app or another device would break attribution.
4. **Hotel vs search deep links.** Both go through the same CJ link and carry the same `label`, so attribution is the same (observed). Whether the CJ terms treat them differently is PENDING.
5. **International visitors, Vietnam hotels.** Nothing observed blocks this. Booking.com accepted the CJ label for Vietnamese properties and served Korean-language search. Whether "North America" in the program name restricts *where visitors come from* (our audience is mostly VN, AU, US, SG, UK and KR) is the single most important term to read. PENDING CJ CONFIRMATION.
6. **Account standing and payment.** Not verifiable from here. In CJ, check **Account → Payment settings** (payment method, tax form complete) and the inbox for compliance notices. PENDING.

## 6. First-party analytics (GA4 `G-0T1H4G2N80`)

**Before today:**
- 20 live booking pages had **no GA4 tag** (including `hoi-an.html`, `best-hotels-in-hoi-an.html`, `hoi-an-old-town-hotels.html` and the itineraries).
- `booking_click` loaded on only 103 pages.
- Only links carrying `data-cta-location` were tracked: 624 of 1,399.
- JavaScript-rendered links were never tracked.
- `best-hotels-in-da-nang.html` had an inline duplicate handler.

**Fixed (`a80cf93`):**
- `booking-cta-tracking.js` is now one delegated listener on every CJ link, covering JavaScript-rendered and untagged links, with no href changes.
- Each event carries `cta_location` (or `untagged`), `hotel_name`, `page`, **`link_sid`** (the same SID CJ receives) and `dest_type` (hotel or search).
- The tracker now loads on all 202 live booking pages, including KR. The duplicate handler is removed, and the GA4 tag was added to the 20 untagged pages.

**Verified on production (desktop and mobile):** exactly one `booking_click` per click on:
- the homepage;
- best-hotels (the former duplicate);
- directory cards;
- Hoi An (newly tagged);
- a KR page;
- the hotels map.

`homepage_booking_widget_click` and `sitewide_booking_widget_click` each fire once, with no double `booking_click`.

**Status:** VERIFIED WORKING.

Note: the verification sent a few automated test events to GA4 on Oct 13.

**How to use it:**
- GA4 → Reports → Engagement → Events → `booking_click`. Register `link_sid`, `cta_location` and `dest_type` as custom dimensions (Admin → Custom definitions) so they can be broken out.
- Compare weekly with CJ clicks. Differences of roughly 10–30% in either direction are normal: ad blockers suppress GA4, and CJ filters invalid clicks. A gap of several times would warrant a CJ ticket.

**Privacy:** no new identifiers or cookies are added; it uses the same GA4 property and config the site already used. The site has **no consent banner / Consent Mode**. Since the site runs AdSense and receives EU/UK traffic, a Google-certified CMP is a separate compliance item. BUSINESS OPTIMIZATION (compliance).

## 7. Conversion expectations (illustrative, not benchmarks)

**Probability of zero bookings from *n* human clicks at an assumed click→booking rate *p***:

| n human clicks | p = 0.5% | p = 1% | p = 2% | p = 4% |
|---|---|---|---|---|
| 10 | 95% | 90% | 82% | 67% |
| 25 | 88% | 78% | 60% | 36% |
| 50 | 78% | 61% | 36% | 13% |
| 97 | 62% | 38% | 14% | 2% |

**Human clicks needed for a 50% / 90% chance of at least one booking:**
- p = 0.5%: 139 / 460
- p = 1%: 69 / 230
- p = 2%: 35 / 114
- p = 4%: 17 / 57

The *p* values are assumptions chosen to bracket a range. They are not measured, and no published benchmark is implied.

**Reading:**
- Even if all 97 were human, zero bookings is unremarkable unless the true rate is about 4% or higher.
- If most of the 97 were test clicks, the human sample is small enough that zero tells us almost nothing.
- Commissions on completed stays also lag by the length of the stay plus the processing time.

**Expected volume (assumptions):** about 10–20 Google visits/day (GSC export, late Jul–early Aug) × an assumed 2–5% CTA click-through gives **roughly 6–30 human outbound clicks/month**. At p = 1–2% that means a first booking in roughly **2–6 months** at current traffic. $100/month at an unverified ~4% of booking value needs a few thousand dollars of stayed bookings per month. That is **at least an order of magnitude more qualified traffic than the site has today**.

## 8. Unavailable hotel properties (editorial recommendations, no changes made)

All five still route through CJ but land on a generic Booking.com city page. None was found on Booking.com by name (autocomplete, Oct 13).

| Hotel | Where it appears | Recommendation |
|---|---|---|
| **Fusion Suites Da Nang** | Own review page `fusion-suites-da-nang.html` (in the sitemap; the old `review-…` URL 308s to it), `hotel-reviews.html`, `best-beach-hotel-under-100-da-nang.html`, directory, map, `kr/boutique-hotels-da-nang.html` | A Vietnamese travel site lists an "Abogo Fusion Suite BeachFront Da Nang" with the same contact details, so it may have been rebranded. This is unconfirmed. Confirm it operates. If yes, keep the review but change the CTA to "Not currently bookable on Booking.com — check the hotel directly" (official site, `rel="nofollow"`), and add a nearby alternative with a live Booking.com link. Remove it from the roundups and the map until it's bookable. If it has closed, add a "Closed" banner and 301 the page to `best-hotels-near-my-khe-beach.html`. |
| **Rom Casa Hostel** | `best-budget-hotels-in-da-nang.html`, directory | Replace it in the budget list with a currently listed property. Drop it from the directory or mark it "Not on Booking.com". |
| **Sunset Sea (Son Tra)** | `best-budget-hotels-in-da-nang.html`, directory | Same as Rom Casa. |
| **Bantique Hotel** | `best-budget-hotels-in-da-nang.html`, directory | Same as Rom Casa. |
| **Raon Danang Beach** | `da-nang-guide-for-russian-travelers.html`, directory | Swap it for a comparable listed hotel in the Russian-traveler guide. |

All are **BUSINESS OPTIMIZATION**: they affect conversion, not attribution. `best-budget-hotels-in-da-nang.html` carries three of the five, so it is the first page to fix.

## 9. Issue register

| Issue | Status |
|---|---|
| Dashboard showed 0 clicks | **RESOLVED**: wrong CJ account selected (79770… vs 8008393) |
| JS click-rewrite race (DLA) | **RESOLVED** (Oct 6): static CJ links |
| Homepage widget untracked since Aug 14 | **RESOLVED** (`2198192`) |
| Directory cards and map popups untracked | **RESOLVED** (`2198192`) |
| CJ page script blocked (mixed content) | **RESOLVED** on our side (`2198192`). CJ-side redirect bug remains, so report it. |
| 3 dead hotel slugs | **RESOLVED** (`2198192`) |
| GA4 coverage gaps / duplicate handler | **RESOLVED** (`a80cf93`) |
| Site → CJ → Booking.com attribution handoff | **VERIFIED WORKING** |
| 97 clicks: breakdown, test-traffic share | **PENDING CJ CONFIRMATION** (Section 4 export) |
| Commission recorded on a real stayed booking | **PENDING**: needs a real commissionable transaction or CJ confirmation |
| Program terms: geo, stay vs booking, window, locking | **PENDING CJ CONFIRMATION** (Section 5) |
| Account payment / compliance standing | **PENDING CJ CONFIRMATION** |
| 5 unavailable hotels | **BUSINESS OPTIMIZATION** (Section 8) |
| Consent management (AdSense, EU traffic) | **BUSINESS OPTIMIZATION** (compliance) |
| Traffic volume vs revenue goal | **BUSINESS OPTIMIZATION** (Section 10) |

## 10. Path to the first $100/month (in priority order)

1. **This week, in CJ (about 30 minutes):**
   - read the Booking.com North America program terms (Section 5) and do the click export (Section 4);
   - confirm payment settings;
   - open a CJ ticket about the `anrdoezrs.net` → `http://` redirect, and ask whether the program credits non-North-American visitors.

   If the program excludes our audience's countries, **that becomes the top revenue issue**. The fix would be a different Booking.com program/region, or Agoda, which is strong in Vietnam and Korea. Evaluate this before investing in traffic.
2. **Stop polluting the data.** No more automated test clicks through live CJ links. Future checks: `node scripts/audit-cj-live.js` (no clicks) and `node scripts/audit-cj-affiliate.js`.
3. **Fix unavailable hotels** (Section 8), starting with `best-budget-hotels-in-da-nang.html`.
4. **Grow qualified commercial traffic. This is the main lever.** The Oct 6 audit found the commercial pages ranking at positions 27–65 for "best hotels in da nang", "da nang luxury resort", "beachfront hotels da nang" and "where to stay in da nang". Moving even two of these onto page 1 matters more than any CTA tweak at the current volume.
5. **Then CTA work.** Once GA4 `booking_click` by `cta_location` has 4–6 weeks of data, move effort to the placements that actually get clicked.
6. **Review in 60–90 days.** By then GA4 human click counts, CJ clicks and any stayed bookings can be compared directly. A real gap between GA4 and CJ, or many human clicks with zero *pending* actions, would justify escalating attribution with CJ and Booking.com.

**Not recommended:** further rebuilding of the CJ link infrastructure. It is working and covered by automated audits.
