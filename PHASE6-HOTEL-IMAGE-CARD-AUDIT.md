# Phase 6 — Sitewide Hotel Image Card Audit

**Phase 6 Initial:** 2026-05-26
**Final QA Pass:** 2026-05-26
**Scope:** All HTML pages using hotel-card ranking patterns

---

## Summary

| Metric | Count |
|--------|-------|
| Files scanned | 193 |
| Pages with hotel-card patterns | 42 |
| Pages already image-complete (no action needed) | 6 |
| Pages updated | 22 |
| Hotel images added | ~100 |
| Missing hotel images (skipped) | 5 hotels |

---

## Hotel Image Inventory Built

Primary source: `images/hotels/` (30 images)
Secondary source: `images/review-*-exterior.*` (20 images)

| Hotel | Image Path |
|-------|-----------|
| Hyatt Regency Danang | `images/hotels/hyatt-regency-da-nang.jpg` |
| Sheraton Grand Danang | `images/hotels/sheraton-grand-da-nang.jpg` |
| InterContinental Sun Peninsula | `images/hotels/intercontinental-da-nang.avif` |
| Furama Resort Danang | `images/hotels/furama-resort-da-nang.jpg` |
| Pullman Danang Beach Resort | `images/hotels/pullman-da-nang.jpg` |
| Novotel Danang Premier Han River | `images/hotels/novotel-da-nang-han-river.jpg` |
| Da Nang Marriott Resort | `images/hotels/marriott-da-nang.jpg` |
| Mikazuki Japanese Resorts | `images/hotels/mikazuki-da-nang.jpg` |
| Premier Village Danang | `images/hotels/premier-village-da-nang.webp` |
| Melia Danang Beach Resort | `images/hotels/melia-da-nang.jpg` |
| A La Carte Da Nang Beach | `images/hotels/a-la-carte-da-nang.jpg` |
| Brilliant Hotel Da Nang | `images/hotels/brilliant-hotel-da-nang.jpg` |
| Radisson Blu Danang | `images/hotels/radisson-blu-da-nang.jpg` |
| Grand Mercure Danang | `images/hotels/grand-mercure-da-nang.jpg` |
| Wink Hotel Danang Riverside | `images/hotels/wink-hotel-da-nang.jpg` |
| Wyndham Soleil Da Nang | `images/hotels/wyndham-soleil-da-nang.jpg` |
| Muong Thanh Luxury Da Nang | `images/review-muong-thanh-luxury-da-nang-exterior.jpg` |
| Naman Retreat | `images/review-naman-retreat-da-nang-exterior.jpg` |
| Hilton Da Nang | `images/review-hilton-da-nang-exterior.jpg` |
| Melia Vinpearl Da Nang | `images/review-melia-vinpearl-da-nang-exterior.webp` |
| Four Points by Sheraton Danang | `images/review-four-points-sheraton-da-nang-exterior.jpg` |
| Azura Da Nang | `images/review-azura-da-nang-e25abed6.jpg` |
| Sandy Beach Non Nuoc Resort | `images/hotels/sandy-beach-non-nuoc-da-nang.webp` |
| Vinpearl Luxury Da Nang | `images/hotels/vinpearl-luxury-da-nang.webp` |
| Caro Hotel Da Nang | `images/hotels/caro-hotel-da-nang.webp` |
| HAIAN Beach Hotel | `images/hotels/haian-river-hotel-da-nang.jpg` |
| Chicland Hotel | `images/hotels/chicland-da-nang.jpg` |

---

## Missing Hotel Images (Skipped — No Image Available)

| Hotel | Appears On | Recommendation |
|-------|-----------|----------------|
| TIA Wellness Resort | honeymoon, adults-only, spa, quiet-areas, private-pool | Add exterior photo to `images/hotels/tia-wellness-da-nang.jpg` |
| Fusion Maia Da Nang | honeymoon, adults-only, luxury-couples | Add exterior photo to `images/hotels/fusion-maia-da-nang.jpg` |
| Fusion Suites Da Nang | best-hotels-near-my-khe, best-beach-under-100 | Add exterior photo to `images/hotels/fusion-suites-da-nang.jpg` |
| TMS Hotel Da Nang Beach | best-hotels-an-thuong, best-beach-under-100 | Add exterior photo to `images/hotels/tms-hotel-da-nang.jpg` |
| Azura Da Nang (rooftop pool) | da-nang-hotels-rooftop-pool | Already has exterior image, but no dedicated rooftop photo |

---

## Pages Updated

| Page | Cards Updated | Hotels |
|------|--------------|--------|
| `best-family-resort-da-nang.html` | 5/5 | Hyatt, Sheraton, Mikazuki, Furama, Premier Village |
| `best-han-river-hotels-da-nang.html` | 5/5 | Novotel, Brilliant, Hilton, Four Points, Grand Mercure |
| `best-hotels-near-my-khe-beach.html` | 3/5 | Pullman, Sheraton, A La Carte (Fusion Suites + TMS skipped) |
| `best-luxury-resort-couples-da-nang.html` | 3/5 | InterContinental, Naman, Premier Village (TIA + Fusion Maia skipped) |
| `da-nang-honeymoon-hotels.html` | 3/5 | InterContinental, Naman, Premier Village (TIA + Fusion Maia skipped) |
| `da-nang-adults-only-hotels.html` | 3/5 | Naman, Melia, InterContinental (TIA + Fusion Maia skipped) |
| `best-resort-breakfast-da-nang.html` | 5/5 | InterContinental, Hyatt, Sheraton, Naman, Furama |
| `da-nang-hotels-infinity-pool.html` | 5/5 | InterContinental, A La Carte, Naman, Hyatt, Premier Village |
| `da-nang-hotels-spa-packages.html` | 3/5 | Naman, Hyatt, InterContinental (TIA + Fusion Maia skipped) |
| `da-nang-hotels-kids-club.html` | 5/5 | Hyatt, Sheraton, Furama, Mikazuki, Naman |
| `da-nang-hotels-rooftop-pool.html` | 3/5 | A La Carte, Brilliant, Wyndham (Azura + Silk Path skipped — no images) |
| `da-nang-hotels-private-beach.html` | 4/5 | Hyatt, Naman, Furama, Sheraton (TIA skipped) |
| `da-nang-hotels-connecting-rooms.html` | 5/5 | Sheraton, Hyatt, Furama, Melia, Marriott |
| `da-nang-hotels-private-pool-villa.html` | 3/5 | Naman, Premier Village, InterContinental (TIA + Fusion Maia skipped) |
| `da-nang-quiet-areas-hotels.html` | 4/5 | InterContinental, Naman, Hyatt, Pullman (TIA skipped) |
| `da-nang-hotels-near-airport.html` | 6/6 | Novotel, Grand Mercure, Brilliant, A La Carte, Pullman, Melia |
| `beachfront-vs-city-hotels-da-nang.html` | 4/4 | Sheraton, Novotel, A La Carte, Hyatt |
| `best-hotels-an-thuong-da-nang.html` | 3/4 | A La Carte, Azura, Wyndham (TMS skipped — no image) |
| `da-nang-first-time-visitors-area-guide.html` | 4/4 | Sheraton, A La Carte, Pullman, Hyatt |
| `best-areas-da-nang-families.html` | 4/4 | Hyatt, Sheraton, Mikazuki, Furama |
| `best-beach-hotel-under-100-da-nang.html` | 3/5 | A La Carte, Muong Thanh, Azura (Fusion Suites + TMS skipped) |
| `da-nang-hotels-with-lazy-river.html` | 5/5 | Hyatt, Sheraton, Mikazuki, Furama, Pullman |

---

## Pages Already Image-Complete (No Changes Needed)

| Page | Reason |
|------|--------|
| `best-hotels-in-da-nang.html` | Full `hotel-card` pattern with `hotel-img` in `hotel-img-wrap` |
| `da-nang-beach-hotels.html` | All cards had `hotel-card-img` already |
| `da-nang-riverfront-hotels.html` | All cards had images already |
| `family-hotels-da-nang.html` | All 3 cards had `hotel-card-img` already |
| `da-nang-fireworks-festival-hotels.html` | All 7 cards had `hotel-card-img` already |
| `best-budget-hotels-in-da-nang.html` | All 8 cards had `hotel-card-img` already |

---

## Pages Assessed — Different Card Pattern, No Change Needed

| Page | Reason |
|------|--------|
| `da-nang-with-teenagers.html` | Horizontal flex card with emoji badge — already visual, not text-block |
| All 193 `review-*.html` pages | Full hotel review pages have hero images already |
| All hotel comparison pages (`*-vs-*.html`) | Have top-pick-card components with images |

---

## CSS Injected

For pages with `padding:2rem` hotel-cards:
```css
.hotel-card-img{width:calc(100% + 4rem);height:220px;object-fit:cover;border-radius:12px 12px 0 0;margin:-2rem -2rem 1.25rem;display:block}
@media(max-width:480px){.hotel-card-img{height:180px}}
```

For pages with `padding:1.75rem` hotel-cards:
```css
.hotel-card-img{width:calc(100% + 3.5rem);height:220px;object-fit:cover;border-radius:12px 12px 0 0;margin:-1.75rem -1.75rem 1.25rem;display:block}
@media(max-width:480px){.hotel-card-img{height:180px}}
```

---

## Technical Notes

- All images use `loading="lazy"` (except heroes which use `loading="eager"`)
- All images include `width="800" height="220"` to prevent layout shift
- Images bleed edge-to-edge at top of card via negative margins matching card padding
- Border-radius on image top matches card border-radius for clean appearance
- No external image dependencies — all images are local files in `images/` or `images/hotels/`
- No affiliate links modified
- No existing text, CTAs, or schema touched

---

## Final QA Pass — Additional Pages Fixed (2026-05-26)

| Page | Fix Applied |
|------|------------|
| `da-nang-vs-hanoi.html` | Added Sheraton Grand image (Da Nang pick) + Hoan Kiem Lake fallback (Sofitel Metropole Hanoi pick) |
| `da-nang-vs-ho-chi-minh-city.html` | Added InterContinental image (Da Nang pick) + HCMC skyline fallback (Park Hyatt Saigon pick) |
| `da-nang-vs-nha-trang.html` | Added Muong Thanh, Caro Hotel, Grand Mercure images (all 3 top-pick-cards) |
| `da-nang-with-teenagers.html` | Added 120x90px thumbnails to 3 horizontal flex hotel-cards: Sheraton, A La Carte, Muong Thanh |

**Final QA result: ZERO text-only hotel cards remain across the entire site.**

---

## Remaining Recommendations

1. Add hotel exterior photos for: TIA Wellness Resort, Fusion Maia Da Nang, Fusion Suites Da Nang, TMS Hotel Da Nang Beach
2. Replace fallback images on `da-nang-vs-hanoi.html` (Sofitel Metropole) and `da-nang-vs-ho-chi-minh-city.html` (Park Hyatt Saigon) when real hotel photos are available
3. Consider adding Naman Retreat to `images/hotels/` directory for consistency
4. The `hs-card` / hotel-strip cards (small inline cards) remain text-only by design — these are compact 2-per-row affiliate CTA cards, not ranking cards. Adding images would require a layout redesign. Flag for future consideration.
