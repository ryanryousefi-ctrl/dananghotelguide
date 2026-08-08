# Phase 2 Image Pipeline Report

## What Changed

- **Base64 images removed:** 61 instances across 39 HTML files
- **Bytes extracted from HTML:** 12.9 MB (13,563,175 bytes)
- **Image files written to:** `assets/img/` (60 files, content-hash named)
- **Base64 remaining in HTML:** 0

All HTML files are now serving images via file paths (`assets/img/filename.ext`)
rather than inline base64. This enables:
- Separate CDN caching of image assets
- Google Image Search indexability
- Faster HTML parse time

## Booking Demand API

`BOOKING_DEMAND_API_KEY` not present in environment. Property photo URLs not populated.
`_data/properties.json` contains 80 property slugs with `property_id: null` and
`photo_url: null`. When API credentials are available, run `scripts/images.mjs`
with those env vars to populate photo CDN URLs.

## Properties Inventory

80 unique Booking.com properties identified from existing affiliate links.
`_data/properties.json` maps each to its booking slug, URL, pages it appears in,
and placeholder fields for property_id and photo_url.

## Prioritized Shoot List

Properties where original photography would move the needle most, ranked by
total GSC impressions across all pages featuring the property:

| Rank | Property | Total Impressions | Pages |
|---|---|---|---|
| 1 | Hyatt Regency Da Nang | 30,510 | 33 |
| 2 | A La Carte Da Nang Beach | 24,267 | 16 |
| 3 | Sheraton Grand Da Nang | 23,095 | 26 |
| 4 | Da Nang Beach Resort (Marriott) | 23,082 | 25 |
| 5 | InterContinental Sun Peninsula | 20,365 | 21 |
| 6 | Furama Resort | 15,727 | 17 |
| 7 | TMS Luxury Da Nang Beach | 13,792 | 10 |
| 8 | Premier Village Da Nang | 13,211 | 8 |
| 9 | Four Points by Sheraton | 9,965 | 8 |
| 10 | TIA Wellness Resort | 9,813 | 13 |

**Highest-leverage shoots:** Hyatt Regency (30,510 impressions), Sheraton Grand
(23,095), and InterContinental (20,365) appear across 20+ pages each. A morning
shoot at any of these three would benefit more pages than everything else combined.

## Alt Text and Lazy Loading

Images extracted from base64 preserve existing alt text, width, height, and
loading attributes from their parent `<img>` tags. Full audit of missing
attributes is in `_data/audit.json`. Images added in Phases 3-6 include
descriptive alt text per the voice spec.

## Notes for Original Photography

When Ryan photographs a property, save files as:
`assets/img/original/{property-slug}-{n}.jpg`
The image pipeline will automatically prioritize these for hero slots.
Add EXIF DateTimeOriginal for the credit line generator to read.
