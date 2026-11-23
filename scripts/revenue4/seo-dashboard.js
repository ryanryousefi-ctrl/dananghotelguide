#!/usr/bin/env node
// SEO opportunity dashboard from Search Console Performance exports (see docs/revenue/reporting-workflow.md). Reads real exports only.
//   node scripts/revenue4/seo-dashboard.js --pages Pages.csv [--queries Queries.csv] [--prev-pages Pages-previous.csv] [--out docs/revenue/dashboards/seo.html]
// Pages.csv: "Top pages, Clicks, Impressions, CTR, Position" (Search Console export). Queries.csv: "Top queries, Clicks, Impressions, CTR, Position".
'use strict';
const fs = require('fs'), path = require('path'); const { csv, num, tableHtml, page, arg } = require('./report-lib'); const ROOT = path.resolve(__dirname, '..', '..');
if (!arg('pages')) { console.error('usage: seo-dashboard.js --pages Pages.csv [--queries Queries.csv] [--prev-pages prev.csv] [--out file]'); process.exit(2); }
const norm = r => ({ url: r.top_pages || r.page || r.url || '', q: r.top_queries || r.query || '', clicks: num(r.clicks), imp: num(r.impressions), ctr: num(r.ctr), pos: num(r.position) });
const P = csv(arg('pages')).map(norm), Q = arg('queries') ? csv(arg('queries')).map(norm) : [], PREV = arg('prev-pages') ? csv(arg('prev-pages')).map(norm) : [];
const file = u => { try { const p = new URL(u).pathname.replace(/^\//, ''); return p === '' ? 'index.html' : p; } catch (e) { return u; } };
// internal inbound links from our own pages (served HTML at the repo root)
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')); const inbound = Object.fromEntries(pages.map(f => [f, 0]));
for (const f of pages) { const h = fs.readFileSync(path.join(ROOT, f), 'utf8'); const seen = new Set(); for (const m of h.matchAll(/href="([a-z0-9-]+\.html)(?:#[^"]*)?"/g)) if (m[1] !== f && !seen.has(m[1]) && m[1] in inbound) { seen.add(m[1]); inbound[m[1]]++; } }
const expected = imp => imp >= 1000 ? 0.02 : 0.01; const body = [];
body.push(tableHtml('High impressions, low CTR (rewrite title and description first)', ['Page', 'Impressions', 'CTR', 'Position'], P.filter(r => r.imp >= 200 && r.ctr / 100 < expected(r.imp) && r.pos <= 15).sort((a, b) => b.imp - a.imp).slice(0, 30).map(r => [file(r.url), r.imp, r.ctr + '%', r.pos.toFixed(1)]), 'Pages shown often but rarely clicked; snippet and title are the cheapest fix.'));
body.push(tableHtml('Close to page one (average position 8-20)', ['Page', 'Impressions', 'Clicks', 'Position', 'Internal links in'], P.filter(r => r.pos >= 8 && r.pos <= 20 && r.imp >= 50).sort((a, b) => b.imp - a.imp).slice(0, 30).map(r => [file(r.url), r.imp, r.clicks, r.pos.toFixed(1), inbound[file(r.url)] ?? '?'])));
if (Q.length) body.push(tableHtml('Commercial queries not yet answered well (hotel intent, position > 10)', ['Query', 'Impressions', 'Position'], Q.filter(r => /hotel|resort|stay|villa|price|book|suite|beach/i.test(r.q) && r.pos > 10 && r.imp >= 30).sort((a, b) => b.imp - a.imp).slice(0, 40).map(r => [r.q, r.imp, r.pos.toFixed(1)])));
if (PREV.length) { const pv = new Map(PREV.map(r => [file(r.url), r])); const rows = P.map(r => ({ f: file(r.url), now: r, was: pv.get(file(r.url)) })).filter(x => x.was);
  body.push(tableHtml('Commercial pages losing visibility (impressions down 30%+)', ['Page', 'Impressions before', 'Impressions now', 'Position before', 'Position now'], rows.filter(x => x.was.imp >= 100 && x.now.imp < x.was.imp * 0.7).sort((a, b) => (b.was.imp - b.now.imp) - (a.was.imp - a.now.imp)).slice(0, 30).map(x => [x.f, x.was.imp, x.now.imp, x.was.pos.toFixed(1), x.now.pos.toFixed(1)])));
  body.push(tableHtml('New pages gaining impressions', ['Page', 'Impressions', 'Position'], P.filter(r => !pv.has(file(r.url)) && r.imp > 0).sort((a, b) => b.imp - a.imp).slice(0, 30).map(r => [file(r.url), r.imp, r.pos.toFixed(1)]))); }
body.push(tableHtml('Pages with impressions but weak internal linking (fewer than 3 internal links in)', ['Page', 'Impressions', 'Internal links in'], P.map(r => [file(r.url), r.imp, inbound[file(r.url)]]).filter(r => r[2] !== undefined && r[2] < 3 && r[1] >= 50).sort((a, b) => b[1] - a[1]).slice(0, 30)));
const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8'); const inSm = [...sm.matchAll(/<loc>https:\/\/www\.dananghotelguide\.com\/([^<]*)<\/loc>/g)].map(m => m[1] || 'index.html'); const seenP = new Set(P.map(r => file(r.url)));
body.push(tableHtml('Sitemap pages with no impressions in this export (check indexing in Search Console > Pages)', ['Page', 'Internal links in'], inSm.filter(f => !seenP.has(f)).map(f => [f, inbound[f] ?? '?']).slice(0, 60)));
const out = arg('out') || path.join(ROOT, 'docs/revenue/dashboards/seo.html');
fs.writeFileSync(out, page('SEO opportunity dashboard', body.join('\n'), `Built ${new Date().toISOString().slice(0, 10)} from ${path.basename(arg('pages'))}${Q.length ? ' and ' + path.basename(arg('queries')) : ''}. Figures are Search Console's; nothing is estimated.`));
console.log('seo dashboard:', out, '|', P.length, 'pages,', Q.length, 'queries');
