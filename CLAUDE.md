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

- Booking.com Da Nang dest_id: `-3730689`
- Booking.com aid: `1784897`
- Awin mid: `18119`
- Awin affid: `2788028`
- Hoi An dest_id: `-3723930`
- NEVER use Hanoi dest_id `-3714993` — wrong city, has appeared in past errors

## Booking.com link format

```
https://www.booking.com/searchresults.html?dest_id=-3730689&dest_type=city&aid=1784897
```

Affiliate wrapper: use `awinmid=18119` and `awinaffid=2788028` via Awin network.

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
