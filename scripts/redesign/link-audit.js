#!/usr/bin/env node
// Booking-link audit: baseline vs redesign. Reports every affiliate link that is no longer present,
// classifies it (hotel page vs generic search), checks rel/target security attributes,
// disclosure presence and the booking-button density per page.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
let cheerio; try { cheerio = require('cheerio'); } catch (e) { cheerio = require('/Users/ryanyousefi/dananghotelguide/node_modules/cheerio'); }
const BASE = fs.readFileSync(path.join(ROOT, 'docs/redesign/BASELINE.txt'), 'utf8').match(/[0-9a-f]{40}/)[0];
const show = f => cp.execFileSync('git', ['show', `${BASE}:${f}`], { cwd: ROOT, maxBuffer: 64 << 20 }).toString();
const vj = JSON.parse(show('vercel.json')); const red = new Set((vj.redirects || []).map(r => r.source.slice(1)));
const pages = cp.execFileSync('git', ['ls-tree', '-r', '--name-only', BASE], { cwd: ROOT }).toString().split('\n').filter(f => /^(kr\/)?[^/]+\.html$/.test(f) && !red.has(f) && !/site-preview|favicon-html/.test(f)).sort();
const CJ = /kqzyfj\.com\/click-101820678-17293132\?[^"'\s<>]+/g;
const norm = s => s.replace(/&amp;/g, '&');
const kind = u => { try { const d = decodeURIComponent(norm(u).match(/[?&]url=([^&]+)/)[1]); return /\/hotel\/vn\//.test(d) ? 'hotel:' + d.match(/\/hotel\/vn\/([^.?]+)/)[1] : 'search'; } catch (e) { return 'search'; } };
const out = { removed: { hotel: [], search: 0 }, added: 0, secBad: [], noDisclosure: [], dens: [], nonBlank: 0, total: [0, 0] };
for (const p of pages) {
  const b = (show(p).match(CJ) || []).map(norm), htmlA = fs.readFileSync(path.join(ROOT, p), 'utf8'), a = (htmlA.match(CJ) || []).map(norm);
  out.total[0] += b.length; out.total[1] += a.length;
  const A = new Map(); a.forEach(x => A.set(x, (A.get(x) || 0) + 1));
  for (const x of b) { if (A.get(x)) A.set(x, A.get(x) - 1); else { const k = kind(x); if (k === 'search') out.removed.search++; else out.removed.hotel.push(`${p}: ${k}`); } }
  const B = new Map(); b.forEach(x => B.set(x, (B.get(x) || 0) + 1)); for (const x of a) { if (B.get(x)) B.set(x, B.get(x) - 1); else out.added++; }
  const $ = cheerio.load(htmlA);
  $('a[href*="kqzyfj.com/click-101820678"]').each((i, e) => { const rel = ($(e).attr('rel') || ''), tg = $(e).attr('target'); if (tg !== '_blank' || !/noopener/.test(rel) || !/sponsored/.test(rel) || !/nofollow/.test(rel)) out.secBad.push(`${p}: ${(($(e).text() || '').trim().slice(0, 30))} [target=${tg} rel=${rel}]`); });
  const txt = $('body').text().toLowerCase();
  if (a.length && !/affiliate|commission|제휴|수수료/.test(txt)) out.noDisclosure.push(p);
  out.dens.push([p, $('a.dn-btn--book').length]);
}
out.dens.sort((x, y) => y[1] - x[1]);
console.log(`Booking links: baseline ${out.total[0]} → now ${out.total[1]} (net ${out.total[1] - out.total[0]})`);
console.log(`Missing from the redesign: ${out.removed.search} generic search link(s), ${out.removed.hotel.length} hotel-specific link(s); additions: ${out.added}`);
for (const h of out.removed.hotel) console.log('  HOTEL LINK MISSING', h);
console.log(`Links lacking target=_blank + rel noopener/sponsored/nofollow: ${out.secBad.length}`); out.secBad.slice(0, 8).forEach(x => console.log('  ', x));
console.log(`Pages with affiliate links but no disclosure text: ${out.noDisclosure.length}`, out.noDisclosure.slice(0, 8).join(', '));
console.log('Heaviest pages by booking BUTTONS (after de-duplication):', out.dens.slice(0, 6).map(x => `${x[0]} ${x[1]}`).join(' | '));
const dist = out.dens.reduce((m, [, n]) => (m[n <= 3 ? '0-3' : n <= 8 ? '4-8' : n <= 15 ? '9-15' : '16+'] = (m[n <= 3 ? '0-3' : n <= 8 ? '4-8' : n <= 15 ? '9-15' : '16+'] || 0) + 1, m), {});
console.log('Buttons per page distribution:', JSON.stringify(dist));
process.exit(out.removed.hotel.length || out.secBad.length ? 1 : 0);
