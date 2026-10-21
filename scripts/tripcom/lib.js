// Shared helpers for the Booking.com (CJ) → Trip.com migration scripts.
// Every script counts pages and links the same way through this module.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.TRIPCOM_ROOT ? path.resolve(process.env.TRIPCOM_ROOT) : path.resolve(__dirname, '..', '..');
const REGISTRY = path.join(ROOT, 'data', 'tripcom', 'registry.json');
const DECISIONS = path.join(ROOT, 'data', 'tripcom', 'decisions.json');
const ALLIANCE_ID = '11013066';
const SITE_ID = '333523744';

// The one CJ Evergreen link this site uses for Booking.com.
const CJ_RE = /https:\/\/www\.kqzyfj\.com\/click-101820678-17293132\?[^"'\s<>\\]+/g;

const SKIP = new Set(['site-preview.html', 'favicon-html-snippet.html']);

// Pages Vercel actually serves: root + kr/ HTML, minus files that vercel.json
// redirects away and the two internal pages excluded in .vercelignore.
function servedPages(root = ROOT) {
  const vj = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirected = new Set((vj.redirects || []).map(r => r.source.replace(/^\//, '')));
  const list = [];
  for (const dir of ['', 'kr']) {
    const d = path.join(root, dir);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      const rel = dir ? `${dir}/${f}` : f;
      if (f.endsWith('.html') && !SKIP.has(rel) && !redirected.has(rel)) list.push(rel);
    }
  }
  return list.sort();
}

function decodeCj(raw) {
  const q = raw.replace(/&amp;/g, '&').split('?')[1] || '';
  const p = new URLSearchParams(q);
  return { sid: p.get('sid') || '', dest: p.get('url') || '' };
}

// Registry key for a Booking destination:
//   hotel:<booking slug>              /hotel/vn/<slug>.html
//   search:<ss>|<dest_id>|<dest_type> searchresults pages
function keyFor(dest) {
  let u;
  try { u = new URL(dest); } catch (e) { return null; }
  const m = u.pathname.match(/^\/hotel\/vn\/([^.]+)\.html$/);
  if (m) return `hotel:${m[1]}`;
  const p = u.searchParams;
  return `search:${p.get('ss') || ''}|${p.get('dest_id') || ''}|${p.get('dest_type') || ''}`;
}

// Classify an occurrence: href attribute (static or nav button) or JS data.
function mechanismAt(src, index, matchLen) {
  const before = src.slice(Math.max(0, index - 6), index);
  if (!/href=["']$/.test(before)) return 'js-data';
  const tagStart = src.lastIndexOf('<a', index);
  const tagEnd = src.indexOf('>', index + matchLen);
  const tag = src.slice(tagStart, tagEnd + 1);
  return /nav-stays-btn|mobile-stays-btn/.test(tag) ? 'nav-button' : 'static-link';
}

function findCjLinks(src) {
  const out = [];
  for (const m of src.matchAll(CJ_RE)) {
    const { sid, dest } = decodeCj(m[0]);
    out.push({ raw: m[0], index: m.index, sid, dest, key: keyFor(dest), mechanism: mechanismAt(src, m.index, m[0].length) });
  }
  return out;
}

function loadDecisions() {
  return fs.existsSync(DECISIONS) ? JSON.parse(fs.readFileSync(DECISIONS, 'utf8')) : { entries: {} };
}

// How one link occurrence is treated, from the entry's decision and its
// overrides (matched on page + CJ sid). Returns
//   { decision: 'map'|'fallback'|'remove'|'hold'|'investigate'|'undecided',
//     key: entry whose link is used, relabel, override }
function planFor(entry, page, sid) {
  for (const o of entry.overrides || []) {
    if (o.page !== page || (o.sid && o.sid !== sid)) continue;
    const decision = o.decision || (o.target_key ? 'map' : entry.decision);
    return { decision, key: decision === 'fallback' ? o.fallback_key : (o.target_key || entry.key), relabel: o.relabel || '', override: o };
  }
  const decision = entry.decision || 'undecided';
  return { decision, key: decision === 'fallback' ? entry.fallback_key : entry.key, relabel: entry.relabel || '' };
}

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
}

const crypto = require('crypto');
const PROFILE = path.join(ROOT, 'data', 'tripcom', 'link-format-profile.json');
const sha256 = s => crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');

// The link format is NOT assumed. data/tripcom/link-format-profile.json is derived by
// link-profile.js from real links generated in the Trip.com dashboard, then approved by a
// human (approved: true). Until then links may be stored but nothing can be applied.
function loadProfile() {
  if (!fs.existsSync(PROFILE)) return null;
  try { return JSON.parse(fs.readFileSync(PROFILE, 'utf8')); } catch (e) { return null; }
}

// An affiliate URL is accepted only if it looks like a link Trip.com's dashboard generated for
// THIS account. This checks; it never builds or edits a link.
//   Always:           https, trip.com host, no whitespace / HTML entities / template placeholders,
//                     no identifiers for another account, no fixed dates (unless the profile accepts them).
//   Approved profile: host, path shape and parameter set must match what the generator produced.
function affiliateUrlProblems(url, profile = loadProfile()) {
  const problems = [];
  if (!url) return ['empty'];
  if (/\s/.test(url)) problems.push('contains whitespace');
  if (/&amp;|&#|%7B|%7D|[{}]/i.test(url)) problems.push('contains an HTML entity or template placeholder (not the generator\'s exact output)');
  let u;
  try { u = new URL(url); } catch (e) { return [...problems, 'not a URL']; }
  if (u.protocol !== 'https:') problems.push('not https');
  if (!/(^|\.)trip\.com$/i.test(u.hostname)) problems.push(`unexpected host ${u.hostname}`);
  const params = {};
  for (const [k, v] of u.searchParams) params[k.toLowerCase()] = v;
  for (const [k, v] of Object.entries(params)) {
    if (/alliance/.test(k) && v !== ALLIANCE_ID) problems.push(`wrong ${k} (${v}); this account is ${ALLIANCE_ID}`);
    if (k === 'sid' && v !== SITE_ID) problems.push(`wrong SID (${v}); this site is ${SITE_ID}`);
  }
  const dated = ['checkin', 'checkout', 'checkindate', 'checkoutdate', 'startdate', 'enddate'].filter(k => params[k]);
  if (dated.length && !(profile && profile.accept_dated)) problems.push(`fixed date parameter ${dated.join(', ')} (decision needed: see docs, "dated links")`);
  if (profile && profile.approved) {
    if (!(profile.hosts || []).includes(u.hostname.toLowerCase())) problems.push(`host ${u.hostname} is not in the approved profile (${(profile.hosts || []).join(', ')})`);
    if (!(profile.path_shapes || []).some(re => new RegExp('^' + re + '$').test(u.pathname))) problems.push(`path ${u.pathname} does not match an approved shape`);
    const keys = Object.keys(params), allowed = new Set((profile.params_allowed || []).map(x => x.toLowerCase()));
    for (const k of keys) if (!allowed.has(k)) problems.push(`parameter "${k}" is not in the approved profile`);
    for (const k of (profile.params_required || [])) if (!(k.toLowerCase() in params)) problems.push(`required parameter "${k}" missing`);
    const ev = profile.identity && profile.identity.evidence;     // how the generator carries the account
    if (ev === 'params') { if (!Object.entries(params).some(([k, v]) => /alliance/.test(k) && v === ALLIANCE_ID)) problems.push('Alliance ID not present as the profile requires'); if (params.sid !== SITE_ID) problems.push('SID not present as the profile requires'); }
  }
  return problems;
}

// The destination a generated link points at, read from its path (observed generator format:
// /hotels/<slug>-hotel-detail-<id>/<hotel-slug>/ and /hotels/<slug>-hotels-list-<id>/). Null if not in the path.
function destinationFromUrl(url) {
  try { const m = new URL(url).pathname.match(/-(hotel-detail|hotels-list)-(\d+)(?:\/|$)/); return m ? { type: m[1] === 'hotel-detail' ? 'hotel' : 'city', id: m[2] } : null; } catch (e) { return null; }
}
// Is the link confirmed to open the intended property? 'yes' = the owner opened it; 'id-in-url' = the
// generator's own path carries the Trip.com ID and it equals the registry ID (machine check).
function destinationConfirmed(entry, profile = loadProfile()) {
  const v = entry.verification && entry.verification.opens_correct_property;
  if (v === 'yes') return true;
  if (v === 'id-in-url') { const d = destinationFromUrl(entry.affiliate_url); return !!d && String(entry.tripcom_id) === d.id && (d.type === (entry.tripcom_type === 'hotel' ? 'hotel' : 'city')); }
  return false;
}

// What must be true before any link may be applied to pages.
function profileProblems(profile = loadProfile()) {
  if (!profile) return ['no link-format profile yet (run link-profile.js derive after the first real links are imported)'];
  const p = [];
  if (!profile.approved) p.push('link-format profile is not approved (review it against the dashboard, then set "approved": true)');
  if ((profile.hosts || []).some(h => h !== 'www.trip.com') && !profile.domain_decision) p.push(`generator produced host(s) ${profile.hosts.join(', ')}: record the regional-domain decision in "domain_decision"`);
  return p;
}

const PILOT = path.join(ROOT, 'data', 'tripcom', 'pilot.json');
function loadPilot() { return fs.existsSync(PILOT) ? JSON.parse(fs.readFileSync(PILOT, 'utf8')) : null; }

module.exports = { destinationFromUrl, destinationConfirmed, loadPilot, PROFILE, loadProfile, profileProblems, sha256, ROOT, REGISTRY, DECISIONS, loadDecisions, planFor, ALLIANCE_ID, SITE_ID, CJ_RE, servedPages, decodeCj, keyFor, findCjLinks, loadRegistry, affiliateUrlProblems };
