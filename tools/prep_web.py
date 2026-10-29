"""Trim bottle cut-outs, convert stickers/logo to WebP, repoint products.json paths.
Run from repo root: python tools/prep_web.py <path to 'CDS WEBSITE' folder>"""
import json, sys
from pathlib import Path
from PIL import Image

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / "public"

BOTTLES = {
    "cds": "Product/CDS-bottle-png.png",
    "dmso": "Product/DMSO-bottle-png.png",
    "mms": "Product/MMS-bottle-seperate-png.png",
    "activator": "Product/Activator-bottle-seperate-png.png",
}
dims = {}
for pid, rel in BOTTLES.items():
    im = Image.open(src / rel).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    # 2x: cap the long edge at 1400px; 1x: half of that
    for suffix, long_edge in (("@2x", 1400), ("", 700)):
        s = long_edge / max(im.size)
        r = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS) if s < 1 else im
        q = 90
        while True:
            r.save(out / "bottles" / f"{pid}{suffix}.webp", "WEBP", quality=q, method=6)
            if (out / "bottles" / f"{pid}{suffix}.webp").stat().st_size <= 60_000 or q <= 40:
                break
            q -= 5
        if suffix == "":
            dims[pid] = r.size
print("bottle 1x sizes:", dims)

STICKERS = {
    "natural": "100-natural-sticker.png", "quality": "preimum-quality-sticker.png",
    "trusted": "trusted-solutions-sticker.png", "wellness": "fory-your-wellness-sticker.png",
    "lab": "lab-tested-sticker.png",
}
for k, f in STICKERS.items():
    im = Image.open(src / "assets" / f).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    im.save(out / "stickers" / f"{k}.webp", "WEBP", quality=90, method=6)
    print("sticker", k, im.size)
im = Image.open(src / "assets" / "compnay-LOGO.png").convert("RGBA")
im = im.crop(im.getchannel("A").getbbox())
im.save(out / "brand" / "logo.webp", "WEBP", quality=90, method=6)
print("logo", im.size)

# measured numbers stay verbatim; only asset paths are repointed
pj = out / "products.json"
d = json.loads(pj.read_text())
for p in d["products"]:
    p["front"] = f"/labels/{p['id']}/front.png"
    p["back"] = f"/labels/{p['id']}/back.png"
pj.write_text(json.dumps(d, separators=(",", ":")))
