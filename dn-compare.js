/* dn-compare.js: side-by-side hotel comparison over embedded, sourced hotel facts. No network, no prices, no scores.
   URL: compare-hotels.html?h=slug1,slug2[,slug3]. Shortlist from dn-shortlist.js. GA4: dn_compare_use (once per combination per page view); outbound Trip.com clicks are tracked by tripcom-cta.js (affiliate_click) only. */
(function () {
  var data = document.getElementById('dnc-data'); if (!data) return;
  var H = JSON.parse(data.textContent).hotels, byId = {}; H.forEach(function (h) { byId[h.id] = h; });
  var pick = document.getElementById('dnc-pick'), out = document.getElementById('dnc-out'), count = document.getElementById('dnc-count');
  var sel = [], seen = {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function track(n, p) { try { if (window.gtag) window.gtag('event', n, Object.assign({ page_path: location.pathname }, p || {})); } catch (e) {} }
  function cell(v) { return v === 'Not verified' ? '<span class="nv">Not verified</span>' : esc(v); }
  function btn(h) { return '<a data-provider="tripcom" data-tc-key="' + esc(h.key) + '" data-hotel="' + esc(h.name) + '" aria-label="' + esc(h.label) + ' on Trip.com, opens in a new tab" class="dn-booklink affiliate-link dn-btn dn-btn--book tc-btn tc-btn--solid" href="' + esc(h.href) + '" target="_blank" rel="nofollow noopener sponsored" data-cta-location="compare-tool"><span class="tc-btn__text">Check Prices &rarr;</span></a>'; }
  function render() {
    count.textContent = sel.length < 2 ? 'Choose at least two hotels (up to three).' : sel.length + ' hotels selected.';
    Array.prototype.forEach.call(pick.querySelectorAll('input'), function (i) { i.checked = sel.indexOf(i.value) > -1; i.disabled = sel.length >= 3 && !i.checked; });
    if (sel.length < 2) { out.innerHTML = '<p class="dnc-sub">Your comparison appears here once you pick two hotels.</p>'; return; }
    var hs = sel.map(function (s) { return byId[s]; });
    var rows = [['Setting', function (h) { return h.setting + ' · ' + h.style; }], ['Category', function (h) { return h.tier; }], ['Area', function (h) { return h.area; }], ['Beach access', function (h) { return h.d.beach; }], ['Pools', function (h) { return h.d.pools; }], ['Club lounge', function (h) { return h.d.lounge; }], ["Kids' club", function (h) { return h.d.kids_club; }], ['Room types', function (h) { return h.d.rooms; }], ['Best for (our opinion)', function (h) { return h.best; }], ['Why choose it (our opinion)', function (h) { return h.why; }], ['Consider another hotel if (our opinion)', function (h) { return h.drawback; }]];
    var t = '<div class="dnc-table"><table data-n="' + hs.length + '"><thead><tr><th scope="col"><span class="sr-only" style="position:absolute;left:-9999px">Feature</span></th>' + hs.map(function (h) { return '<th scope="col">' + esc(h.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) { t += '<tr><th scope="row">' + esc(r[0]) + '</th>' + hs.map(function (h) { return '<td>' + cell(r[1](h)) + '</td>'; }).join('') + '</tr>'; });
    t += '<tr><th scope="row">Our review</th>' + hs.map(function (h) { return '<td><a href="' + esc(h.review) + '">Read the review</a></td>'; }).join('') + '</tr>';
    t += '<tr><th scope="row">Check rates</th>' + hs.map(function (h) { return '<td>' + btn(h) + '</td>'; }).join('') + '</tr></tbody></table></div>';
    var diff = []; var A = hs[0], B = hs[1];
    if (A.setting !== B.setting) diff.push(A.name + ' is a ' + A.setting.toLowerCase() + ' hotel; ' + B.name + ' is a ' + B.setting.toLowerCase() + ' hotel.');
    if (A.area !== B.area) diff.push('Areas differ: ' + A.area + ' versus ' + B.area + '.');
    var shareBtns = '<p class="dnc-note"><button type="button" class="dnc-ghost" id="dnc-copy">Copy link to this comparison</button> <button type="button" class="dnc-ghost" id="dnc-saveall">Save these to my shortlist</button></p>';
    out.innerHTML = (diff.length ? '<p class="dnc-sub"><strong>Main differences:</strong> ' + esc(diff.join(' ')) + ' Rates for your dates may change which is better value; check both on Trip.com.</p>' : '') + t + shareBtns;
    var key = sel.join(','); if (!seen[key]) { seen[key] = 1; track('dn_compare_use', { hotels: key, list_size: sel.length }); }
    try { history.replaceState(null, '', location.pathname + '?h=' + key); } catch (e) {}
    document.getElementById('dnc-copy').onclick = function () { var u = location.href; if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { count.textContent = 'Comparison link copied.'; }, function () { window.prompt('Copy this link:', u); }); else window.prompt('Copy this link:', u); };
    document.getElementById('dnc-saveall').onclick = function () { sel.forEach(function (s) { if (window.DN_SHORTLIST && !window.DN_SHORTLIST.has(s)) window.DN_SHORTLIST.toggle(s); }); count.textContent = 'Saved to the shortlist in this browser.'; };
  }
  H.forEach(function (h) { var l = document.createElement('label'), i = document.createElement('input'); i.type = 'checkbox'; i.value = h.id; i.addEventListener('change', function () { var ix = sel.indexOf(h.id); if (i.checked && ix < 0 && sel.length < 3) sel.push(h.id); else if (!i.checked && ix > -1) sel.splice(ix, 1); render(); }); l.appendChild(i); l.appendChild(document.createTextNode(' ' + h.name)); pick.appendChild(l); });
  function shortlist() {
    var box = document.getElementById('dnc-sl'), ul = document.getElementById('dnc-sl-list'); var l = (window.DN_SHORTLIST ? window.DN_SHORTLIST.get() : []).filter(function (s) { return byId[s]; });
    if (!l.length) { box.hidden = true; return; } box.hidden = false;
    ul.innerHTML = l.map(function (s) { return '<li><span>' + esc(byId[s].name) + '</span><span><a href="' + esc(byId[s].review) + '">Review</a> <button type="button" class="dnc-save" data-rm="' + esc(s) + '">Remove</button></span></li>'; }).join('');
    ul.onclick = function (e) { var b = e.target.closest('[data-rm]'); if (b) { window.DN_SHORTLIST.toggle(b.getAttribute('data-rm')); } };
    document.getElementById('dnc-sl-load').onclick = function () { sel = l.slice(0, 3); render(); track('dn_shortlist_return', { list_size: l.length }); };
    document.getElementById('dnc-sl-clear').onclick = function () { l.forEach(function (s) { window.DN_SHORTLIST.toggle(s); }); };
  }
  document.addEventListener('dn:shortlist', shortlist);
  var m = /[?&]h=([^&]+)/.exec(location.search); if (m) sel = decodeURIComponent(m[1]).split(',').filter(function (s) { return byId[s]; }).slice(0, 3);
  render(); setTimeout(shortlist, 0);
  if (!sel.length && window.DN_SHORTLIST && window.DN_SHORTLIST.get().length) track('dn_shortlist_return', { list_size: window.DN_SHORTLIST.get().length });
})();
