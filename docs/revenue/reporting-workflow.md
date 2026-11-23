# Reporting workflow (Search Console + GA4 exports)

No credentials are stored or used by the site or these scripts. Export the files below by hand, put them anywhere outside the deployed folders (for example `~/dnhg-exports/2026-12/`), and run the builders. Output is a static HTML page in `docs/revenue/dashboards/` (not deployed; `.vercelignore` excludes `docs/`).

## Search Console -> SEO opportunity dashboard
1. search.google.com/search-console -> property `https://www.dananghotelguide.com/` -> **Performance -> Search results**.
2. Date range: **Last 3 months**. Search type: Web.
3. **Export -> Download CSV**. Unzip; you get `Pages.csv` and `Queries.csv`.
4. For the "losing visibility" and "new pages" tables, also export the **previous 3 months** (Compare -> previous period, or set the dates manually) and keep its `Pages.csv` as `Pages-previous.csv`.
5. Run: `node scripts/revenue4/seo-dashboard.js --pages Pages.csv --queries Queries.csv --prev-pages Pages-previous.csv`
6. Open `docs/revenue/dashboards/seo.html`. Tables: high impressions / low CTR, positions 8-20, commercial queries at position > 10, pages losing visibility, new pages gaining impressions, weak internal linking (counted from our own HTML), sitemap pages with no impressions (then check **Indexing -> Pages** in Search Console for the reason).

## GA4 -> revenue dashboard
Prerequisite: the custom dimensions in `docs/revenue/ga4-setup-checklist.md` (otherwise the CTA columns read "(not set)").
1. analytics.google.com -> **Explore -> Free form**.
2. **Clicks export**: Dimensions: Page path, `cta_location`, `page_type`, `cta_position`, `link_key`, `hotel_name`, Device category. Metric: Event count. Filter: Event name exactly `affiliate_click`. Export as CSV -> rename header row to `page_path,cta_location,page_type,cta_position,link_key,hotel_name,device_category,event_count` if GA4 uses display names.
3. **Views export** (optional): Dimension Page path; Metric Views -> `page_path,views`.
4. **Tool events export** (optional): Dimension Event name; Metric Event count; filter Event name begins with `dn_` -> `event_name,event_count`.
5. Run: `node scripts/revenue4/revenue-dashboard.js --clicks clicks.csv --views views.csv --events events.csv`
6. Open `docs/revenue/dashboards/revenue.html`.

## What these numbers can and cannot show
- `affiliate_click` counts clicks on this site. It is not a booking. Bookings and commission are confirmed only in the Trip.com Partners dashboard (Booking report about T+1, Commission report after check-out).
- `dn_planner_use`, `dn_compare_use`, `dn_shortlist_*`, `dn_copy_link` are engagement with our tools, never counted as clicks.
- With Consent Mode, visitors who decline analytics send cookieless pings only, so GA4 under-counts; compare trends, not absolute totals.
