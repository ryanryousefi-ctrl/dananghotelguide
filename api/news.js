/*
 * Serves /news.html (rewritten here in vercel.json).
 *
 * Renders the page template with the latest relevant Da Nang Voice stories.
 * The CDN caches the result for 30 min and serves the stale copy while it
 * revalidates, so new stories appear within about half an hour. If the feed
 * fails, the last good render from this instance is used, then the snapshot
 * baked into the template, so the page never breaks.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const dnv = require('../lib/dnv-news');

const TEMPLATE = fs.readFileSync(path.join(__dirname, '..', 'lib', 'news-template.html'), 'utf8');
let lastGood = null; // { section, at }

module.exports = async function handler(req, res) {
  let page = TEMPLATE;
  let fresh = false;
  try {
    const { html } = await dnv.buildSection({ timeoutMs: 6000 });
    lastGood = { section: html, at: Date.now() };
    fresh = true;
  } catch (e) {
    console.error('[news] Da Nang Voice feed unavailable, using fallback:', e.message);
  }
  if (lastGood) {
    try { page = dnv.injectIntoPage(TEMPLATE, lastGood.section); } catch (e) { console.error('[news]', e.message); }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  // Fresh render: cache 30 min. Fallback: retry the feed after 5 min.
  res.setHeader('CDN-Cache-Control', fresh
    ? 'public, s-maxage=1800, stale-while-revalidate=86400, stale-if-error=86400'
    : 'public, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400');
  res.setHeader('X-DNV-Feed', fresh ? 'live' : (lastGood ? 'memory' : 'snapshot'));
  res.statusCode = 200;
  res.end(req.method === 'HEAD' ? undefined : page);
};
