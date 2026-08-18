#!/usr/bin/env python3
"""Generate cream-filled home-screen icons and iOS launch images."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "client" / "public"
SPLASH_DIR = PUBLIC / "splash"
INDEX_HTML = ROOT / "client" / "index.html"

# Brand cream from client/src/index.css
CREAM = (237, 234, 226)  # #EDEAE2

# Unique iPhone/iPad splash specs: (pixel_w, pixel_h, scale)
# CSS device-width/height = pixel / scale. Landscape reuses portrait CSS size.
SPLASH_SPECS = [
    (1320, 2868, 3),  # iPhone 16/17 Pro Max
    (1260, 2736, 3),  # iPhone Air
    (1290, 2796, 3),  # iPhone 15/16 Plus, 14/15 Pro Max
    (1206, 2622, 3),  # iPhone 16/17 Pro
    (1179, 2556, 3),  # iPhone 14/15/16 Pro
    (1284, 2778, 3),  # iPhone 12/13/14 Plus Pro Max
    (1170, 2532, 3),  # iPhone 12/13/14/16e
    (1125, 2436, 3),  # iPhone X/11 Pro/12 mini/13 mini
    (1242, 2688, 3),  # iPhone 11 Pro Max / XS Max
    (828, 1792, 2),  # iPhone 11 / XR
    (1242, 2208, 3),  # iPhone 8 Plus
    (750, 1334, 2),  # iPhone SE / 8
    (640, 1136, 2),  # iPhone SE 1st gen
    (2048, 2732, 2),  # iPad Pro 12.9 / Air 13
    (1668, 2388, 2),  # iPad Pro 11
    (1640, 2360, 2),  # iPad Air 11 / 10.9
    (1668, 2224, 2),  # iPad Air 10.5
    (1620, 2160, 2),  # iPad 10.2
    (1536, 2048, 2),  # iPad 9.7 / mini 7.9
    (1488, 2266, 2),  # iPad mini 8.3
]


def cream_canvas(size: tuple[int, int]) -> Image.Image:
    return Image.new("RGB", size, CREAM)


def extract_mark(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    alpha = im.getchannel("A").point(lambda a: 255 if a > 12 else 0)
    bbox = alpha.getbbox()
    if not bbox:
        raise SystemExit(f"No opaque pixels in {path}")
    pad = 8
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(im.width, bbox[2] + pad)
    bottom = min(im.height, bbox[3] + pad)
    return im.crop((left, top, right, bottom))


def extract_on_cream(path: Path, pad: int = 6) -> Image.Image:
    """Pull green artwork off a cream plate, keeping anti-aliased edges."""
    im = Image.open(path).convert("RGBA")
    pixels = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if abs(r - 239) > 22 or abs(g - 230) > 22 or abs(b - 213) > 22:
                found = True
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
            else:
                pixels[x, y] = (r, g, b, 0)
    if not found:
        raise SystemExit(f"No artwork pixels in {path}")
    crop = im.crop(
        (
            max(0, minx - pad),
            max(0, miny - pad),
            min(w, maxx + 1 + pad),
            min(h, maxy + 1 + pad),
        )
    )
    return crop.filter(ImageFilter.UnsharpMask(radius=0.6, percent=80, threshold=2))


def fit_contain(src: Image.Image, box: tuple[int, int]) -> Image.Image:
    box_w, box_h = box
    ratio = min(box_w / src.width, box_h / src.height)
    new_size = (
        max(1, int(round(src.width * ratio))),
        max(1, int(round(src.height * ratio))),
    )
    return src.resize(new_size, Image.Resampling.LANCZOS)


def paste_center(base: Image.Image, overlay: Image.Image) -> None:
    x = (base.width - overlay.width) // 2
    y = (base.height - overlay.height) // 2
    if overlay.mode == "RGBA":
        base.paste(overlay, (x, y), overlay)
    else:
        base.paste(overlay, (x, y))


def make_icon(mark: Image.Image, size: int, fill: float = 0.9) -> Image.Image:
    """Cream square with the mark filling most of the canvas (iOS clips ~10% corners)."""
    canvas = cream_canvas((size, size))
    inner = max(1, int(round(size * fill)))
    fitted = fit_contain(mark, (inner, inner))
    paste_center(canvas, fitted)
    return canvas


def make_splash(
    mark: Image.Image, wordmark: Image.Image, width: int, height: int
) -> Image.Image:
    """Cream launch screen: large mark stacked over the wordmark, filling the view."""
    canvas = cream_canvas((width, height))
    short = min(width, height)
    landscape = width > height
    mark_box = int(round(short * (0.50 if landscape else 0.68)))
    word_w = int(round(short * (0.62 if landscape else 0.78)))
    gap = int(round(short * 0.04))
    mark_fitted = fit_contain(mark, (mark_box, mark_box))
    word_fitted = fit_contain(wordmark, (word_w, word_w))
    stack_h = mark_fitted.height + gap + word_fitted.height
    stack_w = max(mark_fitted.width, word_fitted.width)
    stack = Image.new("RGBA", (stack_w, stack_h), (0, 0, 0, 0))
    stack.paste(mark_fitted, ((stack_w - mark_fitted.width) // 2, 0), mark_fitted)
    stack.paste(
        word_fitted,
        ((stack_w - word_fitted.width) // 2, mark_fitted.height + gap),
        word_fitted,
    )
    paste_center(canvas, stack)
    return canvas


def save_png(im: Image.Image, path: Path, *, flatten: bool = True) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    out = im.convert("RGB") if flatten else im
    out.save(path, format="PNG", optimize=True)


def splash_filename(width: int, height: int) -> str:
    return f"apple-splash-{width}x{height}.png"


def splash_media(css_w: int, css_h: int, scale: int, orientation: str) -> str:
    # Apple wants portrait device-width/height even for landscape images.
    return (
        f"screen and (device-width: {css_w}px) and (device-height: {css_h}px) "
        f"and (-webkit-device-pixel-ratio: {scale}) and (orientation: {orientation})"
    )


def replace_html_section(html: str, start: str, end: str, inner: str) -> str:
    if start not in html or end not in html:
        raise SystemExit("index.html is missing apple splash markers")
    before, rest = html.split(start, 1)
    _, after = rest.split(end, 1)
    return f"{before}{start}\n{inner.rstrip()}\n    {end}{after}"


def main() -> None:
    mark = extract_mark(PUBLIC / "logo-vector-no-background.png")
    wordmark = extract_on_cream(PUBLIC / "KhayrCape Experiences Logo.png")

    icons = {
        PUBLIC / "apple-touch-icon.png": make_icon(mark, 180),
        PUBLIC / "apple-touch-icon-precomposed.png": make_icon(mark, 180),
        PUBLIC / "apple-touch-icon-180x180.png": make_icon(mark, 180),
        PUBLIC / "android-chrome-192x192.png": make_icon(mark, 192),
        PUBLIC / "android-chrome-512x512.png": make_icon(mark, 512),
        PUBLIC / "favicon-32x32.png": make_icon(mark, 32, fill=0.9),
        PUBLIC / "favicon-16x16.png": make_icon(mark, 16, fill=0.92),
    }
    for path, im in icons.items():
        save_png(im, path)

    pwa_mark = fit_contain(mark, (880, 880))
    save_png(pwa_mark, PUBLIC / "pwa-mark.png", flatten=False)
    save_png(wordmark, PUBLIC / "pwa-wordmark.png", flatten=False)

    make_icon(mark, 256, fill=0.9).save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    SPLASH_DIR.mkdir(parents=True, exist_ok=True)
    # Remove previous generated splashes so unused sizes do not linger.
    for old in SPLASH_DIR.glob("apple-splash-*.png"):
        old.unlink()

    links: list[str] = []
    written: set[tuple[int, int]] = set()
    for pixel_w, pixel_h, scale in SPLASH_SPECS:
        css_w = pixel_w // scale
        css_h = pixel_h // scale
        for orientation, w, h in (
            ("portrait", pixel_w, pixel_h),
            ("landscape", pixel_h, pixel_w),
        ):
            path = SPLASH_DIR / splash_filename(w, h)
            if (w, h) not in written:
                save_png(make_splash(mark, wordmark, w, h), path)
                written.add((w, h))
            href = f"/splash/{path.name}"
            media = splash_media(css_w, css_h, scale, orientation)
            links.append(
                f'    <link rel="apple-touch-startup-image" href="{href}" media="{media}" />'
            )

    html = INDEX_HTML.read_text()
    INDEX_HTML.write_text(replace_html_section(html, "<!-- apple-splash-start -->", "<!-- apple-splash-end -->", "\n".join(links)))
    print(
        f"Wrote {len(icons)} icons, favicon.ico, pwa overlay images, "
        f"{len(written)} splash images, {len(links)} link tags"
    )


if __name__ == "__main__":
    main()
