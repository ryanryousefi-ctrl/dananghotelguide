# Forensic Affiliate Audit — dananghotelguide.com

**Date:** October 6, 2026
**Scope:** Full-site forensic investigation into $0 affiliate revenue since the AWIN → CJ migration

---

## ADDENDUM (same day, follow-up investigation before implementing the fix)

The user flagged that their live CJ account dashboard shows "Deep Link Automation" **unchecked**, with only "Page-Based Impression Reporting" checked, and that the dashboard's currently-generated script is `https://www.anrdoezrs.net/am/101820678/impressions/page/am.js` (no `/include/allCj/` in the path) — different from the script URL actually referenced in this site's HTML. This required direct reconciliation before any sitewide change.

**Findings, with evidence:**

1. **Two distinct scripts exist on CJ's CDN for the same account (`websiteId=101820678`, `publisherId=8008393`):**
   - `https://www.anrdoezrs.net/am/101820678/impressions/page/am.js` — 72 lines. Contains only a `trackImpressions()` call: collects every `<a href>` and matching `<img>` src on the page and POSTs them to `origin.cjtrack.me/pageImpression` on load. **No click listener. No domain allowlist. No href rewriting of any kind.** This is pure impression/page-view tracking, confirming the user's suspicion.
   - `https://www.anrdoezrs.net/am/101820678/include/allCj/impressions/page/am.js` — 243 lines. Contains the same `trackImpressions()` block **plus** a 22,401-domain allowlist and the full click-rewrite logic (`autoMonetizeLink`, `createClickHandlerFor`) described in the original audit.

2. **The live site's HTML hardcodes the second (`/include/allCj/`) URL**, confirmed via direct `grep` of production HTML on `naman-retreat-da-nang.html` and `best-hotels-in-da-nang.html`. This script is being served fresh (not from stale cache — `X-Cache: Miss from cloudfront` on a fetch performed during this follow-up) regardless of the dashboard toggle's current state. CJ's dashboard toggle appears to control what URL the *account's script generator* currently recommends for new installs; it does not appear to retroactively disable content already being served at a previously-generated script URL still referenced by a site's HTML. This reconciles the apparent contradiction: the dashboard is accurately describing the *currently recommended* configuration, but it is not describing what script this specific site is actually loading.

3. **Fresh, live re-verification of the click-race bug, run again during this follow-up (separate from the original audit's test run):** 6 of 6 real native clicks on the live `naman-retreat-da-nang.html` hero CTA opened the new tab at the bare, parameter-stripped `booking.com` URL. This is a stronger reproduction than the original audit's 4/5, not weaker — the bug is current and highly consistent.

4. **A previously-missed commit materially changes the historical timeline and explains part of the 251-click puzzle:**
   - `ee0bc3f` (Jul 13, 2026): AWIN → CJ migration, DLA script added sitewide.
   - `b96a20b` (**Aug 10, 2026**): A prior session found the DLA script's rewrite target (`qksrv.net`) was returning `ERR_TUNNEL_CONNECTION_FAILED` — a hard connection failure, not merely a race condition — and **deliberately removed the CJ script sitewide**, leaving plain `booking.com?aid=1784897` links with no CJ wrapper at all, explicitly as "the fix" for that failure.
   - `ab76b7f` (**Aug 13, 2026**): Three days later, a separate pass found the script "missing" from English-language pages (present only on `/kr/` pages) and **re-added it sitewide**, apparently without the context that it had just been deliberately removed for breaking checkouts, and without re-verifying whether the underlying `qksrv.net` failure was still present.
   - The user's CJ reporting window (~Aug 12 – Oct 6) therefore begins 1–2 days *before* the script was re-added, meaning nearly the entire reporting window (Aug 13 onward, ~55 of ~57 days) had the click-race-affected DLA script live.

5. **Resolving why CJ still shows 251 clicks despite the bug (the user's Q8), with evidence rather than speculation:** The script's click-handling code (`autoMonetizeLink`/`createClickHandlerFor`) contains **zero network calls of its own** — confirmed by reading the full 8,317-character real-code portion of the script line by line. The only XHR in the entire file is `trackImpressions()`, which fires once on page load (an impression, not a click) and is unrelated to click behavior. This means CJ has no independent "a click happened" signal from this script — the only way a click gets counted is if the browser's navigation **actually reaches `origin.cjtrack.me/links/.../type/am/...`**, which only happens when the href-rewrite race is won. **This directly supports explanation (A) from the original audit's Phase 8 list: the 251 clicks are the minority of real clicks where the rewrite race was won**, not a separate counting mechanism, not stale configuration, and not a different script running elsewhere.

6. **The static CJ link format was re-verified fresh and traced through its full real redirect chain** (not just a 302 status check): `qksrv.net` → `cj.dotomi.com` → `emjcd.com` → `booking.com`, landing correctly on the intended property in 3 of 3 sampled hotels (Naman Retreat, InterContinental, Sheraton Grand). **Important new finding:** on the final Booking.com landing page, our own `aid=1784897` is **not** what appears — CJ substitutes its own Booking.com partner `aid` (observed: `aid=811995`) plus a `label=affnetcj-..._pub-8008393_site-101820678_pname-DaNang+Hotel+Guide_...cjevent-...` parameter block, which is the actual mechanism Booking.com uses to attribute a sale back to CJ, and CJ in turn attributes it back to this publisher account. This means `aid=1784897` in the original `href` is not the live attribution parameter once a click is correctly routed through CJ — it only matters for the (presumably rare/unintended) case of a user reaching Booking.com directly, bypassing CJ entirely, which is exactly what the race-condition bug causes to happen on most clicks today.

**Conclusion carried into the fix:** the static-link architecture (Section S of the original audit) remains the correct fix, now with end-to-end verification of the real redirect chain and confirmed correct publisher/property attribution, not just a verified 302 response. The CJ account's current dashboard toggle state is not blocking this approach — the impression-only script was never the one this site relies on, and the full DLA script (which contains the correct tracking-redirect logic, just with a client-side-only delivery mechanism that doesn't work) remains live at the URL this site already references.

---

## EXECUTIVE SUMMARY

**1. Is the site fundamentally healthy?**
Mostly yes. Technical SEO is clean (robots.txt, sitemap, canonical tags, no major crawl blockers), the site is getting real Google impressions, and editorial content is genuine and well-maintained. The site has one severe, previously-undiagnosed bug and one serious-but-separate SEO ranking problem.

**2. Why is affiliate revenue currently $0?**
A client-side JavaScript race condition in CJ's Deep Link Automation (DLA) script. On a real, native browser click, the destination URL for a `target="_blank"` link is resolved by Chromium **before** the DLA script's click handler finishes rewriting `href`. The new tab opens on the bare `booking.com` URL — stripped of the CJ tracking redirect **and the raw `aid=1784897` parameter that was already present**. This was reproduced 7 of 9 times across two live production pages and an isolated minimal test page using the real CJ script and the real `booking.com` domain. See **THE SMOKING GUN** below.

**3. Did the AWIN → CJ migration likely contribute?**
Yes, directly and specifically. AWIN links were static, fully-formed tracking URLs baked into the HTML at build time (`awin1.com/cread.php?awinmid=...&ued=...`). They required no JavaScript to track a click. CJ's DLA approach requires a third-party script to intercept and rewrite every click in real time, which introduces exactly the race condition found here. The migration didn't just change networks — it changed the site from a **zero-JS-dependency tracking architecture to a JS-dependent one**, and that architecture change is the mechanical cause of the failure.

**4. Did you find a technical affiliate problem?**
Yes — see above. This is a confirmed, reproducible bug, not a conversion/audience-quality problem. CJ showing 251 clicks with $0 revenue is consistent with clicks reaching Booking.com **without attribution**, not with clicks reaching Booking.com and simply failing to convert.

**5. Should AWIN be restored?**
Not immediately, and not wholesale. The fastest, lowest-risk fix is to keep the CJ relationship (the commercial terms may be fine) but **stop depending on client-side JS rewriting**. Construct the CJ tracking URL statically, server-side (at content-authoring time), exactly like AWIN's `href` was built. This gets CJ's existing publisher relationship working with AWIN's reliability model. If CJ's commission structure or Booking.com's CJ-specific terms turn out to be worse than the AWIN program once revenue resumes, that's a second-order question to revisit only after confirming clicks convert at all.

**6. Should CJ be kept?**
Provisionally yes, with the static-link fix. There's no evidence CJ as a program is the problem — the evidence points squarely at the client-side rewrite implementation.

**7. The five highest-impact changes:**
1. Replace the JS-rewritten `href` with a statically-built CJ deep link (`qksrv.net/links/101820678/type/am/<url>`) in every affiliate CTA's `href` attribute, removing reliance on click-time mutation. *(Critical / Very High impact / High confidence / Hours)*
2. Verify the fix by testing with Booking.com's own click-test / CJ's test-click tool and confirming a tracked action appears in the CJ dashboard. *(Critical / Very High / High / Minutes once #1 is live)*
3. Fix the ranking gap on commercial hotel queries — "da nang hotels," "best hotels in da nang," "luxury resorts da nang" all rank position 27–65 despite real search volume (see Phase 9). *(High / Very High / Medium / Days–Weeks)*
4. Add outbound affiliate-click analytics events (hotel, page, CTA location) so future revenue debugging doesn't require a forensic audit. *(High / High / High / Hours)*
5. Correct the stale `qksrv.net` reference in CLAUDE.md (the live script actually redirects via `origin.cjtrack.me` — functionally identical, but the documentation drift is a sign nobody has verified this path end-to-end since the migration). *(Low / Low / High / Minutes)*

**8. What should happen TODAY?**
Implement and ship the static CJ link fix on at least the top 10 highest-traffic Tier A pages. Confirm via the CJ dashboard's click-test tool that a resulting click now logs as a trackable, attributed hit.

**9. What should happen THIS WEEK?**
Roll the static-link fix sitewide (all 208 pages / ~1,661 links). Add affiliate click analytics events. Re-verify no AWIN remnants or duplicate tracking exist. Watch the CJ dashboard daily for the first real tracked action.

**10. What should happen THIS MONTH?**
Rework titles/meta on the Tier A commercial hotel pages that are ranking 27–65 for high-value queries — these are already-written pages sitting just outside page 1–3, which is a faster lever than new content. Build internal links from informational guides into these commercial pages.

**11. Realistic path to the first $100/month:**
See Section T. With the tracking bug fixed, the existing 251 clicks/~2 months of traffic (pre-fix) becomes a baseline — at even a conservative 1–3% Booking.com conversion rate and a $8–15 average commission, 100–250 monthly clicks could plausibly produce the first $1–3 in commissions, with meaningful growth only once the commercial-query ranking gap (Phase 9) is also addressed to grow qualified click volume. $100/month is not realistic in week one; it is a realistic 60–90 day target if both problems are fixed.

---

## THE SMOKING GUN

Every affiliate CTA on this site is an `<a>` tag with a plain `booking.com` URL in its `href`, `target="_blank"`, and `rel="nofollow noopener sponsored"`. Tracking is added entirely by a third-party script (CJ's Deep Link Automation, loaded from `anrdoezrs.net`) that attaches a `click` listener to every anchor on the page. When clicked, that listener synchronously rewrites `element.href` to the real tracking URL (`origin.cjtrack.me/links/101820678/type/am/<original-url>`).

**This works when tested with `element.dispatchEvent(new MouseEvent('click'))` or `element.click()` in a console — the href is correctly rewritten and can be confirmed by reading `element.href` immediately after.**

**It does not reliably work for a real, native user click on a `target="_blank"` link.** Chromium resolves the navigation target for a new browsing context using an href snapshot that is not guaranteed to reflect a same-tick synchronous mutation made inside a bubbling click listener. The practical result, confirmed by direct browser automation against both the live production site and an isolated single-link test page using the real CJ script:

- **Pre-click `href`:** `https://www.booking.com/hotel/vn/intercontinental-danang-sun-peninsula-resort.html?aid=1784897&sid=best-hotels-in-da-nang--intercontinental-danang-sun-pe`
- **URL the new tab actually opened at (4 of 5 real clicks on a live production page):** `https://www.booking.com/hotel/vn/intercontinental-danang-sun-peninsula-resort.html`

No query string. No `aid`. No CJ redirect. The click never touches `cjtrack.me`, `dotomi.com`, or any CJ tracking domain at all. The same result reproduced on an isolated test page containing nothing but the real CJ script and one `booking.com` link (3 of 4 clicks).

**This means every real visitor who clicks a "Check Availability" or "See Prices" button is, at least some meaningful fraction of the time, landing on Booking.com completely untracked — not just by CJ, but without even the raw `aid=1784897` affiliate parameter.** Even a conversion would not have been attributed. This single mechanism is sufficient on its own to explain 251 clicks / 0 actions / $0 revenue.

**Why AWIN worked and CJ doesn't, mechanically:** AWIN's `href` was a complete, final tracking URL at page-load time — `https://www.awin1.com/cread.php?awinmid=18119&awinaffid=2788028&clickref=...&ued=<encoded-destination>`. There was nothing to rewrite, nothing to race, no dependency on JavaScript executing correctly before the user's click resolved. CJ's DLA model asks the browser to do the opposite: show a plain, untracked URL and hope a script mutates it in time. For a same-tab navigation this is usually fine. For `target="_blank"` — which is every single affiliate link on this site — it is not reliable.

---

## A. Executive Diagnosis

The site is not broken in the way CJ's dashboard or a surface-level SEO audit would suggest. Clicks are real (251 logged by CJ itself, meaning the pageImpression beacon and script are loading). The problem is narrower and more mechanical than "bad traffic" or "wrong affiliate network": the click-tracking handoff from this site to Booking.com silently fails for `target="_blank"` links a meaningful fraction of the time, and when it fails, it fails completely — no tracking parameters survive at all, not even the non-CJ `aid` baseline.

Severity: **Critical**. Revenue Impact: **Very High**. Confidence: **High** (directly reproduced, not inferred). Effort to fix: **Hours**, not days — this does not require a new affiliate relationship, a redesign, or new content.

---

## B. AWIN vs CJ Migration Forensics

**Commit:** `ea036f6` — "Migrate Booking.com affiliate from Awin to CJ Deep Link Automation" (July 10, 2026), 217 files changed.

**What changed, concretely:**

| | AWIN (before) | CJ (after) |
|---|---|---|
| Link format | `https://www.awin1.com/cread.php?awinmid=18119&awinaffid=2788028&clickref=<page>&ued=<encoded-booking-url>` | Plain `https://www.booking.com/hotel/vn/<slug>.html` |
| Tracking mechanism | Static URL, server-rendered, works with zero JS | Third-party script (`anrdoezrs.net` → `am.js`) rewrites `href` on click |
| JS dependency | None | Full — if the script fails to load, attach, or race the click, tracking silently does not happen |
| `data-booking-url` pattern | Used with a site-authored `generateBookingLink()` helper that built the AWIN URL and set `href` on `DOMContentLoaded`, well before any click could occur | Script removed; CTAs now use a bare `href` already pointing at Booking.com, which the CJ script must then intercept and rewrite |
| Behavior under `target="_blank"` | Not applicable — the href was already final before the user could click | Confirmed broken (see Smoking Gun) |

**Also found in the same commit:** "Fix 1,564 pre-existing broken href==URL= links (were rendering as `href=""`)." This means a *separate* bug (a literal typo pattern, `href==URL=`, rendering as empty hrefs) existed before the AWIN→CJ migration and was fixed in the same commit. That bug is resolved and not a current concern, but it's worth noting the AWIN implementation itself was not perfectly clean before the migration — the pre-migration AWIN links were not universally functioning either, which may be part of why a migration was undertaken in the first place. This does not change the conclusion that the CJ implementation that replaced it introduced a new, more severe failure mode.

**Risk assessment of restoring AWIN wholesale:** Not recommended as a first step. Restoring AWIN's static-link architecture is the right *pattern* to borrow, but it should be applied to the existing CJ relationship first (see Section R) since that requires no new partner approval, no new account setup, and preserves whatever current Booking.com-via-CJ commission terms exist. If CJ's static-link approach is implemented and still underperforms after a real evaluation window, AWIN restoration becomes a reasonable fallback — git history fully preserves the old implementation (commit `ea036f6`'s parent) for exactly this purpose.

---

## C. Affiliate Link Inventory (Summary)

- **1,661** `booking.com` href instances across the site.
- **208** pages contain at least one `affiliate-link`-classed CTA.
- **1,116** of those links carry `target="_blank"` — the exact condition under which the bug reproduces. This is effectively the entire affiliate link surface.
- Every sampled link correctly carries `aid=1784897` and a page-specific `sid=` parameter in the raw `href` — the *content* of the links is correct. The failure is purely in what happens to that href at click time.
- `node scripts/audit-cj-affiliate.js` (the site's own QA script) reports 0 issues sitewide. This is expected and is itself a finding: the script checks for the DLA script's presence and correct href structure, not runtime click behavior, so it cannot and did not catch this bug. Treat a clean run of this script as necessary but not sufficient evidence that tracking works.

## D. Broken/Suspicious Affiliate Links

No malformed URLs, wrong `aid` values, stale `dest_id`s, or Awin remnants were found in the current codebase — the link *content* is clean sitewide. The defect is entirely in the runtime click-handling layer, not in any specific link's construction.

## E. Tracking Problems

This is the core finding; see **THE SMOKING GUN**. Additional notes:

- The CJ script's advertised/documented redirect domain in `CLAUDE.md` (`qksrv.net`) differs from what the live script actually uses (`origin.cjtrack.me`). Both resolve to the same underlying `cj.dotomi.com` tracking endpoint and both are functional — this is cosmetic documentation drift, not a second bug — but it indicates the documented implementation has not been re-verified against the live script since it was written. *(Low severity, Low impact, High confidence, Minutes to fix the doc)*
- The CJ script fires a `pageImpression` beacon on every page load (confirmed via network capture), which is why CJ shows "251 tracked clicks" even though individual click-to-booking attribution is failing — impressions and clicks are tracked by a separate mechanism from the affiliate-link rewrite, so the dashboard showing activity does not imply the rewrite is working.

## F. Conversion Problems

Cannot be meaningfully assessed yet. With 0 correctly-attributed clicks reaching Booking.com, there is no real data on how CJ-attributed traffic converts. This question is premature until Section R's fix ships and a clean data window exists.

## G. Mobile Findings

Spot-checked the Naman Retreat review's hero CTA at a 390×844 viewport: visible on load, correctly sized (50px tall, well above the 44px minimum touch target), no overlap or layout shift. Mobile CTA *visibility* is not a contributing factor here. The click-tracking race condition identified in Section B/Smoking Gun is not mobile-specific — it is a `target="_blank"` behavior that applies on both desktop and mobile Chromium-based browsers; Safari/iOS behavior was not independently verified in this pass and should be spot-checked after the fix ships, given Safari's historically different popup/navigation timing.

## H. Highest-Value Money Pages

Based on GSC impression volume for hotel-intent queries, these pages carry the most at-risk commercial traffic and should be prioritized for both the tracking fix and the CTA/ranking work:

- `best-hotels-in-da-nang.html` — ranks position ~30 for "best hotels in da nang" (253 impr), "hotels in da nang" (206 impr)
- `da-nang-beach-hotels.html` / beachfront-hotel pages — "beachfront hotels da nang" (130 impr, pos 42), "da nang hotels on the beach" (132 impr, pos 42)
- `luxury-hotels-da-nang.html` — "da nang luxury resort" (282 impr, pos 33), "luxury resorts da nang" (220 impr, pos 29)
- `family-hotels-da-nang.html` — "best family resort da nang" (274 impr, pos 40), "da nang family resort" (214 impr, pos 38)
- `where-to-stay-in-da-nang.html` — "where to stay in da nang" (239 impr, pos **44**, the best-performing of this group but still off page 1)

## I. Search Console Opportunities

The headline GSC numbers (268K impressions, 12.5 avg position, 0.6% CTR) are driven almost entirely by informational long-tail queries, not commercial hotel queries. When isolating hotel-intent queries specifically, **every single one of the high-volume commercial terms sits at position 27–65** (page 3 to page 6+ of Google), not the 4–20 range the brief hypothesized. See Section A's table in the companion analysis above (full query list captured in the audit run).

This matters for the $100/month model: the site is not failing to convert strong commercial rankings — it currently has almost no page-1 commercial hotel rankings to convert in the first place. The two problems (tracking bug + ranking gap) compound rather than being alternative explanations.

Two concrete near-term opportunities with real, non-zero existing traffic worth protecting:
- "da nang weather by month" — 233 impr, pos 15, 0.43% CTR — informational but page-1-adjacent; title/meta rework could lift CTR without needing a ranking change.
- "da nang vs hoi an" — 154 impr, pos 15, 0.65% CTR — same pattern.

## J. Technical SEO

robots.txt is clean and explicitly allows major crawlers (including AI bots). Sitemap returns 202 URLs with no obvious errors. No systemic indexability blockers were found in this pass. A full duplicate-title/duplicate-meta/orphan-page sweep was not completed in this pass given the scope already covered — recommended as a follow-up, not blocking the revenue fix.

## K. Internal Linking

Not exhaustively mapped in this pass. Given Section I's finding, the highest-value internal-linking work is adding contextual links from high-traffic informational pages (weather, itineraries, transport guides) into the Tier A commercial pages listed in Section H, to pass authority toward the pages that are currently stuck on page 3+.

## L. CTR Improvements

Deferred pending the ranking-position fixes in Section I — CTR optimization on a page-40 ranking has limited practical effect. Prioritize position first on the commercial queries, then revisit title/meta CTR work.

## M. Site Speed

Not audited in depth this pass; no blocking performance issues were surfaced incidentally during the forensic testing (pages loaded and became interactive promptly in all automated test runs).

## N. Trust/E-E-A-T

Out of scope findings from this pass: the site already carries genuine first-person review content (confirmed in recent work on the Naman Retreat review), an About page, and affiliate disclosure language. No fabrication concerns were found or introduced.

## O. Backlinks

Not independently forensically verified in this pass (would require a third-party backlink tool/API not available in this environment). Flag as a follow-up: a referring-domain jump of +486 in a short window is worth a manual spot-check for spam/PBN patterns before assuming it's organic, but this has no bearing on the $0 revenue finding and was deprioritized accordingly.

## P. Revenue Leaks

The single largest revenue leak is the tracking race condition itself (Section B). No instances of hotel names/images linking directly to Booking.com *without* the `affiliate-link` class or tracking attributes were found in the sampled pages — the leak is not "missing affiliate links," it's "affiliate links that silently fail to track."

## Q. Analytics Improvements

`booking-cta-tracking.js` (and an inline duplicate found on `best-hotels-in-da-nang.html`) already fires a GA4 `booking_click` event with `cta_location`, `hotel_name`, and `page` dimensions on every affiliate CTA click — this exists and works (confirmed via CDP: 2 listeners attached to the inspected CTA, independent of the CJ rewrite). This means **GA4 already has outbound-click data covering the exact period CJ shows $0 revenue** — cross-referencing GA4's `booking_click` event count against CJ's 251 logged clicks for the same window would help quantify how many real clicks are happening versus how many CJ is capturing, and is a fast, no-code next step.

## R. Changes Implemented

No code changes were made as part of this audit pass — per the task's phased structure, Phase 18 ("implement safe high-confidence fixes") was reserved pending review of this report, since the fix (switching from client-side rewrite to static server-rendered CJ links) touches the affiliate-link `href` on up to 1,661 instances sitewide and warrants a deliberate rollout rather than a blind mass-edit in the same pass as the diagnosis. See Section S for the exact recommended implementation.

## S. Changes Recommended But NOT Implemented

**The fix — static CJ deep links, replacing client-side rewriting:**

Instead of:
```html
<a href="https://www.booking.com/hotel/vn/naman-retreat-da-nang.html?aid=1784897&sid=naman-retreat-da-nang--naman-retreat-da-nang"
   class="hr-cta-btn affiliate-link" target="_blank" rel="nofollow noopener sponsored">
```

Build the href statically as:
```html
<a href="https://www.qksrv.net/links/101820678/type/am/https%3A%2F%2Fwww.booking.com%2Fhotel%2Fvn%2Fnaman-retreat-da-nang.html%3Faid%3D1784897%26sid%3Dnaman-retreat-da-nang--naman-retreat-da-nang"
   class="hr-cta-btn affiliate-link" target="_blank" rel="nofollow noopener sponsored"
   data-booking-url="https://www.booking.com/hotel/vn/naman-retreat-da-nang.html?aid=1784897&sid=naman-retreat-da-nang--naman-retreat-da-nang">
```

This was verified to return a valid `302` from `qksrv.net` in this audit. Keep the CJ DLA script loaded sitewide as a fallback/impression-tracking layer (it still fires `pageImpression` correctly and costs nothing to leave in place), but no longer depend on it to be the *only* mechanism that produces a tracked click.

Implementation approach: a small script (Node, run once) that reads every `href="https://www.booking.com/..."` in every HTML file, URL-encodes it, and rewrites it to the `qksrv.net/links/101820678/type/am/<encoded-url>` form, preserving `data-booking-url` as the clean original for any JS/analytics code that reads it. This is a mechanical, scriptable change across ~1,661 instances in ~208 files — Hours, not days, and should be done as one reviewable commit per CLAUDE.md's existing workflow conventions, with `node scripts/audit-cj-affiliate.js` extended to also verify the `qksrv.net` wrapper is present (not just the DLA script).

**Not recommended without further evaluation:**
- Restoring AWIN outright (Section B) — revisit only if the static-CJ-link fix is shipped and a clean 30-day window still shows no conversions.
- Any CTA copy/CRO rewrite — deferred until tracking is confirmed working, since current conversion data is not trustworthy.

## T. $100/Month Revenue Model

No commission rate is documented in this repository, so this uses illustrative scenarios rather than a confirmed rate (Booking.com's CJ program commonly runs in the 25–40% revshare range on Booking.com's own ~10–15% hotel commission, which nets affiliates roughly 4–6% of the booking value — a plausible $8–15 average commission per booking for this market, but **this is an estimate, not a documented fact**, and should be confirmed from the actual CJ program terms before being used for planning):

| Avg. commission | Bookings needed for $100 |
|---|---|
| $5 | 20/month |
| $10 | 10/month |
| $20 | 5/month |

Using the pre-fix baseline of 251 clicks over roughly 8 weeks (~31/week, ~125/month) and a conservative Booking.com hotel-affiliate conversion rate of 1–3%: **125 correctly-tracked monthly clicks → roughly 1–4 bookings/month** at that conversion range. At $10 average commission, that's $10–40/month from current click volume alone, once tracking is fixed — short of $100, but a real, non-zero starting point.

Reaching $100/month realistically requires **both** fixes: the tracking fix (to convert existing clicks into revenue at all) and meaningful movement on the Section I ranking gap (to grow click volume toward 300–500+ qualified monthly clicks, which at the same conversion/commission assumptions plausibly clears $100/month). Treat 60–90 days as the realistic window, not weeks.

## U. 7-Day Action Plan

- Day 1: Implement the static CJ link fix (Section S) on the 5 Tier A pages in Section H.
- Day 1–2: Verify via CJ's own click-test tool that a resulting click now shows as a tracked action in the CJ dashboard.
- Day 3–5: Roll the fix sitewide (remaining ~203 pages / ~1,650 links).
- Day 5–7: Extend `audit-cj-affiliate.js` to assert the `qksrv.net` wrapper is present on every affiliate href, so this cannot silently regress.
- Ongoing: watch the CJ dashboard daily for the first genuinely attributed action.

## V. 30-Day Action Plan

- Confirm at least one real, organically-arrived conversion has been tracked (not just test clicks).
- Cross-reference GA4 `booking_click` event volume against CJ's logged click count for the same window to quantify any remaining tracking gap.
- Begin title/meta/internal-linking work on the Tier A pages in Section H to close the position-27-to-65 ranking gap on commercial queries.
- Spot-check Safari/iOS click behavior specifically, since this audit's reproduction used Chromium.

## W. 90-Day Action Plan

- Reassess whether CJ's Booking.com program is commercially competitive now that clicks are actually converting — if real conversion data suggests AWIN's historical performance was meaningfully better per-click, re-evaluate restoring AWIN using the preserved pre-migration implementation in git history.
- Reassess the $100/month model in Section T against real observed conversion rate and commission data instead of estimates.
- Revisit Sections J/K/L/M/O (technical SEO depth, internal linking map, site speed, backlink forensics) with dedicated passes, now that the revenue-blocking bug is resolved and ongoing SEO investment has a working monetization path to justify it.
