# Affiliate Revenue Growth Roadmap — Da Nang Hotel Guide

**Date:** October 13, 2026
**Builds on:** `CJ-TRACKING-RESOLUTION-FINAL.md`, `CJ-TRACKING-INVESTIGATION-2026-10-13.md`, `CJ-STATIC-LINK-FIX.md`, `FORENSIC-AFFILIATE-AUDIT.md`

**Evidence labels**
- **[Verified]**: observed directly or read from an official source.
- **[Third-party]**: secondary sources; may conflict.
- **[Assumption]**: an illustrative input, not a measured fact.
- **[Owner]**: needs the account owner to retrieve or decide.

---

## 1. Current verified tracking status

| Item | Status |
|---|---|
| Publisher CID / property / advertiser / link | 8008393 / 101820678 / 7864295 (Booking.com North America) / 17293132 **[Verified]** |
| Site → CJ → Booking.com handoff | Working on desktop, mobile and KR; `label=affnetcj-17293132_pub-8008393_site-101820678_…` on landing **[Verified]** |
| CJ reporting, Oct 1–13 | 97 clicks / 0 actions / $0, from the owner's screenshot. Test clicks are probably included (see `CJ-TRACKING-RESOLUTION-FINAL.md` §4) **[Verified as reported]** |
| Production affiliate audit after this work | 203 live pages, **1,591** CJ links, 0 issues, 0 broken internal URLs **[Verified]** |
| Change in link count | 1,614 → 1,591 (−23). These are the deliberately removed CTAs for the five hotels Booking.com no longer lists (§3). |
| GA4 `booking_click` and widget events | One event per click, desktop and mobile, on production **[Verified]** |
| Commission attribution on a real stayed booking | Not yet observable **[Owner / time]** |

## 2. Booking.com program eligibility

### What the official sources say **[Verified, Oct 13 2026]**
- **Booking.com's own affiliate page** (booking.com/affiliate-program/v2) says to *"Select your region and complete your registration with CJ."* All registration goes through CJ.
- **CJ's Booking.com publisher page** (cj.com/en-gb/publisher/partners/booking.com) lists separate regional programmes: **North America (USA and Canada)**, United Kingdom, Brazil, **APAC (India, Thailand, New Zealand and more)**, **Australia**, BENELUX, CEE, DACH, MEA, France, Italy, LATAM, Nordics, and Spain & Portugal. Its instruction: *"Pick the region that matches where most of your primary audience is located."*
- **CJ's FAQ on that page:**
  - **Attribution window:** *"Programme is session based. This means you earn commission if a user completes a booking in the initial browser after clicking your affiliate link."*
  - **Commission:** *"starts at 4% for completed accommodation stays … The exact commission rate may vary based on your performance and the volume of bookings you generate."*
  - **App:** *"Booking.com has the capability to track mobile app purchases."* This doesn't say app bookings from a web click are credited to the affiliate.
  - **Eligibility:** an active website is required. Social-only publishers are not accepted, and voucher-code claims lead to removal.

### What this means for us
1. **Audience mismatch.** GSC country data (May–Aug 2026, 621 clicks) breaks down as:
   - North America (US + CA): **17%** of clicks, 34% of impressions.
   - APAC excluding Australia: **47%**.
   - Australia: **14%**.
   - UK: 7%.
   - Other regions (mostly Europe): 15%.

   By CJ's own selection rule, **APAC** is the best match, not North America. The CJ page **does not say** whether the North America programme refuses to credit bookings from visitors elsewhere. The programme name alone isn't proof of a geographic restriction.
2. **Vietnam hotels:** nothing found limits *where the hotel is*. Booking.com accepts our CJ label on Vietnamese properties (observed). Whether the North America programme terms restrict traveller location is **[Owner]**.
3. **Session attribution.** The booking must finish in the same browser session. Visitors who leave to "think about it", come back later through Google, or switch to the app likely earn nothing. This is the biggest structural limit on conversion from a research-heavy guide site.
4. **Commission timing:** paid on *completed* stays, so bookings show up as commission only after check-out.
5. **Hotel vs search links:** the CJ FAQ explicitly endorses destination-level and hotel deep links. Both carry the same attribution label (observed).

### What you need to retrieve from CJ **[Owner]**
1. **Advertisers → Booking.com North America → Program Terms.** Copy:
   - every commission line;
   - the referral period;
   - any traffic or geo restriction ("valid traffic", "consumer location");
   - the "locking" period;
   - the action types.
2. **Same screen for the APAC and Australia programmes** (search "Booking.com" under Advertisers → Find Advertisers). Note whether you can apply to more than one region and whether they allow running alongside.
3. **Account → Payment info / tax forms:** confirm complete. **Account → Messages:** any compliance notices.
4. **Reports:** the daily breakdown of the 97 clicks (instructions in `CJ-TRACKING-RESOLUTION-FINAL.md` §4).

### Alternatives (comparison; no changes made)

| | Booking.com NA (current) | Booking.com APAC (CJ) | Agoda Partners |
|---|---|---|---|
| Fits our audience (by the network's own rule) | Weak (17% NA) | Strong (47% APAC + region) | Strong in VN / KR / SEA **[Third-party]** |
| Commission | from 4% of completed stays **[Verified CJ FAQ]** | Same FAQ, so presumably the same **[Owner: confirm]** | 4–7% tiered, or flat 5% **[Third-party, conflicting]** |
| Attribution | Session **[Verified]** | Session (same FAQ) | 1 day / session **[Third-party]** |
| Validation and payout | After completed stay | Same | ~60-day validation after checkout, $50–200 threshold **[Third-party]** |
| Tracking work for us | None | New link ID; one run of `apply-cj-static-links.js` with the new ID | New network, new link format, new audit rules |

**Recommendation (needs your approval):**
1. Read the North America terms first.
2. If they restrict or don't mention non-NA visitors, apply to **Booking.com APAC on CJ** and ask CJ support (Booking.com programme manager) which programme should carry a site whose audience is mostly APAC and Australia. Switching is a link-ID change, which the existing tooling can do in minutes once approved.
3. Evaluate **Agoda** as a *second* programme only after reading its official terms at partners.agoda.com. Running both doubles the maintenance, so do it only if Booking.com conversion stays at zero after the programme question is settled.

## 3. Hotel listing corrections (commit `c36e42f`)

Each hotel was checked by name in Booking.com's own autocomplete (none found) and by web search for current listings elsewhere.

| Hotel | Finding | Change |
|---|---|---|
| Fusion Suites Da Nang | Still listed on Hotels.com and other sites; **not on Booking.com**. A possible "Abogo Fusion Suite" rebrand is **unconfirmed**: Abogo also runs a different Fusion-branded property. | Review page kept. Its "Check Your Dates" CTA is now a factual availability note pointing to the comparisons below. CTAs removed on the reviews index, map popup, directory, under-$100 guide and KR boutique page. |
| Rom Casa Hostel | Listed on Hostelworld, Kayak and Cloudbeds; not on Booking.com | Card kept; CTA replaced with "Not currently listed on Booking.com" |
| Sunset Sea Hotel (16 Loseby) | Listed on Expedia, Trip.com and Travelocity; not on Booking.com | Same |
| Bantique Hotel | Listed on Hotels.com, Kayak and Traveloka; not on Booking.com | Same |
| Raon Danang Beach Hotel | Listed on Hotels.com, Kayak and Skyscanner; not on Booking.com | Same (Russian-traveller guide and directory) |

- No URLs were deleted or redirected, and no hotels were added. Replacements need verified details and real photography, which I don't have.
- **Recommended next:** pick 2–3 bookable budget replacements you've personally seen or stayed at, with your own photos, for `best-budget-hotels-in-da-nang.html`. **Every card on that page uses the same generic coastline image.** That hurts both trust and click-through.

## 4. Commercial SEO findings and improvements

**Data source:** the only GSC data available here is `_data/gsc` (May 6 – Aug 5, 2026). **[Owner]** Export a fresh last-3-months report: Pages, Queries, and a Page × Query breakdown for the pages below.

**The headline problem:** hotel-intent queries got **14,221 impressions and 8 clicks** in three months. The core commercial terms sit at positions **27–46**:

| Query | Impressions | Position |
|---|---|---|
| da nang cheap hotels | 436 | 39.5 |
| da nang hotels | 418 | 30.8 |
| da nang luxury resort | 282 | 32.8 |
| best family resort da nang | 274 | 40.3 |
| best hotels in da nang | 253 | 30.9 |
| where to stay in da nang | 239 | 44.4 |

Page-level averages are better: best-hotels 11.9, where-to-stay 17.9 and family 20.8. Those pages rank well for long-tail queries and poorly for the head terms.

**The five pages with the most near-term upside:**

| Page | Impr | Pos | Why |
|---|---|---|---|
| `luxury-hotels-da-nang.html` | 5,532 | 26.6 | Largest commercial impression base; highest booking values |
| `best-hotels-in-da-nang.html` | 1,699 | 11.9 | Closest to page 1; broadest intent; 40 CJ links |
| `where-to-stay-in-da-nang.html` | 2,442 | 17.9 | High intent; hotels were buried (fixed, §5) |
| `family-hotels-da-nang.html` | 2,278 | 20.8 | Strong family demand; splits signals with `best-family-resort-da-nang.html` (pos 12.3) |
| `where-to-stay-in-hoi-an.html` + `best-hotels-in-hoi-an.html` | 2,084 / 917 | 17.0 / 51.4 | The Hoi An hotel page is thin (624 words) |

**Technical checks (12 commercial pages):**
- titles 50–74 characters;
- one H1 each;
- canonicals correct;
- **all JSON-LD valid**;
- no horizontal overflow at 390px on any of the 202 booking pages.

`best-budget-hotels-in-da-nang`, `best-hotels-near-my-khe-beach` and `best-family-resort-da-nang` had very few internal links: 9, 8 and 2 pages respectively, versus about 207 for the nav-linked pages.

**Implemented (small, evidence-based):**
- `luxury-hotels-da-nang.html`: title, OG title, H1 and schema headline changed to "Best Luxury Resorts & Hotels in Da Nang 2026". "Luxury resort(s)" queries total about 700 impressions in the export, against about 200 for "luxury hotels".
- New contextual links:
  - `my-khe-beach-da-nang` → `best-hotels-near-my-khe-beach`
  - `da-nang-hotel-prices` (3,450 impr, pos 7.9) → `best-budget-hotels-in-da-nang`
  - `da-nang-hotel-prices-by-month` → `best-budget-hotels-in-da-nang`

**Recommended (needs your decision):**
- **Family cannibalisation:** merge `best-family-resort-da-nang.html` into `family-hotels-da-nang.html` (301) or clearly separate their intents. This deletes an established URL, so it needs your approval.
- **Hoi An:** expand `best-hotels-in-hoi-an.html` with first-hand material only (who each hotel suits, location trade-offs, real photos). Don't pad it.
- **Bare domain redirect:** `dananghotelguide.com` → `www` returns **307 (temporary)**. In Vercel → Domains, make the apex redirect permanent (308).
- Re-check positions in 4–6 weeks against the fresh GSC export before any further title changes.

## 5. Conversion findings

**Measured on the money pages:**
- On desktop, the first content booking CTA appears within 1–2 screens.
- On mobile it's within 1.6–2.4 screens for luxury, best-hotels, family and beach.
- **Exception: `where-to-stay-in-da-nang.html`.** The first hotel link was at **screen 19.6 of 39** on mobile.
  - **Fixed:** "Jump to hotel picks by area" near the top, a "Hotel picks in {area} ↓" link in each area card, and anchors on the hotel groups. No new content.
- **Nav "Search Stays" button:** on screens under 1100px it shows only a small house icon, which reads as "Home", and it had no accessible name.
  - **Fixed:** aria-label on 230 pages.
  - **Recommended:** a visible short label ("Hotels") or a bed icon on mobile. This changes the header layout, so test before shipping.
- **`best-hotels-in-hoi-an.html`:** 12–13 booking links under 32px tall on mobile (small tap targets), and the hero date widget is clipped on the right at phone width.
- **Biggest informational pages have no hotel path:**
  - `da-nang-weather-by-month` (15.8K impr): first booking link about 26 screens down.
  - `da-nang-budget-guide` (11.6K impr): no hotel links.

  One honest contextual block on each, such as "Where to stay on a budget" pointing to the cheap-hotels guide, or "Best months for hotel value" pointing to the prices pages, is the cheapest way to send existing traffic toward booking pages.
- **Session attribution** means the click should land on a *specific, bookable* page. Prefer hotel deep links over generic search where the reader has already chosen a hotel.
- Avoided by design: urgency, scarcity, invented discounts, price claims.

## 6. Measurement strategy (GA4 + CJ)

**GA4 events (verified on production):**
- `booking_click`, with parameters:
  - `cta_location`
  - `hotel_name`
  - `page`
  - `link_sid`
  - `dest_type`
- `homepage_booking_widget_click`
- `sitewide_booking_widget_click`

**Custom dimensions to register** (Admin → Custom definitions, event scope):
- `cta_location` (about 20 values)
- `dest_type` (2 values)
- `hotel_name` (about 150 values)

**Do not register `link_sid`.** It has about 600+ values, which would push reports into "(other)". It is still sent, so it's available in DebugView and, if you enable it, the free BigQuery export for exact matching to CJ SIDs.

**Weekly report (Mondays, previous Mon–Sun):**

| Metric | Source |
|---|---|
| Organic clicks, sitewide and for the 5 commercial pages | GSC → Performance (filter by page) |
| Commercial landing sessions | GA4 → Landing page report, the 5 pages + Hoi An |
| Outbound booking clicks (human) | GA4 `booking_click` + both widget events |
| CJ clicks | CJ → Performance, CID 8008393, by day, Gross |
| Actions (bookings) | CJ, Gross |
| Pending commissions | CJ, Gross: actions not yet locked |
| Approved / locked commissions | CJ, Net |
| Revenue per 100 qualified outbound clicks | Locked commission ÷ GA4 outbound clicks × 100. Use a trailing 90 days; one week is too noisy. |
| GA4 ÷ CJ click ratio | Flag if it falls outside roughly 0.7–1.3 for 2+ weeks |

- **Exclude QA traffic.** No automated clicks through live CJ links. Use `node scripts/audit-cj-live.js` and `node scripts/audit-cj-affiliate.js`; neither clicks anything.
- Today's production verification sent a few automated GA4 events and did **not** load any CJ URL (CJ requests were aborted in the test browser).

## 7. Compliance and security

- **Consent (AdSense).** Google's AdSense help says publishers serving **personalised ads** to users in the EEA and UK (from 16 Jan 2024) and Switzerland (from 31 Jul 2024) must use a **Google-certified CMP integrated with IAB TCF**. Otherwise they can't serve personalised ads to those users. EU/other traffic is about 15–19% of ours. The site has **no CMP or Consent Mode** today.
  - **Recommended [Owner]:** turn on AdSense → **Privacy & messaging → European regulations** message. It is Google's own certified CMP and needs no extra script, because the AdSense tag is already on every page. In that message's settings, enable its **Consent Mode** integration so GA4 respects choices.
  - Then verify: an EEA test visit (VPN) shows the message, rejecting keeps affiliate links working, and GA4 still records consented sessions.
  - I did **not** deploy a cookie banner, because the requirement is met through your AdSense account, not site code. GDPR/ePrivacy obligations for analytics cookies are a legal question beyond Google's policy.
- **Affiliate disclosures:**
  - All 1,379 static CJ anchors carry `rel="nofollow noopener sponsored"` **[Verified]**.
  - **10 booking pages had no disclosure.** Added in `c36e42f`.
  - **Remaining issue:** disclosures sit at the very bottom of pages (median 92% down; only 1% in the top quarter). The most common footer version is white text at **25% opacity** on a dark background, so it is hard to read.
  - **Recommended:** one short, readable line near the top of commercial pages ("We may earn a commission if you book through our links, at no extra cost to you"), plus better footer contrast. This is a sitewide template change, so it needs your approval of the wording and placement.
- **Credentials:**
  - The expired GitHub token was **removed from the `origin` URL** in `.git/config`, which the Claude worktrees share. It is not in any tracked file or in git history.
  - **Removing it from the URL does not revoke it.** Go to GitHub → Settings → Developer settings → Personal access tokens, find the old token for this repo, and **delete** it.
  - Pushes currently work by passing the `gh` login per command. To make plain `git push` work, run `gh auth setup-git` once.
- **The "13 broken internal URLs":**
  - **12 were a bug in my own crawler** (relative links on `/kr/` pages resolved against the site root). Fixed in `scripts/audit-cj-live.js`.
  - **1 was real:** the `kr/korean-convenience-store-guide-da-nang.html` hreflang pointed to a non-existent `da-nang-travel-tips.html`. Removed.
  - Also fixed: `/kr` (no trailing slash) served the Korean homepage with every relative link pointing at the root. It now 308-redirects to `/kr/`.
  - Current crawl: 203 URLs, **0 non-200**.

## 8. Changes and deployments

| Commit | Change |
|---|---|
| `2198192`, `91b9401` | Untracked homepage and directory paths, blocked CJ script, dead slugs (earlier pass) |
| `a80cf93` | GA4: delegated `booking_click` with `link_sid`; GA4 tag on 20 pages that had none |
| `26e86ca` | Final tracking resolution report |
| `c36e42f` | Unavailable-hotel CTAs → notes; `/kr` redirect; hreflang fix; 10 disclosures; nav aria-labels; luxury title/H1; 3 contextual links; where-to-stay jump links |
| *(this commit)* | Crawler relative-URL fix; this roadmap |
| — | `.git/config` remote URL cleaned (local only, not a commit) |

**Not mine:** `b22d5b2` (news page made server-rendered) was committed by a parallel session during this work.

## 9. Production verification (after `c36e42f`)
- `audit-cj-live.js`: 203 pages, 1,591 CJ links, **0 issues, 0 non-200**.
- `audit-cj-affiliate.js`: 0 issues.
- CJ runtime tests passed, desktop and mobile:
  - homepage widget, directory cards and popups, and `bk-widget` all build CJ URLs;
  - secure CJ script loads and its beacon fires;
  - no mixed content.
- GA4 tests passed, desktop and mobile: exactly 1 event per click on six page types and both widgets.
- 0 invalid JSON-LD across the 230 changed pages; no horizontal overflow at 390px on 202 pages.
- `/kr` → 308 → `/kr/`.

## 10. Roadmap to the first $100/month

**Arithmetic [Assumption]:** at 4% of completed-stay value, $100/month needs roughly **$2,500 of completed stays per month**. At an average Da Nang stay of about $250–400, that is **6–10 stayed bookings a month**. At an assumed 1–2% click→stayed-booking rate under session attribution, it takes about **300–1,000 human outbound clicks a month**. The current estimate is about 6–30. **Traffic and programme fit are the binding constraints, not tracking.**

### Next 7 days

| # | Action | Impact | Confidence | Effort | Evidence | Measure |
|---|---|---|---|---|---|---|
| 1 | Read the Booking.com NA programme terms; compare with APAC and Australia; ask CJ which programme fits **[Owner]** | Very high (could decide whether any commission is possible) | Medium | 30–60 min | CJ: "pick the region … where most of your audience is"; NA = 17% of clicks | Written terms; CJ reply |
| 2 | Export the daily click breakdown; confirm payment and tax settings **[Owner]** | High (separates test from real clicks) | High | 20 min | 97 clicks include likely QA traffic | Daily CSV |
| 3 | Enable the AdSense Privacy & messaging CMP + Consent Mode **[Owner]** | Medium (EEA/UK/CH ad eligibility) | High | 30 min | Google AdSense help 13554020 | Message visible on EEA test; GA4 consent signals |
| 4 | Revoke the old GitHub token; make the apex domain redirect permanent **[Owner]** | Security / small SEO | High | 10 min | §4, §7 | Token gone; `curl -I` shows 308 |
| 5 | Register the 3 GA4 custom dimensions **[Owner]** | Enables measurement | High | 5 min | §6 | Dimensions populate within 48h |

### Next 30 days

| # | Action | Impact | Confidence | Effort | Measure |
|---|---|---|---|---|---|
| 6 | If approved, move links to the better-fitting Booking.com programme (one script run, same audits) | Very high if NA excludes our audience | Depends on #1 | 1–2 h | First *pending* actions in CJ Gross |
| 7 | Add a contextual "where to stay / hotel value" block to `da-nang-weather-by-month` and `da-nang-budget-guide` | Medium (27K impressions of existing traffic) | Medium | 2 h | GA4 `booking_click` and onward clicks from these pages |
| 8 | Budget guide: replace the 3 delisted hotels with bookable picks you've verified, and add real photos | Medium | Medium | Half a day (owner photos) | Card CTR (`cta_location=booking_hotel_card`) |
| 9 | Decide the family-page consolidation; expand `best-hotels-in-hoi-an` with first-hand detail | Medium–high (head-term rankings) | Medium | 1 day | GSC position for "best family resort da nang", "best hotels in hoi an" |
| 10 | Top-of-page disclosure line + readable footer contrast (needs wording approval) | Trust / compliance | High | 1 h | Done/not done |
| 11 | Mobile nav: visible "Hotels" label; fix small tap targets and the clipped widget on Hoi An | Low–medium | Medium | 2 h | Nav-button click share in GA4 (`cta_location=untagged` from nav) |

### 60–90 days

| # | Action | Measure |
|---|---|---|
| 12 | Re-pull GSC. Did the 5 commercial pages move toward page 1? | Average position per page and query |
| 13 | Compute revenue per 100 outbound clicks on a trailing 90 days; compare GA4 and CJ click counts | §6 weekly sheet |
| 14 | If actions > 0 but locked commissions = 0 after 60 days past check-out, escalate with CJ | CJ action status history |
| 15 | Expand only content types that produce `booking_click` (by `cta_location` and page). Consider Agoda as a second programme only if Booking.com conversion stays at zero after #1/#6 | GA4 + CJ |

**Not guaranteed:** rankings, bookings or revenue. Every number above is either measured (and labelled) or an explicit assumption.

---

**Sources (official):**
- Booking.com Affiliate Program — https://www.booking.com/affiliate-program/v2/index.html
- CJ: Partner with Booking.com (regions + FAQ) — https://www.cj.com/en-gb/publisher/partners/booking.com
- Google AdSense: Google-certified CMP requirements — https://support.google.com/adsense/answer/13554020
- Google AdSense: Privacy & messaging / consent mode — https://support.google.com/adsense/answer/16053245
