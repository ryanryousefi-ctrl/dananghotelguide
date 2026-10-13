# Da Nang Hotel Guide — Project Briefing

## Site overview

Independent travel affiliate site for hotels, dining, and travel in Da Nang, Vietnam.
Publisher: Ryan Yousefi (local expat, 20+ years journalism background).
Hosted on Vercel. Source on GitHub at ryanryousefi-ctrl/dananghotelguide.
Deployed via git push to main branch.

## File structure — CRITICAL

Flat file structure. ALL HTML files live in the repo root.
Internal links MUST be relative with NO leading slash: `href="filename.html"`
NEVER use `href="/filename.html"` or `href="guides/filename.html"` — leading slashes cause 404s on Vercel.

## Affiliate parameters

- CJ website (promotional property) ID: `101820678` — publisher CID `8008393`
- CJ advertiser: Booking.com North America `7864295`, Evergreen Link ID `17293132`
- Booking.com `aid=1784897` is INERT once a click routes through CJ (CJ substitutes its own aid + `label=affnetcj-...`). Do not add it to new links.
- Da Nang generic search: `dest_id=6232&dest_type=region`
- Hoi An dest_id: `-3723930` (city-level, correct for Hoi An)
- NEVER use dest_id `-3714993` (wrong Hanoi ID) or `-3730689` (stale city-level Da Nang ID)
- DO NOT reintroduce Awin. Awin was the previous affiliate network. CJ is current.

## Affiliate network: CJ (Commission Junction) only — STATIC links

Every commercial Booking.com link is a complete, static CJ click URL at page load.
Nothing depends on JavaScript rewriting an href at click time (CJ Deep Link
Automation was proven to fail on `target="_blank"` clicks — see FORENSIC-AFFILIATE-AUDIT.md,
CJ-STATIC-LINK-FIX.md, CJ-TRACKING-INVESTIGATION-2026-10-13.md).

### Link format

```
https://www.kqzyfj.com/click-101820678-17293132?sid=<SID>&url=<url-encoded booking.com destination>
```

- Hotel: `url=https%3A%2F%2Fwww.booking.com%2Fhotel%2Fvn%2F<slug>.html`
- Da Nang search: `url=https%3A%2F%2Fwww.booking.com%2Fsearchresults.en-us.html%3Fss%3DDa%2BNang%2BMunicipality%2C%2BVietnam%26dest_id%3D6232%26dest_type%3Dregion%26lang%3Den-us`
- SID: `<page-basename>--<hotel-slug>`, hyphens/letters/digits only (70 chars verified to pass through intact).
- Applies everywhere a booking URL can reach a visitor: `href=`, JS data arrays (`bookingUrl:`, `bk:`, JSON `"b":`),
  and `window.open()` builders (build the booking URL, then wrap it with `encodeURIComponent` into the CJ URL — see `bk-widget.js`).
- `window.open(..., 'noopener')` — not `noreferrer`; CJ records the referring page.
- Verify a hotel slug resolves on Booking.com before using it — dead slugs silently land on a city page.

### CJ page script

Every page loads, at page bottom:

```html
<script src="https://www.yceml.net/am_gen/101820678/impressions/page/am.js"></script>
```

Page-impression reporting only. Do NOT use the `anrdoezrs.net/am/...` URL CJ's dashboard shows:
as of 2026-10-13 it 302-redirects to plain `http://`, which browsers block as mixed content.

### How to create new Booking.com affiliate links

Write the link with a raw `booking.com` href, then run `node scripts/apply-cj-static-links.js`
(idempotent) to wrap it. Or hand-write the CJ format above.

### How to validate affiliate links

- `node scripts/audit-cj-affiliate.js` — local files: raw hrefs, raw URL literals in JS/JSON, wrong IDs, Awin, CJ script host.
- `node scripts/audit-cj-live.js` — crawls PRODUCTION (sitemap + internal links). Run after every deploy that touches pages.

### Hotel registry

`scripts/hotels.json` — canonical list of all hotels with slugs, city, district, and status.

## Design system

- Fonts: Instrument Serif (headings), Satoshi (body)
- Color palette: `ocean-deep`, `coral`, `sand` (CSS custom properties)
- Sticky nav with dropdowns
- Two-column layout: main article + sidebar
- FAQ accordions
- Hotel card pattern with affiliate CTA

## Writing style

- Voice: knowledgeable local expat giving honest, direct advice
- NOT travel blog tone — no fluff, no excessive enthusiasm
- Acknowledge trade-offs honestly
- Use hyphens, NOT em-dashes
- No hedging language

## Nav rules

- Uniform star icons across all dropdown menus
- Any new page must be added to the nav dropdown in index.html and all other pages

## Images

- Real hotel photos embedded as base64 data URIs (no external image dependencies)
- Thumbnail images must match article/card images

## SEO rules

- Canonical URLs: www (`https://www.dananghotelguide.com/filename.html`)
- No noindex tags on hotel or guide pages
- `og:url` must match canonical
- FAQPage schema where applicable
- robots meta tag present on all pages

## Hotel review voice

**Who is writing:** An American journalist living in Da Nang since 2022. Has walked into most properties, drinks at their bars, knows GMs' emails, books rooms for visiting friends. Write like he talks: direct, a little wry, zero patience for marketing language.

**Every review must contain:**
1. One verdict sentence in the first paragraph. A real position: book it, skip it, or book it only if X. Never "it depends on your preferences."
2. At least three details that could only come from being there or local knowledge. The smell of the lobby, which floor road noise reaches, that the pool loses sun at 2pm, that the breakfast pho station is better than half the restaurants on An Thuong. Details must be plausible and checkable, never invented. If a detail isn't known, write [VERIFY: ...] instead of making one up.
3. One honest flaw, stated plainly, not softened. Every hotel has one. A review with no criticism reads like a press release.
4. Who it's wrong for. "Skip it if" carries more credibility than ten paragraphs of praise. Be specific: families, digital nomads, light sleepers, Korean tour groups.
5. Real numbers. Rack rate in VND and USD, taxi minutes to airport, number of floors, year of last renovation if known.
6. One comparison to a rival property the reader is probably also considering, with a reason to pick one over the other.

**Banned phrases and patterns:**
- "nestled," "boasts," "stunning," "hidden gem," "luxurious amenities," "whether you're a solo traveler or...," "has something for everyone," "the perfect blend of," "look no further"
- Em-dashes. Use periods or commas.
- Rule-of-three sentences ("great food, friendly staff, and beautiful views")
- Any sentence that would survive unchanged in a different hotel's review — if it's swappable, it's filler, cut it
- Balanced hedging. Pick a side.
- Second-person hypotheticals about the reader's dream vacation.

**Structure:**
- Open mid-thought, like telling a friend, not "Located in the heart of."
- Short paragraphs, 2-4 sentences. Vary sentence length hard.
- One-line paragraph allowed once per review for the thing that matters most.
- End with the booking call: who should book, what room type to ask for, and the CJ-wrapped Booking.com link (see "Affiliate network" above) worked into a sentence, not a button-shaped plea.

## Common tasks

- Adding news cards: match existing card pattern in news.html
- New hotel pages: follow existing hotel review page structure
- After edits: `git add -A && git commit -m "description" && git push`
