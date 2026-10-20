// Monochrome + emoji rules shared by the build. Everything here is applied at generation time,
// so regenerated pages can never reintroduce warm/accent colours or decorative emojis.
'use strict';

// Colour: every chromatic literal becomes the nearest step of one neutral ladder.
const LADDER = [0x00, 0x11, 0x22, 0x33, 0x4d, 0x59, 0x66, 0x99, 0xb3, 0xcc, 0xd9, 0xe6, 0xf0, 0xf5, 0xfa, 0xff];
const snap = y => y < 0x2a ? 0x11 : LADDER.reduce((a, b) => Math.abs(b - y) < Math.abs(a - y) ? b : a);
const hex2 = n => n.toString(16).padStart(2, '0');
const grey = (r, g, b) => snap(Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b));
const HEX = /#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g;
const RGB = /rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?=[,)\/])/g;

function mono(s) {
  const s0 = s;
  s = s.replace(HEX, (m, h, off) => {
    const before = s0.slice(Math.max(0, off - 12), off);
    if (/&$/.test(before) || /(href|src|action|xlink:href|for|id)\s*=\s*["']?$/i.test(before) || /url\(\s*["']?$/i.test(before)) return m;   // entities, anchors, SVG refs
    if (h.length === 3 && !/[:\s,(=]$/.test(before)) return m;
    const x = h.length === 3 ? [...h].map(c => c + c).join('') : h;
    const r = parseInt(x.slice(0, 2), 16), g = parseInt(x.slice(2, 4), 16), b = parseInt(x.slice(4, 6), 16);
    if (Math.max(r, g, b) - Math.min(r, g, b) < 3) return m;       // already neutral
    const v = hex2(grey(r, g, b));
    return '#' + v + v + v + x.slice(6);
  });
  s = s.replace(RGB, (m, r, g, b) => {
    r = +r; g = +g; b = +b;
    if (Math.max(r, g, b) - Math.min(r, g, b) < 3) return m;
    const v = grey(r, g, b);
    return m.slice(0, m.indexOf('(') + 1) + v + ',' + v + ',' + v;
  });
  // Faint white text on dark grounds (alpha .3-.69) is raised to .72 so it stays readable; decorative values below .3 are left alone.
  s = s.replace(/(^|[;{\s"'])(color\s*:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*)(0?\.(?:[3-6]\d*))(\s*\))/g, '$1$2.72$4');
  return s;
}

// Emoji: decorative pictographs, regional-indicator flags, keycaps, variation selectors.
// Typographic arrows, (c), (R), TM, check marks and bullets are kept.
const KEEP = new Set(['↗', '↖', '↘', '↙', '↔', '↕', '↩', '←', '↑', '→', '↓', '©', '®', '™', '✓', '✔', '✕', '✖', '•', '●']);
const UNIT = '(?:[\\p{Extended_Pictographic}\\p{Regional_Indicator}]\\uFE0F?\\u200D?)+';
const isKept = e => [...e].every(c => KEEP.has(c) || c === '️');
function strip(s) {
  let n = 0;
  s = s.replace(new RegExp('<span[^>]*>\\s*(' + UNIT + ')\\s*</span>\\s*', 'gu'), (m, e) => isKept(e) ? m : (n++, ''));
  s = s.replace(new RegExp('(' + UNIT + ')[ \\t]?', 'gu'), (m, e) => isKept(e) ? m : (n += [...e].filter(c => c !== '️' && c !== '‍').length, ''));
  s = s.replace(/[️⃣]/g, '');
  return { text: s, removed: n };
}
module.exports = { mono, strip, KEEP };
