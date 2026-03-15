#!/usr/bin/env python3
"""
fix-domain-consistency.py
=========================
Site-wide domain consistency fixer for dananghotelguide.com

Run this script from the ROOT of your GitHub repo:
    python3 fix-domain-consistency.py

It will scan every .html file in the repo root and fix:
  1.  Pre-DOCTYPE junk content
  2.  Canonical tags          → https://www.dananghotelguide.com/...
  3.  OpenGraph og:url        → https://www.dananghotelguide.com/...
  4.  hreflang href           → https://www.dananghotelguide.com/...
  5.  All JSON-LD schema URLs → https://www.dananghotelguide.com/...
  6.  Breadcrumb schema URLs  → https://www.dananghotelguide.com/...
  7.  25-best canonical       → best-hotels-in-da-nang.html
  8.  AFFILIATE_ID_PLACEHOLDER → 2788028
  9.  dest_id=-3714993 (Hanoi) → dest_id=-3730689 (Da Nang)
  10. where-to-stay.html links → where-to-stay-in-da-nang.html
  11. Hotel Reviews nav link  (adds if missing)

The script is IDEMPOTENT — safe to run multiple times.
A .bak backup is written alongside each changed file.
"""

import os
import re
import shutil
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────
SITE_DOMAIN        = "https://www.dananghotelguide.com"
OLD_DOMAIN         = "https://dananghotelguide.com"          # no-www (wrong)
OLD_DOMAIN_HTTP    = "http://dananghotelguide.com"            # http no-www (wrong)
OLD_DOMAIN_WWW_HTTP= "http://www.dananghotelguide.com"        # http www (wrong)
AFFILIATE_ID       = "2788028"
HANOI_DEST_ID      = "dest_id=-3714993"
DANANG_DEST_ID     = "dest_id=-3730689"

# Pages that should canonicalise elsewhere (slug → canonical slug)
CANONICAL_OVERRIDES = {
    "25-best-hotels-in-da-nang.html": "best-hotels-in-da-nang.html",
}

# Booking link used to replace full placeholder nav links
BOOKING_SEARCH_URL = (
    "https://www.booking.com/searchresults.html?ss=Da+Nang%2C+Vietnam"
    "&dest_id=-3730689&dest_type=city&checkin=&checkout="
    f"&aid={AFFILIATE_ID}&label=affnetawin-dananghotelguide_pub-{AFFILIATE_ID}_site"
)
# ──────────────────────────────────────────────────────────────────────


def log(msg: str):
    print(f"  {msg}")


def fix_file(filepath: str) -> bool:
    """
    Apply all domain-consistency fixes to a single HTML file.
    Returns True if the file was changed.
    """
    filename = os.path.basename(filepath)
    slug = filename  # e.g. "guides.html"

    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        original = f.read()

    content = original
    changes = []

    # ── 1. REMOVE PRE-DOCTYPE CONTENT ────────────────────────────────
    doctype_pos = content.find("<!DOCTYPE")
    if doctype_pos > 0:
        pre = content[:doctype_pos].strip()
        if pre:
            content = content[doctype_pos:]
            changes.append(f"Removed pre-DOCTYPE junk ({doctype_pos} chars): {repr(pre[:80])}")

    # ── 2. CANONICAL ─────────────────────────────────────────────────
    # Determine what the canonical URL should be for this page
    canonical_slug = CANONICAL_OVERRIDES.get(slug, slug)
    if slug == "" or slug.lower() in ("index.html",):
        canonical_url = f"{SITE_DOMAIN}/"
    else:
        canonical_url = f"{SITE_DOMAIN}/{canonical_slug}"

    # Fix any existing canonical tag (wrong domain or wrong path)
    old_canon = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', content)
    if old_canon:
        old_url = old_canon.group(1)
        # Normalise: fix domain
        new_url = re.sub(
            r'^https?://(?:www\.)?dananghotelguide\.com',
            SITE_DOMAIN,
            old_url
        )
        # If this page overrides canonical (e.g. 25-best → best-hotels), enforce it
        if slug in CANONICAL_OVERRIDES:
            new_url = canonical_url
        if new_url != old_url:
            content = content.replace(
                f'<link rel="canonical" href="{old_url}"',
                f'<link rel="canonical" href="{new_url}"',
                1
            )
            changes.append(f"Canonical: {old_url} → {new_url}")

    # ── 3. og:url ─────────────────────────────────────────────────────
    og_url_m = re.search(r'(<meta\s+property="og:url"\s+content=")([^"]*)"', content)
    if og_url_m:
        old_og = og_url_m.group(2)
        new_og = re.sub(
            r'^https?://(?:www\.)?dananghotelguide\.com',
            SITE_DOMAIN,
            old_og
        )
        if slug in CANONICAL_OVERRIDES:
            new_og = canonical_url
        if new_og != old_og:
            content = content.replace(
                f'{og_url_m.group(1)}{old_og}"',
                f'{og_url_m.group(1)}{new_og}"',
                1
            )
            changes.append(f"og:url: {old_og} → {new_og}")

    # ── 4. hreflang href ──────────────────────────────────────────────
    def fix_hreflang(m):
        old_href = m.group(2)
        new_href = re.sub(
            r'^https?://(?:www\.)?dananghotelguide\.com',
            SITE_DOMAIN,
            old_href
        )
        if slug in CANONICAL_OVERRIDES:
            new_href = canonical_url
        if new_href != old_href:
            changes.append(f"hreflang: {old_href} → {new_href}")
        return f'{m.group(1)}{new_href}"'

    content = re.sub(
        r'(<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href=")([^"]*)"',
        fix_hreflang,
        content
    )

    # ── 5. ALL JSON-LD SCHEMA BLOCKS ──────────────────────────────────
    def fix_schema_block(m):
        block = m.group(1)
        # Fix no-www domain variants
        block = re.sub(
            r'https?://(?:www\.)?dananghotelguide\.com',
            SITE_DOMAIN,
            block
        )
        # For canonical-override pages: also fix the old slug URL to canonical
        if slug in CANONICAL_OVERRIDES:
            old_slug_url = f"{SITE_DOMAIN}/{slug}"
            new_slug_url = f"{SITE_DOMAIN}/{CANONICAL_OVERRIDES[slug]}"
            block = block.replace(old_slug_url, new_slug_url)
        return f'<script type="application/ld+json">{block}</script>'

    orig_count = len(re.findall(r'<script type="application/ld\+json">', content))
    new_content = re.sub(
        r'<script type="application/ld\+json">([\s\S]*?)</script>',
        fix_schema_block,
        content
    )
    if new_content != content:
        content = new_content
        changes.append(f"Schema JSON-LD: domain+canonical fixes in {orig_count} block(s)")

    # ── 6. AFFILIATE PLACEHOLDER ──────────────────────────────────────
    aff_count = content.count("AFFILIATE_ID_PLACEHOLDER")
    if aff_count:
        # Replace full booking search URL patterns first (nav / mobile nav buttons)
        content = re.sub(
            r'https://www\.booking\.com/searchresults\.html\?ss=Da\+Nang[^"\']*?'
            r'aid=AFFILIATE_ID_PLACEHOLDER[^"\']*',
            BOOKING_SEARCH_URL,
            content
        )
        # Replace individual hotel booking links (keep their structure, just fix aid)
        content = re.sub(
            r'https://www\.booking\.com/hotel/[^"\']*?'
            r'(aid=)AFFILIATE_ID_PLACEHOLDER([^"\']*)',
            lambda m: m.group().replace('AFFILIATE_ID_PLACEHOLDER', AFFILIATE_ID),
            content
        )
        # Catch anything left
        content = content.replace("AFFILIATE_ID_PLACEHOLDER", AFFILIATE_ID)
        remaining = content.count("AFFILIATE_ID_PLACEHOLDER")
        changes.append(
            f"Affiliate: replaced {aff_count} placeholder(s)"
            + (f" ({remaining} remain — check manually)" if remaining else "")
        )

    # ── 7. HANOI DEST_ID ──────────────────────────────────────────────
    hanoi_count = content.count(HANOI_DEST_ID)
    if hanoi_count:
        content = content.replace(HANOI_DEST_ID, DANANG_DEST_ID)
        changes.append(f"dest_id: {hanoi_count} Hanoi (-3714993) → Da Nang (-3730689)")

    # ── 8. 25-BEST INTERNAL LINKS ─────────────────────────────────────
    # On any page OTHER than 25-best itself, links to 25-best should point to best-hotels
    # On the 25-best page itself, all self-links already handled via canonical override above
    bad25 = content.count("25-best-hotels-in-da-nang.html")
    if bad25:
        content = content.replace(
            "25-best-hotels-in-da-nang.html",
            "best-hotels-in-da-nang.html"
        )
        changes.append(f"Links: {bad25} × 25-best-hotels → best-hotels-in-da-nang.html")

    # ── 9. WHERE-TO-STAY SHORT URL ────────────────────────────────────
    wts_href = len(re.findall(r'href="where-to-stay\.html"', content))
    if wts_href:
        content = content.replace('"where-to-stay.html"', '"where-to-stay-in-da-nang.html"')
        changes.append(f"Links: {wts_href} × where-to-stay.html → where-to-stay-in-da-nang.html")

    # JS search data objects
    wts_js = content.count('url:"where-to-stay.html"') + content.count('"url":"where-to-stay.html"')
    if wts_js:
        content = content.replace('url:"where-to-stay.html"', 'url:"where-to-stay-in-da-nang.html"')
        content = content.replace('"url":"where-to-stay.html"', '"url":"where-to-stay-in-da-nang.html"')
        changes.append(f"JS data: {wts_js} × where-to-stay.html → where-to-stay-in-da-nang.html")

    # ── 10. HOTEL REVIEWS NAV LINK ────────────────────────────────────
    # Desktop nav
    nav_m = re.search(r'<nav class="site-nav"[^>]*>(.*?)</nav>', content, re.DOTALL)
    if nav_m and "hotel-reviews.html" not in nav_m.group(1):
        # Try inserting after the Guides nav-link, before About
        inserted = False
        for indent in ("      ", "    ", "  "):
            pat = re.compile(
                rf'{re.escape(indent)}<a href="guides\.html" class="nav-link[^"]*">Guides</a>\n'
                rf'{re.escape(indent)}<a href="about\.html"'
            )
            m = pat.search(content)
            if m:
                old_fragment = m.group()
                new_fragment = old_fragment.replace(
                    f'\n{indent}<a href="about.html"',
                    f'\n{indent}<a href="hotel-reviews.html" class="nav-link">Hotel Reviews</a>\n'
                    f'{indent}<a href="about.html"'
                )
                content = content.replace(old_fragment, new_fragment, 1)
                changes.append("Nav desktop: added Hotel Reviews link")
                inserted = True
                break
        if not inserted:
            changes.append("Nav desktop: Hotel Reviews NOT added (pattern not matched)")

    # Mobile nav
    mob_m = re.search(
        r'<a href="guides\.html" class="mobile-nav-link"[^>]*>Guides</a>\n'
        r'  <a href="about\.html"',
        content
    )
    if mob_m and "hotel-reviews.html" not in content[mob_m.start():mob_m.end() + 200]:
        old_mob = mob_m.group()
        new_mob = old_mob.replace(
            '\n  <a href="about.html"',
            '\n  <a href="hotel-reviews.html" class="mobile-nav-link">Hotel Reviews</a>\n'
            '  <a href="about.html"'
        )
        content = content.replace(old_mob, new_mob, 1)
        changes.append("Nav mobile: added Hotel Reviews link")

    # ── WRITE FILE if changed ──────────────────────────────────────────
    if content != original:
        # Write backup
        backup_path = filepath + ".bak"
        shutil.copy2(filepath, backup_path)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return True, changes
    else:
        return False, []


def build_sitemap(repo_root: str) -> str:
    """
    Generate a fresh sitemap.xml from the canonical page list.
    Returns the XML string.
    """
    from datetime import date
    today = date.today().strftime("%Y-%m-%d")

    # All indexable pages — priority / changefreq tuned by page type
    pages = [
        # Core
        ("",                                          "1.0", "weekly"),
        ("best-hotels-in-da-nang.html",               "0.9", "weekly"),
        ("guides.html",                               "0.9", "weekly"),
        ("hotel-reviews.html",                        "0.9", "weekly"),
        ("where-to-stay-in-da-nang.html",             "0.9", "weekly"),
        ("dining.html",                               "0.8", "monthly"),
        ("hotels.html",                               "0.7", "monthly"),
        ("about.html",                                "0.5", "monthly"),
        # Hotel category pages
        ("da-nang-beach-hotels.html",                 "0.8", "monthly"),
        ("luxury-hotels-da-nang.html",                "0.8", "monthly"),
        ("family-hotels-da-nang.html",                "0.8", "monthly"),
        ("boutique-hotels-da-nang.html",              "0.8", "monthly"),
        # Planning guides
        ("da-nang-hotel-prices-by-month.html",        "0.7", "monthly"),
        ("best-time-to-visit-da-nang.html",           "0.7", "monthly"),
        ("da-nang-weather-by-month.html",             "0.7", "monthly"),
        ("da-nang-itinerary.html",                    "0.7", "monthly"),
        ("da-nang-7-day-itinerary.html",              "0.7", "monthly"),
        ("da-nang-transport-guide.html",              "0.7", "monthly"),
        ("da-nang-airport-guide.html",                "0.7", "monthly"),
        ("da-nang-budget-guide.html",                 "0.7", "monthly"),
        ("da-nang-first-time-visitors.html",          "0.7", "monthly"),
        ("da-nang-digital-nomad-guide.html",          "0.7", "monthly"),
        ("da-nang-visa-run-guide.html",               "0.7", "monthly"),
        ("da-nang-travel-mistakes.html",              "0.7", "monthly"),
        # Attractions
        ("things-to-do-in-da-nang.html",              "0.7", "monthly"),
        ("ba-na-hills-guide.html",                    "0.7", "monthly"),
        ("marble-mountains-da-nang.html",             "0.7", "monthly"),
        ("da-nang-vs-hoi-an.html",                    "0.7", "monthly"),
        ("dragon-bridge-da-nang.html",                "0.7", "monthly"),
        ("han-river-night-cruise-da-nang.html",       "0.7", "monthly"),
        # Food & shopping
        ("best-cafes-da-nang.html",                   "0.7", "monthly"),
        ("da-nang-hoi-an-markets-guide.html",         "0.7", "monthly"),
        ("da-nang-malls-guide.html",                  "0.7", "monthly"),
        # Nationality guides
        ("da-nang-guide-for-korean-travelers.html",   "0.7", "monthly"),
        ("da-nang-guide-for-australian-travelers.html","0.7","monthly"),
        ("da-nang-guide-for-russian-travelers.html",  "0.7", "monthly"),
        # Hotel reviews (24 individual pages)
        ("review-intercontinental-da-nang.html",      "0.7", "monthly"),
        ("review-hyatt-regency-da-nang.html",         "0.7", "monthly"),
        ("review-sheraton-grand-da-nang.html",        "0.7", "monthly"),
        ("review-marriott-resort-da-nang.html",       "0.7", "monthly"),
        ("review-premier-village-da-nang.html",       "0.7", "monthly"),
        ("review-hilton-da-nang.html",                "0.7", "monthly"),
        ("review-pullman-da-nang.html",               "0.7", "monthly"),
        ("review-melia-da-nang.html",                 "0.7", "monthly"),
        ("review-radisson-blu-da-nang.html",          "0.7", "monthly"),
        ("review-naman-retreat-da-nang.html",         "0.7", "monthly"),
        ("review-tia-wellness-resort-da-nang.html",   "0.7", "monthly"),
        ("review-fusion-suites-da-nang.html",         "0.7", "monthly"),
        ("review-vinpearl-luxury-da-nang.html",       "0.7", "monthly"),
        ("review-mikazuki-da-nang.html",              "0.7", "monthly"),
        ("review-novotel-da-nang-han-river.html",     "0.7", "monthly"),
        ("review-four-points-sheraton-da-nang.html",  "0.7", "monthly"),
        ("review-grand-mercure-da-nang.html",         "0.7", "monthly"),
        ("review-wyndham-soleil-da-nang.html",        "0.7", "monthly"),
        ("review-furama-resort-da-nang.html",         "0.7", "monthly"),
        ("review-tms-hotel-da-nang.html",             "0.7", "monthly"),
        ("review-muong-thanh-luxury-da-nang.html",    "0.7", "monthly"),
        ("review-a-la-carte-da-nang.html",            "0.7", "monthly"),
        ("review-brilliant-hotel-da-nang.html",       "0.7", "monthly"),
        ("review-azura-da-nang.html",                 "0.7", "monthly"),
        # Utility
        ("privacy.html",                              "0.3", "yearly"),
        ("terms.html",                                "0.3", "yearly"),
        ("contact.html",                              "0.3", "yearly"),
    ]

    # Filter: only include slugs whose .html file actually exists in the repo
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    included = 0
    skipped = []

    for slug, priority, changefreq in pages:
        # Check if the file exists (skip for empty slug = homepage, always include)
        if slug:
            filepath = os.path.join(repo_root, slug)
            if not os.path.exists(filepath):
                skipped.append(slug)
                continue

        url = f"{SITE_DOMAIN}/{slug}" if slug else f"{SITE_DOMAIN}/"
        lines += [
            "  <url>",
            f"    <loc>{url}</loc>",
            f"    <lastmod>{today}</lastmod>",
            f"    <changefreq>{changefreq}</changefreq>",
            f"    <priority>{priority}</priority>",
            "  </url>",
        ]
        included += 1

    lines.append("</urlset>")

    if skipped:
        print(f"  Sitemap: skipped {len(skipped)} pages (file not found): {skipped[:5]}{'...' if len(skipped)>5 else ''}")
    print(f"  Sitemap: {included} URLs included, lastmod={today}")

    return "\n".join(lines) + "\n"


def main():
    repo_root = os.path.dirname(os.path.abspath(__file__))
    print(f"\n{'='*65}")
    print(f"  dananghotelguide.com — Domain Consistency Fixer")
    print(f"  Repo: {repo_root}")
    print(f"  Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*65}\n")

    # Find all .html files in repo root (flat structure — no subdirs)
    html_files = sorted([
        f for f in os.listdir(repo_root)
        if f.endswith(".html") and os.path.isfile(os.path.join(repo_root, f))
    ])

    print(f"Found {len(html_files)} HTML files\n")

    changed_count = 0
    unchanged_count = 0

    for fname in html_files:
        filepath = os.path.join(repo_root, fname)
        print(f"  [{fname}]")
        changed, changes = fix_file(filepath)
        if changed:
            for c in changes:
                print(f"    ✓ {c}")
            changed_count += 1
        else:
            print(f"    — no changes needed")
            unchanged_count += 1
        print()

    # Update sitemap
    print(f"  [sitemap.xml]")
    sitemap_content = build_sitemap(repo_root)
    sitemap_path = os.path.join(repo_root, "sitemap.xml")
    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(sitemap_content)
    print(f"    ✓ sitemap.xml written\n")

    print(f"{'='*65}")
    print(f"  DONE: {changed_count} files patched, {unchanged_count} already clean")
    print(f"  Backups written as .bak files alongside each changed file")
    print(f"  Delete .bak files after verifying: find . -name '*.bak' -delete")
    print(f"{'='*65}\n")


if __name__ == "__main__":
    main()
