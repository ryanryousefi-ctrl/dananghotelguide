#!/usr/bin/env node
// Builds data/tripcom/registry.json, the single source of truth for every
// hotel-booking destination on the site.
//
// Inputs:  served pages (live CJ links) + data/tripcom/hotel-matches.csv and
//          search-destinations.csv (verified Trip.com IDs).
// Output:  one entry per Booking destination with the existing Booking URL,
//          verified Trip.com ID and plain destination, the official affiliate
//          URL (blank until generated in the Trip.com dashboard), confidence,
//          notes and every page that references it.
//
// Re-running is safe: affiliate_url / affiliate_url_source / generated_at
// values already in the registry are kept. Nothing here creates a tracking link.
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, REGISTRY, ALLIANCE_ID, SITE_ID, servedPages, findCjLinks, loadDecisions, planFor } = require('./lib');

function readCsv(file) {
  const text = fs.readFileSync(file, 'utf8');
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter(r => r.length > 1);
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] || ''])));
}

const dataDir = path.join(ROOT, 'data', 'tripcom');
const hotels = new Map(readCsv(path.join(dataDir, 'hotel-matches.csv')).map(r => [`hotel:${r.booking_slug}`, r]));
const searches = new Map(readCsv(path.join(dataDir, 'search-destinations.csv'))
  .map(r => [`search:${r.booking_search_term}|${r.booking_dest_id}|${r.booking_dest_type}`, r]));

const previous = fs.existsSync(REGISTRY) ? JSON.parse(fs.readFileSync(REGISTRY, 'utf8')) : { entries: [], widget: {} };
const keep = new Map(previous.entries.map(e => [e.key, e]));

const refs = new Map();
for (const page of servedPages()) {
  const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
  for (const l of findCjLinks(src)) {
    if (!l.key) continue;
    if (!refs.has(l.key)) refs.set(l.key, { dest: l.dest.split('?')[0], fullDest: l.dest, pages: new Map(), mech: {}, occ: [] });
    const r = refs.get(l.key);
    r.occ.push({ page, sid: l.sid });
    r.pages.set(page, (r.pages.get(page) || 0) + 1);
    r.mech[l.mechanism] = (r.mech[l.mechanism] || 0) + 1;
  }
}

const entries = [];
const unknown = [];
for (const [key, r] of [...refs].sort()) {
  const isHotel = key.startsWith('hotel:');
  const m = isHotel ? hotels.get(key) : searches.get(key);
  if (!m) unknown.push(key);
  const id = m ? (isHotel ? m.tripcom_hotel_id : m.tripcom_id) : '';
  const type = isHotel ? 'hotel' : (m ? m.tripcom_target_type : '');
  const numeric = /^\d+$/.test(id);
  const prev = keep.get(key) || {};
  entries.push({
    key,
    kind: isHotel ? 'hotel' : 'search',
    name: isHotel ? (m && m.hotel_name) || '' : key.slice(7).split('|')[0],
    location: isHotel ? (m && m.location) || '' : '',
    booking_destination: isHotel ? r.dest : r.fullDest,
    tripcom_id: numeric ? id : '',
    tripcom_type: numeric ? type : '',
    tripcom_name: (m && m.tripcom_name) || '',
    tripcom_destination: numeric ? (type === 'hotel'
      ? `https://www.trip.com/hotels/detail/?hotelId=${id}`
      : `https://www.trip.com/hotels/list?city=${id}`) : '',
    affiliate_url: prev.affiliate_url || '',
    affiliate_url_source: prev.affiliate_url_source || '',
    generated_at: prev.generated_at || '',
    // Decision for destinations with no own Trip.com link: key of the entry
    // whose official link to use instead (e.g. the city list).
    fallback_key: prev.fallback_key || '',
    status: m ? m.match_status : 'UNMATCHED',
    confidence: (m && m.confidence) || (m && m.match_status === 'VERIFIED' ? 'high' : ''),
    notes: (m && m.notes) || (numeric ? '' : (m ? '' : 'Not in match CSVs: new link added after inventory')),
    link_count: [...r.pages.values()].reduce((a, b) => a + b, 0),
    mechanisms: r.mech,
    pages: [...r.pages].map(([page, count]) => ({ page, count })),
  });
}

// ── Owner decisions (data/tripcom/decisions.json) ───────────────────────────
const decisions = loadDecisions().entries || {};
const byKey = new Map(entries.map(e => [e.key, e]));
const dest = (type, id) => type === 'hotel' ? `https://www.trip.com/hotels/detail/?hotelId=${id}` : `https://www.trip.com/hotels/list?city=${id}`;
const problems = [];
for (const [key, d] of Object.entries(decisions)) {
  let e = byKey.get(key);
  if (!e && d.synthetic) {
    const prev = keep.get(key) || {};
    e = { key, kind: 'hotel', name: d.name || '', location: d.location || '', booking_destination: '', tripcom_id: '', tripcom_type: '',
      tripcom_name: d.tripcom_name || '', tripcom_destination: '', affiliate_url: prev.affiliate_url || '', affiliate_url_source: prev.affiliate_url_source || '',
      generated_at: prev.generated_at || '', fallback_key: '', status: 'VERIFIED', confidence: 'high', notes: '', link_count: 0, mechanisms: {}, pages: [], synthetic: true };
    entries.push(e); byKey.set(key, e);
  }
  if (!e) { problems.push(`decision for unknown key ${key}`); continue; }
  if (d.tripcom_id) {
    e.tripcom_id = d.tripcom_id;
    e.tripcom_type = d.tripcom_type || e.tripcom_type || 'hotel';
    e.tripcom_destination = dest(e.tripcom_type, e.tripcom_id);
  }
  for (const f of ['decision', 'status', 'name', 'tripcom_name', 'relabel', 'fallback_key', 'overrides', 'editorial_flag', 'deferred', 'candidate_tripcom', 'to_readd']) if (d[f] !== undefined) e[f] = d[f];
  if (d.status === 'VERIFIED') e.confidence = 'high';
  if (d.note) e.notes = d.note;
  e.decision_source = 'owner ' + (loadDecisions().approved_on || '');
}
for (const e of entries) {
  if (!e.decision) e.decision = e.status === 'VERIFIED' && e.tripcom_destination ? 'map' : 'undecided';
}
// Route every occurrence and count what each Trip.com link will actually serve.
for (const e of entries) { e.effective_links = 0; e.effective_pages = {}; e.removed_links = 0; }
const overrideHits = new Map();
for (const [key, r] of refs) {
  const e = byKey.get(key);
  for (const o of r.occ) {
    const plan = planFor(e, o.page, o.sid);
    if (plan.override) overrideHits.set(plan.override, (overrideHits.get(plan.override) || 0) + 1);
    if (plan.decision === 'remove') { e.removed_links++; continue; }
    if (!['map', 'fallback'].includes(plan.decision)) continue; // hold / investigate / undecided: no link yet
    const t = byKey.get(plan.key);
    if (!t) { problems.push(`${key}: plan points at unknown key ${plan.key}`); continue; }
    t.effective_links++;
    t.effective_pages[o.page] = (t.effective_pages[o.page] || 0) + 1;
  }
}
for (const e of entries) for (const o of e.overrides || []) {
  const hits = overrideHits.get(o) || 0;
  if (o.expect !== undefined && hits !== o.expect) problems.push(`${e.key}: override for ${o.page}${o.sid ? ' sid ' + o.sid : ''} matched ${hits} link(s), expected ${o.expect}`);
}
for (const e of entries.filter(x => x.synthetic)) {
  e.link_count = e.effective_links;
  e.pages = Object.entries(e.effective_pages).map(([page, count]) => ({ page, count }));
}

const registry = {
  meta: {
    description: 'Booking.com (CJ) to Trip.com hotel-link registry. affiliate_url values must be pasted from the Trip.com Partners dashboard link generator; never assembled by hand.',
    trip_alliance_id: ALLIANCE_ID,
    trip_site_id: SITE_ID,
    built_at: new Date().toISOString(),
    totals: {
      destinations: entries.length,
      links: entries.filter(e => !e.synthetic).reduce((a, e) => a + e.link_count, 0),
      with_affiliate_url: entries.filter(e => e.affiliate_url).length,
      by_status: entries.reduce((a, e) => (a[e.status] = (a[e.status] || 0) + 1, a), {}),
      by_decision: entries.reduce((a, e) => (a[e.decision] = (a[e.decision] || 0) + e.link_count, a), {}),
      links_removed: entries.reduce((a, e) => a + e.removed_links, 0),
      links_needing_trip_url: entries.reduce((a, e) => a + e.effective_links, 0),
      links_blocked_by_decision: entries.filter(e => ['hold', 'investigate', 'undecided'].includes(e.decision)).reduce((a, e) => a + e.link_count, 0),
    },
  },
  // Official links for the sitewide widget (tripcom-widget.js). The dated
  // templates stay empty unless Trip.com supplies a dated deep-link format.
  widget: Object.assign({ danang: '', hoian: '', dated_template_danang: '', dated_template_hoian: '' }, previous.widget || {}),
  entries,
};
fs.writeFileSync(REGISTRY, JSON.stringify(registry, null, 1) + '\n');
console.log(JSON.stringify(registry.meta.totals));
if (unknown.length) console.log('Destinations missing from the match CSVs:', unknown);
if (problems.length) { console.error('Decision problems:\n  ' + problems.join('\n  ')); process.exitCode = 1; }
