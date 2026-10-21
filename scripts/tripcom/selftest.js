#!/usr/bin/env node
// Self-test of the migration machinery with SYNTHETIC fixtures in a temporary copy (TRIPCOM_ROOT).
// The fixture "affiliate links" use a path named SELFTEST-FIXTURE and exist only in that temp copy:
// they are never written to this repository and are not valid Trip.com links. The test proves the
// pipeline's accept/reject logic; it proves nothing about Trip.com tracking.
//   node scripts/tripcom/selftest.js
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const REPO = path.resolve(__dirname, '..', '..');
const crypto = require('crypto');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const results = []; const t = (n, ok, d = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };

function fixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-selftest-'));
  // Pages come from commit a882153, the last production state with the Booking.com/CJ originals (main itself is converted now).
  const cpf = f => { const d = path.join(tmp, f); fs.mkdirSync(path.dirname(d), { recursive: true }); if (/\.html$/.test(f)) fs.writeFileSync(d, cp.execFileSync('git', ['show', 'a882153:' + f], { cwd: REPO, maxBuffer: 1 << 26 })); else fs.copyFileSync(path.join(REPO, f), d); };
  const pilot = JSON.parse(fs.readFileSync(path.join(REPO, 'data/tripcom/pilot.json'), 'utf8'));
  ['vercel.json', 'tripcom-cta.js', 'tripcom-cta.css', 'tripcom-widget.js', 'data/tripcom/decisions.json', 'data/tripcom/pilot.json', 'best-hotels-in-da-nang.html', 'privacy.html', ...pilot.pages].forEach(cpf);
  const reg = JSON.parse(fs.readFileSync(path.join(REPO, 'data/tripcom/registry.json'), 'utf8'));
  for (const e of reg.entries) {
    if (!e.tripcom_id || e.decision === 'remove') continue;
    const url = `https://www.trip.com/SELFTEST-FIXTURE/${e.tripcom_id}?Allianceid=11013066&SID=333523744&token=${e.tripcom_id}`;
    Object.assign(e, { affiliate_url: url, affiliate_url_original: url, affiliate_url_sha256: sha(url), affiliate_url_source: 'Trip.com Partners dashboard link generator (SELFTEST FIXTURE)', generated_at: '2000-01-01', verification: { opens_correct_property: 'yes' } });
  }
  fs.writeFileSync(path.join(tmp, 'data/tripcom/registry.json'), JSON.stringify(reg));
  fs.writeFileSync(path.join(tmp, 'data/tripcom/link-format-profile.json'), JSON.stringify({ approved: true, hosts: ['www.trip.com'], path_shapes: ['/SELFTEST-FIXTURE/\\d+'], params_allowed: ['Allianceid', 'SID', 'token'], params_required: ['Allianceid', 'SID', 'token'], identity: { evidence: 'params' }, accept_dated: false, domain_decision: 'fixture' }));
  return tmp;
}
const run = (tmp, script, ...a) => cp.spawnSync('node', [path.join(REPO, 'scripts/tripcom', script), ...a], { env: { ...process.env, TRIPCOM_ROOT: tmp }, encoding: 'utf8' });
const pilotPage = tmp => path.join(tmp, JSON.parse(fs.readFileSync(path.join(tmp, 'data/tripcom/pilot.json'), 'utf8')).pages[0]);
const fails = r => (r.stdout.match(/FAIL \[([a-z-]+)\]/g) || []).map(x => x.slice(6, -1));

// 1. Happy path
let tmp = fixture();
let r = run(tmp, 'apply.js', '--pilot'); t('Pilot dry run: no blockers with approved fixture links', r.status === 0, (r.stdout.match(/Blocked: .*/) || [''])[0]);
r = run(tmp, 'apply.js', '--pilot', '--write'); t('Pilot write succeeds', r.status === 0, r.stderr.slice(0, 120));
r = run(tmp, 'validate.js', '--pilot'); t('Pilot validation passes (pilot pages Trip.com, other pages untouched CJ)', r.status === 0, r.stdout.split('\n').find(l => /Failures/.test(l)) || '');
const other = fs.readFileSync(path.join(tmp, 'best-hotels-in-da-nang.html'), 'utf8'); t('Non-pilot page left 100% CJ', /kqzyfj/.test(other) && !/data-provider="tripcom"/.test(other));
const pp = fs.readFileSync(pilotPage(tmp), 'utf8'); t('Pilot page has no CJ/Booking leftovers and uses exact registry hrefs', !/kqzyfj|booking-cta-tracking|yceml/.test(pp) && /data-provider="tripcom"/.test(pp));
const good = pp;

// 2. Tampering must be caught
const tamper = (name, fn, expect) => { const d = fixture(); run(d, 'apply.js', '--pilot', '--write'); const f = pilotPage(d); fs.writeFileSync(f, fn(fs.readFileSync(f, 'utf8'))); const v = run(d, 'validate.js', '--pilot'); t(`Rejects: ${name}`, v.status === 1 && expect.some(x => fails(v).includes(x)), `got ${[...new Set(fails(v))].join(',') || 'none'}`); };
tamper('edited tracking parameter', h => h.replace('token=', 'tok=').replace(/&token=(\d+)/, '&token=$1&extra=1'), ['wrong-match', 'modified-link']);
tamper('wrong account (Allianceid)', h => h.replace('Allianceid=11013066', 'Allianceid=1'), ['wrong-match', 'modified-link']);
tamper('wrong site (SID)', h => h.replace('SID=333523744', 'SID=1'), ['wrong-match', 'modified-link']);
tamper('hotel link pointing at another property', h => h.replace(/SELFTEST-FIXTURE\/(\d+)\?Allianceid=11013066&amp;SID=333523744&amp;token=\1/, 'SELFTEST-FIXTURE/999?Allianceid=11013066&amp;SID=333523744&amp;token=999'), ['wrong-match', 'modified-link']);
tamper('Booking.com/CJ leftover', h => h.replace('</body>', '<a href="https://www.kqzyfj.com/click-101820678-17293132?sid=x&url=https%3A%2F%2Fwww.booking.com%2F">b</a></body>'), ['booking-leftover']);
tamper('missing booking-button destination', h => h.replace(/(<a [^>]*data-provider="tripcom"[^>]*) href="[^"]*"/, '$1 href="#"'), ['missing-destination', 'wrong-match']);
tamper('unapproved redirect link', h => h.replace('</body>', '<a class="dn-btn" href="https://bit.ly/abc">x</a></body>'), ['unapproved-redirect']);
tamper('unregistered Trip.com URL', h => h.replace('</body>', '<a href="https://www.trip.com/hotels/detail/?hotelId=1">x</a></body>'), ['unregistered-url']);
tamper('missing affiliate disclosure', h => h.replace(/affiliate/gi, 'partner').replace(/commission/gi, 'fee'), ['disclosure']);
tamper('link without rel=sponsored', h => h.replace(/rel="nofollow noopener sponsored"/g, 'rel="noopener"'), ['rel']);

// 3. Provenance / profile gates
let d = fixture(); const regp = path.join(d, 'data/tripcom/registry.json'); let g = JSON.parse(fs.readFileSync(regp, 'utf8'));
g.entries.find(e => e.key === 'hotel:hyatt-regency-danang-resort-and-spa').affiliate_url_sha256 = 'deadbeef'; fs.writeFileSync(regp, JSON.stringify(g));
r = run(d, 'apply.js', '--pilot'); t('Blocks a link whose SHA-256 no longer matches (modified after import)', r.status === 2 && /SHA-256/.test(r.stdout));
d = fixture(); g = JSON.parse(fs.readFileSync(path.join(d, 'data/tripcom/registry.json'), 'utf8')); g.entries.forEach(e => { if (e.verification) e.verification.opens_correct_property = 'unconfirmed'; }); fs.writeFileSync(path.join(d, 'data/tripcom/registry.json'), JSON.stringify(g));
r = run(d, 'apply.js', '--pilot'); t('Blocks links the owner has not confirmed open the right property', r.status === 2 && /not confirmed/.test(r.stdout));
d = fixture(); fs.unlinkSync(path.join(d, 'data/tripcom/link-format-profile.json')); r = run(d, 'apply.js', '--pilot'); t('Blocks everything until a link-format profile exists and is approved', r.status === 2 && /profile/.test(r.stdout));
d = fixture(); const pf = path.join(d, 'data/tripcom/link-format-profile.json'); const prof = JSON.parse(fs.readFileSync(pf, 'utf8')); prof.hosts = ['vn.trip.com']; prof.domain_decision = ''; fs.writeFileSync(pf, JSON.stringify(prof)); r = run(d, 'apply.js', '--pilot'); t('Flags a non-www host until the regional-domain decision is recorded', r.status === 2 && /host/.test(r.stdout));

// 4. Real generator output (two links the owner generated in the dashboard on 2026-10-21): format checks only
const lib = require('./lib');
const HY = 'https://www.trip.com/hotels/da-nang-hotel-detail-713826/hyatt-regency-danang-resort-and-spa/?Allianceid=11013066&SID=333523744&trip_sub1=&trip_sub3=D20397190';
const CT = 'https://www.trip.com/hotels/da-nang-hotels-list-1356/?Allianceid=11013066&SID=333523744&trip_sub1=&trip_sub3=D20397190';
const realProfile = { approved: true, hosts: ['www.trip.com'], path_shapes: ['/hotels/[a-z0-9-]+-hotel-detail-\\d+/[a-z0-9-]+/', '/hotels/[a-z0-9-]+-hotels-list-\\d+/'], params_allowed: ['Allianceid', 'SID', 'trip_sub1', 'trip_sub3'], params_required: ['Allianceid', 'SID', 'trip_sub1', 'trip_sub3'], identity: { evidence: 'params' }, accept_dated: false };
t('Real generated hotel link passes the learned format', lib.affiliateUrlProblems(HY, realProfile).length === 0, lib.affiliateUrlProblems(HY, realProfile).join('; '));
t('Real generated city link passes the learned format', lib.affiliateUrlProblems(CT, realProfile).length === 0, lib.affiliateUrlProblems(CT, realProfile).join('; '));
t('Destination ID is read from the generated path (713826 hotel, 1356 city)', JSON.stringify([lib.destinationFromUrl(HY), lib.destinationFromUrl(CT)]) === JSON.stringify([{ type: 'hotel', id: '713826' }, { type: 'city', id: '1356' }]));
const HQ = 'https://www.trip.com/hotels/detail/?hotelId=713826&Allianceid=11013066&SID=333523744&trip_sub1=&trip_sub3=D20397442';
t('Query-style generated link: destination ID read from hotelId', JSON.stringify(lib.destinationFromUrl(HQ)) === JSON.stringify({ type: 'hotel', id: '713826' }));
t('Two URLs pasted into one generation (corrupt output) is rejected', lib.affiliateUrlProblems('https://www.trip.com/hotels/detail/?hotelId=999113 https://www.trip.com/hotels/detail/?hotelId=1571261&Allianceid=11013066&SID=333523744&trip_sub1=&trip_sub3=D20397463', null).some(x => /whitespace/.test(x)));
t('A hand-built look-alike with an extra parameter is rejected', lib.affiliateUrlProblems(HY + '&utm_source=x', realProfile).some(x => /not in the approved profile/.test(x)));
t('A look-alike without trip_sub3 is rejected', lib.affiliateUrlProblems(HY.replace('&trip_sub3=D20397190', ''), realProfile).some(x => /required parameter/.test(x)));
t('A dated variant is rejected', lib.affiliateUrlProblems(HY + '&checkIn=2026-12-01', realProfile).length > 0);
t('Another account\'s Alliance ID is rejected', lib.affiliateUrlProblems(HY.replace('11013066', '12345678'), realProfile).some(x => /wrong/.test(x)));
t('vn.trip.com host is rejected until the profile approves it', lib.affiliateUrlProblems(HY.replace('www.trip.com', 'vn.trip.com'), realProfile).some(x => /host/.test(x)));
const e = { affiliate_url: HY, tripcom_id: '713826', tripcom_type: 'hotel', verification: { opens_correct_property: 'id-in-url' } };
t('id-in-url confirmation accepted only when the path ID equals the registry ID', lib.destinationConfirmed(e, realProfile) && !lib.destinationConfirmed({ ...e, tripcom_id: '999' }, realProfile));

const bad = results.filter(x => !x).length; console.log(`\n${results.length - bad}/${results.length} passed`); process.exit(bad ? 1 : 0);
