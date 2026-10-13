/*
 * Da Nang Voice news feed -> News section of news.html.
 *
 * Shared by api/news.js (server-side render on Vercel, CDN-cached) and
 * scripts/build-dnv-news.js (refreshes the last-known-good snapshot that is
 * baked into the page template). No dependencies.
 *
 * Da Nang Voice is the publisher: cards link to the original article and only
 * show headline, summary, date, category and the feed's photo with its credit.
 */
'use strict';

const FEED_URL = 'https://www.danangvoice.com/feed.xml';
const SITE_URL = 'https://www.danangvoice.com/';
const START = '<!-- DNV-NEWS:START -->';
const END = '<!-- DNV-NEWS:END -->';
const VISIBLE = 12;   // lead + 11 cards
const EXTRA = 12;     // behind "More stories"

// ── Fetch ────────────────────────────────────────────────────
async function fetchFeed(timeoutMs = 6000) {
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'DaNangHotelGuide-News/1.0 (+https://www.dananghotelguide.com/news.html)' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
  return res.text();
}

// ── Parse ────────────────────────────────────────────────────
function decode(s) {
  if (s == null) return '';
  s = String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .trim();
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : '';
}

function attr(xml, name, a) {
  const m = xml.match(new RegExp(`<${name}\\s[^>]*?\\b${a}="([^"]*)"`));
  return m ? decode(m[1]) : '';
}

function parseFeed(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1];
    const media = (it.match(/<media:content[\s\S]*?(?:<\/media:content>|\/>)/) || [''])[0];
    const link = tag(it, 'link');
    const date = new Date(tag(it, 'pubDate'));
    items.push({
      title: tag(it, 'title'),
      link,
      guid: tag(it, 'guid') || link,
      date: isNaN(date) ? null : date,
      categories: [...it.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/g)].map(c => decode(c[1])),
      description: tag(it, 'description'),
      image: attr(media, 'media:content', 'url') || attr(it, 'enclosure', 'url'),
      imageW: +attr(media, 'media:content', 'width') || 0,
      imageH: +attr(media, 'media:content', 'height') || 0,
      thumb: attr(it, 'media:thumbnail', 'url'),
      thumbW: +attr(it, 'media:thumbnail', 'width') || 0,
      alt: tag(media, 'media:title'),
      credit: tag(media, 'media:credit'),
    });
  }
  return items;
}

// ── Relevance filter ─────────────────────────────────────────
// Visitor-facing desks are always in; general desks only when the story
// clearly touches travel, hotels, transport, food, events or living here.
const ALWAYS = /^(travel|tourism|food ?& ?drink|food|dining|events?|festivals?|culture|transport|hotels?|attractions?)$/i;
const SOMETIMES = /^(city life|development|business|economy|news)$/i;
const VISITOR = /\b(touris[mt]s?|travell?ers?|visitors?|hotels?|resorts?|airport|airlines?|flights?|runway|routes?|railway|train|metro|bus(es)?|ferry|cruise|beach(es)?|festivals?|events?|fireworks|restaurants?|caf[eé]s?|food|markets?|malls?|shopping|attractions?|museums?|parks?|bridges?|river|guides?|visas?|expats?|long stay|living|live in|cost of living|costs?|rent(ing|al)?|motorbikes?|getting around|kids|families|remote|nomads?|hospital|sick|insurance)\b/i;
const EXCLUDE = /\b(murder|killed|arrest(ed)?|police|court|sentenced|trial|prison|smuggl\w*|fraud|drugs?|corruption|party congress|politburo|opinion|editorial|obituary)\b/i;
const NOT_FOR_VISITORS = /\b(households? out|evict\w*|off-plan|industrial park|waste-to-energy|blockchain|mou|chip-design|startup)\b/i;

function isRelevant(item) {
  if (!item.title || !/^https:\/\/(www\.)?danangvoice\.com\//.test(item.link) || !item.date) return false;
  const text = `${item.title} ${item.description}`;
  if (EXCLUDE.test(text) || item.categories.some(c => /opinion|crime|politics/i.test(c))) return false;
  if (item.categories.some(c => ALWAYS.test(c))) return true;
  if (item.categories.some(c => SOMETIMES.test(c)) || item.categories.length === 0) {
    return VISITOR.test(text) && !NOT_FOR_VISITORS.test(text);
  }
  return false;
}

function normUrl(u) {
  return u.replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
}

function selectStories(items, limit = VISIBLE + EXTRA) {
  const seen = new Set();
  const out = [];
  const sorted = items.filter(isRelevant).sort((a, b) => b.date - a.date);
  for (const it of sorted) {
    const keys = [normUrl(it.link), normUrl(it.guid), it.title.toLowerCase().replace(/\W+/g, ' ').trim()];
    if (keys.some(k => seen.has(k))) continue;
    keys.forEach(k => seen.add(k));
    out.push(it);
    if (out.length >= limit) break;
  }
  return out;
}

// ── Render ───────────────────────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = d => d.toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', month: 'long', day: 'numeric', year: 'numeric' });

const label = it => it.categories[0] || 'News';

function img(it, { lead }) {
  if (!it.image && !it.thumb) return '';
  const src = lead ? (it.image || it.thumb) : (it.thumb || it.image);
  const set = [];
  if (it.thumb && it.thumbW) set.push(`${esc(it.thumb)} ${it.thumbW}w`);
  if (it.image && it.imageW) set.push(`${esc(it.image)} ${it.imageW}w`);
  const sizes = lead ? '(min-width: 900px) 640px, 100vw' : '(min-width: 1100px) 360px, (min-width: 700px) 45vw, 100vw';
  const loading = lead ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  const dims = it.imageW && it.imageH ? ` width="${it.imageW}" height="${it.imageH}"` : '';
  return `<img src="${esc(src)}"${set.length > 1 ? ` srcset="${set.join(', ')}" sizes="${sizes}"` : ''} alt="${esc(it.alt || '')}"${dims} ${loading} decoding="async">`;
}

function card(it, lead) {
  const cls = lead ? 'dnv-lead' : 'dnv-card';
  const h = lead ? 'h2' : 'h3';
  return `<article class="${cls}">
  <a class="dnv-link" href="${esc(it.link)}" target="_blank" rel="noopener">
    <div class="dnv-img">${img(it, { lead })}</div>
    <div class="dnv-body">
      <div class="dnv-meta"><span class="dnv-cat">${esc(label(it))}</span><time datetime="${it.date.toISOString()}">${fmtDate(it.date)}</time></div>
      <${h} class="dnv-title">${esc(it.title)}</${h}>
      <p class="dnv-excerpt">${esc(it.description)}</p>
      <span class="dnv-more">Read on Da Nang Voice<span class="dnv-sr"> (opens in a new tab)</span></span>
    </div>
  </a>${it.credit ? `\n  <p class="dnv-credit">Photo: ${esc(it.credit)}</p>` : ''}
</article>`;
}

function renderSection(stories, { generatedAt = new Date() } = {}) {
  const [lead, ...rest] = stories;
  const grid = rest.slice(0, VISIBLE - 1);
  const more = rest.slice(VISIBLE - 1);
  const body = lead ? `
${card(lead, true)}
<div class="dnv-grid">
${grid.map(it => card(it, false)).join('\n')}
</div>${more.length ? `
<details class="dnv-details">
  <summary>More Da Nang Voice stories (${more.length})</summary>
  <div class="dnv-grid">
${more.map(it => card(it, false)).join('\n')}
  </div>
</details>` : ''}` : `
<p class="dnv-empty">The latest stories are available at <a href="${SITE_URL}" target="_blank" rel="noopener">danangvoice.com</a>.</p>`;

  return `${START}
<section class="dnv-news" aria-labelledby="dnv-heading" data-generated="${generatedAt.toISOString()}" data-count="${stories.length}">
<div class="dnv-head">
  <div>
    <p class="dnv-kicker">Latest Da Nang news for travellers</p>
    <h2 id="dnv-heading" class="dnv-heading">This week in Da Nang</h2>
  </div>
  <p class="dnv-attrib">News provided by <a href="${SITE_URL}" target="_blank" rel="noopener">Da Nang Voice</a></p>
</div>${body}
<p class="dnv-all"><a href="${SITE_URL}" target="_blank" rel="noopener">See all stories on Da Nang Voice &rarr;</a></p>
</section>
${END}`;
}

function injectIntoPage(html, sectionHtml) {
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a < 0 || b < a) throw new Error('DNV markers not found in template');
  return html.slice(0, a) + sectionHtml + html.slice(b + END.length);
}

// Full pipeline. Throws if the feed is unusable, so callers can fall back.
async function buildSection(opts = {}) {
  const xml = opts.xml || await fetchFeed(opts.timeoutMs);
  const all = parseFeed(xml);
  if (!all.length) throw new Error('feed has no items');
  const stories = selectStories(all);
  if (stories.length < 3) throw new Error(`only ${stories.length} relevant stories`);
  return { html: renderSection(stories), stories };
}

module.exports = { FEED_URL, START, END, fetchFeed, parseFeed, isRelevant, selectStories, renderSection, injectIntoPage, buildSection };
