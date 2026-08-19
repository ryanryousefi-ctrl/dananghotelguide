// search-ui.js — Da Nang Hotel Guide shared search overlay behavior
// Canonical implementation, extracted from index.html.
// Wires up #searchOpenBtn / #searchOverlay / #searchInput exactly like the homepage.
// Safe to include on every page: no-ops if the overlay markup isn't present,
// and guards against double-initialization if included twice.
(function() {
  if (window.__dhgSearchUiInit) return;
  window.__dhgSearchUiInit = true;

  function init() {
    var overlay    = document.getElementById('searchOverlay');
    var searchBtn  = document.getElementById('searchOpenBtn');
    var searchClose= document.getElementById('searchCloseBtn');
    var searchInput= document.getElementById('searchInput');
    var results    = document.getElementById('searchResultsInline');
    var hint       = document.getElementById('searchHint');

    if (!overlay || !searchBtn) return; // nothing to wire up on this page

    function openSearch() {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      searchBtn.setAttribute('aria-expanded', 'true');
      setTimeout(function() { if (searchInput) searchInput.focus(); }, 100);
    }
    function closeSearch() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      searchBtn.setAttribute('aria-expanded', 'false');
      if (searchInput) searchInput.value = '';
      if (results) results.innerHTML = '';
      if (hint) hint.style.display = '';
    }

    searchBtn.addEventListener('click', openSearch);
    if (searchClose) searchClose.addEventListener('click', closeSearch);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeSearch(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeSearch();
      if (e.key === '/' && !overlay.classList.contains('open') && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault(); openSearch();
      }
    });

    if (searchInput && results) {
      searchInput.addEventListener('input', function() {
        var q = this.value.trim();
        if (q.length < 2) { results.innerHTML = ''; if (hint) hint.style.display = ''; return; }
        if (hint) hint.style.display = 'none';
        var hits = window.runSearch ? runSearch(q) : [];
        if (!hits.length) { results.innerHTML = '<p class="search-no-results">No results for "' + q + '", try a different term.</p>'; return; }
        results.innerHTML = hits.slice(0, 8).map(function(item) {
          return '<a class="sri" href="' + item.url + '" role="option">' +
            '<div class="sri-cat">' + item.cat + '</div>' +
            '<div class="sri-body"><div class="sri-title">' + item.title + '</div><div class="sri-excerpt">' + item.excerpt + '</div></div>' +
          '</a>';
        }).join('');
      });
      searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { var first = results.querySelector('.sri'); if (first) { first.click(); closeSearch(); } }
      });
    }

    overlay.querySelectorAll('.sh-pill').forEach(function(pill) {
      pill.addEventListener('click', function() {
        if (searchInput) { searchInput.value = this.dataset.q; searchInput.dispatchEvent(new Event('input')); }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
