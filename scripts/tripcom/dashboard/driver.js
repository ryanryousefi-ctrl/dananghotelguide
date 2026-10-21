#!/usr/bin/env node
// Keeps ONE authenticated Trip.com Partners browser session open so the dashboard link-generation workflow can
// be driven step by step without asking the owner to log in again.
//
//   node scripts/tripcom/dashboard/driver.js          opens a visible Chrome window on the Partners site.
//        THE OWNER LOGS IN THEMSELVES (password, any verification). Nothing here reads or stores credentials.
//
// Commands are small JS files dropped into /tmp/tc-driver/cmd-<n>.js, each `module.exports = async ({page, context}) => result`;
// the result is written to out-<n>.json. The session profile lives OUTSIDE the repo (~/.dnhg-tripcom-profile, mode 700)
// and is never committed. The driver uses the normal website UI only: no private endpoints, no CAPTCHA/consent bypass.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/Users/ryanyousefi/dananghotelguide/node_modules/playwright'); }
const PROFILE = path.join(os.homedir(), '.dnhg-tripcom-profile');
const DIR = '/tmp/tc-driver';
fs.mkdirSync(PROFILE, { recursive: true, mode: 0o700 }); fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const context = await pw.chromium.launchPersistentContext(PROFILE, { channel: 'chrome', headless: false, viewport: null, args: ['--window-size=1320,900'] });
  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://www.trip.com/partners/index?locale=en_xx', { waitUntil: 'domcontentloaded' }).catch(() => {});
  const beat = async () => {
    let url = '', loggedIn = false;
    try { url = page.url(); const t = await page.evaluate(() => document.body.innerText.slice(0, 4000)); loggedIn = /Sign Out|Log Out|Logout|Dashboard|Affiliate Tools|Manage My Sites/i.test(t) && !/^\s*Help\s+EN\s+Join us\s+Sign In/i.test(t.trim()); } catch (e) {}
    fs.writeFileSync(path.join(DIR, 'status.json'), JSON.stringify({ at: new Date().toISOString(), url, loggedIn, pages: context.pages().length }));
  };
  const done = new Set();
  for (;;) {
    await beat();
    for (const f of fs.readdirSync(DIR).filter(x => /^cmd-.*\.js$/.test(x)).sort()) {
      if (done.has(f)) continue; done.add(f);
      const out = path.join(DIR, f.replace(/^cmd-/, 'out-').replace(/\.js$/, '.json'));
      try { const file = path.join(DIR, f); delete require.cache[require.resolve(file)]; const r = await require(file)({ page: context.pages().slice(-1)[0] || page, context, fs, path }); fs.writeFileSync(out, JSON.stringify({ ok: true, result: r }, null, 1)); }
      catch (e) { fs.writeFileSync(out, JSON.stringify({ ok: false, error: String(e && e.stack || e).slice(0, 1500) })); }
    }
    if (fs.existsSync(path.join(DIR, 'STOP'))) break;
    await new Promise(r => setTimeout(r, 1500));
  }
  await context.close();
})();
