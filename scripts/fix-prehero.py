#!/usr/bin/env python3
"""
fix-prehero.py
Fixes two regressions introduced by unify-nav.py:

1. ORPHANED OLD MOBILE NAV (88 pages)
   The nav-replacement regex matched the first </div> of the old mobile menu
   but left trailing mobile-nav-link / mobile-stays-btn items in document flow.
   Fix: remove everything between the new mobile-menu closing </div> and the
   next legitimate block (search-overlay, breadcrumb, main, header.*, body classes).

2. SEARCH OVERLAY VISIBLE (94 pages)
   Pages that had a search-overlay div but no CSS hiding it — the canonical
   nav CSS injected by unify-nav.py didn't include search-overlay rules.
   Fix: inject the search-overlay hidden CSS into every page that has the div.
"""

import re, os, sys
from pathlib import Path

REPO = Path(__file__).parent.parent

SEARCH_OVERLAY_CSS = """\
/* ─── SEARCH OVERLAY ────────────────────────────────────── */
.search-overlay{
  position:fixed;inset:0;z-index:900;
  background:rgba(0,0,0,.97);
  display:flex;flex-direction:column;align-items:center;
  padding:clamp(4rem,10vh,7rem) var(--gutter) 2rem;
  opacity:0;visibility:hidden;transition:opacity .2s,visibility .2s;
  pointer-events:none;
}
.search-overlay.open{opacity:1;visibility:visible;pointer-events:auto}
.search-close{
  position:absolute;top:1.5rem;right:var(--gutter);
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
  cursor:pointer;color:rgba(255,255,255,.6);
  width:40px;height:40px;border-radius:4px;
  display:flex;align-items:center;justify-content:center;
  font-size:1.2rem;transition:background .15s,color .15s;
}
.search-close:hover{background:rgba(255,255,255,.15);color:#fff}
.search-overlay-label{font-size:.65rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:1rem;}
.search-input-wrap{position:relative;width:100%;max-width:700px;margin-bottom:1.5rem;}
.search-input{
  width:100%;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.15);
  border-bottom:2px solid var(--coral,#C8604A);
  border-radius:0;
  padding:18px 60px 18px 0;
  font-family:var(--font-serif,'Instrument Serif',Georgia,serif);font-size:clamp(1.5rem,3vw,2.2rem);
  color:#fff;outline:none;transition:border-color .2s;
}
.search-input::placeholder{color:rgba(255,255,255,.2)}
.search-input:focus{border-bottom-color:#fff}
.search-submit-icon{position:absolute;right:4px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,.4);}
.search-submit-icon svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2}
.search-results-inline{width:100%;max-width:700px;display:flex;flex-direction:column;gap:2px;max-height:50vh;overflow-y:auto;}
.sri{display:flex;gap:14px;align-items:flex-start;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.06);padding:16px 0;cursor:pointer;transition:background .12s;text-decoration:none;color:inherit;}
.sri:hover{background:rgba(255,255,255,.07)}
.sri-cat{font-size:.62rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--coral,#C8604A);white-space:nowrap;margin-top:3px;min-width:80px;}
.sri-body{flex:1;min-width:0}
.sri-title{font-family:var(--font-serif,'Instrument Serif',Georgia,serif);font-size:1rem;color:#fff;margin-bottom:4px}
.sri-excerpt{font-size:.78rem;color:rgba(255,255,255,.4);line-height:1.5;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.search-no-results{color:rgba(255,255,255,.35);font-size:.9rem;padding:1rem 0}
.search-hint{margin-top:1.5rem;display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;}
.sh-pill{padding:7px 16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:4px;font-size:.72rem;font-weight:700;color:rgba(255,255,255,.45);cursor:pointer;transition:background .12s,color .12s;letter-spacing:.04em;text-transform:uppercase;}
.sh-pill:hover{background:rgba(255,255,255,.1);color:#fff}"""


def fix_orphaned_nav(content):
    """
    Remove stale mobile-nav-link / mobile-stays-btn content that appears
    AFTER the new mobile-menu closing </div> but BEFORE the next real section.

    The orphan looks like:
        </div>           <- end of new mobile-menu
          </div>         <- stray fragment from old nav's unclosed wrapper
          <a href="..." class="mobile-nav-link">Where to Stay</a>
          ...
          <a class="mobile-stays-btn">Search Stays on Booking.com →</a>
        </div>           <- closing of old container

    We keep everything inside the new mobile-menu div untouched, then
    strip from its closing </div> to the next legitimate element.
    """

    # Locate end of the new mobile-menu block
    # The new mobile-menu always ends with mobile-stays-btn then </div>
    # Pattern: find the FIRST </div> that closes the mobile-menu id="mobileMenu"

    # Use a state machine approach: find mobile-menu opening, track depth to closing
    mm_open = re.search(r'<div class="mobile-menu" id="mobileMenu"[^>]*>', content)
    if not mm_open:
        return content, False

    start = mm_open.end()
    depth = 1
    pos = start
    while pos < len(content) and depth > 0:
        open_tag = content.find('<div', pos)
        close_tag = content.find('</div>', pos)
        if close_tag == -1:
            break
        if open_tag != -1 and open_tag < close_tag:
            depth += 1
            pos = open_tag + 4
        else:
            depth -= 1
            if depth == 0:
                mm_end = close_tag + 6  # end of closing </div>
                break
            pos = close_tag + 6
    else:
        return content, False

    # Everything from mm_end to the next legitimate element
    after = content[mm_end:]

    # The orphan ends at a search-overlay div, breadcrumb nav, main, or page-specific class
    # Legitimate next elements:
    next_legit = re.search(
        r'(?=<!--[^>]*[Ss]earch|'
        r'<div[^>]*(?:class="search-overlay|id="searchOverlay)|'
        r'<nav[^>]*(?:class="breadcrumb|aria-label="Breadcrumb)|'
        r'<main\b|'
        r'<header\b|'
        r'<div[^>]*class="(?:page-|article-|ws-|din-|hr-|bh-|lx-|fh-|bt-|dbh-|ch-|wrap|section|hero|content)|'
        r'<section\b|'
        r'<script\b)',
        after
    )

    if not next_legit:
        return content, False

    orphan_chunk = after[:next_legit.start()]

    # Only strip if the orphan contains mobile-nav-link or mobile-stays-btn
    if 'mobile-nav-link' not in orphan_chunk and 'mobile-stays-btn' not in orphan_chunk:
        return content, False

    # Remove the orphan
    new_content = content[:mm_end] + '\n' + after[next_legit.start():]
    return new_content, True


def fix_search_overlay_css(content):
    """
    If the page has a search-overlay div but no CSS hiding it,
    inject the search-overlay CSS into the first <style> block.
    """
    has_overlay = 'id="searchOverlay"' in content
    has_css = '.search-overlay{' in content or '.search-overlay {' in content
    if not has_overlay or has_css:
        return content, False

    # Inject after the end of the canonical nav CSS block (after .mobile-stays-btn rule)
    # or just at the end of the first style block
    style_end = content.find('</style>')
    if style_end == -1:
        return content, False

    new_content = content[:style_end] + SEARCH_OVERLAY_CSS + '\n' + content[style_end:]
    return new_content, True


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    if filename == 'index.html':
        return False

    original = content
    changed = False

    content, orphan_fixed = fix_orphaned_nav(content)
    if orphan_fixed:
        changed = True

    content, css_fixed = fix_search_overlay_css(content)
    if css_fixed:
        changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        flags = []
        if orphan_fixed:
            flags.append('orphan')
        if css_fixed:
            flags.append('search-css')
        print(f'  ✓ {filename} [{",".join(flags)}]')

    return changed


def main():
    html_files = sorted(REPO.glob('*.html'))
    changed = 0
    errors = []

    for filepath in html_files:
        try:
            if process_file(filepath):
                changed += 1
        except Exception as e:
            errors.append((filepath.name, str(e)))
            print(f'  ✗ {filepath.name}: {e}')

    print(f'\nDone: {changed} files fixed, {len(errors)} errors')
    for f, e in errors:
        print(f'  {f}: {e}')
    return len(errors)


if __name__ == '__main__':
    sys.exit(main())
