// Editorial and legal wording that stops being true when booking links move from Booking.com to Trip.com.
// Applied by apply.js after the link conversion. Exact-match rules only: each rule states the page(s) and how many
// matches it must find, so a content change on the page fails the run instead of being silently skipped.
// Kept on purpose (legitimate references to Booking.com itself): Booking.com guest ratings/reviews as a source,
// the "What makes this different from Booking.com" comparison, Korean tips about Booking.com's review filters,
// and any text inside JSON-LD or CSS. Legal pages follow docs/tripcom-migration/legal-and-disclosure-drafts.md
// and need the owner's approval before deployment.
'use strict';
const T = 'Trip.com';
module.exports = [
  // ── Legal and disclosure pages (drafts: owner approval required) ────────────────────────────────────────────
  ['about.html', /Affiliate disclosure: this site earns a commission when you book through Booking\.com links, at no extra cost to you\./, `Affiliate disclosure: this site may earn a commission when you book through ${T} links, at no extra cost to you.`, 1],
  ['about.html', /Some links on this site are affiliate links, mainly Booking\.com\. When you book through one, I earn a small commission at no extra cost to you\./, `Some links on this site are affiliate links, mainly to ${T}. When you book through one, I may earn a small commission at no extra cost to you.`, 1],
  ['privacy.html', /This site participates in the Booking\.com affiliate programme\. When you click a booking link and visit Booking\.com, Booking\.com's own privacy policy applies\./g, `This site is a member of the ${T} affiliate programme. Hotel booking buttons and links take you to ${T}. When you visit ${T}, ${T}'s own privacy policy and cookie policy apply.`, 1],
  ['privacy.html', /Booking\.com may set cookies on your device when you arrive at their site\. We do not receive any personal data from Booking\.com about users who click our links\./g, `${T} uses cookies and similar technology to recognise that you arrived from this site, so that a booking can be credited to us. The homepage search box is loaded from ${T}'s own servers only when you choose to show it (or have accepted cookies), and ${T} may set cookies when it loads. We do not receive your name, contact details or payment details from ${T}.`, 1],
  ['privacy.html', /<strong>Booking\.com and the CJ Affiliate network<\/strong> may set cookies when you follow a booking link, so a booking can be credited to us\. A CJ script on our pages also reports page views to CJ\./g, `<strong>${T}</strong> may set cookies when you follow a booking link, so a booking can be credited to us.`, 1],
  ['privacy.html', /\(Booking\.com, CJ\)/g, `(${T})`, 1],
  ['terms.html', /Always verify pricing and availability directly on Booking\.com or with the hotel before making a booking decision\./, `Always verify pricing and availability on ${T} or with the hotel before making a booking decision.`, 1],
  ['terms.html', /Da Nang Hotel Guide participates in the Booking\.com affiliate programme and earns a commission on qualifying bookings made through our links\./, `Da Nang Hotel Guide is a member of the ${T} affiliate programme and may earn a commission on qualifying stays booked through our links.`, 1],
  ['terms.html', /All booking links open on Booking\.com, which is subject to Booking\.com's own terms of service\./, `Booking links open on ${T}, which is subject to ${T}'s own terms of service. Your booking is made with ${T} and the hotel.`, 1],
  ['editorial-policy.html', /Booking links to Booking\.com are affiliate links\./, `Hotel booking links to ${T} are affiliate links.`, 1],
  ['editorial-policy.html', /We link to Booking\.com because it is the most widely used hotel booking platform in the markets we serve, not because of its commission rates relative to alternatives\./, `We link to ${T} because it lists most of the hotels we recommend in Da Nang and Hoi An, not because of its commission rate.`, 1],
  ['why-trust-us.html', /When you book a hotel through one of our Booking\.com links, we earn a small commission — typically a few dollars per booking\./, `When you book a hotel through one of our ${T} links, we may earn a small commission once your stay is complete.`, 1],

  // ── Sidebar price boxes: the quoted rate was Booking.com's ──────────────────────────────────────────────────
  [null, /per night · via Booking\.com/g, 'per night · indicative rate', 3],

  // ── Badges on hotels that have no booking link ──────────────────────────────────────────────────────────────
  [null, /Not currently listed on Booking\.com/g, 'No booking link available', 12],
  ['kr/boutique-hotels-da-nang.html', /현재 Booking\.com에 등록되어 있지 않음/g, '현재 예약 링크 없음', 1],
  ['fusion-suites-da-nang.html', /As of October 2026, Fusion Suites Da Nang is not listed on Booking\.com, so we can't link to live rates here\./, `We don't currently have a verified ${T} listing for Fusion Suites Da Nang, so we can't link to live rates here.`, 1],

  // ── Pointers to where to check rates: same instruction, new provider; claims about Booking.com's policies reworded ──
  [null, /Check Booking\.com for live availability, current pricing, and cancellation terms\. Many rooms can be held with free cancellation if you book ahead\./, `Check ${T} for live availability, current pricing and cancellation terms; each rate shows its own conditions.`, 1],
  [null, /We recommend checking Booking\.com for live availability, current pricing, and cancellation policies\. Many rooms can be held with free cancellation if you book in advance\./g, `We recommend checking ${T} for live availability, current pricing and cancellation policies; each rate shows its own conditions.`, 2],
  ['best-beach-hotel-under-100-da-nang.html', /Free cancellation rates are widely available on Booking\.com for all these properties\. Book early, lock in a rate, cancel and rebook if you find better pricing closer to your dates\./, `Many rates include free cancellation, but conditions vary by rate, so check them before you book. Book early, lock in a flexible rate, and rebook if you find better pricing closer to your dates.`, 1],
  ['best-hotels-in-da-nang.html', /Compare current room prices for our recommended Da Nang hotels on Booking\.com\./, `Compare current room prices for our recommended Da Nang hotels on ${T}.`, 1],
  ['best-hotels-near-my-khe-beach.html', /honest picks from a local editor with Booking\.com links\./, 'honest picks from a local editor with direct booking links.', 1],
  ['best-resort-breakfast-da-nang.html', /Check the Booking\.com rate difference between room-only and breakfast-included/, `Check the ${T} rate difference between room-only and breakfast-included`, 1],
  ['da-nang-digital-nomad-guide.html', /Browse current hotel options near An Thuong and My Khe Beach on Booking\.com\./, `Browse current hotel options near An Thuong and My Khe Beach on ${T}.`, 1],
  ['da-nang-fireworks-festival-guide.html', /not just the Booking\.com messaging/, 'not just the booking-platform messaging', 1],
  ['da-nang-first-time-travel-guide.html', /Booking\.com has the widest selection and most reliable cancellation policies for Da Nang properties at all budget levels\./, `${T} lists hotels at all budget levels in Da Nang; check each rate's cancellation conditions before you book.`, 1],
  ['da-nang-guide-for-australian-travelers.html', /with direct Booking\.com links:/, `with direct ${T} links:`, 1],
  ['da-nang-guide-for-australian-travelers.html', /Search all Da Nang hotels on Booking\.com/, `Search all Da Nang hotels on ${T}`, 1],
  ['da-nang-guide-for-russian-travelers.html', /Check recent guest reviews on Booking\.com before booking\./, 'Check recent guest reviews before booking.', 1],
  ['da-nang-guide-for-russian-travelers.html', /Compare Da Nang beach hotels from budget to luxury on Booking\.com, filter by price, beach distance, and guest rating\./, `Compare Da Nang beach hotels from budget to luxury on ${T}, filter by price, beach distance, and guest rating.`, 1],
  ['da-nang-guide-for-singapore-travelers.html', /Booking\.com often shows better with advance booking:/, 'Rates are often lower with advance booking:', 1],
  ['da-nang-hotel-directory.html', /or its live prices on Booking\.com\./, `or its live prices on ${T}.`, 1],
  ['da-nang-hotels-connecting-rooms.html', /show up as a bookable category on Booking\.com and hotel websites/, `show up as a bookable category on ${T} and hotel websites`, 1],
  ['da-nang-hotels-connecting-rooms.html', /across every Da Nang resort on Booking\.com, and check the room category before you book\./, `across every Da Nang resort on ${T}, and check the room category before you book.`, 1],
  ['da-nang-hotels-connecting-rooms.html', /specifically on Booking\.com or the hotel website/, `specifically on ${T} or the hotel website`, 1],
  ['da-nang-hotels-infinity-pool.html', /Compare rates, read verified guest reviews, and book directly on Booking\.com, with free cancellation on most rates\./, `Compare rates and read guest reviews on ${T}, and check each rate's cancellation conditions before you book.`, 1],
  ['da-nang-hotels-infinity-pool.html', /Best rates on Booking\.com/g, `Check rates on ${T}`, 1],
  ['da-nang-hotels-near-airport.html', /Compare all Da Nang hotels on Booking\.com/, `Compare all Da Nang hotels on ${T}`, 1],
  ['da-nang-hotels-private-beach.html', /with real guest reviews on Booking\.com\. Free cancellation available on most rates\./, `with guest reviews on ${T}. Check each rate's cancellation conditions.`, 1],
  ['da-nang-hotels-spa-packages.html', /resort spas on Booking\.com, with verified guest reviews\./, `resort spas on ${T}, with guest reviews.`, 1],
  ['da-nang-quiet-areas-hotels.html', /\(verify exact address on Booking\.com\)/, '(verify the exact address before booking)', 1],
  ['da-nang-tet-2027-hotels.html', /Use Booking\.com with free cancellation so you can rebook if plans change\./, `Choose a rate with free cancellation on ${T} where one is offered, so you can rebook if plans change.`, 1],
  ['da-nang-tourist-mistakes.html', /Use Booking\.com for price comparison and free cancellation\./, `Use ${T} for price comparison, and pick a rate with free cancellation where offered.`, 1],
  ['da-nang-travel-budget-guide.html', /Booking\.com is the most reliable platform for this category in Da Nang - availability and pricing are accurate, and the free cancellation policies are legitimate\./, `Check availability and each rate's cancellation conditions on ${T} before you book.`, 1],
  ['hilton-da-nang.html', /Check current rates on Booking\.com, pricing varies/, `Check current rates on ${T}, pricing varies`, 1],
  ['hotel-reviews.html', /Booking\.com has the widest inventory and cancellation policies are displayed accurately &mdash; most properties offer free cancellation on standard rates\. All hotels on this page link directly to their Booking\.com listings so you can check live pricing against your dates\./, `Each rate shows its own cancellation conditions, so check them before you book. All hotels on this page link directly to their ${T} listings so you can check live pricing against your dates.`, 1],
  ['my-khe-beach-da-nang.html', /Every link goes to Booking\.com\./, `Every link goes to ${T}.`, 1],
  ['worst-time-to-visit-da-nang.html', /Hotels understand this and Booking\.com's free-cancellation policy is your protection\./, 'Hotels understand this, and a free-cancellation rate is your protection.', 1],

  // ── Korean pointers (same instruction, new provider; the free-cancellation claim becomes a conditions check) ──
  [null, /Booking\.com에서 실시간 가격 비교\. (?:무료 )?취소 가능한 옵션을 먼저 확인하세요\./g, 'Trip.com에서 실시간 가격을 비교하고 취소 조건을 먼저 확인하세요.', 6],
  ['kr/family-hotels-da-nang.html', /예약 시 어린이 나이를 정확히 입력하면 Booking\.com에서 자동으로 어린이 요금이 반영됩니다\./, '예약 시 어린이 나이를 정확히 입력하면 예약 페이지에서 어린이 요금이 반영됩니다.', 1],
  ['kr/luxury-hotels-da-nang.html', /Booking\.com에서 무료 취소 가능한 옵션을 먼저 확인하세요\./, 'Trip.com에서 취소 조건을 먼저 확인하세요.', 1],
  ['kr/where-koreans-stay-in-da-nang.html', /Booking\.com에서 취소 가능한 요금으로 먼저 잡아두고/, 'Trip.com에서 취소 가능한 요금이 있으면 먼저 잡아두고', 1],
];
