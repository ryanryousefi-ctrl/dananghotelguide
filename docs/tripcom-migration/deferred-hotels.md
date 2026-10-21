# Deferred hotels: booking buttons removed until confirmed

The owner decided on 16 Oct 2026 that unresolved hotels must not delay the
migration. Their booking buttons are removed at cutover; reviews, photos and
names stay.

**To re-add one:** in `data/tripcom/decisions.json`:
1. set `"decision": "map"` and `"tripcom_id"`;
2. delete `"deferred"`;
3. run `build-registry.js`;
4. generate the link with `worksheet.js`;
5. run `apply.js`.

The original Booking.com destination stays recorded in `registry.json` and in
`cj-historical-inventory-2026-10-16.csv`.

| Hotel | Registry key | Links | Pages | Trip.com candidate | What's needed to re-add |
|---|---|---|---|---|---|
| An Bang Seaside Village | `hotel:an-bang-seaside-village-hoi-an` | 6 | an-bang-beach-hotels.html, best-value-hotels-hoi-an.html, hoi-an.html, where-to-stay-in-hoi-an.html | 6394813 (Seaside An Bang Homestay) | Confirm the Trip.com homestay is the same property as the reviewed An Bang Seaside Village. |
| Silk Path Grand Resort & Spa Da Nang | `hotel:silk-path-grand-resort-spa-danang` | 5 | da-nang-hotel-directory.html, silk-path-grand-da-nang.html | none found | Confirm the property exists in Da Nang; Silk Path Grand hotels are only known in Hue and Sapa. |
| Marriott Executive Apartments Danang Han River | `hotel:marriott-executive-apartments-danang-han-river` | 3 | da-nang-hotel-directory.html, hoi-an.html | none found | Operating at 58 Bach Dang; search the Trip.com Partners dashboard or ask support for its listing. |
| HAIAN River Hotel & Spa | `hotel:haian-river-hotel-spa` | 4 | da-nang-fireworks-festival-guide.html, da-nang-hotel-directory.html, da-nang-riverfront-hotels.html | possibly 62690509 (HAIAN Riverfront) | Confirm whether this is HAIAN Riverfront under an old name; do not substitute without confirmation. |
| Shantira Beach Resort & Spa | `search:Shantira Beach Resort & Spa||` | 4 | an-bang-beach-hotels.html, hoi-an.html | none found | Now Wyndham Shantira Resort Hoi An; ask Trip.com whether it is listed. |
| Sunrise Premium Resort Hoi An | `search:Sunrise Premium Resort Hoi An||` | 1 | hoi-an.html | none found | 222-room resort on Cua Dai; ask Trip.com whether it is listed. |

## Flagged for editorial review (content may be inaccurate)

- **Silk Path Grand Resort & Spa Da Nang:** no evidence it exists in Da Nang.
  It has its own review page (`silk-path-grand-da-nang.html`) with a
  "$140/night · via Booking.com" rate.
- **HAIAN River Hotel & Spa:** may be HAIAN Riverfront under an old name. Both
  appear on the site as separate hotels.
- **Rosewood Hoi An** (removed, not deferred): no evidence it has opened.
- **Hoi An Chic** (removed): delisted by Trip.com; check it still operates.
- **Waikiki Beach Hotel** (removed): now listed elsewhere as Hometown Beach Hotel.
- **Seahorse Signature:** filed under An Thuong, but its verified address is in
  Hai Chau (not changed; awaiting your decision).
