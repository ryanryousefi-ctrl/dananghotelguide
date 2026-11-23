# Trip.com partner research (2026-11-23). Official pages were thin/JS-rendered; most detail is UNCONFIRMED.

1. Products/commission
- Official https://www.trip.com/partners/ : hotels, flights, trains, tours & tickets, "more"; "up to 7%". (confirmed, official)
- Official commission page title: "up to 7%"; tables did not render in fetch. Search snippet of the commission page: hotels 5% (0-199 bookings), 6% (200-999), 7% (1000+); intl flights 0.5%; China domestic flights fixed USD0.6/ticket; tours&tickets 4%; attractions/shows 1.5%; car rental 5%; "subject to change". PARTIALLY CONFIRMED (snippet only; verify in dashboard).
- Third parties conflict: Uppromote hotels 5.5-7%, tours 2.5-4%; trip.com/ask FAQ (sg.trip.com/ask/questions/trip.com-affiliate-program.html) says hotels 2-7%, tours 3-7%. Treat as unreliable.
- eSIM, airport transfer as separate commission lines: UNCONFIRMED.
2. Cookie / cross-product
- 30-day cookie: reported on Trip.com partner page snippet + Awin profile (95-day validation). Official page not fetchable -> LIKELY, verify. Cross-product attribution from a hotel click: UNCONFIRMED (not found anywhere).
3. Tools
- Deep link generator, search box/widgets, banners, API feeds, tracking in dashboard: listed by third parties/FAQ; banner sizes UNCONFIRMED. Partner API docs (apidoc.trip.com) use aid / sid params. trip_sub1/2/3 : NOT found in any public official doc -> UNCONFIRMED (our links evidently carry trip_sub from the dashboard link tool; ask affiliation@trip.com whether trip_sub1-3 are reported). Reporting display of sub-IDs: UNCONFIRMED.
- Official support contact: affiliation@trip.com (include account ID).
4. Da Nang transfers/attractions
- Trip.com has product pages: au.trip.com/things-to-do/detail/102358637/ (private car Da Nang/airport <-> Ba Na Hills), ph.trip.com/things-to-do/detail/99456108 (Da Nang-Hoi An-Ba Na Hills transfer; Ba Na ticket w/ cable car), Marble Mountain + Hoi An day tours exist. Affiliate-linkability: FAQ says links for "almost any product"; must be generated/tagged via dashboard -> assumed yes, UNCONFIRMED officially. Use dashboard link tool with product URL.
5. Rules (brand, "lowest price", paid search, disclosure): NOT found on public pages -> UNCONFIRMED. Check partner T&Cs in dashboard; generally add affiliate disclosure (FTC) and avoid price guarantees/bidding on Trip.com brand terms.
6. Hotel deep links - step by step (general; exact UI UNCONFIRMED)
 a. Find hotel on trip.com, copy hotel detail URL (contains hotelId, e.g. /hotels/hue-hotel-detail-2197354/...).
 b. Partners dashboard -> link/deeplink tool -> paste URL -> set sub-ids -> generate -> copy link (…hotelId=…&Allianceid=11013066&SID=333523744…).
 Hotels:
 - Silk Path Grand: no Silk Path Grand in Da Nang found anywhere. Existing Silk Path properties: Silk Path Grand Hue Hotel (2 Le Loi, Hue) hotelId 2197354, https://uk.trip.com/hotels/hue-hotel-detail-2197354/silk-path-grand-hue-hotel (verified Trip.com page); Silk Path Grand Sapa Resort & Spa hotelId 11284150, https://ph.trip.com/hotels/tt-sa-pa-hotel-detail-11284150/silk-path-grand-resort-and-spa-sapa. Our page silk-path-grand-da-nang.html (title "Silk Path Grand Resort & Spa Danang") appears to describe a property that I could not verify exists in Da Nang -> FLAG as potentially wrong/fabricated; owner must check.
 - Fusion Suites Danang Beach: not found on trip.com via search (found on Expedia/Booking/Agoda). Search Trip.com directly; UNCONFIRMED.
 - "Azura Da Nang": no such Trip.com listing. Closest: Azure Hotel Danang https://th.trip.com/hotels/da-nang-hotel-detail-10525460/azure-hotel-da-nang/ (id 10525460, Son Tra, 2-star); Azure Beach Hotel https://uk.trip.com/hotels/hoi-an-hotel-detail-121212809/azure-beach-hotel (121212809); "Azura Hotel" is Nha Trang (2611946). Confirm which is meant.
Sources: trip.com/partners, sg.trip.com/ask/questions/trip.com-affiliate-program.html, uppromote.com directory, ui.awin.com/merchant-profile/5968, apidoc.trip.com, involve.asia, travelpayouts.
