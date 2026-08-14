#!/usr/bin/env python3
"""
Inject bk-widget.css and bk-widget.js into every HTML page
that has a hero/banner and should show the sitewide booking widget.

Run from the repo root: python3 inject_bk_widget.py
"""

import os
import re
import glob

SKIP_FILES = {
    'index.html',          # already has its own custom widget
    'privacy.html',
    'terms.html',
    'contact.html',
    'search.html',
    'favicon-html-snippet.html',
    'site-preview.html',
}

CSS_TAG = '<link rel="stylesheet" href="bk-widget.css">'
JS_TAG  = '<script src="bk-widget.js" defer></script>'

ALREADY_MARKER = 'bk-widget.css'

def inject(filepath):
    filename = os.path.basename(filepath)
    if filename in SKIP_FILES:
        return 'skipped'

    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Skip if already injected
    if ALREADY_MARKER in html:
        return 'already'

    # Must have a hero element to be worth injecting
    hero_classes = [
        'review-hero', 'review-photo-hero', 'bh-hero', 'dbh-hero',
        'lx-hero', 'fm-hero', 'bt-hero', 'ch-hero', 'ha-hero',
        'bb-hero', 'bc-hero', 'gd-hero', 'mg-hero', 'wx-hero',
        'wts-hero', 'drf-hero', 'cmp-hero', 'hub-hero',
        'about-hero', 'wtu-hero', 'article-hero', 'page-hero', 'guide-hero',
    ]
    has_hero = any(f'class="{c}"' in html or f'class="{c} ' in html for c in hero_classes)
    # Also detect inline ocean-deep headers (guides.html, hotel-reviews.html, where-to-stay.html)
    if not has_hero:
        has_hero = 'style="background:var(--ocean-deep)' in html or \
                   'style="position:relative;background:var(--ocean-deep)' in html
    # News/article pages with article-hero-image: skip these, not hotel/guide pages
    if not has_hero or 'class="article-hero-image"' in html:
        return 'no-hero'

    # Inject CSS: before </head>
    if '</head>' in html:
        html = html.replace('</head>', f'  {CSS_TAG}\n</head>', 1)
    else:
        return 'no-head'

    # Inject JS: before closing </body> (or before anrdoezrs script if present)
    if 'anrdoezrs.net' in html:
        html = html.replace(
            '<script src="https://www.anrdoezrs.net/',
            f'{JS_TAG}\n  <script src="https://www.anrdoezrs.net/',
            1
        )
    elif '</body>' in html:
        html = html.replace('</body>', f'  {JS_TAG}\n</body>', 1)
    else:
        return 'no-body'

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)

    return 'injected'


def main():
    files = sorted(glob.glob('*.html'))
    stats = {'injected': 0, 'already': 0, 'skipped': 0, 'no-hero': 0, 'other': 0}

    for filepath in files:
        result = inject(filepath)
        stats[result if result in stats else 'other'] += 1
        if result == 'injected':
            print(f'  ✓  {filepath}')
        elif result not in ('already', 'no-hero', 'skipped'):
            print(f'  !  {filepath}: {result}')

    print(f'\nDone: {stats["injected"]} injected, {stats["already"]} already done, '
          f'{stats["no-hero"]} no hero found, {stats["skipped"]} skipped.')


if __name__ == '__main__':
    main()
