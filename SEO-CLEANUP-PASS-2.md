# SEO Cleanup Pass 2

Deployed: 2026-10-06, commit `59eb2b2` (main branch, pushed to `ryanryousefi-ctrl/dananghotelguide`).

Follow-up to the Revenue Acceleration SEO pass (three new hotel pages + Tier A
contextual linking). This pass closes gaps found during that work: unresolved
`[VERIFY]` markers, an invalid-JSON-LD defect, a fabricated structured-data
rating, missing hotel-page internal linking, and a factual contradiction
between two pages about the same hotel.

## 1. New-page verification status

The three pages created in the previous pass (`sanouva-da-nang.html`,
`pavilion-hotel-da-nang.html`, `haian-riverfront-da-nang.html`) each had one
or two `[VERIFY: ...]` placeholders for distance claims. All were resolved
with sourced figures before this deploy — zero `[VERIFY]` markers remain on
any of the three pages:

| Page | Claim | Resolution |
|---|---|---|
| Sanouva | Distance to My Khe Beach | 2.9 km, ~10-15 min taxi/Grab |
| Pavilion | Distance to My Khe Beach | 350-400m, ~5 min walk (address: 35 Vo Van Kiet) |
| HAIAN Riverfront | Distance to My Khe Beach | 3.8 km, ~10 min taxi/Grab |

Sourcing came from cross-referencing multiple OTA listings (Booking.com,
Agoda, Tripadvisor, Trip.com) per claim; Pavilion's distance had the widest
spread across sources (150m-400m depending on straight-line vs. walking-route
convention) and was resolved to the figure with the most independent
corroboration.

The "Property photo pending" placeholder (used on Sanouva and Pavilion, which
have no verified property photo in the image library) was redesigned from a
plain gradient box with placeholder-style text to an intentional-looking
treatment: a location-pin icon, the hotel name, and a clear "No verified
property photo on file yet" label. No stock or scraped imagery was
substituted — per the no-fabrication rule, an unavailable photo stays
unavailable rather than being faked. HAIAN Riverfront already had a real
photo in `images/hotels/` and uses it.

## 2. Schema bug root cause

**What broke:** At some earlier point, a templating step interpolated live
HTML (`<a href="...">text</a>`) directly into schema.org `Article.description`
and `FAQPage.acceptedAnswer.text` string values. JSON strings can't contain
unescaped double quotes, so wherever this happened the surrounding
`<script type="application/ld+json">` block failed to parse — invalid
structured data, silently ignored by Google.

**Actual scope:** The original report from the prior pass estimated this
affected "~230 pages." That number was never verified against a real JSON
parse — it was inferred from a rough content-pattern count. Running the
JSON parser against every `<script type="application/ld+json">` block
sitewide found the real number: **10 invalid blocks across 8 files**
(`hyatt-regency-da-nang.html`, `intercontinental-da-nang.html`,
`marriott-resort-da-nang.html`, `melia-da-nang.html`,
`premier-village-da-nang.html`, `pullman-da-nang.html`,
`radisson-blu-da-nang.html`, `sheraton-grand-da-nang.html`).

**A second, bigger issue surfaced during the investigation:** 26 pages
(including those 8) carried a schema.org `Review` block with a
`reviewRating.ratingValue` (e.g. `"4.3"` on a 1-5 scale) that was hand-typed,
not sourced from any real guest-review aggregate — it didn't even
consistently match the page's own visible 1-10 editorial score (e.g.
InterContinental: schema said 4.8/5, page displayed 9.4/10 — a 4.8/5 would be
9.6/10). Per explicit instruction, this was treated as fabricated structured
data and removed rather than reconciled.

### Fix applied (`scripts/fix-schema-defects.js`)

Mechanical, sitewide, idempotent:
1. Strip embedded `<a href="...">text</a>` tags from any JSON-LD string
   field, keeping the visible text, discarding the markup.
2. Remove the entire `Review` script block from any page where it carries a
   `reviewRating` — judged not defensible without a real rating source.
   `Review` blocks with no rating (24 legacy `review-*.html` duplicate pages,
   which all canonicalize elsewhere anyway) were left alone; they were
   already valid.

### Schema types before and after

| | Before | After |
|---|---|---|
| Files with `Review` + fabricated `reviewRating` | 26 | 0 |
| Files with invalid (unparseable) JSON-LD | 8 | 0 |
| Total JSON-LD blocks sitewide | 543 | 533 (26 Review blocks removed, 16 other blocks fixed in place) |
| Visible on-page editorial scores (e.g. "8.5/10") | unchanged | unchanged — this was a structured-data-only fix |

### Validation

- **Mechanical, full sitewide:** every `<script type="application/ld+json">`
  block across all 213 HTML files parsed with `JSON.parse` after the fix.
  Result: 533/533 blocks valid, 0 failures.
- **Representative pages, individually inspected:** 25+ pages spot-checked
  by hand, including all 8 originally-broken files, 5 of the 26
  Review-removal files, and the 5 Tier A money pages (which were never
  affected by this bug).
- **The 3 new pages:** confirmed valid from creation (written with plain-text
  JSON-LD from the start, no embedded HTML).
- **Number passing / failing:** 533 passing, 0 failing, 0 remaining causes.

No `AggregateRating` was added anywhere — the site doesn't collect its own
guest ratings with a visible count, so there's no genuine aggregate to
assert. The remaining `starRating` fields on `da-nang-hotel-directory.html`
(a `Hotel`/`ItemList` schema, not `Review`) were left untouched: those
represent each hotel's official star classification, a verifiable fact, not
a guest-review opinion score, so they don't have the same defensibility
problem.

## 3. Contextual-link coverage

**Scope correction:** the prior pass's report also estimated "~230
individual hotel pages" lacking contextual links to the Tier A money pages.
A verified count (hero-section class + self-referencing canonical tag,
excluding category/roundup pages) found the real number: **29 individual
hotel pages sitewide**, of which 3 are the newly created pages (already
carrying their own hand-written link block) and 26 are pre-existing.

A reusable block (`scripts/add-tier-a-links.js`) was added to all 26
pre-existing pages, inserted directly before `<footer class="site-footer">`
— the one structural element verified present on every target page
regardless of which hero/FAQ template variant the rest of the page uses.

**Selection logic:** each page's 2-3 links were chosen from its property
type (luxury/family/beach/value, cross-referenced against the `categories`
tags already in `hotel-reviews.html`'s own data and each hotel's district),
not applied uniformly:

| Pattern | Example | Links given |
|---|---|---|
| Luxury beachfront resort | InterContinental, Naman Retreat | Luxury + Best (+Beach where applicable) |
| Family resort | Sheraton Grand, Hyatt Regency | Family + Best/Luxury + Where to Stay |
| City/business hotel | Hilton, Grand Mercure, Azura | Best + Where to Stay |
| Beachfront value/midrange | A La Carte, TMS, Wyndham Soleil | Beach + Where to Stay |

Anchor text is varied per page via a deterministic hash (same destination,
different pages → different phrasing, e.g. "our luxury hotel roundup" vs.
"the five-star picks" vs. "our five-star picks across Da Nang") rather than
repeating identical exact-match text sitewide. Sentence framing also
alternates between two templates depending on link count (2 vs. 3).

### Coverage counts

- **Pages receiving a contextual-link block:** 26 of 26 configured (100%)
- **Links by Tier A destination:**
  - Best Hotels in Da Nang: 15
  - Beachfront Hotels in Da Nang: 17
  - Where to Stay in Da Nang: 13
  - Luxury Hotels in Da Nang: 7
  - Family Hotels in Da Nang: 5
- **Pages intentionally excluded:** none among the 26 configured pages — all
  had the required `<footer class="site-footer">` anchor and received the
  block. The 24 non-canonical `review-*.html` duplicate pages were excluded
  by design (they carry `rel=canonical` pointing elsewhere, so Google
  consolidates ranking signal to the canonical page regardless of their
  internal links).

Per instruction, the main navigation was not touched for this task, no page
received all five links, and no identical link block was copy-pasted
verbatim across pages — selection and phrasing are both page-specific.

## 4. Radisson Blu contradiction — correction

**The discrepancy:** `radisson-blu-da-nang.html` (the dedicated review page)
explicitly and correctly stated no waterpark exists at this property,
naming Mikazuki (a separate, Japanese-operated resort in Lien Chieu
district) as the actual waterpark hotel in Da Nang. Meanwhile,
`hotel-reviews.html`'s card-grid entry for the same hotel described
"the waterpark, slides, wave pool, splash zone" as the property's defining
feature — directly contradicting the dedicated page.

**Verification before changing copy:** the dedicated review page's claim is
the more specific, detailed one (explicitly addresses and rules out the
waterpark confusion, names the real waterpark property). No new external
verification was needed beyond confirming internal consistency, since the
review page's own content already represents the site's researched
position.

**Fix:** `hotel-reviews.html`'s card copy was rewritten to describe the
property's actual standout feature (the rooftop infinity pool over My Khe
Beach, matching the review page's own "Reason to Book It" section) and
explicitly notes there's no waterpark, redirecting that interest to
Mikazuki. One accurate statement now exists across the site.

## 5. Deployment

- Commit: `59eb2b2` — "SEO cleanup pass 2: fix schema defects, resolve
  VERIFY markers, add hotel-page internal linking"
- Pushed to `main` (`efd73a5..59eb2b2`)
- 39 files changed: 3 new pages, 2 new scripts
  (`scripts/fix-schema-defects.js`, `scripts/add-tier-a-links.js`), 34
  modified HTML/JSON/XML files
- Pre-deploy validation: CJ affiliate audit (241 files, 0 issues), JSON-LD
  (533/533 valid), internal link resolution (all targets confirmed to
  exist), mobile rendering (26 modified hotel pages + 5 Tier A pages
  spot-checked at 390×844 viewport, 0 horizontal overflow, link block
  renders visibly on every sampled page), sitemap/canonical validation
  (valid XML, canonicals match `og:url` on new pages), zero `[VERIFY]`
  markers on the 3 new pages, zero unrelated files in the commit (`git
  status` reviewed before staging).
- Core CJ affiliate URL architecture (`kqzyfj.com/click-101820678-17293132`)
  was not modified in any way during this pass.

## 6. Recommended Search Console checkpoints

**Day 7 (2026-10-13):**
- Confirm Google has crawled/indexed the 3 new pages
  (`site:dananghotelguide.com sanouva-da-nang.html` etc., or check Coverage
  report for new URLs).
- Check Rich Results Test on 3-5 of the 26 schema-fixed pages to confirm the
  Article/FAQPage schema is now parsing in Google's own validator, not just
  passing a local JSON parse.
- Watch for any indexing warnings on the 26 pages where the `Review` schema
  was removed — expected to show as "schema removed," not an error.

**Day 14 (2026-10-20):**
- Pull fresh Queries.csv and check position movement on the three
  highest-value Tier A gaps this pass targeted directly: "sanouva danang
  hotel reviews" (was pos 15.0, 80 impr, 0 clicks), "brilliant hotel danang"
  type branded queries, and the five Tier A money pages' head terms.
  Two weeks is early for ranking movement but early CTR movement on
  existing positions is worth checking.
- Check whether any of the 26 hotel pages show impression/click changes
  correlating with the new contextual links (unlikely to be dramatic this
  early, but worth a baseline note).

**Day 30 (2026-11-05):**
- Full re-pull of Tier A opportunity list (impressions ≥20, position ≤25,
  zero clicks) and compare against the original 27-query baseline from the
  prior pass. Expect to see Sanouva, Pavilion, and HAIAN Riverfront queries
  either drop off the zero-click list (if a page now exists and ranks) or
  remain flagged as needing further content work.
- Check whether the five Tier A money pages show average position
  improvement attributable to the new inbound contextual links from the 26
  hotel pages — this is the metric most directly tied to this pass's
  internal-linking work.
- Re-run the sitewide JSON-LD and CJ affiliate audits
  (`node scripts/fix-schema-defects.js --dry-run` should report 0 changes
  needed; `node scripts/audit-cj-affiliate.js` should still report 0 issues)
  to confirm no regression crept in from unrelated edits in the interim.
