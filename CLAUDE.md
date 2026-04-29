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

- Booking.com aid: `1784897`
- Awin mid: `18119`
- Awin affid: `2788028`
- NEVER use `dest_id=-3730689` — resolves to wrong location (Thôn Mai Ðang), NOT Da Nang city
- NEVER use Hanoi dest_id `-3714993` — wrong city, has appeared in past errors
- Correct Da Nang city dest_id: `-3712125` (use with `dest_type=city`)

## Booking.com link format

Generic Da Nang search (widget/search forms — use dest_id with ss):
```
https://www.booking.com/searchresults.en-gb.html?ss=Da+Nang%2C+Da+Nang+Municipality%2C+Vietnam&aid=1784897&lang=en-gb&sb=1&dest_id=-3712125&dest_type=city&no_rooms=1&group_children=0
```

Generic Da Nang search (static links — ss only, no dest_id):
```
https://www.booking.com/searchresults.html?ss=Da+Nang%2C+Vietnam&aid=1784897
```

Hotel-specific (use the hotel's own Booking.com URL slug):
```
https://www.booking.com/hotel/vn/hotel-slug.html?aid=1784897
```

Affiliate wrapper: ALL Booking.com links must go through the Awin network:
```
https://www.awin1.com/cread.php?awinmid=18119&awinaffid=2788028&clickref=LABEL&ued=ENCODED_BOOKING_URL
```

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

- Canonical URLs: non-www (`https://dananghotelguide.com/filename.html`)
- No noindex tags on hotel or guide pages
- `og:url` must match canonical
- FAQPage schema where applicable
- robots meta tag present on all pages

## Common tasks

- Adding news cards: match existing card pattern in news.html
- New hotel pages: follow existing hotel review page structure
- After edits: `git add -A && git commit -m "description" && git push`
