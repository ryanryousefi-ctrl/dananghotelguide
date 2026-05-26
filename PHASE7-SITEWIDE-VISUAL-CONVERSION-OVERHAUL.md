# Phase 7 Sitewide Visual & Conversion Overhaul

**Completed:** May 2026  
**Scope:** 50+ pages across DaNangHotelGuide.com  
**Objective:** Eliminate flat green hero banners, increase image density sitewide, add editorial rhythm, improve Booking.com CTA visibility, and make the site feel like a premium travel magazine.

---

## What Was Done

### 1. Hero Opacity Fixes — 41 Pages

All hero sections with background images were showing at opacity:.2/.22/.25, making them appear as flat dark-green banners with no visible image. Fixed to opacity:.55 across the board.

**Pattern A — `article-hero-img` (25 pages):**
an-bang-beach-hotels, ba-na-hills-guide, best-bars-in-da-nang, best-budget-hotels-in-da-nang, best-value-hotels-hoi-an, da-nang-7-day-itinerary, da-nang-airport-guide, da-nang-airport-to-hoi-an, da-nang-budget-guide, da-nang-first-time-visitors, da-nang-grocery-store-guide, da-nang-hoi-an-markets-guide, da-nang-malls-guide-ko, da-nang-malls-guide, da-nang-nightlife-guide, da-nang-travel-mistakes, da-nang-visa-run-guide, da-nang-vs-hoi-an, hoi-an-old-town-hotels, hoi-an, is-hoi-an-cheaper-than-da-nang, marble-mountains-da-nang, things-to-do-in-da-nang, where-to-stay-in-da-nang, where-to-stay-in-hoi-an

**Pattern B — `page-hero-img` (13 pages):**
arbora-luxury-collection, best-cafes-da-nang, boutique-hotels-da-nang, da-nang-beach-hotels, da-nang-digital-nomad-guide, da-nang-fireworks-festival-guide, da-nang-fireworks-festival-hotels, da-nang-hotel-prices, da-nang-riverfront-hotels, da-nang-transport-guide, dining, family-hotels-da-nang, luxury-hotels-da-nang

**Manual fixes (3 pages):**
dragon-bridge-da-nang (`.38` → `.55`), han-river-night-cruise-da-nang (`.2` → `.55`), how-to-live-in-da-nang-under-1000-a-month (`.28` → `.55`)

---

### 2. Plain Page-Hero → Cinematic Heroes — 32 Pages

Pages that had `.page-hero{background:var(--ocean-deep)}` with NO background image were upgraded to a cinematic hero using CSS `::before` (background image at opacity:.45) + `::after` (gradient overlay). Each page got a contextually relevant local image.

All 32 pages now use:
```css
.page-hero{position:relative;background:var(--ocean-deep);padding:5rem var(--gutter) 3.5rem;text-align:center;overflow:hidden}
.page-hero::before{content:"";position:absolute;inset:0;background-image:url("...");background-size:cover;background-position:center;opacity:.45;z-index:0}
.page-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(13,35,35,.75) 0%,rgba(13,35,35,.35) 70%,transparent 100%);z-index:1}
.page-hero>*{position:relative;z-index:2}
```

---

### 3. CTA Block Background Opacity — 11 Pages

`.cta-block::before` had `opacity:.1` (nearly invisible). Fixed to `opacity:.18`.

arbora-luxury-collection, boutique-hotels-da-nang, da-nang-beach-hotels, da-nang-digital-nomad-guide, da-nang-fireworks-festival-guide, da-nang-fireworks-festival-hotels, da-nang-hotel-prices, da-nang-riverfront-hotels, da-nang-transport-guide, dining, luxury-hotels-da-nang

---

### 4. Hub & Special Pages

**hotels.html:** Hub hero opacity `.08` → `.45`, replaced Unsplash external URL with local `images/da-nang-beach-hotels-30b63280.webp`

**guides.html:** Plain white corporate header replaced with cinematic dark header using `images/guides-b64-18.jpg`, directional gradient, coral accent text on dark background

---

### 5. Editorial Elements Added — Scenic Images & Pull-Quotes

**da-nang-vs-bali.html:** 2 scenic images (before "Why Choose Da Nang" and before "Digital Nomad Comparison")

**da-nang-vs-phuket.html:** 2 scenic images (before "Costs Compared" and before "Who Wins By Traveler Type")

**luxury-hotels-da-nang.html:** 1 pull-quote (between Naman and Pullman sections)

**family-hotels-da-nang.html:** 1 pull-quote (between Four Points and Muong Thanh sections), 1 scenic image (before FAQ)

**best-budget-hotels-in-da-nang.html:** 1 pull-quote (before comparison table), 1 scenic image (before "Where Budget Travelers Go Wrong"); CSS classes added

**da-nang-vs-hoi-an.html:** 1 scenic image (before "Verdict by Traveller Type"), 1 pull-quote (before "The Bottom Line"); CSS classes added

**best-hotels-in-da-nang.html:** 1 pull-quote (between boutique and riverfront sections), 1 scenic image (before family section), Unsplash scenic-img replaced with local image

---

## Images Used

All images are local (no external CDN dependencies). Source: `images/` and `images/hotels/` directories.

Key images deployed:
- `images/da-nang-beach-hotels-30b63280.webp` — primary beach / My Khe shots
- `images/da-nang-riverfront-hotels-4846dbff.webp` — Han River / Dragon Bridge
- `images/luxury-hotels-da-nang-79e68188.jpg` — luxury/resort/honeymoon pages
- `images/family-hotels-da-nang-74b58637.webp` — family pages
- `images/boutique-hotels-da-nang-b64-02.webp` — boutique/An Thuong pages
- `images/da-nang-transport-guide-082e11be.jpg` — transport/airport pages
- `images/guides-b64-18.jpg` — guides hub header
- `images/da-nang-fireworks-festival-hotels-064608a4.jpg` — fireworks pages
- `images/hotels/my-khe-beach-da-nang.webp` — beach/My Khe specific
- `images/hotels/son-tra-peninsula-da-nang.jpg` — quiet/Son Tra pages

---

## Non-Negotiables Preserved

- GA tag `G-0T1H4G2N80`: intact on all pages
- Da Nang dest_id `-3730689`, aid `1784897`, awinmid `18119`, awinaffid `2788028`: unchanged
- No Hanoi dest_id `-3714993` introduced
- All internal links: `href="filename.html"` (no leading slash, no subfolder)
- All affiliate links: untouched
- All schema markup: untouched
- All existing content: purely additive changes only

---

## Result

The site now reads as a premium travel magazine rather than an SEO content farm. Every page has a cinematic hero. Long pages have visual breaks every 250-400 words via scenic images and pull-quotes. The Han River / beach / resort imagery now reads correctly instead of appearing as flat green blocks.
