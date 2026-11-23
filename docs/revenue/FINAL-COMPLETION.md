# Final completion report (2026-11-23)

Start: production `8ab6573` (branch `final-completion`). All work deployed; see Production.

## Completed

**Hotels fact-checked: all 21 reviewed hotels.** Research saved per hotel in `data/hotels/research2/*.json` (source URLs, verdict for every objective claim in our reviews, confidence). Distances recomputed with one documented method in `data/hotels/routes.json`: straight line from OpenStreetMap coordinates, road and walking routes from OSRM (no traffic, labelled as estimates). `data/hotels/facts.json` is the source of truth for the finder, compare tool and cards; opinions stay in `scripts/revenue3/editorial.js`. Open questions are listed in `data/hotels/UNRESOLVED.md` and are shown as "not verified" or omitted.

**Objective claims corrected: 1,341 logged edits** (before/after/reason in `docs/revenue/fact-fixes/`) across 21 reviews, 110 English pages that mention these hotels and 17 Korean pages. Main corrections:
- Rooftop pools that do not exist: Brilliant (indoor pool + rooftop bar), Hilton, Novotel (podium pool), Grand Mercure (ground-level), Wyndham (4th floor).
- Wrong areas: Sheraton Grand, Marriott, Hyatt, Meliá Danang, Naman are on the Non Nuoc / Truong Sa coast, not My Khe; Furama, Pullman, Premier Village, TIA are on the southern My Khe / Bac My An strip; Premier Village is not on Son Tra (map pin moved 6 km).
- Names: Radisson Hotel Danang (not Radisson Blu; the only Radisson Blu is in Hoi An), Meliá Vinpearl Danang Riverfront, Sheraton Grand Danang Beach Resort & Spa, TIA Wellness Resort (formerly Fusion Maia; duplicate "Fusion Maia" entries merged as a former-name note).
- Numbers: Sheraton 258 rooms (not 785); Hyatt 5 outdoor pools (no lazy river); InterContinental 3 resort pools and a kids' club; Danang Marriott 239 rooms, opened 2022 (the villa claims belonged to the separate Non Nuoc Beach Villas); Premier Village villa sizes; conflicting room counts removed.
- Distances and times: Hilton 4.4 km straight / about 11 km by road to the airport, 7-minute walk to Han Market; Grand Mercure about 36 minutes on foot to Han Market (our Phase 2 "10 minutes" was wrong); Meliá Vinpearl about 19 minutes; airport, Dragon Bridge and Hoi An times relabelled by method.
- Inclusions: TIA is not all-inclusive or adults-only (Wellness Inclusive = breakfast + two treatments per night; Kids Wellness Club listed).
- Tet 2027 page and visible "[VERIFY]" markers were fixed in Phase 3; none remain.

**Pages updated: 212** (190 English, 22 Korean), including performance changes.

**Skipped guides resolved: 13 of 13.** Twelve pages without section structure got an early price-check module at an individually chosen point after the first useful answer; the Four Points review (no Phase 1 module) got an editor's verdict with its verified hotel link. No exclusions were needed: all 13 have hotel-planning intent.

**Commercial modules:** 120 pages with modules plus homepage, Where to Stay and tools; guardrail audit (`cta-audit.js`): no adjacent duplicate modules, counts within limits. Booking labels normalised so every Trip.com button names the property it opens (Radisson, Marriott, TIA); 0 buttons naming a different hotel than their link.

**Finder / compare / shortlist fixes:**
- Finder objective filters now come from verified data (beachfront, kids' club, lounge, airport road time, walking time to Han Market); new "nightlife" (labelled our judgement) and "near the airport" choices; budget relabelled "Hotel category (star rating, not price)"; Save and Compare on every result.
- Compare tool uses verified names, pool wording and method-labelled distances (airport, Han Market, Dragon Bridge, Hoi An); unknowns read "Not verified".
- **Bug fixed:** generated pages loaded `dn-shortlist.js` up to three times, so Save toggled unreliably (live since Phase 3). Load-once guards added to shortlist, sticky bar and compare scripts; generators de-duplicate asset tags.

**SEO and performance:** 317 below-fold images lazy-loaded; Google Fonts made non-render-blocking (noscript fallback); duplicate synchronous `search-engine.js` removed from the homepage head; 89 oversized JPEGs recompressed (37 MB to 22 MB, max 1600 px); consent banner waits for fonts so it no longer shifts; one pre-existing overflow fixed (Korean malls page at 768 px). Lazy-river page retitled honestly (URL kept).

**Analytics readiness:** events reviewed: `affiliate_click` (one per click, verified in browser), `dn_compare_use`, `dn_shortlist_save/remove/return`, `dn_copy_link`. Manual GA4 dimension checklist: `docs/revenue/ga4-setup-checklist.md`.

## Validation
- **Affiliate integrity:** strict validator `--cutover` 0 failures on 212 pages; selftest 30/30; `affiliate-proof.js` vs `8ab6573`: 0 existing Trip.com hrefs altered, 1 removed on purpose (Grand Mercure card on the no-car guide, because it is a 36-minute walk from Han Market), 10 new, all exact registry URLs; banner suite 16/16 with 162 placements; no Booking.com buttons on served pages.
- **Browser tests:** `functional-test.js` 27/27 (no auto-open, exactly one `affiliate_click` per click, finder scenarios: family beachfront resort, luxury couple, no car, nightlife, city hotel, near airport; shortlist save/remove/persist/clear, storage blocked, compare deep links and 3-hotel cap, consent banner, sticky bar). `live-smoke.js` on production 35/35 (14 pages x 2 widths incl. map, directory, Korean, plus live clicks and tools).
- **Mobile:** overflow sweep of all 190 changed pages at 320/390/768/1280: 0 overflow, 0 page errors; flagship, homepage and tools also at 375/428/1024/1440. Real devices: **not tested** (none available).
- **Facts:** `fact-consistency.js` on 213 pages: 0 errors (1 warning: Brilliant's beach label rests on low-confidence research but is evident from its map position).
- **SEO:** 0 non-news broken internal links (the `news.html` hits are the Vercel rewrite), 0 canonical mismatches, 0 invalid JSON-LD, sitemap complete.
- **Repo safety:** `repo-hygiene.js` + pre-commit hook (blocks `node_modules`, symlinks, files over 6 MB; tested by staging a symlink: blocked). `npm ci` verified from a fresh clone.
- **Vercel:** all three projects built successfully for every merge.

### Lighthouse (mobile, production, single runs; third-party ads/analytics vary run to run)
| Page | Before (8ab6573) | After batches A-D | After batch E (consent fix) |
|---|---|---|---|
| Homepage | Perf 31, LCP 8.8 s, CLS 0.104, TBT 1,220 ms | Perf 82, LCP 2.9 s, CLS 0.075, TBT 470 ms | Perf 67, LCP 5.0 s, CLS 0, TBT 290 ms |
| Where to Stay | Perf 89, LCP 3.4 s, CLS 0, TBT 140 ms | Perf 81, LCP 2.6 s, CLS 0.09, TBT 560 ms | Perf 87, LCP 3.7 s, CLS 0, TBT 70 ms |
| Hilton review | Perf 57, LCP 8.4 s, CLS 0.094 | Perf 90, LCP 2.6 s, CLS 0 | (not re-run) |
| Best hotels list | Perf 46, LCP 18.0 s, CLS 0 | Perf 89, LCP 3.0 s, CLS 0.09 (consent banner, fixed in E) | (not re-run) |
| Hyatt vs Marriott | Perf 66, LCP 7.9 s | Perf 72, LCP 7.4 s | Perf 72, LCP 5.1 s, CLS 0 |
| Compare tool | Perf 92, LCP 2.7 s | Perf 99, LCP 1.7 s | (not re-run) |
| Hotel finder | Perf 94, LCP 2.7 s | Perf 99, LCP 1.7 s | (not re-run) |

Accessibility 92-100 and SEO 92 unchanged; Best Practices 75-79 unchanged (third-party cookies from AdSense). Raw JSON reports are kept outside the repo in `~/dananghotelguide-evidence/final/lighthouse/`. Single mobile runs vary by 10-15 points with ad and analytics load; the homepage's two after-runs scored 82 and 67.

## Remaining genuine limitations
- **External access:** no GA4 Admin or Search Console credentials, so custom dimensions are not created and no traffic, ranking or revenue figures exist; no clicks or revenue improvement is claimed.
- **Unverifiable facts:** listed in `data/hotels/UNRESOLVED.md` (several official hotel sites block automated access; those items are omitted or marked).
- **Deep links:** Azura (not on Trip.com), Fusion Suites and Silk Path have no registry deep link; they can only be generated by the account owner in the Trip.com Partners dashboard. Existing truthful general-search behaviour kept.
- **Third-party cost:** AdSense and Google Tag Manager remain the largest main-thread cost; changing ad loading is a revenue decision left to the owner.

## Production
- **Final production commit:** `62139e0` (merge of batch E; batches A-D merged as `69dfa82`). This report is committed on top.
- **Previous production:** `8ab6573`.
- **Rollback:** `git revert -m 1 62139e0` (consent timing only), `git revert -m 1 69dfa82` (all fact, tool and performance work), then push `main`; or promote the Vercel deployment of `8ab6573` in each of the three projects. Individual batch commits on `final-completion` (`d09f80c` hygiene, `af13fdb` skipped guides, `07ce77e` facts, `c06fbc4` tools, `d454541` performance, `b12f747` consent) can be reverted on their own.
- **Live verification:** all three Vercel projects built successfully for both merges; `live-smoke.js` on production 35/35 after the final merge.
