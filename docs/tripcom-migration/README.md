# Booking.com (CJ) → Trip.com migration

> **2026-10-21 (later): links generated and the conversion is built on the redesign.** Read `STATUS-2026-10-21.md` first.

> **2026-10-21 update.** Rebased onto the live 2.0 redesign as branch `tripcom-on-redesign` (from production `a882153`).
> Start with **ATTRIBUTION-VALIDATION.md** (what is proven and what is not), then `OWNER-DASHBOARD-GUIDE.md`,
> `PILOT-PLAN.md`, `ACCOUNT-READINESS-CHECKLIST.md`, and `CUTOVER-READINESS.md` (regenerate with `node scripts/tripcom/readiness.js`).
> New tooling: `link-profile.js` (learns the real link format), `selftest.js`, `readiness.js`, strict `validate.js --pilot/--cutover`,
> `apply.js --pilot`, hash-locked provenance in `worksheet.js import`.
> **Carry-over still needed before cutover:** editorial commit `b4ab778` (Sel de Mer is now Prince Hotel Da Nang; Seahorse Tropical Natalie card) exists only on `tripcom-migration`; production still shows the old text. Port it to the redesigned pages first (4 files, one link less).
> The redesign has no booking widget, so `tripcom-widget.js` and the widget links are only required if a page still uses one (auto-detected).

Branch: `tripcom-migration` (local only, not pushed; Vercel builds a preview for every pushed branch).
Trip.com Partners account: Alliance ID `11013066`, Site ID `333523744`.

**Status: prepared, not deployed.** Every page on this branch still carries the
working CJ/Booking.com links. The tooling below converts the site in one step,
once every hotel and city has an official affiliate link generated in the
Trip.com Partners dashboard.

## What is in this branch

| Path | Purpose |
|---|---|
| `data/tripcom/registry.json` | Single source of truth: one entry per Booking destination (141), covering all 1,583 links |
| `data/tripcom/hotel-matches.csv`, `search-destinations.csv` | Verified Trip.com matches the registry is built from |
| `data/tripcom/cj-historical-inventory-2026-10-16.csv` | Frozen copy of the CJ/Booking mapping. Keep until the migration is validated |
| `scripts/tripcom/build-registry.js` | Rebuilds the registry from pages + CSVs; never overwrites pasted affiliate URLs |
| `scripts/tripcom/apply.js` | Cutover: dry run (default), `--write`, or `--preview DIR` |
| `scripts/tripcom/validate.js` | Validation gate (static, `--render`, `--ga`, `--destinations`) |
| `scripts/tripcom/lib.js` | Shared page/link parsing and the affiliate-URL format check |
| `tripcom-cta.css` | Button component (`.tc-btn`, `.tc-link`, variants) |
| `tripcom-cta.js` | Runtime: upgrades JS-rendered buttons + GA4 `affiliate_click` |
| `tripcom-widget.js` | Sitewide hotel widget, replacing `bk-widget.js` |
| `assets/brand/tripcom-logo.webp` / `.png` | Trip.com wordmark (see "Logo" below) |

`.vercelignore` is an allowlist: `data/`, `scripts/` and `docs/` are never deployed.
`tripcom-cta.js` and `tripcom-widget.js` must be added to it at cutover (step 6).

## Architecture

```
Trip.com Partners dashboard ── (you generate links) ──▶ registry.json  affiliate_url
                                                             │
pages (*.html, kr/*.html) ──▶ apply.js ──▶ static hrefs + button markup + disclosures
                                                             │
                     tripcom-cta.js (runtime) ── upgrades JS-rendered buttons
                                              └─ GA4 affiliate_click (one per click)
                     tripcom-widget.js ─────── widget links from registry.widget
```

- **Direct links, no redirects.** Each `href` is the exact URL Trip.com's link
  generator produced, copied into `affiliate_url`. Nothing assembles or edits
  tracking parameters. `lib.affiliateUrlProblems()` only *checks* a pasted URL:
  HTTPS, a `trip.com` host, `Allianceid=11013066`, `SID=333523744`, and no
  fixed check-in/check-out dates. Adjust the check if Trip.com's real format differs
  (checklist item 2).
- **No partial cutover.** `apply.js --write` refuses to run while any
  destination lacks an official URL, so a page never mixes providers.
- **Fallbacks are explicit.** Hotels with no Trip.com listing get a
  `fallback_key` (for example `search:Da Nang Municipality, Vietnam|6232|region`
  to use the Da Nang city link) or are edited out of the content. Never implied.
- **Registry entry fields:** `key`, `name`, `location`, `booking_destination`,
  `tripcom_id`, `tripcom_type`, `tripcom_name`, `tripcom_destination` (plain
  URL, reference only), `affiliate_url`, `affiliate_url_source`, `generated_at`,
  `fallback_key`, `status`, `confidence`, `notes`, `link_count`, `mechanisms`,
  `pages[]`.

## Button component

One add-on class on the existing button, so each layout keeps its size and position:

```html
<a class="hotel-card-cta tc-btn" href="…official link…" data-provider="tripcom"
   data-tc-key="hotel:hilton-da-nang" data-hotel="Hilton Da Nang" data-cta-location="hotel_card"
   aria-label="Check Prices for Hilton Da Nang on Trip.com, opens in a new tab"
   target="_blank" rel="nofollow noopener sponsored">
  <span class="tc-btn__logo"><img src="/assets/brand/tripcom-logo.webp" alt="" width="58" height="14"></span>
  <span class="tc-btn__text">Check Prices</span>
</a>
```

- Blue `#1d4ed8` with white text (contrast 6.7:1); hover `#1e40af` (8.7:1);
  yellow focus ring.
- Variants:
  - `--compact` (nav, map popups, directory rows);
  - `--block` (mobile menu, widget);
  - `--lg`.
- 44px minimum tap target on touch screens. Text wraps under the logo in very
  narrow boxes. Reduced-motion and Windows high-contrast are supported.
- Accessible name = visible label + hotel + "on Trip.com, opens in a new tab"
  (WCAG 2.5.3, label in name). The logo `<img>` is decorative (`alt=""`).
- Links inside running text become `.tc-link`: a normal link with a small logo
  after it.
- Image-card links (whole-card photos) only get the new `href`.
- Only hotel-booking links are touched. Nav, newsletter and other buttons are
  untouched. The header "Search Stays" button *is* a hotel-booking link, so it
  is branded.
- Specificity: `cta-polish.css` forces booking buttons white, including a
  `[data-cta-location]` rule at (0,4,1). The component uses `:not(#tc-n)` for
  ID-level weight, so `cta-polish.css` stays unchanged.

**Logo:** the wordmark is Trip.com's own current header asset (served from
`ak-d.tripcdn.com/images/05E5p12000cga1phzA0ED.webp`). No official brand kit or
press-logo page was found. Replace it with the asset from the Partners
dashboard banners, or one Trip.com support sends, if their guidelines require
it (checklist item 5).

## GA4

`tripcom-cta.js` sends `affiliate_click` once per click (click and middle-click;
a WeakMap 800 ms guard stops double events on touch browsers). Its parameters:

| Parameter | Value |
|---|---|
| `provider` | `tripcom` |
| `hotel_name` | `data-hotel` (null for city/search links) |
| `page_path` | `location.pathname` |
| `cta_location` | `data-cta-location` (`untagged` if missing) |
| `device_category` | `mobile` < 768px, `tablet` < 1100px touch, else `desktop` |
| `link_key` | registry key (`data-tc-key`) |
| `destination_type` | `hotel` or `city` |

The legacy `booking_click` listener (`booking-cta-tracking.js`) is unloaded at
cutover. It only matches CJ links anyway, so no click can fire both events.
In GA4 Admin → Custom definitions, register the event-scoped dimensions
`provider`, `hotel_name`, `cta_location`, `device_category`, `link_key` and
`destination_type`. Mark `affiliate_click` as a key event if you want it in
reports.

**A click is not a commission.** Trip.com pays on completed stays after
check-out (dashboard reporting). GA4 clicks are an upper bound; reconcile
monthly in the Trip.com Partners dashboard.

## Cutover runbook (only after Trip.com's answers and official links)

1. `git -C ~/dananghotelguide-tripcom fetch && git rebase origin/main`, so
   content written since this branch was made is included. Then
   `node scripts/tripcom/build-registry.js`: new or changed links show up as
   `UNMATCHED`/new keys. Match them before continuing.
2. In the Trip.com dashboard, generate one link per registry entry with a
   `tripcom_id`. Paste each into `affiliate_url`, with `affiliate_url_source`
   (`"dashboard deep link"`) and `generated_at`. Set `widget.danang` and
   `widget.hoian` (city links 1356 / 1775). Set the dated templates only if
   Trip.com gives a dated format in writing.
3. Decide every non-VERIFIED entry (see `manual-verification.md`): verify, set
   `fallback_key`, or edit the link out of the content.
4. `node scripts/tripcom/apply.js` (dry run) must report **0 blocked**.
5. `node scripts/tripcom/apply.js --write`.
6. Add `!/tripcom-cta.js` and `!/tripcom-widget.js` to `.vercelignore`.
   `tripcom-cta.css` and `assets/` are already covered.
7. Editorial pass: `tripcom-editorial-review.csv` (written by
   `validate.js --dir <copy>`) lists the remaining Booking.com mentions, about 90.
   Fix the misleading ones (prices "via Booking.com", "Not currently listed on
   Booking.com" badges, privacy/terms/about wording, meta descriptions). Keep
   legitimate editorial references.
8. Update `privacy.html` and `terms.html` for Trip.com (cookies, the 30-day
   window, payments handled by Trip.com) and `CLAUDE.md`'s affiliate section.
9. Validation, all must exit 0:
   `node scripts/tripcom/validate.js`,
   `node scripts/tripcom/validate.js --render --ga`,
   `node scripts/tripcom/validate.js --destinations`.
10. One manual end-to-end check per Trip.com's instructions (their test or
    preview mode if they provide one). **Do not** send repeated clicks through
    production affiliate links to test reporting.
11. Commit, then deploy (owner's decision).

## Rollback

- **Before deploy:** nothing is live. Delete the branch, or `git checkout -- .`
  after a trial `--write`.
- **After deploy, instant:** in Vercel → Deployments, promote the previous
  production deployment (one click, no rebuild). CJ links come back exactly
  as they were.
- **After deploy, in git:** `git revert <cutover commit>` and push. The cutover
  is designed as a single commit so this restores every page, script include and
  disclosure.
- The CJ account, Evergreen link `click-101820678-17293132` and the historical
  mapping (`data/tripcom/cj-historical-inventory-2026-10-16.csv`) stay
  untouched, so the revert works as long as the CJ program is active. Don't
  close the CJ account until Trip.com commissions are confirming.

## Numbers (inventory 2026-10-16)

- **Served pages:** 202 with booking links; 1,583 CJ links:
  - by mechanism: 988 static, 394 nav buttons, 201 JS-rendered;
  - by destination: 915 hotel-specific (117 Booking slugs), 668 search/region (24 destinations).
- **Booking hotel slugs (117):**
  - 100 verified, covering 822 links and 91 unique Trip.com properties;
  - 6 need manual checks (47 links);
  - 11 are not on Trip.com (46 links).
- **Search destinations (24):** 14 verified (Da Nang 1356 alone carries 610
  links), 3 need copy review, 7 hotel-name searches have no Trip.com listing.
- **Preview build:**
  - 202 pages converted;
  - 254 disclosure rewrites, 20 caption rewrites, 17 JSON-LD Booking URLs removed;
  - CJ impression tag removed from all served pages;
  - 0 static validation failures.

## Owner decisions (16 Oct 2026)

Recorded in `data/tripcom/decisions.json` and merged by `build-registry.js`.
Each destination has a `decision`:

| Decision | Meaning |
|---|---|
| `map` | Button uses the entry's own official Trip.com link |
| `fallback` | Button uses another entry's link (`fallback_key`), optionally relabelled. Used for Azura's review page → Da Nang list |
| `remove` | Button removed; content, photos and hotel names stay. JS-rendered cards drop dead links at runtime (`tripcom-cta.js`) |
| `hold` / `investigate` | Blocks `apply.js --write` until decided |

`overrides` route individual links (page + CJ sid, with an `expect` count that
fails the build if content changes). For example, the five villa-specific
Marriott links go to 7362595 and the rest to 993558.

Current totals (after the six unresolved hotels were deferred, 16 Oct 2026):
- 1,583 original CJ links;
- 1 link went with an editorial correction (the Seahorse Tropical Natalie card left the An Thuong guide), leaving 1,582;
- 64 buttons removed (41 by decision + 23 deferred, see `deferred-hotels.md`);
- 1,518 Trip.com links, covering 106 Trip.com pages (`link-worksheet.csv`);
- 0 links blocked by open decisions.

Legal and disclosure drafts for approval: `legal-and-disclosure-drafts.md`.
