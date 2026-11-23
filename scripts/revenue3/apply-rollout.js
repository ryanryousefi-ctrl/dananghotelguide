#!/usr/bin/env node
// Stage B: sitewide rollout of the Phase 3 components by page type. Idempotent: every inserted block is wrapped in <!--dn-c3:r:NAME-->...<!--/dn-c3:r:NAME--> and replaced on re-run.
//   node apply-rollout.js [--check]   (check = report only, writes nothing)
// Placement rules live in PLACEMENT below and are documented in docs/revenue/PHASE3.md.
'use strict';
const fs = require('fs'), path = require('path'); const C = require('./components');
const ROOT = path.resolve(__dirname, '..', '..'); const CHECK = process.argv.includes('--check');
const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')); const redirected = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
const all = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !redirected.has(f));
const REVIEWS = Object.values(C.FACTS).map(h => h.review);
const byTcKey = Object.fromEntries(Object.values(C.FACTS).map(h => [h.tripcom_key, h.slug]));
const LISTS = ['best-hotels-in-da-nang', 'luxury-hotels-da-nang', 'family-hotels-da-nang', 'best-family-resort-da-nang', 'da-nang-beach-hotels', 'boutique-hotels-da-nang', 'best-budget-hotels-in-da-nang', 'best-value-hotels-hoi-an', 'best-hotels-in-hoi-an', 'best-beach-hotel-under-100-da-nang', 'best-luxury-resort-couples-da-nang', 'best-han-river-hotels-da-nang', 'best-hotels-an-thuong-da-nang', 'best-hotels-near-my-khe-beach', 'best-resorts-son-tra-peninsula', 'da-nang-riverfront-hotels', 'da-nang-quiet-areas-hotels', 'da-nang-adults-only-hotels', 'da-nang-honeymoon-hotels', 'da-nang-hotels-infinity-pool', 'da-nang-hotels-kids-club', 'da-nang-hotels-rooftop-pool', 'da-nang-hotels-executive-lounge', 'da-nang-hotels-private-beach', 'da-nang-hotels-private-pool-villa', 'da-nang-hotels-spa-packages', 'da-nang-hotels-with-lazy-river', 'da-nang-hotels-connecting-rooms', 'da-nang-hotels-near-airport', 'hoi-an-old-town-hotels', 'an-bang-beach-hotels', 'best-resort-breakfast-da-nang', 'da-nang-fireworks-festival-hotels', 'da-nang-tet-2027-hotels', 'best-hotels-near-dragon-bridge-han-market-da-nang', 'da-nang-hotel-directory'];
const AREAS = ['my-khe-beach-da-nang', 'son-tra-peninsula-da-nang', 'non-nuoc-beach-da-nang', 'hoi-an', 'where-to-stay-in-hoi-an', 'where-to-stay-between-da-nang-and-hoi-an', 'best-areas-da-nang-families', 'da-nang-first-time-visitors-area-guide', 'my-khe-or-han-river-where-to-stay-da-nang', 'beachfront-vs-city-hotels-da-nang', 'is-da-nang-walkable', 'dragon-bridge-da-nang'];
const GUIDE = { // page -> theme
  itinerary: ['da-nang-3-day-itinerary', 'da-nang-5-day-itinerary', 'da-nang-7-day-itinerary', 'da-nang-itinerary', 'how-many-days-in-da-nang', 'things-to-do-in-da-nang'],
  airport: ['da-nang-airport-guide', 'da-nang-airport-to-my-khe', 'da-nang-airport-to-hoi-an', 'da-nang-transport-guide', 'da-nang-grab-guide'],
  family: ['da-nang-with-kids-guide', 'da-nang-with-teenagers'],
  season: ['best-time-to-visit-da-nang', 'rainy-season-da-nang-guide', 'worst-time-to-visit-da-nang', 'da-nang-weather-by-month', 'da-nang-hotel-prices-by-month'],
  firsttime: ['da-nang-first-time-travel-guide', 'da-nang-first-time-visitors', 'hoi-an-first-time-visitors', 'da-nang-tourist-mistakes', 'da-nang-travel-mistakes', 'what-to-pack-for-da-nang'],
  budget: ['da-nang-budget-guide', 'da-nang-travel-budget-guide', 'is-hoi-an-cheaper-than-da-nang', 'da-nang-vs-hoi-an'],
  visitors: ['da-nang-guide-for-australian-travelers', 'da-nang-guide-for-korean-travelers', 'da-nang-guide-for-russian-travelers', 'da-nang-guide-for-singapore-travelers'],
};
const THEME = {
  itinerary: ['Choose a base for this itinerary', 'A central base saves hours on a multi-day plan. Rates vary by date and room type, so check what is actually available for your stay.', 'danang'],
  airport: ['Booking your arrival night', 'Your first night is easier when the hotel is already decided. Check hotel prices for your actual dates.', 'danang'],
  family: ['Check family accommodation', 'Compare rooms, suites and family-friendly options before booking.', 'danang'],
  season: ['Your dates change the price', 'Rates vary by season, weekday and room category. Check what is available for the dates you are considering.', 'danang'],
  firsttime: ['Ready to choose a hotel?', 'Pick the area first, then compare hotels for your travel dates.', 'danang'],
  budget: ['Compare prices for your travel dates', 'Rates vary by date and room type. Check what is actually available for your stay.', 'danang'],
  visitors: ['Compare Da Nang hotel prices', 'Check available hotels and room rates for the dates you plan to travel.', 'danang'],
};
const LISTCOPY = [
  [/family|kids|connecting|lazy/, 'Check family accommodation', 'Compare rooms, suites and family-friendly options before booking.'],
  [/beach|my-khe|an-bang|son-tra/, 'Check beachfront resorts', 'See which beachfront options are available during your visit.'],
  [/luxury|resort|villa|spa|infinity|honeymoon|couples|boutique|adults|quiet/, 'Compare city hotels and resorts', 'Check whether the extra resort amenities are worth the difference for your travel dates.'],
  [/lounge|rooftop|breakfast/, 'See available room categories', 'Room views, configurations and club access can change the value of a stay.'],
  [/.*/, 'Compare prices for your travel dates', 'Rates vary by date and room type. Check what is actually available for your stay.'],
];
const isHoi = f => /hoi-an|an-bang/.test(f) && !/da-nang-and-hoi-an|from-da-nang/.test(f);
const strip = h => h.replace(/\n*<!--dn-c3:r:([a-z0-9-]+)-->[\s\S]*?<!--\/dn-c3:r:\1-->\n?/g, '\n').replace(/\n*<!--dn-c3:links-->[\s\S]*?<!--\/dn-c3:links-->\n?/g, '\n');
const wrap = (n, b) => `<!--dn-c3:r:${n}-->${b}<!--/dn-c3:r:${n}-->`;
// top-level section boundaries inside <main>
function boundaries(h) {
  const m = h.indexOf('<main'), e = h.lastIndexOf('</main>'); if (m < 0 || e < 0) return [];
  const re = /<section\b|<\/section>/g; re.lastIndex = m; let d = 0, x; const ends = [];
  while ((x = re.exec(h)) && x.index < e) { if (x[0] === '</section>') { d--; if (d === 0) ends.push(x.index + 10); if (d < 0) return []; } else d++; }
  if (!ends.length) { const hd = h.indexOf('</header>', m); if (hd > 0) return [hd + 9]; }
  return ends;
}
const slugsOnPage = h => [...new Set([...h.matchAll(/data-tc-key="(hotel:[^"]*)"/g)].map(m => byTcKey[m[1]]).filter(Boolean))];
const insertAt = (h, ins) => { // ins: [[position, html]], applied from the end
  ins.sort((a, b) => b[0] - a[0]); for (const [p, x] of ins) h = h.slice(0, p) + '\n' + x + h.slice(p); return h;
};
const assets = (h, sticky) => {
  if (!/dn-commerce\.css/.test(h)) h = h.replace(/(<link rel="stylesheet" href="tripcom-cta\.css">)/, '$1\n<link rel="stylesheet" href="dn-commerce.css">');
  if (!/dn-shortlist\.js/.test(h)) h = h.replace(/(<script src="tripcom-cta\.js"[^>]*><\/script>)/, '$1\n<script src="dn-shortlist.js" defer></script>');
  if (sticky && !/dn-sticky-cta\.js/.test(h)) h = h.replace(/(<script src="tripcom-cta\.js"[^>]*><\/script>)/, '$1\n<script src="dn-sticky-cta.js" defer></script>');
  return h;
};
// Pages whose HTML has no <section> structure: explicit, individually reviewed insertion points (module goes AFTER the matched element, which is a direct child of the content container, never inside a list or paragraph).
const PLACE = {
  'da-nang-tet-2027-hotels.html': 'article.article-body > div', 'is-da-nang-walkable.html': 'main > div.bb-sig-pick', 'dragon-bridge-da-nang.html': 'main > div.highlight-box',
  'da-nang-with-kids-guide.html': 'main > div.bb-sig-pick', 'best-time-to-visit-da-nang.html': 'main > div.bb-sig-pick', 'worst-time-to-visit-da-nang.html': 'article.article-body > p:nth-of-type(2)',
  'da-nang-first-time-visitors.html': 'main > div.bb-editor-tip', 'hoi-an-first-time-visitors.html': 'main > div.quick-facts', 'da-nang-travel-mistakes.html': 'main > div.bb-sig-pick',
  'da-nang-budget-guide.html': 'main > div.bb-sig-pick', 'da-nang-guide-for-australian-travelers.html': 'article.article-body > ul', 'da-nang-guide-for-singapore-travelers.html': 'article.article-body > ul',
};
const cheerio = require('cheerio');
const placeAfter = (h, sel) => { const $ = cheerio.load(h, { sourceCodeLocationInfo: true }); const el = $(sel).first()[0]; return el && el.sourceCodeLocation ? el.sourceCodeLocation.endOffset : -1; };
const stats = { list: 0, area: 0, compare: 0, review: 0, guide: 0, skipped: [] };
const report = [];
function process_(f, type, theme) {
  const p = path.join(ROOT, f); let h = strip(fs.readFileSync(p, 'utf8')); const orig = fs.readFileSync(p, 'utf8');
  if (!/<main/.test(h) || !/tripcom-cta\.css/.test(h)) { stats.skipped.push(f + ' (no main/tripcom css)'); return; }
  // First real content section only: ignore sections that belong to the end-of-page modules, and fall back to the end of the page hero when the first section sits late in the page.
  const mStart = h.indexOf('<main'), mEnd = h.lastIndexOf('</main>'); const lim = (() => { const i = h.search(/<!--dn-revenue:(guide|related)-->/); return i >= 0 ? i : mEnd; })();
  let b = boundaries(h).filter(x => x < lim); if (PLACE[f]) { const o = placeAfter(h, PLACE[f]); b = o > 0 ? [o] : []; } else if (!b.length || (b[0] - mStart) / (mEnd - mStart) > 0.4) { const hh = h.indexOf('</header>', h.indexOf('<h1', mStart)); const h1 = h.indexOf('<h1', mStart); b = hh > 0 && h1 > 0 && hh - h1 < 4000 ? [hh + 9] : []; } const hotels = slugsOnPage(h).filter(s => f !== C.FACTS[s].review); const dest = isHoi(f) ? 'hoian' : 'danang'; const ins = []; const mods = [];
  const first = b[0]; if (first == null) { stats.skipped.push(f + ' (no sections)'); return; }
  const end = h.search(/<!--dn-revenue:(guide|related)-->/) >= 0 ? h.search(/<!--dn-revenue:(guide|related)-->/) : h.lastIndexOf('</main>');
  const at = fr => b[Math.min(b.length - 1, Math.max(1, Math.floor(b.length * fr)))] || first;
  if (type === 'list' || type === 'area') {
    const [, t, c] = LISTCOPY.find(r => r[0].test(f)); const hero = C.heroPrice({ id: 'dnc-h-' + f.slice(0, 20).replace(/[^a-z]/g, ''), light: true, kicker: 'Check prices', title: type === 'area' && !/best/.test(f) ? 'Check hotel prices for your dates' : t, copy: type === 'area' && !/best/.test(f) ? 'Once you have an area in mind, compare hotels and check available room rates for your travel dates.' : c, dest, loc: 'p3-list-hero', secondaryLabel: 'Compare Hotels Side by Side', secondaryHref: 'compare-hotels.html' + (hotels.length >= 2 ? '?h=' + hotels.slice(0, 3).join(',') : '') });
    ins.push([first, wrap('hero', hero)]); mods.push('hero');
    if (b.length >= 5) { ins.push([at(0.4), wrap('dates', C.datesReminder(dest, 'p3-dates'))]); mods.push('dates'); }
    if (hotels.length >= 2 && b.length >= 4) { ins.push([at(0.7), wrap('compare', C.compareModule(hotels[0], hotels[1], { loc: 'p3-list-compare' }))]); mods.push('compare'); }
    ins.push([end, wrap('return', C.returnModule(dest))]); mods.push('return'); stats[type === 'list' ? 'list' : 'area']++;
  } else if (type === 'compare') {
    const mine = slugsOnPage(h); if (mine.length < 2) { stats.skipped.push(f + ' (fewer than 2 reviewed hotels)'); return; }
    ins.push([first, wrap('compare', C.compareModule(mine[0], mine[1], { loc: 'p3-vs-compare', sub: 'Our table and verdict are below. The right choice can depend on the price difference for your dates.' }))]); mods.push('compare'); stats.compare++;
  } else if (type === 'review') {
    const slug = Object.values(C.FACTS).find(x => x.review === f).slug, hx = C.hotel(slug);
    const m = h.match(/<section class="[^"]*dn-decide--early[^"]*"[\s\S]*?<\/section>/); let pos, pre = '';
    if (!m) { // review template without the Phase 1 early module: an editor's verdict (hotel-specific verified button) after the page hero instead
      const hh = h.indexOf('</header>', h.indexOf('<h1', h.indexOf('<main'))); if (hh < 0) { stats.skipped.push(f + ' (no hero)'); return; } pos = hh + 9; pre = wrap('verdict', C.verdict(slug, { loc: 'p3-review-verdict' }));
    } else { pos = h.indexOf(m[0]) + m[0].length; if (h.slice(pos).startsWith('<!--/dn-revenue:early-->')) pos += '<!--/dn-revenue:early-->'.length; }
    const tools = `<section class="dnc dnc-sec" aria-label="Save or compare ${C.esc(hx.name)}"><div class="dnc-wrap"><div class="dnc-band"><div class="dnc-band__t"><p>Not sure yet? Save this hotel to a shortlist in this browser, or compare it with another hotel before you check rates.</p></div><div class="dnc-band__a" data-dn-hotel="${slug}"><button type="button" class="dnc-save" data-dn-save="${slug}" aria-pressed="false">Save</button><a class="dnc-ghost" href="compare-hotels.html?h=${slug}">Compare with another hotel</a></div></div></div></section>`;
    ins.push([pos, pre || wrap('tools', tools)]); mods.push(pre ? 'verdict' : 'tools'); stats.review++;
  } else if (type === 'guide') {
    const [t, c, d] = THEME[theme]; ins.push([first, wrap('hero', C.heroPrice({ id: 'dnc-h-' + f.slice(0, 20).replace(/[^a-z]/g, ''), light: true, kicker: 'Hotel planning', title: t, copy: c, dest: d, loc: 'p3-guide-hero', secondaryLabel: 'Find My Ideal Hotel' }))]); mods.push('hero');
    if (theme === 'season') { ins.push([end, wrap('seasonal', C.seasonal('danang'))]); mods.push('seasonal'); }
    stats.guide++;
  }
  h = insertAt(h, ins); h = assets(h, type !== 'review' && mods.includes('hero'));
  const bb = (orig.match(/<section/g) || []).length - (orig.match(/<\/section>/g) || []).length, ba = (h.match(/<section/g) || []).length - (h.match(/<\/section>/g) || []).length;
  if (bb !== ba) { stats.skipped.push(f + ' (section balance changed; not written)'); return; }
  report.push({ page: f, type, modules: mods });
  if (!CHECK) fs.writeFileSync(p, h);
}
for (const s of LISTS) if (all.includes(s + '.html')) process_(s + '.html', 'list');
for (const s of AREAS) if (all.includes(s + '.html')) process_(s + '.html', 'area');
for (const f of all.filter(f => /-vs-/.test(f) && !/^da-nang-vs-|beachfront-vs|tms-hotel-vs-sala|mandila/.test(f))) process_(f, 'compare');
for (const r of REVIEWS) if (all.includes(r)) process_(r, 'review');
for (const [theme, ps] of Object.entries(GUIDE)) for (const s of ps) if (all.includes(s + '.html') && !LISTS.includes(s) && !AREAS.includes(s)) process_(s + '.html', 'guide', theme);
fs.writeFileSync(path.join(ROOT, 'docs/revenue/p3-rollout.json'), JSON.stringify({ pages: report, stats }, null, 1));
console.log(JSON.stringify(stats), 'pages:', report.length, CHECK ? '(dry run)' : '');
