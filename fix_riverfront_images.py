#!/usr/bin/env python3
"""Fix duplicate images in da-nang-riverfront-hotels.html"""
import re

path = 'da-nang-riverfront-hotels.html'
content = open(path, 'r', errors='ignore').read()

# Map of alt text fragment → new Unsplash URL
ALT_TO_NEW_SRC = {
    'Melia Vinpearl Danang Riverfront hotel elevated pool deck at night':
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=480&h=360&fit=crop&auto=format&q=85',
    'Haian Riverfront Hotel Da Nang aerial sunset view':
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=480&h=360&fit=crop&auto=format&q=85',
    'Courtyard by Marriott Da Nang Han River rooftop':
        'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=480&h=360&fit=crop&auto=format&q=85',
    'Novotel Da Nang Han River twin towers':
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=480&h=360&fit=crop&auto=format&q=85',
}

changes = 0
for alt_fragment, new_src in ALT_TO_NEW_SRC.items():
    # Find all img tags containing this alt fragment, replace their src
    start = 0
    while True:
        # Find the alt fragment
        idx = content.find(alt_fragment, start)
        if idx == -1:
            break
        # Find the start of this img tag (look back for <img)
        img_start = content.rfind('<img', 0, idx)
        if img_start == -1:
            start = idx + 1
            continue
        # Find the end of this img tag
        img_end = content.find('>', idx)
        if img_end == -1:
            start = idx + 1
            continue
        img_tag = content[img_start:img_end+1]
        # Replace src within this tag
        new_tag = re.sub(r'src="[^"]*"', f'src="{new_src}"', img_tag)
        if new_tag != img_tag:
            content = content[:img_start] + new_tag + content[img_end+1:]
            changes += 1
            print(f"  Replaced: {alt_fragment[:50]}...")
        start = img_start + len(new_tag)

print(f"\nTotal replacements: {changes}")

with open(path, 'w', errors='ignore') as f:
    f.write(content)
print(f"Saved {path}")
