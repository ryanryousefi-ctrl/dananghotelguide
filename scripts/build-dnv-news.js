#!/usr/bin/env node
/*
 * Refresh the last-known-good Da Nang Voice snapshot baked into
 * lib/news-template.html. Optional: production renders the live feed in
 * api/news.js; this snapshot is only what visitors see if the feed is down.
 *
 *   node scripts/build-dnv-news.js            # fetch live feed
 *   node scripts/build-dnv-news.js feed.xml   # use a local feed file
 */
'use strict';
const fs = require('fs');
const path = require('path');
const dnv = require('../lib/dnv-news');

const TEMPLATE = path.join(__dirname, '..', 'lib', 'news-template.html');

(async () => {
  const xml = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : undefined;
  const { html, stories } = await dnv.buildSection({ xml, timeoutMs: 15000 });
  fs.writeFileSync(TEMPLATE, dnv.injectIntoPage(fs.readFileSync(TEMPLATE, 'utf8'), html));
  console.log(`Snapshot updated: ${stories.length} stories, newest ${stories[0].date.toISOString()}`);
})().catch(e => { console.error('Snapshot NOT updated:', e.message); process.exit(1); });
