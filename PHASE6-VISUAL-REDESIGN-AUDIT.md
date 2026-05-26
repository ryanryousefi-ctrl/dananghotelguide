# Phase 6 — Visual Redesign & Hotel Image System Audit

**Started:** 2026-05-26
**Scope:** Full sitewide visual audit and hotel image system implementation

---

## Objectives

Transform DaNangHotelGuide.com from text-heavy SEO database to visually rich travel brand:
- Every hotel recommendation card must have an image
- Build central hotel image mapping system (`hotel-image-system.js`)
- Upgrade hs-card compact strips with hotel images (46 cards across 20 pages)
- Fix duplicate images introduced by script on pre-imaged vs pages
- Create authoritative hotel→image reference for all future pages

---

## Hotel Image System

Created: `hotel-image-system.js` — master reference mapping all hotel names/aliases to local image paths.

### Full Image Library

| Hotel | Image Path | Type |
|-------|-----------|------|
| InterContinental Sun Peninsula | `images/hotels/intercontinental-da-nang.avif` | Real |
| Hyatt Regency Da Nang | `images/hotels/hyatt-regency-da-nang.jpg` | Real |
| Sheraton Grand Da Nang | `images/hotels/sheraton-grand-da-nang.jpg` | Real |
| Pullman Da Nang | `images/hotels/pullman-da-nang.jpg` | Real |
| Furama Resort Da Nang | `images/hotels/furama-resort-da-nang.jpg` | Real |
| Marriott Da Nang | `images/hotels/marriott-da-nang.jpg` | Real |
| Novotel Han River | `images/hotels/novotel-da-nang-han-river.jpg` | Real |
| Melia Da Nang | `images/hotels/melia-da-nang.jpg` | Real |
| Premier Village Da Nang | `images/hotels/premier-village-da-nang.webp` | Real |
| Mikazuki Japanese Resorts | `images/hotels/mikazuki-da-nang.jpg` | Real |
| A La Carte Da Nang Beach | `images/hotels/a-la-carte-da-nang.jpg` | Real |
| Brilliant Hotel Da Nang | `images/hotels/brilliant-hotel-da-nang.jpg` | Real |
| Radisson Blu Da Nang | `images/hotels/radisson-blu-da-nang.jpg` | Real |
| Grand Mercure Da Nang | `images/hotels/grand-mercure-da-nang.jpg` | Real |
| Wink Hotel Da Nang | `images/hotels/wink-hotel-da-nang.jpg` | Real |
| Wyndham Soleil Da Nang | `images/hotels/wyndham-soleil-da-nang.jpg` | Real |
| Sandy Beach Non Nuoc | `images/hotels/sandy-beach-non-nuoc-da-nang.webp` | Real |
| Vinpearl Luxury Da Nang | `images/hotels/vinpearl-luxury-da-nang.webp` | Real |
| Caro Hotel Da Nang | `images/hotels/caro-hotel-da-nang.webp` | Real |
| HAIAN Beach Hotel | `images/hotels/haian-river-hotel-da-nang.jpg` | Real |
| Chicland Hotel | `images/hotels/chicland-da-nang.jpg` | Real |
| Naman Retreat | `images/review-naman-retreat-da-nang-exterior.jpg` | Real |
| Hilton Da Nang | `images/review-hilton-da-nang-exterior.jpg` | Real |
| Muong Thanh Luxury | `images/review-muong-thanh-luxury-da-nang-exterior.jpg` | Real |
| Four Points Sheraton | `images/review-four-points-sheraton-da-nang-exterior.jpg` | Real |
| Azura Da Nang | `images/review-azura-da-nang-e25abed6.jpg` | Real |
| Melia Vinpearl | `images/review-melia-vinpearl-da-nang-exterior.webp` | Real |
| TIA Wellness Resort | `images/hotels/my-khe-beach-da-nang.webp` | Fallback |
| Fusion Maia Da Nang | `images/review-naman-retreat-da-nang-exterior.jpg` | Fallback |
| Fusion Suites Da Nang | `images/hotels/my-khe-beach-da-nang.webp` | Fallback |
| TMS Hotel Da Nang Beach | `images/hotels/my-khe-beach-da-nang.webp` | Fallback |
| Sala Danang Beach | `images/hotels/my-khe-beach-da-nang.webp` | Fallback |
| Mandila Beach Hotel | `images/hotels/haian-river-hotel-da-nang.jpg` | Fallback |
| Stella Maris Da Nang | `images/hotels/novotel-da-nang-han-river.jpg` | Fallback |
| Sofitel Metropole Hanoi | `images/guide-hanoi-hoankiemlake.jpg` | Fallback |
| Park Hyatt Saigon | `images/guide-hcmc-skyline.jpg` | Fallback |

---

## Phase 6 Work Summary

### Phase 6 Initial Pass — hotel-card ranking blocks (22 pages)
Technique: negative-margin image bleed matching card padding (2rem).
Pages: best-family-resort, best-han-river-hotels, best-hotels-near-my-khe-beach, best-luxury-resort-couples, da-nang-honeymoon-hotels, da-nang-adults-only-hotels, best-resort-breakfast, da-nang-hotels-infinity-pool, da-nang-hotels-spa-packages, da-nang-hotels-kids-club, da-nang-hotels-rooftop-pool, da-nang-hotels-private-beach, da-nang-hotels-connecting-rooms, da-nang-hotels-private-pool-villa, da-nang-quiet-areas-hotels, da-nang-hotels-near-airport, beachfront-vs-city-hotels, best-hotels-an-thuong, da-nang-first-time-visitors-area-guide, best-areas-da-nang-families, best-beach-hotel-under-100, da-nang-hotels-with-lazy-river

### Corrective Pass — comparison pages and destination guides (24 pages)
All hotel-vs-hotel pages received `cmp-visual-duel` side-by-side image panels.
Destination vs pages, country guides (Korean, Russian, Australian) received hotel card images.

### Final QA Pass — missed pages (4 pages)
- da-nang-vs-hanoi.html: top-pick-cards imaged
- da-nang-vs-ho-chi-minh-city.html: top-pick-cards imaged
- da-nang-vs-nha-trang.html: all 3 top-pick-cards imaged
- da-nang-with-teenagers.html: thumbnails on flex hotel cards

### Phase 6 Visual Redesign — hs-card strips (20 pages, 46 cards)

The `.hs-card` compact affiliate hotel strips previously showed text-only. Upgraded with hotel images using negative margin bleed technique matching card padding (1.1rem → margin:-1.1rem, width:calc(100% + 2.2rem)).

| Page | Cards | Hotels |
|------|-------|--------|
| best-hotels-in-da-nang.html | 3 | Sheraton, Hyatt, Pullman |
| best-budget-hotels-in-da-nang.html | 3 | A La Carte, Brilliant, Wyndham |
| da-nang-beach-hotels.html | 3 | Sheraton, Pullman, Hyatt |
| da-nang-3-day-itinerary.html | 2 | Sheraton, Hyatt |
| da-nang-5-day-itinerary.html | 2 | Sheraton, Hyatt |
| da-nang-7-day-itinerary.html | 2 | InterContinental, Hyatt |
| da-nang-itinerary.html | 2 | Sheraton, Novotel |
| how-many-days-in-da-nang.html | 2 | Sheraton, Pullman |
| is-da-nang-walkable.html | 2 | Sheraton, Pullman |
| where-to-stay-in-da-nang.html | 3 | Pullman, Hyatt, Novotel |
| da-nang-first-time-travel-guide.html | 2 | Hyatt, Furama |
| da-nang-with-kids-guide.html | 2 | Hyatt, Premier Village |
| family-hotels-da-nang.html | 3 | Mikazuki, Hyatt, Sheraton |
| da-nang-budget-guide.html | 2 | TMS (fallback), A La Carte |
| rainy-season-da-nang-guide.html | 2 | Fusion Maia (fallback), Naman |
| da-nang-vs-phuket.html | — | Already had images from corrective pass |
| da-nang-vs-phu-quoc.html | — | Already had images from corrective pass |
| da-nang-vs-bali.html | — | Already had images from corrective pass |
| da-nang-vs-hoi-an.html | — | Already had images from corrective pass |
| best-bars-in-da-nang.html | 3 | Sheraton, Novotel, A La Carte |

**Note:** da-nang-vs-phuket, vs-bali, vs-phu-quoc, vs-hoi-an hs-cards already had images from the corrective pass. Script was run and removed duplicate bleed images.

---

## CSS Standards Reference

### hotel-card (padding:2rem) — bleed technique
```css
.hotel-card-img {
  width: calc(100% + 4rem);
  height: 220px;
  object-fit: cover;
  border-radius: 12px 12px 0 0;
  margin: -2rem -2rem 1.25rem;
  display: block;
}
@media(max-width:480px){ .hotel-card-img { height: 180px } }
```

### top-pick-card (padding:1.75rem) — inline style
```html
style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:.75rem;display:block"
```

### hs-card (padding:1.1rem) — bleed technique inline
```html
style="width:calc(100% + 2.2rem);height:160px;object-fit:cover;border-radius:8px 8px 0 0;margin:-1.1rem -1.1rem 0.75rem;display:block"
```

### cmp-visual-duel (comparison panel)
```css
.cmp-visual-duel { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin:2rem 0 2.5rem }
.cmp-visual-card { position:relative; border-radius:var(--r-lg,14px); overflow:hidden; aspect-ratio:4/3 }
.cmp-visual-card img { width:100%; height:100%; object-fit:cover; display:block }
.cmp-visual-label { position:absolute; bottom:0; left:0; right:0; padding:.6rem .9rem;
  background:linear-gradient(to top,rgba(13,53,53,.9),transparent);
  color:#fff; font-size:.75rem; font-weight:700; letter-spacing:.04em }
@media(max-width:600px){ .cmp-visual-duel { grid-template-columns:1fr } }
```

---

## Homepage Visual Status

- **index.html** — `tr-card` grid uses CSS custom property `--tr-img:url(...)` set inline on each card. All 9 cards have background images. No changes needed.
- **fc-card** hotel category cards (boutique, luxury, beach, riverfront, family) all have `fc-img` images.
- **nbhd-card** neighbourhood cards have `nbhd-img` images.
- **hg-card** hotel guide cards have `hg-img` images.

---

## Pages Confirmed Image-Complete (No Changes Needed)

- All 193 `review-*.html` pages — hero images by design
- `best-hotels-in-da-nang.html` main ranking cards — hotel-img-wrap pattern
- `da-nang-beach-hotels.html` main ranking cards — hotel-card-img pattern
- `da-nang-riverfront-hotels.html` — hotel-card-img present
- `family-hotels-da-nang.html` main cards — hotel-card-img present
- `da-nang-fireworks-festival-hotels.html` — hotel-card-img present
- `best-budget-hotels-in-da-nang.html` main cards — hotel-card-img present
- `luxury-hotels-da-nang.html` — hotel-card-img on all cards
- `boutique-hotels-da-nang.html` — hotel-card-img on all cards
- All `*-vs-*.html` comparison pages — cmp-visual-duel present

---

## Remaining Recommendations

1. **Add real hotel photos** for: TIA Wellness Resort, Fusion Maia, Fusion Suites, TMS Hotel, Sala Danang, Mandila Beach, Stella Maris
   - Target path: `images/hotels/[hotel-slug].jpg`
   - Update `hotel-image-system.js` when added

2. **Replace Unsplash images** on `luxury-hotels-da-nang.html` (TIA, Naman, Sheraton, Hyatt, Furama sections) with real local images when available

3. **Image break density** — longest guides (da-nang-beach-hotels, best-hotels-in-da-nang) could benefit from scenic image breaks every 400–500 words to prevent text wall feel

4. **Mobile QA** — hs-card images at 375px viewport: the 160px height and bleed margins should render cleanly at single-column. The `.hotel-strip` grid collapses to 1-column at 640px per existing CSS.

5. **Editorial sections** — high-traffic pages would benefit from "My honest take" or "Who this hotel suits" short editorial pullout boxes to add blog feel

---

## QA Verification

Final grep to confirm no plain text hs-cards remain:

```bash
for f in *.html; do
  hs=$(grep -c 'class="hs-card"' "$f" 2>/dev/null || echo 0)
  if [ "$hs" -gt 0 ]; then
    imgs=$(grep -A2 'class="hs-card"' "$f" | grep -c '<img' 2>/dev/null || echo 0)
    echo "$f: hs=$hs, imgs_in_next_2_lines=$imgs"
  fi
done
```
