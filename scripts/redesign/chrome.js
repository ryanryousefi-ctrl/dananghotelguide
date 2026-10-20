// Shared chrome for the 2.0 redesign: masthead, mobile menu, footer.
// One source of truth; build.js injects it into every page. Page-specific
// facts (nav links per language, the booking-button URL with its CJ sid, the
// legal/disclosure text) are extracted from each page and passed in.
'use strict';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const ICON_SEARCH = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';

// nav: { home, top:[{label,href,active,items:[{label,href}]}], stays:{href,label,aria,text}, more:[...] }
function header(nav, lang) {
  const kr = lang === 'ko';
  const li = t => {
    const items = t.items && t.items.length ? t.items : null;
    const cls = 'dn-top' + (t.active ? ' is-active' : '');
    if (!items) return `<li><a class="${cls}" href="${esc(t.href)}">${t.label}</a></li>`;
    return `<li class="dn-has-drop"><a class="${cls}" href="${esc(t.href)}" aria-haspopup="true" aria-expanded="false">${t.label}<svg class="dn-caret" viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></a>` +
      `<div class="dn-drop"><ul>${items.map(i => `<li><a href="${esc(i.href)}">${i.label}</a></li>`).join('')}</ul></div></li>`;
  };
  const stays = nav.stays ? `<a href="${esc(nav.stays.href)}" class="nav-stays-btn affiliate-link dn-header__cta" aria-label="${esc(nav.stays.aria)}" target="_blank" rel="nofollow noopener sponsored"><span class="btn-text">${nav.stays.text}</span></a>` : '';
  return `<a class="dn-skip" href="#dn-main">${kr ? '본문으로 건너뛰기' : 'Skip to content'}</a>
<header class="dn-header" id="dnHeader">
  <div class="dn-header__bar">
    <button class="nav-hamburger dn-burger" id="navHamburger" type="button" aria-label="${kr ? '메뉴 열기' : 'Open menu'}" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span></button>
    <a class="dn-brand" href="${esc(nav.home)}" aria-label="Da Nang Hotel Guide ${kr ? '홈' : 'home'}"><b>Da Nang <i>Hotel Guide</i></b><small>${kr ? '독립 여행 가이드' : 'Independent · Da Nang &amp; Hoi An'}</small></a>
    <nav class="dn-nav" aria-label="${kr ? '주 메뉴' : 'Main navigation'}"><ul>${nav.top.map(li).join('')}</ul></nav>
    <div class="dn-header__actions">
      ${nav.search ? `<button class="nav-search-btn dn-iconbtn" id="searchOpenBtn" type="button" aria-label="${kr ? '사이트 검색' : 'Search site'}" aria-expanded="false">${ICON_SEARCH}</button>` : ''}
      ${stays}
    </div>
  </div>
</header>`;
}

function mobileMenu(nav, lang) {
  const kr = lang === 'ko';
  const sec = t => {
    const items = t.items && t.items.length ? t.items : null;
    if (!items) return `<a class="dn-menu__link${t.active ? ' is-active' : ''}" href="${esc(t.href)}">${t.label}</a>`;
    return `<details class="dn-menu__group"${t.active ? ' open' : ''}><summary>${t.label}</summary><div><a href="${esc(t.href)}">${kr ? '전체 보기' : 'Overview'}</a>${items.map(i => `<a href="${esc(i.href)}">${i.label}</a>`).join('')}</div></details>`;
  };
  const stays = nav.stays ? `<a href="${esc(nav.stays.href)}" class="mobile-stays-btn affiliate-link dn-menu__cta" target="_blank" rel="nofollow noopener sponsored">${nav.stays.mobileText || nav.stays.text} &rarr;</a>` : '';
  return `<div class="dn-menu" id="mobileMenu" aria-hidden="true">
  <div class="dn-menu__inner">
    <a class="dn-menu__link" href="${esc(nav.home)}">${kr ? '홈' : 'Home'}</a>
    ${nav.all.map(sec).join('\n    ')}
    ${stays}
    <p class="dn-menu__social"><a href="https://x.com/DaNangHG" target="_blank" rel="noopener noreferrer">X</a><a href="https://www.facebook.com/profile.php?id=61572009361799" target="_blank" rel="noopener noreferrer">Facebook</a><a href="https://www.pinterest.com/dananghotelguide/" target="_blank" rel="noopener noreferrer">Pinterest</a><a href="https://www.instagram.com/dananghotelguide/" target="_blank" rel="noopener noreferrer">Instagram</a></p>
  </div>
</div>`;
}

const EN_COLUMNS = [
  ['Hotels', [['best-hotels-in-da-nang.html', 'Best Hotels in Da Nang'], ['luxury-hotels-da-nang.html', 'Luxury Resorts'], ['da-nang-beach-hotels.html', 'Beachfront'], ['boutique-hotels-da-nang.html', 'Boutique'], ['family-hotels-da-nang.html', 'Family'], ['best-budget-hotels-in-da-nang.html', 'Affordable'], ['best-hotels-in-hoi-an.html', 'Best Hotels in Hoi An'], ['da-nang-hotel-directory.html', 'Hotel Directory'], ['da-nang-hotels-map.html', 'Hotels Map']]],
  ['Neighbourhoods', [['best-hotels-near-my-khe-beach.html', 'My Khe Beach'], ['best-hotels-an-thuong-da-nang.html', 'An Thuong'], ['best-han-river-hotels-da-nang.html', 'Han River &amp; City Centre'], ['son-tra-peninsula-da-nang.html', 'Son Tra'], ['non-nuoc-beach-da-nang.html', 'Non Nuoc Beach'], ['hoi-an-old-town-hotels.html', 'Hoi An Ancient Town'], ['an-bang-beach-hotels.html', 'An Bang Beach'], ['where-to-stay-in-da-nang.html', 'Where to Stay']]],
  ['Guides', [['things-to-do-in-da-nang.html', 'Things To Do'], ['da-nang-itinerary.html', 'Itineraries'], ['best-time-to-visit-da-nang.html', 'Best Time to Visit'], ['da-nang-transport-guide.html', 'Getting Around'], ['da-nang-first-time-visitors.html', 'First-Time Visitors'], ['da-nang-budget-guide.html', 'Budget Guide'], ['dining.html', 'Dining'], ['guides.html', 'All Guides'], ['news.html', 'News']]],
  ['The Guide', [['about.html', 'About'], ['why-trust-us.html', 'Why Trust Us'], ['editorial-policy.html', 'Editorial Policy'], ['hotel-review-methodology.html', 'How We Review'], ['hotel-reviews.html', 'Hotel Reviews'], ['privacy.html', 'Privacy'], ['terms.html', 'Terms'], ['contact.html', 'Contact']]],
];

// legal: HTML of the page's own disclosure / legal lines (kept verbatim)
function footer({ home, prefix, lang, columns, legalHtml, exists }) {
  const kr = lang === 'ko';
  const cols = kr && columns && columns.length ? columns
    : EN_COLUMNS.map(([t, ls]) => ({ title: t, links: ls.filter(([f]) => !exists || exists(f)).map(([f, l]) => ({ href: prefix + f, label: l })) }));
  return `<footer class="dn-footer">
  <div class="dn-footer__top">
    <div class="dn-footer__brand">
      <a class="dn-brand dn-brand--light" href="${esc(home)}"><b>Da Nang <i>Hotel Guide</i></b><small>${kr ? '독립 여행 가이드' : 'Independent · Da Nang &amp; Hoi An'}</small></a>
      <p>${kr ? '다낭과 호이안의 호텔을 직접 확인하고 쓰는 독립 가이드입니다.' : 'Independent hotel and travel advice for Da Nang and Hoi An, written by a local editor. No paid placements.'}</p>
    </div>
    <aside class="shr-bar dn-share" aria-label="${kr ? '이 페이지 공유' : 'Share this page'}"><span class="shr-label">${kr ? '공유' : 'Share'}</span>
      <a class="shr-btn" id="shr-x" href="#" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">X</a>
      <a class="shr-btn" id="shr-fb" href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook">Facebook</a>
      <a class="shr-btn" id="shr-rd" href="#" target="_blank" rel="noopener noreferrer" aria-label="Reddit">Reddit</a>
      <a class="shr-btn" id="shr-wa" href="#" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">WhatsApp</a>
      <a class="shr-btn" id="shr-li" href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a>
    </aside>
  </div>
  <nav class="dn-footer__cols" aria-label="${kr ? '사이트 맵' : 'Site map'}">
    ${cols.map(c => `<div><p class="dn-footer__title">${c.title}</p>${c.links.map(l => `<a href="${esc(l.href)}">${l.label}</a>`).join('')}</div>`).join('\n    ')}
  </nav>
  <div class="dn-footer__legal">${legalHtml}<p class="dn-footer__settings"><button type="button" class="dn-consent-open">${kr ? '개인정보 설정' : 'Privacy settings'}</button></p></div>
</footer>`;
}
module.exports = { header, mobileMenu, footer, EN_COLUMNS, esc };
