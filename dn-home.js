/* Homepage: "Find your hotel" sends visitors to the matching guide on this site (no affiliate links, no dates). */
(function () {
  var f = document.getElementById('dhFind'); if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var area = document.getElementById('dhArea').value, style = document.getElementById('dhStyle').value;
    window.location.href = area || style;
  });
})();
