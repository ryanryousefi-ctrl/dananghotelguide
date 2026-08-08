# Phase 1 Keyword Map

## Cannibalization Problem

hotel-reviews.html (3,894 impressions, pos 12.4) is outranking best-hotels-in-da-nang.html
(1,699 impressions, pos 11.9) for the head term cluster despite having a review-focused title.
Google treats them as peers competing for the same queries. hotels.html (203 impressions,
pos 39.2) adds a third signal with no unique value.

## Page-to-Query Mapping

| Page | Primary Query Target | Intent | Action |
|---|---|---|---|
| best-hotels-in-da-nang.html | best hotels in da nang | Commercial — top-of-funnel, all budgets | **HUB** — strengthen, sharpen title |
| hotel-reviews.html | da nang hotel reviews / da nang hotel ratings | Evaluation — mid-funnel, specific research | Reframe title to "reviews" not "best hotels" |
| luxury-hotels-da-nang.html | da nang luxury hotels / da nang 5 star resorts | Commercial — luxury modifier | Add explicit "5-star" and "luxury resort" language, link up to hub |
| best-budget-hotels-in-da-nang.html | cheap hotels da nang / budget hotels da nang | Commercial — price modifier | Needs title with "cheap" and "under $50" for the query cluster |
| da-nang-beach-hotels.html | beach hotels da nang / my khe beach hotel | Commercial — location modifier | Already differentiated; strengthen My Khe specificity |
| family-hotels-da-nang.html | da nang family resort / family hotels da nang | Commercial — traveler type | Already differentiated; strengthen "kids club" / "waterpark" |
| boutique-hotels-da-nang.html | boutique hotels da nang | Commercial — style modifier | Already differentiated; low impressions (161), not priority |
| hotels.html | (no unique target) | Duplicate index page | **REDIRECT → best-hotels-in-da-nang.html** |

## Hub: best-hotels-in-da-nang.html

Receives redirect equity from hotels.html. Gets contextual internal links added from:
- da-nang-weather-by-month.html (15,819 impressions) — already has links, add one more in-body contextual link
- da-nang-budget-guide.html (11,574 impressions) — already has links
- da-nang-vs-phu-quoc.html (4,813 impressions) — strengthen anchor text
- da-nang-vs-hoi-an.html (3,965 impressions) — add contextual in-body link with descriptive anchor
- hotel-reviews.html (3,894 impressions) — add "see our full ranked list" link to hub

## Changes to Execute

1. Add `hotels.html → best-hotels-in-da-nang.html` redirect in vercel.json
2. Rewrite hotel-reviews.html title/meta to own "reviews" intent, not "best hotels"
3. Add "See the full ranked list" contextual link from hotel-reviews.html → best-hotels-in-da-nang.html
4. Add "for best hotels" contextual link from da-nang-vs-hoi-an.html body → hub
5. Tighten luxury-hotels-da-nang.html title to include "5-star" (queries: da nang resorts 5 star — 229 impressions)
6. Tighten best-budget-hotels-in-da-nang.html title to include "cheap" (queries: da nang cheap hotels — 436 impressions)
