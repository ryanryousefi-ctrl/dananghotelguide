#!/usr/bin/env node
// Affiliate click report from GA4 Exploration CSV exports. Reads real exports only; it never fetches or invents numbers.
//   node scripts/revenue/ga4-report.js --clicks clicks.csv [--views views.csv] [--top 15]
// clicks.csv columns (any order, header row required): page_path, event_count, and optionally cta_location, cta_label, device_category, page_type, cta_position, link_key
// views.csv columns: page_path, views (optional device_category). Outbound CTR = affiliate_click events / page views. A click is not a booking.
'use strict';
const fs = require('fs');
const arg = n => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
const csv = f => { const L = fs.readFileSync(f, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#')); const split = l => { const o = []; let c = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o.map(s => s.trim()); }; const H = split(L[0]).map(h => h.toLowerCase().replace(/\s+/g, '_')); return L.slice(1).map(l => Object.fromEntries(split(l).map((v, i) => [H[i], v]))); };
if (!arg('clicks')) { console.error('usage: ga4-report.js --clicks clicks.csv [--views views.csv] [--top 15]'); process.exit(2); }
const clicks = csv(arg('clicks')), views = arg('views') ? csv(arg('views')) : [], top = Number(arg('top') || 15);
const n = v => Number(String(v || '0').replace(/,/g, '')) || 0;
const sum = (rows, key, val = 'event_count') => { const m = new Map(); for (const r of rows) { const k = r[key] || '(not set)'; m.set(k, (m.get(k) || 0) + n(r[val])); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };
const total = clicks.reduce((a, r) => a + n(r.event_count), 0);
const pct = (a, b) => b ? (100 * a / b).toFixed(2) + '%' : 'n/a';
const show = (title, rows, extra) => { console.log('\n## ' + title); rows.slice(0, top).forEach(([k, v]) => console.log(`${String(v).padStart(7)}  ${pct(v, total).padStart(7)}  ${k}${extra ? '  ' + extra(k, v) : ''}`)); };
console.log(`affiliate_click events in export: ${total}`);
const vp = new Map(); for (const r of views) vp.set(r.page_path, (vp.get(r.page_path) || 0) + n(r.views));
show('Top pages by affiliate clicks (share of all clicks; outbound CTR when views provided)', sum(clicks, 'page_path'), (k, v) => vp.has(k) ? `CTR ${pct(v, vp.get(k))} of ${vp.get(k)} views` : '');
for (const [t, k] of [['By CTA location (early_review, sticky_mobile, guide_end, home_book, finder, header, inline...)', 'cta_location'], ['By page type', 'page_type'], ['By CTA label', 'cta_label'], ['By device', 'device_category'], ['By hotel/destination key', 'link_key']]) if (clicks.some(r => r[k])) show(t, sum(clicks, k));
if (clicks.some(r => r.cta_position)) { const b = { '0-25%': 0, '25-50%': 0, '50-75%': 0, '75-100%': 0 }; for (const r of clicks) { const p = Number(r.cta_position); const c = p < 25 ? '0-25%' : p < 50 ? '25-50%' : p < 75 ? '50-75%' : '75-100%'; if (r.cta_position !== '') b[c] += n(r.event_count); } show('By position on the page', Object.entries(b)); }
const noClick = [...vp.entries()].filter(([p, v]) => v >= 100 && !clicks.some(r => r.page_path === p)).sort((a, b) => b[1] - a[1]); if (noClick.length) { console.log('\n## Pages with 100+ views and no affiliate clicks in the export (candidates for a better next step)'); noClick.slice(0, top).forEach(([p, v]) => console.log(`${String(v).padStart(7)}  ${p}`)); }
console.log('\nNote: GA4 shows clicks on this site only. Bookings and commission are confirmed only in the Trip.com affiliate dashboard (Booking report T+1, Commission report on the 5th of the next month).');
