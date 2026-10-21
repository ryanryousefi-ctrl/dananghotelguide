/* Official Trip.com dynamic banner (experiment on one page). The untouched iframe sits in a <template>:
   nothing is requested from Trip.com until the visitor clicks "Show hotel offers" or has already accepted cookies on this site.
   GA4 (where consent permits): affiliate_banner_view (placeholder or banner scrolled into view, once per page view) and
   affiliate_banner_load (banner activated). Clicks inside the third-party iframe cannot be observed and are not tracked. */
(function () {
  var box = document.querySelector('.dn-adbox[data-banner]'); if (!box) return;
  var t = box.querySelector('template'), ph = box.querySelector('.dn-adbox__ph'); if (!t) return;
  var id = box.getAttribute('data-banner'), loaded = false, viewed = false;
  function ev(name, extra) { if (typeof window.gtag !== 'function') return; var p = { provider: 'tripcom', banner_id: id, page_path: location.pathname }; for (var k in extra) p[k] = extra[k]; window.gtag('event', name, p); }
  function load(trigger) { if (loaded) return; loaded = true; if (ph && ph.parentNode) ph.parentNode.removeChild(ph); box.appendChild(t.content.cloneNode(true)); box.setAttribute('data-loaded', '1'); ev('affiliate_banner_load', { trigger: trigger }); }
  var go = box.querySelector('.dn-adbox__go'); if (go) go.addEventListener('click', function () { load('click'); });
  var auto = false; try { var c = JSON.parse(localStorage.getItem('dn_consent') || 'null'); auto = !!(c && c.v === 'granted'); } catch (e) { /* storage blocked: click-to-load only */ }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en, o) { if (en[0].isIntersecting && !viewed) { viewed = true; ev('affiliate_banner_view', { state: loaded ? 'loaded' : 'placeholder' }); if (auto) load('consent'); o.disconnect(); } }, { threshold: .5 }).observe(box);
  else if (auto) load('consent');
})();
