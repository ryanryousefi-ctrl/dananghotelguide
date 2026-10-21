// Drives the NORMAL "Affiliate Link" form (Affiliate Tools > Affiliate Link, custom link) once per worksheet row,
// inside the owner's already signed-in browser session. One destination URL per generation, a few seconds apart.
// It copies the displayed output byte for byte; it never builds or edits a link. It stops at the first sign of a
// CAPTCHA, rate limit, expired session or unexpected output. Resumable: rows that already have a link are skipped.
// Used through run.js (writes a command file for driver.js --attach).
'use strict';
const ROOT = '/Users/ryanyousefi/dananghotelguide-tcredesign';
const CSV = ROOT + '/data/tripcom/link-worksheet.csv', LOG = ROOT + '/data/tripcom/generation-log.jsonl';
const FORM = 'https://www.trip.com/partners/tools/deeplink/create';
const AID = '11013066', SID = '333523744';
const parse = line => { const out = []; let cur = '', inq = false; for (let i = 0; i < line.length; i++) { const c = line[i]; if (inq) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') inq = false; else cur += c; } else if (c === '"') inq = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };
const q = v => `"${String(v).replace(/"/g, '""')}"`;

module.exports = async function generate({ page, fs, limit = 1000, only = null }) {
  const crypto = require('crypto');
  const lines = fs.readFileSync(CSV, 'utf8').replace(/\r/g, '').trim().split('\n');
  const head = parse(lines[0]); const col = n => head.indexOf(n);
  const rows = lines.slice(1).map(parse);
  const status = { done: 0, skipped: 0, anomalies: [], stopped: null };
  const save = () => fs.writeFileSync(CSV, [head.map(q).join(','), ...rows.map(r => r.map(q).join(','))].join('\n') + '\n');
  const progress = () => fs.writeFileSync('/tmp/tc-driver/progress.json', JSON.stringify({ ...status, total: rows.length, withLink: rows.filter(r => r[col('affiliate_url')]).length, at: new Date().toISOString() }));
  for (const r of rows) {
    if (status.done >= limit) break;
    const dest = r[col('paste_into_link_generator')];
    if (r[col('affiliate_url')]) { status.skipped++; continue; }
    if (only && !only.includes(r[col('tripcom_id')])) continue;
    try {
      await page.goto(FORM, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1500);
      const state = await page.evaluate(() => ({ url: location.href, text: document.body.innerText }));
      if (!/partners\/tools\/deeplink/.test(state.url)) { status.stopped = 'session or redirect: ' + state.url; break; }
      if (/captcha|verify you are human|too many|frequent|slide to|unusual traffic|access denied|blocked/i.test(state.text)) { status.stopped = 'platform challenge or restriction text detected'; break; }
      if (!/Da Nang Hotel Guide/.test(state.text)) { status.stopped = 'site "Da Nang Hotel Guide" not selected in the form'; break; }
      const ta = page.locator('textarea').first();
      await ta.click(); await ta.fill(dest); await page.waitForTimeout(600);
      await page.getByText('Create an affiliate link', { exact: true }).last().click();
      let out = null;
      for (let i = 0; i < 30 && !out; i++) {
        await page.waitForTimeout(500);
        out = await page.evaluate(() => { const hits = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /Allianceid=/.test(e.textContent) && !(e.tagName === 'TEXTAREA')); return hits.length ? hits[0].textContent.trim() : null; });
      }
      if (!out) { status.stopped = `no output for ${dest}`; break; }
      const ok = out.startsWith(dest + '&Allianceid=' + AID + '&SID=' + SID + '&trip_sub1=&trip_sub3=') && /^D\d+$/.test(out.slice((dest + '&Allianceid=' + AID + '&SID=' + SID + '&trip_sub1=&trip_sub3=').length)) && !/\s/.test(out);
      const rec = { ts: new Date().toISOString(), row: r[col('tripcom_id')], name: r[col('name')], input: dest, output: out, sha256: crypto.createHash('sha256').update(out, 'utf8').digest('hex'), method: 'dashboard-automation', ok };
      fs.appendFileSync(LOG, JSON.stringify(rec) + '\n');
      if (!ok) { status.anomalies.push({ dest, out }); progress(); if (status.anomalies.length >= 3) { status.stopped = '3 unexpected outputs'; break; } continue; }
      r[col('affiliate_url')] = out; r[col('generated_on')] = new Date().toISOString().slice(0, 10); r[col('generation_method')] = 'dashboard-automation';
      r[col('notes')] = 'Generated through the Affiliate Link form in the owner-authenticated session';
      save(); status.done++; progress();
    } catch (e) { status.stopped = 'error: ' + String(e.message).slice(0, 200); break; }
    await page.waitForTimeout(4500 + Math.floor(Math.random() * 3500));   // gentle pace
  }
  save(); progress();
  return status;
};
