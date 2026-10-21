// The one definition of the logo markup: used by scripts/redesign/chrome.js (new builds) and
// scripts/branding/apply-logo.js (migrates the already generated pages). Artwork: assets/brand/dnhg-logo-master.png.
'use strict';
const W = (p, n) => `${p}assets/brand/dnhg-logo-${n}`;
// width/height are the file's real dimensions (aspect 4:1) so the layout never shifts; CSS sets the displayed size.
const picture = prefix => `<picture><source type="image/webp" srcset="${W(prefix, 640)}.webp 640w, ${W(prefix, 1000)}.webp 1000w" sizes="(max-width: 899px) 216px, 256px"><img src="${W(prefix, 640)}.png" srcset="${W(prefix, 640)}.png 640w, ${W(prefix, 1000)}.png 1000w" sizes="(max-width: 899px) 216px, 256px" alt="Da Nang Hotel Guide" width="640" height="160" decoding="async"></picture>`;
const header = (href, aria, prefix) => `<a class="dn-brand dn-brand--logo" href="${href}" aria-label="${aria}">${picture(prefix)}</a>`;
const footer = (href, prefix) => `<a class="dn-brand dn-brand--logo dn-brand--light" href="${href}">${picture(prefix)}</a>`;
module.exports = { header, footer, picture };
