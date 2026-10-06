#!/usr/bin/env python3
"""Rasterize homepage, search and 404 OG cards at 1200×630. Exact text, not a model."""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public"
W, H = 1200, 630

FONT_DIRS = [
    Path("/usr/share/fonts/opentype/noto"),
    Path("/usr/share/fonts/truetype/noto"),
    Path("/usr/share/fonts/noto-cjk"),
    Path("/usr/share/fonts/opentype/noto-cjk"),
    Path("/System/Library/Fonts"),
    Path.home() / ".fonts",
]


def find_font(*names):
    for directory in FONT_DIRS:
        for name in names:
            candidate = directory / name
            if candidate.exists():
                return str(candidate)
    sys.exit(
        "generate-og: 缺少 Noto CJK 字体（fonts-noto-cjk）。"
        f" 找过：{', '.join(str(d) for d in FONT_DIRS)}；需要 {' / '.join(names)}。"
    )


SERIF = find_font("NotoSerifCJK-Bold.ttc", "NotoSerifCJKsc-Bold.otf")
SANS = find_font("NotoSansCJK-Regular.ttc", "NotoSansCJKsc-Regular.otf")
SANS_B = find_font("NotoSansCJK-Bold.ttc", "NotoSansCJKsc-Bold.otf")

ACCENT = (75, 71, 166)
PAPER = (238, 236, 246)
PAPER_SEARCH = (240, 238, 247)
INK = (28, 25, 22)
CARD = (252, 251, 248)
CARD_LINE = (176, 172, 200)
MUTED = (104, 100, 118)


def font(path, size, index=2):
    # .ttc collections carry several locales; index 2 is Simplified Chinese in Noto CJK.
    try:
        return ImageFont.truetype(path, size, index=index)
    except OSError:
        return ImageFont.truetype(path, size)


def rr(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def wrap(draw, text, fnt, max_width):
    if "\n" in text:
        return text.split("\n")
    lines, cur = [], ""
    for ch in text:
        trial = cur + ch
        if draw.textlength(trial, font=fnt) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines or [text]


def paint(path, badge, title, footer, accent, paper, kicker=""):
    r, g, b = accent
    img = Image.new("RGB", (W, H), paper)
    overlay = Image.new("RGB", (W, H), paper)
    ov = ImageDraw.Draw(overlay)
    ov.ellipse((-220, -260, 720, 420), fill=(min(255, r + 70), min(255, g + 80), min(255, b + 60)))
    ov.ellipse((780, -80, 1380, 380), fill=tuple(min(255, c + 12) for c in paper))
    img = Image.blend(img, overlay, 0.22)
    img = img.filter(ImageFilter.GaussianBlur(0.35))
    draw = ImageDraw.Draw(img)

    margin = 48
    card = (margin, margin, W - margin, H - margin)
    rr(draw, card, 36, fill=CARD, outline=CARD_LINE, width=2)
    draw.rectangle((margin + 10, margin + 18, margin + 28, H - margin - 18), fill=accent)

    badge_font = font(SANS, 22)
    title_font = font(SERIF, 64)
    footer_font = font(SANS, 26)
    kicker_font = font(SANS_B, 28)
    pad_x, pad_y = 88, 78
    bx = margin + pad_x
    by = margin + pad_y

    bw = int(draw.textlength(badge, font=badge_font)) + 36
    bh = 40
    rr(draw, (bx, by, bx + bw, by + bh), 20, fill=(244, 243, 250), outline=accent, width=2)
    draw.text((bx + 18, by + 7), badge, font=badge_font, fill=MUTED)

    if kicker:
        draw.text((bx, by + 56), kicker, font=kicker_font, fill=accent)

    lines = wrap(draw, title, title_font, W - margin * 2 - pad_x * 2)
    ty = by + (96 if kicker else 78)
    for line in lines[:2]:
        draw.text((bx, ty), line, font=title_font, fill=INK)
        ty += 86

    draw.text((bx, H - margin - 92), footer, font=footer_font, fill=MUTED)

    seal = (W - margin - pad_x - 56, H - margin - 92 - 8, W - margin - pad_x, H - margin - 92 + 48)
    rr(draw, seal, 14, fill=accent)
    sx, sy = seal[0] + 12, seal[1] + 13
    for i, tw in enumerate((32, 26, 20)):
        draw.rounded_rectangle((sx, sy + i * 10, sx + tw, sy + i * 10 + 5), 2, fill=(243, 242, 248))

    img.save(path, "PNG", optimize=True)
    print("wrote", path, img.size)


def main():
    catalog = json.loads((ROOT / "data" / "catalog.json").read_text(encoding="utf-8"))
    total = len(catalog["entries"])
    cards = [
        (
            "og.png",
            "非官方 · 精选目录",
            "Meta Muse 个人智能体的\n中文目录",
            f"Muse Bot 目录 · {total} 条 · 与 Meta 无隶属关系",
            ACCENT,
            PAPER,
            "",
        ),
        (
            "og-search.png",
            "非官方 · 搜索",
            "搜索",
            "按标题、别名和标签找 · Muse Bot 目录",
            ACCENT,
            PAPER_SEARCH,
            "输入关键词开始",
        ),
        (
            "og-404.png",
            "非官方 · 404",
            "没有这一页",
            "回首页搜索 · Muse Bot 目录",
            ACCENT,
            PAPER,
            "",
        ),
    ]
    painted = set()
    for name, badge, title, footer, accent, paper, kicker in cards:
        paint(OUT / name, badge, title, footer, accent, paper, kicker)
        painted.add(name)

    extra = ROOT / "scripts" / "og-cards.json"
    if extra.exists():
        for item in json.loads(extra.read_text(encoding="utf-8")):
            name = item["file"]
            if name in painted:
                continue
            paint(
                OUT / name,
                item["badge"],
                item["title"],
                item["footer"],
                tuple(item["accent"]),
                tuple(item["paper"]),
                item.get("kicker", ""),
            )
            painted.add(name)


if __name__ == "__main__":
    main()
