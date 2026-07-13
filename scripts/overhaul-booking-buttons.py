#!/usr/bin/env python3
"""
Sitewide Booking.com button visual overhaul.
Replaces all Booking.com CTA buttons with uniform .booking-cta styled buttons.
CRITICAL: Does NOT modify any URLs, href, data-booking-url, aid, sid, or tracking params.
Only changes inner button content and adds booking-cta CSS class.
"""

import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent

TARGET_CLASSES = [
    'hotel-book-btn', 'nav-stays-btn', 'mobile-stays-btn', 'verdict-book-btn',
    'hft-btn', 'bb-cta-primary', 'sc-book-btn', 'booking-button', 'hs-book-btn',
]

BOOKING_CTA_CSS = """
/* ── Booking.com unified CTA button ── */
.booking-cta {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 10px !important;
  min-width: 200px !important;
  height: 50px !important;
  padding: 0 22px !important;
  background: #003b94 !important;
  border-radius: 8px !important;
  text-decoration: none !important;
  transition: background 0.15s ease, transform 0.1s ease !important;
  box-shadow: 0 2px 6px rgba(0,59,148,.35) !important;
  white-space: nowrap !important;
  vertical-align: middle !important;
  font-size: unset !important;
  color: #ffffff !important;
  border: none !important;
  cursor: pointer !important;
}
.booking-cta:hover {
  background: #002f7a !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0,59,148,.45) !important;
  color: #ffffff !important;
}
.booking-cta:active {
  transform: translateY(0) !important;
}
.booking-cta__logo {
  height: 20px !important;
  width: auto !important;
  display: block !important;
  flex-shrink: 0 !important;
}
.booking-cta__label {
  font-family: inherit !important;
  font-size: 0.88rem !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  letter-spacing: 0.01em !important;
  line-height: 1 !important;
}
/* ── end Booking.com unified CTA button ── */"""

BUTTON_INNER = (
    '<img src="booking-logo.svg" class="booking-cta__logo" alt="Booking.com" loading="lazy">'
    '<span class="booking-cta__label">Check availability</span>'
)

# Match any <a ...>...</a> where opening tag contains booking.com AND has one of our classes
ANCHOR_RE = re.compile(r'<a\b[^>]*>.*?</a>', re.DOTALL | re.IGNORECASE)


def has_booking_href(tag: str) -> bool:
    return 'booking.com' in tag


def has_target_class(tag: str) -> bool:
    m = re.search(r'class="([^"]*)"', tag, re.IGNORECASE)
    if not m:
        return False
    classes = m.group(1)
    return any(c in classes for c in TARGET_CLASSES)


def add_booking_cta_class(opening_tag: str) -> str:
    if 'booking-cta' in opening_tag:
        return opening_tag
    return re.sub(r'(class=")', r'\1booking-cta ', opening_tag, count=1)


def strip_inline_style(opening_tag: str) -> str:
    return re.sub(r'\s*style="[^"]*"', '', opening_tag)


def replace_anchor(match: re.Match) -> str:
    full = match.group(0)
    # Split into opening tag, inner content, closing tag
    tag_m = re.match(r'(<a\b[^>]*>)(.*)(</a>)', full, re.DOTALL | re.IGNORECASE)
    if not tag_m:
        return full
    opening, _inner, closing = tag_m.group(1), tag_m.group(2), tag_m.group(3)

    if not has_booking_href(opening) or not has_target_class(opening):
        return full

    new_opening = add_booking_cta_class(opening)
    new_opening = strip_inline_style(new_opening)
    return new_opening + BUTTON_INNER + closing


def inject_css(html: str) -> str:
    start_marker = '/* ── Booking.com unified CTA button ── */'
    end_marker = '/* ── end Booking.com unified CTA button ── */'

    if start_marker in html:
        # Replace existing block
        html = re.sub(
            re.escape(start_marker) + r'.*?' + re.escape(end_marker),
            BOOKING_CTA_CSS.strip(),
            html,
            flags=re.DOTALL
        )
        return html

    # Append before last </style> that precedes </head>
    head_pos = html.find('</head>')
    if head_pos == -1:
        return html

    style_end = html.rfind('</style>', 0, head_pos)
    if style_end != -1:
        return html[:style_end] + '\n' + BOOKING_CTA_CSS + '\n' + html[style_end:]

    # Fallback: inject new style block before </head>
    return html[:head_pos] + '<style>' + BOOKING_CTA_CSS + '</style>\n' + html[head_pos:]


def process_file(path: Path) -> bool:
    text = path.read_text(encoding='utf-8')

    if 'booking.com' not in text:
        return False

    modified = ANCHOR_RE.sub(replace_anchor, text)

    if modified == text:
        return False

    modified = inject_css(modified)
    path.write_text(modified, encoding='utf-8')
    return True


def main():
    html_files = sorted(REPO_ROOT.glob('*.html'))
    changed = 0
    skipped = 0

    for f in html_files:
        if process_file(f):
            changed += 1
            print(f'  updated: {f.name}')
        else:
            skipped += 1

    print(f'\nDone. {changed} files updated, {skipped} files skipped.')


if __name__ == '__main__':
    main()
