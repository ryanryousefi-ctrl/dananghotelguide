# Remaining Issues: Resolution Log

**Date:** October 13, 2026
**Scope:** every item in the "resolve all remaining actionable issues" brief.
**Untouched:** the CJ affiliate system (IDs, link format, programme). **No** clicks were sent through live CJ links during testing; test browsers blocked every CJ and Booking.com request.

> **Update 2026-10-14:** at the owner's request, the sitewide top-of-content disclosure bar (`.aff-disclosure`, 201 pages) was removed together with its generator `scripts/add-top-disclosure.js`. `scripts/audit-cj-affiliate.js` now fails if it reappears. The footer and in-content disclosures, including the contrast fixes, remain on all 175 pages that carry in-content affiliate links.

| Issue | Action Taken | Status | Commit |
|---|---|---|---|
| GitHub exposed token | Scanned config, credential stores, worktrees, tracked files and full history (values never printed). Found **two** exposures: (1) the old `ghp_` token in the `origin` URL, already removed and rejected by GitHub (push failed: "Invalid username or token"); (2) **a fine-grained `github_pat_` token committed to `translate-parallel.sh` in `d83bb12` (May 16), removed in `9b0083b`, in this PUBLIC repo**. GitHub's API returns **401** for it, so it is no longer valid. History left unrewritten: a force-push would overwrite other sessions' work and cannot un-publish a token already exposed. | VERIFIED ALREADY CORRECT (both tokens dead); OWNER ACTION REQUIRED to delete the dead entries from GitHub settings | — (local config only) |
| Secure Git authentication | `origin` = `https://github.com/ryanryousefi-ctrl/dananghotelguide.git` (no credentials). Ran `gh auth setup-git`: GitHub-only credential helper uses the existing `gh` login (keyring). Plain `git fetch` / `git push` verified working. Secret scanning and push protection were **already enabled**. Validity checks are not available on this plan (the API leaves them disabled). The only workflow (`localize-kr.yml`, manual) reads its key from repo Secrets. | FIXED AND DEPLOYED (local machine config) | — |
| Vercel domain redirect | `http→https` is already 308, paths and query strings are preserved, no loops. The apex `https://dananghotelguide.com → www` hop is **307** and comes from Vercel's domain settings, not `vercel.json`. The Vercel CLI login on this machine has **expired** (API: invalid token), so I could not change it. | OWNER ACTION REQUIRED | — |
| Affiliate disclosures | New top-of-content disclosure on **201 pages** (183 EN, 18 KO): "We may earn a commission when you book through our links, at no additional cost to you." plus a link to the editorial policy. Placed after the hero, or before the first in-content affiliate link where the hero contains one. Verified on desktop and mobile to sit before the first in-content CJ link. Own background, **8.4:1 contrast**. Footer disclosures fixed from as low as **1.05:1** to ≥4.5:1 on every page but one (homepage coral band: 4.0:1, the maximum white text reaches on that brand colour; the page also has the top disclosure). 28 nav-only pages (contact, policies) skipped. | FIXED AND DEPLOYED | `c8bed0a`, `3747685` |
| Mobile navigation | Below 1440px the nav now collapses to the menu button. **Before:** on 1101–1439px screens (incl. 1280/1366 laptops) the "Search Stays" booking button sat up to 325px off-screen. Button label "Search Stays" now visible at every width (icon-only only at ≤345px). Header social icons move from the phone header into the mobile menu (EN) or a new footer row (KO), so they stay reachable. Accessible name on every booking nav button. Verified at 320–1920px: 0 overflow, button always on-screen. | FIXED AND DEPLOYED | `c8bed0a`, `3747685` |
| Hoi An booking widget | Root cause was sitewide, not Hoi An only: the hero date widget was **clipped off the right edge on 78 of 118 pages at 390px (97 at 360px)**. Fixed in `bk-widget.css` (hero rows wrap on phones) and `bk-widget.js` (fixed-height heroes: widget moves directly below the hero on a solid panel). `role="search"` added. Verified 0 clipped at 320/360/390/414/768px. | FIXED AND DEPLOYED | `c8bed0a`, `3747685` |
| Mobile tap targets | On touch screens: widget button 28→44px, date fields 40px (16px text, no iOS zoom), nav booking button 41→44px, hotel-card name links on the Hoi An templates 29–32→44px, plus card CTA classes sitewide. What remains under 44px: footer link lists (28px) and some in-sentence links, all above the WCAG 2.2 AA 24px minimum or exempt as inline links. | FIXED AND DEPLOYED | `c8bed0a`, `3747685` |
| Informational-to-commercial links | Weather guide: "Best Month By Traveler Type" now points to where-to-stay + family / couples / budget shortlists; My Khe section → My Khe hotel shortlist. Budget guide: after the rent comparison, a sentence for people arriving before a lease → cheap-hotels guide + prices by month. Beach hotels guide → under-$100 and private-beach shortlists. Budget hotels → under-$100. (Earlier commit `c36e42f`: My Khe guide, hotel-price pages.) No prices, availability or experiences invented. | FIXED AND DEPLOYED | `c8bed0a`, `3747685` |
| Technical SEO | Validator over all 229 HTML files plus the sitemap: **0** broken internal links, 0 canonical errors, 0 sitemap errors, 0 invalid JSON-LD, 0 duplicate titles or descriptions. Fixed: 3 comparison pages whose `hreflang="en"` pointed at `hyatt-vs-marriott-da-nang.html`; 8 Korean-only pages declaring English "equivalents" that were unrelated pages (removed; `ko` self-reference kept); duplicate H1 on Arbora; orphaned `best-beach-hotel-under-100-da-nang.html` (0 internal links → 2). **Also fixed:** `contact.html` had a broken `<p class=` tag that swallowed the hamburger-menu script (menu dead on that page, script text rendered); a share-bar script threw a JS error on 4 pages and failed partially on 5 more (now null-safe on all 194); homepage carousel caused 48px horizontal scroll on desktop; 22 pages had pre-existing horizontal scroll on phones (tables, grid blow-out, footer row). Not done (needs approval): merging the two family-resort pages. | FIXED AND DEPLOYED | `c8bed0a`, `3747685` |
| GA4 custom dimensions | No Google Analytics admin credentials on this machine, so I can't see or register them. `link_sid` must stay unregistered. Event tracking re-verified: one event per click (§Verification). | OWNER ACTION REQUIRED | — |
| AdSense consent configuration | No AdSense access here. Google requires a Google-certified, IAB-TCF CMP to serve **personalised** ads to EEA/UK (since 16 Jan 2024) and Switzerland (since 31 Jul 2024) visitors. Google's own Privacy & messaging CMP meets that and needs no extra code (the AdSense tag is already on every page). No banner added, to avoid a duplicate. Affiliate links don't depend on any cookie set by this site, so they work whatever consent a visitor chooses. Configuring this is not a legal-compliance determination. | OWNER ACTION REQUIRED | — |
| Final production verification | See §Verification. | FIXED AND DEPLOYED | `c8bed0a`, `3747685` |

## Commits

| Commit | Content |
|---|---|
| `c8bed0a` | Booking widget: mobile clipping fix, tap targets, `role="search"` (`bk-widget.js`, `bk-widget.css`) |
| `3747685` | Disclosures (top + footer contrast), mobile header, tap targets, overflow fixes, `contact.html` repair, share-bar fix, hreflang/H1 fixes, internal links (230 HTML files, `phase10.css`, `hotel-review-modern.css`, `scripts/add-top-disclosure.js`) |
| *(this commit)* | This report |

Not commits: git remote and credential-helper configuration on this machine.

No other session committed during this work (`HEAD` = `origin/main` checked before each commit). Both commits were pushed with a plain `git push`, which confirms the new authentication setup works.

## Verification (production, after `3747685`)

| Check | Result |
|---|---|
| `scripts/audit-cj-affiliate.js` | 0 issues |
| `scripts/audit-cj-live.js` | 203 URLs discovered, 203 live, **1,591 CJ links**, 0 non-200, 0 issues |
| CJ identifiers | All 1,585 CJ links on the 202 sitemap pages use `click-101820678-17293132`; no other ID pair exists |
| Untracked Booking.com paths | 0 (static hrefs, JS/JSON literals, `window.open` builders, site JS) |
| JS errors (192 pages × mobile 390px + desktop 1280px) | 0 |
| Horizontal overflow (same) | 0 |
| Header booking button on-screen (same) | 192/192 at both widths; also verified at 320, 360, 375, 414, 768, 1024, 1366, 1440 and 1920px on sample pages |
| Hero date widget | 0 clipped at 320/360/390/414/768px; button 44px |
| Disclosure contrast | 225 of 226 instances ≥4.5:1; 1 at 4.0:1 (homepage coral band) |
| CJ runtime (homepage widget, directory cards and popups, `bk-widget`, CJ page script, no mixed content) | All pass, desktop and mobile |
| GA4 | Exactly 1 `booking_click` per click on 6 page types + 1 event per widget submit, desktop and mobile |
| Redirects | `http→https` 308; `/kr` → `/kr/` 308; old `review-*` URLs 308; apex → www still **307** (owner) |

**Differences from the baseline:** none. 203 pages, 1,591 CJ links, 0 audit issues and 0 broken internal URLs are all unchanged. No affiliate link was added, removed or altered.

---

## 1. What I fixed for you

- **Both exposed GitHub tokens are dead.** One was a token committed in May to this *public* repo, which I found during this pass. Git now authenticates through your `gh` login with nothing in any URL, and plain `git push` works.
- **Booking widget, `c8bed0a`.** The hero date picker was cut off on about two-thirds of pages on phones; now 0 of 118. It also has a 44px button and no iOS zoom.
- **Header, `3747685`.** On 1280px and 1366px laptops the "Search Stays" booking button was off-screen. It's now always visible and labelled, on all widths from 320px to 1920px.
- **Disclosures, `3747685`.** A readable disclosure now sits before the first affiliate recommendation on 201 pages (English and Korean). Footer disclosures went from effectively invisible (as low as 1.05:1) to readable.
- **Mobile usability, `3747685`:**
  - 44px booking tap targets;
  - horizontal scrolling removed on 22 phone pages and on the desktop homepage;
  - the broken contact-page footer that disabled its mobile menu;
  - a share-bar script error on 9 pages.
- **SEO, `3747685`:**
  - wrong hreflang on 11 pages;
  - a duplicate H1;
  - an orphaned under-$100 page;
  - new links from the weather, budget and beach guides to the matching hotel pages.
- **Verified on production:** see the table above.

## 2. What you personally need to do

**A. Delete the dead GitHub tokens (about 3 minutes).** Both already fail authentication. This is clean-up.
1. Go to github.com → your avatar → **Settings** → **Developer settings**.
2. Open **Personal access tokens → Fine-grained tokens**. Delete any token created around **May 2026**, and any token marked expired, that you don't recognise as in current use. The leaked one was used by a Korean translation script (`translate-parallel.sh`).
3. Open **Personal access tokens → Tokens (classic)**. Delete any token, with a `ghp_` prefix, that was used for pushing this repo before today. The *GitHub CLI* login is a separate **OAuth app** authorisation (Settings → Applications), not a classic token. Leave that one, because pushes now depend on it.

**B. Make the bare-domain redirect permanent (about 2 minutes).**
1. vercel.com → the **dananghotelguide** project → **Settings** → **Domains**.
2. On `dananghotelguide.com` (the one that redirects to `www`), click **Edit**.
3. Keep "Redirect to `www.dananghotelguide.com`" and change the status code to **308 Permanent Redirect** → **Save**.
4. Optional: run `vercel login` again on this Mac, since the stored CLI login has expired.

**C. Register three GA4 custom dimensions (about 5 minutes).**
1. analytics.google.com → property with measurement ID **G-0T1H4G2N80** → **Admin** (gear icon).
2. **Data display → Custom definitions → Create custom dimension**, three times, each with **Scope: Event**:
   - Dimension name `CTA location`, event parameter `cta_location`
   - Dimension name `Destination type`, event parameter `dest_type`
   - Dimension name `Hotel name`, event parameter `hotel_name`
3. Do **not** create one for `link_sid`.

**D. Turn on Google's consent message for EEA/UK/Swiss visitors (about 10 minutes).**
1. adsense.google.com → **Privacy & messaging** → **European regulations** → **Create message**.
2. Select **dananghotelguide.com**, choose the language(s), and keep the default **Consent** and **Manage options** buttons. Optionally add **Do not consent**, to treat rejection as clearly as acceptance.
3. Under the message's **settings**, enable the option to **use these consent choices for Google consent mode** (analytics and ads purposes) so GA4 respects choices. It is off by default.
4. **Publish.** Then visit the site through an EU VPN and confirm that the message appears, that rejecting still lets you click "Search Stays" and reach Booking.com, and that the page still works.

   Publishing this message is not a legal opinion. If you need GDPR certainty for analytics cookies, ask a qualified adviser.

**E. Read the Booking.com programme terms in CJ** (from the roadmap; still the biggest revenue question). In CJ → **Advertisers** → **Booking.com North America** → **Program Terms**, check whether bookings by visitors outside the US and Canada are commissionable. Compare with the **APAC** programme, which fits your audience: 47% of your clicks are APAC, against 17% from North America.

**F. Decide (optional):** whether to merge `best-family-resort-da-nang.html` into `family-hotels-da-nang.html`. I didn't touch this, per your instruction.
