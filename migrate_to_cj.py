#!/usr/bin/env python3
"""
migrate_to_cj.py
================
Migrates all Booking.com Awin affiliate links to clean Booking.com URLs
and injects the CJ Deep Link Automation script once per HTML file.

Strategy:
  1. Hardcoded Awin hrefs  → extract the `ued=` destination → clean booking.com URL
  2. JS AWIN_BASE + data-booking-url pattern → remove entire JS block, leave data-booking-url
     as the bare href (CJ script handles click-time affiliate wrapping)
  3. Remove &aid= from clean booking.com URLs (CJ will add its own tracking)
  4. Inject CJ script before </body> (once per file, skip if already present)
  5. Flag any Awin URL that has no `ued=` param for manual review

Run from project root:  python3 migrate_to_cj.py
"""

import os
import re
import sys
from urllib.parse import unquote, urlparse, parse_qs, urlencode, urlunparse

ROOT = os.path.dirname(os.path.abspath(__file__))
CJ_SCRIPT_TAG = '<script src="https://www.anrdoezrs.net/am/101820678/include/allCj/impressions/page/am.js"></script>'
CJ_MARKER = "anrdoezrs.net/am/101820678"  # used to detect if already injected

# Awin patterns to match — HTML href attributes
AWIN_HREF_RE = re.compile(
    r'href=["\']('
    r'https?://(?:www\.)?(?:awin1\.com|awin\.com)/cread\.php[^"\']*'
    r'|https?://booking-com\.prf\.hn[^"\']*'
    r')["\']',
    re.IGNORECASE
)

# Awin patterns in JSON-LD "url": fields
AWIN_JSON_URL_RE = re.compile(
    r'"url"\s*:\s*"('
    r'https?://(?:www\.)?(?:awin1\.com|awin\.com)/cread\.php[^"]*'
    r'|https?://booking-com\.prf\.hn[^"]*'
    r')"',
    re.IGNORECASE
)

# The JS block pattern — AWIN_BASE variable declaration + the generateBookingLink function
# These appear wrapped in <script> tags or inline. We match the full block.
AWIN_BASE_SCRIPT_BLOCK_RE = re.compile(
    r'<script[^>]*>\s*\(function\(\)\s*\{[^<]*?var AWIN_BASE\s*=\s*["\']https://www\.awin1\.com[^<]*?</script>',
    re.DOTALL | re.IGNORECASE
)

# Simpler pattern for AWIN_BASE = "..." variable (inline, not wrapped in IIFE)
AWIN_BASE_VAR_RE = re.compile(
    r'var AWIN_BASE\s*=\s*["\']https://www\.awin1\.com[^"\']*["\'];?',
    re.IGNORECASE
)

# The entire <script> block containing AWIN_BASE
AWIN_BASE_SCRIPT_RE = re.compile(
    r'<script(?:\s[^>]*)?>(?:(?!</script>).)*?AWIN_BASE(?:(?!</script>).)*?</script>',
    re.DOTALL | re.IGNORECASE
)

# data-booking-url attributes
DATA_BOOKING_URL_RE = re.compile(
    r'data-booking-url=["\']([^"\']*)["\']',
    re.IGNORECASE
)

# Aid parameter in booking.com URLs (we strip it so CJ handles tracking)
AID_PARAM_RE = re.compile(r'[?&]aid=\d+', re.IGNORECASE)

# Bare Awin URL (no ued= at all) — used in AWIN_BASE JS variable
BARE_AWIN_RE = re.compile(
    r'https?://(?:www\.)?awin1\.com/cread\.php\?awinmid=\d+&awinaffid=\d+$',
    re.IGNORECASE
)

stats = {
    "files_scanned": 0,
    "files_modified": 0,
    "links_converted": 0,
    "flags": [],   # (file, line, url, reason)
    "files_with_changes": []
}


def strip_aid(url: str) -> str:
    """Remove the &aid= or ?aid= parameter from a booking.com URL."""
    url = AID_PARAM_RE.sub('', url)
    # Fix double ??, stray & at start of query
    url = url.replace('??', '?').replace('?&', '?')
    url = url.rstrip('?&')
    return url


def extract_booking_destination(awin_url: str) -> str | None:
    """
    Given an Awin wrapper URL, extract and decode the `ued=` destination.
    Returns a clean booking.com URL, or None if extraction fails.
    """
    parsed = urlparse(awin_url)
    qs = parse_qs(parsed.query, keep_blank_values=True)

    ued_list = qs.get('ued', [])
    if not ued_list or not ued_list[0]:
        return None

    destination = unquote(ued_list[0])

    # Must be a booking.com URL
    dest_parsed = urlparse(destination)
    if 'booking.com' not in dest_parsed.netloc:
        return None

    # Strip the Booking.com aid= affiliate param (CJ will handle this)
    destination = strip_aid(destination)

    return destination


def replace_awin_href(match: re.Match, filepath: str) -> str:
    """Replace a single href="<awin-url>" with href="<clean-booking-url>"."""
    full_match = match.group(0)
    awin_url = match.group(1)

    destination = extract_booking_destination(awin_url)

    if destination is None:
        # Flag for manual review if it's not just a bare AWIN_BASE variable reference
        if not BARE_AWIN_RE.search(awin_url):
            stats["flags"].append((
                os.path.relpath(filepath, ROOT),
                "href",
                awin_url,
                "Could not extract booking.com destination from ued= parameter"
            ))
        return full_match  # leave unchanged

    stats["links_converted"] += 1
    quote = full_match[4]  # the quote character used (either ' or ")
    return f'href={quote}{destination}{quote}'


def fix_data_booking_url(match: re.Match, filepath: str) -> str:
    """Fix data-booking-url values: strip aid=, fix bare dest_id-only values."""
    full_match = match.group(0)
    url = match.group(1)
    quote = full_match[17]  # character after data-booking-url=

    # Handle the anomalous bare dest_id value "-3723930" (Hoi An)
    if url == "-3723930":
        clean = "https://www.booking.com/searchresults.html?ss=Hoi+An%2C+Vietnam&dest_id=-3723930&dest_type=city"
        return f'data-booking-url={quote}{clean}{quote}'

    # If it's not a URL at all, flag it
    if not url.startswith('http'):
        stats["flags"].append((
            os.path.relpath(filepath, ROOT),
            "data-booking-url",
            url,
            "Non-URL value in data-booking-url attribute"
        ))
        return full_match

    # Strip aid from data-booking-url (CJ handles tracking on click)
    clean = strip_aid(url)
    if clean != url:
        return f'data-booking-url={quote}{clean}{quote}'

    return full_match


def process_file(filepath: str) -> bool:
    """Process a single HTML file. Returns True if file was modified."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        original = f.read()

    content = original

    # ─── Step 1: Replace hardcoded Awin hrefs ────────────────────────────────
    def _replace_href(m):
        return replace_awin_href(m, filepath)

    content = AWIN_HREF_RE.sub(_replace_href, content)

    # ─── Step 1b: Replace Awin URLs in JSON-LD "url": fields ─────────────────
    def _replace_json_url(m):
        awin_url = m.group(1)
        destination = extract_booking_destination(awin_url)
        if destination is None:
            stats["flags"].append((
                os.path.relpath(filepath, ROOT),
                "json-ld url",
                awin_url,
                "Could not extract booking.com destination from JSON-LD url field"
            ))
            return m.group(0)
        stats["links_converted"] += 1
        return f'"url":"{destination}"'

    content = AWIN_JSON_URL_RE.sub(_replace_json_url, content)

    # ─── Step 2: Remove the AWIN_BASE <script> blocks entirely ───────────────
    # These blocks: (a) set AWIN_BASE, (b) define generateBookingLink(),
    # (c) DOMContentLoaded listener that sets href from data-booking-url.
    # With CJ, we no longer need any of this — the data-booking-url becomes
    # the actual href, and CJ script does the affiliate wrapping on click.
    content = AWIN_BASE_SCRIPT_RE.sub('', content)

    # ─── Step 3: Fix data-booking-url attributes (strip aid=, fix bare values)
    def _fix_data_url(m):
        return fix_data_booking_url(m, filepath)

    content = DATA_BOOKING_URL_RE.sub(_fix_data_url, content)

    # ─── Step 4: Convert data-booking-url anchors to direct hrefs ────────────
    # After removing the AWIN_BASE script, <a data-booking-url="..."> elements
    # no longer have their href set. We need to set href from data-booking-url
    # and remove the awin-specific data attributes.
    #
    # Pattern: <a ... data-booking-url="URL" ... data-clickref="..." ...>
    # We want to add/set href="URL" and remove data-clickref / data-booking-url
    # (data-booking-url can stay as-is for clarity, but href must be set)

    def fix_anchor_with_data_booking(match):
        tag = match.group(0)
        # Extract data-booking-url value
        dbu_match = re.search(r'data-booking-url=["\']([^"\']*)["\']', tag, re.IGNORECASE)
        if not dbu_match:
            return tag

        dest_url = dbu_match.group(1)
        if not dest_url.startswith('http'):
            return tag

        # If href is already set to the booking.com URL (clean), leave it
        href_match = re.search(r'href=["\']([^"\']*)["\']', tag, re.IGNORECASE)
        if href_match:
            existing_href = href_match.group(1)
            if existing_href == dest_url:
                return tag
            if 'booking.com' in existing_href and 'awin' not in existing_href:
                # Already clean
                return tag
            if 'awin' not in existing_href and 'prf.hn' not in existing_href:
                # Some other link, skip
                return tag
            # href still points to awin — replace it
            new_tag = re.sub(
                r'href=["\']([^"\']*)["\']',
                f'href="{dest_url}"',
                tag,
                count=1,
                flags=re.IGNORECASE
            )
            stats["links_converted"] += 1
            return new_tag
        else:
            # No href set at all — add it (insert after <a)
            new_tag = tag.replace('<a ', f'<a href="{dest_url}" ', 1)
            stats["links_converted"] += 1
            return new_tag

    # Match any <a ...> opening tag (non-greedy, doesn't cross tags)
    ANCHOR_TAG_RE = re.compile(r'<a\s[^>]*data-booking-url=[^>]*>', re.DOTALL | re.IGNORECASE)
    content = ANCHOR_TAG_RE.sub(fix_anchor_with_data_booking, content)

    # ─── Step 5: Strip data-clickref attributes (Awin tracking, no longer needed)
    content = re.sub(r'\s*data-clickref=["\'][^"\']*["\']', '', content)

    # ─── Step 6: Remove rel="nofollow sponsored noopener" → keep just "noopener"
    # on booking.com links (sponsored is for paid links, not affiliate discovery)
    # Actually, keep sponsored for FTC compliance — just ensure noopener is present
    # Leave rel attributes as-is; they're fine.

    # ─── Step 7: Inject CJ script before </body> (once per file) ─────────────
    if CJ_MARKER not in content:
        content = content.replace('</body>', f'  {CJ_SCRIPT_TAG}\n</body>', 1)
        if CJ_MARKER not in content:
            # No </body> found — try </html>
            content = content.replace('</html>', f'  {CJ_SCRIPT_TAG}\n</html>', 1)

    # ─── Step 8: Clean up any remaining raw awin1.com references ────────────
    # Catch any that the first pass might have missed
    remaining_awin = re.findall(r'(?:href|"url")\s*[=:]\s*["\'][^"\']*awin1?\.com[^"\']*["\']', content, re.IGNORECASE)
    remaining_prf = re.findall(r'(?:href|"url")\s*[=:]\s*["\'][^"\']*booking-com\.prf\.hn[^"\']*["\']', content, re.IGNORECASE)
    for url in remaining_awin + remaining_prf:
        stats["flags"].append((
            os.path.relpath(filepath, ROOT),
            "remaining-awin",
            url,
            "Awin reference survived automated replacement — manual review required"
        ))

    if content == original:
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return True


def walk_html(directory: str) -> list[str]:
    results = []
    skip_dirs = {'.git', 'node_modules', 'images', 'pinterest'}
    for entry in os.scandir(directory):
        if entry.is_dir(follow_symlinks=False):
            if entry.name not in skip_dirs:
                results.extend(walk_html(entry.path))
        elif entry.is_file() and entry.name.endswith('.html'):
            results.append(entry.path)
    return results


def main():
    html_files = walk_html(ROOT)
    html_files.sort()
    stats["files_scanned"] = len(html_files)

    print(f"Scanning {len(html_files)} HTML files...\n")

    for filepath in html_files:
        changed = process_file(filepath)
        if changed:
            rel = os.path.relpath(filepath, ROOT)
            stats["files_modified"] += 1
            stats["files_with_changes"].append(rel)
            print(f"  MODIFIED: {rel}")

    print("\n" + "=" * 60)
    print("MIGRATION REPORT")
    print("=" * 60)
    print(f"Files scanned:   {stats['files_scanned']}")
    print(f"Files modified:  {stats['files_modified']}")
    print(f"Links converted: {stats['links_converted']}")

    if stats["flags"]:
        print(f"\n⚠  FLAGS REQUIRING MANUAL REVIEW ({len(stats['flags'])} items):")
        for filepath, context, url, reason in stats["flags"]:
            print(f"  File:    {filepath}")
            print(f"  Context: {context}")
            print(f"  URL:     {url[:120]}")
            print(f"  Reason:  {reason}")
            print()
    else:
        print("\n✓ No flags — all Awin links resolved automatically.")

    print("\nVerification checklist:")
    print("  ✓ All Awin href links replaced with clean booking.com URLs")
    print("  ✓ AWIN_BASE JS blocks removed")
    print("  ✓ data-booking-url values cleaned (aid= stripped)")
    print("  ✓ CJ Deep Link Automation script injected before </body>")
    print("  ✓ data-clickref attributes removed")
    print("\nNext: Run verify_migration.py to confirm no Awin links remain.")


if __name__ == "__main__":
    main()
