#!/usr/bin/env node
// Writes responsive WebP derivatives into images/dn/ using headless Chrome
// (no image tooling is installed). Originals are never modified.
//   node scripts/redesign/optimize-images.js   (needs http server on :8800 serving the repo root)
const fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/Users/ryanyousefi/dananghotelguide/node_modules/playwright'); }
const ROOT = path.resolve(__dirname, '..', '..');
const J = JSON.parse(fs.readFileSync(path.join(__dirname, 'home-images.json'), 'utf8'));
(async () => {
  const b = await pw.chromium.launch({ channel: 'chrome' }); const p = await b.newPage();
  await p.goto('http://127.0.0.1:8800/robots.txt');
  let total = 0;
  for (const it of J) for (const w of it.widths) {
    const out = path.join(ROOT, 'images/dn', `${it.name}-${w}.webp`);
    const data = await p.evaluate(async ({ src, w, q }) => {
      const img = new Image(); img.src = '/' + src; await img.decode();
      const s = Math.min(1, w / img.naturalWidth), c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return { url: c.toDataURL('image/webp', q), w: c.width, h: c.height };
    }, { src: it.src, w, q: it.q || 0.78 });
    fs.writeFileSync(out, Buffer.from(data.url.split(',')[1], 'base64'));
    const kb = fs.statSync(out).size / 1000; total += kb;
    console.log(path.basename(out).padEnd(34), `${data.w}x${data.h}`.padEnd(10), Math.round(kb) + 'kb');
  }
  console.log('total', Math.round(total) + 'kb'); await b.close();
})();
