// The one definition of the banner block (same look as the original best-hotels experiment). Used by install-banners.js.
'use strict';
const START = '<!-- TRIP.COM DYNAMIC BANNER -->', END = '<!-- /TRIP.COM DYNAMIC BANNER -->';
const T = {
  en: { label: 'Advertisement &middot; Trip.com affiliate offer', aria: 'Advertisement', t: 'Hotel offers on Trip.com', n: 'Loads a Trip.com banner; Trip.com may set cookies.', go: 'Show hotel offers', note: 'Paid placement: we may earn a commission if you book through Trip.com. It never changes how we rank hotels.' },
  ko: { label: '광고 &middot; Trip.com 제휴 상품', aria: '광고', t: 'Trip.com 호텔 특가', n: 'Trip.com 배너를 불러옵니다. Trip.com이 쿠키를 설정할 수 있습니다.', go: '호텔 특가 보기', note: '유료 제휴 광고입니다. Trip.com을 통해 예약하시면 당사가 수수료를 받을 수 있으며, 호텔 순위에는 영향을 주지 않습니다.' },
};
module.exports = {
  START, END,
  block(B, { lang, placement, type }) {
    const x = T[lang] || T.en;
    return `${START}
<aside class="dn-adband" aria-label="${x.aria}">
  <p class="dn-adband__label">${x.label}</p>
  <div class="dn-adbox" data-banner="${B.banner_id}" data-placement="${placement}" data-page-type="${type}"><div class="dn-adbox__ph"><p class="dn-adbox__t">${x.t}</p><p class="dn-adbox__n">${x.n}</p><button type="button" class="dn-adbox__go">${x.go}</button></div><template>${B.embed_code}</template></div>
  <p class="dn-adband__note">${x.note}</p>
</aside>
${END}
`;
  },
};
