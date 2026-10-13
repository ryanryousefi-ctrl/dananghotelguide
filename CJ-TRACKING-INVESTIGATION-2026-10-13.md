# CJ Tracking Investigation — October 13, 2026

**Trigger:** CJ dashboard shows 0 clicks / 0 actions / $0 for Oct 1–13, 2026, one week after the Oct 6 static-link fix (`CJ-STATIC-LINK-FIX.md`).

**Bottom line:** CJ's click server is working for this account right now. A test click on Oct 13 produced a fresh `cjevent`, and Booking.com received `label=affnetcj-17293132_pub-8008393_site-101820678_...`. So the Oct 6 link format was not the reason the dashboard shows zero. This pass found and fixed three problems the Oct 6 audit missed. Two of them sent bookings to Booking.com with no CJ tracking at all. The third stopped CJ's page script from loading on every page. What can't be checked from here is the CJ dashboard itself: the filter, the selected property, and whether clicks are counted or rejected. That needs the account owner (Section 4).

---

## 1. What was verified working (evidence, Oct 13)

| Check | Result |
|---|---|
| `kqzyfj.com/click-101820678-17293132?sid=…&url=…` | 302 → `cj.dotomi.com` → `emjcd.com` → `booking.com` |
| CJ ownership stamped on Booking.com landing | `aid=8133101&label=affnetcj-17293132_pub-8008393_site-101820678_pname-DaNang+Hotel+Guide_clkid-<sid>_cjevent-<id>` |
| Referring page recorded by CJ | Yes. Decoded from the `cj.dotomi.com` hop: `www.dananghotelguide.com/naman-retreat-da-nang.html` |
| Real Chrome click on live CTAs (EN hotel review, EN roundup, KR roundup) | New tab, href unchanged before/after click, full CJ chain, Booking.com sets `bkng` cookie |
| SID survival | 70-char SID (longest on site) arrives intact as `clkid-…` |
| Advertiser relationship | Active at the click-server level. An inactive or declined relationship would not hand back a Booking.com `affnetcj` label for this publisher/site. *Dashboard confirmation still required (Section 4).* |

Test clicks made on Oct 13, so they can be looked for in CJ: SIDs `diag-test-20261013`, `da-nang-hotels-directory-intercontinental-danang-sun-peninsula-resort`, `naman-retreat-da-nang`, `best-hotels-in-da-nang` (×2, EN + KR). They came from automated Chrome and curl, so CJ may filter them as non-human. If none show up, that alone proves nothing.

## 2. Defects found and fixed in this pass

### 2a. Homepage "Find Hotel Deals" widget — untracked since Aug 14 (CRITICAL)
`index.html` `#bkSearchBtn` built a raw `booking.com/searchresults…&aid=1784897` URL and passed it to `window.open()`. It never went through CJ, and `aid=1784897` earns nothing on its own. It was added Aug 14 (`3884054`). The Oct 6 audit missed it because the URL was built in a variable, not written as a literal inside `window.open(...)`. **Fixed:** the destination (with dates) is now wrapped in the CJ click URL, `sid=homepage--booking-widget`.

### 2b. Hotel directory card view and map popups — untracked (HIGH)
`da-nang-hotel-directory.html` renders its mobile card view and map-pin popups from `window.DHD_HOTELS[].b`. That field held 78 raw `booking.com/hotel/...?aid=1784897` URLs. Only the server-rendered table rows were wrapped on Oct 6. **Fixed:** all 78 `b` values are now CJ URLs, using the same SIDs as the table rows. No other field changed (verified by parsing old and new JSON).

### 2c. CJ page script blocked on every page (HIGH for reporting, not for clicks)
`https://www.anrdoezrs.net/am/101820678/include/allCj/impressions/page/am.js` now **302s to plain `http://www.yceml.net/...`**. Chrome blocks this as mixed content (console: *"requested an insecure script … This request has been blocked"*). The impression-only URL CJ's dashboard currently generates, `anrdoezrs.net/am/101820678/impressions/page/am.js`, has the same fault. Result: CJ's page-impression beacon was not firing on any page. If dashboard figures were partly impression-driven, this alone could zero them. **Fixed:** all 231 pages now load `https://www.yceml.net/am_gen/101820678/impressions/page/am.js` directly (same CJ code, 2.8 KB, impression-only, which matches the dashboard setting "Deep Link Automation off / Page-Based Impression Reporting on"). Verified in a browser: script loads over HTTPS and the `origin.cjtrack.me/pageImpression` beacon fires. **Report the anrdoezrs → http redirect to CJ support.**

### 2d. Dead Booking.com hotel slugs (MEDIUM — conversion, not attribution)
Of 124 distinct hotel destinations, 112 resolve, 4 redirect to the correct renamed property, and 8 land on a generic city page. Fixed 3 with confirmed replacements:
- `golden-lotus-grand-da-nang` → `golden-lotus-grand-ngu-hanh-son`
- `wyndham-soleil-da-nang` → `wyndham-soleil-danang`
- `royal-hoi-an-mgallery-collection` → `searchresults…?dest_id=12887663&dest_type=hotel` (Booking lists it as "HOTEL ROYAL HOI AN, The Legacy by the River". The slug could not be confirmed, so this links by property ID)

**Not changed (editorial decision needed):** Fusion Suites Da Nang (7 links, has its own review page), Rom Casa Hostel, Sunset Sea Son Tra, Bantique, Raon Danang Beach. None are on Booking.com any more. Their links still go through CJ and land on the Da Nang city page.

### 2e. Smaller changes
- `bk-widget.js` and homepage `window.open` now use `noopener` (not `noreferrer`), so CJ receives the referring page.
- Dead-code homepage handlers (`handleBookingWidgetSubmit` / `handleNbwSubmit`, not wired to any form) wrapped in CJ anyway.
- `scripts/audit-cj-affiliate.js` now also fails on raw booking.com URL literals in JS/JSON/variables (unless wrapped in a CJ builder), on any `anrdoezrs.net/am/` script, and scans first-party `.js` files. Regression-tested against the pre-fix files: it flags all 80 old untracked paths and does not flag the correctly wrapped `bk-widget.js`.
- New `scripts/audit-cj-live.js` crawls production (sitemap plus internal links) and exits non-zero on any issue.
- `CLAUDE.md` affiliate section rewritten. It described the DLA setup and told future edits to use raw `aid=1784897` links.

## 3. Full production audit (pre-deploy baseline, Oct 13)

- 202 sitemap URLs + internal-link discovery → 216 URLs, 203 live pages. 13 discovered URLs 404, all internal links from KR-themed content to pages that don't exist at root (not booking paths).
- 1,534 CJ links. 0 wrong website/link IDs, 0 missing SIDs, 0 non-Booking destinations, 0 double-wrapped, 0 `aid` in destinations, 0 Awin remnants, 0 raw booking.com hrefs.
- Raw booking.com strings outside hrefs: 171 inert `data-booking-url` attributes (no code reads them), 78 directory JSON fields (2b), and the homepage widget (2a).
- First-party scripts: only `bk-widget.js` builds booking URLs, and it is correctly wrapped.

## 4. What only the account owner can check in CJ (not verifiable from here)

Do these in order. Each one rules out a cause.

1. **Account identity.** Top-right of CJ Account Manager should show publisher CID **8008393**. Booking.com's label on our clicks says `pub-8008393_site-101820678`. If you are logged into a different CID, you are looking at the wrong account.
2. **"1 Active Filter".** Open it and clear it. Then set: Website = *DaNang Hotel Guide (101820678)* or "All", Advertiser = *Booking.com North America (7864295)* or "All", date = Oct 1–13, report by **posting/event date**, and choose **Gross**, not Net. Net can show $0 until actions lock.
3. **Report type.** Use *Reports → Performance* (or *Publisher Performance by Link*, filtered to Link ID **17293132**). Do not rely on the Automated Monetization / Deep Link Automation dashboard. Static Evergreen-link clicks may not appear there at all.
4. **Link 17293132.** *Advertisers → Booking.com North America → Links*. Confirm 17293132 exists, is active, and allows deep linking. Use *Get HTML* on it and compare with `https://www.kqzyfj.com/click-101820678-17293132`.
5. **Relationship.** *Advertisers → My Advertisers*. Booking.com North America should be **Joined/Active**, not Pending, Declined, or Inactive. Check the program terms for geo or device restrictions. Our audience is mostly VN, AU, US, SG, UK and KR (GSC).
6. **Last recorded click.** Run *Performance by day* for Aug 1 – Oct 13 and note the last date with clicks. Send it back, and it can be lined up against the deploy timeline below.
7. **Ask CJ support:** (a) why `anrdoezrs.net/am/101820678/.../am.js` redirects to `http://`; (b) whether clicks on Evergreen link 17293132 from site 101820678 are being recorded or rejected for Oct 1–13; (c) whether Booking.com North America has tracking or crediting restrictions on non-US traffic.

## 5. Volume reality check

GSC (May–Aug export in `_data/gsc`) shows about **10–20 Google clicks/day** in late July–August, mostly to informational pages. At a typical 2–5% visitor-to-Booking.com click-through, that is **roughly 2–7 real affiliate clicks per week**. The "251 CJ clicks Aug 12–Oct 6" figure in the Oct 6 audit would mean about 30% of all organic visitors clicking out, which is implausible. So that figure probably was not all real human booking clicks (impressions, bot clicks or test traffic). A real week with 0–3 clicks is within normal range at this traffic level. Treat the dashboard zero as *"unverified, check Section 4"*, not automatically as *"tracking broken."* Cross-check against GA4 events `booking_click`, `homepage_booking_widget_click` and `sitewide_booking_widget_click` for the same dates. They show how many real outbound clicks happened.

## 6. Deploy timeline relevant to CJ

| Date | Commit | Change |
|---|---|---|
| Jul 10–13 | `ea036f6` / `ee0bc3f` | AWIN → CJ DLA script, raw booking.com hrefs |
| Aug 10 | `b96a20b` | DLA script removed sitewide |
| Aug 13 | `ab76b7f` | DLA script re-added |
| Aug 14 | `3884054` | Homepage widget added, **untracked** (fixed now) |
| Oct 6 | `774924e`, `8e33e86`, `76b12ce` | Static CJ links sitewide |
| unknown | (CJ-side) | anrdoezrs am.js starts redirecting to http, so the page script is blocked |
| Oct 13 | this commit | 2a–2e above |
