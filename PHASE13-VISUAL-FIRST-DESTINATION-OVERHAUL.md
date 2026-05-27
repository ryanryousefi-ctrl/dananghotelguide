# PHASE 13 — Visual-First Destination Overhaul
**Committed:** TBD · **Date:** 2026-05-27 · **Files:** `phase13.css`, `index.html`, `luxury-hotels-da-nang.html`, `da-nang-beach-hotels.html`, + 180 pages (CSS inject)

---

## The Problem This Phase Solves

The site had accumulated visual debt across all phases:
- Giant dead zones from text walls and emoji-icon sections
- Comparison cards and area cards with zero imagery
- "Where I'd Stay" hotel strip — text-only, no photos
- Editor's Picks (Phase 12 injections) had empty `background-image:url('')`
- `p5-atm-section` duplicated the `dst-section` My Khe content above it
- `trust-section` used emoji icons with no photos
- `intro-section` dumped 4 paragraphs before any visual content

---

## What Was Built — `phase13.css`

New sitewide stylesheet (`phase13.css`) injected across all 193 HTML pages.

### Section Fixes (Homepage)

| Section | Problem | Fix |
|---------|---------|-----|
| `intro-section` | 4-paragraph text wall | Compressed: only first paragraph shown, quick-facts retained |
| `trust-section` | Emoji icon pillars | Pillars hidden, editorial text only, tight padding |
| `p5-atm-section` | Duplicate of dst-section above | Hidden entirely (`display:none`) |
| `links-section` | Text pill dump, beige desert | Background upgraded to off-white, tighter padding |

### Visual Card Upgrades (Homepage)

**Area Cards (`p5-area-card`):**
- Added `.p5-area-img` photo strip before text on each of 5 area cards
- Images assigned: My Khe, Han River, Son Tra, An Thuong, Non Nuoc
- Cards now: image → text, hover scales image
- CSS restructures card to `flex-direction: column` with image on top

**Comparison Cards (`p5-cmp-card`):**
- Added `.p5-cmp-img` photo strip with `vs` badge overlay
- Images assigned per comparison: IC vs Hyatt, Da Nang vs Hoi An, Beach vs City, Luxury vs Budget, Hyatt vs Marriott, Non Nuoc vs My Khe
- CSS restructures to `flex-direction: column`, image on top

**"Where I'd Stay" Hotel Cards (`wid-hotel-card`):**
- Added `.wid-hcard-img` + `.wid-hcard-body` structure
- Real hotel photos: Hyatt, Sheraton, Pullman, A La Carte from `images/hotels/`
- Cards now: photo → details, hover lifts

### Editor's Picks (Phase 12 Inner Pages)

Phase 12 had injected EP sections with `ep-card-img` divs and empty `background-image:url('')`.

**Fixed:**
- `luxury-hotels-da-nang.html`: IC, Hyatt, Naman images assigned
- `da-nang-beach-hotels.html`: Sheraton, A La Carte, Pullman images assigned
- `phase13.css` provides full EP card CSS system (the Phase 12 EP sections use a different structure from Phase 10's homepage EP — this CSS covers it)

### New EP Card System (for Phase 12 injections)

Full card system for `.editors-picks-section` as injected by Phase 12:
- 3-column responsive grid
- ep-card-img as background-image div with 4:3 aspect ratio, cover fit
- Badge system: `.ep-badge-coral` and `.ep-badge-ocean`
- CTAs: primary (ocean fill) + ghost (outlined)
- Mobile: collapses to 1 column

---

## Sitewide CSS Injection

`phase13.css` injected into all 193 HTML pages:
- 181 newly injected
- 11 already had it (from targeted Phase 12 work)
- Method: after `phase10.css` (or `phase10_5.css` where present)

---

## Sections Deleted (Homepage)

- Duplicate My Khe storytelling (`p5-atm-section`) — already covered by `dst-section` above
- 3 of 4 intro paragraphs — compressed from text wall to 1 paragraph
- Trust pillar emoji blocks — removed entirely

---

## Pages With New Images

| Page | What Was Fixed |
|------|---------------|
| `index.html` | Area cards (5 images), comparison cards (6 images), WID hotel strip (4 images) |
| `luxury-hotels-da-nang.html` | EP card images (3 hotels) |
| `da-nang-beach-hotels.html` | EP card images (3 hotels) |

---

## Visual Rhythm After Phase 13

Homepage section flow:
1. Hero (cinematic image slider)
2. Quick-browse strip (dark)
3. Stat bar (dark ocean)
4. Trip Router (white — large image cards)
5. Neighbourhood grid (white — image cards with overlay)
6. My Khe cinematic break (full-bleed image)
7. Magazine editorial grid (sand — 6 image cards)
8. Featured carousel (off-white — portrait image cards)
9. Editor's Picks (dark ocean — hotel photos)
10. Booking band (dark ocean)
11. Map section (white — interactive)
12. Intro (white — compressed, 1 paragraph + quick-facts)
13. Trust section (dark — editorial text only)
14. My Khe destination storytelling (dark — 3 images)
15. Dragon Bridge cinematic break (full-bleed)
16. An Thuong storytelling (white — 1 image)
17. Trip Pathways (dark — 3 portrait image cards)
18. Mood quote (ocean)
19. Where I'd Stay (white — 4 hotel photo cards + editorial)
20. Popular guides (off-white — text pills)
21. Korean hub banner (dark)
22. Premium hotel strip (white — 4 hotel image cards)
23. Comparison cards (sand — 6 image cards)
24. Area guide grid (dark ocean — 5 image cards)
25. Discovery rail (white — 8 image cards horizontal scroll)
26. Cinematic final CTA (full-bleed beach image)
27. Booking band (dark)
28. Booking widget section

Background rhythm: dark → dark → white → white → image → sand → off-white → dark → white → white → dark → dark → white → image → white → dark → ocean → white → off-white → dark → white → sand → dark ocean → white → image → dark → white

No two consecutive same-tone backgrounds. Every major section has imagery.
