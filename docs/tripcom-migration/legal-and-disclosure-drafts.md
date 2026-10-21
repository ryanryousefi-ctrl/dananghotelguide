# Draft wording for approval: disclosures, privacy, terms, About

Status: **draft, not applied**. Nothing here changes a page until you approve
it. Items in [brackets] depend on Trip.com's answers and stay generic until then.

Principles used:
- say plainly that hotel links are Trip.com affiliate links and that we may
  earn a commission at no extra cost;
- name no commission rates or cookie durations we haven't confirmed;
- keep the existing promise that commission never affects rankings;
- remove CJ, Booking.com and Airbnb references that will no longer be true.

---

## 1. Sitewide affiliate disclosures (applied automatically at cutover)

The cutover script rewrites the existing disclosure blocks. Today it produces
the same sentences with "we earn" instead of "we may earn". Once you approve the wording below (or your edit of it), I'll set the
script's rules to produce exactly that.

| Where | Current | Proposed |
|---|---|---|
| Footer box (about 115 pages) | Affiliate disclosure: Booking links go to Booking.com [and Airbnb] [via the CJ affiliate network]. We earn a small commission on completed bookings at no extra cost to you. This never influences our editorial rankings. | **Affiliate disclosure: hotel booking links go to Trip.com. We may earn a small commission on completed stays, at no extra cost to you. This never influences our editorial rankings.** |
| Footer legal line (about 85 pages) | Da Nang Hotel Guide earns a commission when you make a booking through our Booking.com links, at no extra cost to you. This never influences editorial rankings or recommendations. | **Da Nang Hotel Guide may earn a commission when you book through our Trip.com links, at no extra cost to you. This never influences editorial rankings or recommendations.** |
| Trademark line (9 pages) | Booking.com is a registered trademark of Booking.com B.V. | **Trip.com is a trademark of Trip.com Group Limited.** [or delete the line; it is optional] |
| Korean footer (kr/) | 제휴 공개: Booking.com 링크를 통해 예약 시 소정의 수수료를 받습니다 | **제휴 공개: Trip.com 링크를 통해 예약 시 소정의 수수료를 받을 수 있습니다** |
| Generic "Some links on this page are affiliate links…" | (unchanged; already accurate) | no change |

Change in wording: "we earn" becomes "we may earn". A Trip.com commission is
paid only after a completed stay, so "may" is accurate for every click.

---

## 2. Privacy policy (`privacy.html`)

**Section "Affiliate links and third-party services"**: replace both paragraphs:

> This site is a member of the Trip.com affiliate programme. Hotel booking
> buttons and links take you to Trip.com. When you visit Trip.com, Trip.com's
> own privacy policy and cookie policy apply.
>
> Trip.com uses cookies and similar technology to recognise that you arrived
> from this site, so that a booking can be credited to us. [Optional, once
> Trip.com confirms: The credit period is N days.] We do not receive your name,
> contact details or payment details from Trip.com. We receive only aggregated
> reports of bookings and commissions.

**Section "Cookies"**: replace. The current text says the site sets no cookies,
which is not accurate today. See the audit for the full list and final wording.

> Da Nang Hotel Guide uses Google Analytics to understand how the site is used,
> for example which pages are read and which booking buttons are clicked.
> Google Analytics sets first-party cookies (such as `_ga`) for this purpose.
> Google AdSense may set cookies to serve and measure ads. Google Fonts and
> Trip.com (when you follow a booking link) may set cookies under their own
> policies. You can block or delete cookies in your browser settings.

**Analytics paragraph** (add, or merge into an existing analytics section):

> When you click a hotel booking button we record an anonymous event: the
> page, the button's position, the hotel name and your device type (mobile,
> tablet or desktop). This tells us which recommendations are useful. It does
> not identify you.

Superseded by the full audit (`~/Desktop/DNHG/PRIVACY-TRACKING-AUDIT-2026-10-16.md`),
which corrects this draft. AdSense loads on 199 pages, not only the homepage,
and the CJ impression tag, Ahrefs (27 pages) and YouTube embeds (7 pages) are
also present. Use the audit's cookie and affiliate wording instead of the
Cookies paragraph above. The audit also covers whether a consent tool is
needed.

---

## 3. Terms (`terms.html`)

**"Always verify pricing…"** sentence:

> Always verify pricing and availability on Trip.com or with the hotel before
> making a booking decision. We accept no liability for outdated pricing
> information.

**Section "Affiliate relationships"**:

> Da Nang Hotel Guide is a member of the Trip.com affiliate programme and may
> earn a commission on qualifying stays booked through our links. This is
> disclosed throughout the site.

**Notice box**:

> Booking links open on Trip.com, which is subject to Trip.com's own terms of
> service. Your booking is made with Trip.com and the hotel. Da Nang Hotel Guide
> is not a party to any booking transaction.

---

## 4. About page (`about.html`)

> Some links on this site are affiliate links, mainly to Trip.com. When you book
> through one, I may earn a small commission at no extra cost to you.

(The two following paragraphs stay as written.)

---

## 5. Editorial policy (`editorial-policy.html`)

| Current | Proposed |
|---|---|
| Affiliate disclosure: This site earns a commission from Booking.com when a reader completes a booking through our links… | **Affiliate disclosure: This site may earn a commission from Trip.com when a reader completes a stay booked through our links, at no extra cost to the reader. This commission has no influence on editorial rankings.** (auto-rewritten; wording shown for approval) |
| Booking links to Booking.com are affiliate links. These are marked with rel="nofollow noopener sponsored" attributes. | **Hotel booking links to Trip.com are affiliate links. They are marked with rel="nofollow noopener sponsored" attributes.** |
| We link to Booking.com because it is the most widely used hotel booking platform in the markets we serve, not because of its commission rates relative to alternatives. | **We link to Trip.com because it lists most of the hotels we recommend in Da Nang and Hoi An, not because of its commission rate.** [Your reason; edit freely. "Most" is accurate: about 97 of the roughly 116 properties we link to (about 84%) are on Trip.com. Hotels without a listing keep their reviews but have no booking button.] |

---

## 6. Why Trust Us (`why-trust-us.html`) and methodology

| Current | Proposed |
|---|---|
| When you book a hotel through one of our Booking.com links, we earn a small commission, typically a few dollars per booking. | **When you book a hotel through one of our Trip.com links, we may earn a small commission once your stay is complete.** (drops the "few dollars" figure, which is unconfirmed for Trip.com) |
| Affiliate disclosure: Da Nang Hotel Guide earns a commission from Booking.com when readers complete bookings… | **…may earn a commission from Trip.com when readers complete stays booked through our links…** |
| Affiliate commission from Booking.com has no influence on how hotels are ranked. (methodology) | **Affiliate commission from Trip.com has no influence on how hotels are ranked.** (auto-rewritten) |
| "Not a Booking.com mirror" and the section "What makes this different from Booking.com" | Keep. This is a legitimate editorial comparison and remains true. |

---

## 7. Editorial review list (not legal, flagged by the migration)

- `azura-da-nang.html` sidebar: "Current rates $50/night · via Booking.com"
  sits above the relabelled general-search button. Remove the line, or keep the
  rate without "via Booking.com".
- `silk-path-grand-da-nang.html`: "Current rates $140/night · via Booking.com";
  property existence unverified (see manual verification).
- Prices "per night · via Booking.com" (3 places) and "Not currently listed on
  Booking.com" badges (11): reword or remove at cutover.
- Possibly closed, renamed or non-existent properties:
  - Silk Path Grand Resort & Spa Da Nang (no evidence it exists in Da Nang);
  - Rosewood Hoi An (no evidence it has opened);
  - Hoi An Chic (delisted by Trip.com);
  - Waikiki Beach Hotel (now listed elsewhere as Hometown Beach Hotel);
  - HAIAN River Hotel & Spa (possibly HAIAN Riverfront under an old name).
- Seahorse Signature by Haviland: the An Thuong guide says "Near An Thuong /
  My Khe, Son Tra". Its verified Trip.com address is 5 Huynh Thuc Khang, Hai
  Chau, so it has the same problem just fixed for Seahorse Tropical Natalie.
  Not changed; your call.
- Image reuse: `images/hotels/sel-de-mer-da-nang.webp` (now Prince Hotel) is
  also used for Fusion Suites on the map page, and a comment on the boutique
  page notes the same image reused for another hotel.
