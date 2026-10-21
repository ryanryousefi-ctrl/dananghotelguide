# Hotels needing a decision before cutover

Verification method: the Trip.com ID came from Trip.com's own indexed hotel pages.
Each ID was then loaded in a browser (`trip.com/hotels/detail/?hotelId=`) and its
name and address compared with the site. 100 of 117 Booking hotel slugs (822 of 915
hotel links) are VERIFIED. Everything below needs a human decision. Record it in
`data/tripcom/registry.json` (`tripcom_id` after confirming, or `fallback_key`), or
edit the link out of the page.

## A. Probable match, confirm (6 hotels, 47 links)

| Booking slug | Site name | Links | Candidate Trip.com ID | What to confirm |
|---|---|---|---|---|
| danang-marriott-resort-spa-non-nuoc-beach-villas | Da Nang Marriott Resort & Spa | 31 | **993558** (resort) or 7362595 (Non Nuoc Beach Villas) | Both are live, separate listings. The site copy describes the resort, so 993558 is recommended; the old Booking slug was the combined "…Non Nuoc Beach Villas" listing. Ask Trip.com which one to promote. |
| an-bang-seaside-village-hoi-an | An Bang Seaside Village | 6 | 6394813 | Trip.com calls it "Seaside An Bang Homestay" (Tan Thanh, An Bang). Same owner/property? |
| brown-bean-da-nang | Brown Bean Hotel | 4 | 3793278 | Only "Brown Bean 2 Hotel" (380 2 Thang 9) exists on Trip.com. The site gives no address. |
| sel-de-mer-danang | Sel de Mer Hotel & Suites | 3 | 44098117 | The ID now shows "Prince Hotel Da Nang", 92 Vo Nguyen Giap: possibly a rebrand. Check the site review is still accurate. |
| the-tms-hotel | TMS Hotel Da Nang Beach (2nd slug) | 2 | 24529624 | Second Booking slug for TMS. Almost certainly the same hotel. |
| m-hotel-da-nang-beach | M Hotel Da Nang Beach | 1 | 117011133 | Card text matches M Hotel Danang (286 Vo Nguyen Giap). Different Booking slug. |

## B. Not on Trip.com (11 hotels, 46 links)

Searched trip.com by name and variants. No listing found:
- Azura Hotel Da Nang (10 links);
- Silk Path Grand Resort & Spa Da Nang (5);
- Waikiki Beach Hotel / grand-sunrise (4);
- HAIAN River Hotel & Spa (4);
- Han Riverine Hotel n' Cafeteria (4);
- Orange Hotel Danang (4);
- Adamo Hotel Da Nang (3);
- Daisy Boutique Hotel (3);
- Hoi An Chic Hotel (3). Its old Trip.com ID 713912 now redirects to the homepage;
- Marriott Executive Apartments Danang Han River (3);
- Seahorse Tropical Natalie Danang (3).

Options per hotel:
1. Point the button at the city list (`fallback_key` to the Da Nang or Hoi An
   search entry) and relabel it, e.g. "Compare Da Nang hotels on Trip.com". A
   button saying "Check Azura prices" must not lead to a generic list.
2. Remove the booking button and keep the review.
3. Ask Trip.com support whether they can map the property.

The site also has dedicated review pages for some of these (e.g.
`azura-da-nang.html`). Re-check that each still makes sense with no booking
path.

## C. Hotel-name searches with no Trip.com listing (7 searches, 14 links)

The site links to Booking.com *search results* for:
- Shantira Beach Resort & Spa (4);
- VNJ Capsule 159 / 216 / Hoi An (2 each);
- Cua Dai Beach Hotel Hoi An (2; Trip.com only has a different "CUA Dai Beach Homestay");
- Rosewood Hoi An (1; no evidence it has opened);
- Sunrise Premium Resort Hoi An (1).

Default fallback: the Hoi An city list (1775), with the label changed to a
generic "Hoi An hotels". Or remove the links.

## D. Free-text searches, copy review only (3 links)

"Bali private villa", "Phuket beachfront resort" and "Nha Trang beachfront" map
to the Trip.com city lists (723, 725, 1777). The filter words are lost, so
check the surrounding copy doesn't promise villas or beachfront.

## E. Other notes

- **Wink Hotel Danang Riverside** (verified 105594116): Trip.com's address is
  351 Tran Hung Dao (east bank). The site directory says "Bach Dang extension,
  Hai Chau". The site address looks wrong.
- **Royal Beachfront** (verified 117476210 "Royal Beachfront Villas & Spa"): a
  separate "Royal Beachfront Resort & Spa" (132314795) exists. Don't swap them.
- **Renamed on Trip.com but verified by slug or address:**
  - Belle Maison Hadana Hoi An → "Hadana Boutique Resort HoiAn" (2381983);
  - Raon Danang Beach → now "UrbanR Danang Beach" (9628571). Raon has no live
    links and was delisted from Booking;
  - Ocean Star → "Ocean Star Da Nang Bay Hotel" (6123718, same address);
  - Fusion Maia → TIA Wellness Resort (713692).
- **The 5 hotels delisted from Booking earlier.** They no longer have links on
  any served page; this is for history only:
  - Fusion Suites: not on Trip.com;
  - Rom Casa Hostel: not on Trip.com;
  - Bantique: not on Trip.com;
  - Sunset Sea: **on Trip.com** as 114967822 (16 Loseby, Son Tra);
  - Raon: see above.

  Sunset Sea could get a booking button back.
- **Out-of-region hotels** linked from travel/comparison pages are all verified:
  - Sofitel Legend Metropole Hanoi 1501255;
  - JW Marriott Phu Quoc 6489167;
  - Premier Village Phu Quoc 17472672;
  - Regent Phu Quoc 71566951;
  - Park Hyatt Saigon 2073112.
