#!/usr/bin/env node
// Names on affiliate links must name the property the verified registry link opens. Text/attribute labels only; never touches href or data-tc-key.
'use strict';
const fs = require('fs'), path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const F = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/facts.json'), 'utf8')).hotels; const byKey = Object.fromEntries(Object.values(F).map(h => [h.tripcom_key, h]));
const WRONG = /Radisson Blu Resort Da ?Nang|Radisson Blu Da ?Nang|Radisson Blu|Da ?Nang Marriott Resort (?:&amp;|&|and) Spa,? Non Nuoc Beach Villas|^Beach Hotel$|^City Hotel$|Fusion Maia(?: Resort)?(?: Da ?Nang)?/i;
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).concat(fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f));
let n = 0, pages = 0;
for (const f of files) {
  const p = path.join(ROOT, f); const o = fs.readFileSync(p, 'utf8');
  let h = o.replace(/<a [^>]*data-tc-key="([^"]*)"[^>]*>[\s\S]*?<\/a>/g, (a, key) => {
    const hx = byKey[key]; if (!hx) return a; const good = hx.official_name || hx.name; const dh = (a.match(/data-hotel="([^"]*)"/) || [])[1];
    let b = a;
    if (dh && WRONG.test(dh)) b = b.replace(/data-hotel="[^"]*"/, `data-hotel="${good.replace(/&/g, '&amp;')}"`);
    if (/radisson/.test(key)) b = b.replace(/Radisson Blu Resort Da ?Nang|Radisson Blu Da ?Nang/g, 'Radisson Hotel Danang').replace(/Radisson Blu/g, 'Radisson');
    if (/marriott-resort-spa-non-nuoc-beach-villas"/.test('"' + key + '"') && !/~villas/.test(key)) b = b.replace(/Da ?Nang Marriott Resort (&amp;|&|and) Spa,? Non Nuoc Beach Villas/g, 'Danang Marriott Resort $1 Spa');
    if (/tia-wellness/.test(key)) b = b.replace(/data-hotel="Fusion Maia[^"]*"/, 'data-hotel="TIA Wellness Resort"');
    if (b !== a) n++; return b; });
  // data-name / map JS names for Radisson
  h = h.replace(/(data-name="|n:\s*')Radisson Blu(?: Resort)?(?: Da ?Nang)?/g, '$1Radisson Hotel Danang');
  if (h !== o) { fs.writeFileSync(p, h); pages++; }
}
console.log(`labels normalized: ${n} links on ${pages} pages`);
