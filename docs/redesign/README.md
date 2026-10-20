# Da Nang Hotel Guide 2.0: sitewide redesign

Branch `sitewide-redesign` · baseline (production at the time) `7ed26a79075410fbec242b51ddf654110ed101d5`
**Not merged, not deployed.** Production and the `tripcom-migration` / `fix-mobile-hero` branches are untouched.

## What changed

| | |
|---|---|
| Pages rebuilt | all 202 served pages (EN + KR) + a new homepage |
| New files | `dn-design.css` (design system), `dn-home.css`, `dn.js`, `dn-home.js`, `dn-consent.js`, 26 WebP derivatives in `images/dn/`, `scripts/redesign/*`, this folder |
| Edited shared files | `phase10.css`, `phase13.css`, `hotel-review-modern.css`, `hotel-vs-hotel.css`, `search-ui.css` (palette only), `.vercelignore` (allow the new assets) |
| No longer referenced | `cta-polish.css`, `bk-widget.css/.js`, `premium.css`, `phase10_5.css` (files left in the repo; delete after launch) |
| Unchanged | URLs, titles, descriptions, canonical/hreflang/robots, JSON-LD, headings, body copy, images, internal links, `sitemap.xml`, `robots.txt`, analytics/AdSense tags, the affiliate links themselves |

## Design system

Independent travel magazine: warm paper ground, ink type, one brass accent, flat hairline cards, large photography.
- **Type:** Newsreader (serif headlines, reading text in reviews) + Hanken Grotesk (UI/body); Noto Sans KR on Korean pages.
- **Colour:** paper `#faf8f3`, ink `#161d1c`, deep `#12201f`, accent brass `#80622a` (light brass `#c8a762` on dark grounds). All text pairs ≥ 4.5:1 (checked). Trip.com blue appears only on official booking buttons (after the cutover).
- **Chrome:** one masthead (sticky, dropdown panels, "More" collapses About/Videos), full-screen accordion mobile menu, one footer. All generated from `scripts/redesign/chrome.js`.
- **Hero:** every inner page's hero is normalised to one editorial hero (image / plain / dark variants, comparison pair).
- **Buttons (rebuilt from scratch):** `dn-btn` (ink, booking), `dn-btn--ghost` (secondary), `dn-booklink` (in-text), `dn-imglink` (photo links). One booking button per hotel and per generic search on a page; earlier duplicates became text links (117 links; none removed). Runtime-rendered links (map popups, JS cards) are classified by `dn.js`.
- **Homepage:** editorial hero, "Find your hotel" chooser (links to our own guides: no widget, no dates), asymmetric collections, neighbourhood mosaic, reviews, guides, one booking band, one eSIM line (affiliate kept).
- **Reference site:** travelcurator.com blocks automated browsers (Cloudflare bot check), so it could not be viewed. The design follows the brief's description of its qualities, not its actual layouts.

## How it is built (repeatable)

Pages are **generated from the baseline commit**, not edited by hand:

```
node scripts/redesign/build.js        # regenerate all pages (add --no-consent to omit the consent layer)
node scripts/redesign/inventory.js    # before/after check vs baseline (SEO, JSON-LD, headings, links, images, text, affiliate links)
node scripts/redesign/sweep.js        # browser sweep, every page, widths 1280 + 390 (or --widths ...)
node scripts/redesign/behavior.js     # 22 interaction tests (menu, search, map, directory, GA4 events, consent)
```

**Rebasing onto a newer `main`:** put the new commit SHA in `docs/redesign/BASELINE.txt`, run `build.js`, then `inventory.js`; commit. Editorial edits made on `main` after the baseline are picked up automatically because pages are re-read from the baseline.
Page content overrides live in `OVERRIDES` in `build.js` (only the privacy page; each must match exactly once or the build reports it).

## Trip.com migration readiness (separate, gated)

The redesign ships with the **current Booking.com/CJ links**, unbranded; no Trip.com logo appears. Tested on a throwaway copy: the migration branch's registry, decisions, `apply.js --preview` and `validate.js` run on the redesigned pages with **0 unresolved links and 0 unknown disclosures** (all 1,503 Trip.com destinations place; Trip.com blue buttons render in the new geometry via `dn-design.css`).
At cutover: copy the migration branch's files in (or merge it after the redesign), re-run `build-registry.js` (counts changed slightly: footer links and the demotions below), generate links, `apply.js --write`. Nothing in the redesign depends on Trip.com's reply.
Known adaptation: none needed after a boolean-attribute fix (`defer`) made during this work.

## Booking links: what changed (all accounted for)

| | Links |
|---|---|
| Original booking links on served pages (the earlier audit said 1,583; `main` has gained one since) | 1,584 |
| Footer "Book via Booking.com" links replaced by the new footer | −34 |
| Homepage rebuilt (old widget and bands → one booking band; header/menu buttons stay) | −5 |
| Korean pages: the mobile menu now repeats the header button (22 pages had none) | +22 |
| **Result** | **1,567** |
| Duplicates demoted from button to text link (kept and tracked, so not a change in count) | 117 |

`inventory.js` lists the exact per-page differences and fails on any other loss or addition.

## Consent and privacy (needs your review; not legal advice)

See `CONSENT.md`. Google Consent Mode v2: denied by default in the EEA, UK, Switzerland and Vietnam, granted elsewhere; accept/reject banner; "Privacy settings" in the footer. `privacy.html` corrected (it said the site sets no cookies and uses no analytics). **Not** a Google-certified TCF consent platform; AdSense in the EEA/UK/CH needs one. Switch the whole layer off with `build.js --no-consent`.

## Rollback

1. **Before merge:** nothing to roll back; production never changed.
2. **After deploying:** Vercel → project → Deployments → promote the previous production deployment (instant, no rebuild).
3. **In git:** `git revert -m 1 <merge commit>` (or revert the single squashed commit) and push.
4. Independence: the redesign and the Trip.com cutover are separate commits; either can be reverted without the other.
5. Recovery points: production commit `7ed26a7`; branch `sitewide-redesign`; branches `tripcom-migration`, `fix-mobile-hero` preserved.

## Known issues and limitations

- **Hotel directory** keeps its table (the data has photos for only a few hotels; I won't show one hotel's photo for another). Cards would need a photo audit first.
- **Hotel review pages** are reskinned (new hero, snapshot, typography, buttons), not restructured.
- **Web fonts** add ~290 KB (variable fonts); page weight still fell sharply (see report). A subset could save ~150 KB.
- **CJ impression tag (`yceml.net`) and YouTube embeds** are not controlled by the consent choice (the tag disappears at the Trip.com cutover; embeds now use the cookie-free domain).
- `my-khe-beach-da-nang.html` has an empty `<img src="">` placeholder for a map popup (pre-existing, filled by JS).
- Some pages carry old per-page inline CSS (4 MB across the site); the new stylesheet overrides it. A later cleanup could delete the dead rules.
- Legacy wording on legal pages (terms, about, footers) still names Booking.com; that changes at the Trip.com cutover.
