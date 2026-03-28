#!/usr/bin/env python3
"""
dananghotelguide.com — sitewide SEO fix script
Run from the repo root: python3 fix-all-sitewide.py

Fixes applied to ALL html files:
  1. Schema: non-www URLs → www
  2. Schema: add reviewRating to Review types (if missing)
  3. Hreflang: add x-default to English pages missing it
  4. og:url: ensure matches canonical (non-www → www)
  5. og:url: ensure matches canonical URL exactly
  6. BreadcrumbList: non-www item URLs → www
"""

import re, json, glob, os

# ── Rating values per review page ──────────────────────────────────────────
# Adjust these as needed before running
RATINGS = {
    'review-a-la-carte-da-nang.html':           '7.5',
    'review-azura-da-nang.html':                '7.5',
    'review-brilliant-hotel-da-nang.html':      '7.0',
    'review-four-points-sheraton-da-nang.html': '7.5',
    'review-furama-resort-da-nang.html':        '8.0',
    'review-fusion-suites-da-nang.html':        '8.0',
    'review-grand-mercure-da-nang.html':        '7.5',
    'review-hilton-da-nang.html':               '7.5',
    'review-hyatt-regency-da-nang.html':        '9.0',
    'review-intercontinental-da-nang.html':     '9.0',
    'review-marriott-resort-da-nang.html':      '8.5',
    'review-melia-da-nang.html':                '7.5',
    'review-mikazuki-da-nang.html':             '7.5',
    'review-muong-thanh-luxury-da-nang.html':   '7.0',
    'review-naman-retreat-da-nang.html':        '8.5',
    'review-novotel-da-nang-han-river.html':    '7.5',
    'review-premier-village-da-nang.html':      '8.5',
    'review-pullman-da-nang.html':              '7.5',
    'review-radisson-blu-da-nang.html':         '7.5',
    'review-sheraton-grand-da-nang.html':       '8.0',
    'review-tia-wellness-resort-da-nang.html':  '8.5',
    'review-tms-hotel-da-nang.html':            '7.0',
    'review-vinpearl-luxury-da-nang.html':      '7.5',
    'review-wyndham-soleil-da-nang.html':       '7.0',
}

def fix_urls_in_obj(obj):
    """Recursively replace non-www with www in all string values."""
    if isinstance(obj, dict):
        return {k: fix_urls_in_obj(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [fix_urls_in_obj(v) for v in obj]
    elif isinstance(obj, str):
        return obj.replace('https://dananghotelguide.com', 'https://www.dananghotelguide.com')
    return obj

def fix_schema_block(match, rating_value):
    try:
        data = json.loads(match.group(1).strip())
    except json.JSONDecodeError:
        return match.group(0)  # leave malformed JSON untouched

    data = fix_urls_in_obj(data)

    # Handle both single objects and arrays of schema objects
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and item.get('@type') == 'Review' and 'reviewRating' not in item:
                item['reviewRating'] = {
                    "@type": "Rating",
                    "ratingValue": rating_value,
                    "bestRating": "10",
                    "worstRating": "1"
                }
        return f'<script type="application/ld+json">\n{json.dumps(data, indent=2, ensure_ascii=False)}\n</script>'

    if data.get('@type') == 'Review' and 'reviewRating' not in data:
        data['reviewRating'] = {
            "@type": "Rating",
            "ratingValue": rating_value,
            "bestRating": "10",
            "worstRating": "1"
        }

    return f'<script type="application/ld+json">\n{json.dumps(data, indent=2, ensure_ascii=False)}\n</script>'

def fix_file(fname):
    content = open(fname, encoding='utf-8').read()
    original = content
    rating = RATINGS.get(os.path.basename(fname), '8.0')

    # 1+2+6: Fix schema blocks
    content = re.sub(
        r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>',
        lambda m: fix_schema_block(m, rating),
        content,
        flags=re.DOTALL
    )

    # 3: Add x-default hreflang to English pages missing it
    if 'hreflang="x-default"' not in content and "hreflang='x-default'" not in content:
        hreflang_match = re.search(
            r'(<link[^>]+hreflang=["\']en["\'][^>]+href=["\'])(https://www\.dananghotelguide\.com/[^"\']+)(["\'][^>]*>)',
            content
        )
        if hreflang_match:
            en_url = hreflang_match.group(2)
            xdefault = f'\n    <link rel="alternate" hreflang="x-default" href="{en_url}">'
            content = content.replace(hreflang_match.group(0), hreflang_match.group(0) + xdefault)

    # 4: og:url non-www → www
    content = re.sub(
        r'(<meta\s+property=["\']og:url["\']\s+content=["\'])https://dananghotelguide\.com/',
        r'\1https://www.dananghotelguide.com/',
        content
    )

    # 5: og:url must match canonical exactly
    canonical_match = re.search(
        r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\'](https://www\.dananghotelguide\.com/[^"\']+)["\']',
        content
    )
    og_url_match = re.search(
        r'(<meta\s+property=["\']og:url["\']\s+content=["\'])(https://www\.dananghotelguide\.com/[^"\']+)(["\'])',
        content
    )
    if canonical_match and og_url_match:
        can_url = canonical_match.group(1)
        og_url  = og_url_match.group(2)
        if og_url != can_url:
            content = content.replace(
                og_url_match.group(0),
                og_url_match.group(1) + can_url + og_url_match.group(3)
            )

    if content != original:
        open(fname, 'w', encoding='utf-8').write(content)
        return True
    return False

# ── Run across all HTML files ───────────────────────────────────────────────
files = sorted(glob.glob('*.html') + glob.glob('kr/*.html'))
SKIP = {'site-preview.html', 'favicon-html-snippet.html'}

fixed = []
unchanged = []
for f in files:
    if os.path.basename(f) in SKIP:
        continue
    if fix_file(f):
        fixed.append(f)
    else:
        unchanged.append(f)

print(f"Fixed:     {len(fixed)} files")
print(f"Unchanged: {len(unchanged)} files")
print("\nFiles changed:")
for f in fixed:
    print(f"  {f}")
