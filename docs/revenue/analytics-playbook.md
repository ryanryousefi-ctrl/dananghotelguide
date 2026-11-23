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
