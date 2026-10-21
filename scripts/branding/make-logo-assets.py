#!/usr/bin/env python3
"""Derives the web logo assets from the supplied master (assets/brand/dnhg-logo-master.png), which is never modified.
Only resizing and a transparent background are applied: the artwork's pixels are not redrawn. Ink opacity is taken from the
master's darkness (black ink on white becomes black with alpha), so antialiased edges are preserved and the logo can sit on
white or, inverted, on the dark footer. Output: assets/brand/dnhg-logo-{640,1000}.{png,webp}"""
from PIL import Image
import numpy as np, os, sys
root = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'brand')
im = Image.open(os.path.join(root, 'dnhg-logo-master.png')).convert('L')
a = np.asarray(im).astype('float32')
bg = np.percentile(a, 98)                       # paper white of the master
alpha = np.clip((bg - a) / bg, 0, 1)
alpha[alpha < 0.02] = 0                          # drop scanner/JPEG noise in the white
alpha = np.clip(alpha * (1 / max(alpha.max(), 1e-6)), 0, 1)
h, w = alpha.shape
rgba = np.zeros((h, w, 4), dtype='uint8'); rgba[..., 3] = (alpha * 255).round().astype('uint8')
full = Image.fromarray(rgba, 'RGBA')
for W in (640, 1000):
    H = round(h * W / w)
    # premultiplied resize avoids grey fringes
    out = full.resize((W, H), Image.LANCZOS)
    out.save(os.path.join(root, f'dnhg-logo-{W}.png'), optimize=True)
    out.save(os.path.join(root, f'dnhg-logo-{W}.webp'), quality=92, method=6)
    print(W, H, os.path.getsize(os.path.join(root, f'dnhg-logo-{W}.png')), os.path.getsize(os.path.join(root, f'dnhg-logo-{W}.webp')))
print('master', w, h, round(w / h, 4))
