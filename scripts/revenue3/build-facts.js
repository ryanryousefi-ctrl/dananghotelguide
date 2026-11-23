#!/usr/bin/env node
// Builds data/hotels/facts.json: the central hotel facts dataset.
//  - identity, review URL, Trip.com registry key, image: read from our review pages / registry (no invention)
//  - objective facts: from verified research files (data/hotels/research/*.json), each with sources + date; unknown = "not_verified"
//  - editorial: our own opinions (editorial.js), kept in a separate block
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const TAGS = require('./tags'), ED = require('./editorial');
const unesc = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'");
const attr = (a, n) => { const m = a.match(new RegExp(`\\s${n}="([^"]*)"`)); return m ? unesc(m[1]) : ''; };
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/registry.json'), 'utf8')).entries;
const research = {};
const rd = path.join(ROOT, 'data/hotels/research');
if (fs.existsSync(rd)) for (const f of fs.readdirSync(rd).filter(f => f.endsWith('.json'))) Object.assign(research, JSON.parse(fs.readFileSync(path.join(rd, f), 'utf8')));
// Display area: our grouping of the researched neighborhood (see research.neighborhood for the sourced wording).
const AREA = { 'radisson-blu-da-nang': 'Not verified', 'hilton-da-nang': 'Han River / city centre', 'novotel-da-nang-han-river': 'Han River / city centre', 'brilliant-hotel-da-nang': 'Han River / city centre', 'grand-mercure-da-nang': 'City centre (south, Hoa Cuong)', 'melia-vinpearl-da-nang': 'Han River east bank', 'melia-da-nang': 'Non Nuoc coast', 'hyatt-regency-da-nang': 'Non Nuoc coast', 'naman-retreat-da-nang': 'Non Nuoc coast', 'sheraton-grand-da-nang': 'Truong Sa coast (south of My Khe)', 'marriott-resort-da-nang': 'Truong Sa coast (south of My Khe)', 'intercontinental-da-nang': 'Son Tra Peninsula', 'furama-resort-da-nang': 'South My Khe (Khue My)', 'pullman-da-nang': 'South My Khe (Khue My)', 'premier-village-da-nang': 'South My Khe (Khue My)', 'tia-wellness-resort-da-nang': 'South My Khe (Khue My)', 'a-la-carte-da-nang': 'My Khe Beach', 'four-points-sheraton-da-nang': 'My Khe Beach', 'wyndham-soleil-da-nang': 'My Khe Beach', 'tms-hotel-da-nang': 'My Khe Beach', 'muong-thanh-luxury-da-nang': 'My Khe Beach (south end)' };
const NV = 'Not verified';
// pool wording is withheld where listings contradict each other or rest on one third-party source
const POOL_CONFLICT = { 'brilliant-hotel-da-nang': 'Our review and public listings describe the pool differently; confirm on the hotel page', 'hilton-da-nang': 'Our review and public listings describe the pool differently; confirm on the hotel page', 'grand-mercure-da-nang': 'Our review and public listings describe the pool differently; confirm on the hotel page', 'novotel-da-nang-han-river': 'Listings differ (one third-party source mentions a rooftop pool); confirm on the hotel page', 'melia-vinpearl-da-nang': 'Listings differ; confirm on the hotel page', 'marriott-resort-da-nang': 'Listings differ; confirm on the hotel page', 'muong-thanh-luxury-da-nang': 'Listings disagree on pool type; confirm on the hotel page' };
const POOL_OVERRIDE2 = require('./pool-overrides');
const POOLNAME = { outdoor: 'outdoor pool', indoor: 'indoor pool', rooftop: 'rooftop pool', infinity: 'infinity pool', kids: "children's pool", lazy_river: 'lazy river', other: 'other pool' };
// Straight-line (great-circle) distances from OpenStreetMap coordinates. NOT walking or driving distances.
const LM = { airport: [16.0425792, 108.1971613], bridge: [16.0611682, 108.2278968], market: [16.0683525, 108.2242830] }; // Nominatim, 23 Nov 2026
const hav = (a, b, c, d) => { const p = Math.PI / 180, x = Math.sin((c - a) * p / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin((d - b) * p / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const approx = km => 'about ' + (Math.round(km * 2) / 2).toString().replace(/\.0$/, '') + ' km';
function straight(r) { if (!r || r.confidence === 'low' || !r.lat) return null; return { airport: approx(hav(r.lat, r.lng, ...LM.airport)), bridge: approx(hav(r.lat, r.lng, ...LM.bridge)), market: approx(hav(r.lat, r.lng, ...LM.market)) }; }
function display(slug, r) {
  const low = !r || r.confidence === 'low';
  const yn = v => (v === 'yes' ? 'Yes (per listings)' : v === 'no' ? 'No (per listings)' : NV);
  const beach = low || !r.beach_access || r.beach_access === 'not_verified' ? NV : { beachfront: 'Beachfront (per listings)', short_walk: 'Short walk to the beach (per listings)', not_beach: 'Not a beach hotel' }[r.beach_access];
  const pools = POOL_CONFLICT[slug] || (low || !r.pools || !r.pools.length ? NV : [...new Set(r.pools.map(p => POOLNAME[p.type] || 'pool'))].join(', ') + ' (per listings)');
  const rooms = low || !r.room_types || !r.room_types.length ? NV : r.room_types.slice(0, 3).join('; ');
  const st = straight(r); return { straight: st, beach, pools, lounge: low ? NV : yn(r.club_lounge), kids_club: low ? NV : yn(r.kids_club), rooms, confidence: r ? r.confidence : 'none', checked: r ? r.checked : null, official_website: r ? r.official_website || null : null };
}
// ---- v2: sourced research (data/hotels/research2/*.json, Nov 2026 final audit). Takes precedence over v1 when present.
const R2 = {}; const rd2 = path.join(ROOT, 'data/hotels/research2');
if (fs.existsSync(rd2)) for (const f of fs.readdirSync(rd2).filter(f => f.endsWith('.json'))) Object.assign(R2, JSON.parse(fs.readFileSync(path.join(rd2, f), 'utf8')));
const GROUP = { 'han-river-city': 'Han River / city centre', 'my-khe': 'My Khe Beach', 'south-my-khe': 'South My Khe (Khue My)', 'truong-sa-coast': 'Truong Sa coast (south of My Khe)', 'non-nuoc': 'Non Nuoc coast', 'son-tra': 'Son Tra Peninsula' };
const OV = require('./area-overrides'); const AREA2 = OV.area;
const has = x => x && Array.isArray(x.sources) && x.sources.length > 0;
const fmtKm = km => (km < 10 ? (Math.round(km * 10) / 10) : Math.round(km)) + ' km';
const ROUTES = fs.existsSync(path.join(ROOT, 'data/hotels/routes.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/routes.json'), 'utf8')).hotels : {};
function display2(slug, r) {
  const yn = (o, name) => (has(o) && o.value === 'yes' ? 'Yes' + (o.name ? ', ' + o.name.replace(/[()]/g, '') : '') : has(o) && o.value === 'no' ? 'No' : NV);
  const beach = OV.beach[slug] || (has(r.beach_access) && r.beach_access.value !== 'unknown' ? { beachfront: 'Beachfront', short_walk: 'Short walk to the beach', not_beach: 'Not a beach hotel' }[r.beach_access.value] : NV);
  const roof = r.rooftop || {}; const srcPools = (r.pools || []).filter(p => has(p) && (p.type !== 'rooftop' || roof.rooftop_pool === 'yes'));
  const pools = POOL_OVERRIDE2[slug] || (srcPools.length ? [...new Set(srcPools.map(p => POOLNAME[p.type] || 'pool'))].join(', ') : NV);
  const dist = (to, kind) => (r.distances || []).find(d => d.to === to && d.kind === kind && d.km != null && d.source);
  const dtxt = to => { const R = (ROUTES[slug] || {}).distances || {}; const x = R[to]; if (!x) return NV; const parts = []; if (x.walking && x.walking.minutes <= 30) parts.push('about ' + x.walking.minutes + ' min walk (' + fmtKm(x.walking.km) + ')'); if (x.driving) parts.push(fmtKm(x.driving.km) + ' by road, about ' + Math.max(1, x.driving.minutes) + ' min without traffic'); parts.push(fmtKm(x.straight_line_km) + ' straight line'); return parts.join('; '); };
  const _unused = to => { const dr = dist(to, 'driving'), wa = dist(to, 'walking'), sl = dist(to, 'straight_line'); const parts = []; if (sl) parts.push(fmtKm(sl.km) + ' straight line'); if (wa) parts.push('walk ' + fmtKm(wa.km) + (wa.minutes ? ', about ' + Math.round(wa.minutes) + ' min' : '')); if (dr) parts.push('drive ' + fmtKm(dr.km) + (dr.minutes ? ', about ' + Math.round(dr.minutes) + ' min' : '')); return parts.length ? parts.join('; ') : NV; };
  const rooms = (r.room_categories || []).length ? r.room_categories.slice(0, 4).join('; ') : NV;
  return { beach, pools, lounge: yn(r.club_lounge), kids_club: yn(r.kids_club), rooms, distances: { airport: dtxt('airport'), dragon_bridge: dtxt('dragon_bridge'), han_market: dtxt('han_market'), hoi_an: dtxt('hoi_an_old_town') },
    straight: null, confidence: r.confidence, checked: '2026-11-23', official_website: r.website ? r.website.split(' ')[0] : null, official_name: OV.name[slug] || r.official_name || null };
}
const hotels = {};
for (const [slug, [setting, style, budget, audience, priorities]] of Object.entries(TAGS)) {
  const html = fs.readFileSync(path.join(ROOT, slug + '.html'), 'utf8');
  const a = [...html.matchAll(/<a [^>]*data-tc-key="hotel:[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map(m => m[0]).find(x => /data-hotel="/.test(x) && /href="https:\/\/www\.trip\.com\//.test(x));
  const key = attr(a, 'data-tc-key'); const e = reg.find(r => r.key === key);
  if (!e || e.status !== 'VERIFIED' || !e.affiliate_url) throw new Error('registry entry not verified: ' + slug);
  // Hotel-specific local photos only (review hero images are shared stock photos and would misrepresent the hotel).
  const IMG = { 'marriott-resort-da-nang': 'marriott-da-nang.jpg', 'naman-retreat-da-nang': 'naman-retreat-main-pool.jpg', 'four-points-sheraton-da-nang': 'four-points-exterior.jpeg' };
  const cand = IMG[slug] ? [IMG[slug]] : fs.readdirSync(path.join(ROOT, 'images/hotels')).filter(f => f.replace(/\.[a-z]+$/, '') === slug);
  const img = cand.length ? 'images/hotels/' + cand[0] : null;
  const r = research[slug] || null; const r2 = R2[slug] || null;
  hotels[slug] = { slug, name: attr(a, 'data-hotel'), review: slug + '.html', tripcom_key: key, image: img, setting, style, budget, audience, priorities, editorial: ED[slug], area_label: r2 ? (AREA2[slug] || GROUP[r2.neighborhood_group] || NV) : AREA[slug], display: r2 ? display2(slug, r2) : display(slug, r), research: r2 || r, research_version: r2 ? 2 : 1 };
  if (r2) hotels[slug].official_name = OV.name[slug] || r2.official_name;
}
fs.writeFileSync(path.join(ROOT, 'data/hotels/facts.json'), JSON.stringify({ meta: { built: new Date().toISOString().slice(0, 10), note: 'objective facts live under research (sourced, dated); editorial is opinion; unknown is not_verified' }, hotels }, null, 1));
console.log('facts built:', Object.keys(hotels).length, 'hotels;', Object.keys(research).length, 'with research');
