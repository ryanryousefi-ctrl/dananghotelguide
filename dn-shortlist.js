/* dn-shortlist.js: lightweight local shortlist + copy-link. No account, no network, nothing sent anywhere.
   Storage: localStorage key "dn_shortlist_v1" (array of hotel slugs) in THIS browser only.
   GA4 (only if gtag exists and consent allows via the page's own consent mode): dn_shortlist_save / dn_shortlist_remove / dn_copy_link.
   These are tool-engagement events, never booking events. */
(function () {
  if (window.DN_SHORTLIST) return; // loaded once per page even if included twice
  var KEY = 'dn_shortlist_v1', MAX = 6;
  function read() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(function (s) { return typeof s === 'string'; }) : []; } catch (e) { return mem; } }
  var mem = [];
  function write(list) { mem = list; try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} document.dispatchEvent(new CustomEvent('dn:shortlist', { detail: list })); }
  function track(name, p) { try { if (window.gtag) window.gtag('event', name, Object.assign({ page_path: location.pathname }, p || {})); } catch (e) {} }
  function toast(msg) { var t = document.createElement('div'); t.className = 'dnc-toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  var api = {
    get: read,
    has: function (s) { return read().indexOf(s) > -1; },
    toggle: function (s) {
      var l = read(), i = l.indexOf(s);
      if (i > -1) { l.splice(i, 1); write(l); track('dn_shortlist_remove', { hotel_slug: s }); return false; }
      if (l.length >= MAX) { toast('Your shortlist holds up to ' + MAX + ' hotels. Remove one first.'); return null; }
      l.push(s); write(l); track('dn_shortlist_save', { hotel_slug: s, list_size: l.length }); return true;
    }
  };
  window.DN_SHORTLIST = api;
  function paint() {
    var l = read();
    // Return-visitor cues: saved count in the Hotels menu, and a "compare your saved hotels" prompt where a page offers a slot. Nothing leaves the browser.
    document.querySelectorAll('[data-dn-saved-nav]').forEach(function (a) { var lb = a.getAttribute('data-dn-saved-label') || 'Compare & Saved'; a.textContent = l.length ? lb + ' (' + l.length + ')' : lb; a.href = l.length ? 'compare-hotels.html?h=' + l.slice(0, 3).join(',') : 'compare-hotels.html'; });
    document.querySelectorAll('[data-dn-shortlist-cta]').forEach(function (el) { if (!l.length) { el.hidden = true; return; } el.hidden = false; el.innerHTML = ''; var t = document.createTextNode('You have ' + l.length + ' saved hotel' + (l.length > 1 ? 's' : '') + ' in this browser. '); var a = document.createElement('a'); a.href = 'compare-hotels.html?h=' + l.slice(0, 3).join(','); a.textContent = 'Compare them and recheck rates'; el.appendChild(t); el.appendChild(a); });
    document.querySelectorAll('[data-dn-save]').forEach(function (b) {
      var on = l.indexOf(b.getAttribute('data-dn-save')) > -1;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? 'Saved' : 'Save';
      b.setAttribute('aria-label', (on ? 'Remove from' : 'Save to') + ' shortlist: ' + (b.closest('[data-dn-hotel]') ? (b.closest('[data-dn-hotel]').querySelector('h3') || {}).textContent : ''));
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-dn-save]');
    if (b) { e.preventDefault(); api.toggle(b.getAttribute('data-dn-save')); paint(); return; }
    var c = e.target.closest && e.target.closest('[data-dn-copylink]');
    if (c) {
      e.preventDefault();
      var url = location.href.split('#')[0];
      var done = function () { toast('Link copied. You can paste it anywhere to come back to this guide.'); track('dn_copy_link'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt('Copy this link:', url); });
      else window.prompt('Copy this link:', url);
    }
  });
  document.addEventListener('dn:shortlist', paint);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
})();
