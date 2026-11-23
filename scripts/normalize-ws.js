#!/usr/bin/env node
// Last pipeline step: collapse blank lines around generated marker blocks so repeated runs are byte-stable.
'use strict';
const fs = require('fs'), path = require('path'); const ROOT = path.resolve(__dirname, '..'); let n = 0;
for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) { const p = path.join(ROOT, f); const o = fs.readFileSync(p, 'utf8');
  const h = o.replace(/\n{2,}(?=<!--\/?dn-(c3|c4|revenue)[:a-z0-9-]*-->)/g, '\n').replace(/(<!--\/dn-(?:c3|c4|revenue)[:a-z0-9-]*-->)\n{2,}/g, '$1\n');
  if (h !== o) { fs.writeFileSync(p, h); n++; } }
console.log('whitespace normalized:', n, 'files');
