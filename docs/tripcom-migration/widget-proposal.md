# Date-picker widget replacement

## What exists today

- **Sitewide widget** (`bk-widget.js`, 152 pages): destination, check-in and
  check-out, "Find Hotel Deals". It builds a Booking.com search URL with the
  dates, wrapped in the CJ link.
- **Homepage hero widget** (`index.html`, `#bkSearchBtn`): the same thing, inline.
- **Dead code** in `index.html`: `STATIC_DA_NANG_BOOKING` / `handleNbwSubmit`
  for a widget (`nbw-*`) whose markup is no longer on the page.

## What Trip.com officially offers (Partners dashboard)

| Tool | What it is | Customisable? |
|---|---|---|
| Deep link / link generator | Tracking link to any trip.com page | The URL is generated; we only choose the target page |
| Search Box | Hotel/flight search embed (iframe or script, with AID/SID inside) | Size and product chosen in the dashboard; styling beyond that unconfirmed |
| Static and dynamic banners | Image/HTML banners | Sizes from the dashboard |

Not confirmed: whether a dashboard deep link can carry check-in/check-out
dates, i.e. whether a *dated* template is allowed. Adding date parameters to a
generated tracking link ourselves would be editing tracking links, which is off
limits. So dates are used only if Trip.com supplies or approves a format
(checklist item 3).

## Proposal: one component with three modes, chosen by what Trip.com confirms

Built into `tripcom-widget.js` (sitewide) and `apply.js` (homepage). Same card
design and placement rules as today.

**Mode 1, link (default, ready now).** Destination line, a short note
("Compare rooms and choose your dates on Trip.com") and a branded
"See Da Nang hotel prices" button to the official city link. Travellers pick
dates on Trip.com, whose own calendar is better than anything we could
reproduce.
- **For:** no unofficial parameters, no stale dates, works on every device,
  a real `<a>` (no popup blocker, tracked by the shared GA4 listener).
- **Against:** one extra step for travellers who wanted to set dates first.

**Mode 2, dated (needs Trip.com's dated format).** Same card plus check-in and
check-out fields:
- check-in defaults to tomorrow, check-out to +3 nights;
- past dates are impossible and check-out always stays after check-in.

The button's `href` comes from Trip.com's template with `{checkin}` and
`{checkout}` filled in, and nothing else. It is enabled by pasting the template into
`registry.widget.dated_template_danang` / `_hoian`; `validate.js` rejects a
template with literal dates.

**Mode 3, official Search Box embed (alternative).** Paste Trip.com's
search-box code into the hero slot instead of our card.
- **For:** fully official, so tracking is Trip.com's responsibility.
- **Against:** iframe styling won't match the site; heavier page weight and
  layout shift; may not fit a 390px phone hero. Worth a test on one page if
  Trip.com recommends it over deep links.

**Recommendation:** ship Mode 1 at cutover. Switch to Mode 2 if Trip.com
confirms a dated format. Keep Mode 3 as a fallback if they require their own
widget.

Previews (Mode 1): `previews/desktop-sitewide-widget.png`,
`previews/mobile-sitewide-widget.png` and `previews/*-home-widget.png`.
