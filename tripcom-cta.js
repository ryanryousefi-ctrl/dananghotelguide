/* Trip.com booking buttons: runtime enhancer + GA4 click tracking.

   1. Enhancer. Static pages already carry the full button markup (written by
      scripts/tripcom/apply.js). Buttons rendered later by JS (directory rows,
      map popups, review cards) are upgraded here to the same markup: logo
      badge, .tc-btn class, accessible name. Never changes an href.

   2. Tracking. One delegated listener sends a single GA4 'affiliate_click'
      per click on any Trip.com link, static or dynamic:
        provider, hotel_name, page_path, cta_location, device_category,
        link_key (registry key), destination_type.
      A click is not a booking: commissions are confirmed only in the
      Trip.com affiliate dashboard after check-out. */
(function () {
  if (window.DNHG_TRIP) return;

  var LOGO = '/assets/brand/tripcom-logo.webp';
  // Wordmark only with Trip.com's written consent (agreement 9.2); apply.js sets this from data/tripcom/branding.json.
  var USE_LOGO = /*@tripcom-logo*/false/*@end-tripcom-logo*/;
  // Hotel pages only: editorial links to other Trip.com pages (travel guides)
  // are not booking buttons and are left alone.
  // Short links (/t/...) and any URL with the Alliance ID count as booking links.
  var TRIP_HREF = /^https:\/\/([a-z0-9-]+\.)*trip\.com\/(hotels\/|t\/|.*[?&]allianceid=11013066)/i;
  var COMPACT = /\b(nav-stays-btn|dhd-book|dhd-pop-book|dhm-pop-link|dhm-card-cta|ws-hotel-mini-cta)\b/;
  var BLOCK = /\b(mobile-stays-btn|mobile-cta-bar-btn)\b/;

  function isTrip(a) {
    return a.getAttribute('data-provider') === 'tripcom' || TRIP_HREF.test(a.getAttribute('href') || '');
  }

  function isButton(a) {
    // Any layout class besides the generic marker means the link is styled
    // as a button; bare links inside running text stay links.
    var cls = (a.getAttribute('class') || '').replace(/\b(affiliate-link|tc-btn\S*|tc-link\S*)\b/g, '').trim();
    // cta-polish.css styles every [data-cta-location] link as a button.
    return cls.length > 0 || a.hasAttribute('data-cta-location') || /background/.test(a.getAttribute('style') || '') ||
      !!(a.closest && a.closest('#mobileStickyBar, .sidebar-cta'));
  }

  function logoImg(cls, w, h) {
    var img = document.createElement('img');
    img.src = LOGO; img.alt = ''; img.width = w; img.height = h;
    img.decoding = 'async';
    if (cls) img.className = cls;
    return img;
  }

  function label(a) {
    var visible = (a.textContent || '').replace(/\s+/g, ' ').replace(/[→↗›»]|&rarr;/g, '').trim();
    var hotel = a.getAttribute('data-hotel');
    var name = visible || 'Check prices';
    if (hotel && name.toLowerCase().indexOf(hotel.toLowerCase()) === -1) name += ' for ' + hotel;
    if (!/trip\.com/i.test(name)) name += ' on Trip.com';
    return name + ', opens in a new tab';
  }

  function enhance(a) {
    if (a.__tcDone || !isTrip(a)) return;
    a.__tcDone = true;
    a.setAttribute('data-provider', 'tripcom');
    // Safety net for JS templates still carrying old provider copy.
    a.childNodes.forEach(function (n) {
      if (n.nodeType === 3 && /Booking\.com/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/Booking\.com/g, 'Trip.com');
    });
    if (a.querySelector('img') && !a.querySelector('.tc-btn__logo, .tc-link__logo')) return; // image-card link
    if (!a.hasAttribute('aria-label')) a.setAttribute('aria-label', label(a));   // (before the label below is shortened)
    // Buttons draw "Trip.com |" themselves (tripcom-cta.css), so a label repeating the name loses the repeat.
    if (isButton(a)) a.childNodes.forEach(function (n) {
      if (n.nodeType === 3 && /Trip\.com/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\s+on\s+Trip\.com/gi, '').replace(/Trip\.com에서\s*/g, '');
    });
    if (a.querySelector('.tc-btn__logo, .tc-link__logo') || a.hasAttribute('data-tc-key')) return; // static markup already complete
    if (isButton(a)) {
      var cls = a.getAttribute('class') || '';
      // No white-to-blue fade on buttons upgraded after first paint.
      a.style.setProperty('transition', 'none', 'important');
      a.classList.add('tc-btn');
      if (COMPACT.test(cls)) a.classList.add('tc-btn--compact');
      if (BLOCK.test(cls)) a.classList.add('tc-btn--block');
      var text = document.createElement('span');
      text.className = 'tc-btn__text';
      while (a.firstChild) text.appendChild(a.firstChild);
      if (USE_LOGO) {
        var badge = document.createElement('span');
        badge.className = 'tc-btn__logo';
        badge.appendChild(logoImg('', 58, 14));
        a.appendChild(badge);
      }
      a.appendChild(text);
      void a.offsetWidth;
      a.style.removeProperty('transition');
    } else {
      a.classList.add('tc-link');
      if (USE_LOGO) a.appendChild(logoImg('tc-link__logo', 41, 10));
    }
  }

  // Hotels without a Trip.com listing have an empty booking URL in page data.
  // Templates that always render a link would leave dead links: keep the photo
  // or hotel name as plain content and drop the button itself.
  function dropDeadLink(a) {
    var h = a.getAttribute('href');
    if (h && !/^(undefined|null)$/.test(h)) return;
    if (a.querySelector('img, h1, h2, h3, h4, h5, h6') || !isButton(a)) {
      while (a.firstChild) a.parentNode.insertBefore(a.firstChild, a);
    }
    var parent = a.parentNode;
    parent.removeChild(a);
    // An emptied button row (e.g. .bb-card-links) would still draw its divider.
    if (parent.children.length === 0 && !parent.textContent.trim() && /links|cta/i.test(parent.className || '')) parent.parentNode.removeChild(parent);
  }

  function enhanceAll(root) {
    var scope = (root || document);
    if (!scope.querySelectorAll) return;
    var dead = scope.querySelectorAll('a.affiliate-link:not([href]), a.affiliate-link[href=""], a.affiliate-link[href="undefined"], a[data-provider="tripcom"][href=""]');
    for (var d = 0; d < dead.length; d++) dropDeadLink(dead[d]);
    var links = scope.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) enhance(links[i]);
  }

  /* ── Tracking ─────────────────────────────────────────────────────────── */
  function device() {
    var w = window.innerWidth || document.documentElement.clientWidth;
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (w < 768) return 'mobile';
    if (w < 1100 && coarse) return 'tablet';
    return 'desktop';
  }

  var lastFire = typeof WeakMap === 'function' ? new WeakMap() : null;

  function track(el, extra) {
    if (typeof window.gtag !== 'function') return;
    // Some touch browsers dispatch click + auxclick for one tap: one event.
    var now = Date.now();
    if (lastFire && el) {
      if (now - (lastFire.get(el) || 0) < 800) return;
      lastFire.set(el, now);
    }
    var href = (el && el.getAttribute('href')) || '';
    var params = {
      provider: 'tripcom',
      hotel_name: (el && el.getAttribute('data-hotel')) || null,
      page_path: window.location.pathname,
      cta_location: (el && el.getAttribute('data-cta-location')) || 'untagged',
      device_category: device(),
      link_key: (el && el.getAttribute('data-tc-key')) || null,
      destination_type: /hotelid=|hotel-detail-/i.test(href) ? 'hotel' : 'city',
      transport_type: 'beacon'
    };
    for (var k in extra || {}) params[k] = extra[k];
    window.gtag('event', 'affiliate_click', params);
  }

  function onClick(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && isTrip(a)) track(a);
  }

  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);

  /* ── Start ────────────────────────────────────────────────────────────── */
  function start() {
    enhanceAll(document);
    if (!window.MutationObserver) return;
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      (window.requestAnimationFrame || setTimeout)(function () { pending = false; enhanceAll(document); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // For widgets that open Trip.com via window.open (no <a> to click).
  window.DNHG_TRIP = { track: track, enhance: enhanceAll };
})();
