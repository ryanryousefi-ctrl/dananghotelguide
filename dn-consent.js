/* Da Nang Hotel Guide: cookie / analytics consent (Google Consent Mode v2).
   The <head> snippet written by the build sets the DEFAULT state before any
   Google tag runs (denied for the EEA, UK, Switzerland and Vietnam; granted
   elsewhere, via Consent Mode's own region matching). This file shows the
   choice banner, stores the visitor's decision and updates Consent Mode.
   Not a Google-certified TCF consent platform: see docs/redesign/CONSENT.md. */
(function () {
  'use strict';
  var KEY = 'dn_consent', MAX_AGE = 365 * 24 * 3600 * 1000, d = document;
  var GRANT = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };
  var DENY = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };
  var kr = (d.documentElement.lang || '').indexOf('ko') === 0;
  var T = kr ? { t: '쿠키 설정', p: '이 사이트는 방문 통계를 위해 Google Analytics를, 광고를 위해 Google AdSense를 사용합니다. 쿠키 사용 여부를 선택해 주세요. 거부해도 사이트는 모두 정상 작동합니다.', a: '동의', r: '거부', m: '개인정보 설정', l: '개인정보처리방침', href: '../privacy.html' }
                : { t: 'Cookies and measurement', p: 'We use Google Analytics to see which pages are useful and Google AdSense to show ads. Choose whether they may use cookies. The site works fully either way.', a: 'Accept', r: 'Reject', m: 'Privacy settings', l: 'Privacy policy', href: 'privacy.html' };

  function read() { try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && v.t && Date.now() - v.t < MAX_AGE && (v.v === 'granted' || v.v === 'denied')) return v.v; } catch (e) { /* storage blocked */ } return null; }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) { /* storage blocked */ } }
  function apply(v) {
    if (typeof window.gtag === 'function') window.gtag('consent', 'update', v === 'granted' ? GRANT : DENY);
    if (window.adsbygoogle) window.adsbygoogle.requestNonPersonalizedAds = v === 'granted' ? 0 : 1;
  }

  var box;
  function close() { if (box && box.parentNode) box.parentNode.removeChild(box); box = null; }
  function open() {
    if (box) return;
    box = d.createElement('div');
    box.className = 'dn-consent'; box.setAttribute('role', 'region'); box.setAttribute('aria-label', T.t);
    box.innerHTML = '<div class="dn-consent__txt"><p class="dn-consent__t">' + T.t + '</p><p>' + T.p + ' <a href="' + T.href + '">' + T.l + '</a></p></div>' +
      '<div class="dn-consent__btns"><button type="button" class="dn-consent__b" data-v="denied">' + T.r + '</button><button type="button" class="dn-consent__b" data-v="granted">' + T.a + '</button></div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-v]'); if (!b) return;
      var v = b.getAttribute('data-v'); write(v); apply(v); close();
    });
    d.body.appendChild(box);
  }

  var saved = read();
  if (saved) apply(saved); else open();
  d.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('.dn-consent-open'); if (t) { e.preventDefault(); close(); open(); } });
})();
