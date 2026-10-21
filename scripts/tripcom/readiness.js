#!/usr/bin/env node
// Cutover readiness report: every gate, with who must supply the evidence. Writes
// docs/tripcom-migration/CUTOVER-READINESS.md and prints a summary.
//   node scripts/tripcom/readiness.js [--require-ready]    (exit 1 if any gate is open)
// Nothing here proves Trip.com tracking. Gate 4 (pilot) is the only evidence of attribution.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { ROOT, loadRegistry, loadProfile, profileProblems, affiliateUrlProblems, sha256, loadPilot } = require('./lib');
const rd = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tripcom', f), 'utf8'));
const reg = loadRegistry(), profile = loadProfile(), pilot = loadPilot();
const acct = rd('account-readiness.json'), ev = rd('pilot-evidence.json');
const run = (script, ...a) => cp.spawnSync('node', [path.join(__dirname, script), ...a], { encoding: 'utf8', env: process.env });
const gates = [];
const gate = (id, who, title, ok, detail) => gates.push({ id, who, title, ok, detail });

// 1 Account
const chk = Object.entries(acct.checks); const done = chk.filter(([, v]) => v.confirmed);
gate('1', 'Owner', 'Affiliate account readiness (attested)', done.length === chk.length, `${done.length}/${chk.length} confirmed. Open: ${chk.filter(([, v]) => !v.confirmed).map(([k]) => k).join(', ') || 'none'}`);

// 2 Links
const used = reg.entries.filter(e => e.decision !== 'remove' && e.link_count > 0 && e.tripcom_destination);
const dests = [...new Set(used.map(e => e.tripcom_destination))];
const withLink = used.filter(e => e.affiliate_url), problems = withLink.filter(e => affiliateUrlProblems(e.affiliate_url, profile).length || e.affiliate_url_sha256 !== sha256(e.affiliate_url));
const confirmed = withLink.filter(e => e.verification && e.verification.opens_correct_property === 'yes');
gate('2a', 'Owner', 'Official links generated in the dashboard and imported', withLink.length === used.length, `${withLink.length}/${used.length} registry entries (${dests.length} unique destinations) have a link; ${problems.length} fail checks`);
gate('2b', 'Owner', 'Every link opened by hand and confirmed to show the right property', confirmed.length === used.length, `${confirmed.length}/${used.length} confirmed`);
gate('2c', 'Owner + support', 'Link-format profile derived, reviewed and approved; regional domain decided', profileProblems(profile).length === 0, profileProblems(profile).join(' | ') || `approved; hosts ${profile.hosts.join(', ')}`);

// 3 Technical (ours)
const dry = run('apply.js');
gate('3a', 'Engineering', 'apply.js dry run reports 0 blockers (needs real links)', dry.status === 0, (dry.stdout.match(/Blocked: .*/) || ['(n/a)'])[0]);
const st = run('selftest.js'); gate('3b', 'Engineering', 'Pipeline self-test (synthetic fixtures: accepts good, rejects 15 kinds of bad)', st.status === 0, (st.stdout.match(/\d+\/\d+ passed/) || ['failed'])[0]);
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'tc-ready-'));
const pv = run('apply.js', '--preview', path.join(tmp, 'site')); const pvv = run('validate.js', '--dir', path.join(tmp, 'site'), '--preview');
gate('3c', 'Engineering', 'All served pages convert in a plain-URL preview (no affiliate tracking) and validate', pv.status === 0 && pvv.status === 0, (pvv.stdout.match(/Pages: .*/) || [''])[0] + ' | ' + (pvv.stdout.match(/Failures: .*/) || [''])[0].slice(0, 80));

// 4 Pilot
const bk = ev.booking_report_rows.filter(r => r.genuine_customer), cm = ev.commission_report_rows.filter(r => r.matches_booking_row);
gate('4a', 'Trip.com Booking report', 'Pilot: a genuine customer booking from a pilot-page link appears in the Booking report (T+1)', bk.length > 0, `${bk.length} genuine booking row(s) recorded; GA4 clicks on pilot pages: ${ev.ga4_affiliate_clicks_on_pilot_pages == null ? 'not recorded' : ev.ga4_affiliate_clicks_on_pilot_pages}`);
gate('4b', 'Trip.com Commission report', 'Pilot: that stay is checked out and appears as eligible commission (5th of the following month)', cm.length > 0, `${cm.length} matching commission row(s) recorded`);

const open = gates.filter(g => !g.ok);
const md = `# Trip.com cutover readiness

Generated ${new Date().toISOString().slice(0, 10)} by \`node scripts/tripcom/readiness.js\`. **Not a guarantee of payment.** Links that pass technical checks can still fail to attribute; only gates 4a/4b are evidence of attribution.

| Gate | Evidence from | Status | Detail |
|---|---|---|---|
${gates.map(g => `| ${g.id} ${g.title} | ${g.who} | ${g.ok ? 'PASS' : 'OPEN'} | ${g.detail} |`).join('\n')}

**Open gates: ${open.length} of ${gates.length}.** Cutover requires explicit owner approval even when all gates pass.
${pilot ? `\nPilot pages (${pilot.pages.length}): ${pilot.pages.join(', ')}\n` : ''}`;
fs.writeFileSync(path.join(ROOT, 'docs/tripcom-migration/CUTOVER-READINESS.md'), md);
for (const g of gates) console.log(`${g.ok ? 'PASS' : 'OPEN'}  ${g.id.padEnd(3)} ${g.title}  — ${g.detail}`);
console.log(`\n${open.length} of ${gates.length} gates open. Written to docs/tripcom-migration/CUTOVER-READINESS.md`);
if (process.argv.includes('--require-ready') && open.length) process.exit(1);
