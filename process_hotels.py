#!/usr/bin/env python3
"""
Process 17 hotel review pages with 4 improvements each:
1. Visible FAQ section
2. Quick Take intro box
3. Comparison table after Final Verdict
4. Internal links in prose
"""

import json
import re

# ─────────────────────────────────────────────────────────────────────────────
# HOTEL DATA
# ─────────────────────────────────────────────────────────────────────────────
HOTELS = {
    "naman-retreat-da-nang.html": {
        "name": "Naman Retreat",
        "quick_take": "Naman Retreat is the most architecturally striking hotel on Non Nuoc Beach - bamboo villas, a 250-metre pool, and genuine boutique character set it apart from every chain resort in Da Nang",
        "score": "8.9",
        "best_for": "Romance, design lovers & wellness",
        "price_from": "$160",
        "area": "Non Nuoc Beach",
        "beach": "✓",
        "use_case": "Romance & design",
        "comparisons": [
            {"file": "tia-wellness-resort-da-nang.html", "name": "TIA Wellness Resort", "price": "$160", "area": "My Khe Beach", "beach": "✓", "best_for": "Wellness retreats", "score": "8.7"},
            {"file": "vinpearl-luxury-da-nang.html", "name": "Hyatt Regency*", "price": "$180", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Luxury families", "score": "8.6"},
            {"file": "silk-path-grand-da-nang.html", "name": "Radisson Blu*", "price": "$130", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Mid-range beach", "score": "8.0"},
        ],
        "internal_links": [
            ("Non Nuoc Beach", "non-nuoc-beach-da-nang.html", "Non Nuoc Beach"),
            ("Marble Mountains", "marble-mountains-da-nang.html", "Marble Mountains"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("luxury hotels", "luxury-hotels-da-nang.html", "luxury hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
        ],
    },
    "tia-wellness-resort-da-nang.html": {
        "name": "TIA Wellness Resort",
        "quick_take": "TIA Wellness Resort is Da Nang's most serious wellness-focused property - all-inclusive spa programming, a direct My Khe Beach footprint, and an adults-only atmosphere that justifies the premium",
        "score": "8.7",
        "best_for": "Wellness retreats & couples",
        "price_from": "$160",
        "area": "My Khe Beach",
        "beach": "✓",
        "use_case": "Wellness & couples",
        "comparisons": [
            {"file": "naman-retreat-da-nang.html", "name": "Naman Retreat", "price": "$160", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Design & romance", "score": "8.9"},
            {"file": "vinpearl-luxury-da-nang.html", "name": "Hyatt Regency*", "price": "$180", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Luxury families", "score": "8.6"},
            {"file": "fusion-suites-da-nang.html", "name": "Fusion Suites", "price": "$100", "area": "My Khe Beach", "beach": "✓", "best_for": "Value beach stays", "score": "7.8"},
        ],
        "internal_links": [
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("luxury hotels in Da Nang", "luxury-hotels-da-nang.html", "luxury hotels in Da Nang"),
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
        ],
    },
    "fusion-suites-da-nang.html": {
        "name": "Fusion Suites Da Nang",
        "quick_take": "Fusion Suites punches above its price point with a genuine beachfront location on My Khe, all-day breakfast included, and a spa credit that makes it the best value 4-star on the beach",
        "score": "7.8",
        "best_for": "Value beach stays",
        "price_from": "$100",
        "area": "My Khe Beach",
        "beach": "✓",
        "use_case": "Value beach stays",
        "comparisons": [
            {"file": "tms-hotel-da-nang.html", "name": "TMS Hotel Da Nang Beach", "price": "$90", "area": "My Khe Beach", "beach": "✓", "best_for": "Budget beach", "score": "7.7"},
            {"file": "a-la-carte-da-nang.html", "name": "A La Carte Da Nang", "price": "$90", "area": "My Khe Beach", "beach": "✓", "best_for": "Rooftop pool", "score": "7.8"},
            {"file": "melia-vinpearl-da-nang.html", "name": "Melia Vinpearl*", "price": "$140", "area": "Han River", "beach": "–", "best_for": "City & river", "score": "7.7"},
        ],
        "internal_links": [
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("beach hotels", "da-nang-beach-hotels.html", "beach hotels in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
        ],
    },
    "vinpearl-luxury-da-nang.html": {
        "name": "Vinpearl Luxury Da Nang",
        "quick_take": "Vinpearl Luxury Da Nang delivers true seclusion on Son Tra Peninsula with clifftop villas, private beach access, and some of the best views in Da Nang - at a price that reflects all of it",
        "score": "8.5",
        "best_for": "Luxury seclusion & clifftop villas",
        "price_from": "$250",
        "area": "Son Tra Peninsula",
        "beach": "✓",
        "use_case": "Luxury seclusion",
        "comparisons": [
            {"file": "naman-retreat-da-nang.html", "name": "InterContinental*", "price": "$380", "area": "Son Tra Peninsula", "beach": "✓", "best_for": "Luxury resort", "score": "8.7"},
            {"file": "naman-retreat-da-nang.html", "name": "Naman Retreat", "price": "$160", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Design & romance", "score": "8.9"},
            {"file": "tia-wellness-resort-da-nang.html", "name": "Hyatt Regency*", "price": "$180", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Luxury families", "score": "8.6"},
        ],
        "internal_links": [
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("luxury hotels in Da Nang", "luxury-hotels-da-nang.html", "luxury hotels in Da Nang"),
            ("Non Nuoc Beach", "non-nuoc-beach-da-nang.html", "Non Nuoc Beach"),
            ("Da Nang vs Hoi An", "da-nang-vs-hoi-an.html", "Da Nang vs Hoi An"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
        ],
    },
    "novotel-da-nang-han-river.html": {
        "name": "Novotel Da Nang Premier Han River",
        "quick_take": "The Novotel Han River is the most convenient city-centre hotel in Da Nang - walking distance to Dragon Bridge, a rooftop pool with river views, and reliable Accor standards at a fair price",
        "score": "7.9",
        "best_for": "Business travellers & city access",
        "price_from": "$100",
        "area": "Han River / city centre",
        "beach": "–",
        "use_case": "Business & city",
        "comparisons": [
            {"file": "brilliant-hotel-da-nang.html", "name": "Hilton Da Nang*", "price": "$120", "area": "Han River", "beach": "–", "best_for": "Premium city", "score": "8.1"},
            {"file": "brilliant-hotel-da-nang.html", "name": "Brilliant Hotel", "price": "$80", "area": "Han River", "beach": "–", "best_for": "Budget city", "score": "7.5"},
            {"file": "grand-mercure-da-nang.html", "name": "Grand Mercure", "price": "$95", "area": "City centre", "beach": "–", "best_for": "City with pool", "score": "7.7"},
        ],
        "internal_links": [
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("Marble Mountains", "marble-mountains-da-nang.html", "Marble Mountains"),
        ],
    },
    "four-points-sheraton-da-nang.html": {
        "name": "Four Points by Sheraton Danang",
        "quick_take": "Four Points by Sheraton is the most accessible Marriott Bonvoy-earning option on My Khe Beach - reliable 4-star standards, a solid pool setup, and the best budget entry point for beach stays with loyalty perks",
        "score": "7.5",
        "best_for": "Budget beach stays & Marriott Bonvoy members",
        "price_from": "$80",
        "area": "My Khe Beach",
        "beach": "✓",
        "use_case": "Budget beach & Bonvoy",
        "comparisons": [
            {"file": "fusion-suites-da-nang.html", "name": "Fusion Suites", "price": "$100", "area": "My Khe Beach", "beach": "✓", "best_for": "Value beach stays", "score": "7.8"},
            {"file": "tms-hotel-da-nang.html", "name": "TMS Hotel Da Nang Beach", "price": "$90", "area": "My Khe Beach", "beach": "✓", "best_for": "Budget beach", "score": "7.7"},
            {"file": "wyndham-soleil-da-nang.html", "name": "Wyndham Soleil", "price": "$110", "area": "My Khe Beach", "beach": "✓", "best_for": "Korean amenities", "score": "7.8"},
        ],
        "internal_links": [
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("beach hotels", "da-nang-beach-hotels.html", "beach hotels in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
        ],
    },
    "grand-mercure-da-nang.html": {
        "name": "Grand Mercure Da Nang",
        "quick_take": "Grand Mercure Da Nang is the best city-centre option for Accor loyalty members - a rooftop pool, central location, and consistent 4-star standards at a price that undercuts its Han River competitors",
        "score": "7.7",
        "best_for": "City stays with pool & Accor members",
        "price_from": "$95",
        "area": "City centre",
        "beach": "–",
        "use_case": "City & Accor loyalty",
        "comparisons": [
            {"file": "novotel-da-nang-han-river.html", "name": "Novotel Han River", "price": "$100", "area": "Han River", "beach": "–", "best_for": "Business & city", "score": "7.9"},
            {"file": "brilliant-hotel-da-nang.html", "name": "Hilton Da Nang*", "price": "$120", "area": "Han River", "beach": "–", "best_for": "Premium city", "score": "8.1"},
            {"file": "brilliant-hotel-da-nang.html", "name": "Brilliant Hotel", "price": "$80", "area": "Han River", "beach": "–", "best_for": "Budget city", "score": "7.5"},
        ],
        "internal_links": [
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("Da Nang vs Hoi An", "da-nang-vs-hoi-an.html", "Da Nang vs Hoi An"),
        ],
    },
    "wyndham-soleil-da-nang.html": {
        "name": "Wyndham Soleil Danang",
        "quick_take": "Wyndham Soleil sits in the heart of An Thuong beach strip with Korean-friendly amenities, a solid rooftop pool, and direct My Khe Beach access - strong value for the price point",
        "score": "7.8",
        "best_for": "Korean-friendly amenities & value beach",
        "price_from": "$110",
        "area": "My Khe Beach (An Thuong)",
        "beach": "✓",
        "use_case": "Korean amenities & beach",
        "comparisons": [
            {"file": "tms-hotel-da-nang.html", "name": "TMS Hotel Da Nang Beach", "price": "$90", "area": "My Khe Beach", "beach": "✓", "best_for": "Budget beach", "score": "7.7"},
            {"file": "a-la-carte-da-nang.html", "name": "A La Carte Da Nang", "price": "$90", "area": "My Khe Beach", "beach": "✓", "best_for": "Rooftop pool", "score": "7.8"},
            {"file": "fusion-suites-da-nang.html", "name": "Fusion Suites", "price": "$100", "area": "My Khe Beach", "beach": "✓", "best_for": "Value beach stays", "score": "7.8"},
        ],
        "internal_links": [
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("beach hotels", "da-nang-beach-hotels.html", "beach hotels in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
        ],
    },
    "furama-resort-da-nang.html": {
        "name": "Furama Resort Danang",
        "quick_take": "Furama Resort is Da Nang's most established family beach resort - mature gardens, multiple pools, a long private beach frontage, and mid-range pricing that makes it the practical family choice on My Khe",
        "score": "7.9",
        "best_for": "Families on a mid-range budget",
        "price_from": "$120",
        "area": "My Khe Beach",
        "beach": "✓",
        "use_case": "Families",
        "comparisons": [
            {"file": "melia-vinpearl-da-nang.html", "name": "Pullman Da Nang*", "price": "$140", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Families & resort", "score": "8.0"},
            {"file": "silk-path-grand-da-nang.html", "name": "Radisson Blu*", "price": "$130", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Mid-range beach", "score": "8.0"},
            {"file": "naman-retreat-da-nang.html", "name": "Sheraton Grand*", "price": "$160", "area": "Da Nang", "beach": "✓", "best_for": "Luxury families", "score": "8.2"},
        ],
        "internal_links": [
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("beach hotels", "da-nang-beach-hotels.html", "beach hotels in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("Marble Mountains", "marble-mountains-da-nang.html", "Marble Mountains"),
        ],
    },
    "tms-hotel-da-nang.html": {
        "name": "TMS Hotel Da Nang Beach",
        "quick_take": "TMS Hotel is one of the best budget picks on My Khe Beach - direct sand access, a rooftop bar with sea views, and clean modern rooms at a price that rarely breaks $100",
        "score": "7.7",
        "best_for": "Budget My Khe Beach stays",
        "price_from": "$90",
        "area": "My Khe Beach",
        "beach": "✓",
        "use_case": "Budget beach",
        "comparisons": [
            {"file": "wyndham-soleil-da-nang.html", "name": "Wyndham Soleil", "price": "$110", "area": "My Khe Beach", "beach": "✓", "best_for": "Korean amenities", "score": "7.8"},
            {"file": "fusion-suites-da-nang.html", "name": "Fusion Suites", "price": "$100", "area": "My Khe Beach", "beach": "✓", "best_for": "Value beach stays", "score": "7.8"},
            {"file": "a-la-carte-da-nang.html", "name": "A La Carte Da Nang", "price": "$90", "area": "My Khe Beach", "beach": "✓", "best_for": "Rooftop pool", "score": "7.8"},
        ],
        "internal_links": [
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("beach hotels", "da-nang-beach-hotels.html", "beach hotels in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
        ],
    },
    "muong-thanh-luxury-da-nang.html": {
        "name": "Muong Thanh Luxury Da Nang",
        "quick_take": "Muong Thanh Luxury is the most affordable 4-star option in the Da Nang city centre - a Vietnamese chain with solid facilities, a central location, and rates that frequently dip under $80",
        "score": "7.3",
        "best_for": "Budget city stays",
        "price_from": "$70",
        "area": "City centre / Han River",
        "beach": "–",
        "use_case": "Budget city",
        "comparisons": [
            {"file": "brilliant-hotel-da-nang.html", "name": "Brilliant Hotel", "price": "$80", "area": "Han River", "beach": "–", "best_for": "Budget city views", "score": "7.5"},
            {"file": "grand-mercure-da-nang.html", "name": "Grand Mercure", "price": "$95", "area": "City centre", "beach": "–", "best_for": "City & Accor", "score": "7.7"},
            {"file": "novotel-da-nang-han-river.html", "name": "Novotel Han River", "price": "$100", "area": "Han River", "beach": "–", "best_for": "Business & city", "score": "7.9"},
        ],
        "internal_links": [
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("Marble Mountains", "marble-mountains-da-nang.html", "Marble Mountains"),
        ],
    },
    "a-la-carte-da-nang.html": {
        "name": "A La Carte Da Nang Beach Hotel",
        "quick_take": "A La Carte delivers genuine beachfront access on My Khe with a rooftop pool bar, apartment-style suites with kitchenettes, and pricing that consistently undercuts the competition",
        "score": "7.8",
        "best_for": "Value beachfront stays",
        "price_from": "$90",
        "area": "My Khe Beach (An Thuong)",
        "beach": "✓",
        "use_case": "Value beachfront",
        "comparisons": [
            {"file": "tms-hotel-da-nang.html", "name": "TMS Hotel Da Nang Beach", "price": "$90", "area": "My Khe Beach", "beach": "✓", "best_for": "Budget beach", "score": "7.7"},
            {"file": "fusion-suites-da-nang.html", "name": "Fusion Suites", "price": "$100", "area": "My Khe Beach", "beach": "✓", "best_for": "Value beach stays", "score": "7.8"},
            {"file": "wyndham-soleil-da-nang.html", "name": "Wyndham Soleil", "price": "$110", "area": "My Khe Beach", "beach": "✓", "best_for": "Korean amenities", "score": "7.8"},
        ],
        "internal_links": [
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("beach hotels", "da-nang-beach-hotels.html", "beach hotels in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
        ],
    },
    "brilliant-hotel-da-nang.html": {
        "name": "Brilliant Hotel Da Nang",
        "quick_take": "Brilliant Hotel sits right on the Han River with Dragon Bridge views, a rooftop pool, and budget pricing - the most affordable way to get a river-view room in Da Nang city centre",
        "score": "7.5",
        "best_for": "Budget city stays with river views",
        "price_from": "$80",
        "area": "Han River (city centre)",
        "beach": "–",
        "use_case": "Budget city views",
        "comparisons": [
            {"file": "novotel-da-nang-han-river.html", "name": "Novotel Han River", "price": "$100", "area": "Han River", "beach": "–", "best_for": "Business & city", "score": "7.9"},
            {"file": "muong-thanh-luxury-da-nang.html", "name": "Muong Thanh Luxury", "price": "$70", "area": "City centre", "beach": "–", "best_for": "Budget city", "score": "7.3"},
            {"file": "grand-mercure-da-nang.html", "name": "Grand Mercure", "price": "$95", "area": "City centre", "beach": "–", "best_for": "City & Accor", "score": "7.7"},
        ],
        "internal_links": [
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("Marble Mountains", "marble-mountains-da-nang.html", "Marble Mountains"),
        ],
    },
    "azura-da-nang.html": {
        "name": "Azura Da Nang Hotel",
        "quick_take": "Azura Da Nang is a solid budget option in the city centre - clean rooms, a central location, and rates that frequently dip under $80, making it the most accessible base for city sightseeing",
        "score": "7.2",
        "best_for": "Budget city stays",
        "price_from": "$75",
        "area": "Han River (city centre)",
        "beach": "–",
        "use_case": "Budget city access",
        "comparisons": [
            {"file": "brilliant-hotel-da-nang.html", "name": "Brilliant Hotel", "price": "$80", "area": "Han River", "beach": "–", "best_for": "Budget city views", "score": "7.5"},
            {"file": "muong-thanh-luxury-da-nang.html", "name": "Muong Thanh Luxury", "price": "$70", "area": "City centre", "beach": "–", "best_for": "Budget city", "score": "7.3"},
            {"file": "novotel-da-nang-han-river.html", "name": "Novotel Han River", "price": "$100", "area": "Han River", "beach": "–", "best_for": "Business & city", "score": "7.9"},
        ],
        "internal_links": [
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("Marble Mountains", "marble-mountains-da-nang.html", "Marble Mountains"),
        ],
    },
    "melia-vinpearl-da-nang.html": {
        "name": "Melia Vinpearl Da Nang Riverfront",
        "quick_take": "Melia Vinpearl Riverfront combines Han River views with Vinpearl brand backing and Melia service standards - a strong mid-range city hotel with a rooftop pool and walkable city-centre location",
        "score": "7.7",
        "best_for": "City & river stays",
        "price_from": "$110",
        "area": "Han River",
        "beach": "–",
        "use_case": "City & river views",
        "comparisons": [
            {"file": "novotel-da-nang-han-river.html", "name": "Novotel Han River", "price": "$100", "area": "Han River", "beach": "–", "best_for": "Business & city", "score": "7.9"},
            {"file": "brilliant-hotel-da-nang.html", "name": "Brilliant Hotel", "price": "$80", "area": "Han River", "beach": "–", "best_for": "Budget city views", "score": "7.5"},
            {"file": "grand-mercure-da-nang.html", "name": "Hilton Da Nang*", "price": "$120", "area": "Han River", "beach": "–", "best_for": "Premium city", "score": "8.1"},
        ],
        "internal_links": [
            ("where to stay in Da Nang", "where-to-stay-in-da-nang.html", "where to stay in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("My Khe Beach", "my-khe-beach-da-nang.html", "My Khe Beach"),
            ("Da Nang vs Hoi An", "da-nang-vs-hoi-an.html", "Da Nang vs Hoi An"),
        ],
    },
    "silk-path-grand-da-nang.html": {
        "name": "Silk Path Grand Resort & Spa",
        "quick_take": "Silk Path Grand is the quietest luxury option on Non Nuoc Beach - a boutique-scale resort with a refined spa, a less-crowded beach stretch, and 5-star finishes at rates well below its northern neighbours",
        "score": "8.0",
        "best_for": "Quiet luxury beach stays",
        "price_from": "$130",
        "area": "Non Nuoc Beach (south)",
        "beach": "✓",
        "use_case": "Quiet luxury beach",
        "comparisons": [
            {"file": "naman-retreat-da-nang.html", "name": "Radisson Blu*", "price": "$130", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Mid-range beach", "score": "8.0"},
            {"file": "naman-retreat-da-nang.html", "name": "Naman Retreat", "price": "$160", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Design & romance", "score": "8.9"},
            {"file": "tia-wellness-resort-da-nang.html", "name": "Hyatt Regency*", "price": "$180", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Luxury families", "score": "8.6"},
        ],
        "internal_links": [
            ("Non Nuoc Beach", "non-nuoc-beach-da-nang.html", "Non Nuoc Beach"),
            ("luxury hotels in Da Nang", "luxury-hotels-da-nang.html", "luxury hotels in Da Nang"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("Marble Mountains", "marble-mountains-da-nang.html", "Marble Mountains"),
        ],
    },
    "mikazuki-da-nang.html": {
        "name": "Mikazuki Japanese Resorts & Spa",
        "quick_take": "Mikazuki is Da Nang's most distinctive resort experience - a Japanese-style complex on Non Nuoc Beach with the largest onsen spa in Vietnam, indoor waterpark, and full Japanese hospitality programming",
        "score": "8.1",
        "best_for": "Japanese-style hospitality & onsen spa",
        "price_from": "$140",
        "area": "Non Nuoc Beach",
        "beach": "✓",
        "use_case": "Japanese hospitality & spa",
        "comparisons": [
            {"file": "silk-path-grand-da-nang.html", "name": "Silk Path Grand Resort", "price": "$130", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Quiet luxury", "score": "8.0"},
            {"file": "naman-retreat-da-nang.html", "name": "Radisson Blu*", "price": "$130", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Mid-range beach", "score": "8.0"},
            {"file": "tia-wellness-resort-da-nang.html", "name": "Hyatt Regency*", "price": "$180", "area": "Non Nuoc Beach", "beach": "✓", "best_for": "Luxury families", "score": "8.6"},
        ],
        "internal_links": [
            ("Non Nuoc Beach", "non-nuoc-beach-da-nang.html", "Non Nuoc Beach"),
            ("best hotels in Da Nang", "best-hotels-in-da-nang.html", "best hotels in Da Nang"),
            ("luxury hotels in Da Nang", "luxury-hotels-da-nang.html", "luxury hotels in Da Nang"),
            ("Da Nang hotel prices", "da-nang-hotel-prices-by-month.html", "Da Nang hotel prices"),
            ("Marble Mountains", "marble-mountains-da-nang.html", "Marble Mountains"),
        ],
    },
}


def extract_faq_items(content):
    """Extract FAQ items from FAQPage JSON-LD schema."""
    faq_start = content.find('"@type":"FAQPage"')
    if faq_start == -1:
        faq_start = content.find('"@type": "FAQPage"')
    if faq_start == -1:
        return []

    script_start = content.rfind('<script', 0, faq_start)
    script_end = content.find('</script>', faq_start) + 9
    faq_json_raw = content[script_start:script_end]

    # Extract just JSON part
    json_start = faq_json_raw.find('{')
    json_end = faq_json_raw.rfind('}') + 1
    try:
        faq_data = json.loads(faq_json_raw[json_start:json_end])
    except Exception as e:
        print(f"  ERROR parsing FAQ JSON: {e}")
        return []

    items = []
    for entity in faq_data.get('mainEntity', []):
        q = entity.get('name', '')
        a = entity.get('acceptedAnswer', {}).get('text', '')
        if q and a:
            items.append((q, a))
    return items


def build_faq_section(hotel_name, faq_items):
    """Build the visible FAQ HTML section."""
    details_html = ''
    for q, a in faq_items:
        details_html += f'''<details style="border-bottom:1px solid var(--sand-dark);">
<summary style="font-size:.95rem;font-weight:600;color:var(--ink);padding:1rem 0;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;">{q} <span style="font-size:1.2rem;color:var(--ocean);flex-shrink:0;margin-left:1rem;">+</span></summary>
<p style="font-size:.9rem;color:var(--ink-soft);line-height:1.8;padding:.5rem 0 1rem;max-width:65ch;">{a}</p>
</details>
'''

    return f'''<section id="faq" style="background:var(--sand);padding:clamp(2rem,5vw,3.5rem) var(--gutter);border-top:1px solid var(--sand-dark);">
<div style="max-width:760px;margin:0 auto;">
<p style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:var(--ocean);margin-bottom:.6rem;">Common Questions</p>
<h2 style="font-family:var(--font-serif);font-size:clamp(1.5rem,3vw,2.1rem);color:var(--ink);line-height:1.1;letter-spacing:-.025em;margin-bottom:1.8rem;">{hotel_name}: <em style="color:var(--ocean);font-style:italic">FAQ</em></h2>
<div style="border-top:1px solid var(--sand-dark);">
{details_html}</div>
</div>
</section>
'''


def build_quick_take(data):
    """Build Quick Take intro box HTML."""
    return f'''<div style="background:var(--ocean-pale);border-bottom:1px solid var(--sand-dark);padding:.9rem var(--gutter);">
<div style="max-width:var(--max);margin:0 auto;display:flex;align-items:flex-start;gap:1.2rem;flex-wrap:wrap;">
<div style="flex:1;min-width:200px;">
<p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--ocean);margin-bottom:.3rem;">Quick Take</p>
<p style="font-size:.9rem;color:var(--ink-soft);line-height:1.6;margin:0;">{data["quick_take"]} - our score: {data["score"]}/10. <strong>Best for:</strong> {data["best_for"]}.</p>
</div>
<div style="flex:1;min-width:200px;">
<p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--ocean);margin-bottom:.4rem;">On this page</p>
<ul style="margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:.3rem .8rem;">
<li style="font-size:.82rem;color:var(--ink-muted);">→ <a href="#overview" style="color:var(--ocean);">Overview</a></li>
<li style="font-size:.82rem;color:var(--ink-muted);">→ <a href="#rooms" style="color:var(--ocean);">Rooms</a></li>
<li style="font-size:.82rem;color:var(--ink-muted);">→ <a href="#pools" style="color:var(--ocean);">Pools & Beach</a></li>
<li style="font-size:.82rem;color:var(--ink-muted);">→ <a href="#dining" style="color:var(--ocean);">Dining</a></li>
<li style="font-size:.82rem;color:var(--ink-muted);">→ <a href="#verdict" style="color:var(--ocean);">Verdict</a></li>
<li style="font-size:.82rem;color:var(--ink-muted);">→ <a href="#faq" style="color:var(--ocean);">FAQ</a></li>
</ul>
</div>
</div>
</div>
'''


def build_comparison_table(data):
    """Build the comparison table HTML."""
    hotel_name = data["name"]

    # Current hotel row
    rows_html = f'''<tr style="background:var(--ocean-pale);border-bottom:1px solid var(--sand-dark);">
<td style="padding:.7rem 1rem;font-weight:600;color:var(--ocean);">{hotel_name} ★</td>
<td style="padding:.7rem .8rem;text-align:center;">{data["price_from"]}</td>
<td style="padding:.7rem .8rem;text-align:center;">{data["area"]}</td>
<td style="padding:.7rem .8rem;text-align:center;">{data["beach"]}</td>
<td style="padding:.7rem .8rem;text-align:center;">{data["use_case"]}</td>
<td style="padding:.7rem .8rem;text-align:center;font-weight:700;color:var(--ocean);">{data["score"]}/10</td>
</tr>
'''

    # Comparison hotel rows
    for comp in data["comparisons"]:
        name_display = comp["name"]
        # If the comparison hotel has a real file (not marked with *), link it
        if not name_display.endswith('*'):
            name_display = f'<a href="{comp["file"]}" style="color:var(--ink);">{comp["name"]}</a>'
        else:
            # Remove the * from display but don't link
            name_display = comp["name"].rstrip('*').strip()

        rows_html += f'''<tr style="background:#fff;border-bottom:1px solid var(--sand-dark);">
<td style="padding:.7rem 1rem;">{name_display}</td>
<td style="padding:.7rem .8rem;text-align:center;">{comp["price"]}</td>
<td style="padding:.7rem .8rem;text-align:center;">{comp["area"]}</td>
<td style="padding:.7rem .8rem;text-align:center;">{comp["beach"]}</td>
<td style="padding:.7rem .8rem;text-align:center;">{comp["best_for"]}</td>
<td style="padding:.7rem .8rem;text-align:center;">{comp["score"]}/10</td>
</tr>
'''

    return f'''<h2>How It Compares</h2>
<div style="overflow-x:auto;margin:1rem 0 2rem;">
<table style="width:100%;border-collapse:collapse;font-size:.85rem;">
<thead><tr style="background:var(--ocean-deep);color:#fff;">
<th style="padding:.7rem 1rem;text-align:left;font-weight:600;">Hotel</th>
<th style="padding:.7rem .8rem;text-align:center;">From/night</th>
<th style="padding:.7rem .8rem;text-align:center;">Location</th>
<th style="padding:.7rem .8rem;text-align:center;">Beach</th>
<th style="padding:.7rem .8rem;text-align:center;">Best For</th>
<th style="padding:.7rem .8rem;text-align:center;">Score</th>
</tr></thead>
<tbody>
{rows_html}</tbody>
</table>
</div>
<p style="font-size:.78rem;color:var(--ink-muted);margin-top:-.5rem;">★ = this hotel. Prices are indicative peak low-season rates.</p>
'''


def add_internal_links(content, prose_start, internal_links):
    """Add internal links to the prose section. Only replace first occurrence of each term."""
    # Work only within the prose section (from prose_start onwards, but before the sidebar)
    # We'll track what's been replaced to avoid double-linking
    replaced = set()
    result = content

    for search_term, target_file, link_text in internal_links:
        if search_term in replaced:
            continue

        # Find the term in the prose section (after prose_start)
        idx = result.find(search_term, prose_start)
        if idx == -1:
            continue

        # Make sure it's not already inside an <a> tag
        # Look back to check if we're inside a link
        preceding = result[max(0, idx-200):idx]
        # Count unclosed <a tags vs </a> tags in preceding text
        a_opens = preceding.count('<a ')
        a_closes = preceding.count('</a>')
        if a_opens > a_closes:
            # Already inside a link, skip
            continue

        # Replace the text with a link
        link_html = f'<a href="{target_file}" style="color:var(--ocean);">{link_text}</a>'
        result = result[:idx] + link_html + result[idx + len(search_term):]
        replaced.add(search_term)
        # Update prose_start offset since we inserted text
        prose_start = idx + len(link_html)

    return result


def process_file(filename, data):
    """Process a single hotel review file with all 4 improvements."""
    filepath = f'/Users/ryanyousefi/dananghotelguide/{filename}'

    with open(filepath, 'r', errors='ignore') as f:
        content = f.read()

    improvements = []

    # ── IMPROVEMENT 1: FAQ Section ─────────────────────────────────────────────
    # Check if already added
    if 'id="faq"' not in content:
        faq_items = extract_faq_items(content)
        if faq_items:
            faq_html = build_faq_section(data['name'], faq_items)

            # Insert before `<section style="background:var(--ocean-deep)`
            cta_marker = '<section style="background:var(--ocean-deep)'
            cta_idx = content.find(cta_marker)
            if cta_idx > -1:
                content = content[:cta_idx] + faq_html + content[cta_idx:]
                improvements.append(f'FAQ section added ({len(faq_items)} Q&As)')
            else:
                improvements.append('FAQ: CTA section marker not found')
        else:
            improvements.append('FAQ: No FAQPage schema found')
    else:
        improvements.append('FAQ: Already present, skipped')

    # ── IMPROVEMENT 2: Quick Take Box ─────────────────────────────────────────
    if 'Quick Take' not in content:
        quick_take_html = build_quick_take(data)

        # Find breadcrumb nav - look for the nav that contains breadcrumb-type content
        # Pattern: </nav> followed by <header class="review-hero"> or similar
        # The breadcrumb nav ends with </nav>\n<header
        bc_patterns = [
            '</div></nav>\n<header',
            '</div></nav>\n  <header',
            '</nav>\n<header',
        ]
        inserted = False
        for pattern in bc_patterns:
            bc_idx = content.find(pattern)
            if bc_idx > -1:
                # Find where the </nav> ends
                nav_end = bc_idx + len('</div></nav>') if pattern.startswith('</div>') else bc_idx + len('</nav>')
                # Find the actual end of </nav>
                actual_nav_end = content.find('</nav>', bc_idx) + len('</nav>')
                content = content[:actual_nav_end] + '\n' + quick_take_html + content[actual_nav_end:]
                improvements.append('Quick Take box added after breadcrumb nav')
                inserted = True
                break

        if not inserted:
            # Alternative: find aria-label="Breadcrumb" and then the next </nav>
            bc_idx = content.find('aria-label="Breadcrumb"')
            if bc_idx == -1:
                bc_idx = content.find("aria-label='Breadcrumb'")
            if bc_idx == -1:
                # Try to find the breadcrumb by its content pattern
                bc_idx = content.find('hotel-reviews.html')
                if bc_idx > -1:
                    # Find the enclosing nav/div
                    nav_end = content.find('</nav>', bc_idx)
                    if nav_end > -1:
                        nav_end += len('</nav>')
                        content = content[:nav_end] + '\n' + quick_take_html + content[nav_end:]
                        improvements.append('Quick Take box added after breadcrumb nav (alt method)')
                    else:
                        improvements.append('Quick Take: breadcrumb </nav> not found')
                else:
                    improvements.append('Quick Take: breadcrumb nav not found')
            else:
                nav_end = content.find('</nav>', bc_idx) + len('</nav>')
                content = content[:nav_end] + '\n' + quick_take_html + content[nav_end:]
                improvements.append('Quick Take box added after breadcrumb nav')
    else:
        improvements.append('Quick Take: Already present, skipped')

    # ── IMPROVEMENT 3: Comparison Table ───────────────────────────────────────
    if 'How It Compares' not in content:
        comparison_html = build_comparison_table(data)

        # Find <h2>Final Verdict</h2> and then the following paragraph
        verdict_marker = '<h2>Final Verdict</h2>'
        verdict_idx = content.find(verdict_marker)
        if verdict_idx > -1:
            # Find the </p> after the h2
            p_start = content.find('<p>', verdict_idx)
            p_end = content.find('</p>', p_start) + len('</p>')
            content = content[:p_end] + '\n' + comparison_html + content[p_end:]
            improvements.append('Comparison table added after Final Verdict paragraph')
        else:
            improvements.append('Comparison table: Final Verdict h2 not found')
    else:
        improvements.append('Comparison table: Already present, skipped')

    # ── IMPROVEMENT 4: Internal Links ─────────────────────────────────────────
    prose_div = content.find('<div class="review-prose">')
    if prose_div == -1:
        prose_div = content.find('class="review-prose">')
        if prose_div > -1:
            prose_div = content.rfind('<', 0, prose_div)

    if prose_div > -1:
        links_added = []
        original_content = content

        # Track which terms we attempt to link
        for search_term, target_file, link_text in data['internal_links']:
            # Skip if this file is the current file
            if target_file == filename:
                continue

            # Find in prose section
            idx = content.find(search_term, prose_div)
            if idx == -1:
                continue

            # Make sure it's not already inside an <a> tag
            preceding = content[max(0, idx-300):idx]
            a_opens = preceding.count('<a ')
            a_closes = preceding.count('</a>')
            if a_opens > a_closes:
                continue

            # Make sure the search term isn't already a link target text in surrounding context
            surrounding = content[idx-10:idx+len(search_term)+10]
            if 'href=' in content[idx-150:idx]:
                # Check more carefully - is this inside an anchor?
                check_section = content[max(0, idx-200):idx]
                last_a_open = check_section.rfind('<a ')
                last_a_close = check_section.rfind('</a>')
                if last_a_open > last_a_close:
                    continue

            link_html = f'<a href="{target_file}" style="color:var(--ocean);">{link_text}</a>'
            content = content[:idx] + link_html + content[idx + len(search_term):]
            links_added.append(f'"{search_term}" -> {target_file}')
            # Update prose_div offset
            prose_div = idx + len(link_html)

        if links_added:
            improvements.append(f'Internal links added: {"; ".join(links_added)}')
        else:
            improvements.append('Internal links: no suitable insertion points found in prose')
    else:
        improvements.append('Internal links: review-prose div not found')

    # ── WRITE BACK ────────────────────────────────────────────────────────────
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return improvements


# ── MAIN ──────────────────────────────────────────────────────────────────────
files_to_process = list(HOTELS.keys())

print(f"Processing {len(files_to_process)} hotel review pages...\n")
all_results = {}

for filename in files_to_process:
    data = HOTELS[filename]
    print(f"Processing: {filename}")
    try:
        improvements = process_file(filename, data)
        all_results[filename] = {'status': 'OK', 'improvements': improvements}
        for imp in improvements:
            print(f"  ✓ {imp}")
    except Exception as e:
        all_results[filename] = {'status': 'ERROR', 'error': str(e)}
        print(f"  ✗ ERROR: {e}")
        import traceback
        traceback.print_exc()

print("\n=== SUMMARY ===")
ok_count = sum(1 for v in all_results.values() if v['status'] == 'OK')
err_count = sum(1 for v in all_results.values() if v['status'] == 'ERROR')
print(f"Processed: {ok_count} OK, {err_count} errors")
