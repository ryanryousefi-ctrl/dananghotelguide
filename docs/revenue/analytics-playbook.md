# GA4 affiliate analytics playbook

## One-time setup (owner; GA4 Admin)
Admin > Data display > Custom definitions > Create custom dimension (Scope: Event), one per row. Parameter name = Event parameter:
| Dimension name | Event parameter |
|---|---|
| CTA location | cta_location |
| Page type | page_type |
| CTA label | cta_label |
| CTA position | cta_position |
| Link key | link_key |
| Hotel name | hotel_name |
| Device category (event) | device_category |
Registered dimensions only collect data from the day they are created. Optionally mark `affiliate_click` as a key event (Admin > Events). Do not use `cta_label` for personal data (it holds button text only).

## 30 / 60 / 90 day review
1. Explore > Free form: rows `Page path`, columns `CTA location`, value `Event count`, filter `Event name = affiliate_click`; export CSV as clicks.csv (include CTA label, Page type, Device category, CTA position, Link key as extra rows/columns in separate explorations if the tool limits them).
2. Explore with `Views` by `Page path` -> views.csv.
3. `node scripts/revenue/ga4-report.js --clicks clicks.csv --views views.csv` for top pages, outbound CTR, CTA location, label, device, position and pages with traffic but no clicks.
4. Compare: early_review vs sticky_mobile vs inline vs guide_end; reviews vs comparisons vs guides; finder results; new guides (4) vs similar existing pages. Compare each 4-week window with the previous one; do not call a difference real on a few dozen clicks.
5. Trip.com dashboard: Booking report (T+1) and Commission report (5th of the next month) are the only proof of bookings. They cannot be matched to a page without a documented sub-ID.

## Phase 3 additions (November 2026)

**Booking clicks** still use the single `affiliate_click` event from `tripcom-cta.js`; nothing new was added to it. New `cta_location` values identify the Phase 3 placement: `p3-hero`, `p3-ws-pick`, `p3-ws-area`, `p3-ws-compare`, `p3-ws-final`, `p3-list-hero`, `p3-list-compare`, `p3-guide-hero`, `p3-vs-compare`, `p3-dates`, `p3-return`, `p3-seasonal`, `p3-home-hero`, `p3-home-pick`, `p3-home-compare`, `p3-glance`, `p3-nocar-*`, `p3-three-*`, `p3-how-*`, `compare-tool`, `finder`, `sticky_mobile`.

**Tool engagement events (not bookings, never counted as clicks):**

| Event | Fired when | Parameters |
|---|---|---|
| `dn_compare_use` | two or more hotels are shown in the comparison table (once per combination per page view) | `hotels`, `list_size`, `page_path` |
| `dn_shortlist_save` / `dn_shortlist_remove` | a visitor saves or removes a hotel | `hotel_slug`, `list_size` |
| `dn_shortlist_return` | the compare page opens with a saved shortlist, or the visitor loads it | `list_size` |
| `dn_copy_link` | the visitor copies the guide link | `page_path` |

These go through `gtag`, so they respect the site's Consent Mode: with consent denied GA4 receives cookieless pings only. The shortlist itself lives in the visitor's browser (`localStorage` key `dn_shortlist_v1`) and is never sent anywhere. To report on these events in GA4 Explore, register `hotel_slug`, `list_size` and `hotels` as custom dimensions (manual step, not done).

**Reading the data:** compare `affiliate_click` counts by `cta_location` and `page_type` per 1,000 sessions of the page type. Do not treat tool events as booking intent without checking them against Trip.com's Booking report.
