#!/usr/bin/env python3
"""
Apply 4 SEO/conversion improvements to 9 hotel review pages:
1. Add visible FAQ section (extracted from JSON-LD FAQPage schema)
2. Add Quick Take intro box after breadcrumb nav
3. Add comparison table after Final Verdict paragraph
4. Add internal links within the prose
"""

import re
import json
import html

# ---------------------------------------------------------------------------
# Per-page data
# ---------------------------------------------------------------------------

PAGES = {
    "hyatt-regency-da-nang.html": {
        "hotel_name": "Hyatt Regency Danang Resort and Spa",
        "quick_take": "One of Da Nang's best all-round beach resorts — five pools, direct Non Nuoc beachfront, reliable 5-star service",
        "score": "8.7",
        "best_for": "families and couples wanting a self-contained beach holiday",
        "comparison_rows": [
            {"name": "Hyatt Regency", "star": True, "file": None, "price": "$180", "location": "Non Nuoc Beach", "beach": "&#10003;", "use": "Families &amp; couples", "score": "8.7/10"},
            {"name": "Sheraton Grand", "star": False, "file": "sheraton-grand-da-nang.html", "price": "$160", "location": "My An Beach", "beach": "&#10003;", "use": "Families", "score": "8.6/10"},
            {"name": "Marriott Da Nang", "star": False, "file": "marriott-resort-da-nang.html", "price": "$150", "location": "My An Beach", "beach": "&#10003;", "use": "Luxury couples", "score": "8.5/10"},
            {"name": "Radisson Blu", "star": False, "file": "radisson-blu-da-nang.html", "price": "$130", "location": "Non Nuoc", "beach": "&#10003;", "use": "Value luxury", "score": "8.2/10"},
        ],
        "internal_links": [
            # (old_text, new_text_with_link)  — only first occurrence replaced
            ("Non Nuoc Beach", '<a href="non-nuoc-beach-da-nang.html" style="color:#1B5C5C;">Non Nuoc Beach</a>'),
            ("luxury hotels in Da Nang", '<a href="luxury-hotels-da-nang.html" style="color:#1B5C5C;">luxury hotels in Da Nang</a>'),
            ("beach hotels in Da Nang", '<a href="da-nang-beach-hotels.html" style="color:#1B5C5C;">beach hotels in Da Nang</a>'),
            ("best hotels in Da Nang", '<a href="best-hotels-in-da-nang.html" style="color:#1B5C5C;">best hotels in Da Nang</a>'),
            ("Da Nang hotel prices", '<a href="da-nang-hotel-prices-by-month.html" style="color:#1B5C5C;">Da Nang hotel prices</a>'),
        ],
    },
    "marriott-resort-da-nang.html": {
        "hotel_name": "Da Nang Marriott Resort &amp; Spa",
        "quick_take": "Polished 5-star beach resort with strong Marriott Bonvoy earning - consistently excellent service and a solid pool complex on My An Beach",
        "score": "8.5",
        "best_for": "Marriott Bonvoy members and luxury beach holiday seekers",
        "comparison_rows": [
            {"name": "Marriott Da Nang", "star": True, "file": None, "price": "$150", "location": "My An Beach", "beach": "&#10003;", "use": "Marriott loyalists", "score": "8.5/10"},
            {"name": "Hyatt Regency", "star": False, "file": "hyatt-regency-da-nang.html", "price": "$180", "location": "Non Nuoc", "beach": "&#10003;", "use": "Families &amp; couples", "score": "8.7/10"},
            {"name": "Sheraton Grand", "star": False, "file": "sheraton-grand-da-nang.html", "price": "$160", "location": "My An", "beach": "&#10003;", "use": "Families", "score": "8.6/10"},
            {"name": "Pullman", "star": False, "file": "pullman-da-nang.html", "price": "$140", "location": "My Khe", "beach": "&#10003;", "use": "Couples", "score": "8.3/10"},
        ],
        "internal_links": [
            ("My An Beach", '<a href="da-nang-beach-hotels.html" style="color:#1B5C5C;">My An Beach</a>'),
            ("best hotels in Da Nang", '<a href="best-hotels-in-da-nang.html" style="color:#1B5C5C;">best hotels in Da Nang</a>'),
            ("luxury hotels in Da Nang", '<a href="luxury-hotels-da-nang.html" style="color:#1B5C5C;">luxury hotels in Da Nang</a>'),
            ("Da Nang hotel prices", '<a href="da-nang-hotel-prices-by-month.html" style="color:#1B5C5C;">Da Nang hotel prices</a>'),
            ("where to stay in Da Nang", '<a href="where-to-stay-in-da-nang.html" style="color:#1B5C5C;">where to stay in Da Nang</a>'),
        ],
    },
    "intercontinental-da-nang.html": {
        "hotel_name": "InterContinental Danang Sun Peninsula Resort",
        "quick_take": "Da Nang's best hotel and one of Southeast Asia's most spectacular resorts - clifftop jungle setting, private bay, MICHELIN dining",
        "score": "9.2",
        "best_for": "ultra-luxury travellers and special occasion stays",
        "comparison_rows": [
            {"name": "InterContinental", "star": True, "file": None, "price": "$380", "location": "Son Tra Peninsula", "beach": "Private bay", "use": "Ultra-luxury", "score": "9.2/10"},
            {"name": "Hyatt Regency", "star": False, "file": "hyatt-regency-da-nang.html", "price": "$180", "location": "Non Nuoc Beach", "beach": "&#10003;", "use": "Families &amp; couples", "score": "8.7/10"},
            {"name": "Vinpearl Luxury", "star": False, "file": "vinpearl-luxury-da-nang.html", "price": "$250", "location": "Son Tra clifftop", "beach": "Private", "use": "Luxury seclusion", "score": "8.5/10"},
            {"name": "Naman Retreat", "star": False, "file": "naman-retreat-da-nang.html", "price": "$160", "location": "Non Nuoc", "beach": "&#10003;", "use": "Romance &amp; wellness", "score": "8.9/10"},
        ],
        "internal_links": [
            ("Son Tra Peninsula", '<a href="son-tra-peninsula-da-nang.html" style="color:#1B5C5C;">Son Tra Peninsula</a>'),
            ("luxury hotels in Da Nang", '<a href="luxury-hotels-da-nang.html" style="color:#1B5C5C;">luxury hotels in Da Nang</a>'),
            ("best hotels in Da Nang", '<a href="best-hotels-in-da-nang.html" style="color:#1B5C5C;">best hotels in Da Nang</a>'),
            ("Da Nang vs Hoi An", '<a href="da-nang-vs-hoi-an.html" style="color:#1B5C5C;">Da Nang vs Hoi An</a>'),
            ("Marble Mountains", '<a href="marble-mountains-da-nang.html" style="color:#1B5C5C;">Marble Mountains</a>'),
        ],
    },
    "sheraton-grand-da-nang.html": {
        "hotel_name": "Sheraton Grand Danang Resort",
        "quick_take": "Da Nang's best family resort - seven pools, waterslides, a proper kids' club, and direct My An beachfront",
        "score": "8.6",
        "best_for": "families with children and groups",
        "comparison_rows": [
            {"name": "Sheraton Grand", "star": True, "file": None, "price": "$160", "location": "My An Beach", "beach": "&#10003;", "use": "Families", "score": "8.6/10"},
            {"name": "Hyatt Regency", "star": False, "file": "hyatt-regency-da-nang.html", "price": "$180", "location": "Non Nuoc", "beach": "&#10003;", "use": "Families &amp; couples", "score": "8.7/10"},
            {"name": "Marriott", "star": False, "file": "marriott-resort-da-nang.html", "price": "$150", "location": "My An", "beach": "&#10003;", "use": "Luxury couples", "score": "8.5/10"},
            {"name": "Premier Village", "star": False, "file": "premier-village-da-nang.html", "price": "$180", "location": "My Khe tip", "beach": "&#10003;", "use": "Privacy-seeking families", "score": "8.8/10"},
        ],
        "internal_links": [
            ("family hotels in Da Nang", '<a href="family-hotels-da-nang.html" style="color:#1B5C5C;">family hotels in Da Nang</a>'),
            ("best hotels in Da Nang", '<a href="best-hotels-in-da-nang.html" style="color:#1B5C5C;">best hotels in Da Nang</a>'),
            ("beach hotels in Da Nang", '<a href="da-nang-beach-hotels.html" style="color:#1B5C5C;">beach hotels in Da Nang</a>'),
            ("Da Nang hotel prices", '<a href="da-nang-hotel-prices-by-month.html" style="color:#1B5C5C;">Da Nang hotel prices</a>'),
            ("where to stay in Da Nang", '<a href="where-to-stay-in-da-nang.html" style="color:#1B5C5C;">where to stay in Da Nang</a>'),
        ],
    },
    "pullman-da-nang.html": {
        "hotel_name": "Pullman Danang Beach Resort",
        "quick_take": "Modern 5-star right on My Khe Beach's most active strip - strong location for couples who want both beach and city access",
        "score": "8.3",
        "best_for": "couples and design-conscious travellers",
        "comparison_rows": [
            {"name": "Pullman Danang", "star": True, "file": None, "price": "$140", "location": "My Khe", "beach": "&#10003;", "use": "Couples", "score": "8.3/10"},
            {"name": "Melia Da Nang", "star": False, "file": "melia-da-nang.html", "price": "$140", "location": "My Khe", "beach": "&#10003;", "use": "Design &amp; adults", "score": "8.3/10"},
            {"name": "Sheraton Grand", "star": False, "file": "sheraton-grand-da-nang.html", "price": "$160", "location": "My An", "beach": "&#10003;", "use": "Families", "score": "8.6/10"},
            {"name": "A La Carte", "star": False, "file": "a-la-carte-da-nang.html", "price": "$90", "location": "My Khe", "beach": "&#10003;", "use": "Value beach", "score": "7.8/10"},
        ],
        "internal_links": [
            ("My Khe Beach", '<a href="my-khe-beach-da-nang.html" style="color:#1B5C5C;">My Khe Beach</a>'),
            ("best hotels in Da Nang", '<a href="best-hotels-in-da-nang.html" style="color:#1B5C5C;">best hotels in Da Nang</a>'),
            ("beach hotels in Da Nang", '<a href="da-nang-beach-hotels.html" style="color:#1B5C5C;">beach hotels in Da Nang</a>'),
            ("Da Nang hotel prices", '<a href="da-nang-hotel-prices-by-month.html" style="color:#1B5C5C;">Da Nang hotel prices</a>'),
            ("where to stay in Da Nang", '<a href="where-to-stay-in-da-nang.html" style="color:#1B5C5C;">where to stay in Da Nang</a>'),
        ],
    },
    "hilton-da-nang.html": {
        "hotel_name": "Hilton Da Nang",
        "quick_take": "Da Nang's best city hotel - Han River location, infinity pool, and easy access to Dragon Bridge and the old quarter",
        "score": "8.1",
        "best_for": "business travellers and city-focused visitors",
        "comparison_rows": [
            {"name": "Hilton Da Nang", "star": True, "file": None, "price": "$120", "location": "Han River", "beach": "City", "use": "Business &amp; city access", "score": "8.1/10"},
            {"name": "Novotel Han River", "star": False, "file": "novotel-da-nang-han-river.html", "price": "$100", "location": "Han River", "beach": "City", "use": "Value city hotel", "score": "7.9/10"},
            {"name": "Melia Vinpearl", "star": False, "file": "melia-vinpearl-da-nang.html", "price": "$110", "location": "Han River", "beach": "City", "use": "City &amp; river", "score": "7.7/10"},
            {"name": "Pullman", "star": False, "file": "pullman-da-nang.html", "price": "$140", "location": "My Khe", "beach": "Beach", "use": "Couples &amp; beach", "score": "8.3/10"},
        ],
        "internal_links": [
            ("best hotels in Da Nang", '<a href="best-hotels-in-da-nang.html" style="color:#1B5C5C;">best hotels in Da Nang</a>'),
            ("where to stay in Da Nang", '<a href="where-to-stay-in-da-nang.html" style="color:#1B5C5C;">where to stay in Da Nang</a>'),
            ("Da Nang hotel prices", '<a href="da-nang-hotel-prices-by-month.html" style="color:#1B5C5C;">Da Nang hotel prices</a>'),
            ("first-time visitors to Da Nang", '<a href="da-nang-first-time-visitors.html" style="color:#1B5C5C;">first-time visitors to Da Nang</a>'),
            ("Da Nang vs Hoi An", '<a href="da-nang-vs-hoi-an.html" style="color:#1B5C5C;">Da Nang vs Hoi An</a>'),
        ],
    },
    "radisson-blu-da-nang.html": {
        "hotel_name": "Radisson Blu Resort Danang",
        "quick_take": "Best-value 5-star beachfront resort in Da Nang - long Non Nuoc Beach frontage at rates well below Hyatt or Sheraton",
        "score": "8.2",
        "best_for": "value-conscious travellers wanting proper 5-star beachfront",
        "comparison_rows": [
            {"name": "Radisson Blu", "star": True, "file": None, "price": "$130", "location": "Non Nuoc", "beach": "&#10003;", "use": "Value luxury", "score": "8.2/10"},
            {"name": "Hyatt Regency", "star": False, "file": "hyatt-regency-da-nang.html", "price": "$180", "location": "Non Nuoc", "beach": "&#10003;", "use": "Families &amp; couples", "score": "8.7/10"},
            {"name": "Marriott", "star": False, "file": "marriott-resort-da-nang.html", "price": "$150", "location": "My An", "beach": "&#10003;", "use": "Luxury couples", "score": "8.5/10"},
            {"name": "Silk Path Grand", "star": False, "file": "silk-path-grand-da-nang.html", "price": "$130", "location": "Non Nuoc south", "beach": "&#10003;", "use": "Boutique luxury", "score": "8.0/10"},
        ],
        "internal_links": [
            ("Non Nuoc Beach", '<a href="non-nuoc-beach-da-nang.html" style="color:#1B5C5C;">Non Nuoc Beach</a>'),
            ("best hotels in Da Nang", '<a href="best-hotels-in-da-nang.html" style="color:#1B5C5C;">best hotels in Da Nang</a>'),
            ("luxury hotels in Da Nang", '<a href="luxury-hotels-da-nang.html" style="color:#1B5C5C;">luxury hotels in Da Nang</a>'),
            ("Da Nang hotel prices", '<a href="da-nang-hotel-prices-by-month.html" style="color:#1B5C5C;">Da Nang hotel prices</a>'),
            ("beach hotels in Da Nang", '<a href="da-nang-beach-hotels.html" style="color:#1B5C5C;">beach hotels in Da Nang</a>'),
        ],
    },
    "melia-da-nang.html": {
        "hotel_name": "Melia Danang Beach Resort",
        "quick_take": "Da Nang's most design-forward beach hotel - minimalist Spanish-managed resort on My Khe with strong adult appeal",
        "score": "8.3",
        "best_for": "design-conscious couples and adults-only stays",
        "comparison_rows": [
            {"name": "Melia Da Nang", "star": True, "file": None, "price": "$140", "location": "My Khe", "beach": "&#10003;", "use": "Design &amp; adults", "score": "8.3/10"},
            {"name": "Pullman", "star": False, "file": "pullman-da-nang.html", "price": "$140", "location": "My Khe", "beach": "&#10003;", "use": "Couples", "score": "8.3/10"},
            {"name": "Radisson Blu", "star": False, "file": "radisson-blu-da-nang.html", "price": "$130", "location": "Non Nuoc", "beach": "&#10003;", "use": "Value luxury", "score": "8.2/10"},
            {"name": "TIA Wellness", "star": False, "file": "tia-wellness-resort-da-nang.html", "price": "$160", "location": "My Khe south", "beach": "&#10003;", "use": "Wellness &amp; couples", "score": "8.7/10"},
        ],
        "internal_links": [
            ("My Khe Beach", '<a href="my-khe-beach-da-nang.html" style="color:#1B5C5C;">My Khe Beach</a>'),
            ("best hotels in Da Nang", '<a href="best-hotels-in-da-nang.html" style="color:#1B5C5C;">best hotels in Da Nang</a>'),
            ("beach hotels in Da Nang", '<a href="da-nang-beach-hotels.html" style="color:#1B5C5C;">beach hotels in Da Nang</a>'),
            ("luxury hotels in Da Nang", '<a href="luxury-hotels-da-nang.html" style="color:#1B5C5C;">luxury hotels in Da Nang</a>'),
            ("Da Nang hotel prices", '<a href="da-nang-hotel-prices-by-month.html" style="color:#1B5C5C;">Da Nang hotel prices</a>'),
        ],
    },
    "premier-village-da-nang.html": {
        "hotel_name": "Premier Village Danang Resort",
        "quick_take": "Da Nang's best family villa resort - private pool villas with direct beach access at the quieter southern tip of My Khe",
        "score": "8.8",
        "best_for": "families wanting villa privacy with beach access",
        "comparison_rows": [
            {"name": "Premier Village", "star": True, "file": None, "price": "$180", "location": "My Khe tip", "beach": "&#10003;", "use": "Families (villas)", "score": "8.8/10"},
            {"name": "Sheraton Grand", "star": False, "file": "sheraton-grand-da-nang.html", "price": "$160", "location": "My An", "beach": "&#10003;", "use": "Families (resort)", "score": "8.6/10"},
            {"name": "Hyatt Regency", "star": False, "file": "hyatt-regency-da-nang.html", "price": "$180", "location": "Non Nuoc", "beach": "&#10003;", "use": "Families &amp; couples", "score": "8.7/10"},
            {"name": "Naman Retreat", "star": False, "file": "naman-retreat-da-nang.html", "price": "$160", "location": "Non Nuoc", "beach": "&#10003;", "use": "Couples &amp; adults", "score": "8.9/10"},
        ],
        "internal_links": [
            ("My Khe Beach", '<a href="my-khe-beach-da-nang.html" style="color:#1B5C5C;">My Khe Beach</a>'),
            ("best hotels in Da Nang", '<a href="best-hotels-in-da-nang.html" style="color:#1B5C5C;">best hotels in Da Nang</a>'),
            ("family hotels in Da Nang", '<a href="family-hotels-da-nang.html" style="color:#1B5C5C;">family hotels in Da Nang</a>'),
            ("Da Nang hotel prices", '<a href="da-nang-hotel-prices-by-month.html" style="color:#1B5C5C;">Da Nang hotel prices</a>'),
            ("where to stay in Da Nang", '<a href="where-to-stay-in-da-nang.html" style="color:#1B5C5C;">where to stay in Da Nang</a>'),
        ],
    },
}

# ---------------------------------------------------------------------------
# Helper: build FAQ section HTML
# ---------------------------------------------------------------------------

def build_faq_section(hotel_name_display, questions):
    items_html = ""
    for q in questions:
        question_text = q["name"]
        answer_text = q["acceptedAnswer"]["text"]
        # Escape for HTML display
        answer_text = answer_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        items_html += (
            f'<details style="border-bottom:1px solid #D9CDBB;">'
            f'<summary style="font-size:.95rem;font-weight:600;color:#1A1A18;padding:1rem 0;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">'
            f'{question_text}'
            f'<span style="font-size:1.2rem;color:#1B5C5C;flex-shrink:0;margin-left:1rem;">+</span></summary>'
            f'<p style="font-size:.9rem;color:#3C3C38;line-height:1.8;padding:.5rem 0 1rem;max-width:65ch;">{answer_text}</p>'
            f'</details>\n'
        )
    return (
        f'\n<section id="faq" style="background:var(--sand,#F6F1E9);padding:clamp(2rem,5vw,3.5rem) clamp(1.25rem,5vw,3rem);border-top:1px solid var(--sand-dark,#D9CDBB);">\n'
        f'<div style="max-width:760px;margin:0 auto;">\n'
        f'<p style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#1B5C5C;margin-bottom:.6rem;">Common Questions</p>\n'
        f'<h2 style="font-family:\'Instrument Serif\',Georgia,serif;font-size:clamp(1.5rem,3vw,2.1rem);color:#1A1A18;line-height:1.1;letter-spacing:-.025em;margin-bottom:1.8rem;">'
        f'{hotel_name_display}: <em style="color:#1B5C5C;font-style:italic">FAQ</em></h2>\n'
        f'<div style="border-top:1px solid #D9CDBB;">\n'
        f'{items_html}'
        f'</div>\n'
        f'</div>\n'
        f'</section>\n'
    )

# ---------------------------------------------------------------------------
# Helper: build Quick Take box HTML
# ---------------------------------------------------------------------------

def build_quick_take(quick_take, score, best_for):
    return (
        f'\n<div style="background:#EAF4F4;border-bottom:1px solid #D9CDBB;padding:.9rem clamp(1.25rem,5vw,3rem);">\n'
        f'<div style="max-width:1160px;margin:0 auto;display:flex;align-items:flex-start;gap:1.2rem;flex-wrap:wrap;">\n'
        f'<div style="flex:1;min-width:200px;">\n'
        f'<p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#1B5C5C;margin-bottom:.3rem;">Quick Take</p>\n'
        f'<p style="font-size:.9rem;color:#3C3C38;line-height:1.6;margin:0;">{quick_take} - our score: {score}/10. <strong>Best for:</strong> {best_for}.</p>\n'
        f'</div>\n'
        f'<div style="flex:1;min-width:200px;">\n'
        f'<p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#1B5C5C;margin-bottom:.4rem;">On this page</p>\n'
        f'<ul style="margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:.3rem .8rem;">\n'
        f'<li style="font-size:.82rem;color:#7A7A70;">&#8594; <a href="#overview" style="color:#1B5C5C;">Overview</a></li>\n'
        f'<li style="font-size:.82rem;color:#7A7A70;">&#8594; <a href="#rooms" style="color:#1B5C5C;">Rooms</a></li>\n'
        f'<li style="font-size:.82rem;color:#7A7A70;">&#8594; <a href="#pools" style="color:#1B5C5C;">Pools &amp; Beach</a></li>\n'
        f'<li style="font-size:.82rem;color:#7A7A70;">&#8594; <a href="#dining" style="color:#1B5C5C;">Dining</a></li>\n'
        f'<li style="font-size:.82rem;color:#7A7A70;">&#8594; <a href="#verdict" style="color:#1B5C5C;">Verdict</a></li>\n'
        f'<li style="font-size:.82rem;color:#7A7A70;">&#8594; <a href="#faq" style="color:#1B5C5C;">FAQ</a></li>\n'
        f'</ul>\n'
        f'</div>\n'
        f'</div>\n'
        f'</div>\n'
    )

# ---------------------------------------------------------------------------
# Helper: build comparison table HTML
# ---------------------------------------------------------------------------

def build_comparison_table(rows):
    tbody_html = ""
    for row in rows:
        if row["star"]:
            tbody_html += (
                f'<tr style="background:#EAF4F4;border-bottom:1px solid #D9CDBB;">'
                f'<td style="padding:.7rem 1rem;font-weight:700;color:#1B5C5C;">{row["name"]} &#9733;</td>'
                f'<td style="padding:.7rem .8rem;text-align:center;">{row["price"]}</td>'
                f'<td style="padding:.7rem .8rem;text-align:center;">{row["location"]}</td>'
                f'<td style="padding:.7rem .8rem;text-align:center;">{row["beach"]}</td>'
                f'<td style="padding:.7rem .8rem;text-align:center;">{row["use"]}</td>'
                f'<td style="padding:.7rem .8rem;text-align:center;font-weight:700;color:#1B5C5C;">{row["score"]}</td>'
                f'</tr>\n'
            )
        else:
            tbody_html += (
                f'<tr style="background:#fff;border-bottom:1px solid #D9CDBB;">'
                f'<td style="padding:.7rem 1rem;"><a href="{row["file"]}" style="color:#1A1A18;">{row["name"]}</a></td>'
                f'<td style="padding:.7rem .8rem;text-align:center;">{row["price"]}</td>'
                f'<td style="padding:.7rem .8rem;text-align:center;">{row["location"]}</td>'
                f'<td style="padding:.7rem .8rem;text-align:center;">{row["beach"]}</td>'
                f'<td style="padding:.7rem .8rem;text-align:center;">{row["use"]}</td>'
                f'<td style="padding:.7rem .8rem;text-align:center;">{row["score"]}</td>'
                f'</tr>\n'
            )

    return (
        f'\n<h2>How It Compares</h2>\n'
        f'<div style="overflow-x:auto;margin:1rem 0 2rem;">\n'
        f'<table style="width:100%;border-collapse:collapse;font-size:.85rem;">\n'
        f'<thead><tr style="background:#0D3535;color:#fff;">\n'
        f'<th style="padding:.7rem 1rem;text-align:left;font-weight:600;">Hotel</th>\n'
        f'<th style="padding:.7rem .8rem;text-align:center;">From/night</th>\n'
        f'<th style="padding:.7rem .8rem;text-align:center;">Location</th>\n'
        f'<th style="padding:.7rem .8rem;text-align:center;">Beach</th>\n'
        f'<th style="padding:.7rem .8rem;text-align:center;">Best For</th>\n'
        f'<th style="padding:.7rem .8rem;text-align:center;">Score</th>\n'
        f'</tr></thead>\n'
        f'<tbody>\n'
        f'{tbody_html}'
        f'</tbody>\n'
        f'</table>\n'
        f'</div>\n'
        f'<p style="font-size:.78rem;color:#7A7A70;margin-top:-.5rem;">&#9733; = this hotel. Prices are indicative peak low-season rates.</p>\n'
    )

# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------

BASE = "/Users/ryanyousefi/dananghotelguide"

def process_file(filename, data):
    path = f"{BASE}/{filename}"
    print(f"\n{'='*60}")
    print(f"Processing: {filename}")
    print(f"{'='*60}")

    with open(path, 'r', errors='ignore') as f:
        content = f.read()

    original_len = len(content)
    results = {}

    # -----------------------------------------------------------------------
    # IMPROVEMENT 1: Extract FAQ from JSON-LD and build visible section
    # -----------------------------------------------------------------------
    script_matches = re.findall(
        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
        content, re.DOTALL
    )
    faq_questions = []
    for s in script_matches:
        try:
            d = json.loads(s)
            if d.get('@type') == 'FAQPage':
                faq_questions = d.get('mainEntity', [])
                break
        except Exception:
            pass

    if not faq_questions:
        print(f"  WARNING: No FAQPage JSON-LD found in {filename}")
        results["faq"] = "SKIPPED - no FAQPage JSON-LD"
    else:
        print(f"  Found {len(faq_questions)} FAQ questions")
        hotel_name_display = data["hotel_name"]
        faq_html = build_faq_section(hotel_name_display, faq_questions)
        insert_marker = '<section style="background:var(--ocean-deep)'
        if insert_marker in content:
            content = content.replace(insert_marker, faq_html + insert_marker, 1)
            results["faq"] = f"Added {len(faq_questions)} FAQ items"
            print(f"  FAQ section inserted before ocean-deep CTA")
        else:
            results["faq"] = "SKIPPED - ocean-deep marker not found"
            print(f"  WARNING: ocean-deep marker not found")

    # -----------------------------------------------------------------------
    # IMPROVEMENT 2: Add Quick Take box after breadcrumb nav
    # -----------------------------------------------------------------------
    # Find the <nav class="breadcrumb"> block and its closing </nav>
    bc_pattern = re.compile(r'<nav class="breadcrumb">.*?</nav>', re.DOTALL)
    bc_match = bc_pattern.search(content)
    if bc_match:
        bc_end = bc_match.end()
        qt_html = build_quick_take(data["quick_take"], data["score"], data["best_for"])
        content = content[:bc_end] + qt_html + content[bc_end:]
        results["quick_take"] = "Added Quick Take box"
        print(f"  Quick Take box inserted after breadcrumb nav")
    else:
        # Fallback: try aria-label="Breadcrumb" nav
        bc_match2 = re.search(r'aria-label="Breadcrumb"', content)
        if bc_match2:
            # Find the next </nav> after this point
            nav_end = content.find('</nav>', bc_match2.end())
            if nav_end >= 0:
                insert_pos = nav_end + len('</nav>')
                qt_html = build_quick_take(data["quick_take"], data["score"], data["best_for"])
                content = content[:insert_pos] + qt_html + content[insert_pos:]
                results["quick_take"] = "Added Quick Take box (aria-label fallback)"
                print(f"  Quick Take box inserted after aria-label Breadcrumb nav")
            else:
                results["quick_take"] = "SKIPPED - no closing </nav> after Breadcrumb"
                print(f"  WARNING: no closing </nav> after Breadcrumb")
        else:
            results["quick_take"] = "SKIPPED - breadcrumb nav not found"
            print(f"  WARNING: breadcrumb nav not found")

    # -----------------------------------------------------------------------
    # IMPROVEMENT 3: Add comparison table after first </p> following Final Verdict
    # -----------------------------------------------------------------------
    fv_marker = '<h2>Final Verdict</h2>'
    fv_pos = content.find(fv_marker)
    if fv_pos >= 0:
        # Find the first </p> after the h2
        after_fv = content[fv_pos + len(fv_marker):]
        p_end = after_fv.find('</p>')
        if p_end >= 0:
            insert_pos = fv_pos + len(fv_marker) + p_end + len('</p>')
            cmp_html = build_comparison_table(data["comparison_rows"])
            content = content[:insert_pos] + cmp_html + content[insert_pos:]
            results["comparison"] = f"Added comparison table with {len(data['comparison_rows'])} rows"
            print(f"  Comparison table inserted after Final Verdict paragraph")
        else:
            results["comparison"] = "SKIPPED - no </p> after Final Verdict"
            print(f"  WARNING: no </p> after Final Verdict")
    else:
        results["comparison"] = "SKIPPED - Final Verdict h2 not found"
        print(f"  WARNING: <h2>Final Verdict</h2> not found")

    # -----------------------------------------------------------------------
    # IMPROVEMENT 4: Add internal links (first occurrence only)
    # -----------------------------------------------------------------------
    # We only want to link within the main article/prose, not in JSON-LD or nav
    # Strategy: split at a reasonable marker and only replace in the prose portion.
    # We'll mark already-linked text to avoid double-linking.
    links_added = []
    for old_text, new_link_html in data["internal_links"]:
        # Skip if old_text is already linked (appears inside an <a> tag)
        # Check if old_text appears as a standalone text (not already inside href)
        # We'll do a simple check: look for old_text not preceded by 'href=' context
        # Use a pattern that avoids replacing inside HTML tags or existing links
        # Pattern: old_text NOT inside an <a...> tag
        pattern = re.compile(
            r'(?<!href=")(?<!href=\')(?<!\w)(' + re.escape(old_text) + r')(?!\w*["\'])',
        )
        # More robust: find first occurrence not inside an HTML tag attribute
        # We'll search the content for old_text and check surrounding context
        search_start = 0
        replaced = False
        while True:
            idx = content.find(old_text, search_start)
            if idx < 0:
                break
            # Check we're not inside a tag attribute (look back for unmatched <)
            before = content[max(0, idx-200):idx]
            after = content[idx:idx+len(old_text)+200]
            # If inside <a...> already, skip
            # Check if there's an opening < without a > after it right before our text
            last_lt = before.rfind('<')
            last_gt = before.rfind('>')
            if last_lt > last_gt:
                # Inside a tag
                search_start = idx + 1
                continue
            # Check not already inside an <a> tag
            # Find the nearest <a before our position
            last_a_open = before.rfind('<a ')
            last_a_close = before.rfind('</a>')
            if last_a_open > last_a_close:
                # Inside an <a> tag
                search_start = idx + 1
                continue
            # Replace this occurrence
            content = content[:idx] + new_link_html + content[idx + len(old_text):]
            links_added.append(old_text)
            replaced = True
            break

        if not replaced:
            print(f"  Note: '{old_text}' not found in prose or already linked")

    results["internal_links"] = f"Added links: {links_added}" if links_added else "No links added"
    print(f"  Internal links added: {links_added}")

    # -----------------------------------------------------------------------
    # Write back
    # -----------------------------------------------------------------------
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

    new_len = len(content)
    print(f"  File size: {original_len:,} -> {new_len:,} bytes (+{new_len-original_len:,})")
    return results


# Run all pages
all_results = {}
for filename, data in PAGES.items():
    try:
        all_results[filename] = process_file(filename, data)
    except Exception as e:
        print(f"  ERROR processing {filename}: {e}")
        import traceback
        traceback.print_exc()
        all_results[filename] = {"error": str(e)}

# Summary
print(f"\n{'='*60}")
print("SUMMARY")
print(f"{'='*60}")
for fname, res in all_results.items():
    print(f"\n{fname}:")
    for k, v in res.items():
        print(f"  {k}: {v}")
