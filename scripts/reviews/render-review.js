#!/usr/bin/env node
// Renders an editor-supplied Markdown review into its existing review page, VERBATIM.
//   node scripts/reviews/render-review.js data/reviews/intercontinental-da-nang.md intercontinental-da-nang.html
// The Markdown file is the source of truth. Supported syntax (exactly what the editor's files use): "# " headline, "## " and "### " headings,
// paragraphs, "- " list items, and **bold**. Nothing else is interpreted (underscores such as "L_o_n_g" stay literal). Text is HTML-escaped, never edited.
// The article goes between <!--review:begin--> and <!--review:end-->; re-running replaces only that block. Booking modules, comparison links and the
// page chrome outside the block are untouched.
'use strict';
const fs = require('fs'), path = require('path');
const [mdFile, htmlFile] = process.argv.slice(2); if (!mdFile || !htmlFile) { console.error('usage: render-review.js <review.md> <page.html>'); process.exit(2); }
const ROOT = path.resolve(__dirname, '..', '..'); const md = fs.readFileSync(path.join(ROOT, mdFile), 'utf8'); const P = path.join(ROOT, htmlFile);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const slug = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
// parse into blocks
const blocks = []; let list = null;
for (const raw of md.split(/\r?\n/)) {
  const l = raw.replace(/\s+$/, '');
  if (/^- /.test(l)) { if (!list) { list = { t: 'ul', items: [] }; blocks.push(list); } list.items.push(l.slice(2)); continue; }
  list = null; if (!l) continue;
  const h = l.match(/^(#{1,3}) (.*)$/); if (h) { blocks.push({ t: 'h' + h[1].length, text: h[2] }); continue; }
  blocks.push({ t: 'p', text: l });
}
const h1 = blocks.find(b => b.t === 'h1'); if (!h1) throw new Error('no headline');
// headline + the two paragraphs that follow it (byline, overall rating) form the article header
const i1 = blocks.indexOf(h1); const byline = blocks[i1 + 1], rating = blocks[i1 + 2];
if (!/^\*\*By /.test(byline.text) || !/^\*\*Overall Rating: /.test(rating.text)) throw new Error('expected byline and rating after the headline');
const score = (rating.text.match(/([0-9.]+)\/10/) || [])[1]; if (!score) throw new Error('no rating');
const body = blocks.slice(i1 + 3); const seen = {};
const out = body.map(b => {
  if (b.t === 'h2' || b.t === 'h3') { let id = slug(b.text); seen[id] = (seen[id] || 0) + 1; if (seen[id] > 1) id += '-' + seen[id]; return `<${b.t} id="${id}">${inline(b.text)}</${b.t}>`; }
  if (b.t === 'ul') return `<ul>${b.items.map(i => `<li>${inline(i)}</li>`).join('')}</ul>`;
  return `<p>${inline(b.text)}</p>`;
});
// first H2 starts the sections; everything before it is the introduction
// Editor's photos (optional <review>.photos.json next to the Markdown): each <figure> goes right after the paragraph whose text starts with "after".
const photosFile = path.join(ROOT, mdFile.replace(/\.md$/, '.photos.json'));
if (fs.existsSync(photosFile)) { const PH = JSON.parse(fs.readFileSync(photosFile, 'utf8')).photos; const plain = x => x.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  // "after" anchors to a paragraph; "afterHeading" anchors to an H2/H3 (a section's header image)
  for (const ph of PH.slice().reverse()) { const key = ph.afterHeading || ph.after, re = ph.afterHeading ? /^<h[23] / : /^<p>/;
    const hits = out.map((x, i) => (re.test(x) && plain(x).startsWith(key) ? i : -1)).filter(i => i >= 0);
    if (hits.length !== 1) throw new Error(`photo anchor must match exactly one ${ph.afterHeading ? 'heading' : 'paragraph'} (${hits.length}): ${key}`);
    const srcset = ph.src800 && ph.src800 !== ph.src ? `${ph.src800} ${Math.round(ph.w * 800 / Math.max(ph.w, ph.h))}w, ${ph.src} ${ph.w}w` : `${ph.src} ${ph.w}w`;
    out.splice(hits[0] + 1, 0, `<figure class="rv-fig"><img src="${ph.src}" srcset="${srcset}" sizes="(max-width: 760px) 100vw, 720px" width="${ph.w}" height="${ph.h}" alt="${esc(ph.alt)}" loading="lazy" decoding="async"><figcaption>${esc(ph.caption)}</figcaption></figure>`); } }
// Keep the page's Trip.com dynamic banner (one of the sitewide placements) byte-for-byte, between sections at about 42% of the article (its recorded placement).
let hPage = fs.readFileSync(P, 'utf8'); const BRE = /\n?<!-- TRIP\.COM DYNAMIC BANNER -->[\s\S]*?<!-- \/TRIP\.COM DYNAMIC BANNER -->\n?/;
const bannerBlock = (hPage.match(BRE) || [])[0]; if (bannerBlock) hPage = hPage.replace(BRE, '\n');
if (bannerBlock) { const wc = out.map(x => (x.startsWith('<figure') ? '' : x).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length); const total = wc.reduce((a, b) => a + b, 0); let acc = 0, at = -1;
  for (let i = 0; i < out.length; i++) { if (i > 0 && out[i].startsWith('<h2') && acc / total >= 0.42) { at = i; break; } acc += wc[i]; }
  if (at > 0) out.splice(at, 0, '</article>\n' + bannerBlock.trim() + '\n<article class="rv-article rv-article--cont">'); } // full width: the 728x90 band needs more than the 720px text column
const firstH2 = out.findIndex(x => x.startsWith('<h2'));
const intro = out.slice(0, firstH2).join('\n'), rest = out.slice(firstH2).join('\n');
const heroCfg = (() => { const f = path.join(ROOT, mdFile.replace(/\.md$/, '.photos.json')); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).hero : null; })();
const heroOpen = heroCfg ? `<header class="dn-hero rv-hero rv-hero--img"><div class="dn-hero__media"><img src="${heroCfg.src}"${heroCfg.srcset ? ` srcset="${heroCfg.srcset}" sizes="100vw"` : ''}${heroCfg.style ? ` style="${heroCfg.style}"` : ''} alt="" fetchpriority="high" decoding="async"></div><div class="dn-hero__inner">` :'<header class="dn-hero dn-hero--plain rv-hero"><div class="dn-hero__inner">';
const article = `<!--review:begin-->
${heroOpen}
<p class="dn-eyebrow">Hotel Review</p>
<h1>${inline(h1.text)}</h1>
<p class="rv-byline">${inline(byline.text)}</p>
<div class="rv-score" aria-label="Overall rating ${score} out of 10"><span class="rv-score__num">${score}</span><span class="rv-score__max">/ 10</span><span class="rv-score__lbl">${inline(rating.text)}</span></div>
</div></header>
<article class="rv-article" id="review">
<div class="rv-intro">
${intro}
</div>
<!--review:mid-->
${rest}
</article>
<!--review:end-->`;
let h = hPage;
const css = `<style id="rv-style">.dn-hero--plain.rv-hero .dn-eyebrow{color:#555!important;text-shadow:none!important;filter:none!important;opacity:1!important}.rv-hero--img .rv-byline,.rv-hero--img .rv-score{color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.45)}.rv-hero h1{max-width:22ch}.rv-byline{margin:.4rem 0 0;font-size:1rem;opacity:.9}.rv-score{display:flex;align-items:baseline;flex-wrap:wrap;gap:.35rem .6rem;margin-top:1rem}.rv-score__num{font:700 2.6rem/1 var(--font-display,Georgia,serif)}.rv-score__max{font-size:1.1rem;opacity:.75}.rv-score__lbl{flex-basis:100%;font-size:.9rem;opacity:.85}
.rv-article{max-width:720px;margin:0 auto;padding:2rem var(--gutter,1.25rem) 2.5rem;font-size:1.075rem;line-height:1.75;color:var(--ink,#111)}.rv-article p{margin:0 0 1.05rem}.rv-article h2{font:700 clamp(1.45rem,4vw,1.9rem)/1.2 var(--font-display,Georgia,serif);margin:2.6rem 0 1rem;scroll-margin-top:90px}.rv-article h3{font:700 clamp(1.15rem,3vw,1.35rem)/1.3 var(--font-display,Georgia,serif);margin:2rem 0 .8rem;scroll-margin-top:90px}.rv-article ul{margin:0 0 1.2rem;padding-left:1.2rem}.rv-article li{margin:.4rem 0}.rv-article strong{font-weight:700}.rv-article--cont{padding-top:.5rem}.rv-fig{margin:1.6rem 0 1.9rem}.rv-fig img{display:block;width:auto;max-width:100%;height:auto;max-height:82vh;margin:0 auto;border-radius:6px;background:#eee}.rv-fig figcaption{font-size:.88rem;line-height:1.5;color:#555;margin-top:.5rem}.rv-intro{border-bottom:1px solid rgba(0,0,0,.12);padding-bottom:.6rem;margin-bottom:.4rem}
@media(max-width:600px){.rv-article{font-size:1.02rem;padding-top:1.4rem}}</style>`;
if (/<!--review:begin-->/.test(h)) {
  // re-render: keep whatever sits at the mid marker (booking modules) and replace the rest of the block
  const a = h.indexOf('<!--review:begin-->'), z = h.indexOf('<!--review:end-->') + '<!--review:end-->'.length; const old = h.slice(a, z);
  const midKeep = (old.match(/<!--review:mid-->([\s\S]*?)<!--\/review:mid-->/) || [, ''])[1];
  h = h.slice(0, a) + article.replace('<!--review:mid-->', `<!--review:mid-->${midKeep}<!--/review:mid-->`) + h.slice(z);
} else {
  // first migration from the old hand-written review layout: keep the booking modules, drop the old editorial sections and FAQ
  const start = h.indexOf('<header class="dn-hero"'), end = h.indexOf('<section class="hr-section hr-cta">'); if (start < 0 || end < 0) throw new Error('unexpected page layout');
  const old = h.slice(start, end);
  const keep = ['dn-revenue:early', 'dn-c3:r:tools'].map(k => { const m = old.match(new RegExp(`<!--${k}-->[\\s\\S]*?<!--\\/${k}-->`)); if (!m) throw new Error('missing block ' + k); return m[0]; }).join('\n');
  h = h.slice(0, start) + article.replace('<!--review:mid-->', `<!--review:mid-->\n</article>\n${keep}\n<article class="rv-article rv-article--cont">\n<!--/review:mid-->`) + '\n' + h.slice(end);
  h = h.replace(/<section class="hr-section" style="background:var\(--sand\);border-top:1px solid var\(--sand-dark\)">[\s\S]*?<span class="hr-label">Common Questions<\/span>[\s\S]*?<\/section>\s*/, '');
  h = h.replace(/<script type="application\/ld\+json">\s*\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?<\/script>\s*/, '');
}
h = h.replace(/<style id="rv-style">[\s\S]*?<\/style>\n?/, '').replace('</head>', css + '\n</head>');
fs.writeFileSync(P, h);
console.log(`rendered ${mdFile} -> ${htmlFile}: ${body.length} blocks, rating ${score}`);
