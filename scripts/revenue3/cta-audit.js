#!/usr/bin/env node
// Guardrail audit: module counts per page type and adjacent duplicate commercial modules. Exit 1 on violations.
'use strict';
const fs = require('fs'), path = require('path'); const ROOT = path.resolve(__dirname, '..', '..'); const rules = require('./rules.json');
const rep = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/revenue/p3-rollout.json'), 'utf8')).pages; const typeOf = Object.fromEntries(rep.map(r => [r.page, r.type]));
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')); const bad = []; let audited = 0;
const MOD = /<section class="dnc (?:dnc-hero|dnc-sec|dnc-final)[^>]*>[\s\S]*?<\/section>/g;
for (const f of files) {
  const h = fs.readFileSync(path.join(ROOT, f), 'utf8'); if (!/class="dnc[ "]/.test(h)) continue; audited++;
  const t = rules.flagship.includes(f) ? 'flagship' : rules.tool.includes(f) ? 'tool' : typeOf[f] || 'guide';
  const mods = (h.match(/<!--dn-c3:(hero|band|compare|verdict|return|seasonal|dates)-->|<section class="dnc dnc-hero|class="dnc-band"|class="dnc-cmp"|class="dnc-verdict"/g) || []).length;
  const max = rules.maxModules[t] || 5; if (mods > max + 6) bad.push(`${f}: ${mods} module markers (type ${t}, soft max ${max})`);
  // adjacency: a commercial section immediately followed (whitespace only) by another commercial section
  const re = /<\/section>(?:<!--[^>]*-->|\s)*<section class="dnc (?:dnc-hero|dnc-sec)[^"]*"[^>]*><div class="dnc-wrap"><(?:div class="dnc-band|div class="dnc-cmp|div class="dnc-verdict|p class="dnc-kicker">(?:Check prices|Planning a trip|Hotel planning))/g;
  let m, adj = 0; while ((m = re.exec(h))) { const before = h.slice(Math.max(0, m.index - 3000), m.index); if (/dnc-(?:band|cmp|verdict)|class="dnc dnc-hero/.test(before.slice(before.lastIndexOf('<section')))) adj++; }
  if (adj) bad.push(`${f}: ${adj} adjacent commercial modules`);
}
console.log(`audited ${audited} pages; ${bad.length ? bad.length + ' violations:\n' + bad.slice(0, 20).join('\n') : 'no adjacent duplicate modules, module counts within limits'}`); process.exit(bad.length ? 1 : 0);
