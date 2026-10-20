/* Da Nang Hotel Guide 2.0: shared behaviour. Replaces the per-page inline nav
   and share scripts. No dependencies. */
(function () {
  'use strict';
  var d = document, h = d.getElementById('dnHeader');
  var ham = d.getElementById('navHamburger'), menu = d.getElementById('mobileMenu');

  function setMenu(open) {
    if (!ham || !menu) return;
    menu.classList.toggle('open', open);
    ham.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', String(open));
    ham.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    d.body.style.overflow = open ? 'hidden' : '';
  }
  if (ham && menu) {
    // Capture phase + stopImmediatePropagation: pages that still carry the old inline hamburger
    // script (inside larger script blocks) must not toggle the menu a second time.
    ham.addEventListener('click', function (e) { e.stopImmediatePropagation(); setMenu(!menu.classList.contains('open')); }, true);
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); ham.focus(); } });
    var mq = window.matchMedia('(min-width:1240px)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { if (mq.matches) setMenu(false); });
  }

  // Desktop dropdowns: hover/focus work in CSS; this adds touch + Escape.
  d.querySelectorAll('.dn-has-drop > a').forEach(function (a) {
    var li = a.parentNode;
    a.addEventListener('click', function (e) {
      if (window.matchMedia('(hover:none)').matches && !li.classList.contains('is-open')) {
        e.preventDefault();
        d.querySelectorAll('.dn-has-drop.is-open').forEach(function (o) { o.classList.remove('is-open'); });
        li.classList.add('is-open'); a.setAttribute('aria-expanded', 'true');
      }
    });
    li.addEventListener('keydown', function (e) { if (e.key === 'Escape') { li.classList.remove('is-open'); a.setAttribute('aria-expanded', 'false'); a.focus(); } });
    li.addEventListener('focusin', function () { a.setAttribute('aria-expanded', 'true'); });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) a.setAttribute('aria-expanded', 'false'); });
  });
  d.addEventListener('click', function (e) {
    if (!e.target.closest || e.target.closest('.dn-has-drop')) return;
    d.querySelectorAll('.dn-has-drop.is-open').forEach(function (o) { o.classList.remove('is-open'); });
  });

  // Header shadow once the page scrolls.
  if (h) {
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () { h.classList.toggle('is-scrolled', window.scrollY > 8); tick = false; });
    }, { passive: true });
  }

  // Share links.
  var u = encodeURIComponent(location.href);
  var m = d.querySelector('meta[property="og:title"]');
  var t = encodeURIComponent(m ? m.content : d.title);
  var set = function (id, href) { var el = d.getElementById(id); if (el) el.href = href; };
  set('shr-x', 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t);
  set('shr-fb', 'https://www.facebook.com/sharer/sharer.php?u=' + u);
  set('shr-rd', 'https://www.reddit.com/submit?url=' + u + '&title=' + t);
  set('shr-wa', 'https://wa.me/?text=' + t + '%20' + u);
  set('shr-li', 'https://www.linkedin.com/shareArticle?mini=true&url=' + u + '&title=' + t);

  // Booking links rendered at runtime (map popups, JS-built cards) get the same button system
  // as the static ones. Same classification as the build; hrefs and tracking are never touched.
  var CJ = 'kqzyfj.com/click-101820678-';
  var BTN = /(^|[\s_-])(btn|button|cta|book)([\s_-]|$)|-(btn|cta)\b|\b(btn|cta)-/;
  function classify(a) {
    if (a.__dn) return; a.__dn = true;
    if ((a.getAttribute('href') || '').indexOf(CJ) < 0) return;
    if (/\b(dn-btn|dn-booklink|dn-imglink|nav-stays-btn|mobile-stays-btn|dn-menu__cta|dn-header__cta)\b/.test(a.className)) return;
    if (a.querySelector('img')) { a.classList.add('dn-imglink'); return; }
    var cls = String(a.className || '').replace(/affiliate-link/g, '');
    var btn = BTN.test(cls) || (a.hasAttribute('data-cta-location') && a.textContent.trim().length < 60 && !a.querySelector('p, div'));
    a.classList.add(btn ? 'dn-btn' : 'dn-booklink'); if (btn) a.classList.add('dn-btn--book');
  }
  function scan(root) { (root || d).querySelectorAll('a[href*="' + CJ + '"]').forEach(classify); }
  scan();
  if (window.MutationObserver) {
    var pending = false;
    new MutationObserver(function () { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; scan(); }); })
      .observe(d.body, { childList: true, subtree: true });
  }

  // Restrained reveal for elements that opt in.
  var rv = d.querySelectorAll('[data-reveal]');
  if (rv.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    d.documentElement.classList.add('dn-reveal-on');
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  }
})();
