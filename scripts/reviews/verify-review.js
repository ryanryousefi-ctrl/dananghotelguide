#!/usr/bin/env node
// Verifies a rendered review against its Markdown source, block by block: same order, same text, same bold spans, same heading levels.
//   node scripts/reviews/verify-review.js data/reviews/intercontinental-da-nang.md intercontinental-da-nang.html
'use strict';
const fs = require('fs'), path = require('path'), cheerio = require('cheerio');
const [mdFile, htmlFile] = process.argv.slice(2); const ROOT = path.resolve(__dirname, '..', '..');
const md = fs.readFileSync(path.join(ROOT, mdFile), 'utf8').split(/\r?\n/).filter(l => l.trim());
const expect = md.map(l => { const h = l.match(/^(#{1,3}) (.*)$/); if (h) return { tag: 'h' + h[1].length, text: h[2] }; if (/^- /.test(l)) return { tag: 'li', text: l.slice(2) }; return { tag: 'p', text: l }; })
  .map(b => ({ tag: b.tag, text: b.text.replace(/\*\*/g, ''), bold: [...b.text.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1]) }));
const $ = cheerio.load(fs.readFileSync(path.join(ROOT, htmlFile), 'utf8'));
const scope = $('main').first(); const got = [];
scope.find('.rv-hero h1, .rv-hero .rv-byline, .rv-hero .rv-score__lbl, .rv-article h2, .rv-article h3, .rv-article p, .rv-article li').each((i, el) => {
  if ($(el).closest('.dn-adband').length) return; // the Trip.com banner's own label text is not article copy
  const tag = el.name === 'span' ? 'p' : el.name; got.push({ tag, text: $(el).text(), bold: $(el).find('strong').map((j, s) => $(s).text()).get() });
});
let bad = 0; const n = Math.max(expect.length, got.length);
for (let i = 0; i < n; i++) { const e = expect[i], g = got[i];
  if (!e || !g || e.tag !== g.tag || e.text !== g.text || JSON.stringify(e.bold) !== JSON.stringify(g.bold)) { bad++; if (bad <= 5) console.log('MISMATCH at block', i + 1, '\n  expected:', JSON.stringify(e), '\n  rendered:', JSON.stringify(g)); } }
const words = s => s.split(/\s+/).filter(Boolean).length;
console.log(`${expect.length} source blocks, ${got.length} rendered blocks, ${words(expect.map(b => b.text).join(' '))} source words, ${words(got.map(b => b.text).join(' '))} rendered words: ${bad ? bad + ' mismatches' : 'IDENTICAL (text, order, headings, bold)'}`);
process.exit(bad ? 1 : 0);
