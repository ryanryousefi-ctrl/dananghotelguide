#!/usr/bin/env node
// Method-labelled distances for every hotel with sourced coordinates (data/hotels/research2). Writes data/hotels/routes.json.
//  straight_line: great-circle from OSM coordinates. driving: OSRM public demo server (car profile, no traffic). walking: routing.openstreetmap.de foot profile (city hotels only).
// Landmark points: Nominatim, 23 Nov 2026. Re-run when coordinates change; results are cached per hotel+target.
'use strict';
const fs = require('fs'), path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const R2 = {}; for (const f of fs.readdirSync(path.join(ROOT, 'data/hotels/research2')).filter(f => f.endsWith('.json'))) Object.assign(R2, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/research2', f), 'utf8')));
const LM = { airport: [16.0425792, 108.1971613, 'Da Nang International Airport'], dragon_bridge: [16.0611682, 108.2278968, 'Dragon Bridge'], han_market: [16.0683525, 108.2242830, 'Han Market'], hoi_an_old_town: [15.8779509, 108.3239898, 'Hoi An Old Town'] };
const hav = (a, b, c, d) => { const p = Math.PI / 180, x = Math.sin((c - a) * p / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin((d - b) * p / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const out = fs.existsSync(path.join(ROOT, 'data/hotels/routes.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/routes.json'), 'utf8')) : { meta: {}, hotels: {} };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function route(prof, a, b) {
  const url = prof === 'car' ? `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=false` : `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${a[1]},${a[0]};${b[1]},${b[0]}?overview=false`;
  for (let i = 0; i < 3; i++) { try { const r = await fetch(url, { headers: { 'user-agent': 'dnhg-factcheck/1.0' } }); const j = await r.json(); if (j.code === 'Ok') return { km: +(j.routes[0].distance / 1000).toFixed(1), minutes: Math.round(j.routes[0].duration / 60) }; } catch (e) {} await sleep(1500); }
  return null;
}
(async () => {
  for (const [slug, r] of Object.entries(R2)) {
    if (r.lat == null || r.lng == null) continue; const h = out.hotels[slug] = { coords: [r.lat, r.lng], coord_source: r.coord_source || '', distances: {} };
    const city = r.neighborhood_group === 'han-river-city' || /city|hai chau|han river/i.test(r.neighborhood_note || '');
    for (const [k, [la, ln]] of Object.entries(LM)) {
      const d = { straight_line_km: +hav(r.lat, r.lng, la, ln).toFixed(1) };
      d.driving = await route('car', [r.lat, r.lng], [la, ln]); await sleep(1100);
      if (city && (k === 'han_market' || k === 'dragon_bridge')) { d.walking = await route('foot', [r.lat, r.lng], [la, ln]); await sleep(1100); }
      h.distances[k] = d;
    }
    console.log(slug, JSON.stringify(h.distances.airport), JSON.stringify(h.distances.han_market));
  }
  out.meta = { built: '2026-11-23', methods: { straight_line_km: 'great-circle from OpenStreetMap coordinates', driving: 'OSRM public server, car profile, free-flow (no traffic); real taxi times are usually longer', walking: 'routing.openstreetmap.de foot profile' }, landmarks: LM };
  fs.writeFileSync(path.join(ROOT, 'data/hotels/routes.json'), JSON.stringify(out, null, 1));
})();
