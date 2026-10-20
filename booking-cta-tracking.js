/* Booking.com outbound click tracking (GA4 'booking_click').
   One delegated listener catches every CJ affiliate link, including links
   rendered later by JS (directory cards, map popups, hotel-card grids) and
   links without data-cta-location. link_sid matches the CJ SID, so GA4 counts
   can be reconciled against CJ reporting. Read-only: never touches hrefs.
   Date-picker widgets fire their own events (homepage_booking_widget_click,
   sitewide_booking_widget_click) because they open via window.open(). */
(function () {
  if (window.__dnhgBookingClickTracking) return;
  window.__dnhgBookingClickTracking = true;

  function track(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;
    var link = e.target.closest && e.target.closest('a[href*="kqzyfj.com/click-101820678-"]');
    if (!link || typeof gtag !== 'function') return;
    // A double-click on one link is one intent: count it once (a later, separate click still counts).
    var now = Date.now();
    if (link.__dnLast && now - link.__dnLast < 700) return;
    link.__dnLast = now;
    var href = link.getAttribute('href');
    var sid = (href.match(/[?&]sid=([^&]*)/) || [])[1] || '';
    var dest = decodeURIComponent((href.match(/[?&]url=([^&]*)/) || [])[1] || '');
    gtag('event', 'booking_click', {
      cta_location: link.dataset.ctaLocation || 'untagged',
      hotel_name: link.dataset.hotel || null,
      page: window.location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'index',
      link_sid: decodeURIComponent(sid),
      dest_type: /\/hotel\//.test(dest) ? 'hotel' : 'search',
      transport_type: 'beacon'
    });
  }

  document.addEventListener('click', track, true);
  document.addEventListener('auxclick', track, true);
})();
