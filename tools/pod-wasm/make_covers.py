"""Placeholder album art for the web Pod: four abstract 200x200 baseline JPEGs (no real covers)."""
import math
import sys
from PIL import Image, ImageDraw, ImageFilter

out = sys.argv[1]
S = 200

def grad(top, bottom):
    im = Image.new("RGB", (S, S))
    d = ImageDraw.Draw(im)
    for y in range(S):
        t = y / (S - 1)
        d.line([(0, y), (S, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    return im

# 0: harbour at night, a low moon over layered water
im = grad((22, 28, 64), (232, 120, 84))
d = ImageDraw.Draw(im)
d.ellipse([118, 46, 168, 96], fill=(250, 214, 140))
for i, c in enumerate([(70, 46, 92), (48, 34, 74), (30, 24, 52)]):
    y0 = 128 + i * 22
    d.polygon([(0, S)] + [(x, y0 + 8 * math.sin(x / 23 + i)) for x in range(0, S + 1, 4)] + [(S, S)], fill=c)
im.save(f"{out}/cover-0.jpg", quality=86, progressive=False)

# 1: monsoon, rain streaks over teal
im = grad((18, 74, 88), (126, 186, 176))
d = ImageDraw.Draw(im)
for i in range(70):
    x = (i * 37) % S; y = (i * 53) % S
    d.line([(x, y), (x - 6, y + 22)], fill=(214, 240, 232), width=1)
im = im.filter(ImageFilter.GaussianBlur(0.6))
d = ImageDraw.Draw(im)
d.rectangle([0, 150, S, S], fill=(14, 52, 60))
im.save(f"{out}/cover-1.jpg", quality=86, progressive=False)

# 2: local train, bold stripes in the style of a rail map
im = Image.new("RGB", (S, S), (236, 228, 208))
d = ImageDraw.Draw(im)
for i, c in enumerate([(200, 64, 52), (230, 170, 60), (40, 90, 160)]):
    d.line([(-20, 40 + i * 46), (S + 20, 100 + i * 46)], fill=c, width=22)
for x in (46, 104, 162):
    d.ellipse([x - 9, 74 + (x - 46) * 0.3 - 9, x + 9, 74 + (x - 46) * 0.3 + 9], fill=(236, 228, 208), outline=(30, 30, 30), width=4)
im.save(f"{out}/cover-2.jpg", quality=86, progressive=False)

# 3: solder smoke, a brass ring on deep green with a soft plume
im = grad((16, 41, 31), (29, 75, 57))
d = ImageDraw.Draw(im)
d.ellipse([50, 70, 150, 170], outline=(221, 176, 111), width=14)
plume = Image.new("L", (S, S), 0)
pd = ImageDraw.Draw(plume)
for i in range(8):
    pd.ellipse([92 + 10 * math.sin(i), 60 - i * 8, 112 + 10 * math.sin(i), 80 - i * 8], fill=150 - i * 15)
plume = plume.filter(ImageFilter.GaussianBlur(5))
im = Image.composite(Image.new("RGB", (S, S), (230, 232, 226)), im, plume)
im.save(f"{out}/cover-3.jpg", quality=86, progressive=False)
print("ok")
