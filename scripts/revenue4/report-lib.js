'use strict';
// Tiny CSV + HTML helpers for the static report builders (no dependencies, no network).
const fs = require('fs');
function csv(f) { const L = fs.readFileSync(f, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
  const split = l => { const o = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (ch === '"') { if (q && l[i + 1] === '"') { c += '"'; i++; } else q = !q; } else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o.map(s => s.trim()); };
  const head = split(L[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')); return L.slice(1).map(l => { const v = split(l); return Object.fromEntries(head.map((h, i) => [h, v[i]])); }); }
const num = v => Number(String(v == null ? '0' : v).replace(/[,%]/g, '')) || 0;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tableHtml = (title, head, rows, note) => `<h2>${esc(title)}</h2>${note ? `<p class="n">${note}</p>` : ''}${rows.length ? `<table><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p class="n">No rows.</p>'}`;
const page = (title, body, meta) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:1.5rem;color:#111;background:#fff}table{border-collapse:collapse;width:100%;margin:.5rem 0 1.5rem;font-size:13px}th,td{border-bottom:1px solid #ddd;padding:.35rem .5rem;text-align:left;vertical-align:top}th{background:#f3f3f3}td:not(:first-child){font-variant-numeric:tabular-nums}.n{color:#555;font-size:13px}h1{font-size:1.5rem}h2{font-size:1.1rem;margin-top:2rem}</style></head><body><h1>${esc(title)}</h1><p class="n">${meta}</p>${body}</body></html>`;
const arg = n => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : null; };
module.exports = { csv, num, esc, tableHtml, page, arg };
