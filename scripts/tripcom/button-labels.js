#!/usr/bin/env node
// Visible-label tidy-up for Trip.com booking BUTTONS (a.tc-btn). The button now draws "Trip.com |" itself (tripcom-cta.css), so labels that
// repeat the name ("Search Stays on Trip.com", "Trip.com에서 가격 보기") lose the repeat: "Trip.com | Search Stays", "Trip.com | 가격 보기".
//   node scripts/tripcom/button-labels.js [--check]
// Only text inside button anchors changes. hrefs, attributes, aria-labels and every other byte are untouched; text links (.tc-link) are not buttons and stay as written.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')); const red = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
const pages = [...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')), ...fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f)].filter(f => !red.has(f) && !['site-preview.html', 'favicon-html-snippet.html'].includes(f)).sort();
const A = /(<a\b[^>]*\bdata-provider="tripcom"[^>]*>)([\s\S]*?)(<\/a>)/g;
const tidy = t => t
  .replace(/\s+on\s+Trip\.com/gi, '')                 // "Search Stays on Trip.com" -> "Search Stays"
  .replace(/Trip\.com에서\s*/g, '')                    // Korean "Trip.com에서 가격 보기" -> "가격 보기"
  .replace(/\b(Search|Browse|Compare)\s+Trip\.com\b/gi, '$1 Hotels')   // "Search Trip.com" -> "Search Hotels"
  .replace(/\s{2,}/g, ' ');
let changed = 0, buttons = 0; const left = {}, samples = {};
for (const p of pages) {
  const f = path.join(ROOT, p); const src = fs.readFileSync(f, 'utf8');
  const out = src.replace(A, (m, open, inner, close) => {
    if (!/\bclass="[^"]*\btc-btn\b/.test(open)) return m;
    buttons++;
    const ni = inner.replace(/(^|>)([^<]+)/g, (mm, lead, text) => lead + tidy(text));
    if (/Trip\.com/i.test(ni.replace(/<[^>]+>/g, ' '))) left[p] = (left[p] || 0) + 1;
    if (ni !== inner) { changed++; const k = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 44); if (Object.keys(samples).length < 14) samples[k] = ni.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40); }
    const o2 = open.replace(/aria-label="Search Trip\.com,/, 'aria-label="Search Hotels on Trip.com,');   // keeps the accessible name containing the visible label
    return o2 + ni + close;
  });
  if (out !== src && !process.argv.includes('--check')) fs.writeFileSync(f, out);
}
console.log(`button anchors: ${buttons}, labels tidied: ${changed}, buttons still naming Trip.com in the label: ${Object.values(left).reduce((a, b) => a + b, 0)}`);
console.log(Object.entries(samples).map(([a, b]) => `  "${a}" -> "${b}"`).join('\n'));
