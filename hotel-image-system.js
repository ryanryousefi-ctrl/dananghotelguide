// Hotel Image System — DaNangHotelGuide.com
// Master reference: maps every hotel name/alias to its local image path
// Usage: reference this when adding hotel images to new pages
// Last updated: 2026-05-26

const HOTEL_IMAGES = {

  // ── LUXURY 5-STAR RESORTS ──────────────────────────────────────
  'intercontinental':             'images/hotels/intercontinental-da-nang.avif',
  'intercontinental sun peninsula': 'images/hotels/intercontinental-da-nang.avif',
  'ic da nang':                   'images/hotels/intercontinental-da-nang.avif',

  'hyatt':                        'images/hotels/hyatt-regency-da-nang.jpg',
  'hyatt regency':                'images/hotels/hyatt-regency-da-nang.jpg',
  'hyatt regency da nang':        'images/hotels/hyatt-regency-da-nang.jpg',

  'sheraton':                     'images/hotels/sheraton-grand-da-nang.jpg',
  'sheraton grand':               'images/hotels/sheraton-grand-da-nang.jpg',
  'sheraton grand da nang':       'images/hotels/sheraton-grand-da-nang.jpg',

  'pullman':                      'images/hotels/pullman-da-nang.jpg',
  'pullman da nang':              'images/hotels/pullman-da-nang.jpg',
  'pullman danang beach resort':  'images/hotels/pullman-da-nang.jpg',

  'furama':                       'images/hotels/furama-resort-da-nang.jpg',
  'furama resort':                'images/hotels/furama-resort-da-nang.jpg',
  'furama resort danang':         'images/hotels/furama-resort-da-nang.jpg',

  'marriott':                     'images/hotels/marriott-da-nang.jpg',
  'da nang marriott':             'images/hotels/marriott-da-nang.jpg',
  'marriott resort da nang':      'images/hotels/marriott-da-nang.jpg',

  'novotel':                      'images/hotels/novotel-da-nang-han-river.jpg',
  'novotel han river':            'images/hotels/novotel-da-nang-han-river.jpg',
  'novotel danang premier':       'images/hotels/novotel-da-nang-han-river.jpg',

  'melia':                        'images/hotels/melia-da-nang.jpg',
  'melia da nang':                'images/hotels/melia-da-nang.jpg',
  'melia danang beach resort':    'images/hotels/melia-da-nang.jpg',

  'premier village':              'images/hotels/premier-village-da-nang.webp',
  'premier village da nang':      'images/hotels/premier-village-da-nang.webp',

  'mikazuki':                     'images/hotels/mikazuki-da-nang.jpg',
  'mikazuki japanese':            'images/hotels/mikazuki-da-nang.jpg',

  'naman':                        'images/review-naman-retreat-da-nang-exterior.jpg',
  'naman retreat':                'images/review-naman-retreat-da-nang-exterior.jpg',

  'hilton':                       'images/review-hilton-da-nang-exterior.jpg',
  'hilton da nang':               'images/review-hilton-da-nang-exterior.jpg',

  'muong thanh':                  'images/review-muong-thanh-luxury-da-nang-exterior.jpg',
  'muong thanh luxury':           'images/review-muong-thanh-luxury-da-nang-exterior.jpg',

  'four points':                  'images/review-four-points-sheraton-da-nang-exterior.jpg',
  'four points sheraton':         'images/review-four-points-sheraton-da-nang-exterior.jpg',

  // ── MID-RANGE HOTELS ──────────────────────────────────────────
  'a la carte':                   'images/hotels/a-la-carte-da-nang.jpg',
  'a la carte da nang beach':     'images/hotels/a-la-carte-da-nang.jpg',

  'brilliant':                    'images/hotels/brilliant-hotel-da-nang.jpg',
  'brilliant hotel':              'images/hotels/brilliant-hotel-da-nang.jpg',
  'brilliant hotel da nang':      'images/hotels/brilliant-hotel-da-nang.jpg',

  'radisson':                     'images/hotels/radisson-blu-da-nang.jpg',
  'radisson blu':                 'images/hotels/radisson-blu-da-nang.jpg',

  'grand mercure':                'images/hotels/grand-mercure-da-nang.jpg',
  'grand mercure da nang':        'images/hotels/grand-mercure-da-nang.jpg',

  'wink':                         'images/hotels/wink-hotel-da-nang.jpg',
  'wink hotel':                   'images/hotels/wink-hotel-da-nang.jpg',

  'wyndham':                      'images/hotels/wyndham-soleil-da-nang.jpg',
  'wyndham soleil':               'images/hotels/wyndham-soleil-da-nang.jpg',

  'azura':                        'images/review-azura-da-nang-e25abed6.jpg',
  'azura da nang':                'images/review-azura-da-nang-e25abed6.jpg',

  'caro':                         'images/hotels/caro-hotel-da-nang.webp',
  'caro hotel':                   'images/hotels/caro-hotel-da-nang.webp',

  'haian':                        'images/hotels/haian-river-hotel-da-nang.jpg',
  'haian beach hotel':            'images/hotels/haian-river-hotel-da-nang.jpg',

  'chicland':                     'images/hotels/chicland-da-nang.jpg',
  'chicland hotel':               'images/hotels/chicland-da-nang.jpg',

  'sandy beach':                  'images/hotels/sandy-beach-non-nuoc-da-nang.webp',
  'sandy beach non nuoc':         'images/hotels/sandy-beach-non-nuoc-da-nang.webp',

  'vinpearl luxury':              'images/hotels/vinpearl-luxury-da-nang.webp',
  'vinpearl luxury da nang':      'images/hotels/vinpearl-luxury-da-nang.webp',

  'melia vinpearl':               'images/review-melia-vinpearl-da-nang-exterior.webp',

  // ── FALLBACK IMAGES (no exact hotel photo available) ──────────
  // Add real photo to images/hotels/ and update here when available

  // TIA Wellness Resort
  'tia':                          'images/hotels/my-khe-beach-da-nang.webp',   // TODO: replace
  'tia wellness':                 'images/hotels/my-khe-beach-da-nang.webp',   // TODO: replace

  // Fusion Maia Da Nang (Non Nuoc, all-inclusive spa resort)
  'fusion maia':                  'images/review-naman-retreat-da-nang-exterior.jpg', // TODO: replace

  // Fusion Suites Da Nang
  'fusion suites':                'images/hotels/my-khe-beach-da-nang.webp',   // TODO: replace

  // TMS Hotel Da Nang Beach
  'tms':                          'images/hotels/my-khe-beach-da-nang.webp',   // TODO: replace
  'tms hotel':                    'images/hotels/my-khe-beach-da-nang.webp',   // TODO: replace

  // Sala Danang Beach
  'sala':                         'images/hotels/my-khe-beach-da-nang.webp',   // TODO: replace
  'sala danang':                  'images/hotels/my-khe-beach-da-nang.webp',   // TODO: replace

  // Mandila Beach Hotel (Han River)
  'mandila':                      'images/hotels/haian-river-hotel-da-nang.jpg', // TODO: replace
  'mandila beach':                'images/hotels/haian-river-hotel-da-nang.jpg', // TODO: replace

  // Stella Maris Da Nang (Han River)
  'stella maris':                 'images/hotels/novotel-da-nang-han-river.jpg', // TODO: replace

  // ── SCENIC / AREA FALLBACKS ───────────────────────────────────
  'my khe beach':                 'images/hotels/my-khe-beach-da-nang.webp',
  'non nuoc beach':               'images/hotels/sandy-beach-non-nuoc-da-nang.webp',
  'son tra peninsula':            'images/hotels/son-tra-peninsula-da-nang.jpg',
  'han river':                    'images/hotels/novotel-da-nang-han-river.jpg',

  // ── OTHER CITIES (for destination comparison pages) ───────────
  'sofitel metropole':            'images/guide-hanoi-hoankiemlake.jpg',
  'sofitel legend metropole':     'images/guide-hanoi-hoankiemlake.jpg',
  'park hyatt saigon':            'images/guide-hcmc-skyline.jpg',
};

// ── CSS STANDARDS ─────────────────────────────────────────────────
//
// hotel-card (padding:2rem) — bleed technique:
//   .hotel-card-img { width:calc(100% + 4rem); height:220px; object-fit:cover;
//     border-radius:12px 12px 0 0; margin:-2rem -2rem 1.25rem; display:block }
//   @media(max-width:480px){ .hotel-card-img { height:180px } }
//
// top-pick-card (padding:1.75rem) — inline style:
//   style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:.75rem;display:block"
//
// hs-card (padding:1.1rem) — bleed technique inline:
//   style="width:calc(100% + 2.2rem);height:160px;object-fit:cover;
//     border-radius:8px 8px 0 0;margin:-1.1rem -1.1rem 0.75rem;display:block"
//
// cmp-visual-duel (comparison panel):
//   .cmp-visual-duel { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin:2rem 0 2.5rem }
//   .cmp-visual-card { position:relative; border-radius:var(--r-lg,14px); overflow:hidden; aspect-ratio:4/3 }
//   .cmp-visual-card img { width:100%; height:100%; object-fit:cover; display:block }
