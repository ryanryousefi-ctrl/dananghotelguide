# Hotel Card Injection Audit

**Phase 6 — Sitewide Hotel Card Injection**
**Completed:** 2026-05-26
**Method:** Reused existing `hotel-strip` + `hs-card` component (additive only — no existing content removed or rewritten)

---

## Pages Updated (13 files)

| Page | Hotels Injected | Clickrefs | Placement |
|------|----------------|-----------|-----------|
| `da-nang-3-day-itinerary.html` | Sheraton Grand Danang, Hyatt Regency Danang | `3day-sheraton`, `3day-hyatt` | After "Where to Stay" section intro paragraph |
| `da-nang-itinerary.html` | Sheraton Grand Danang, Novotel Premier Han River | `itin-sheraton`, `itin-novotel` | After "Hotels for This Itinerary" section |
| `da-nang-5-day-itinerary.html` | Sheraton Grand Danang, Hyatt Regency Danang | `5day-sheraton`, `5day-hyatt` | After Ryan's Take local-perspective div, before `</main>` |
| `da-nang-7-day-itinerary.html` | InterContinental Sun Peninsula, Hyatt Regency Danang | `7day-intercontinental`, `7day-hyatt` | After Son Tra Peninsula luxury mention paragraph |
| `da-nang-budget-guide.html` | TMS Hotel Da Nang Beach, A La Carte Da Nang Beach | `budget-tms`, `budget-alacarte` | After budget hotel plan-item-desc paragraph mentioning TMS/A La Carte |
| `da-nang-first-time-travel-guide.html` | Hyatt Regency Danang, Furama Resort Danang | `firsttime-hyatt`, `firsttime-furama` | After first-time hotel recommendation section |
| `da-nang-with-kids-guide.html` | Hyatt Regency Danang, Premier Village Danang | `kids-hyatt`, `kids-premier` | After Non Nuoc beach family section |
| `is-da-nang-walkable.html` | Sheraton Grand Danang, Pullman Danang Beach Resort | `walkable-sheraton`, `walkable-pullman` | After Central My Khe walk-score-card paragraph |
| `da-nang-vs-phuket.html` | Fusion Maia Da Nang, Naman Retreat | `vsphuket-fusion`, `vsphuket-naman` | Before verdict table under "Verdict By Traveler Type" |
| `da-nang-vs-phu-quoc.html` | Hyatt Regency Danang, Premier Village Danang | `vsphuquoc-hyatt`, `vsphuquoc-premier` | Before verdict-grid under "Verdicts by Traveller Type" |
| `da-nang-vs-bali.html` | InterContinental Sun Peninsula, Hyatt Regency Danang | `vsbali-intercontinental`, `vsbali-hyatt` | After Da Nang hotel recommendation section |
| `how-many-days-in-da-nang.html` | Sheraton Grand Danang, Pullman Danang Beach Resort | `days-sheraton`, `days-pullman` | Before `</main>`, constrained with inline `max-width:760px` |
| `rainy-season-da-nang-guide.html` | Fusion Maia Da Nang, Naman Retreat | `rainy-fusion`, `rainy-naman` | After rainy season hotel recommendations paragraph |

---

## Pages Skipped — Already Have Rich Hotel Components

| Page | Reason |
|------|--------|
| `da-nang-vs-hanoi.html` | Has `top-pick-card` components: Sheraton Grand + Sofitel Metropole Hanoi |
| `da-nang-vs-nha-trang.html` | Has 3 `top-pick-card` components: Muong Thanh, Caro, Grand Mercure |
| `da-nang-vs-ho-chi-minh-city.html` | Has `top-pick-card` components: InterContinental + Park Hyatt Saigon |

---

## Pages Skipped — No Contextual Hotel Mentions

| Page | Reason |
|------|--------|
| `da-nang-airport-guide.html` | Logistics guide — no hotel name mentions |
| `da-nang-grab-guide.html` | Transport guide — no hotel name mentions |
| `da-nang-sim-card-guide.html` | Practical guide — no hotel name mentions |
| `best-time-to-visit-da-nang.html` | Seasonal guide — no specific hotel recommendations |
| `da-nang-food-guide.html` | Food/restaurant guide — no hotel name mentions |
| `da-nang-tourist-mistakes.html` | Tips guide — no specific hotel name mentions warranting a card |

---

## Hotel Library Used

| Booking.com Slug | Hotel Name | Badge |
|------------------|------------|-------|
| `hyatt-regency-danang-resort-and-spa` | Hyatt Regency Danang Resort | 5-Star · Non Nuoc Beach |
| `sheraton-grand-danang-resort` | Sheraton Grand Danang Resort | 5-Star · My Khe Beach |
| `pullman-danang-beach-resort` | Pullman Danang Beach Resort | Best Value 5-Star |
| `novotel-premier-han-river-danang` | Novotel Danang Premier Han River | Best · Han River |
| `intercontinental-danang-sun-peninsula-resort` | InterContinental Sun Peninsula Resort | Ultra-Luxury · Son Tra |
| `fusion-maia-da-nang` | Fusion Maia Da Nang | All-Inclusive Spa · Non Nuoc |
| `naman-retreat-da-nang` | Naman Retreat | Boutique · Non Nuoc |
| `furama-resort-danang` | Furama Resort Danang | Mid-Range · My Khe |
| `premier-village-danang-resort` | Premier Village Danang Resort | Beachfront Villas |
| `tms-hotel-da-nang-beach` | TMS Hotel Da Nang Beach | Mid-Range · My Khe |
| `a-la-carte-da-nang-beach` | A La Carte Da Nang Beach | Mid-Range · My Khe |

---

## Affiliate Parameters (All Cards)

- Awin mid: `18119`
- Awin affid: `2788028`
- Booking.com aid: `1784897`
- Da Nang dest_id: `-3730689`
- Max 2 hs-cards per hotel-strip
- No duplicate hotels per page
- All links: `target="_blank" rel="nofollow noopener sponsored"`
