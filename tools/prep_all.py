#!/usr/bin/env python
"""Build viewer assets for every CDS-family bottle from its product photos.

Per product it measures rather than guesses:

  1. silhouette from the PNG alpha channel
  2. per-row radius  -> lathe profile, split at the neck into body + cap
  3. label band      -> measured and pinned per product (see OVERRIDES);
                        the auto-detector is only the fallback for new bottles
  4. label unwrap    -> invert the cylinder projection (x = cx + r*sin(theta))
  5. back sticker    -> crop to the die-cut, bake a contact shadow inside the edge
  6. colours         -> sampled from the pixels (cap, body above/below the label)

Output: viewer/assets/<id>/{label-front,label-back}.png + viewer/products.json
"""
import json
import math
import os
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.dirname(ROOT)
PROD = os.path.join(SITE, "Product")

# band = (top, bottom) as fractions of the bottle height measured from the TOP.
# kind = what the bottle itself is made of, read off the pixels:
#   amber  - amber glass (CDS, MMS, Activator)
#   clear  - clear glass reflecting the studio backdrop (DMSO)
PRODUCTS = [
    # id          name          front image                        back label image
    ("cds",       "CDS",         "CDS-bottle-png.png",             "cds-OTTLE-back-label.png"),
    ("dmso",      "DMSO",        "DMSO-bottle-png.png",            "DMSO-BOTTLE-back-label.png"),
    ("mms",       "MMS",         "MMS-bottle-seperate-png.png",    "MMS-BOTTLE-back-label.png"),
    ("activator", "Activator",   "Activator-bottle-seperate-png.png", "Activator-BOTTLE-back-label.png"),
]

OVERRIDES = {
    "cds":       {"band": (0.345, 0.872), "kind": "amber"},
    "dmso":      {"band": (0.362, 0.860), "kind": "clear"},
    "mms":       {"band": (0.339, 0.940), "kind": "amber"},
    "activator": {"band": (0.339, 0.940), "kind": "amber"},
}

UNWRAP_W, UNWRAP_H = 2048, 1024
PROFILE_POINTS = 56


def smooth(vals, k=5):
    out, n = [], len(vals)
    for i in range(n):
        lo, hi = max(0, i - k // 2), min(n, i + k // 2 + 1)
        s = sorted(vals[lo:hi])
        out.append(s[len(s) // 2])
    return out


def analyse_front(path, override):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    W, H = im.size

    rows = []
    for y in range(H):
        xs = [x for x in range(W) if px[x, y][3] > 128]
        rows.append((min(xs), max(xs)) if xs else None)
    live = [y for y in range(H) if rows[y]]
    y0, y1 = live[0], live[-1]
    h = y1 - y0 + 1

    width, centre = [0.0] * h, [0.0] * h
    for i, y in enumerate(range(y0, y1 + 1)):
        if rows[y]:
            l, r = rows[y]
            width[i] = float(r - l + 1)
            centre[i] = (l + r) / 2.0
    width = smooth(width, 5)

    lo, hi = int(0.06 * h), int(0.34 * h)
    neck = lo + width[lo:hi].index(min(width[lo:hi]))

    # ---- label band ---------------------------------------------------
    if override and "band" in override:
        b_top, b_bot = override["band"]
    else:
        lum = []
        for y in range(y0, y1 + 1):
            if not rows[y]:
                lum.append(255.0)
                continue
            l, r = rows[y]
            step = max(1, (r - l) // 60)
            vals = sorted(sum(px[x, y][:3]) / 3 for x in range(l, r + 1, step))
            lum.append(vals[len(vals) // 2])
        lum = smooth(lum, 9)
        best, run, start = (0, 0, 0), 0, 0
        for i in range(int(0.20 * h), h):
            if lum[i] < 75:
                if run == 0:
                    start = i
                run += 1
                if run > best[0]:
                    best = (run, start, i)
            else:
                run = 0
        if best[0] < 0.15 * h:
            raise SystemExit("%s: no label band found - add an OVERRIDES entry" % path)
        b_top, b_bot = best[1] / h, best[2] / h

    lb_top, lb_bot = int(b_top * h), int(b_bot * h)

    # ---- colours: cap, body (above + below the label), label ----------
    def median_rgb(idx):
        acc = []
        for i in idx:
            y = y0 + int(i)
            if not (0 <= y <= y1) or not rows[y]:
                continue
            l, r = rows[y]
            for x in range(l + 3, r - 2, max(1, (r - l) // 40)):
                if px[x, y][3] > 200:
                    acc.append(px[x, y][:3])
        if not acc:
            return (128, 128, 128)
        acc.sort(key=lambda c: c[0] + c[1] + c[2])
        return acc[len(acc) // 2]

    cap_col = median_rgb(range(int(0.03 * h), max(int(0.03 * h) + 1, neck - 4)))
    body_idx = list(range(max(neck, lb_top - int(0.10 * h)), max(neck + 1, lb_top - int(0.02 * h))))
    body_idx += list(range(lb_bot + int(0.02 * h), min(h, lb_bot + int(0.05 * h) + 1)))
    body_col = median_rgb(body_idx)
    label_col = median_rgb(range(lb_top + 5, lb_bot - 5))

    return {
        "im": im, "px": px, "y0": y0, "y1": y1, "h": h,
        "width": width, "centre": centre, "maxw": max(width), "neck": neck,
        "label_top": b_top, "label_bottom": b_bot,
        "cap_col": cap_col, "body_col": body_col, "label_col": label_col,
    }


def lathe_profile(width, h, i_from, i_to):
    pts = []
    for k in range(PROFILE_POINTS + 1):
        i = int(round(i_from + (i_to - i_from) * k / PROFILE_POINTS))
        i = max(0, min(len(width) - 1, i))
        pts.append([round((width[i] / 2.0) / h, 5), round(1.0 - i / h, 5)])
    return pts


def unwrap(a, out_path):
    h, y0, W = a["h"], a["y0"], a["im"].size[0]
    px = a["px"]
    top = int(round(a["label_top"] * h))
    bot = int(round(a["label_bottom"] * h))
    sin_t = [math.sin((u / (UNWRAP_W - 1) - 0.5) * math.pi) for u in range(UNWRAP_W)]

    out = Image.new("RGB", (UNWRAP_W, UNWRAP_H))
    op = out.load()
    for oy in range(UNWRAP_H):
        i = max(0, min(h - 1, int(round(top + (bot - top) * oy / (UNWRAP_H - 1)))))
        y = y0 + i
        cx, half = a["centre"][i], a["width"][i] / 2.0
        for ox in range(UNWRAP_W):
            op[ox, oy] = px[max(0, min(W - 1, int(round(cx + half * sin_t[ox])))), y][:3]
    out.save(out_path, optimize=True)
    return out.size


def back_asset(src, out_path):
    im = Image.open(src).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    al = im.getchannel("A")
    inv = Image.new("L", im.size, 255)
    inv.paste(0, mask=al)
    rim = inv.filter(ImageFilter.GaussianBlur(radius=max(2, im.width // 45)))
    rgb = im.convert("RGB")
    p, rp = rgb.load(), rim.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            k = 1.0 - 0.28 * (rp[x, y] / 255.0)
            c = p[x, y]
            p[x, y] = (int(c[0] * k), int(c[1] * k), int(c[2] * k))
    out = rgb.convert("RGBA")
    out.putalpha(al)
    out.save(out_path, optimize=True)
    return out.size


def hexof(c):
    return "#%02X%02X%02X" % tuple(c)


def main():
    catalog = []
    for pid, name, front, back in PRODUCTS:
        fpath, bpath = os.path.join(PROD, front), os.path.join(PROD, back)
        if not (os.path.exists(fpath) and os.path.exists(bpath)):
            print("SKIP %-10s missing art" % pid)
            continue
        ov = OVERRIDES.get(pid, {})
        a = analyse_front(fpath, ov)
        outdir = os.path.join(ROOT, "assets", pid)
        os.makedirs(outdir, exist_ok=True)

        unwrap(a, os.path.join(outdir, "label-front.png"))
        bsize = back_asset(bpath, os.path.join(outdir, "label-back.png"))

        kind = ov.get("kind") or ("amber" if (a["body_col"][0] - a["body_col"][2]) > 30 else "clear")

        catalog.append({
            "id": pid,
            "name": name,
            "capProfile": lathe_profile(a["width"], a["h"], 0, max(1, a["neck"] - 1)),
            "bodyProfile": lathe_profile(a["width"], a["h"], a["neck"], a["h"] - 1),
            "labelTop": round(1.0 - a["label_top"], 5),
            "labelBottom": round(1.0 - a["label_bottom"], 5),
            "bodyKind": kind,
            "capColor": hexof(a["cap_col"]),
            "bodyColor": hexof(a["body_col"]),
            "wrapColor": hexof(a["label_col"]),
            "front": "assets/%s/label-front.png" % pid,
            "back": "assets/%s/label-back.png" % pid,
            "backAspect": round(bsize[1] / bsize[0], 4),
            "sourcePx": [a["h"], a["maxw"]],
        })
        print("%-10s h=%4d  band %.3f..%.3f  %-6s body=%s cap=%s wrap=%s" % (
            pid, a["h"], a["label_top"], a["label_bottom"], kind,
            hexof(a["body_col"]), hexof(a["cap_col"]), hexof(a["label_col"])))

    with open(os.path.join(ROOT, "products.json"), "w", encoding="utf-8") as fh:
        json.dump({"products": catalog}, fh, indent=1)
    print("\nwrote products.json with", len(catalog), "products")


if __name__ == "__main__":
    main()
