#!/usr/bin/env python3
"""Fix duplicate images across riverfront, beach, luxury, boutique, and family hotel pages."""
import re


def u(photo_id):
    return f'https://images.unsplash.com/photo-{photo_id}?w=480&h=360&fit=crop&auto=format&q=85'


def replace_by_alt(content, alt_fragment, new_src):
    count = 0
    start = 0
    while True:
        idx = content.find(alt_fragment, start)
        if idx == -1:
            break
        img_start = content.rfind('<img', 0, idx)
        if img_start == -1:
            start = idx + 1
            continue
        img_end = content.find('>', idx)
        if img_end == -1:
            start = idx + 1
            continue
        img_tag = content[img_start:img_end + 1]
        new_tag = re.sub(r'src="[^"]*"', f'src="{new_src}"', img_tag)
        if new_tag != img_tag:
            content = content[:img_start] + new_tag + content[img_end + 1:]
            count += 1
        start = img_start + len(new_tag)
    return content, count


def fix_file(path, fixes):
    content = open(path, 'r', errors='ignore').read()
    total = 0
    for alt_fragment, new_src in fixes:
        content, n = replace_by_alt(content, alt_fragment, new_src)
        status = 'OK' if n > 0 else 'MISS'
        print(f'  {status} ({n}x) {alt_fragment[:60]}')
        total += n
    with open(path, 'w', errors='ignore') as f:
        f.write(content)
    print(f'  → {total} replacements saved to {path}\n')


# ─── da-nang-beach-hotels.html ─────────────────────────────────────────────
BEACH_FIXES = [
    ('Hilton Da Nang rooftop terrace bar',           u('1542314831-068cd1dbfeeb')),
    ('Muong Thanh Luxury Da Nang rooftop infinity',  u('1498503182468-3b51cbb6cb24')),
    ('Furama Resort Da Nang beachfront tropical',    u('1507525428034-b723cf961d3e')),
    ('Hyatt Regency Da Nang Non Nuoc Resort',        u('1571896349842-33c89424de2d')),
    ('Sheraton Grand Danang Resort beachfront pool', u('1520250497591-112f2f40a3f4')),
    ('Naman Retreat Da Nang lush pool area',         u('1439130490301-25e322d88054')),
    ('Da Nang Marriott Resort aerial view',          u('1559592413-7cec4d0cae2b')),
    ('Grandvrio Ocean Resort Da Nang',               u('1590490360182-c33d57733427')),
    ('Fusion Resort Da Nang aerial view',            u('1540541338287-41700207dee6')),
    ('Vinpearl Luxury Da Nang aerial view',          u('1496417263034-38ec4f0b665a')),
]

# ─── luxury-hotels-da-nang.html ─────────────────────────────────────────────
LUXURY_FIXES = [
    # InterContinental appears 3× with same image = all correct for InterContinental, keep
    # Other hotels incorrectly using 79e68188.jpg:
    ('Naman Retreat Da Nang villa with lagoon pool',          u('1439130490301-25e322d88054')),
    ('Sheraton Grand Danang Resort — aerial view',            u('1520250497591-112f2f40a3f4')),
    ('Sheraton Grand Danang Resort beachfront pool terrace',  u('1520250497591-112f2f40a3f4')),
    ('Hyatt Regency Da Nang Resort aerial view',              u('1571896349842-33c89424de2d')),
    ('Hyatt Regency Da Nang Non Nuoc Beach resort pools',     u('1571896349842-33c89424de2d')),
    ('Furama Resort Danang Non Nuoc Beach beachfront pool',   u('1507525428034-b723cf961d3e')),
    ('Da Nang Marriott Resort Non Nuoc Beach oceanfront',     u('1559592413-7cec4d0cae2b')),
    # ed652ae2.jpg used 2× both for Pullman — both correct, skip
]

# ─── boutique-hotels-da-nang.html ───────────────────────────────────────────
BOUTIQUE_FIXES = [
    # A La Carte appears 2× with 79e68188.jpg — both are A La Carte, correct
    # Wyndham Soleil incorrectly uses A La Carte image:
    ('Wyndham Soleil Da Nang rooftop pool and beach views',  u('1582719508461-905c673771fd')),
    ('Wyndham Soleil Da Nang hotel room and pool',           u('1582719508461-905c673771fd')),
]

# ─── family-hotels-da-nang.html ─────────────────────────────────────────────
FAMILY_FIXES = [
    ('Muong Thanh Luxury Da Nang Hotel aerial night view',   u('1498503182468-3b51cbb6cb24')),
]


print('=== da-nang-beach-hotels.html ===')
fix_file('da-nang-beach-hotels.html', BEACH_FIXES)

print('=== luxury-hotels-da-nang.html ===')
fix_file('luxury-hotels-da-nang.html', LUXURY_FIXES)

print('=== boutique-hotels-da-nang.html ===')
fix_file('boutique-hotels-da-nang.html', BOUTIQUE_FIXES)

print('=== family-hotels-da-nang.html ===')
fix_file('family-hotels-da-nang.html', FAMILY_FIXES)
