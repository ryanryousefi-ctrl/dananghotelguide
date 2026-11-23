#!/usr/bin/env node
// Deterministic consistency checks between the verified facts dataset and the published pages.
// It cannot establish truth; it flags (1) claims our research contradicted, reappearing anywhere, (2) affiliate-label/name mismatches,
// (3) tool data drifting from data/hotels/facts.json, (4) low-confidence facts shown as definite, (5) stale research.
// node scripts/revenue3/fact-consistency.js   -> writes docs/revenue/fact-consistency.json, exit 1 on errors
'use strict';
const fs = require('fs'), path = require('path'); const ROOT = path.resolve(__dirname, '..', '..');
const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')); const red = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !red.has(f) && f !== 'site-preview.html').concat(fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f));
const F = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hotels/facts.json'), 'utf8')).hotels;
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/registry.json'), 'utf8')).entries;
const errors = [], warnings = [];
// (1) contradicted claims: [hotel pattern, claim pattern, why]. Checked within one sentence of visible text or attribute text.
const BANNED = [
  [/Brilliant/i, /rooftop (infinity )?pool/i, 'Brilliant: no rooftop pool in any source (indoor pool + rooftop bar)'],
  [/Hilton(?! Garden)/i, /rooftop (infinity )?pool/i, 'Hilton: pool is outdoor; rooftop location not supported'],
  [/Novotel/i, /rooftop (infinity )?pool/i, 'Novotel Han River: pool on the podium, not the roof'],
  [/Grand Mercure/i, /rooftop (infinity )?pool/i, 'Grand Mercure: ground-level pool'],
  [/Wyndham/i, /rooftop (infinity )?pool/i, 'Wyndham Soleil: 4th-floor pools, not rooftop'],
  [/Sheraton Grand/i, /\b785\b/, 'Sheraton Grand: 258 rooms per sources'],
  [/Sheraton Grand/i, /\bon My Khe\b|My Khe Beach resort|on the My Khe/i, 'Sheraton Grand: Truong Sa coast, not My Khe'],
  [/Hyatt/i, /\b(six|6) pools\b|lazy river/i, 'Hyatt Regency: 5 outdoor pools, no lazy river found'],
  [/InterContinental/i, /\b(four|4) infinity pools\b|no kids'? ?club/i, 'InterContinental: 3 resort pools; Planet Trekkers kids club exists'],
  [/Radisson Blu(?! Resort Hoi An)(?! Hoi An)/i, /./, 'Da Nang property is Radisson Hotel Danang (Radisson Blu exists only in Hoi An)'],
  [/Grand Mercure/i, /\b(10|ten)[- ]min(ute)?s?( walk| on foot)[^.]{0,40}Han Market|Han Market[^.]{0,40}\b(10|ten)[- ]min(ute)?s?( walk| on foot)/i, 'Grand Mercure: about 36 min walk to Han Market'],
  [/Hilton/i, /\b8 ?km\b[^.]{0,30}airport|fastest airport/i, 'Hilton: about 11 km by road / 4.4 km straight line to the airport'],
  [/Vinpearl/i, /12-minute walk|18 minutes on foot/i, 'Meliá Vinpearl: about 19 min walk to Han Market, 24 min to Dragon Bridge'],
  [/TIA/, /\b(fully |strictly )?adults-only\b/i, 'TIA: lists a Kids Wellness Club; not adults-only'],
  [/TIA/, /all-inclusive|unlimited spa/i, 'TIA: Wellness Inclusive = breakfast + 2 treatments/night'],
  [/Premier Village/i, /Son Tra/i, 'Premier Village: southern My Khe (Bac My An), not Son Tra'],
  [/Marriott/i, /\b200 villas\b|opened in 2020/i, 'Danang Marriott: 239 rooms, opened 2022'],
  [/Meli[aá] Da ?Nang( Beach)?/i, /\b109 rooms\b|adults-only pool/i, 'Meliá Danang: 400+ rooms; no adults-only pool found'],
  [/A La Carte|Four Points|TMS|Wyndham|Muong Thanh/i, /directly on the sand|direct beachfront|no road to cross/i, 'across the road from the beach per sources'],
];
const text = h => h.replace(/",\s*"/g, '" . "').replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*\b(alt|title|content|aria-label)="([^"]*)"[^>]*>/g, ' $2 . ').replace(/<\/(p|li|h[1-6]|div|td|th|dd|dt|figcaption|summary|section|article|header|footer|span|a|strong|b|em)>/gi, ' . ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ');
for (const p of pages) {
  const t = text(fs.readFileSync(path.join(ROOT, p), 'utf8')); const sents = t.split(/(?<=[.!?])\s+/);
  for (const [hp, cp, why] of BANNED) for (const s of sents) {
    if (/\?["\s.]*$/.test(s)) continue; // questions (FAQ headings) are not claims
    const hm = [...s.matchAll(new RegExp(hp.source, 'gi'))], cm = [...s.matchAll(new RegExp(cp.source, 'gi'))]; if (!hm.length || !cm.length) continue;
    const near = hm.some(a => cm.some(b => Math.abs(a.index - b.index) <= 120)); if (!near && cp.source !== '.') continue;
    if (/\b(not|no|isn't|never|without|formerly|we found no|could not confirm|did not find|off the peninsula|alternatives? off|Kids Wellness Club|few truly)\b/i.test(s)) continue; // negated or corrective sentences
    errors.push({ check: 'contradicted-claim', page: p, why, text: s.slice(0, 220) }); }
}
// (2) affiliate label consistency: data-hotel on links to a reviewed hotel's registry key must not name another property
const byKey = Object.fromEntries(Object.values(F).map(h => [h.tripcom_key, h]));
const WRONG_LABEL = /Radisson Blu|Non Nuoc Beach Villas|^Beach Hotel$|^City Hotel$|Fusion Maia/i;
for (const p of pages) { const h = fs.readFileSync(path.join(ROOT, p), 'utf8');
  for (const m of h.matchAll(/<a [^>]*>/g)) { const k = (m[0].match(/data-tc-key="([^"]*)"/) || [])[1], n = (m[0].match(/data-hotel="([^"]*)"/) || [])[1]; if (k && byKey[k] && n && WRONG_LABEL.test(n)) errors.push({ check: 'affiliate-label', page: p, why: `link to ${byKey[k].official_name || byKey[k].name} labelled "${n}"` }); } }
for (const h of Object.values(F)) { const e = reg.find(r => r.key === h.tripcom_key); if (!e || e.status !== 'VERIFIED') errors.push({ check: 'registry', why: h.slug + ' registry key not VERIFIED' }); }
// (3) tool data vs dataset
const cmp = fs.readFileSync(path.join(ROOT, 'compare-hotels.html'), 'utf8'); const cj = JSON.parse((cmp.match(/<script type="application\/json" id="dnc-data">([\s\S]*?)<\/script>/) || [, '{"hotels":[]}'])[1]).hotels;
for (const x of cj) { const f = F[x.id]; if (!f) { errors.push({ check: 'tool-drift', why: 'compare tool lists unknown hotel ' + x.id }); continue; } if (JSON.stringify(x.d) !== JSON.stringify(f.display) || x.area !== f.area_label) errors.push({ check: 'tool-drift', why: 'compare-hotels.html out of date for ' + x.id + ' (re-run build-compare.js)' }); }
const fy = fs.readFileSync(path.join(ROOT, 'find-your-hotel.html'), 'utf8'); for (const h of Object.values(F)) if (h.official_name && !fy.includes(JSON.stringify(h.official_name).slice(1, -1))) warnings.push({ check: 'tool-drift', why: 'finder does not use the verified name for ' + h.slug });
// (4) low confidence shown as definite, (5) stale research
for (const h of Object.values(F)) { const d = h.display || {}; if (d.confidence === 'low') for (const k of ['beach', 'lounge', 'kids_club', 'rooms']) if (d[k] && d[k] !== 'Not verified' && !/listings|not verified/i.test(d[k])) warnings.push({ check: 'low-confidence', why: `${h.slug}.${k} shown as "${d[k]}" from low-confidence research` });
  const age = (Date.now() - new Date(d.checked || '2000-01-01')) / 864e5; if (age > 180) warnings.push({ check: 'stale', why: `${h.slug} research checked ${d.checked} (${Math.round(age)} days ago): re-verify` }); }
fs.writeFileSync(path.join(ROOT, 'docs/revenue/fact-consistency.json'), JSON.stringify({ run: new Date().toISOString(), pages: pages.length, errors, warnings }, null, 1));
console.log(`fact consistency: ${pages.length} pages, ${errors.length} errors, ${warnings.length} warnings`); for (const e of errors.slice(0, 25)) console.log(' ERROR', e.check, e.page || '', '-', e.why, e.text ? '| ' + e.text.slice(0, 140) : '');
for (const w of warnings.slice(0, 10)) console.log(' warn', w.why);
process.exit(errors.length ? 1 : 0);
