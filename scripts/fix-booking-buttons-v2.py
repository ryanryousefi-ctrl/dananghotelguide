#!/usr/bin/env python3
"""
Booking.com button overhaul v2 — complete replacement.

Strategy:
- Replace every Booking.com CTA anchor with class booking-com-button
- Preserve: href, data-booking-url, aid, sid, target, rel, data-* attrs, affiliate-link class
- Remove: all old visual class names from the anchor's class list
- Strip: legacy CSS rules for old class names that conflict
- Inject: single .booking-com-button CSS block per page
- Logo: /assets/images/booking-com-logo-white.svg (white wordmark, transparent bg)
- Label: "Check prices"

CRITICAL: Zero URL/tracking changes.
"""

import os
import re
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent

# ── Classes whose CSS we want to STRIP from pages (when they're on booking links)
# We don't remove the class names from all elements — only from booking <a> tags
VISUAL_CLASSES_TO_REMOVE_FROM_ANCHOR = [
    'booking-cta', 'booking-cta__logo', 'booking-cta__label',  # previous attempt
    'hotel-book-btn', 'nav-stays-btn', 'mobile-stays-btn', 'verdict-book-btn',
    'hft-btn', 'bb-cta-primary', 'sc-book-btn', 'booking-button', 'hs-book-btn',
    'hs-card', 'hw-cta', 'btn-book', 'mobile-cta-bar-btn', 'hotel-card-cta',
    'boutique-btn', 'hbtn', 'hc-btn', 'ep-cta', 'sb-cta', 'hero-cta',
    'cta-block-btn', 'sidebar-cta-btn', 'sidebar-book-btn', 'sidebar-cta',
    'hero-cta-btn', 'verdict-option', 'sidebar-book', 'cta-btn', 'hotel-cta',
    'comparison-book-btn', 'area-book-btn', 'price-cta', 'book-btn',
    'ep-card-cta', 'p5-final-btn-primary', 'p5-final-btn', 'p5-btn',
    'hotel-cta-btn', 'district-cta', 'map-book-btn', 'area-cta',
]

# Classes that wrap entire cards — do NOT convert these
CARD_WRAPPER_CLASSES = {
    'wid-hotel-card', 'hotel-card', 'p5-hc', 'hs-card', 'card-link', 'hotel-link',
}

# CJ tracking requires affiliate-link to remain on the anchor. Keep it.
KEEP_CLASSES = {'affiliate-link'}

# ── The new button CSS — single source of truth
BUTTON_CSS = """
/* ═══════════════════════════════════════════════════════════════
   BOOKING.COM UNIFIED BUTTON — do not edit individual instances
   ═══════════════════════════════════════════════════════════════ */
/* High-specificity selector: * .booking-com-button defeats .parent a rules */
* .booking-com-button,
a.booking-com-button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 12px !important;
  width: 260px !important;
  min-width: 260px !important;
  max-width: 260px !important;
  height: 56px !important;
  padding: 0 18px !important;
  box-sizing: border-box !important;
  background: #003b95 !important;
  border-radius: 8px !important;
  border: 0 !important;
  text-decoration: none !important;
  white-space: nowrap !important;
  cursor: pointer !important;
  vertical-align: middle !important;
  transition: background 0.15s ease, box-shadow 0.15s ease !important;
  box-shadow: 0 2px 8px rgba(0,59,149,.30) !important;
  overflow: hidden !important;
  flex-shrink: 0 !important;
  color: #fff !important;
}
* .booking-com-button:hover,
a.booking-com-button:hover,
* .booking-com-button:focus,
a.booking-com-button:focus {
  background: #002e80 !important;
  box-shadow: 0 4px 14px rgba(0,59,149,.45) !important;
  text-decoration: none !important;
  color: #fff !important;
}
.booking-com-button__logo {
  display: block !important;
  width: 125px !important;
  height: auto !important;
  max-height: 30px !important;
  object-fit: contain !important;
  flex: 0 0 auto !important;
  overflow: visible !important;
  border-radius: 0 !important;
}
.booking-com-button__label {
  display: inline-block !important;
  color: #ffffff !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
  white-space: nowrap !important;
  font-family: inherit !important;
}
@media (max-width: 480px) {
  * .booking-com-button,
  a.booking-com-button {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 260px !important;
    height: 56px !important;
  }
}
/* ═══════════════════════════════════════════════════════════════ */"""

# ── The button inner HTML
BUTTON_INNER = (
    '<img src="/assets/images/booking-com-logo-white.svg" '
    'class="booking-com-button__logo" alt="Booking.com" loading="lazy" '
    'width="125" height="30">'
    '<span class="booking-com-button__label">Check prices</span>'
)

# Match any <a> tag (handles multiline)
ANCHOR_RE = re.compile(r'<a\b[^>]*>.*?</a>', re.DOTALL | re.IGNORECASE)

# Extract class attribute value
CLASS_RE = re.compile(r'\bclass="([^"]*)"', re.IGNORECASE)

TARGET_CLASSES = set(VISUAL_CLASSES_TO_REMOVE_FROM_ANCHOR)


def is_booking_link(opening_tag: str) -> bool:
    """Returns True if this anchor points to booking.com."""
    href_m = re.search(r'\bhref="([^"]*)"', opening_tag, re.IGNORECASE)
    if not href_m:
        return False
    return 'booking.com' in href_m.group(1)


BUTTON_TEXT_SIGNALS = [
    'check price', 'check availab', 'book now', 'view hotel', 'search hotel',
    'search stay', 'compare', 'book on booking', 'booking.com →', 'booking.com ↗',
    'booking.com ↗', 'search on booking', 'find hotel', 'see price', 'check rate',
    'search all hotel', 'browse hotel', 'browse boutique', 'search da nang',
    'search hoi an', 'search my khe', 'book via booking', 'search festival',
    'check current rate', 'book hyatt', 'book sheraton', 'book marriott',
    'book intercontinental', 'book furama', 'book pullman', 'book novotel',
    'book melia', 'view rates', 'check now', 'check live',
    'browse da nang', 'browse all', 'all hotels', 'all da nang',
    'da nang hotel', 'da nang hotels', 'view recommended', 'booking.com',
]


def looks_like_button_text(inner_html: str) -> bool:
    """Returns True if the anchor inner text signals it's a CTA button (not body text)."""
    text = re.sub(r'<[^>]+>', '', inner_html).lower().strip()
    if len(text) > 120:
        return False  # Sentence-length text = body link
    return any(signal in text for signal in BUTTON_TEXT_SIGNALS)


def should_convert(opening_tag: str, inner_html: str = '') -> bool:
    """
    Returns True if this booking.com anchor should be converted.
    Catches:
      - anchors with one of our known target visual class names
      - anchors with inline style= (coral pill etc.)
      - anchor-only affiliate-link that acts as a button CTA
      - naked anchors whose text signals they're a button CTA
    """
    # Already converted
    cls_m = CLASS_RE.search(opening_tag)
    if cls_m and 'booking-com-button' in cls_m.group(1):
        return True

    if cls_m:
        classes = set(cls_m.group(1).split())
        # Never convert card wrappers
        if classes & CARD_WRAPPER_CLASSES:
            return False
        # Has one of our target visual class names
        if classes & TARGET_CLASSES:
            return True

    # Has inline style that makes it look like a button (background, padding, border-radius)
    style_m = re.search(r'style="([^"]*)"', opening_tag, re.IGNORECASE)
    if style_m:
        style = style_m.group(1)
        if 'background' in style and ('padding' in style or 'border-radius' in style):
            return True

    # Naked or affiliate-link-only anchor — convert only if text looks like a CTA
    if looks_like_button_text(inner_html):
        return True

    return False


def rewrite_opening_tag(opening_tag: str) -> str:
    """
    Replace class list with booking-com-button + affiliate-link (if present).
    Strip inline style= overrides.
    Do not touch href, data-*, target, rel, or any other attribute.
    """
    cls_m = CLASS_RE.search(opening_tag)
    old_classes = set(cls_m.group(1).split()) if cls_m else set()

    # Keep only the CJ-required classes
    keep = old_classes & KEEP_CLASSES
    new_classes = ['booking-com-button'] + sorted(keep)
    new_class_str = ' '.join(new_classes)

    if cls_m:
        tag = opening_tag[:cls_m.start()] + f'class="{new_class_str}"' + opening_tag[cls_m.end():]
    else:
        tag = opening_tag[:-1] + f' class="{new_class_str}">'

    # Strip inline style overrides
    tag = re.sub(r'\s*style="[^"]*"', '', tag)
    return tag


def replace_anchor(match: re.Match) -> str:
    full = match.group(0)
    tag_m = re.match(r'(<a\b[^>]*>)(.*)(</a>)', full, re.DOTALL | re.IGNORECASE)
    if not tag_m:
        return full

    opening = tag_m.group(1)
    inner = tag_m.group(2)

    if not is_booking_link(opening):
        return full

    if not should_convert(opening, inner):
        return full

    new_opening = rewrite_opening_tag(opening)
    return new_opening + BUTTON_INNER + tag_m.group(3)


# ── CSS stripping: remove old button rule blocks that conflict
# These are the specific property sets that make buttons coral, pill-shaped, etc.
# We identify them by a narrow pattern and null them out.

# Pattern: .classname{...} or .classname,...{...} blocks in <style> tags
# We'll target only the specific class names from VISUAL_CLASSES_TO_REMOVE_FROM_ANCHOR

CSS_TARGET_CLASSES_RE = '|'.join(
    re.escape('.' + c)
    for c in VISUAL_CLASSES_TO_REMOVE_FROM_ANCHOR
    if c not in ('affiliate-link',)
)

# Matches CSS rules where the selector contains one of our target classes
# We replace conflicting properties (background, border-radius, width, height, display, padding, color)
# with our own via the .booking-com-button class so we don't have to null everything

CONFLICT_PROPS = {
    'background': '#003b95',
    'border-radius': '8px',
}

# Rather than trying to surgically edit existing CSS (fragile),
# we inject an override block that covers every legacy selector combination.

def build_legacy_override_css() -> str:
    """
    Build a CSS block that overrides all legacy button selectors,
    forcing them to zero out so .booking-com-button wins cleanly.
    """
    legacy_selectors = [
        'a.booking-com-button.hotel-book-btn',
        'a.booking-com-button.hft-btn',
        'a.booking-com-button.nav-stays-btn',
        'a.booking-com-button.mobile-stays-btn',
        'a.booking-com-button.verdict-book-btn',
        'a.booking-com-button.bb-cta-primary',
        'a.booking-com-button.sc-book-btn',
        'a.booking-com-button.booking-button',
        'a.booking-com-button.hs-book-btn',
    ]
    # These selectors will never appear since we stripped those classes,
    # so this block is defensive only. The real override is the main .booking-com-button block.
    return ''  # Not needed — we already strip the old classes from the anchor


CSS_INJECT_START = '/* ═══════════════════════════════════════════════════════════════'
CSS_INJECT_END   = '/* ═══════════════════════════════════════════════════════════════ */'


def inject_css(html: str) -> str:
    """Inject button CSS. Replace existing block if found, else append."""
    # Already has our new block — replace it
    if CSS_INJECT_START in html:
        html = re.sub(
            re.escape(CSS_INJECT_START) + r'.*?' + re.escape(CSS_INJECT_END),
            BUTTON_CSS.strip(),
            html,
            flags=re.DOTALL
        )
        return html

    # Has old booking-cta block with clear end marker — replace it
    old_start = '/* ── Booking.com unified CTA button'
    old_end_variants = [
        '/* ── end Booking.com unified CTA button ── */',
        '/* ─── end Booking.com',
    ]
    for old_end in old_end_variants:
        if old_start in html and old_end in html:
            html = re.sub(
                re.escape(old_start) + r'.*?' + re.escape(old_end),
                BUTTON_CSS.strip(),
                html,
                flags=re.DOTALL
            )
            return html

    # Find insertion point: before </head>
    head_pos = html.find('</head>')
    if head_pos == -1:
        return html

    # Prefer appending to last </style> before </head>
    style_end = html.rfind('</style>', 0, head_pos)
    if style_end != -1:
        return html[:style_end] + '\n' + BUTTON_CSS + '\n' + html[style_end:]

    return html[:head_pos] + '<style>' + BUTTON_CSS + '</style>\n' + html[head_pos:]


def process_file(path: Path) -> tuple[bool, int]:
    """Returns (modified, cta_count)."""
    text = path.read_text(encoding='utf-8')

    if 'booking.com' not in text:
        return False, 0

    counter = [0]
    original_anchor_re = re.compile(r'<a\b[^>]*>.*?</a>', re.DOTALL | re.IGNORECASE)

    def replace_and_count(m):
        result = replace_anchor(m)
        if result != m.group(0):
            counter[0] += 1
        return result

    modified = original_anchor_re.sub(replace_and_count, text)

    if counter[0] == 0 and 'booking-com-button' not in text:
        return False, 0

    modified = inject_css(modified)

    if modified == text:
        return False, 0

    path.write_text(modified, encoding='utf-8')
    return True, counter[0]


def main():
    html_files = sorted(REPO_ROOT.glob('*.html'))
    total_files = 0
    total_ctas = 0

    for f in html_files:
        changed, count = process_file(f)
        if changed:
            total_files += 1
            total_ctas += count
            print(f'  {f.name}: {count} CTAs')

    print(f'\n{"="*50}')
    print(f'Files updated : {total_files}')
    print(f'CTAs replaced : {total_ctas}')
    print(f'{"="*50}')


if __name__ == '__main__':
    main()
