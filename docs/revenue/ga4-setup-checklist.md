# GA4 custom-dimension setup (manual, ~10 minutes)

Status: **not created**. No authorised GA4 Admin access was available from the build environment (no credentials, no Admin API token), so nothing below has been applied. Do not mark it done until GA4 shows the dimensions.

Property: the one receiving `G-0T1H4G2N80`. Path: **Admin → Data display → Custom definitions → Create custom dimension**. Scope **Event** for all. Standard properties allow 50 event-scoped custom dimensions; this list uses 10.

| Dimension name (display) | Event parameter (exact) | Sent by | Expected cardinality |
|---|---|---|---|
| CTA location | `cta_location` | affiliate_click | about 45 values (`p3-*`, `finder`, `compare-tool`, `sticky_mobile`, Phase 1 names) |
| Page type | `page_type` | affiliate_click | about 10 |
| CTA label | `cta_label` | affiliate_click | a few hundred (button text, 60 chars max) |
| CTA position | `cta_position` | affiliate_click | 0 to 100 (% down the page) |
| Link key | `link_key` | affiliate_click | about 140 (registry keys) |
| Hotel name | `hotel_name` | affiliate_click | about 140 |
| Hotel slug | `hotel_slug` | dn_shortlist_save / dn_shortlist_remove | 21 |
| List size | `list_size` | dn_shortlist_*, dn_compare_use | 1 to 6 |
| Compared hotels | `hotels` | dn_compare_use | combinations of up to 3 of 21 (fine for Explore, avoid in standard reports) |
| Destination type | `destination_type` | affiliate_click | 2 to 3 |

After creation: data appears for events **from that moment on** (no backfill); allow 24 to 48 hours. Mark `affiliate_click` as a key event only if you want it in conversion reports; it is a click, not a booking. Bookings are proven only in the Trip.com affiliate dashboard (Booking report T+1, Commission report after check-out).

Verify: Admin → DebugView with the GA Debugger extension, click one Trip.com button and one Save button; you should see exactly one `affiliate_click` (with the six parameters) and one `dn_shortlist_save`.

## Added 2026-11-27 (Operation Revenue Reset)
| Dimension name | Event parameter | Why |
|---|---|---|
| Layout version | `layout_version` | `reset1` on rebuilt pages, `legacy` elsewhere; the before/after cohort for affiliate clicks |
| Filter group | `filter_group` | `dn_shop_filter` event: which instant-filter group visitors use |
| Filter value | `filter_value` | `dn_shop_filter` event: which values |
