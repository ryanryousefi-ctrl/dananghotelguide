# Consent and privacy layer

Technical facts only. This is **not legal advice** and does not claim compliance in any jurisdiction. Have it reviewed (Vietnam's Personal Data Protection Law 91/2025 and EEA/UK rules in particular) before launch.

## What the site loads (audit of the served pages)

Google Analytics 4 (all pages), Google AdSense script (199 pages, no ad slots), CJ page-impression tag `yceml.net` (all pages, removed at the Trip.com cutover), Ahrefs Web Analytics (27), YouTube embeds (7, now `youtube-nocookie.com`), Google Fonts, map tiles (OpenStreetMap, Esri, CARTO), Unsplash images.

## What the layer does

1. **Defaults, written in `<head>` before any Google tag** (Consent Mode v2): `analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization` = **denied** for the EEA, UK, Switzerland and Vietnam (`region` list in `scripts/redesign/build.js`), **granted** elsewhere. Google applies the region match.
2. **Banner (`dn-consent.js`)** on the first visit: Reject and Accept with equal weight, no pre-selection. The choice is stored for 12 months in `localStorage` (`dn_consent`) and sent to Google with `gtag('consent','update', …)`. AdSense non-personalised mode follows the choice.
3. **"Privacy settings"** in every footer reopens the banner.
4. GA4 click events (`booking_click`) keep firing; with analytics denied Google receives cookieless pings and models the gap.
5. `privacy.html` now describes this accurately (it previously said the site sets no cookies and uses no analytics).

Tested (`scripts/redesign/behavior.js`): defaults precede tags, banner on first visit, Reject and Accept update Consent Mode, choice persists, footer link reopens.

## What it does not do

- It is **not a Google-certified TCF consent platform**. Google requires one to serve AdSense ads to users in the EEA, UK and Switzerland. Easiest fix: enable Google's own consent message in the AdSense account (Privacy & messaging) and remove this banner for those regions, or keep both only if Google's message is configured as the only AdSense consent source.
- The CJ tag and third-party embeds are **not gated** by the choice (the CJ tag is removed at the Trip.com cutover).
- The defaults (which regions deny) are a product decision. Denying everywhere is the safest and costs the most analytics data; edit `REGIONS` and rebuild.
- Turn the whole layer off: `node scripts/redesign/build.js --no-consent`.
