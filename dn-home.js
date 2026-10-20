/* Homepage: "Find your hotel" sends visitors to the matching guide on this site (no affiliate links, no dates).
   The button says exactly where it will go. When both a neighbourhood and a style are chosen, the
   neighbourhood guide opens (those guides cover every style). */
(function () {
  var f = document.getElementById('dhFind'); if (!f) return;
  var area = document.getElementById('dhArea'), style = document.getElementById('dhStyle'), go = f.querySelector('.dh-find__go');
  function label(sel) { return sel.options[sel.selectedIndex].text; }
  function sync() {
    var t = area.value ? 'Show ' + label(area) + ' hotels' : (style.selectedIndex > 0 ? 'Show ' + label(style) + ' hotels' : 'Show hotels');
    go.textContent = t;
  }
  area.addEventListener('change', sync); style.addEventListener('change', sync); sync();
  f.addEventListener('submit', function (e) { e.preventDefault(); window.location.href = area.value || style.value; });
})();
