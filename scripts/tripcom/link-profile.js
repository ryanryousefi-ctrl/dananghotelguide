#!/usr/bin/env node
// Learns the REAL format of Trip.com-generated affiliate links from links the owner generated in
// the Partners dashboard, so validation never relies on a guessed format.
//
//   node scripts/tripcom/link-profile.js derive   needs >= 5 imported links; writes
//                                                 data/tripcom/link-format-profile.json (approved: false)
//   node scripts/tripcom/link-profile.js check    validates every imported link against the profile
//   node scripts/tripcom/link-profile.js show     prints the profile and what still blocks approval
//
// "approved" is set by a human after comparing the profile with what the dashboard actually produced.
// Nothing here builds, edits or fetches a link.
'use strict';
const fs = require('fs');
const { PROFILE, loadProfile, profileProblems, affiliateUrlProblems, loadRegistry, ALLIANCE_ID, SITE_ID } = require('./lib');

const cmd = process.argv[2];
const reg = loadRegistry();
const links = reg.entries.filter(e => e.affiliate_url).map(e => ({ key: e.key, id: String(e.tripcom_id || ''), url: e.affiliate_url }));
const shape = p => p.split('/').map(seg => !seg ? '' : /^\d+$/.test(seg) ? '\\d+' : /^[A-Za-z0-9_-]{6,}$/.test(seg) && /\d/.test(seg) && /[A-Za-z]/.test(seg) ? '[A-Za-z0-9_-]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/');

if (cmd === 'derive') {
  const uniq = [...new Map(links.map(l => [l.url, l])).values()];
  if (uniq.length < 5) { console.error(`Need at least 5 distinct imported links to derive a profile (have ${uniq.length}). Generate them in the dashboard, paste them into data/tripcom/link-worksheet.csv, run worksheet.js import.`); process.exit(2); }
  const hosts = new Set(), shapes = new Set(), all = new Set(); let req = null; const idInUrl = []; let alliance = 0, sid = 0, dates = 0;
  for (const l of uniq) {
    const u = new URL(l.url); hosts.add(u.hostname.toLowerCase()); shapes.add(shape(u.pathname));
    const keys = [...new Set([...u.searchParams.keys()])]; keys.forEach(k => all.add(k));
    const lower = new Set(keys.map(k => k.toLowerCase())); req = req ? new Set([...req].filter(k => lower.has(k.toLowerCase()))) : new Set(keys);
    const p = {}; for (const [k, v] of u.searchParams) p[k.toLowerCase()] = v;
    if (Object.entries(p).some(([k, v]) => /alliance/.test(k) && v === ALLIANCE_ID)) alliance++;
    if (p.sid === SITE_ID) sid++;
    if (['checkin', 'checkout', 'checkindate', 'checkoutdate'].some(k => p[k])) dates++;
    const dec = decodeURIComponent(l.url);
    idInUrl.push(!!l.id && dec.includes(l.id));
  }
  const evidence = alliance === uniq.length && sid === uniq.length ? 'params' : 'none';
  const profile = {
    approved: false, derived_at: new Date().toISOString(), derived_from: uniq.map(l => l.key),
    hosts: [...hosts], path_shapes: [...shapes], params_allowed: [...all], params_required: [...req],
    identity: { evidence, note: evidence === 'params' ? 'Alliance ID and SID appear as query parameters in every sample.' : 'The account identifiers do NOT appear in the URL itself in every sample (short or token link?). The URL alone cannot prove which account it belongs to; only Trip.com\'s Booking report can.' },
    destination_verifiable_from_url: idInUrl.every(Boolean),
    accept_dated: false, dated_samples: dates, domain_decision: '',
    warnings: [],
  };
  if (!profile.destination_verifiable_from_url) profile.warnings.push('The Trip.com property/city ID is not visible inside the generated URL for every sample: the destination of each link can only be confirmed by opening it (owner step, worksheet column opens_correct_property).');
  if ([...hosts].some(h => h !== 'www.trip.com')) profile.warnings.push(`Generator host(s): ${[...hosts].join(', ')}. The registry and --destinations check use www.trip.com pages; the Vietnam program page may require vn.trip.com. Ask Trip.com support, then record the answer in "domain_decision".`);
  if (dates) profile.warnings.push(`${dates} sample(s) contain date parameters. Official FAQ says dated links are not supported yet: confirm with support how such links behave after the dates pass before setting accept_dated.`);
  fs.writeFileSync(PROFILE, JSON.stringify(profile, null, 1) + '\n');
  console.log(`Wrote ${PROFILE.replace(process.cwd() + '/', '')} from ${uniq.length} links (approved: false).`);
  console.log(JSON.stringify({ hosts: profile.hosts, path_shapes: profile.path_shapes, params_required: profile.params_required, params_allowed: profile.params_allowed, identity: profile.identity.evidence, destination_verifiable_from_url: profile.destination_verifiable_from_url, warnings: profile.warnings }, null, 1));
} else if (cmd === 'check') {
  const pf = loadProfile(); let bad = 0;
  for (const l of links) { const p = affiliateUrlProblems(l.url, pf); if (p.length) { bad++; console.log(`REJECT ${l.key}: ${p.join('; ')}`); } }
  console.log(`${links.length} imported link(s) checked, ${bad} rejected. Profile problems: ${profileProblems(pf).join(' | ') || 'none'}`);
  process.exit(bad || profileProblems(pf).length ? 1 : 0);
} else if (cmd === 'show') {
  const pf = loadProfile(); console.log(pf ? JSON.stringify(pf, null, 1) : 'No profile yet.'); console.log('Blocking:', profileProblems(pf).join(' | ') || 'nothing');
} else console.log('usage: link-profile.js derive|check|show');
