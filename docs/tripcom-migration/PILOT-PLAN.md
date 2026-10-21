# Phase 5: controlled live pilot (prepared, not deployed)

## Pilot A (default): five hotel review pages

`data/tripcom/pilot.json`: hyatt-regency-da-nang, intercontinental-da-nang, brilliant-hotel-da-nang, furama-resort-da-nang, four-points-sheraton-da-nang.
Each page carries exactly two destinations (its hotel and the Da Nang city list), so only **six** dashboard-generated links are needed. All five hotels are VERIFIED/high-confidence matches with no open decision. Marriott is excluded (two listings, question 9).

On these five pages every booking button, the header "Search Stays" button and the mobile-menu button become Trip.com buttons; every other page stays on Booking.com/CJ. No page mixes providers (`validate.js --pilot` enforces this).

Commands (after the links are imported and the profile approved):

```
node scripts/tripcom/apply.js --pilot            # dry run: must show 0 blockers
node scripts/tripcom/apply.js --pilot --write
node scripts/tripcom/validate.js --pilot         # static: pilot pages Trip.com, all others untouched CJ
node scripts/tripcom/validate.js --pilot --render --ga
```
Also add `!/tripcom-cta.js` to `.vercelignore` (allowlist) in the same commit, and update `privacy.html`/`terms.html` wording (drafts in `legal-and-disclosure-drafts.md`) for Trip.com because pilot visitors will be sent there: your approval needed.

## How much traffic will it get?

Search Console, last 3 months: **623 clicks across the whole site** (183 pages). The five pilot pages have 0-2 clicks each. Expect no booking inside 30 days. Evidence from Pilot A could take many months.

## Alternative Pilot B: traffic-weighted

Higher-traffic pages with a single destination (the Da Nang city list) would test the city link and the header button much faster but are not hotel pages: da-nang-fireworks-festival-hotels (63 clicks), da-nang-budget-guide (32), da-nang-grab-guide (30), da-nang-weather-by-month (24). Their traffic is informational, so booking intent is lower. Mixing A and B (6 + 4 pages) needs no additional links (still 6 unique destinations). Your decision; I have not enabled it.

## Comparing GA4 with Trip.com

See ATTRIBUTION-VALIDATION.md section 8. Record everything in `pilot-evidence.json`.

## Success criteria (honest)

- Success = a genuine referred customer's booking appears in the Booking report with the right hotel/date, then an eligible Commission-report line after check-out.
- No bookings after a reasonable window is **not a failure and not a success**: report "uncertain". Do not extend the pilot with manufactured clicks, test reservations or self-referrals.
