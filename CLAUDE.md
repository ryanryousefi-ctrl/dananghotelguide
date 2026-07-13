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

- Booking.com affiliate ID (aid): `1784897`
- CJ publisher ID: `101820678`
- Da Nang generic search: `dest_id=6232&dest_type=region`
- Hoi An dest_id: `-3723930` (city-level, correct for Hoi An)
- NEVER use dest_id `-3714993` (wrong Hanoi ID) or `-3730689` (stale city-level Da Nang ID)
- DO NOT reintroduce Awin. Awin was the previous affiliate network. CJ is current.

## Affiliate network: CJ (Commission Junction) only

The site uses **CJ Deep Link Automation (DLA)** — NOT Awin.

### How it works

Every page includes this script at page bottom:

```html
<script src="https://www.anrdoezrs.net/am/101820678/include/allCj/impressions/page/am.js"></script>
```

This script:
1. On DOM ready, attaches a `click` listener to every `<a>` tag on the page.
2. On click, checks if `element.href` matches a CJ-whitelisted domain.
3. `booking.com` is in the whitelist — clicks are auto-rewritten to:
   `https://www.qksrv.net/links/101820678/type/am/<original-booking-url>`
4. This CJ redirect fires a tracked click and forwards to Booking.com.

### Requirements for CJ click tracking to fire

- The `<a>` element's `href` must contain the full `booking.com` URL **at the time of click**.
- Do NOT use `href="#"` with `data-booking-url` — the `href` must be real so DLA can read it.
- The CJ DLA script must have loaded (it loads synchronously from `anrdoezrs.net`).

### Booking.com link format

Always include `aid=1784897` in every Booking.com URL (Booking.com affiliate tracking):

Hotel-specific:
```
https://www.booking.com/hotel/vn/<slug>.html?aid=1784897&sid=<page-id>--<hotel-slug>
```

Generic Da Nang search:
```
https://www.booking.com/searchresults.en-us.html?ss=Da+Nang+Municipality,+Vietnam&dest_id=6232&dest_type=region&aid=1784897&lang=en-us
```

### SID placement identifiers

Every hotel-specific link includes a `&sid=` parameter for placement-level CJ reporting.
Format: `<page-basename>--<hotel-slug>` (max 70 chars total, hyphens only, no spaces).
Example: `sid=best-hotels-in-da-nang--intercontinental-danang-sun-pe`

### How to create new Booking.com affiliate links

1. Find the exact Booking.com property page URL: `https://www.booking.com/hotel/vn/<slug>.html`
2. Append: `?aid=1784897&sid=<page-id>--<hotel-slug>`
3. Use this URL directly in `href=`. Do NOT wrap in Awin. Do NOT use `href="#"`.
4. Set `data-booking-url` to the same URL as `href`.
5. The CJ DLA script handles click tracking automatically.

### How to validate affiliate links

Run: `node scripts/audit-cj-affiliate.js`

This checks that:
- No `href="#"` exists on booking CTAs
- All hotel links contain `aid=1784897`
- No Awin links are present
- No old bad dest_ids remain

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

## Common tasks

- Adding news cards: match existing card pattern in news.html
- New hotel pages: follow existing hotel review page structure
- After edits: `git add -A && git commit -m "description" && git push`
