"""
앱 아이콘 / 스플래시 소스 생성 스크립트.
- PWA: icons/icon-192.png, icon-512.png, apple-touch-icon-180.png, maskable-512.png
- Capacitor: assets/icon-only.png (1024), assets/splash.png (2732)
실행: python3 scripts/make_icons.py
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
OUT.mkdir(parents=True, exist_ok=True)
ASSETS = ROOT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

PRIMARY = (233, 30, 140)      # #E91E8C
SECONDARY = (108, 99, 255)    # #6C63FF
WHITE = (255, 255, 255)


def make_gradient(size, top, bottom):
    """2픽셀 미니 그라디언트를 bilinear resize로 빠르게 확대."""
    mini = Image.new("RGB", (1, 2), top)
    mini.putpixel((0, 1), bottom)
    return mini.resize((size, size), Image.BILINEAR)


def find_font(size):
    """한글 지원 폰트 우선 검색."""
    candidates = [
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/truetype/noto/NotoSansKR-Bold.otf",
        "/usr/share/fonts/opentype/noto/NotoSansCJKkr-Bold.otf",
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",   # WenQuanYi (CJK)
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_ribbon(draw, cx, cy, s):
    """간결한 핑크 리본 심볼 (두 고리 + 매듭 + 두 꼬리)."""
    # 고리 두 개 (상단)
    loop_w = int(38 * s)
    loop_h = int(34 * s)
    stroke = max(4, int(7 * s))
    # 왼쪽 고리
    draw.ellipse(
        [cx - loop_w - int(2 * s), cy - loop_h, cx - int(2 * s), cy + 4],
        outline=WHITE, width=stroke,
    )
    # 오른쪽 고리
    draw.ellipse(
        [cx + int(2 * s), cy - loop_h, cx + loop_w + int(2 * s), cy + 4],
        outline=WHITE, width=stroke,
    )
    # 매듭 (중앙)
    knot_w = int(18 * s)
    knot_h = int(16 * s)
    draw.rounded_rectangle(
        [cx - knot_w // 2, cy - 2, cx + knot_w // 2, cy + knot_h],
        radius=int(5 * s),
        fill=WHITE,
    )
    # 꼬리 (아래로 V)
    tail_h = int(34 * s)
    tail_w = int(14 * s)
    left_tail = [
        (cx - 2, cy + knot_h - 2),
        (cx - tail_w - int(8 * s), cy + knot_h + tail_h),
        (cx - int(2 * s), cy + knot_h + int(8 * s)),
    ]
    right_tail = [
        (cx + 2, cy + knot_h - 2),
        (cx + tail_w + int(8 * s), cy + knot_h + tail_h),
        (cx + int(2 * s), cy + knot_h + int(8 * s)),
    ]
    draw.polygon(left_tail, fill=WHITE)
    draw.polygon(right_tail, fill=WHITE)


def draw_centered_text(draw, text, cx, top_y, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw // 2 - bbox[0], top_y - bbox[1]), text, fill=fill, font=font)
    return th


def draw_heart(draw, cx, cy, radius, fill):
    """심플한 하트 (두 원 + 다이아몬드)."""
    r = radius
    draw.ellipse([cx - r, cy - r * 0.85, cx, cy + r * 0.15], fill=fill)
    draw.ellipse([cx, cy - r * 0.85, cx + r, cy + r * 0.15], fill=fill)
    points = [
        (cx - r, cy - r * 0.05),
        (cx + r, cy - r * 0.05),
        (cx, cy + r * 1.15),
    ]
    draw.polygon(points, fill=fill)


def make_icon(size, padding_ratio=0.0):
    pad = int(size * padding_ratio)
    inner = size - pad * 2
    img = make_gradient(size, PRIMARY, SECONDARY)
    draw = ImageDraw.Draw(img)

    cx = size // 2

    # 큰 굵은 한글 캡션 두 줄: "이겨내자\n오늘도"
    font_size = max(20, int(inner * 0.18))
    font = find_font(font_size)
    line1 = "이겨내자"
    line2 = "오늘도"
    line1_bbox = draw.textbbox((0, 0), line1, font=font)
    line2_bbox = draw.textbbox((0, 0), line2, font=font)
    line1_h = line1_bbox[3] - line1_bbox[1]
    line2_h = line2_bbox[3] - line2_bbox[1]
    gap = int(inner * 0.04)
    block_h = line1_h + gap + line2_h
    block_top = pad + (inner - block_h) // 2
    draw_centered_text(draw, line1, cx, block_top, font, WHITE)
    draw_centered_text(draw, line2, cx, block_top + line1_h + gap, font, WHITE)

    return img


def make_splash(size):
    """스플래시: 그라디언트 배경 위 중앙에 한글 두 줄."""
    img = make_gradient(size, PRIMARY, SECONDARY)
    draw = ImageDraw.Draw(img)
    cx = size // 2
    font_size = max(40, int(size * 0.10))
    font = find_font(font_size)
    line1 = "이겨내자"
    line2 = "오늘도"
    line1_bbox = draw.textbbox((0, 0), line1, font=font)
    line2_bbox = draw.textbbox((0, 0), line2, font=font)
    line1_h = line1_bbox[3] - line1_bbox[1]
    line2_h = line2_bbox[3] - line2_bbox[1]
    gap = int(size * 0.02)
    block_h = line1_h + gap + line2_h
    block_top = (size - block_h) // 2
    draw_centered_text(draw, line1, cx, block_top, font, WHITE)
    draw_centered_text(draw, line2, cx, block_top + line1_h + gap, font, WHITE)
    return img


def main():
    # 1. PWA용 아이콘
    pwa_targets = [
        ("icon-192.png", 192, 0.0),
        ("icon-512.png", 512, 0.0),
        ("apple-touch-icon-180.png", 180, 0.0),
        ("maskable-512.png", 512, 0.12),
    ]
    for name, size, pad in pwa_targets:
        img = make_icon(size, padding_ratio=pad)
        out = OUT / name
        img.save(out, "PNG", optimize=True)
        print(f"  generated {out.relative_to(ROOT)}  ({size}x{size})")

    # 2. Capacitor용 소스 (1024 아이콘 + 2732 스플래시)
    icon_only = make_icon(1024, padding_ratio=0.0)
    icon_only.save(ASSETS / "icon-only.png", "PNG", optimize=True)
    print(f"  generated {(ASSETS / 'icon-only.png').relative_to(ROOT)}  (1024x1024)")

    splash = make_splash(2732)
    splash.save(ASSETS / "splash.png", "PNG", optimize=True)
    print(f"  generated {(ASSETS / 'splash.png').relative_to(ROOT)}  (2732x2732)")


if __name__ == "__main__":
    main()
