/* Operation Revenue Reset: instant hotel filter (no quiz). Filters pre-rendered verified hotel cards; never opens a merchant page by itself. Binds once. */
(function () {
  if (window.__dnShop) return; window.__dnShop = true;
  function init(root) {
    var st = { dest: 'danang', setting: '', budget: '', aud: '', amen: [] };
    var cards = [].slice.call(root.querySelectorAll('[data-shop-card]'));
    var grid = root.querySelector('.rr-results'), hoian = root.querySelector('.rr-hoian'), none = root.querySelector('.rr-none');
    var status = root.querySelector('.rr-find__status'), more = root.querySelector('.rr-more');
    function active() { return st.setting || st.budget || st.aud || st.amen.length; }
    function apply() {
      root.querySelectorAll('.rr-chip').forEach(function (b) {
        var g = b.getAttribute('data-g'), v = b.getAttribute('data-v');
        b.setAttribute('aria-pressed', String(g === 'amen' ? st.amen.indexOf(v) >= 0 : st[g] === v));
      });
      var isHoian = st.dest === 'hoian';
      if (hoian) hoian.style.display = isHoian ? 'block' : 'none';
      if (grid) grid.style.display = isHoian ? 'none' : '';
      root.querySelectorAll('[data-danang-only]').forEach(function (e) { e.style.display = isHoian ? 'none' : ''; });
      if (isHoian) { if (status) status.innerHTML = 'Showing <strong>Hoi An</strong>: our Hoi An guides and a Hoi An price search.'; if (none) none.style.display = 'none'; if (more) more.style.display = 'none'; return; }
      var n = 0;
      cards.forEach(function (c) {
        var ok = (!st.setting || c.getAttribute('data-setting') === st.setting) && (!st.budget || c.getAttribute('data-budget') === st.budget) &&
          (!st.aud || (' ' + c.getAttribute('data-aud') + ' ').indexOf(' ' + st.aud + ' ') >= 0) &&
          st.amen.every(function (a) { return (' ' + c.getAttribute('data-amen') + ' ').indexOf(' ' + a + ' ') >= 0; });
        c.hidden = !ok; if (ok) n++;
      });
      var on = active();
      grid.classList.toggle('rr-showall', !!on || grid.getAttribute('data-all') === '1');
      var shown = on || grid.getAttribute('data-all') === '1' ? n : Math.min(n, cards.filter(function (c) { return !c.classList.contains('sc--more'); }).length);
      if (more) more.style.display = on || grid.getAttribute('data-all') === '1' ? 'none' : '';
      if (none) none.style.display = n ? 'none' : 'block';
      if (status) status.innerHTML = on ? '<strong>' + n + '</strong> verified hotel' + (n === 1 ? '' : 's') + ' match. <button type="button" class="rr-reset">Clear filters</button>' : 'Showing our top <strong>' + shown + '</strong> of ' + cards.length + ' verified Da Nang hotels. Narrow it down above.';
      var r = status && status.querySelector('.rr-reset'); if (r) r.addEventListener('click', function () { st.setting = st.budget = st.aud = ''; st.amen = []; apply(); });
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.rr-chip'); if (!b || !root.contains(b)) return;
      var g = b.getAttribute('data-g'), v = b.getAttribute('data-v');
      if (g === 'amen') { var i = st.amen.indexOf(v); if (i >= 0) st.amen.splice(i, 1); else st.amen.push(v); }
      else if (g === 'dest') st.dest = v; else st[g] = st[g] === v ? '' : v;
      apply();
      if (typeof window.gtag === 'function') window.gtag('event', 'dn_shop_filter', { filter_group: g, filter_value: v, page_type: root.getAttribute('data-page') || 'home' });
    });
    if (more) more.addEventListener('click', function () { grid.setAttribute('data-all', '1'); apply(); });
    apply();
  }
  // click-to-load official Trip.com search box: nothing from trip.com loads until the visitor asks
  function sbox(el) { var b = el.querySelector('.rr-sbox__go'), t = el.querySelector('template'); if (!b || !t) return; b.addEventListener('click', function () { el.innerHTML = t.innerHTML; }, { once: true }); }
  function start() { document.querySelectorAll('[data-rr-finder]').forEach(init); document.querySelectorAll('[data-rr-sbox]').forEach(sbox); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
