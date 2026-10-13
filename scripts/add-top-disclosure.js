#!/usr/bin/env node
/**
 * add-top-disclosure.js
 *
 * Inserts a short affiliate disclosure near the top of every page that has
 * in-content CJ booking links (nav-only pages are skipped):
 *   - after the hero block that contains the H1, when no affiliate link sits
 *     inside that hero; otherwise
 *   - immediately before the first in-content affiliate link's outermost
 *     block that does not contain the H1.
 * Text is inserted at source offsets, so the rest of each file is untouched.
 * Idempotent: pages that already have .aff-disclosure are skipped.
 *
 * Usage: node scripts/add-top-disclosure.js [--dry-run] [file ...]
 */
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const TEXT = {
  en: 'We may earn a commission when you book through our links, at no additional cost to you.',
  ko: '이 페이지의 링크를 통해 예약하시면 추가 비용 없이 저희가 수수료를 받을 수 있습니다.',
};
const LINK = { en: 'How we choose hotels', ko: '호텔 선정 방식' };
const SKIP = new Set(['site-preview.html', 'favicon-html-snippet.html']);

function snippet(lang, prefix) {
  return `\n<div class="aff-disclosure" role="note" style="background:#f4efe6;border-bottom:1px solid rgba(7,63,61,.12)">` +
    `<p style="max-width:1100px;margin:0 auto;padding:10px 20px;font-size:13px;line-height:1.5;color:#3a4747;font-family:inherit">` +
    `${TEXT[lang]} <a href="${prefix}editorial-policy.html" style="color:#073f3d;text-decoration:underline">${LINK[lang]}</a></p></div>\n`;
}

const isNav = $el => $el.closest('nav, .mobile-menu, footer').length > 0 || /nav-stays|mobile-stays/.test($el.attr('class') || '');

function processFile(rel, dry) {
  const file = path.join(ROOT, rel);
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('class="aff-disclosure"')) return 'already';
  const $ = cheerio.load(html, { sourceCodeLocationInfo: true });
  const links = $('a[href*="kqzyfj.com/click-101820678-"]').filter((i, e) => !isNav($(e)));
  if (!links.length) return 'no-content-links';
  const lang = /^ko/.test($('html').attr('lang') || '') ? 'ko' : 'en';
  const prefix = rel.includes('/') ? '../' : '';
  const h1 = $('h1').first();
  const first = links.first();
  let offset;
  if (h1.length) {
    let top = h1;
    while (top.parent().length && !['body', 'main'].includes(top.parent()[0].name)) top = top.parent();
    if (!top.find(first).length && !top.is(first)) {
      offset = top[0].sourceCodeLocation.endOffset; // after the hero
    } else {
      let a = first;
      while (a.parent().length && !a.parent().find(h1).length && !['body', 'main'].includes(a.parent()[0].name)) a = a.parent();
      offset = a[0].sourceCodeLocation.startOffset; // before the first link's block
    }
  } else {
    offset = first[0].sourceCodeLocation.startOffset;
  }
  if (!dry) fs.writeFileSync(file, html.slice(0, offset) + snippet(lang, prefix) + html.slice(offset));
  return 'inserted-' + lang;
}

const argv = process.argv.slice(2);
const args = { dry: argv.includes('--dry-run'), files: argv.filter(x => !x.startsWith('--')) };
const files = args.files.length ? args.files : [
  ...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')),
  ...fs.readdirSync(path.join(ROOT, 'kr')).filter(f => f.endsWith('.html')).map(f => 'kr/' + f),
].filter(f => !SKIP.has(path.basename(f)));
const tally = {};
for (const f of files) { const r = processFile(f, args.dry); tally[r] = (tally[r] || 0) + 1; }
console.log(tally);
