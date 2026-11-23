/* Hotel finder: ranks the hotels we have reviewed from a few answers. No network, no storage, no tracking beyond the normal Trip.com click event.
   Hard filters: setting, budget, style. Ranking: audience (+3), each selected priority (+2), plus Stay Planner rules for nights and main priority (see score()). Ties keep our listing order. */
(function () {
  'use strict';
  var d = document, form = d.getElementById('fyForm'), out = d.getElementById('fyRes'), hoi = d.getElementById('fyHoi'), grp = d.getElementById('fyDN');
  var dataEl = d.getElementById('fyData'); if (!form || !out || !dataEl) return;
  var DATA; try { DATA = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var LABEL = { beach: 'Beach area', city: 'City / Han River', resort: 'Resort', hotel: 'Hotel', villa: 'Villa or boutique', value: '4-star', upscale: '5-star', luxury: '5-star luxury', families: 'Families', couples: 'Couples', solo: 'Solo or friends', business: 'Business', wellness: 'Wellness', pool: 'Pool', quiet: 'Quiet', walkable: 'Walkable', lounge: 'Lounge', beachfront: 'Beachfront', kids: "Kids' club", airport: 'Near the airport', nightlife: 'Nightlife nearby' };
  function val(n) { var e = form.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : 'any'; }
  function prios() { return [].slice.call(form.querySelectorAll('input[name="prio"]:checked')).map(function (e) { return e.value; }); }
  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function link(h, label, loc) {
    var a = d.createElement('a'); a.setAttribute('data-provider', 'tripcom'); a.setAttribute('data-tc-key', h.key); a.setAttribute('data-hotel', h.name); a.setAttribute('data-cta-location', loc);
    a.className = 'dn-booklink affiliate-link dn-btn dn-btn--book tc-btn tc-btn--solid'; a.href = h.href; a.target = '_blank'; a.rel = 'nofollow noopener sponsored';
    a.setAttribute('aria-label', label + ' on Trip.com, opens in a new tab'); var t = el('span', 'tc-btn__text', label + ' \u2192'); a.appendChild(t); return a;
  }
  function score(h, aud, pr, ni, fo) { var s = 0; if (aud !== 'any' && h.audience.indexOf(aud) > -1) s += 3; pr.forEach(function (p) { if (h.priorities.indexOf(p) > -1) s += 2; });
    // Stay Planner rules (documented on the page): short trips favour quick access; long stays favour resorts with room to settle in.
    var air = h.go && h.go.airport, mk = h.go && h.go.market, near = mk && (mk.walk || (mk.drive && mk.drive <= 8));
    if (ni === 'short') { if (air && air <= 15) s += 2; if (near) s += 2; if (h.style === 'villa') s -= 1; }
    if (ni === 'mid') { if (near || (air && air <= 15)) s += 1; }
    if (ni === 'long' || ni === 'extended') { if (h.style === 'resort' || h.style === 'villa') s += 2; }
    if (fo === 'value' && h.budget === 'value') s += 3; if (fo === 'luxury' && h.budget === 'luxury') s += 3;
    if (fo === 'convenience') { if (near) s += 2; if (air && air <= 15) s += 1; if (h.priorities.indexOf('nightlife') > -1) s += 1; }
    if (fo === 'family') { if (h.kids) s += 3; if (h.audience.indexOf('families') > -1) s += 2; }
    return s; }
  var PLAN = { any: 'the room type and bed setup, what breakfast and taxes add, and the cancellation terms', value: 'whether breakfast is included, taxes and service charges in the total, and refundable versus non-refundable prices for the same room',
    convenience: 'the exact address (city, My Khe or the southern coast), airport transfer options and late check-out', family: 'connecting rooms or family suites, extra-bed and child policies, and kids\' club hours or fees',
    luxury: 'club-lounge inclusions, villa versus room categories, view, and what the rate bundles (breakfast, spa credit)' };
  var NIGHTS = { any: '', short: 'For one or two nights, location saves the most time, and a refundable rate keeps plans flexible.', mid: 'Three or four nights suits one base; compare the total stay price including taxes, not just the nightly rate.',
    long: 'For five to seven nights, resort facilities matter more; rates can differ between weekdays and weekends, so price the whole stay.', extended: 'For eight nights or more, compare a resort with an apartment-style room, and check whether a longer stay changes the rate on Trip.com.' };
  function track(n, p) { try { if (window.gtag) window.gtag('event', n, p); } catch (e) {} }
  function run() {
    var dest = val('dest'); out.textContent = '';
    if (dest === 'hoian') { grp.hidden = true; hoi.hidden = false; return; }
    grp.hidden = false; hoi.hidden = true;
    var st = val('setting'), au = val('audience'), bu = val('budget'), sy = val('style'), pr = prios(), ni = val('nights'), fo = val('focus');
    var pool = DATA.hotels.filter(function (h) { return (st === 'any' || h.setting === st) && (bu === 'any' || h.budget === bu) && (sy === 'any' || h.style === sy); });
    var relaxed = false;
    if (pool.length < 3) { pool = DATA.hotels.filter(function (h) { return (st === 'any' || h.setting === st) && (bu === 'any' || h.budget === bu); }); relaxed = true; }
    if (pool.length < 3) { pool = DATA.hotels.filter(function (h) { return st === 'any' || h.setting === st; }); relaxed = true; }
    var ranked = pool.map(function (h, i) { return { h: h, s: score(h, au, pr, ni, fo), i: i }; }).sort(function (a, b) { return b.s - a.s || a.i - b.i; }).slice(0, 5);
    var head = el('h2', null, ranked.length ? 'Hotels that fit your answers' : 'No hotel matches those answers');
    head.style.fontSize = '1.3rem'; out.appendChild(head);
    if (ranked.length && (ni !== 'any' || fo !== 'any')) { var pl = el('div', 'fy-plan'); pl.appendChild(el('p', 'fy-plan-h', 'Your stay plan')); if (NIGHTS[ni]) pl.appendChild(el('p', null, NIGHTS[ni]));
      pl.appendChild(el('p', null, 'When you check rates, compare ' + PLAN[fo] + '. Rates change with dates, room type and demand, so the price for your exact dates is the one that counts.')); out.appendChild(pl); track('dn_planner_use', { nights: ni, focus: fo, results: ranked.length }); }
    if (relaxed && ranked.length) out.appendChild(el('p', 'fy-note', 'Few hotels matched every choice, so the style or budget filter was relaxed. These are the closest matches.'));
    ranked.forEach(function (r) {
      var h = r.h, c = el('article', 'fy-card'), t = el('h3'); var a = el('a', null, h.name); a.href = h.review; a.style.color = 'inherit'; t.appendChild(a); c.appendChild(t);
      var go = []; if (h.area) go.push(h.area); if (h.go && h.go.airport) go.push('airport about ' + h.go.airport + ' min by road'); if (h.go && h.go.market) go.push('Han Market ' + (h.go.market.walk ? 'about ' + h.go.market.walk + ' min walk' : 'about ' + h.go.market.drive + ' min by road'));
      if (go.length) c.appendChild(el('p', 'fy-meta', go.join(' · ') + (h.go && h.go.airport ? ' (routing estimates, no traffic)' : '')));
      var tags = el('div', 'fy-tags'); [h.setting, h.style, h.budget].concat(h.audience.filter(function (x) { return au !== 'any' && x === au; }), h.priorities.filter(function (x) { return pr.indexOf(x) > -1; })).forEach(function (x) { tags.appendChild(el('span', 'fy-tag', LABEL[x] || x)); }); c.appendChild(tags);
      var why = el('p', 'fy-why'); why.appendChild(el('strong', null, 'Why it fits: ')); why.appendChild(d.createTextNode(h.reason)); c.appendChild(why);
      var con = el('p', 'fy-con'); con.appendChild(el('strong', null, 'Potential drawback: ')); con.appendChild(d.createTextNode(h.drawback)); c.appendChild(con);
      var act = el('div', 'fy-act'); act.appendChild(link(h, 'Check ' + (h.name.length <= 28 ? h.name : 'Room') + ' Prices', 'finder')); var rv = el('a', 'fy-rev', 'Read our review'); rv.href = h.review; act.appendChild(rv); var sv = el('button', 'dnc-save', 'Save'); sv.type = 'button'; sv.setAttribute('data-dn-save', h.id); act.appendChild(sv); var cm = el('a', 'fy-rev', 'Compare'); cm.href = 'compare-hotels.html?h=' + h.id; act.appendChild(cm); c.setAttribute('data-dn-hotel', h.id); c.appendChild(act); out.appendChild(c); setTimeout(function () { document.dispatchEvent(new CustomEvent('dn:shortlist')); }, 0);
    });
    if (!ranked.length) out.appendChild(el('p', 'fy-why', 'Try loosening the budget or style choice.'));
    out.focus && out.focus({ preventScroll: false });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  form.addEventListener('change', function (e) { if (e.target && e.target.name === 'dest') run(); });
})();
