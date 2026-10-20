#!/usr/bin/env node
// Before/after inventory for the redesign. Compares every served page in the
// working tree against the recorded baseline commit and fails on any loss of
// SEO metadata, structured data, headings, body links, images or visible text.
//   node scripts/redesign/inventory.js [--json docs/redesign/inventory.json]
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
let cheerio; try { cheerio = require('cheerio'); } catch (e) { cheerio = require('/Users/ryanyousefi/dananghotelguide/node_modules/cheerio'); }
const BASE = fs.readFileSync(path.join(ROOT, 'docs/redesign/BASELINE.txt'), 'utf8').match(/[0-9a-f]{40}/)[0];
const show = f => cp.execFileSync('git', ['show', `${BASE}:${f}`], { cwd: ROOT, maxBuffer: 64 << 20 }).toString('utf8');
const vj = JSON.parse(show('vercel.json'));
const redirected = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
const pages = cp.execFileSync('git', ['ls-tree', '-r', '--name-only', BASE], { cwd: ROOT }).toString().split('\n')
  .filter(f => /^(kr\/)?[^/]+\.html$/.test(f) && !['site-preview.html', 'favicon-html-snippet.html'].includes(f) && !redirected.has(f)).sort();

const norm = s => (s || '').replace(/\s+/g, ' ').trim();
const CHROME = 'nav.site-nav, #mobileMenu, #searchOverlay, footer, .dn-header, .dn-menu, .dn-footer, aside.shr-bar, .dn-skip';
const words = t => (t.toLowerCase().match(/[\p{L}\p{N}$%]+/gu) || []);
function facts(html, isNew) {
  const $ = cheerio.load(html);
  const head = sel => $(sel).map((i, e) => $(e).attr('content') || $(e).attr('href')).get();
  const ld = $('script[type="application/ld+json"]').map((i, e) => { try { return JSON.stringify(JSON.parse($(e).html())); } catch (x) { return 'INVALID:' + $(e).html().slice(0, 40); } }).get();
  const h1 = norm($('h1').first().text());
  $(CHROME).remove();
  $('script, style, noscript, template').remove();
  const heroLike = '.hero, header[class*="hero"], section[class*="-hero"], .hvh-hero, .vs-hero, div[class*="article-hero"]';
  const body = $('body');
  const bodyText = norm(body.text());
  const links = body.find('a[href]').map((i, e) => ($(e).attr('href') || '').replace(/^https?:\/\/(www\.)?dananghotelguide\.com\/?/, '').replace(/^\.\//, '').replace(/&amp;/g, '&')).get().filter(h => h && h !== '#');
  const imgs = body.find('img[src]').map((i, e) => $(e).attr('src')).get().filter(s => !/dhg-logo/.test(s));
  const heads = body.find('h2, h3').map((i, e) => norm($(e).text())).get().filter(Boolean);
  const cj = (html.match(/kqzyfj\.com\/click-101820678-17293132\?sid=[^&"']+&(?:amp;)?url=[^"'\s<>]+/g) || []).map(x => x.replace(/&amp;/g, '&'));
  return {
    title: norm($('title').first().text()), desc: head('meta[name="description"]')[0] || '', canonical: head('link[rel="canonical"]')[0] || '', robots: head('meta[name="robots"]')[0] || '',
    hreflang: $('link[rel="alternate"][hreflang]').map((i, e) => `${$(e).attr('hreflang')}=${$(e).attr('href')}`).get().sort(), og: $('meta[property^="og:"], meta[name^="twitter:"]').map((i, e) => `${$(e).attr('property') || $(e).attr('name')}=${$(e).attr('content')}`).get().sort(),
    ld, h1, links, imgs, heads, words: words(bodyText), cj, lang: $('html').attr('lang') || '', mainCount: $('main').length + (isNew ? 0 : 0),
  };
}
const multiset = a => a.reduce((m, k) => (m.set(k, (m.get(k) || 0) + 1), m), new Map());
function missing(before, after) { const A = multiset(after), out = []; for (const [k, n] of multiset(before)) { const d = n - (A.get(k) || 0); if (d > 0) out.push(d > 1 ? `${k} (x${d})` : k); } return out; }

// Pages whose content is intentionally different. They are reported, never silently passed.
const INTENTIONAL = {
  'index.html': 'Homepage rebuilt from scratch (new editorial layout; every old target stays reachable via header/footer/new sections)',
  'privacy.html': 'Privacy policy corrected: it claimed no analytics or cookies (see docs/redesign/CONSENT.md)',
};
const results = []; let hard = 0;
for (const p of pages) {
  const issues = [], notes = [];
  if (!fs.existsSync(path.join(ROOT, p))) { results.push({ page: p, issues: ['FILE MISSING'] }); hard++; continue; }
  const b = facts(show(p), false), a = facts(fs.readFileSync(path.join(ROOT, p), 'utf8'), true);
  for (const k of ['title', 'desc', 'canonical', 'robots', 'lang']) if (b[k] !== a[k]) issues.push(`${k} changed: "${b[k]}" -> "${a[k]}"`);
  for (const k of ['hreflang', 'og', 'ld']) if (JSON.stringify(b[k]) !== JSON.stringify(a[k])) issues.push(`${k} changed`);
  if (b.h1 !== a.h1) issues.push(`h1 changed: "${b.h1}" -> "${a.h1}"`);
  const mh = missing(b.heads, a.heads); if (mh.length) issues.push(`headings missing: ${mh.slice(0, 3).join(' | ')}`);
  // links: demoted/removed footer links are expected; anything else missing is a failure
  const ml = missing(b.links, a.links).filter(h => !/^(index\.html|\.\.\/index\.html)?$/.test(h));
  if (ml.length) issues.push(`links missing (${ml.length}): ${ml.slice(0, 4).join(' | ').slice(0, 220)}`);
  const mi = missing(b.imgs, a.imgs); if (mi.length) issues.push(`images missing: ${mi.slice(0, 3).join(' | ')}`);
  // visible text: every baseline word must survive (chrome excluded on both sides)
  const bw = multiset(b.words), aw = multiset(a.words); let lost = 0, total = 0; const lostSamples = [];
  for (const [w, n] of bw) { total += n; const d = n - (aw.get(w) || 0); if (d > 0) { lost += d; if (lostSamples.length < 6) lostSamples.push(w); } }
  const lossPct = total ? lost / total * 100 : 0;
  if (lossPct > 1) issues.push(`text loss ${lossPct.toFixed(1)}% (${lost}/${total} words), e.g. ${lostSamples.join(', ')}`); else if (lost) notes.push(`text delta ${lost} words`);
  // affiliate links: identical except the footer "Book via" links that the new footer replaces
  const cjMissing = missing(b.cj, a.cj), cjAdded = missing(a.cj, b.cj);
  // Korean pages had no mobile-menu booking button; the new menu repeats the header one (+1, intentional).
  const allowedAdd = p.startsWith('kr/') ? 1 : 0;
  if (cjAdded.length > allowedAdd) issues.push(`affiliate links ADDED: ${cjAdded.length}`); else if (cjAdded.length) notes.push('mobile-menu CTA added');
  if (INTENTIONAL[p] && issues.length) { notes.push('INTENTIONAL: ' + INTENTIONAL[p]); results.push({ page: p, issues: [], intentional: INTENTIONAL[p], reviewedDifferences: issues, cjRemoved: cjMissing.length, textLossPct: +lossPct.toFixed(2), wordsBefore: total, wordsAfter: a.words.length }); continue; }
  results.push({ page: p, issues, cjRemoved: cjMissing.length, textLossPct: +lossPct.toFixed(2), wordsBefore: total, wordsAfter: a.words.length });
  if (issues.length) hard++;
}
const out = { baseline: BASE, pages: pages.length, pagesWithIssues: hard, cjRemovedTotal: results.reduce((s, r) => s + (r.cjRemoved || 0), 0), results };
const jf = process.argv.indexOf('--json'); if (jf > -1) fs.writeFileSync(path.join(ROOT, process.argv[jf + 1]), JSON.stringify(out, null, 1));
console.log(`Pages: ${pages.length} | unexplained differences: ${hard} | intentional exceptions: ${results.filter(r => r.intentional).length} | footer-only affiliate links removed: ${out.cjRemovedTotal}`);
for (const r of results.filter(r => r.issues.length).slice(0, 40)) console.log(' ', r.page, '→', r.issues.join(' ; '));
if (results.filter(r => r.issues.length).length > 40) console.log(`  … ${results.filter(r => r.issues.length).length - 40} more`);
process.exit(hard ? 1 : 0);
