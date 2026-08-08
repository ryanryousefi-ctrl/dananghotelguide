#!/usr/bin/env python3
"""
unify-nav.py
Replaces every non-index page's top navigation with the canonical index.html nav.

Strategy:
- The canonical NAV markup is the template below (with ACTIVE_MARKER as placeholder)
- The canonical MOBILE MENU markup is below (with ACTIVE_MARKER as placeholder)
- The canonical NAV CSS replaces per-page nav CSS blocks
- Per-page active state is preserved by reading the current page filename
- Pages with the old "nav-inner" pattern get a full replacement
- Pages with the "nav-link/nav-dropdown" pattern get their HTML replaced to match canonical
- Nav CSS block in each <style> tag is replaced

Active state logic:
- index.html              -> Home is active
- hotel-reviews.html      -> Reviews is active
- where-to-stay*.html     -> Where to Stay is active
- dining.html / best-bars / best-cafes / da-nang-hoi-an-markets -> Food & Nightlife active
- guides.html / things-to-do / itinerary / transport / first-time / budget / digital-nomad -> Guides active
- best-hotels-in-da-nang / da-nang-beach / da-nang-riverfront / luxury / family / boutique / hotels.html -> Hotels active
- hoi-an* / da-nang-vs-hoi-an / where-to-stay-in-hoi-an / best-hotels-in-hoi-an etc -> Hoi An active
- news.html / da-nang-*-2026.html (news content) -> News active
- about / contact / privacy / terms / editorial -> About active
- da-nang-videos -> Videos active
- everything else -> no active
"""

import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).parent.parent

# ── Canonical CSS (replaces the per-page nav CSS block) ─────────────────────
# Scoped tightly to .site-nav and descendants; does NOT affect any other elements
CANONICAL_NAV_CSS = """\
/* ─── SITE NAV (canonical) ──────────────────────────────── */
.site-nav{
  position:sticky;top:0;z-index:500;
  height:68px;
  background:#0A0A0A;
  border-bottom:1px solid rgba(255,255,255,.08);
  display:flex;align-items:center;
  padding:0 var(--gutter);
}
.nav-logo{
  font-family:var(--font-serif);font-size:1.3rem;
  color:#fff;letter-spacing:-.01em;flex-shrink:0;
  margin-right:clamp(1.5rem,3.5vw,3rem);
  display:inline-flex;align-items:baseline;gap:.35em;
}
.nav-logo em{font-style:italic;color:var(--coral)}
.nav-links{display:flex;align-items:center;gap:0;flex:1;}
.nav-link{
  position:relative;
  padding:8px 14px;
  font-size:.8rem;font-weight:700;letter-spacing:.03em;
  text-transform:uppercase;
  color:rgba(255,255,255,.55);
  transition:color .18s;
  white-space:nowrap;
}
.nav-link:hover{color:#fff}
.nav-link.active{color:#fff}
.nav-link.active::after{
  content:'';position:absolute;bottom:-1px;left:14px;right:14px;
  height:2px;background:var(--coral);border-radius:1px;
}
.nav-dropdown{position:relative;}
.nav-dropdown-toggle::after{
  content:'';display:inline-block;
  width:5px;height:5px;
  border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;
  transform:rotate(45deg) translateY(-2px);margin-left:5px;
  transition:transform .2s;
}
.nav-dropdown:hover .nav-dropdown-toggle::after,
.nav-dropdown-toggle[aria-expanded="true"]::after{transform:rotate(-135deg) translateY(-2px);}
.nav-dropdown-menu{
  position:absolute;top:calc(100% + 4px);left:0;
  min-width:210px;
  background:#111;
  border:1px solid rgba(255,255,255,.1);
  border-top:2px solid var(--coral);
  border-radius:0 0 8px 8px;
  padding:.4rem;
  opacity:0;visibility:hidden;transform:translateY(-4px);
  transition:opacity .18s,visibility .18s,transform .18s;
  box-shadow:0 20px 48px rgba(0,0,0,.5);
  z-index:600;
}
.nav-dropdown:hover .nav-dropdown-menu,
.nav-dropdown-menu:focus-within{opacity:1;visibility:visible;transform:translateY(0);}
.nav-dropdown-item{
  display:flex;align-items:center;gap:8px;
  padding:9px 12px;
  font-size:.78rem;font-weight:600;
  color:rgba(255,255,255,.55);
  border-radius:4px;
  transition:color .12s,background .12s;
  letter-spacing:.02em;text-transform:uppercase;
}
.nav-dropdown-item:hover{color:#fff;background:rgba(255,255,255,.05)}
.nav-dropdown-item .di-icon{font-size:.85rem;width:18px;text-align:center;flex-shrink:0;display:none}
.nav-right{display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0;}
.nav-search-btn{
  display:flex;align-items:center;justify-content:center;
  width:36px;height:36px;border:1px solid rgba(255,255,255,.15);cursor:pointer;
  background:transparent;border-radius:4px;
  color:rgba(255,255,255,.6);transition:background .15s,color .15s;
}
.nav-search-btn:hover{background:rgba(255,255,255,.1);color:#fff}
.nav-search-btn svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2.2}
.nav-stays-btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:9px 18px;
  background:var(--coral);color:#fff;
  font-size:.75rem;font-weight:800;
  letter-spacing:.06em;text-transform:uppercase;
  border-radius:4px;white-space:nowrap;
  transition:background .15s,transform .12s;
  border:none;cursor:pointer;text-decoration:none;
}
.nav-stays-btn:hover{background:var(--coral-light);transform:translateY(-1px)}
.nav-hamburger{
  display:none;flex-direction:column;justify-content:center;gap:5px;
  width:40px;height:40px;background:rgba(255,255,255,.07);border:none;cursor:pointer;
  border-radius:4px;padding:10px;margin-left:8px;
}
.nav-hamburger span{display:block;height:2px;background:#fff;border-radius:2px;transition:transform .25s,opacity .25s;}
.nav-hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.nav-hamburger.open span:nth-child(2){opacity:0}
.nav-hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
/* ─── MOBILE MENU ──────────────────────────────────────── */
.mobile-menu{
  position:fixed;inset:0;z-index:450;background:#0A0A0A;
  transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);
  display:flex;flex-direction:column;
  padding:calc(68px + 1.5rem) var(--gutter) 2rem;overflow-y:auto;
}
.mobile-menu.open{transform:translateX(0)}
.mobile-nav-link{display:flex;align-items:center;justify-content:space-between;padding:15px 0;font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:rgba(255,255,255,.65);border-bottom:1px solid rgba(255,255,255,.06);transition:color .15s;}
.mobile-nav-link:hover{color:#fff}
.mobile-nav-link.active{color:var(--coral)}
.mobile-dropdown-items{padding-left:1rem;max-height:0;overflow:hidden;transition:max-height .3s cubic-bezier(.4,0,.2,1);}
.mobile-dropdown-items.open{max-height:500px}
.mobile-sub-link{display:block;padding:10px 0;font-size:.85rem;color:rgba(255,255,255,.45);border-bottom:1px solid rgba(255,255,255,.04);transition:color .15s;}
.mobile-sub-link:hover{color:#fff}
.mobile-stays-btn{display:block;margin-top:2rem;padding:16px;background:var(--coral);color:#fff;text-align:center;font-size:.88rem;font-weight:800;border-radius:4px;letter-spacing:.05em;text-transform:uppercase;}
@media(max-width:768px){
  .nav-links{display:none}
  .nav-hamburger{display:flex}
  .nav-stays-btn .btn-text{display:none}
}"""

# ── Canonical NAV HTML (for building per-page versions) ──────────────────────
# Uses %%ACTIVE_%% placeholder tokens that get replaced per-page

def build_nav_html(active_key):
    """Build the full <nav> block with the right .active class set."""

    def a(key, label, *classes):
        cls_list = list(classes)
        if active_key == key:
            cls_list.append('active')
        cls = ' '.join(cls_list)
        return f'class="{cls}"' if cls else ''

    home_cls      = a('home',     'Home',          'nav-link')
    hotels_cls    = a('hotels',   'Hotels',        'nav-link', 'nav-dropdown-toggle')
    wts_cls       = a('wts',      'Where to Stay', 'nav-link')
    guides_cls    = a('guides',   'Guides',        'nav-link', 'nav-dropdown-toggle')
    food_cls      = a('food',     'Food',          'nav-link', 'nav-dropdown-toggle')
    reviews_cls   = a('reviews',  'Reviews',       'nav-link')
    hoian_cls     = a('hoian',    'Hoi An',        'nav-link', 'nav-dropdown-toggle')
    news_cls      = a('news',     'News',          'nav-link', 'nav-dropdown-toggle')
    about_cls     = a('about',    'About',         'nav-link')
    videos_cls    = a('videos',   'Videos',        'nav-link')

    # mobile active class
    def ma(key):
        return ' active' if active_key == key else ''

    return f"""<nav class="site-nav" role="navigation" aria-label="Main navigation">
  <a href="index.html" class="nav-logo">Da Nang <em>Hotel Guide</em></a>
  <div class="nav-links" role="list">
    <a href="index.html" {home_cls}>Home</a>
    <div class="nav-dropdown">
      <a href="hotels.html" {hotels_cls} aria-expanded="false" aria-haspopup="true">Hotels</a>
      <div class="nav-dropdown-menu" role="menu">
        <a href="best-hotels-in-da-nang.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Best Hotels</a>
        <a href="da-nang-beach-hotels.html"    class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Beachfront</a>
        <a href="da-nang-riverfront-hotels.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Riverside</a>
        <a href="luxury-hotels-da-nang.html"   class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Luxury</a>
        <a href="family-hotels-da-nang.html"   class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Family</a>
        <a href="boutique-hotels-da-nang.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Boutique</a>
      </div>
    </div>
    <a href="where-to-stay-in-da-nang.html" {wts_cls}>Where to Stay</a>
    <div class="nav-dropdown">
      <a href="guides.html" {guides_cls} aria-expanded="false" aria-haspopup="true">Guides</a>
      <div class="nav-dropdown-menu" role="menu">
        <a href="things-to-do-in-da-nang.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">🗺</span>Things To Do</a>
        <a href="da-nang-itinerary.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">📅</span>Itineraries</a>
        <a href="da-nang-transport-guide.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">🚗</span>Getting Around</a>
        <a href="da-nang-first-time-visitors.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">✈</span>First Timers</a>
        <a href="best-time-to-visit-da-nang.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">☀</span>Best Time to Visit</a>
        <a href="da-nang-budget-guide.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">💰</span>Budget Guide</a>
        <a href="da-nang-digital-nomad-guide.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">💻</span>Digital Nomads</a>
      </div>
    </div>
    <div class="nav-dropdown">
      <a href="dining.html" {food_cls} aria-expanded="false" aria-haspopup="true">Food &amp; Nightlife</a>
      <div class="nav-dropdown-menu" role="menu">
        <a href="dining.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">🍜</span>Dining Guide</a>
        <a href="best-bars-in-da-nang.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">🍸</span>Best Bars</a>
        <a href="best-cafes-da-nang.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">☕</span>Best Cafes</a>
        <a href="da-nang-hoi-an-markets-guide.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">🛒</span>Markets Guide</a>
      </div>
    </div>
    <a href="hotel-reviews.html" {reviews_cls}>Reviews</a>
    <div class="nav-dropdown">
      <a href="hoi-an.html" {hoian_cls} aria-expanded="false" aria-haspopup="true">Hoi An</a>
      <div class="nav-dropdown-menu" role="menu">
        <a href="hoi-an.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Hoi An Travel Guide</a>
        <a href="da-nang-vs-hoi-an.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Da Nang vs Hoi An</a>
        <a href="where-to-stay-in-hoi-an.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Where to Stay in Hoi An</a>
        <a href="best-hotels-in-hoi-an.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Best Hotels Hoi An</a>
        <a href="best-value-hotels-hoi-an.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Best Value Hotels</a>
        <a href="hoi-an-old-town-hotels.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Old Town Hotels</a>
        <a href="an-bang-beach-hotels.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>An Bang Beach Hotels</a>
        <a href="da-nang-airport-to-hoi-an.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Airport to Hoi An</a>
        <a href="is-hoi-an-cheaper-than-da-nang.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Is Hoi An Cheaper?</a>
      </div>
    </div>
    <div class="nav-dropdown">
      <a href="news.html" {news_cls} aria-expanded="false" aria-haspopup="true">News</a>
      <div class="nav-dropdown-menu" role="menu">
        <a href="news.html" class="nav-dropdown-item" role="menuitem"><span class="di-icon">★</span>Latest News</a>
      </div>
    </div>
    <a href="about.html" {about_cls}>About</a>
    <a href="da-nang-videos.html" {videos_cls}>Videos</a>
  </div>
  <div class="nav-right">
    <button class="nav-search-btn" id="searchOpenBtn" aria-label="Search site" aria-expanded="false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
    </button>
    <a href="https://www.booking.com/searchresults.en-us.html?ss=Da+Nang+Municipality,+Vietnam&dest_id=6232&dest_type=region&lang=en-us&aid=1784897" class="nav-stays-btn affiliate-link" target="_blank" rel="nofollow noopener sponsored">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span class="btn-text">Search Stays</span>
    </a>
    <button class="nav-hamburger" id="navHamburger" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu" aria-hidden="true">
  <a href="index.html" class="mobile-nav-link{ma('home')}">Home</a>
  <div>
    <a href="hotels.html" class="mobile-nav-link{ma('hotels')}" id="mobileHotelsToggle">Hotels <span style="font-size:.8rem;opacity:.5">▾</span></a>
    <div class="mobile-dropdown-items" id="mobileHotelsSub">
      <a href="best-hotels-in-da-nang.html" class="mobile-sub-link">Best Hotels</a>
      <a href="da-nang-beach-hotels.html" class="mobile-sub-link">Beachfront Hotels</a>
      <a href="da-nang-riverfront-hotels.html" class="mobile-sub-link">Riverside Hotels</a>
      <a href="luxury-hotels-da-nang.html" class="mobile-sub-link">Luxury Hotels</a>
      <a href="family-hotels-da-nang.html" class="mobile-sub-link">Family Hotels</a>
      <a href="boutique-hotels-da-nang.html" class="mobile-sub-link">Boutique Hotels</a>
    </div>
  </div>
  <a href="where-to-stay-in-da-nang.html" class="mobile-nav-link{ma('wts')}">Where to Stay</a>
  <div>
    <a href="guides.html" class="mobile-nav-link{ma('guides')}">Guides <span style="font-size:.8rem;opacity:.5">▾</span></a>
    <div class="mobile-dropdown-items">
      <a href="things-to-do-in-da-nang.html" class="mobile-sub-link">Things To Do</a>
      <a href="da-nang-itinerary.html" class="mobile-sub-link">Itineraries</a>
      <a href="da-nang-transport-guide.html" class="mobile-sub-link">Getting Around</a>
      <a href="da-nang-first-time-visitors.html" class="mobile-sub-link">First Timers</a>
      <a href="best-time-to-visit-da-nang.html" class="mobile-sub-link">Best Time to Visit</a>
      <a href="da-nang-budget-guide.html" class="mobile-sub-link">Budget Guide</a>
    </div>
  </div>
  <div>
    <a href="dining.html" class="mobile-nav-link{ma('food')}">Food &amp; Nightlife <span style="font-size:.8rem;opacity:.5">▾</span></a>
    <div class="mobile-dropdown-items">
      <a href="dining.html" class="mobile-sub-link">Dining Guide</a>
      <a href="best-bars-in-da-nang.html" class="mobile-sub-link">Best Bars</a>
      <a href="best-cafes-da-nang.html" class="mobile-sub-link">Best Cafes</a>
      <a href="da-nang-hoi-an-markets-guide.html" class="mobile-sub-link">Markets Guide</a>
    </div>
  </div>
  <a href="hotel-reviews.html" class="mobile-nav-link{ma('reviews')}">Reviews</a>
  <div>
    <a href="hoi-an.html" class="mobile-nav-link{ma('hoian')}">Hoi An <span style="font-size:.8rem;opacity:.5">▾</span></a>
    <div class="mobile-dropdown-items">
      <a href="hoi-an.html" class="mobile-sub-link">Hoi An Travel Guide</a>
      <a href="da-nang-vs-hoi-an.html" class="mobile-sub-link">Da Nang vs Hoi An</a>
      <a href="where-to-stay-in-hoi-an.html" class="mobile-sub-link">Where to Stay in Hoi An</a>
      <a href="best-hotels-in-hoi-an.html" class="mobile-sub-link">Best Hotels Hoi An</a>
      <a href="best-value-hotels-hoi-an.html" class="mobile-sub-link">Best Value Hotels</a>
      <a href="hoi-an-old-town-hotels.html" class="mobile-sub-link">Old Town Hotels</a>
      <a href="an-bang-beach-hotels.html" class="mobile-sub-link">An Bang Beach Hotels</a>
      <a href="da-nang-airport-to-hoi-an.html" class="mobile-sub-link">Airport to Hoi An</a>
      <a href="is-hoi-an-cheaper-than-da-nang.html" class="mobile-sub-link">Is Hoi An Cheaper?</a>
    </div>
  </div>
  <div>
    <a href="news.html" class="mobile-nav-link{ma('news')}">News <span style="font-size:.8rem;opacity:.5">▾</span></a>
    <div class="mobile-dropdown-items">
      <a href="news.html" class="mobile-sub-link">Latest News</a>
    </div>
  </div>
  <a href="about.html" class="mobile-nav-link{ma('about')}">About</a>
  <a href="da-nang-videos.html" class="mobile-nav-link{ma('videos')}">Videos</a>
  <a href="https://www.booking.com/searchresults.en-us.html?ss=Da+Nang+Municipality,+Vietnam&dest_id=6232&dest_type=region&lang=en-us&aid=1784897" class="mobile-stays-btn affiliate-link" target="_blank" rel="nofollow noopener sponsored">Search Stays on Booking.com →</a>
</div>"""


def get_active_key(filename):
    f = filename.lower()
    if f == 'index.html':
        return 'home'
    if f in ('hotel-reviews.html',) or f.startswith('review-'):
        return 'reviews'
    if f in ('where-to-stay-in-da-nang.html', 'where-to-stay.html'):
        return 'wts'
    if f in ('dining.html', 'best-bars-in-da-nang.html', 'best-cafes-da-nang.html',
             'da-nang-hoi-an-markets-guide.html', 'da-nang-nightlife-guide.html',
             'da-nang-food-guide.html', 'best-night-markets-da-nang.html',
             'han-river-night-cruise-da-nang.html'):
        return 'food'
    if f in ('guides.html', 'things-to-do-in-da-nang.html', 'da-nang-itinerary.html',
             'da-nang-3-day-itinerary.html', 'da-nang-5-day-itinerary.html',
             'da-nang-7-day-itinerary.html', 'da-nang-transport-guide.html',
             'da-nang-first-time-visitors.html', 'da-nang-first-time-visitors-area-guide.html',
             'da-nang-first-time-travel-guide.html', 'best-time-to-visit-da-nang.html',
             'worst-time-to-visit-da-nang.html', 'da-nang-budget-guide.html',
             'da-nang-digital-nomad-guide.html', 'da-nang-travel-budget-guide.html',
             'da-nang-travel-mistakes.html', 'da-nang-tourist-mistakes.html',
             'da-nang-with-kids-guide.html', 'da-nang-with-teenagers.html',
             'da-nang-weather-by-month.html', 'rainy-season-da-nang-guide.html',
             'what-to-pack-for-da-nang.html', 'how-many-days-in-da-nang.html',
             'da-nang-airport-guide.html', 'da-nang-airport-to-my-khe.html',
             'da-nang-grab-guide.html', 'da-nang-sim-card-guide.html',
             'da-nang-money-exchange-guide.html', 'da-nang-visa-run-guide.html',
             'da-nang-time-converter.html', 'marble-mountains-da-nang.html',
             'ba-na-hills-guide.html', 'dragon-bridge-da-nang.html',
             'my-khe-beach-da-nang.html', 'non-nuoc-beach-da-nang.html',
             'son-tra-peninsula-da-nang.html', 'is-da-nang-walkable.html',
             'living-in-da-nang-expat-guide.html', 'how-to-live-in-da-nang-under-1000-a-month.html',
             'da-nang-grocery-store-guide.html', 'airbnb.html', 'best-shopping-da-nang.html',
             'da-nang-malls-guide.html', 'da-nang-malls-guide-ko.html'):
        return 'guides'
    if f in ('hotels.html', 'best-hotels-in-da-nang.html', 'da-nang-beach-hotels.html',
             'da-nang-riverfront-hotels.html', 'luxury-hotels-da-nang.html',
             'family-hotels-da-nang.html', 'boutique-hotels-da-nang.html',
             'best-budget-hotels-in-da-nang.html', 'da-nang-honeymoon-hotels.html',
             'da-nang-adults-only-hotels.html', 'da-nang-hotels-infinity-pool.html',
             'da-nang-hotels-rooftop-pool.html', 'da-nang-hotels-private-pool-villa.html',
             'da-nang-hotels-private-beach.html', 'da-nang-hotels-kids-club.html',
             'da-nang-hotels-connecting-rooms.html', 'da-nang-hotels-spa-packages.html',
             'da-nang-hotels-with-lazy-river.html', 'da-nang-hotels-map.html',
             'da-nang-hotels-near-airport.html', 'da-nang-hotel-prices.html',
             'da-nang-hotel-prices-by-month.html', 'guides-da-nang-hotel-prices-by-month.html',
             'best-hotels-an-thuong-da-nang.html', 'best-hotels-near-my-khe-beach.html',
             'best-han-river-hotels-da-nang.html', 'best-resorts-son-tra-peninsula.html',
             'best-luxury-resort-couples-da-nang.html', 'best-family-resort-da-nang.html',
             'best-areas-da-nang-families.html', 'best-beach-hotel-under-100-da-nang.html',
             'best-resort-breakfast-da-nang.html', 'da-nang-quiet-areas-hotels.html',
             'da-nang-fireworks-festival-hotels.html', 'da-nang-tet-2027-hotels.html',
             'da-nang-hotels-private-pool-villa.html'):
        return 'hotels'
    # individual hotel pages
    hotel_slugs = [
        'a-la-carte-da-nang', 'brilliant-hotel-da-nang', 'four-points-sheraton-da-nang',
        'furama-resort-da-nang', 'fusion-suites-da-nang', 'grand-mercure-da-nang',
        'hilton-da-nang', 'hyatt-regency-da-nang', 'intercontinental-da-nang',
        'marriott-resort-da-nang', 'melia-da-nang', 'melia-vinpearl-da-nang',
        'mikazuki-da-nang', 'muong-thanh-luxury-da-nang', 'naman-retreat-da-nang',
        'novotel-da-nang-han-river', 'premier-village-da-nang', 'pullman-da-nang',
        'radisson-blu-da-nang', 'sheraton-grand-da-nang', 'silk-path-grand-da-nang',
        'tia-wellness-resort-da-nang', 'tms-hotel-da-nang', 'vinpearl-luxury-da-nang',
        'wyndham-soleil-da-nang', 'azura-da-nang', 'arbora-luxury-collection-da-nang',
    ]
    comparison_slugs = [
        '-vs-', 'hyatt-regency-vs-', 'intercontinental-vs-', 'marriott-vs-',
        'pullman-vs-', 'furama-vs-', 'novotel-vs-', 'melia-vs-', 'sheraton-vs-',
        'premier-village-vs-', 'mandila-beach-vs-', 'tms-hotel-vs-', 'tia-wellness-vs-',
        'a-la-carte-vs-', 'four-points-vs-',
    ]
    if any(f.startswith(slug) or f == slug + '.html' for slug in hotel_slugs):
        return 'hotels'
    if any(slug in f for slug in comparison_slugs):
        return 'hotels'
    if f in ('hoi-an.html', 'da-nang-vs-hoi-an.html', 'where-to-stay-in-hoi-an.html',
             'best-hotels-in-hoi-an.html', 'best-value-hotels-hoi-an.html',
             'hoi-an-old-town-hotels.html', 'an-bang-beach-hotels.html',
             'da-nang-airport-to-hoi-an.html', 'is-hoi-an-cheaper-than-da-nang.html',
             'hoi-an-da-nang-travel-leisure-hidden-gems-2026.html',
             'hoi-an-first-time-visitors.html'):
        return 'hoian'
    if f in ('news.html',) or any(x in f for x in [
        '-2026.html', '-2027.html', 'vietnam-tourism-boom', 'da-nang-russia-cis-air',
        'da-nang-vladivostok', 'da-nang-eco-city', 'da-nang-urban-railway',
        'da-nang-fireworks-festival-diff', 'hoi-an-da-nang-travel-leisure'
    ]):
        return 'news'
    if f in ('about.html', 'contact.html', 'privacy.html', 'terms.html',
             'editorial-policy.html', 'hotel-review-methodology.html',
             'why-trust-us.html', 'search.html', 'site-preview.html',
             'favicon-html-snippet.html'):
        return 'about'
    if f in ('da-nang-videos.html',):
        return 'videos'
    return ''  # no active state


# ── Nav JS (the minimal script needed on non-index pages) ────────────────────
NAV_JS = """<script>
(function(){
  var ham=document.getElementById('navHamburger');
  var mob=document.getElementById('mobileMenu');
  if(ham&&mob){
    ham.addEventListener('click',function(){
      var open=mob.classList.toggle('open');
      ham.classList.toggle('open',open);
      ham.setAttribute('aria-expanded',open);
      mob.setAttribute('aria-hidden',!open);
      document.body.style.overflow=open?'hidden':'';
    });
  }
  var hotTgl=document.getElementById('mobileHotelsToggle');
  var hotSub=document.getElementById('mobileHotelsSub');
  if(hotTgl&&hotSub){
    hotTgl.addEventListener('click',function(e){e.preventDefault();hotSub.classList.toggle('open');});
  }
  if(mob){
    mob.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){
        mob.classList.remove('open');
        if(ham){ham.classList.remove('open');ham.setAttribute('aria-expanded','false');}
        document.body.style.overflow='';
      });
    });
  }
  document.querySelectorAll('.nav-dropdown-toggle').forEach(function(toggle){
    toggle.addEventListener('click',function(e){
      var menu=this.parentNode.querySelector('.nav-dropdown-menu');
      if(!menu)return;
      var expanded=this.getAttribute('aria-expanded')==='true';
      this.setAttribute('aria-expanded',!expanded);
    });
  });
})();
</script>"""

# ── Patterns to detect and remove old nav CSS blocks ────────────────────────
# These patterns match the start of nav-related CSS in various page styles
NAV_CSS_PATTERNS = [
    # nav-inner pattern (simple pages)
    r'\.site-nav\{[^}]*\}[\s\S]*?\.nav-cta[^}]*\}[\s\S]*?@media[^{]*\{[^}]*\.nav-links[^}]*\}[^}]*\}',
    # nav-link/nav-dropdown pattern (editorial pages)
    r'\.site-nav\{[\s\S]*?(?=\/\*\s*(?:─|═|HERO|ARTICLE|MAIN|SECTION|CONTENT|body\b)|<\/style>)',
]

# ── CSS tokens that must exist for nav to render correctly ───────────────────
# Added to :root if not already present
REQUIRED_TOKENS = {
    '--coral': '#C8604A',
    '--coral-light': '#E07A62',
    '--font-serif': "'Instrument Serif', Georgia, serif",
    '--font-sans': "'Satoshi', system-ui, sans-serif",
    '--gutter': '1.5rem',
}


def has_required_tokens(content):
    return '--coral:' in content and '--font-serif:' in content


def ensure_tokens(content):
    """If page has no :root with required tokens, inject a minimal one."""
    if has_required_tokens(content):
        return content
    token_block = ':root{'
    for k, v in REQUIRED_TOKENS.items():
        token_block += f'{k}:{v};'
    token_block += '}\n'
    # Insert before first <style> closing tag
    return content.replace('</style>', token_block + '</style>', 1)


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)

    # Skip index.html — it's the source of truth
    if filename == 'index.html':
        return False

    original = content

    # ── 1. Determine active key ──────────────────────────────────
    active_key = get_active_key(filename)

    # ── 2. Build canonical nav HTML ─────────────────────────────
    canonical_nav = build_nav_html(active_key)

    # ── 3. Replace existing nav block ───────────────────────────
    # Match: <nav class="site-nav"...>...</nav>
    # Then optionally a <div class="mobile-menu"...>...</div>
    # The replacement is our canonical nav + mobile menu

    # Pattern for nav-inner style (simple pages)
    nav_inner_pattern = re.compile(
        r'<nav[^>]*class="site-nav"[^>]*>.*?<div[^>]*class="nav-inner"[^>]*>.*?</div>\s*</nav>',
        re.DOTALL
    )

    # Pattern for full nav with/without mobile menu following
    nav_full_pattern = re.compile(
        r'<nav[^>]*class="site-nav"[^>]*>[\s\S]*?</nav>'
        r'(?:\s*<!--[^>]*-->\s*)?'
        r'(?:\s*<div[^>]*class="mobile-menu"[^>]*>[\s\S]*?</div>)?',
        re.DOTALL
    )

    if nav_inner_pattern.search(content):
        # Old simple nav-inner pattern — replace just the nav (no mobile menu existed)
        content = nav_inner_pattern.sub(canonical_nav, content, count=1)
    elif nav_full_pattern.search(content):
        content = nav_full_pattern.sub(canonical_nav, content, count=1)
    else:
        print(f'  WARNING: no nav pattern found in {filename}')
        return False

    # ── 4. Replace nav CSS in <style> block ─────────────────────
    # Find the style block and replace nav-related CSS
    style_pattern = re.compile(r'(<style>)([\s\S]*?)(</style>)', re.DOTALL)

    def replace_nav_css(m):
        open_tag = m.group(1)
        css = m.group(2)
        close_tag = m.group(3)

        # Remove old nav CSS — everything from .site-nav{ up to (but not including)
        # the first non-nav section (identified by comment or hero/body selectors)
        # Strategy: find .site-nav{ and remove to the boundary

        # Remove entire existing nav/mobile CSS block
        # Match from .site-nav to just before the next major section
        nav_css_re = re.compile(
            r'(/\*\s*[─═\-]+\s*(?:SITE\s*NAV|NAV)\s*[─═\-]+[\s\S]*?\*/)?\s*'
            r'\.site-nav\s*\{[\s\S]*?'
            r'(?='
            r'(?:/\*\s*[─═\-]{2,})|'
            r'(?:html\s*\{)|'
            r'(?:body\s*\{)|'
            r'(?:img\s*\{)|'
            r'(?:a\s*\{)|'
            r'(?:\*,\s*\*)|'
            r'(?:\.hero\b)|'
            r'(?:\.wrap\b)|'
            r'(?:\.section\b)|'
            r'(?:@keyframes)|'
            r'(?:@font-face)|'
            r'(?:\.article\b)|'
            r'(?:\.dbh-\b)|'
            r'(?:\.ch-\b)|'
            r'(?:\.lx-\b)|'
            r'(?:\.fh-\b)|'
            r'(?:\.bt-\b)|'
            r'(?:\.ws-\b)|'
            r'(?:\.din-\b)|'
            r'(?:\.hr-\b)|'
            r'(?:\.rev-\b)|'
            r'(?:\.bh-\b)|'
            r'$'
            r')',
            re.DOTALL
        )

        css_cleaned = nav_css_re.sub('', css, count=1)

        # Also remove stray .mobile-menu / .mobile-nav-link blocks if they remain
        mobile_re = re.compile(
            r'(?:/\*\s*[─═\-]*\s*MOBILE[^*]*\*/)?\s*\.mobile-menu\s*\{[\s\S]*?'
            r'(?='
            r'(?:/\*\s*[─═\-]{2,})|'
            r'(?:\.hero\b)|'
            r'(?:\.wrap\b)|'
            r'(?:\.article\b)|'
            r'(?:\.section\b)|'
            r'(?:html\s*\{)|'
            r'(?:body\s*\{)|'
            r'(?:@keyframes)|'
            r'(?:$)'
            r')',
            re.DOTALL
        )
        css_cleaned = mobile_re.sub('', css_cleaned, count=1)

        # Remove old responsive nav overrides (nav-links display:none in media queries)
        # These will be handled by the canonical CSS we're injecting
        # Don't touch other media query content

        # Inject canonical nav CSS at the start of the style block
        new_css = '\n' + CANONICAL_NAV_CSS + '\n' + css_cleaned.lstrip('\n')

        return open_tag + new_css + close_tag

    # Only replace the FIRST <style> block (page-level styles)
    count = [0]
    def replace_first_style(m):
        if count[0] == 0:
            count[0] += 1
            return replace_nav_css(m)
        return m.group(0)

    content = style_pattern.sub(replace_first_style, content)

    # ── 5. Ensure nav tokens exist ──────────────────────────────
    content = ensure_tokens(content)

    # ── 6. Inject nav JS if missing ─────────────────────────────
    # Check if the page already has hamburger/mobile menu JS
    has_nav_js = 'navHamburger' in content and 'addEventListener' in content

    if not has_nav_js:
        # Inject before </body> or before CJ script
        if 'anrdoezrs.net' in content:
            content = content.replace(
                '<script src="https://www.anrdoezrs.net',
                NAV_JS + '\n<script src="https://www.anrdoezrs.net',
                1
            )
        elif '</body>' in content:
            content = content.replace('</body>', NAV_JS + '\n</body>', 1)

    # ── 7. Write if changed ─────────────────────────────────────
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    html_files = sorted(REPO.glob('*.html'))
    changed = []
    skipped = []
    errors = []

    for filepath in html_files:
        filename = filepath.name
        if filename == 'index.html':
            continue
        try:
            result = process_file(filepath)
            if result:
                changed.append(filename)
                print(f'  ✓ {filename}')
            else:
                skipped.append(filename)
        except Exception as e:
            errors.append((filename, str(e)))
            print(f'  ✗ {filename}: {e}')

    print(f'\nDone: {len(changed)} changed, {len(skipped)} skipped, {len(errors)} errors')
    if errors:
        print('Errors:')
        for fname, err in errors:
            print(f'  {fname}: {err}')
    return len(errors)


if __name__ == '__main__':
    sys.exit(main())
