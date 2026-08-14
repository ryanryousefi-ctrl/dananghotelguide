/* ─── Sitewide Booking Widget ─────────────────────────────────
   Injected into every content page. Detects the hero type,
   chooses placement (right overlay or below-center), and
   renders the booking widget. Booking.com affiliate aid=1784897.
   ─────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ── Hoi An destination logic ──────────────────────────────── */
  var path = window.location.pathname.toLowerCase();
  var isHoiAn = /hoi.an|an-bang|hoi_an/.test(path) &&
                !/da-nang-vs-hoi-an|da-nang-airport-to-hoi-an|da-nang-hoi-an-markets|hoi-an-da-nang/.test(path);

  var destLabel = isHoiAn ? 'Hoi An, Vietnam' : 'Da Nang, Vietnam';
  var destId    = isHoiAn ? '-3723930' : '6232';
  var destType  = isHoiAn ? 'city' : 'region';
  var destSS    = isHoiAn ? 'Hoi+An%2C+Vietnam' : 'Da+Nang+Municipality%2C+Vietnam';

  /* ── Date helpers ──────────────────────────────────────────── */
  function toISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var defOut = new Date(tomorrow);
  defOut.setDate(defOut.getDate() + 3);

  /* ── Hero detection map ─────────────────────────────────────── */
  /*
   * placement: 'right'  → widget positioned absolute top-right in hero
   * placement: 'below'  → widget rendered below hero text, centered
   * heroEl: the element that needs position:relative confirmed
   * insertTarget: where to append/insert the wrap div
   */
  var heroConfig = null;

  /* Helper: find first matching selector */
  function q(sel) { return document.querySelector(sel); }

  /* Hero selectors → placement config ─────────────────────────
   * All photo-background heroes: text body at bottom-left → widget right
   * Centered / no-background heroes: widget goes below text, centered
   */
  var rules = [
    /* review-hero — has position:relative, body abs bottom-left */
    { sel: '.review-hero',        placement: 'right',  parent: '.review-hero' },
    /* review-photo-hero — flex align-items:flex-end, content left */
    { sel: '.review-photo-hero',  placement: 'right',  parent: '.review-photo-hero' },
    /* bh-hero — flex align-items:flex-end, body div inside */
    { sel: '.bh-hero',            placement: 'right',  parent: '.bh-hero' },
    /* dbh-hero — same pattern */
    { sel: '.dbh-hero',           placement: 'right',  parent: '.dbh-hero' },
    /* lx-hero */
    { sel: '.lx-hero',            placement: 'right',  parent: '.lx-hero' },
    /* fm-hero */
    { sel: '.fm-hero',            placement: 'right',  parent: '.fm-hero' },
    /* bt-hero */
    { sel: '.bt-hero',            placement: 'right',  parent: '.bt-hero' },
    /* ch-hero — comparison, photo hero, text left */
    { sel: '.ch-hero',            placement: 'right',  parent: '.ch-hero' },
    /* ha-hero — Hoi An photo hero */
    { sel: '.ha-hero',            placement: 'right',  parent: '.ha-hero' },
    /* bb-hero — bars page, photo bg, content inside */
    { sel: '.bb-hero',            placement: 'right',  parent: '.bb-hero' },
    /* bc-hero — cafes page */
    { sel: '.bc-hero',            placement: 'right',  parent: '.bc-hero' },
    /* gd-hero — guide with bg div */
    { sel: '.gd-hero',            placement: 'right',  parent: '.gd-hero' },
    /* mg-hero — markets guide */
    { sel: '.mg-hero',            placement: 'right',  parent: '.mg-hero' },
    /* wx-hero — weather guide, photo hero */
    { sel: '.wx-hero',            placement: 'right',  parent: '.wx-hero' },
    /* wts-hero — where to stay, photo hero */
    { sel: '.wts-hero',           placement: 'right',  parent: '.wts-hero' },
    /* drf-hero — dining, no real photo bg → below */
    { sel: '.drf-hero',           placement: 'below',  parent: '.drf-hero' },
    /* cmp-hero — comparison, no bg image → below */
    { sel: '.cmp-hero',           placement: 'below',  parent: '.cmp-hero' },
    /* hub-hero — hotel hub, no bg → below */
    { sel: '.hub-hero',           placement: 'below',  parent: '.hub-hero' },
    /* about-hero — no bg → below */
    { sel: '.about-hero',         placement: 'below',  parent: '.about-hero' },
    /* wtu-hero — why trust us, no bg → below */
    { sel: '.wtu-hero',           placement: 'below',  parent: '.wtu-hero' },
    /* article-hero — news articles with photo */
    { sel: '.article-hero',       placement: 'right',  parent: '.article-hero' },
    /* page-hero — generic guide pages */
    { sel: '.page-hero',          placement: 'right',  parent: '.page-hero' },
    /* guide-hero */
    { sel: '.guide-hero',         placement: 'right',  parent: '.guide-hero' },
    /* guides.html / hotel-reviews.html / where-to-stay.html inline header heroes */
    { sel: 'header[style*="ocean-deep"]', placement: 'below', parent: 'header[style*="ocean-deep"]' },
  ];

  for (var i = 0; i < rules.length; i++) {
    var el = q(rules[i].sel);
    if (el) {
      heroConfig = { placement: rules[i].placement, el: el };
      break;
    }
  }

  /* Skip index.html (already has its own widget in the hero cluster) */
  if (!heroConfig || path === '/' || path.endsWith('/index.html') || path.endsWith('index.html')) return;

  /* Skip utility/legal pages */
  var skipPages = ['/privacy', '/terms', '/contact', '/search', '/favicon-html-snippet', '/site-preview'];
  for (var s = 0; s < skipPages.length; s++) {
    if (path.indexOf(skipPages[s]) !== -1) return;
  }

  /* ── Build the widget DOM ───────────────────────────────────── */
  var uid = 'swbk' + Math.random().toString(36).slice(2, 7);
  var ciId = uid + 'ci';
  var coId = uid + 'co';
  var btnId = uid + 'btn';

  var wrap = document.createElement('div');
  wrap.className = 'sw-bk-wrap' + (heroConfig.placement === 'below' ? ' sw-bk-wrap--below' : '');

  wrap.innerHTML =
    '<div class="sw-bk-widget" aria-label="Search ' + destLabel + ' hotels">' +
      '<span class="sw-bk-label">Hotel Search</span>' +
      '<div class="sw-bk-dest">&#x1F4CD; ' + destLabel + '</div>' +
      '<div class="sw-bk-dates">' +
        '<div class="sw-bk-date-field">' +
          '<label class="sw-bk-date-lbl" for="' + ciId + '">Check-in</label>' +
          '<input class="sw-bk-date-input" type="date" id="' + ciId + '">' +
        '</div>' +
        '<div class="sw-bk-date-field">' +
          '<label class="sw-bk-date-lbl" for="' + coId + '">Check-out</label>' +
          '<input class="sw-bk-date-input" type="date" id="' + coId + '">' +
        '</div>' +
      '</div>' +
      '<button class="sw-bk-btn" id="' + btnId + '" type="button">Find Hotel Deals</button>' +
    '</div>';

  /* ── Inject into hero ───────────────────────────────────────── */
  var hero = heroConfig.el;

  if (heroConfig.placement === 'right') {
    /* Ensure the hero has a positioning context */
    var cs = window.getComputedStyle(hero);
    if (cs.position === 'static') hero.style.position = 'relative';
    hero.appendChild(wrap);
  } else {
    /* below: append after the last child of the hero container */
    hero.appendChild(wrap);
  }

  /* ── Populate dates ─────────────────────────────────────────── */
  var ci = document.getElementById(ciId);
  var co = document.getElementById(coId);
  ci.value = toISO(tomorrow);
  co.value = toISO(defOut);
  ci.min = toISO(tomorrow);
  co.min = toISO(defOut);

  ci.addEventListener('change', function () {
    var newCi = new Date(ci.value + 'T00:00:00');
    var newCo = new Date(co.value + 'T00:00:00');
    if (newCo <= newCi) {
      var def = new Date(newCi);
      def.setDate(def.getDate() + 3);
      co.value = toISO(def);
    }
    var nextDay = new Date(newCi.getTime() + 86400000);
    co.min = toISO(nextDay);
  });

  /* ── Click handler ──────────────────────────────────────────── */
  document.getElementById(btnId).addEventListener('click', function () {
    var ciVal = ci.value;
    var coVal = co.value;
    if (!ciVal || !coVal) return;
    var cp = ciVal.split('-');
    var op = coVal.split('-');
    var url = 'https://www.booking.com/searchresults.en-us.html' +
      '?ss=' + destSS +
      '&dest_id=' + destId +
      '&dest_type=' + destType +
      '&checkin=' + cp[0] + '-' + cp[1] + '-' + cp[2] +
      '&checkout=' + op[0] + '-' + op[1] + '-' + op[2] +
      '&aid=1784897' +
      '&lang=en-us';
    if (window.gtag) {
      window.gtag('event', 'sitewide_booking_widget_click', {
        event_category: 'booking_widget',
        page_path: path,
        destination: destLabel,
        checkin: ciVal,
        checkout: coVal
      });
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  });
})();
