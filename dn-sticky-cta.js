/* Mobile sticky "check prices" bar for hotel-review pages and (Phase 3) guides/lists with a top price-check module; one bar, one script.
   - Phones only (viewport < 768px). Appears after ~35% of the article, only when no booking button is on screen.
   - Reuses the page's own primary Trip.com link (same href); loads nothing from Trip.com. Clicks are tracked by tripcom-cta.js (one affiliate_click).
   - Never shown while the cookie banner or the mobile menu is open; dismissible for the session. */
(function () {
  'use strict';
  var d = document;
  var src = d.querySelector('.dn-decide--early a.tc-btn') || d.querySelector('.dnc-hero a.tc-btn');
  if (!src || !window.matchMedia || !window.matchMedia('(max-width: 767px)').matches) return;
  try { if (sessionStorage.getItem('dn_sticky_off') === '1') return; } catch (e) { /* storage unavailable: still fine */ }
  var name = (src.getAttribute('data-hotel') || '').trim();
  var bar = d.createElement('div');
  bar.className = 'dn-sticky'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Check prices'); bar.hidden = true;
  var a = src.cloneNode(false);
  a.className = 'dn-booklink affiliate-link tc-btn tc-btn--compact'; a.removeAttribute('data-tc-done');
  a.setAttribute('data-cta-location', 'sticky_mobile');
  a.setAttribute('aria-label', 'Check prices' + (name ? ' for ' + name : '') + ' on Trip.com, opens in a new tab');
  var t = d.createElement('span'); t.className = 'tc-btn__text'; t.textContent = name ? (name.length <= 26 ? 'Check ' + name + ' Prices' : 'Check Room Prices') : (src.getAttribute('data-tc-key') || '').indexOf('Hoi An') > -1 ? 'Compare Hoi An Hotel Prices' : 'Compare Da Nang Hotel Prices';
  a.appendChild(t);
  var x = d.createElement('button'); x.type = 'button'; x.className = 'dn-sticky__x'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '×';
  x.addEventListener('click', function () { bar.hidden = true; off = true; try { sessionStorage.setItem('dn_sticky_off', '1'); } catch (e) { /* ignore */ } });
  bar.appendChild(a); bar.appendChild(x); d.body.appendChild(bar);
  var off = false, ticking = false;
  function inView(el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < (window.innerHeight || 0); }
  function update() {
    ticking = false; if (off) return;
    var h = d.documentElement.scrollHeight - (window.innerHeight || 0), y = window.pageYOffset || 0;
    var blocked = d.querySelector('.dn-consent') || d.body.style.overflow === 'hidden' || d.querySelector('.dn-menu.is-open, .dn-menu[aria-hidden="false"]');
    var btns = d.querySelectorAll('a.tc-btn'), seen = false;
    for (var i = 0; i < btns.length; i++) { if (btns[i] !== a && !btns[i].closest('.dn-menu, .dn-header, .dn-sticky') && btns[i].offsetParent !== null && inView(btns[i])) { seen = true; break; } }
    bar.hidden = !(h > 0 && y / h > 0.35 && y / h < 0.97 && !blocked && !seen);
  }
  function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
