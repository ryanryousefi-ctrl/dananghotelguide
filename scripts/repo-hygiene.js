#!/usr/bin/env node
// Repository hygiene guard. node scripts/repo-hygiene.js [--staged]
//  - no tracked (or staged) path inside node_modules, no tracked symlinks, .gitignore ignores node_modules (dir AND symlink form)
//  - package-lock.json present and tracked; .vercelignore keeps the allowlist (/*) so docs, data, scripts and screenshots never ship
//  - no single tracked/staged file over 6 MB (screenshots and browser artifacts belong outside the repo)
'use strict';
const cp = require('child_process'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'); const STAGED = process.argv.includes('--staged'); const bad = []; const LEGACY_BIG = new Set(['dananghotelguide-seo-fixed.zip', 'dananghotelguide-seo-round3.zip']); // pre-existing archives, excluded from the deploy by .vercelignore
const sh = c => cp.execSync(c, { cwd: ROOT, maxBuffer: 1 << 28 }).toString();
const entries = STAGED ? sh('git diff --cached --name-status --no-renames').split('\n').filter(Boolean).map(l => l.split('\t')).filter(a => a[0] !== 'D').map(a => a[1]) : sh('git ls-files').split('\n').filter(Boolean);
const modes = Object.fromEntries((STAGED ? sh('git ls-files -s').split('\n') : sh('git ls-files -s').split('\n')).filter(Boolean).map(l => { const m = l.match(/^(\d+) \S+ \d\t(.*)$/); return [m[2], m[1]]; }));
for (const f of entries) {
  if (/(^|\/)node_modules(\/|$)/.test(f)) bad.push('dependency directory tracked/staged: ' + f);
  if (modes[f] === '120000') bad.push('symlink tracked/staged: ' + f);
  try { const st = fs.lstatSync(path.join(ROOT, f)); if (st.isSymbolicLink()) bad.push('symlink in tree: ' + f); else if (st.size > 6 * 1024 * 1024 && !LEGACY_BIG.has(f)) bad.push(`file over 6 MB (${(st.size / 1048576).toFixed(1)} MB): ${f}`); } catch (e) { /* deleted */ }
}
const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').split('\n').map(s => s.trim());
if (!gi.includes('node_modules') || !gi.includes('node_modules/')) bad.push('.gitignore must contain both "node_modules" and "node_modules/"');
if (!fs.existsSync(path.join(ROOT, 'package-lock.json')) || !sh('git ls-files package-lock.json').trim()) bad.push('package-lock.json missing or untracked');
if (!/^\/\*\s*$/m.test(fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8'))) bad.push('.vercelignore lost its "/*" allowlist rule');
try { if (fs.lstatSync(path.join(ROOT, 'node_modules')).isSymbolicLink()) console.log('note: node_modules here is a symlink (ignored by git, never commit it)'); } catch (e) { /* none */ }
console.log(bad.length ? 'HYGIENE FAILED:\n - ' + bad.join('\n - ') : `repo hygiene OK (${entries.length} ${STAGED ? 'staged' : 'tracked'} files checked)`); process.exit(bad.length ? 1 : 0);
