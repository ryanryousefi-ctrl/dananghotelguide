#!/usr/bin/env node
// Proof against origin/main (or a given ref): no Trip.com href lost or altered on any changed page; every new Trip.com href is an exact registry affiliate_url.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..'); const ref = process.argv[2] || 'origin/main';
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom/registry.json'), 'utf8')).entries; const ok = new Set(reg.map(e => e.affiliate_url).filter(Boolean));
const unesc = s => s.replace(/&amp;/g, '&');
const hrefs = h => [...h.matchAll(/<a\b[^>]*\bhref="(https:\/\/www\.trip\.com\/[^"]*)"/g)].map(m => unesc(m[1]));
const files = cp.execSync(`git diff --name-only ${ref} -- "*.html"; git ls-files --others --exclude-standard -- "*.html"`, { cwd: ROOT }).toString().split('\n').filter(f => f && !f.includes('/'));
let lost = 0, added = 0, bad = 0, changedPages = 0; const detail = [];
for (const f of files) {
  let old = ''; try { old = cp.execSync(`git show ${ref}:${f}`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 }).toString(); } catch (e) {}
  const n = fs.readFileSync(path.join(ROOT, f), 'utf8'); const a = hrefs(old), b = hrefs(n); const bc = {}; b.forEach(x => bc[x] = (bc[x] || 0) + 1); const ac = {}; a.forEach(x => ac[x] = (ac[x] || 0) + 1);
  for (const x of Object.keys(ac)) if ((bc[x] || 0) < ac[x]) { lost += ac[x] - (bc[x] || 0); detail.push('LOST ' + f + ' ' + x); }
  for (const x of Object.keys(bc)) { const d = bc[x] - (ac[x] || 0); if (d > 0) { added += d; if (!ok.has(x)) { bad++; detail.push('NOT-IN-REGISTRY ' + f + ' ' + x); } } }
  changedPages++;
}
console.log(JSON.stringify({ ref, changedPages, existingHrefsLostOrAltered: lost, newHrefAnchorsAdded: added, newAnchorsNotInRegistry: bad }), detail.slice(0, 5).join('\n'));
process.exit(lost || bad ? 1 : 0);
