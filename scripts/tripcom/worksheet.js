#!/usr/bin/env node
// Link worksheet for the Trip.com Partners link generator.
//
//   node scripts/tripcom/worksheet.js export [--sample|--pilot]   writes data/tripcom/link-worksheet.csv (or
//        link-worksheet-pilot.csv): one row per unique Trip.com page (hotel or city) to paste into the
//        dashboard's link generator, with empty columns for the owner to fill.
//   node scripts/tripcom/worksheet.js import [--pilot] [--replace]   reads the filled worksheet, checks every
//        pasted link (lib.affiliateUrlProblems) and copies it BYTE FOR BYTE into every registry entry that
//        targets that Trip.com page, with provenance (source, date, SHA-256 of the exact string, owner's
//        "opens the right property" confirmation) and an append-only history line.
//
// The links themselves always come from Trip.com's generator; this script never builds, edits, shortens,
// re-encodes or appends parameters. An existing link is never overwritten without --replace.
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, REGISTRY, loadRegistry, affiliateUrlProblems, sha256, loadPilot } = require('./lib');

const args = process.argv.slice(2), cmd = args[0], PILOT = args.includes('--pilot'), SAMPLE = args.includes('--sample');
const FILE = path.join(ROOT, 'data', 'tripcom', SAMPLE ? 'link-worksheet-sample.csv' : PILOT ? 'link-worksheet-pilot.csv' : 'link-worksheet.csv');
const HISTORY = path.join(ROOT, 'data', 'tripcom', 'link-history.jsonl');
const reg = loadRegistry();
const q = v => `"${String(v).replace(/"/g, '""')}"`;
const HEAD = ['paste_into_link_generator', 'tripcom_type', 'tripcom_id', 'name', 'site_links', 'registry_keys', 'affiliate_url', 'generated_on', 'opens_correct_property', 'property_seen_on_trip_com', 'notes'];

function pilotKeys() {
  if (SAMPLE) return new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'tripcom', 'representative-5.json'), 'utf8')).keys);
  const pilot = loadPilot(); if (!pilot) throw new Error('data/tripcom/pilot.json missing');
  const keys = new Set();
  for (const e of reg.entries) {
    if (!(e.pages || []).some(p => pilot.pages.includes(p.page))) continue;
    keys.add(e.key); if (e.fallback_key) keys.add(e.fallback_key);
  }
  return keys;
}

if (cmd === 'export') {
  let only = PILOT || SAMPLE ? pilotKeys() : null;
  if (only) { const dests = new Set(reg.entries.filter(e => only.has(e.key)).map(e => e.tripcom_destination)); only = new Set(reg.entries.filter(e => dests.has(e.tripcom_destination)).map(e => e.key)); }   // every key that shares a destination gets the same link
  const rows = new Map();
  for (const e of reg.entries) {
    if (only && !only.has(e.key)) continue;
    if (!e.tripcom_destination || !((e.effective_links > 0) || only)) continue;
    if (e.decision === 'remove') continue;          // removed / held destinations need no link
    const r = rows.get(e.tripcom_destination) || { dest: e.tripcom_destination, id: e.tripcom_id, type: e.tripcom_type, name: e.tripcom_name || e.name, links: 0, keys: [], url: e.affiliate_url };
    r.links += e.effective_links || e.link_count || 0; r.keys.push(e.key);
    rows.set(e.tripcom_destination, r);
  }
  const sorted = [...rows.values()].sort((a, b) => b.links - a.links);
  const lines = [HEAD.join(',')];
  for (const r of sorted) lines.push([r.dest, r.type, r.id, r.name, r.links, r.keys.join(' '), r.url || '', '', '', '', ''].map(q).join(','));
  fs.writeFileSync(FILE, lines.join('\n') + '\n');
  console.log(`Wrote ${sorted.length} rows (${sorted.reduce((a, r) => a + r.links, 0)} site links) to ${path.relative(ROOT, FILE)}`);
} else if (cmd === 'import') {
  const text = fs.readFileSync(FILE, 'utf8').replace(/\r/g, '').trim().split('\n').filter(Boolean);
  const parse = line => { const out = []; let cur = '', inq = false; for (let i = 0; i < line.length; i++) { const c = line[i]; if (inq) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') inq = false; else cur += c; } else if (c === '"') inq = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };
  const head = parse(text[0]).map(h => h.trim());
  const col = n => { const i = head.indexOf(n); if (i < 0) throw new Error(`worksheet column "${n}" missing; re-run export`); return i; };
  const C = Object.fromEntries(HEAD.map(h => [h, col(h)]));
  const byKey = new Map(reg.entries.map(e => [e.key, e]));
  const seen = new Map(); let ok = 0, bad = 0, skipped = 0;
  const today = new Date().toISOString().slice(0, 10);
  const hist = [];
  for (const line of text.slice(1)) {
    const cells = parse(line);
    const g = n => (cells[C[n]] || '').trim();
    const url = g('affiliate_url'); if (!url) { skipped++; continue; }
    const name = g('name'), dest = g('paste_into_link_generator'), keys = g('registry_keys').split(' ').filter(Boolean);
    const problems = affiliateUrlProblems(url);
    if (seen.has(url)) problems.push(`same link already used for "${seen.get(url)}" (each destination needs its own generated link)`);
    const open = g('opens_correct_property').toLowerCase();
    if (open === 'no') problems.push('owner reports the link does NOT open the correct property');
    if (open && !['yes', 'no'].includes(open)) problems.push('opens_correct_property must be yes or no');
    const on = g('generated_on'); if (on && !/^\d{4}-\d{2}-\d{2}$/.test(on)) problems.push('generated_on must be YYYY-MM-DD');
    if (problems.length) { console.log(`REJECTED ${name} (${dest}): ${problems.join('; ')}`); bad++; continue; }
    seen.set(url, name);
    for (const k of keys) {
      if (k.startsWith('widget:')) { reg.widget = reg.widget || {}; reg.widget[k.slice(7)] = url; continue; }
      const e = byKey.get(k); if (!e) continue;
      if (e.affiliate_url && e.affiliate_url !== url && !args.includes('--replace')) { console.log(`KEPT     ${k}: already has a different link (use --replace to supersede; old link stays in link-history.jsonl)`); continue; }
      if (e.affiliate_url && e.affiliate_url !== url) hist.push({ ts: new Date().toISOString(), key: k, action: 'superseded', sha256: e.affiliate_url_sha256 || sha256(e.affiliate_url), url: e.affiliate_url });
      e.affiliate_url = url;
      e.affiliate_url_original = e.affiliate_url_original && e.affiliate_url_original === url ? e.affiliate_url_original : url;
      e.affiliate_url_sha256 = sha256(url);
      e.affiliate_url_source = 'Trip.com Partners dashboard link generator (generated by the account owner)';
      e.generator_input_url = dest;                      // what the owner was asked to paste into the generator
      e.generated_at = on || today; e.generated_on_assumed = !on;
      e.verification = { opens_correct_property: open || 'unconfirmed', property_seen: g('property_seen_on_trip_com'), notes: g('notes'), imported_at: today };
      hist.push({ ts: new Date().toISOString(), key: k, action: 'imported', sha256: e.affiliate_url_sha256, url });
    }
    ok++;
  }
  reg.meta.totals.with_affiliate_url = reg.entries.filter(e => e.affiliate_url).length;
  fs.writeFileSync(REGISTRY, JSON.stringify(reg, null, 1) + '\n');
  if (hist.length) fs.appendFileSync(HISTORY, hist.map(h => JSON.stringify(h)).join('\n') + '\n');
  console.log(`Imported ${ok} link(s), rejected ${bad}, empty rows ${skipped}. Next: link-profile.js derive (first time) → review → approve; then apply.js (dry run).`);
  if (bad) process.exitCode = 1;
} else {
  console.log('usage: worksheet.js export|import [--sample|--pilot] [--replace]');
}
