#!/usr/bin/env node
// Sitewide conversion/SEO audit. Read-only. Writes docs/revenue/audit.json and prints a summary.
'use strict';
const fs = require('fs'), path = require('path');
let cheerio; try { cheerio = require('cheerio'); } catch (e) { cheerio = require('/Users/ryanyousefi/dananghotelguide/node_modules/cheerio'); }
const ROOT = path.resolve(__dirname, '..', '..');
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/registry.json'), 'utf8')).entries;
const hotelKeys = new Map(reg.filter(e => e.kind === 'hotel' && e.affiliate_url).map(e => [e.key.replace(/^hotel:/, ''), e]));
const files = [...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')), ...fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f)];
const skip = new Set(['site-preview.html', 'favicon-html-snippet.html']);
function classify(f, $) {
  const b = path.basename(f, '.html');
  if (f.startsWith('kr/')) return 'korean';
  if (['index'].includes(b)) return 'home';
  if (/^(privacy|terms|contact|about|editorial-policy|why-trust-us|hotel-review-methodology|affiliate|disclosure|cookie|404)/.test(b)) return 'utility';
  if (/(directory|map)/.test(b) && /hotel/.test(b)) return 'directory-map';
  if (b === 'news' || /vietnam-tourism-boom|forbes|fireworks/.test(b)) return 'news';
  if (/-vs-/.test(b)) return 'comparison';
  if (/^(best|top)-/.test(b) || /^(da-nang-hotels?-with|hotels-with|family-hotels|boutique-hotels|luxury)/.test(b)) return 'best-list';
  if (/^(where-to-stay|best-areas|areas-)/.test(b) || /where-to-stay/.test(b)) return 'neighborhood';
  if (hotelKeys.has(b) || /^review-/.test(b) || $('script[type="application/ld+json"]').text().includes('"Hotel"') || /(review)/.test($('title').text().toLowerCase())) return 'hotel-review';
  if (/itinerary|days-in|how-many-days|getting-around|airport|transport|best-time|first-time|walkable/.test(b)) return 'itinerary-transport';
  if (/hoi-an|da-nang|son-tra|beach|food|bars|malls|things|cruise|digital-nomad|guide/.test(b)) return 'destination-guide';
  return 'other';
}
const pages = [];
const inlinks = new Map();
for (const f of files) {
  if (skip.has(f)) continue;
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8'); const $ = cheerio.load(html);
  $('script,style,noscript').remove();
  const main = $('main#dn-main, main').first().length ? $('main#dn-main, main').first() : $('body');
  const text = main.text().replace(/\s+/g, ' ').trim();
  const links = new Set(); main.find('a[href]').each((_, a) => { const h = $(a).attr('href'); if (h && !/^(https?:|mailto:|#|tel:)/.test(h)) { const t = h.split('#')[0].split('?')[0]; if (t) links.add(t); } });
  for (const t of links) { const k = f.startsWith('kr/') ? 'kr/' + t : t; inlinks.set(t, (inlinks.get(t) || 0) + 1); void k; }
  const ctas = []; main.find('a.tc-btn').each((i, a) => { const el = $(a); ctas.push({ key: el.attr('data-tc-key') || '', label: el.text().replace(/\s+/g, ' ').trim().slice(0, 60) }); });
  const h2 = main.find('h2').map((_, e) => $(e).text().trim()).get();
  pages.push({ file: f, type: classify(f, cheerio.load(html)), title: ($('title').text() || '').trim(), titleLen: ($('title').text() || '').trim().length, description: ($('meta[name=description]').attr('content') || '').trim(), canonical: $('link[rel=canonical]').attr('href') || '', h1: $('h1').first().text().trim(), words: text.split(' ').length, h2count: h2.length, h2: h2.slice(0, 12), ctaCount: ctas.length, ctas, hotelCtas: ctas.filter(c => c.key.startsWith('hotel:')).length, searchCtas: ctas.filter(c => c.key.startsWith('search:')).length, internalLinks: links.size, imgNoAlt: main.find('img:not([alt])').length, hasBreadcrumb: !!$('nav.breadcrumb, [aria-label=Breadcrumb]').length, hasJsonLd: /ld\+json/.test(html), jsonLdTypes: [...html.matchAll(/"@type"\s*:\s*"([A-Za-z]+)"/g)].map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8), firstCtaPct: (() => { const i = html.search(/<a [^>]*tc-btn/); return i < 0 ? null : Math.round(100 * i / html.length); })(), hotelKey: hotelKeys.has(path.basename(f, '.html')) ? 'hotel:' + path.basename(f, '.html') : '' });
}
for (const p of pages) p.inlinks = inlinks.get(p.file) || inlinks.get(path.basename(p.file)) || 0;
fs.writeFileSync(path.join(ROOT, 'docs/revenue/audit.json'), JSON.stringify({ generated: new Date().toISOString(), pages }, null, 1));
const by = {}; for (const p of pages) { const b = by[p.type] = by[p.type] || { n: 0, cta: 0, hotel: 0, zero: 0, words: 0 }; b.n++; b.cta += p.ctaCount; b.hotel += p.hotelCtas; b.zero += p.ctaCount === 0 ? 1 : 0; b.words += p.words; }
console.log('pages', pages.length); for (const [k, v] of Object.entries(by)) console.log(k.padEnd(20), 'n', v.n, 'avgCTA', (v.cta / v.n).toFixed(1), 'hotelCTAs', v.hotel, 'zeroCTA', v.zero, 'avgWords', Math.round(v.words / v.n));
console.log('orphans (0 inlinks, non-utility)', pages.filter(p => !p.inlinks && p.type !== 'utility' && p.file !== 'index.html').length);
console.log('missing meta description', pages.filter(p => !p.description).length, '| title>65', pages.filter(p => p.titleLen > 65).length, '| imgNoAlt', pages.reduce((a, p) => a + p.imgNoAlt, 0), '| no canonical', pages.filter(p => !p.canonical).length);
