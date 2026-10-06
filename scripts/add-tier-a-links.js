#!/usr/bin/env node
/*
 * Adds a reusable "More Ways to Decide" contextual-link block to
 * individual hotel review pages, linking into 2-3 of the five Tier A
 * money pages based on the specific property's category, not all five
 * on every page. Varied anchor text per link, inserted once near the
 * FAQ/footer boundary so it reads as editorial cross-referencing.
 *
 * Idempotent: skips any file that already has the sw-moreways block.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const TIER_A = {
  best: {
    href: 'best-hotels-in-da-nang.html',
    labels: ['our full best-hotels-in-Da-Nang guide', 'the citywide best-hotels roundup', 'our broader hotel picks for Da Nang'],
  },
  luxury: {
    href: 'luxury-hotels-da-nang.html',
    labels: ['our five-star picks across Da Nang', 'the luxury resort guide', 'our luxury hotel roundup'],
  },
  family: {
    href: 'family-hotels-da-nang.html',
    labels: ['our family-friendly hotel picks', 'the guide to Da Nang resorts for kids', 'our family resort roundup'],
  },
  beach: {
    href: 'da-nang-beach-hotels.html',
    labels: ['our beachfront hotel roundup', 'the guide to hotels by beach and strip', 'our picks for My Khe and Non Nuoc'],
  },
  stay: {
    href: 'where-to-stay-in-da-nang.html',
    labels: ['our area-by-area breakdown of Da Nang', 'the guide to picking the right neighborhood', 'our where-to-stay primer'],
  },
};

// file -> { links: [TIER_A keys, 2-3], sentence: custom lead-in text }
const PAGE_CONFIG = {
  'naman-retreat-da-nang.html': { links: ['luxury', 'beach', 'best'] },
  'sheraton-grand-da-nang.html': { links: ['family', 'best', 'stay'] },
  'marriott-resort-da-nang.html': { links: ['luxury', 'beach'] },
  'premier-village-da-nang.html': { links: ['luxury', 'family', 'beach'] },
  'melia-da-nang.html': { links: ['beach', 'best'] },
  'pullman-da-nang.html': { links: ['beach', 'best'] },
  'furama-resort-da-nang.html': { links: ['beach', 'family', 'best'] },
  'radisson-blu-da-nang.html': { links: ['beach', 'best'] },
  'mikazuki-da-nang.html': { links: ['family', 'beach'] },
  'hilton-da-nang.html': { links: ['best', 'stay'] },
  'tia-wellness-resort-da-nang.html': { links: ['luxury', 'beach'] },
  'fusion-suites-da-nang.html': { links: ['beach', 'stay'] },
  'melia-vinpearl-da-nang.html': { links: ['best', 'stay'] },
  'four-points-sheraton-da-nang.html': { links: ['beach', 'stay'] },
  'novotel-da-nang-han-river.html': { links: ['best', 'stay'] },
  'a-la-carte-da-nang.html': { links: ['beach', 'stay'] },
  'wyndham-soleil-da-nang.html': { links: ['beach', 'stay'] },
  'grand-mercure-da-nang.html': { links: ['best', 'stay'] },
  'muong-thanh-luxury-da-nang.html': { links: ['beach', 'stay'] },
  'brilliant-hotel-da-nang.html': { links: ['best', 'stay'] },
  'hyatt-regency-da-nang.html': { links: ['family', 'luxury', 'best'] },
  'tms-hotel-da-nang.html': { links: ['beach', 'stay'] },
  'intercontinental-da-nang.html': { links: ['luxury', 'best'] },
  'vinpearl-luxury-da-nang.html': { links: ['luxury', 'beach'] },
  'azura-da-nang.html': { links: ['best', 'stay'] },
  'silk-path-grand-da-nang.html': { links: ['beach', 'best'] },
};

function labelIndexFor(fileBase, key) {
  // Deterministic but varied: different pages pulling the same Tier A
  // destination get a different anchor phrase, not identical exact-match text.
  let hash = 0;
  for (const ch of fileBase + key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash;
}

function buildLinkHtml(key, fileBase) {
  const { href, labels } = TIER_A[key];
  const label = labels[labelIndexFor(fileBase, key) % labels.length];
  return `<a href="${href}" style="color:var(--ocean);font-weight:600">${label}</a>`;
}

function buildParagraph(fileBase, keys) {
  const links = keys.map((k) => buildLinkHtml(k, fileBase));
  if (keys.length === 2) {
    const variants = [
      `For a wider comparison, see ${links[0]}, or ${links[1]} if that framing fits your trip better.`,
      `Weighing this against other options? Start with ${links[0]}, and ${links[1]} is worth a look too.`,
    ];
    const idx = fileBase.length % variants.length;
    return variants[idx];
  }
  // 3 links
  const variants = [
    `Comparing against other properties, start with ${links[0]}, then ${links[1]} and ${links[2]} for the adjacent angles.`,
    `Before you book, it's worth seeing how this stacks up: ${links[0]}, ${links[1]}, and ${links[2]} all cover related ground.`,
  ];
  const idx = fileBase.length % variants.length;
  return variants[idx];
}

function insertBlock(content, paragraphHtml) {
  // Universal anchor verified across all 26 target pages: exactly one
  // <footer class="site-footer"> per page, regardless of which hero/FAQ
  // template variant the rest of the page uses.
  const anchor = /(<footer class="site-footer">)/;
  const block = `<section style="background:var(--sand,#F6F1E9);padding:2rem var(--gutter,clamp(1.25rem,5vw,3rem))">\n  <div style="max-width:760px;margin:0 auto">\n    <p class="sw-moreways" style="font-size:.92rem;color:var(--ink-muted,#7A7A70);line-height:1.7">${paragraphHtml}</p>\n  </div>\n</section>\n\n`;

  if (anchor.test(content)) {
    return content.replace(anchor, block + '$1');
  }
  return null;
}

function processFile(filePath, dryRun) {
  const fileBase = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('sw-moreways')) {
    return { status: 'skipped-already-present' };
  }

  const config = PAGE_CONFIG[fileBase];
  if (!config) {
    return { status: 'skipped-no-config' };
  }

  const paragraph = buildParagraph(fileBase, config.links);
  const updated = insertBlock(content, paragraph);

  if (!updated) {
    return { status: 'skipped-no-anchor-found' };
  }

  if (!dryRun) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
  return { status: 'added', links: config.links };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const debug = process.argv.includes('--debug');
  const files = Object.keys(PAGE_CONFIG);

  if (debug) {
    for (const f of files) {
      console.log(f, '->', buildParagraph(f, PAGE_CONFIG[f].links));
      console.log();
    }
    return;
  }
  const linkCounts = { best: 0, luxury: 0, family: 0, beach: 0, stay: 0 };
  let added = 0;
  const report = [];

  for (const f of files) {
    const filePath = path.join(ROOT, f);
    if (!fs.existsSync(filePath)) {
      report.push({ file: f, status: 'FILE NOT FOUND' });
      continue;
    }
    const result = processFile(filePath, dryRun);
    report.push({ file: f, ...result });
    if (result.status === 'added') {
      added++;
      result.links.forEach((k) => { linkCounts[k]++; });
    }
  }

  console.log(dryRun ? '[DRY RUN]' : '[WRITE MODE]');
  console.log('Pages configured:', files.length);
  console.log('Pages receiving link block:', added);
  console.log('Link counts by Tier A destination:', linkCounts);
  console.log('');
  report.forEach((r) => console.log(' ', r.file, '->', r.status, r.links ? r.links.join(',') : ''));
}

main();
