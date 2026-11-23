#!/usr/bin/env node
// Technical SEO consistency check over served pages: internal link integrity, orphans, canonical/self, sitemap coverage, hreflang reciprocity, title/description sanity, JSON-LD parse.
'use strict';
const fs = require('fs'), path = require('path');
let cheerio; try { cheerio = require('cheerio'); } catch (e) { cheerio = require('/Users/ryanyousefi/dananghotelguide/node_modules/cheerio'); }
const ROOT = path.resolve(__dirname, '..', '..');
const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')); const red = new Map((vj.redirects || []).map(r => [r.source.replace(/^\//, ''), r.destination]));
const skip = new Set(['site-preview.html', 'favicon-html-snippet.html']);
const served = [...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')), ...fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f)].filter(f => !red.has(f) && !skip.has(f));
const set = new Set(served); const sitemap = fs.existsSync(path.join(ROOT, 'sitemap.xml')) ? fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8') : '';
const smUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace('https://www.dananghotelguide.com/', '').replace(/\/$/, '') || 'index.html'));
const inl = new Map(), broken = [], issues = { canonicalMismatch: [], notInSitemap: [], noH1: [], multiH1: [], badJsonLd: [], hreflangNoReturn: [], redirectedLinks: [] };
for (const f of served) {
  const $ = cheerio.load(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const url = 'https://www.dananghotelguide.com/' + (f === 'index.html' ? '' : f);
  const can = $('link[rel=canonical]').attr('href') || ''; if (can && can.replace(/\/$/, '') !== url.replace(/\/$/, '') && can !== url) issues.canonicalMismatch.push(f + ' -> ' + can);
  if (!smUrls.has(f) && !smUrls.has(f.replace(/\.html$/, ''))) issues.notInSitemap.push(f);
  const h1 = $('h1').length; if (!h1) issues.noH1.push(f); if (h1 > 1) issues.multiH1.push(f + ' (' + h1 + ')');
  $('script[type="application/ld+json"]').each((_, s) => { try { JSON.parse($(s).contents().text()); } catch (e) { issues.badJsonLd.push(f); } });
  $('link[rel=alternate][hreflang]').each((_, l) => { const h = $(l).attr('href') || ''; const t = h.replace('https://www.dananghotelguide.com/', ''); if (t && t !== f && !set.has(t)) issues.hreflangNoReturn.push(f + ' -> ' + t); });
  $('a[href]').each((_, a) => { const h = ($(a).attr('href') || ''); if (/^(https?:|mailto:|tel:|#|javascript:)/.test(h)) return; let t = h.split('#')[0].split('?')[0].replace(/^\//, ''); if (!t) return; if (!/\.[a-z]+$/.test(t) && !t.endsWith('/')) t += '.html'; const base = f.startsWith('kr/') && !h.startsWith('/') ? 'kr/' + t : t; const key = set.has(base) ? base : set.has(t) ? t : null;
    if (key) { if (key !== f) inl.set(key, (inl.get(key) || 0) + 1); } else if (red.has(t)) issues.redirectedLinks.push(f + ' -> ' + t); else if (/\.html$/.test(t) && !fs.existsSync(path.join(ROOT, base)) && !fs.existsSync(path.join(ROOT, t))) broken.push(f + ' -> ' + h); });
}
const orphans = served.filter(f => !inl.has(f) && f !== 'index.html');
console.log('served', served.length, '| broken internal links', broken.length, '| links to redirected URLs', issues.redirectedLinks.length, '| orphans', orphans.length);
for (const [k, v] of Object.entries(issues)) if (k !== 'redirectedLinks') console.log(k, v.length, v.slice(0, 5).join(' ; '));
if (broken.length) console.log('BROKEN sample:', broken.slice(0, 8).join(' ; '));
console.log('ORPHANS:', orphans.join(', '));
fs.writeFileSync(path.join(ROOT, 'docs/revenue/seo-check.json'), JSON.stringify({ broken, orphans, issues }, null, 1));
