/* Hotel finder: ranks the hotels we have reviewed from a few answers. No network, no storage, no tracking beyond the normal Trip.com click event.
   Hard filters: setting, budget, style. Ranking: audience (+3), each selected priority (+2). Ties keep our listing order. */
(function () {
  'use strict';
  var d = document, form = d.getElementById('fyForm'), out = d.getElementById('fyRes'), hoi = d.getElementById('fyHoi'), grp = d.getElementById('fyDN');
  var dataEl = d.getElementById('fyData'); if (!form || !out || !dataEl) return;
  var DATA; try { DATA = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var LABEL = { beach: 'Beachfront', city: 'City / Han River', resort: 'Resort', hotel: 'Hotel', villa: 'Villa or boutique', value: 'Value', upscale: 'Upscale', luxury: 'Luxury', families: 'Families', couples: 'Couples', solo: 'Solo or friends', business: 'Business', wellness: 'Wellness', pool: 'Pool', quiet: 'Quiet', walkable: 'Walkable', lounge: 'Lounge', beachfront: 'Beach at the door' };
  function val(n) { var e = form.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : 'any'; }
  function prios() { return [].slice.call(form.querySelectorAll('input[name="prio"]:checked')).map(function (e) { return e.value; }); }
  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function link(h, label, loc) {
    var a = d.createElement('a'); a.setAttribute('data-provider', 'tripcom'); a.setAttribute('data-tc-key', h.key); a.setAttribute('data-hotel', h.name); a.setAttribute('data-cta-location', loc);
    a.className = 'dn-booklink affiliate-link dn-btn dn-btn--book tc-btn tc-btn--solid'; a.href = h.href; a.target = '_blank'; a.rel = 'nofollow noopener sponsored';
    a.setAttribute('aria-label', label + ' on Trip.com, opens in a new tab'); var t = el('span', 'tc-btn__text', label + ' \u2192'); a.appendChild(t); return a;
  }
  function score(h, aud, pr) { var s = 0; if (aud !== 'any' && h.audience.indexOf(aud) > -1) s += 3; pr.forEach(function (p) { if (h.priorities.indexOf(p) > -1) s += 2; }); return s; }
  function run() {
    var dest = val('dest'); out.textContent = '';
    if (dest === 'hoian') { grp.hidden = true; hoi.hidden = false; return; }
    grp.hidden = false; hoi.hidden = true;
    var st = val('setting'), au = val('audience'), bu = val('budget'), sy = val('style'), pr = prios();
    var pool = DATA.hotels.filter(function (h) { return (st === 'any' || h.setting === st) && (bu === 'any' || h.budget === bu) && (sy === 'any' || h.style === sy); });
    var relaxed = false;
    if (pool.length < 3) { pool = DATA.hotels.filter(function (h) { return (st === 'any' || h.setting === st) && (bu === 'any' || h.budget === bu); }); relaxed = true; }
    if (pool.length < 3) { pool = DATA.hotels.filter(function (h) { return st === 'any' || h.setting === st; }); relaxed = true; }
    var ranked = pool.map(function (h, i) { return { h: h, s: score(h, au, pr), i: i }; }).sort(function (a, b) { return b.s - a.s || a.i - b.i; }).slice(0, 5);
    var head = el('h2', null, ranked.length ? 'Hotels that fit your answers' : 'No hotel matches those answers');
    head.style.fontSize = '1.3rem'; out.appendChild(head);
    if (relaxed && ranked.length) out.appendChild(el('p', 'fy-note', 'Few hotels matched every choice, so the style or budget filter was relaxed. These are the closest matches.'));
    ranked.forEach(function (r) {
      var h = r.h, c = el('article', 'fy-card'), t = el('h3'); var a = el('a', null, h.name); a.href = h.review; a.style.color = 'inherit'; t.appendChild(a); c.appendChild(t);
      if (h.category) c.appendChild(el('p', 'fy-meta', h.category));
      var tags = el('div', 'fy-tags'); [h.setting, h.style, h.budget].concat(h.audience.filter(function (x) { return au !== 'any' && x === au; }), h.priorities.filter(function (x) { return pr.indexOf(x) > -1; })).forEach(function (x) { tags.appendChild(el('span', 'fy-tag', LABEL[x] || x)); }); c.appendChild(tags);
      var why = el('p', 'fy-why'); why.appendChild(el('strong', null, 'Why it fits: ')); why.appendChild(d.createTextNode(h.reason)); c.appendChild(why);
      var con = el('p', 'fy-con'); con.appendChild(el('strong', null, 'Potential drawback: ')); con.appendChild(d.createTextNode(h.drawback)); c.appendChild(con);
      var act = el('div', 'fy-act'); act.appendChild(link(h, 'Check ' + (h.name.length <= 28 ? h.name : 'Room') + ' Prices', 'finder')); var rv = el('a', 'fy-rev', 'Read our review'); rv.href = h.review; act.appendChild(rv); c.appendChild(act); out.appendChild(c);
    });
    if (!ranked.length) out.appendChild(el('p', 'fy-why', 'Try loosening the budget or style choice.'));
    out.focus && out.focus({ preventScroll: false });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  form.addEventListener('change', function (e) { if (e.target && e.target.name === 'dest') run(); });
})();
