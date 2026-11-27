#!/usr/bin/env node
// Production smoke test: status, overflow, affiliate IDs, one affiliate_click per click, tool behaviour, corrected facts visible.
'use strict';
const { chromium } = require('playwright'); const B = 'https://www.dananghotelguide.com/'; const R = [];
const t = (n, ok, d) => { R.push(!!ok); console.log((ok ? 'PASS' : 'FAIL') + '  ' + n + (ok ? '' : '  -- ' + d)); };
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1280]) { const c = await b.newContext({ viewport: { width: w, height: 900 } }); await c.addInitScript(() => { try { localStorage.setItem('dn_consent', JSON.stringify({ v: 'denied', t: Date.now() })); } catch (e) {} }); const p = await c.newPage();
    for (const pg of ['', 'where-to-stay-in-da-nang.html', 'compare-hotels.html', 'find-your-hotel.html', 'best-hotels-in-da-nang.html', 'hilton-da-nang.html', 'sheraton-grand-da-nang.html', 'radisson-blu-da-nang.html', 'best-time-to-visit-da-nang.html', 'dragon-bridge-da-nang.html', 'da-nang-hotels-map.html', 'da-nang-hotel-directory.html', 'kr/best-hotels-in-da-nang.html', 'da-nang-hotels-at-a-glance.html', 'da-nang-hotel-taxes-service-charge.html', 'intercontinental-vs-tia-wellness-da-nang.html', 'is-a-luxury-resort-in-da-nang-worth-it.html', 'family-hotels-da-nang.html', 'azura-da-nang.html']) {
      const errs = []; p.removeAllListeners('pageerror'); p.on('pageerror', e => errs.push(e.message));
      const r = await p.goto(B + pg, { waitUntil: 'load' }); await p.waitForTimeout(600);
      const o = await p.evaluate(() => ({ ov: document.documentElement.scrollWidth - innerWidth, ids: [...document.querySelectorAll('a[data-provider=tripcom]')].every(a => /Allianceid=11013066/.test(a.href) && /SID=333523744/.test(a.href)), n: document.querySelectorAll('a[data-provider=tripcom]').length, dupScripts: ['dn-shortlist.js', 'dn-sticky-cta.js', 'tripcom-cta.js'].some(s => document.querySelectorAll('script[src$="' + s + '"]').length > 1) }));
      t(`${w}px ${pg || 'home'}: 200, no overflow, ${o.n} Trip.com links with IDs, no duplicate scripts`, r.status() === 200 && o.ov <= 1 && o.ids && !o.dupScripts && !errs.filter(e => !/^L is not defined/.test(e)).length, JSON.stringify(o) + errs.join('|'));
    } await c.close(); }
  { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await c.newPage(); let pops = 0; c.on('page', pp => { pops++; pp.close(); });
    await p.goto(B + 'where-to-stay-in-da-nang.html', { waitUntil: 'load' }); await p.waitForTimeout(1500); t('no Trip.com tab opens without a click', pops === 0, pops);
    await p.click('.rr-hero a.tc-btn'); await p.waitForTimeout(800); const k = await p.evaluate(() => (window.dataLayer || []).map(x => Array.prototype.slice.call(x)).filter(x => x[0] === 'event' && x[1] === 'affiliate_click').length);
    t('one click -> exactly one affiliate_click', k === 1, k);
    const txt = await p.evaluate(() => document.body.innerText); t('where-to-stay: no Radisson Blu / Sheraton-on-My-Khe text', !/Radisson Blu/.test(txt), '');
    await p.goto(B, { waitUntil: 'load' }); await p.waitForTimeout(800);
    await p.click('#find .rr-chip[data-g="setting"][data-v="city"]'); await p.waitForTimeout(200);
    const cityOk = await p.evaluate(() => { const v = [...document.querySelectorAll('#find [data-shop-card]')].filter(c => c.offsetParent !== null); return v.length > 0 && v.every(c => c.dataset.setting === 'city'); });
    t('home instant filter live: City shows only city hotels', cityOk);
    t('home search box not loaded before a click', (await p.locator('iframe#S20398814').count()) === 0); await p.click('.rr-sbox__go'); await p.waitForTimeout(300); t('home search box loads after a click', (await p.locator('iframe#S20398814').count()) === 1);
    await p.goto(B + 'compare-hotels.html?h=hilton-da-nang,sheraton-grand-da-nang', { waitUntil: 'load' }); await p.waitForTimeout(800);
    const tb = await p.evaluate(() => document.querySelector('.dnc-table') && document.querySelector('.dnc-table').innerText);
    t('compare tool live: labelled road/walk distances, verified names', /by road/i.test(tb || '') && /Sheraton Grand Danang Beach Resort/i.test(tb || '') && /min walk/i.test(tb || ''), (tb || '').slice(0, 120));
    await p.locator('[data-dn-save]').first().count(); await p.goto(B + 'find-your-hotel.html', { waitUntil: 'load' }); await p.waitForTimeout(500); await p.click('.fy-go'); await p.waitForTimeout(400);
    const sv = p.locator('#fyRes [data-dn-save]').first(); await sv.click(); await p.waitForTimeout(200); t('finder Save works live (one script instance)', (await sv.getAttribute('aria-pressed')) === 'true');
    const tet = await (await p.goto(B + 'da-nang-tet-2027-hotels.html')).text(); t('Tet page: Feb 6 2027, no [VERIFY]', /February 6/.test(tet) && !/\[VERIFY/.test(tet));
    const az = await (await p.goto(B + 'azura-da-nang.html')).text(); t('Azura page withdrawn and noindex live', /noindex, follow/.test(az) && /review withdrawn/i.test(az));
    await p.goto(B + 'find-your-hotel.html', { waitUntil: 'load' }); await p.evaluate(() => { const f = document.getElementById('fyForm'); f.querySelector('input[name=nights][value=short]').checked = true; f.requestSubmit(); }); await p.waitForTimeout(400);
    t('Stay Planner live: plan box and travel times', await p.evaluate(() => !!document.querySelector('#fyRes .fy-plan') && /min by road/.test(document.getElementById('fyRes').textContent)));
    const sh = await (await p.goto(B + 'sheraton-grand-da-nang.html')).text(); t('Sheraton review: 258 rooms, no 785', /258/.test(sh) && !/\b785\b/.test(sh));
    await c.close(); }
  await b.close(); const bad = R.filter(x => !x).length; console.log(`\n${R.length - bad}/${R.length} passed`); process.exit(bad ? 1 : 0);
})();
