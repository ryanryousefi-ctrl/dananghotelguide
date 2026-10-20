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

/* Hero slider: five slides, crossfade, arrows, dots, swipe, keyboard, pause control.
   Autoplay (6 s) pauses on hover/focus, when offscreen or in a background tab, and never runs under reduced motion.
   Slides after the first load their image on demand. */
(function () {
  var root = document.getElementById('dhSlider'); if (!root) return;
  var slides = [].slice.call(root.querySelectorAll('.dh-slide')), dots = [].slice.call(root.querySelectorAll('.dh-dot'));
  var n = slides.length; if (n < 2) return;
  var live = root.querySelector('.dh-slides');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, timer = null, userPaused = false, hover = false, focus = false, visible = true, tabOn = !document.hidden;
  function load(i) {
    var im = slides[i % n].querySelector('img[data-src]'); if (!im) return;
    [].forEach.call(im.parentNode.querySelectorAll('source[data-srcset]'), function (s) { s.srcset = s.dataset.srcset; s.removeAttribute('data-srcset'); });
    if (im.dataset.srcset) im.srcset = im.dataset.srcset; im.src = im.dataset.src;
    im.removeAttribute('data-src'); im.removeAttribute('data-srcset');
  }
  function show(i) {
    i = (i + n) % n; if (i === cur) return;
    load(i); load(i + 1);
    slides[cur].classList.remove('is-active'); dots[cur].classList.remove('is-active'); dots[cur].removeAttribute('aria-current');
    cur = i;
    slides[cur].classList.add('is-active'); dots[cur].classList.add('is-active'); dots[cur].setAttribute('aria-current', 'true');
  }
  function tick() { clearTimeout(timer); timer = null; if (reduce || userPaused || hover || focus || !visible || !tabOn) return; timer = setTimeout(function () { show(cur + 1); tick(); }, 6000); }
  function go(i) { show(i); tick(); }
  root.classList.add('is-ready');
  live.setAttribute('aria-live', 'off');
  root.querySelector('.dh-prev').addEventListener('click', function () { go(cur - 1); });
  root.querySelector('.dh-next').addEventListener('click', function () { go(cur + 1); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
  var pb = root.querySelector('.dh-pause');
  pb.addEventListener('click', function () {
    userPaused = !userPaused; root.classList.toggle('is-paused', userPaused);
    pb.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
    live.setAttribute('aria-live', userPaused ? 'polite' : 'off'); tick();
  });
  root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hover = true; tick(); } });
  root.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = false; tick(); } });
  root.addEventListener('focusin', function (e) { var kb = true; try { kb = e.target.matches(':focus-visible'); } catch (x) {} if (kb) { focus = true; tick(); } });
  root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { focus = false; tick(); } });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); }
  });
  /* swipe: horizontal drags change slide; vertical drags still scroll the page (touch-action: pan-y) */
  var sx = 0, sy = 0, sid = null, moved = false;
  live.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; sx = e.clientX; sy = e.clientY; sid = e.pointerId; moved = false; });
  live.addEventListener('pointermove', function (e) { if (e.pointerId === sid && Math.abs(e.clientX - sx) > 12) moved = true; });
  live.addEventListener('pointerup', function (e) {
    if (e.pointerId !== sid) return; sid = null;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? cur + 1 : cur - 1);
  });
  live.addEventListener('pointercancel', function () { sid = null; });
  live.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; tick(); }, { threshold: .35 }).observe(root);
  document.addEventListener('visibilitychange', function () { tabOn = !document.hidden; tick(); });
  function warm() { load(1); }
  if (document.readyState === 'complete') warm(); else window.addEventListener('load', function () { setTimeout(warm, 3000); });
  tick();
})();
