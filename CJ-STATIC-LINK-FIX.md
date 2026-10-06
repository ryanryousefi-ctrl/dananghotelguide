# CJ Static Link Fix — Implementation Report

**Date:** October 6, 2026
**Status:** DEPLOYED TO PRODUCTION. This is the clean before/after point for affiliate revenue tracking.

**Commit 1 (sitewide fix):** `774924e` — pushed 2026-10-06T09:38:04Z, confirmed live 2026-10-06T09:38:37Z
**Commit 2 (gap closure — see Section 17):** `8e33e86` — pushed 2026-10-06T09:45:16Z, confirmed live 2026-10-06T09:45:40Z
**Commit 3 (one more file, zero live impact — see Section 19):** fixes `guides-da-nang-hotel-prices-by-month.html`, a URL that 308-redirects to `/da-nang-hotel-prices-by-month.html` and is not in the live sitemap, so its internal links were never reachable by a real visitor; fixed anyway for completeness.

---

## 1. Root Cause

A client-side JavaScript race condition. Every Booking.com CTA's `href` was a plain, untracked `booking.com` URL (plus, in some cases, our own `aid=1784897`, which turns out to have no effect once routed through CJ — see Section 11). Tracking depended entirely on a third-party script (CJ's Deep Link Automation bundle, loaded from `anrdoezrs.net`) rewriting that `href` to a tracked redirect URL at the moment of click, before the browser navigated.

For a `target="_blank"` link — which is every commercial CTA on this site — Chromium does not reliably apply that synchronous rewrite before resolving the new tab's destination. Reproduced directly: 6/6 real native clicks on live production (`naman-retreat-da-nang.html`'s hero CTA) opened the new tab at the bare, parameter-stripped `booking.com` URL, never touching any CJ domain. Full detail and evidence trail in `FORENSIC-AFFILIATE-AUDIT.md`.

## 2. Old Implementation

```html
<a href="https://www.booking.com/hotel/vn/naman-retreat-da-nang.html?aid=1784897&sid=naman-retreat-da-nang--naman-retreat-da-nang"
   class="affiliate-link" target="_blank" rel="nofollow noopener sponsored">
```
...with a sitewide `<script src="https://www.anrdoezrs.net/am/101820678/include/allCj/impressions/page/am.js">` expected to rewrite `href` on click.

Two further untracked variants existed beyond the static HTML:
- **8 pages** render hotel cards from a JS data array via `bookingUrl:'https://www.booking.com/...'` / `bk:'https://www.booking.com/...'` fields, concatenated directly into an `href` string at render time — same bug, same fix needed, different mechanism for getting the raw URL onto the page.
- **`bk-widget.js`**, the sitewide date-picker widget (loaded on 179 pages), built a Booking.com search URL and called `window.open(url, '_blank', ...)` directly — no CJ wrapping of any kind, static or dynamic.

## 3. New Implementation

Every commercial link's `href` (or JS field, or `window.open()` argument) is now the complete, final CJ tracking URL, built at authoring/render time — nothing is rewritten at click time:

```html
<a href="https://www.kqzyfj.com/click-101820678-17293132?sid=naman-retreat-da-nang--naman-retreat-da-nang&url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fvn%2Fnaman-retreat-da-nang.html"
   class="affiliate-link" target="_blank" rel="nofollow noopener sponsored">
```

**Format source:** not inferred from JavaScript. This is the literal static deep-link structure generated directly by CJ Account Manager for this account:

- Website: DaNang Hotel Guide — **101820678**
- Advertiser: Booking.com North America — **7864295**
- Evergreen Link ID: **17293132**
- Format: `https://www.kqzyfj.com/click-101820678-17293132?sid=<SID>&url=<url-encoded booking.com destination>`

`aid=1784897` and any pre-existing `sid=` are stripped from the destination URL before it's wrapped — see Section 11 for why.

## 4. Files Changed

- **231 HTML files** (`*.html` + `kr/*.html`) — static `href="https://www.booking.com/..."` attributes replaced.
- **9 HTML files** — `bookingUrl:'...'` / `bk:'...'` JS object-literal fields replaced (`hotel-reviews.html`, `hoi-an.html`, `da-nang-hotels-map.html`, `best-hotels-in-hoi-an.html`, `best-value-hotels-hoi-an.html`, `hoi-an-old-town-hotels.html`, `where-to-stay-in-hoi-an.html`, `da-nang-hotels-kids-club.html`, `an-bang-beach-hotels.html`). Several of these files overlap with the 231 above (both a static href and a JS field on the same page).
- **`bk-widget.js`** — the dynamically-built search URL is now wrapped in the CJ click URL before `window.open()`.
- **`scripts/audit-cj-affiliate.js`** — updated to assert every commercial link is a static `kqzyfj.com/click-101820678-17293132` URL, and to fail on any raw `booking.com` href or `bookingUrl`/`bk` field it finds. Verified this correctly catches a deliberately reintroduced unwrapped link in a throwaway test file before being relied on.
- **`scripts/apply-cj-static-links.js`** (new) — the deterministic, centralized transformation script used to perform this change. Idempotent: safe to re-run, already-wrapped links are skipped. This is also the tool to use going forward any time a new page is authored with a raw `booking.com` link — run it once before publishing.

## 5. Number of Affiliate URLs Affected

**1,903 total** CJ-wrapped references sitewide:
- 1,773 static `href="..."` attributes
- 129 JS `bookingUrl`/`bk` object-literal fields
- 1 `bk-widget.js` dynamic URL template (used on all 179 pages that load the widget)

`node scripts/apply-cj-static-links.js` after the fix reports `Already-wrapped (skipped): 0` on a fresh run and `0` new changes on a second run — confirming full, idempotent coverage.

## 6. Was URL Generation Centralized?

Partially, by necessity of the existing architecture (a flat static-HTML site with no templating/build step):

- **One canonical script** (`scripts/apply-cj-static-links.js`) is now the single source of truth for how a `booking.com` URL becomes a CJ URL, and is the tool used for every future conversion — not 1,903 hand-maintained variations.
- **`bk-widget.js`** is already a single shared file loaded on 179 pages, so its one code change covers all of them centrally — no per-page edits needed there.
- The static HTML `href=` and JS-field values themselves remain baked into each page's source (as they always were, for every link on this site, affiliate or not) — this site has no server-side templating to generate them from a single runtime source, so "centralized" here means a single deterministic generator script applied uniformly, not a single runtime function. This matches the architecture the AWIN implementation also used.

## 7. Was `am.js` Removed?

**No — retained**, deliberately. Verified this is safe:
- `kqzyfj.com` is **not** in the DLA script's 22,401-domain merchant allowlist (confirmed by extracting and inspecting the live script's domain array directly). The script's `matchesParentDomain()` check will return `false` for every new CJ-wrapped link, so `autoMonetizeLink()` will not touch, double-wrap, or alter them.
- The script also independently fires a `pageImpression` beacon on every page load (confirmed via its own source and via live network capture), which is a real, separate, working CJ signal unrelated to the broken click-rewrite path. Removing the script would discard that.
- Net effect: the script is now a harmless no-op with respect to click tracking, and a continued source of impression data. No action needed, no risk identified.

## 8. Desktop Click Test Results

20 automated native-click checks (`page.click()` via CDP, not `dispatchEvent`) across 10 distinct CTAs/page types, 2 passes each:

**16 PASS / 0 FAIL / 4 SKIP** (skip = CSS selector not present on that specific page — a test-target mistake, not a site bug; confirmed by direct `grep` that those classes don't exist on that page).

Every PASS confirmed the `href` was already the full static `kqzyfj.com` CJ URL **before any click or interaction occurred** — the structural requirement ("must not depend on click-handler timing") is met by construction, not by luck.

## 9. Mobile Click Test Results

Same methodology at a 390×844 touch-enabled viewport: **16 PASS / 0 FAIL / 4 SKIP** (same 4 selector misses as desktop, same explanation).

## 10. 50-Link Destination Validation Results

50 links randomly sampled (seeded, reproducible) from a pool of 378 real candidates across 20 different pages/page types (hotel reviews, roundups, comparison pages, the hotels map, Hoi An pages, the main reviews index). Each tested with a real headless Chrome browser tracing the full redirect chain:

**50 PASS / 0 SUSPICIOUS / 0 FAIL.**

Every link: reached a CJ attribution hop (`cj.dotomi.com` or `emjcd.com` in the redirect chain), then landed on the correct Booking.com property (hotel-specific links matched their intended hotel slug; generic search links landed on Booking.com's search results page). No generic homepage landings, no wrong-city/wrong-property results, no timeouts, no redirect loops.

## 11. Explanation of `aid=1784897`

Directly observed via full redirect-chain tracing with a real browser (not assumed): **once a click is routed through CJ, our own `aid=1784897` has no effect on attribution.** CJ's redirect chain (`kqzyfj.com` → `cj.dotomi.com` → `emjcd.com` → `booking.com`) **substitutes its own Booking.com partner `aid`** (observed: `aid=8133101` for this account/advertiser pairing) and appends a `label=affnetcj-17293132_pub-8008393_site-101820678_pname-DaNang+Hotel+Guide_clkid-<our sid>_cjevent-<id>` parameter — this `label` is the actual mechanism Booking.com uses to attribute a sale back to CJ, which CJ then attributes back to this publisher account via `pub-8008393`/`site-101820678`.

Tested explicitly: including `aid=1784897` in the destination URL passed into the CJ wrapper produces an identical result (`aid=8133101` on the final hop, our `aid` silently dropped) as leaving it out. It is not wrong to include, just inert. Per the user's guidance to remove it "unless independently required," it has been stripped from the wrapped destination URL — confirmed via code review of `scripts/apply-cj-static-links.js`'s `stripAidAndSid()` — to avoid future confusion about which `aid` is live, since it is not.

**Our own `sid=` is preserved** (confirmed carried through) — it is passed as the CJ wrapper's own top-level `sid` parameter, not inside the destination URL, and correctly surfaces as `clkid-<sid>` on the final Booking.com landing page, verified directly in the 50-link test and in isolated single-link tests for multiple hotels.

## 12. Current Theory for Why CJ Still Reported 251 Clicks

From `FORENSIC-AFFILIATE-AUDIT.md`'s addendum investigation: the DLA script's click-handling code contains zero independent network calls of its own (confirmed by reading its full real-code portion). The only way a click is counted by CJ is if the browser's navigation actually reaches a CJ tracking domain — which only happens when the old click-time rewrite race was *won*. The 251 clicks are believed to be the minority of real clicks where that race succeeded, not a separate counting mechanism. A previously-missed commit pair (`b96a20b` removing the DLA script on Aug 10 after it was found causing hard connection failures, `ab76b7f` re-adding it Aug 13 without that context) means the CJ reporting window covers almost entirely the re-added, race-condition-affected period.

This is now moot going forward: the new architecture has no race to win or lose.

## 13. Remaining Attribution Risk

- **Not independently verified:** whether CJ's own dashboard "Deep Link Automation" toggle state (observed unchecked) affects anything about the `kqzyfj.com/click-<website>-<evergreen-link-id>` static-link format used here. The static format was verified to work via direct redirect-chain testing regardless of that toggle, since it does not depend on the DLA *script* at all — it's a different CJ product (static Evergreen Links) from DLA. This should still be watched in the CJ dashboard after deployment to confirm real, non-test clicks register as actions.
- **Browser coverage:** all testing in this pass used Chromium (Puppeteer + system Chrome). Safari/iOS-specific `target="_blank"` or redirect-chain behavior was not independently tested — low risk given the new architecture has no click-time JS dependency at all, but worth a spot-check post-deployment.
- **Booking.com's own bot/automation challenge** (observed as `__challenge_*` requests in several live tests) means fully-automated end-to-end verification through to a real booking confirmation is not possible from this environment; verification stopped at "correct property reached with CJ attribution parameters present," which is the right stopping point for this environment but is not literally a completed booking.
- **Historical data is not recoverable:** clicks that failed to attribute before this fix cannot be retroactively credited.

## 14. Exact Files Changed

```
scripts/apply-cj-static-links.js       (new)
scripts/audit-cj-affiliate.js          (updated checks)
bk-widget.js                           (widget URL now CJ-wrapped)
+ 231 *.html / kr/*.html files         (static href= wrapped)
+ overlapping 9 of the above also had bookingUrl:/bk: JS fields wrapped
```
Full file list available via `git diff --stat` in the working tree at the time of this report.

## 15. Rollback Instructions

Nothing has been pushed. To discard all of this in the working tree:

```bash
git checkout -- .
rm scripts/apply-cj-static-links.js
```

This restores the pre-fix state exactly (verified: this is how the mid-investigation false start on the `qksrv.net`/`type/am` format was cleanly reverted before redoing the work with the correct CJ-provided format).

If this has already been committed and pushed by the time a rollback is needed: the commit immediately prior to this fix (tagged in the commit message as the checkpoint) has the full pre-fix implementation; `git revert <fix-commit-sha>` restores it without losing history.

---

## Appendix: Full Sitewide Outbound-Path Search (proving zero untracked paths)

Per the requested audit categories:

| Mechanism | Found | Fixed | Remaining untracked |
|---|---|---|---|
| Static `href="https://www.booking.com/..."` | 1,773 | 1,773 | 0 |
| `bookingUrl:'https://www.booking.com/...'` (JS field) | ~103 | ~103 | 0 |
| `bk:'https://www.booking.com/...'` (JS field) | 26 | 26 | 0 |
| `window.open()` to booking.com | 1 (`bk-widget.js`) | 1 | 0 |
| `location.href` / `.assign()` / `.replace()` to booking.com | 0 | n/a | 0 |
| JSON-LD `"url":"https://www.booking.com/..."` | 17 | **intentionally not wrapped** | n/a — structured data read by crawlers, not clicked by users; CJ-wrapping it would misrepresent the declared resource to Google |

**Target "zero unintended direct Booking.com booking paths" — met.** The only remaining plain `booking.com` strings in the codebase are the 17 JSON-LD `url` fields, which are intentionally excluded for the reason stated above (not a booking path a user can click).

---

## 16. Production Smoke Test (performed immediately after deployment)

All tests run against `https://www.dananghotelguide.com` directly (not local files), with a real Chrome browser driven by Puppeteer, real `page.click()` native clicks (not synthetic `dispatchEvent`).

**10 live pages inspected, href present before any interaction (all confirmed via direct `curl` of the live HTML):**
`naman-retreat-da-nang.html` (4 links), `best-hotels-in-da-nang.html` (40), `luxury-hotels-da-nang.html` (17), `family-hotels-da-nang.html` (16), `da-nang-beach-hotels.html` (19), `where-to-stay-in-da-nang.html` (16), `hotel-reviews.html` (28), `boutique-hotels-da-nang.html` (16), `non-nuoc-beach-da-nang.html` (15), `da-nang-hotels-map.html` (60). All ten: CJ link present, zero raw `booking.com` hrefs.

**10 real desktop clicks (1440×900, real Chrome click):** **10/10 PASS.** Every click: href was already a `kqzyfj.com` link before the click; a new tab opened; where the new tab was caught mid-redirect, full CJ attribution was visible live (one captured example: `aid=8133101&label=affnetcj-17293132_pub-8008393_site-101820678_pname-DaNang+Hotel+Guide_clkid-da-nang-beach-hotels_cjevent-e8e391fbc16911f183ae00120a18b8f8`).

**10 real mobile clicks (390×844, touch-enabled viewport):** **10/10 PASS**, same methodology, same result pattern, including a second live attribution-parameter capture for `luxury-hotels-da-nang` with a distinct `cjevent` ID, confirming the mechanism works independent of viewport.

**Booking widget (`bk-widget.js`) test:** confirmed loaded on production; real button click (`.sw-bk-btn`) on `hotel-reviews.html` (the widget only renders on pages with a matching hero class, per its own `heroConfig` logic — confirmed `.bb-hero` qualifies) opened a new tab landing on Booking.com's search results page, confirming the dynamically-built URL correctly routes through the CJ wrapper before `window.open()`.

**JS-generated link test (`bookingUrl`/`bk` fields):** confirmed on production that `da-nang-hotels-map.html`'s inline JS data array contains CJ-wrapped `kqzyfj.com` links (34 already rendered into live map-popup anchors in the DOM on page load).

## 17. Gap Found and Closed During the Smoke Test

The full 202-page production audit (Section 18) initially found **14 unwrapped links across 4 live pages**: `furama-resort-da-nang.html` (3), `furama-vs-pullman-da-nang.html` (5), `fusion-suites-da-nang.html` (3), `grand-mercure-da-nang.html` (3). These 4 files had been excluded from the first commit out of caution, because they also carried unrelated, separately in-progress editorial changes in the working tree at the time the fix was built. On inspection, their actual working-tree diff at commit time was **100% the CJ fix with zero unrelated content** — the caution was unwarranted. Committed and deployed separately as `8e33e86`, confirmed live 2026-10-06T09:45:40Z. Re-running the full production audit afterward (Section 18) confirms zero remaining.

## 18. Final Production Audit Result

All 202 URLs in the live sitemap (`https://www.dananghotelguide.com/sitemap.xml`) downloaded directly from production and scanned with the same unwrapped-link detection logic as `scripts/audit-cj-affiliate.js`:

```
Pages scanned: 202
Total kqzyfj.com CJ links found across all live pages: 1528
Pages with UNWRAPPED raw booking.com href=: 0
Pages with UNWRAPPED raw bookingUrl/bk JS fields: 0
Pages with any awin1.com reference: 0
```

**Total remaining untracked Booking.com paths on live production: ZERO.**

## 19. One Additional File, Zero Live Impact

`guides-da-nang-hotel-prices-by-month.html` also had the old unwrapped-link pattern locally, same as the 4 files in Section 17. Unlike those 4, this file's URL itself 308-redirects to `/da-nang-hotel-prices-by-month.html` on production and does not appear in the live sitemap — meaning no real visitor ever reaches its content or its internal links directly; the redirect happens before the page body is served. Fixed for completeness and consistency with the rest of the codebase, but this one carried zero actual revenue risk, unlike Section 17's 4 pages which were real, live, directly-served content.
