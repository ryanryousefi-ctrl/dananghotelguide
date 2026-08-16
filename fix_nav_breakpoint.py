#!/usr/bin/env python3
"""
Raise nav hamburger breakpoint from 768px → 1100px across all pages.
Desktop nav needs ~1100px minimum (9+ links, social icons, CTA button).
"""

import os
import glob

# Multi-line format (most pages)
OLD_MULTI = """@media(max-width:768px){
  .nav-links{display:none}
  .nav-hamburger{display:flex}
  .nav-stays-btn .btn-text{display:none}
}"""

NEW_MULTI = """@media(max-width:1100px){
  .nav-links{display:none}
  .nav-hamburger{display:flex}
  .nav-stays-btn .btn-text{display:none}
}"""

# Single-line format (22 pages)
OLD_SINGLE = "@media(max-width:768px){.nav-links{display:none}.nav-hamburger{display:flex}.nav-stays-btn .btn-text{display:none}}"
NEW_SINGLE = "@media(max-width:1100px){.nav-links{display:none}.nav-hamburger{display:flex}.nav-stays-btn .btn-text{display:none}}"

# index.html: nav rules mixed into a larger 768px block
INDEX_OLD_NAV_RULES = "  .nav-links{display:none}\n  .nav-hamburger{display:flex}\n  .nav-stays-btn span.btn-text{display:none}\n"

stats = {'updated': 0, 'skipped': 0, 'no_match': 0}

for filepath in sorted(glob.glob('*.html')):
    filename = os.path.basename(filepath)

    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    if filename == 'index.html':
        if '.nav-links{display:none}' not in html:
            stats['no_match'] += 1
            continue
        # Remove the 3 nav lines from the 768px block
        updated = html.replace(INDEX_OLD_NAV_RULES, '', 1)
        # Prepend a dedicated 1100px nav block before the first 768px block
        nav_block_1100 = "@media(max-width:1100px){\n  .nav-links{display:none}\n  .nav-hamburger{display:flex}\n  .nav-stays-btn span.btn-text{display:none}\n}\n"
        updated = updated.replace('@media(max-width:768px){', nav_block_1100 + '@media(max-width:768px){', 1)
        if updated != html:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated)
            stats['updated'] += 1
            print(f'  ✓  {filepath} (index)')
        else:
            stats['no_match'] += 1
        continue

    updated = html
    changed = False

    if OLD_MULTI in updated:
        updated = updated.replace(OLD_MULTI, NEW_MULTI, 1)
        changed = True
    elif OLD_SINGLE in updated:
        updated = updated.replace(OLD_SINGLE, NEW_SINGLE, 1)
        changed = True

    if changed and updated != html:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated)
        stats['updated'] += 1
    elif not changed:
        if '.nav-links{display:none}' in html:
            print(f'  ?  {filepath}: nav pattern not found in expected format')
            stats['no_match'] += 1
        else:
            stats['skipped'] += 1

print(f'\nDone: {stats["updated"]} updated, {stats["skipped"]} skipped (no nav), {stats["no_match"]} unrecognised pattern.')
