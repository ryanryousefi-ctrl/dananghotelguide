# Hotel facts we could not settle (23 Nov 2026)

Everything else in `facts.json` is sourced in `research2/*.json` (URLs + date) with distances in `routes.json`. These items stay **out** of the finder, compare tool and cards as definite claims; pages say "not verified", "listings differ" or omit the number.

| Hotel | Open question | Why unresolved |
|---|---|---|
| Brilliant Hotel | Pool type (listings say indoor) and room sizes | No official site found; listing pages blocked (429), snippets only. Confidence low |
| A La Carte Da Nang Beach | Room count (sources give 301, 202 and 117) | Official site unreachable |
| Meliá Danang Beach Resort | Room count (408 / 521 / 528) and exact pool count (about 7) | melia.com returned 403 |
| Wyndham Soleil Danang | Room count (official 882 vs 380 in one listing), executive lounge | Lounge only on Trip.com |
| Muong Thanh Luxury | Pool type (outdoor vs indoor) | Listings contradict each other |
| Novotel Danang Premier Han River | Pool floor (podium, per a 2016 page) | Accor/Trip.com give no floor; no rooftop pool in any source |
| Hilton Da Nang | Whether lounge access includes breakfast; whether the pool is on the roof | Only guest reviews; Hilton site 403 |
| Furama, Pullman | Exact pool counts; Pullman executive lounge | Listings conflict (1 vs 2 pools) |
| Premier Village | Kids' club | Snippet-level only |
| Sheraton Grand | Club lounge | Not listed by sources opened |
| InterContinental | Named dining claims (HARPO's / chef partnerships) | Not checked |

Method notes: road and walking figures are OSRM routing estimates without traffic; straight-line is great-circle from OpenStreetMap coordinates. Hotel coordinates come from Nominatim or the hotel's own site (see `coord_source`). Re-verify every 6 months: `node scripts/revenue3/fact-consistency.js` warns when a record is older than 180 days.
