/* Booking.com CTA click tracking — shared across the sitewide conversion rollout.
   Fires a GA4 event via the existing gtag() setup already loaded on each page.
   Does not touch affiliate hrefs, tracking params, or CJ DLA behavior. */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[data-cta-location]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        gtag('event', 'booking_click', {
          cta_location: link.dataset.ctaLocation,
          hotel_name: link.dataset.hotel || null,
          page: window.location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'index'
        });
      }
    });
  });
});
