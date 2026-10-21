/* ─── Sitewide Trip.com hotel widget ─────────────────────────
   Replaces bk-widget.js at cutover. Same hero detection and placement;
   the button opens an OFFICIAL Trip.com affiliate link generated in the
   Trip.com Partners dashboard. Links are written into CONFIG below by
   scripts/tripcom/apply.js from data/tripcom/registry.json; nothing here
   builds or edits tracking parameters.

   Modes
   - link  (default): destination + branded button; travellers choose dates
            on Trip.com. Used while no official dated link format exists.
   - dated: check-in/check-out fields. Only enabled when Trip.com has
            supplied a dated deep-link template ({checkin}/{checkout}
            placeholders) for this account; dates are substituted into
            that official template and nothing else.
   If the page's destination has no official link, the widget does not
   render at all (never an unbranded or untracked button).
   ─────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var CONFIG = /*@tripcom-config*/{"danang":"","hoian":"","datedTemplateDanang":"","datedTemplateHoian":""}/*@end-tripcom-config*/;

  var path = window.location.pathname.toLowerCase();
  var isHoiAn = /hoi.an|an-bang|hoi_an/.test(path) &&
                !/da-nang-vs-hoi-an|da-nang-airport-to-hoi-an|da-nang-hoi-an-markets|hoi-an-da-nang/.test(path);
  var destLabel = isHoiAn ? 'Hoi An, Vietnam' : 'Da Nang, Vietnam';
  var cityName  = isHoiAn ? 'Hoi An' : 'Da Nang';
  var cityKey   = isHoiAn ? 'city:1775' : 'city:1356';
  var linkUrl   = isHoiAn ? CONFIG.hoian : CONFIG.danang;
  var template  = isHoiAn ? CONFIG.datedTemplateHoian : CONFIG.datedTemplateDanang;
  if (!linkUrl) return;
  var dated = /\{checkin\}/.test(template) && /\{checkout\}/.test(template);

  function toISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

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
  var uid = 'swtc' + Math.random().toString(36).slice(2, 7);
  var ciId = uid + 'ci', coId = uid + 'co';

  var wrap = document.createElement('div');
  wrap.className = 'sw-bk-wrap tc-widget-wrap' + (heroConfig.placement === 'below' ? ' sw-bk-wrap--below' : '');

  var btn =
    '<a class="sw-bk-btn tc-btn tc-btn--block" id="' + uid + 'btn" href="' + esc(linkUrl) + '"' +
    ' target="_blank" rel="nofollow noopener sponsored" data-provider="tripcom"' +
    ' data-cta-location="sitewide_widget" data-tc-key="' + cityKey + '"' +
    ' aria-label="See ' + cityName + ' hotel prices on Trip.com, opens in a new tab">' +
      '<span class="tc-btn__logo"><img src="/assets/brand/tripcom-logo.webp" alt="" width="58" height="14"></span>' +
      '<span class="tc-btn__text">See ' + cityName + ' hotel prices</span>' +
    '</a>';

  wrap.innerHTML =
    '<div class="sw-bk-widget tc-widget" role="region" aria-label="Find ' + destLabel + ' hotels on Trip.com">' +
      '<span class="sw-bk-label">Hotel Search</span>' +
      '<div class="sw-bk-dest">&#x1F4CD; ' + destLabel + '</div>' +
      (dated
        ? '<div class="sw-bk-dates">' +
            '<div class="sw-bk-date-field"><label class="sw-bk-date-lbl" for="' + ciId + '">Check-in</label>' +
            '<input class="sw-bk-date-input" type="date" id="' + ciId + '"></div>' +
            '<div class="sw-bk-date-field"><label class="sw-bk-date-lbl" for="' + coId + '">Check-out</label>' +
            '<input class="sw-bk-date-input" type="date" id="' + coId + '"></div>' +
          '</div>'
        : '<p class="tc-widget-note">Compare rooms and choose your dates on Trip.com.</p>') +
      btn +
    '</div>';

  var hero = heroConfig.el;
  if (heroConfig.placement === 'right' && window.getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
  hero.appendChild(wrap);

  if (window.matchMedia('(max-width: 700px)').matches) {
    var heroBox = hero.getBoundingClientRect();
    var hs = window.getComputedStyle(hero);
    if (/hidden|clip/.test(hs.overflow + hs.overflowY) && wrap.getBoundingClientRect().bottom > heroBox.bottom + 1) {
      wrap.classList.add('sw-bk-wrap--after');
      hero.parentNode.insertBefore(wrap, hero.nextSibling);
    }
  }

  if (!dated) return;

  /* ── Dated mode: dates always in the future, check-out after check-in ── */
  var a = document.getElementById(uid + 'btn');
  var ci = document.getElementById(ciId), co = document.getElementById(coId);
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  ci.min = toISO(today);
  ci.value = toISO(addDays(today, 1));
  co.value = toISO(addDays(today, 4));
  co.min = toISO(addDays(today, 2));

  function sync() {
    var inD = new Date(ci.value + 'T00:00:00');
    if (!ci.value || inD < today) { inD = addDays(today, 1); ci.value = toISO(inD); }
    co.min = toISO(addDays(inD, 1));
    if (!co.value || new Date(co.value + 'T00:00:00') <= inD) co.value = toISO(addDays(inD, 3));
    a.href = template.replace('{checkin}', ci.value).replace('{checkout}', co.value);
    a.setAttribute('data-cta-location', 'sitewide_widget_dated');
  }
  ci.addEventListener('change', sync);
  co.addEventListener('change', sync);
  sync();
})();
