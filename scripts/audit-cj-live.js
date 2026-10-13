#!/usr/bin/env node
/**
 * audit-cj-live.js
 *
 * Crawls PRODUCTION (sitemap + internal-link discovery) and audits every
 * Booking.com path a visitor can reach: static hrefs, JS string literals and
 * JSON data fields, window.open() builders, and first-party scripts. Every
 * commercial link must be a kqzyfj.com/click-101820678-17293132 URL with a
 * sid and a booking.com url= destination. Complements audit-cj-affiliate.js
 * (local files) by catching deploy/cache drift and pages added since.
 *
 * Usage: node scripts/audit-cj-live.js   (exits 1 if any issue is found)
 */
const BASE = 'https://www.dananghotelguide.com';
const CJ_RE = /^https:\/\/www\.kqzyfj\.com\/click-(\d+)-(\d+)\?(.*)$/;
const fs = require('fs');

const seen = new Set(), queue = [], pages = {}, issues = [], scripts = new Set();
const add = u => {
  try {
    const url = new URL(u, BASE);
    if (url.host !== 'www.dananghotelguide.com' && url.host !== 'dananghotelguide.com') return;
    url.hash = ''; url.search = ''; url.host = 'www.dananghotelguide.com';
    if (!/(\.html|\/)$/.test(url.pathname)) return;
    const k = url.toString();
    if (!seen.has(k)) { seen.add(k); queue.push(k); }
  } catch {}
};
const issue = (page, kind, detail) => issues.push({ page, kind, detail: String(detail).slice(0, 220) });

function checkCj(page, href, ctx) {
  const m = href.replace(/&amp;/g, '&').match(CJ_RE);
  if (!m) return issue(page, 'malformed-cj', href);
  if (m[1] !== '101820678') issue(page, 'wrong-website-id', href);
  if (m[2] !== '17293132') issue(page, 'wrong-link-id', href);
  const p = new URLSearchParams(m[3]);
  const dest = p.get('url');
  if (!p.get('sid')) issue(page, 'missing-sid', href);
  if (!dest) return issue(page, 'missing-url-param', href);
  let d; try { d = new URL(dest); } catch { return issue(page, 'bad-dest', dest); }
  if (!/(^|\.)booking\.com$/.test(d.host)) issue(page, 'dest-not-booking', dest);
  if (/kqzyfj|awin|dotomi|anrdoezrs|cjtrack|qksrv/.test(dest)) issue(page, 'double-wrapped', dest);
  if (d.searchParams.get('aid')) issue(page, 'aid-in-dest', dest);
  return { ctx, sid: p.get('sid'), dest: d.origin + d.pathname };
}

async function get(u) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(u, { redirect: 'manual' }); return { status: r.status, loc: r.headers.get('location'), body: r.status === 200 ? await r.text() : '' }; }
    catch (e) { if (i === 2) return { status: 'ERR ' + e.message, body: '' }; }
  }
}

(async () => {
  const sm = await (await fetch(BASE + '/sitemap.xml')).text();
  const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  smUrls.forEach(add); add(BASE + '/');
  const fromSitemap = new Set([...seen]);
  const links = [];
  while (queue.length) {
    const batch = queue.splice(0, 12);
    await Promise.all(batch.map(async u => {
      const r = await get(u);
      pages[u] = { status: r.status, inSitemap: fromSitemap.has(u), cj: 0 };
      if (r.status !== 200) { if (fromSitemap.has(u)) issue(u, 'sitemap-url-not-200', r.status + ' ' + (r.loc || '')); return; }
      const html = r.body;
      for (const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/g)) add(m[1]);
      for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) scripts.add(new URL(m[1], u).toString());
      // all hrefs
      for (const m of html.matchAll(/<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>/g)) {
        const h = m[1];
        if (/kqzyfj\.com/.test(h)) { const c = checkCj(u, h, 'href'); if (c) { pages[u].cj++; links.push({ page: u, ...c }); } }
        else if (/booking\.com/.test(h)) issue(u, 'RAW-booking-href', h);
        else if (/awin1|awin\.|qksrv|cjtrack|dpbolvw|tkqlhce|jdoqocy|anrdoezrs\.net\/click/.test(h)) issue(u, 'legacy-or-other-affiliate-href', h);
      }
      // JS fields / strings with booking.com outside kqzyfj and outside JSON-LD
      const noLd = html.replace(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/g, '');
      for (const m of noLd.matchAll(/["'`](https?:\/\/(?:www\.)?booking\.com[^"'`\s]*)["'`]/g)) {
        const pre = noLd.slice(Math.max(0, m.index - 6), m.index);
        const pre40 = noLd.slice(Math.max(0, m.index - 40), m.index);
        if (/data-booking-url=$/.test(pre40)) continue; // inert attribute, no JS reads it
        const after = noLd.slice(m.index, m.index + 900);
        if (after.includes('kqzyfj.com/click-101820678-17293132') && after.includes('encodeURIComponent(')) continue; // destination wrapped by builder
        if (!/href=$/.test(pre)) issue(u, 'RAW-booking-string-in-page', m[1]);
      }
      for (const m of noLd.matchAll(/["'`](https:\/\/www\.kqzyfj\.com\/click-[^"'`\s]+)["'`]/g)) {
        const pre = noLd.slice(Math.max(0, m.index - 6), m.index);
        // Bare prefix in a URL builder ('…17293132' + '?sid=' + …) is assembled at runtime.
        if (m[1] === 'https://www.kqzyfj.com/click-101820678-17293132' && /^["'`]\s*\n?\s*\+/.test(noLd.slice(m.index + m[0].length - 1, m.index + m[0].length + 20))) continue;
        if (!/href=$/.test(pre)) { const c = checkCj(u, m[1], 'js'); if (c) { pages[u].cj++; links.push({ page: u, ...c }); } }
      }
      if (/window\.open\([^)]*booking\.com/.test(noLd)) issue(u, 'window.open-raw-booking', '');
      if (/awin1\.com|awinmid|awinaffid/.test(html)) issue(u, 'awin-remnant', (html.match(/.{40}awin.{60}/) || [''])[0]);
      if (!html.includes('https://www.yceml.net/am_gen/101820678/impressions/page/am.js')) issue(u, 'no-cj-page-script', '');
      if (/anrdoezrs\.net\/am\//.test(html)) issue(u, 'cj-script-via-anrdoezrs (http redirect, blocked)', '');
    }));
  }
  // first-party scripts
  const jsReport = [];
  for (const s of scripts) {
    if (!s.startsWith(BASE)) continue;
    const r = await get(s); const t = r.body || '';
    const raw = [...t.matchAll(/https?:\/\/(?:www\.)?booking\.com[^"'`\s)]*/g)].map(m => m[0]);
    const unwrapped = raw.filter((r, i) => { const at = t.indexOf(r); return !(t.slice(at, at + 900).includes('kqzyfj.com/click-101820678-17293132')); });
    if (unwrapped.length) issue(s, 'RAW-booking-in-site-js', unwrapped[0]);
    jsReport.push({ script: s.replace(BASE, ''), status: r.status, rawBookingRefs: raw.length, cjRefs: (t.match(/kqzyfj/g) || []).length, windowOpen: /window\.open/.test(t) });
  }
  const live = Object.entries(pages).filter(([, p]) => p.status === 200);
  const summary = {
    sitemapUrls: smUrls.length, discoveredUrls: seen.size, live200: live.length,
    nonSitemapLive: live.filter(([, p]) => !p.inSitemap).map(([u]) => u.replace(BASE, '')),
    non200: Object.entries(pages).filter(([, p]) => p.status !== 200).map(([u, p]) => u.replace(BASE, '') + ' ' + p.status),
    totalCjLinks: links.length,
    pagesWithZeroCj: live.filter(([, p]) => p.cj === 0).map(([u]) => u.replace(BASE, '')),
    distinctDestinations: new Set(links.map(l => l.dest)).size,
    issueCounts: issues.reduce((a, i) => (a[i.kind] = (a[i.kind] || 0) + 1, a), {}),
    jsReport,
    externalScripts: [...scripts].filter(s => !s.startsWith(BASE)),
  };
  const out = require('path').join(require('os').tmpdir(), 'cj-live-audit.json');
  fs.writeFileSync(out, JSON.stringify({ summary, issues, links }, null, 1));
  console.log(JSON.stringify(summary, null, 1));
  if (issues.length) console.log('issues:', JSON.stringify(issues.slice(0, 50), null, 1));
  console.log(`Full report: ${out}`);
  process.exit(issues.length ? 1 : 0);
})();
