#!/usr/bin/env node
// Revenue dashboard from GA4 Exploration CSV exports (see docs/revenue/reporting-workflow.md). Reads real exports only.
//   node scripts/revenue4/revenue-dashboard.js --clicks clicks.csv [--views views.csv] [--events events.csv] [--out docs/revenue/dashboards/revenue.html]
// clicks.csv: page_path, event_count (+ any of cta_location, page_type, cta_label, cta_position, link_key, hotel_name, device_category)
// events.csv: event_name, event_count (+ device_category): dn_compare_use, dn_shortlist_save, dn_shortlist_remove, dn_shortlist_return, dn_copy_link, dn_planner_use
'use strict';
const fs = require('fs'), path = require('path'); const { csv, num, tableHtml, page, arg } = require('./report-lib');
if (!arg('clicks')) { console.error('usage: revenue-dashboard.js --clicks clicks.csv [--views views.csv] [--events events.csv] [--out file]'); process.exit(2); }
const C = csv(arg('clicks')), V = arg('views') ? csv(arg('views')) : [], E = arg('events') ? csv(arg('events')) : [];
const total = C.reduce((a, r) => a + num(r.event_count), 0); const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
const group = (key, fn) => { const m = new Map(); for (const r of C) { const k = fn ? fn(r) : (r[key] || '(not set)'); m.set(k, (m.get(k) || 0) + num(r.event_count)); } return [...m].sort((a, b) => b[1] - a[1]); };
const views = new Map(); for (const r of V) views.set(r.page_path, (views.get(r.page_path) || 0) + num(r.views || r.screen_page_views));
const body = [];
body.push(tableHtml('Pages by affiliate clicks', ['Page', 'Clicks', 'Share', 'Views', 'Clicks per 100 views'], group('page_path').slice(0, 40).map(([k, v]) => [k, v, pct(v, total), views.get(k) || '', views.get(k) ? (100 * v / views.get(k)).toFixed(2) : ''])));
body.push(tableHtml('By page type', ['Page type', 'Clicks', 'Share'], group('page_type').map(([k, v]) => [k, v, pct(v, total)])));
body.push(tableHtml('By CTA location', ['cta_location', 'Clicks', 'Share'], group('cta_location').map(([k, v]) => [k, v, pct(v, total)])));
body.push(tableHtml('Where on the page', ['Position band', 'Clicks', 'Share'], group(null, r => { const p = num(r.cta_position); return r.cta_position == null || r.cta_position === '' ? '(not set)' : p < 25 ? '0-25% (top)' : p < 50 ? '25-50%' : p < 75 ? '50-75%' : '75-100% (end)'; }).map(([k, v]) => [k, v, pct(v, total)])));
body.push(tableHtml('Hotel-specific vs destination search links', ['Link type', 'Clicks', 'Share'], group(null, r => /^hotel:/.test(r.link_key || '') ? 'Hotel page (deep link)' : /^search:/.test(r.link_key || '') ? 'Destination search' : '(not set)').map(([k, v]) => [k, v, pct(v, total)])));
body.push(tableHtml('Tools as a click source', ['Source', 'Clicks', 'Share'], group(null, r => { const l = r.cta_location || ''; return l === 'finder' ? 'Stay Planner / finder' : l === 'compare-tool' ? 'Comparison tool' : l === 'sticky_mobile' ? 'Mobile sticky bar' : /^p[34]-/.test(l) ? 'Phase 3/4 modules' : 'Other page buttons'; }).map(([k, v]) => [k, v, pct(v, total)])));
body.push(tableHtml('Top hotels clicked', ['Hotel', 'Clicks'], group('hotel_name').filter(([k]) => k !== '(not set)').slice(0, 25)));
body.push(tableHtml('Mobile vs desktop', ['Device', 'Clicks', 'Share'], group('device_category').map(([k, v]) => [k, v, pct(v, total)])));
if (E.length) { const m = new Map(); for (const r of E) m.set(r.event_name, (m.get(r.event_name) || 0) + num(r.event_count)); body.push(tableHtml('Tool engagement (not clicks, not bookings)', ['Event', 'Count'], [...m].sort((a, b) => b[1] - a[1]), 'dn_planner_use = Stay Planner run; dn_compare_use = a comparison shown; dn_shortlist_save/remove/return = shortlist activity; dn_copy_link = link copied.')); }
const out = arg('out') || path.join(__dirname, '..', '..', 'docs/revenue/dashboards/revenue.html');
fs.writeFileSync(out, page('Affiliate click dashboard', body.join('\n'), `Built ${new Date().toISOString().slice(0, 10)} from ${path.basename(arg('clicks'))}: ${total} affiliate_click events. A click is not a booking: bookings and commission are confirmed only in the Trip.com affiliate dashboard (Booking report T+1, Commission report after check-out).`));
console.log('revenue dashboard:', out, '|', total, 'clicks');
