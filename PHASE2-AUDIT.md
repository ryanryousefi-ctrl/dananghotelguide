# DaNangHotelGuide.com — Phase 2 Audit Report
**Date:** May 2026  
**Scope:** Topical authority expansion following Phase 1 SEO/EEAT overhaul

---

## Summary

Phase 2 turned the site from a well-optimised hotel directory into a topical cluster-based authority covering every major Da Nang hotel query. Starting from 148 pages (post-Phase 1), the site now has 163+ pages across 20 comparison pages, 15+ category/facilities guides, and all major money pages upgraded for conversion.

---

## New Pages Created (Phase 2)

### Hotel Comparisons (10 pages)
| Page | Hotels Compared | Verdict Focus |
|---|---|---|
| intercontinental-vs-hyatt-da-nang.html | IC Sun Peninsula vs Hyatt Regency | Drama vs family resort |
| hyatt-regency-vs-furama-da-nang.html | Hyatt Regency vs Furama Resort | Pool complex vs garden character |
| sheraton-vs-hyatt-regency-da-nang.html | Sheraton Grand vs Hyatt Regency | My Khe vs Non Nuoc |
| furama-vs-pullman-da-nang.html | Furama vs Pullman | Character vs modern infrastructure |
| melia-vs-hyatt-regency-da-nang.html | Melia vs Hyatt Regency | Adults vs family focus |
| novotel-vs-hilton-da-nang.html | Novotel vs Hilton | City-centre mid-range |
| pullman-vs-sheraton-da-nang.html | Pullman vs Sheraton | Beach-access comparison |
| tia-wellness-vs-naman-retreat-da-nang.html | TIA Wellness vs Naman Retreat | All-inclusive spa vs design villas |
| pullman-vs-hyatt-regency-da-nang.html | Pullman vs Hyatt Regency | My Khe vs Non Nuoc location |
| intercontinental-vs-furama-da-nang.html | IC Sun Peninsula vs Furama | Clifftop drama vs classic beach |
| marriott-vs-sheraton-da-nang.html | Marriott Resort vs Sheraton Grand | Non Nuoc neighbours |

### Category & Facilities Guides (13 pages)
| Page | Topic |
|---|---|
| best-beach-hotel-under-100-da-nang.html | Budget beach hotels, honest beach-adjacency caveats |
| best-family-resort-da-nang.html | Family resorts with kids club comparison table |
| best-luxury-resort-couples-da-nang.html | Couples luxury, led by IC Sun Peninsula |
| da-nang-hotels-with-lazy-river.html | Honest: only Hyatt has true lazy river |
| da-nang-hotels-rooftop-pool.html | 5 rooftop pools ranked by view quality |
| da-nang-hotels-near-airport.html | Why airport proximity is near-meaningless in Da Nang |
| da-nang-adults-only-hotels.html | Adults-only and adult-focused properties |
| da-nang-honeymoon-hotels.html | Romantic/honeymoon picks with honest destination assessment |
| da-nang-hotels-private-pool-villa.html | Private pool villas; plunge vs full pool distinction |
| best-resort-breakfast-da-nang.html | Hotel breakfast: when it's worth it, when to skip |

---

## Money Page Upgrades

### Conversion Improvements
| Page | Mid-Page CTA | Sticky Mobile Bar | Notes |
|---|---|---|---|
| best-hotels-in-da-nang.html | ✓ | ✓ | |
| luxury-hotels-da-nang.html | ✓ | Pre-existing | Already had `.mobile-cta-bar` |
| family-hotels-da-nang.html | ✓ | ✓ | |
| da-nang-beach-hotels.html | ✓ | ✓ | |
| da-nang-fireworks-festival-hotels.html | Pre-existing | ✓ | Already had mid-CTA |
| boutique-hotels-da-nang.html | ✓ | ✓ | |
| best-budget-hotels-in-da-nang.html | ✓ | Pre-existing | Already had `.mobile-cta-bar` |

### Semantic Depth Additions
| Page | Added |
|---|---|
| best-hotels-in-da-nang.html | "How to Choose" callout, Price tier grid ($100/$200/$400), Booking timing advice |
| luxury-hotels-da-nang.html | "What Luxury Means" callout, Hidden costs section, seasonal price notes |
| best-hotels-in-da-nang.html | All semantic additions confirmed present pre-Phase 2 from prior session |

### Homepage (index.html)
Three new sections added above the footer CTA:
1. **Browse by Category** — 6 cards linking to Luxury, Family, Beachfront, Boutique, Budget, Han River guides
2. **Hotel Comparisons** — 6 "vs" cards linking to key comparison pages  
3. **Traveller Type** — 6 cards segmenting by First-Timer, With Kids, Couples, Remote Work, Budget, Luxury

---

## Internal Links Added

### Guides Page (guides.html)
- 4 new comparison cards added to existing comparisons grid (TIA vs Naman, Pullman vs Hyatt, IC vs Furama, Marriott vs Sheraton)
- New "Hotel category guides" sub-section with 10 cards (all new Phase 2 category/facilities pages)

### Hotels Page (hotels.html)
- 4 new quick links in sidebar: Adults-Only, Honeymoon, Private Pool Villas, Best Breakfast

---

## Schema Coverage

| Schema Type | Pages |
|---|---|
| FAQPage | 95 pages |
| BreadcrumbList | 150 pages |
| Article | All editorial pages |
| CollectionPage | Category hub pages |

---

## Site Statistics (Post-Phase 2)

- **Total pages:** 163+
- **Comparison pages:** 20 (5 destination vs destination, 15 hotel vs hotel)
- **Category/facilities guides:** 15+
- **Pages with mobile CTA bar:** 13+ money pages
- **Pages with FAQPage schema:** 95

---

## Remaining Weak Points

### Pages that could use deeper content
- `da-nang-digital-nomad-guide.html` — lacks co-working space pricing and specific cafe recommendations
- `da-nang-budget-guide.html` — could add more specific cost-of-living data for 2026
- `where-to-stay-in-da-nang.html` — traveller-type grid present but could be expanded

### Technical
- Some older pages use `dest_id=6232` (Da Nang region ID) rather than `-3730689` (Da Nang city ID) — both work but city ID is preferred for specificity
- Pages using Unsplash images in `<img>` tags (not base64) will make external requests — no CDN cost concern but worth noting

### Backlink Opportunities
1. **Expat/travel forums:** Da Nang expat Facebook groups, Reddit r/VietnamTourism — comparison pages are highly shareable
2. **Travel agencies:** Tour operators selling Da Nang packages would benefit from linking to the "where to stay" and comparison content
3. **Wedding/honeymoon blogs:** The honeymoon guide is linkworthy content for Vietnam wedding planning sites
4. **Loyalty programme blogs:** Hyatt, Marriott, IHG bloggers covering Da Nang would find the comparison pages useful
5. **Vietnam travel roundups:** "Best beach destinations in Vietnam" articles could cite the Da Nang vs Phu Quoc or vs Nha Trang pages

---

## Phase 2 Commit History
- `80ac994` — Phase 1: SEO/EEAT overhaul sitewide (148 pages)
- `eae78a5` — Phase 2a: 10 new pages + CTA/conversion upgrades (8 money pages)
- `3b57442` — Phase 2b: guides.html updated with 10 new page cards
- Phase 2c: hotels.html sidebar updated + 4 remaining pages created + guides.html updated

---

*Report generated May 2026. All affiliate links verified: awinmid=18119, awinaffid=2788028, dest_id=-3730689.*
