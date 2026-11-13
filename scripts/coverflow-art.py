#!/usr/bin/env python3
"""
Royalty-free images for the k3-coverflow playground demos.

- Ten scenes are painted here from code (gradients, value noise, layers):
  original artwork, dedicated to the public domain (CC0 1.0).
- Four photos come from the scikit-image sample data (CC0 / public domain,
  see playground/public/coverflow/CREDITS.md).

Writes playground/public/coverflow/full/<name>.webp (1200 px, lightbox) and
playground/public/coverflow/<name>.webp (448 px square covers).

    pip install numpy pillow scikit-image
    python3 scripts/coverflow-art.py
"""

from __future__ import annotations

import os
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'playground', 'public', 'coverflow')
W, H = 1200, 900


def rgb(h: str) -> np.ndarray:
    h = h.lstrip('#')
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float64) / 255.0


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)


def gradient(stops: list[tuple[float, str]], n: int) -> np.ndarray:
    """Vertical colour ramp, `n` rows → (n, 3)."""
    y = np.linspace(0, 1, n)
    out = np.zeros((n, 3))
    for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
        m = (y >= p0) & (y <= p1)
        t = smooth((y[m] - p0) / max(p1 - p0, 1e-9))[:, None]
        out[m] = lerp(rgb(c0), rgb(c1), t)
    return out


def noise1d(n: int, rng: np.random.Generator, octaves: int = 6, base: int = 4, rough: float = 0.5) -> np.ndarray:
    """Fractal value noise in [-1, 1], length `n`."""
    x = np.linspace(0, 1, n)
    total = np.zeros(n)
    amp, freq, norm = 1.0, base, 0.0
    for _ in range(octaves):
        pts = rng.uniform(-1, 1, freq + 2)
        xs = np.linspace(0, 1, freq + 2)
        total += amp * np.interp(x, xs, pts)
        norm += amp
        amp *= rough
        freq *= 2
    return total / norm


def ridge(rng, height: float, amp: float, octaves=7, base=3, rough=0.52, sharp=False) -> np.ndarray:
    n = noise1d(W, rng, octaves, base, rough)
    if sharp:
        n = 1 - np.abs(n) * 2
    return (height - amp * n) * H


def fill_below(img: np.ndarray, line: np.ndarray, color: np.ndarray, fade: float = 0.0, top_tint=None):
    """Paint `color` under the per-column `line` (y in px), soft 1.5 px edge."""
    yy = np.arange(H)[:, None]
    mask = np.clip((yy - line[None, :]) / 1.5 + 0.5, 0, 1)
    col = np.broadcast_to(color, (H, W, 3)).copy()
    if fade:
        depth = np.clip((yy - line[None, :]) / (fade * H), 0, 1)[..., None]
        col = lerp(col if top_tint is None else top_tint, color, depth) if top_tint is not None else col * (1 - 0.25 * depth)
    img[:] = lerp(img, col, mask[..., None])


def glow(img, cx, cy, r, color, strength=1.0):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    g = np.exp(-d * d) * strength
    img[:] = img + (rgb(color) - img) * np.clip(g, 0, 1)[..., None]


def disc(img, cx, cy, r, color):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    m = np.clip(r - d + 0.5, 0, 1)[..., None]
    img[:] = lerp(img, rgb(color), m)


def stars(img, rng, count, top=0.0, bottom=0.6, bright=1.0):
    for _ in range(count):
        x = rng.integers(0, W)
        y = int(rng.uniform(top, bottom) * H)
        b = rng.uniform(0.35, 1.0) * bright
        img[y, x] = np.maximum(img[y, x], b)
        if b > 0.85 and 0 < x < W - 1 and 0 < y < H - 1:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                img[y + dy, x + dx] = np.maximum(img[y + dy, x + dx], b * 0.45)


def finish(img: np.ndarray, rng, grain=0.018, vignette=0.22) -> Image.Image:
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    img = img * (1 - vignette * np.clip(d - 0.45, 0, 1)[..., None])
    img = img + rng.normal(0, grain, (H, W, 1))
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))


def sky(stops) -> np.ndarray:
    return np.repeat(gradient(stops, H)[:, None, :], W, axis=1)


def mountains(img, rng, layers, near: str, far: str, fog: str, start=0.42, step=0.11, amp=0.12, sharp=True):
    for i in range(layers):
        t = i / max(layers - 1, 1)
        col = lerp(rgb(far), rgb(near), t)
        col = lerp(col, rgb(fog), (1 - t) * 0.35)
        line = ridge(rng, start + i * step, amp * (1.0 - 0.35 * t), sharp=sharp and i < layers - 1)
        fill_below(img, line, col)


def water(img, horizon: float, rng, ripple=0.012):
    """Mirror everything above the horizon, darkened, with ripples."""
    h = int(horizon * H)
    top = img[:h].copy()
    rows = H - h
    src = np.clip(h - 1 - (np.arange(rows) * (h / rows) * 0.9).astype(int), 0, h - 1)
    refl = top[src]
    shift = (np.sin(np.arange(rows)[:, None] * 0.9 + rng.uniform(0, 6, (1, 1))) * ripple * W * (np.arange(rows)[:, None] / rows + 0.1)).astype(int)
    idx = (np.arange(W)[None, :] + shift) % W
    refl = np.take_along_axis(refl, idx[..., None].repeat(3, axis=2), axis=1)
    depth = (np.arange(rows) / rows)[:, None, None]
    img[h:] = refl * (0.78 - 0.25 * depth) + 0.03


# ── Scenes ────────────────────────────────────────────────────────────────


def alpine_dawn(rng):
    img = sky([(0, '#2a2f6b'), (0.35, '#a65d9b'), (0.55, '#f29e7d'), (0.7, '#ffd7a8'), (1, '#ffd7a8')])
    glow(img, 760, 520, 260, '#fff1c9', 0.85)
    disc(img, 760, 520, 46, '#fff6df')
    mountains(img, rng, 5, '#1c1f3f', '#8f7ab8', '#f2b8a6', start=0.5, step=0.1, amp=0.16)
    return finish(img, rng)


def night_aurora(rng):
    img = sky([(0, '#030817'), (0.6, '#0b2140'), (1, '#12324f')])
    stars(img, rng, 900, 0, 0.75)
    yy, xx = np.mgrid[0:H, 0:W]
    for k, (col, base, amp) in enumerate((('#38f5b0', 0.34, 0.08), ('#4cc3ff', 0.26, 0.06), ('#b98cff', 0.2, 0.05))):
        curve = (base + amp * noise1d(W, rng, 4, 2, 0.5)) * H
        band = np.exp(-(((yy - curve[None, :]) / (H * 0.035)) ** 2))
        rays = np.clip(curve[None, :] - yy, 0, None) / (H * 0.25)
        curtain = np.exp(-rays) * (yy < curve[None, :]) * (0.55 + 0.45 * noise1d(W, rng, 6, 40, 0.6)[None, :])
        a = np.clip(band * 0.9 + curtain * 0.55, 0, 1) * (0.75 - k * 0.15)
        img[:] = img + rgb(col) * a[..., None] * 0.9
    mountains(img, rng, 3, '#02050c', '#0f2236', '#123150', start=0.66, step=0.09, amp=0.1)
    return finish(img, rng, vignette=0.3)


def ocean_dusk(rng):
    img = sky([(0, '#1d2b64'), (0.3, '#5b4a8a'), (0.5, '#e07a5f'), (0.6, '#f9c784'), (1, '#f9c784')])
    glow(img, 600, 540, 300, '#ffe6b0', 0.9)
    disc(img, 600, 560, 70, '#fff3d6')
    water(img, 0.6, rng, 0.006)
    yy = np.arange(H)[:, None]
    path = np.exp(-(((np.arange(W) - 600) / 70.0) ** 2))[None, :] * (yy > 0.6 * H)
    sparkle = (rng.random((H, W)) > 0.82) * path
    img[:] = img + sparkle[..., None] * 0.35
    return finish(img, rng)


def desert_dunes(rng):
    img = sky([(0, '#3a7bd5'), (0.45, '#9cc9f0'), (0.62, '#f6e0b5'), (1, '#f6e0b5')])
    glow(img, 300, 260, 180, '#ffffff', 0.6)
    yy = np.arange(H)[:, None]
    for light, dark, h, amp in (('#efc28f', '#c07a46', 0.5, 0.06), ('#f3b878', '#a65a2c', 0.6, 0.09), ('#f8c582', '#8f4320', 0.74, 0.12)):
        line = ridge(rng, h, amp, octaves=4, base=2, rough=0.35, sharp=True)
        line = np.convolve(np.pad(line, 40, mode='edge'), np.hanning(61) / np.hanning(61).sum(), mode='same')[40:-40]
        slope = np.gradient(line)
        lit = (1 / (1 + np.exp(-slope * 2.2)))[None, :, None]
        depth = np.clip((yy - line[None, :]) / (0.3 * H), 0, 1)[..., None]
        col = lerp(rgb(dark), rgb(light), lerp(lit, 0.6, smooth(depth * 1.6)))
        col = col * (1 - 0.22 * depth) + (rng.normal(0, 0.012, (H, W, 1)))
        mask = np.clip((yy - line[None, :]) / 1.5 + 0.5, 0, 1)[..., None]
        img[:] = lerp(img, col, mask)
    return finish(img, rng, grain=0.022)


def misty_forest(rng):
    img = sky([(0, '#c9d9d3'), (0.5, '#e4ece6'), (1, '#9fb5ad')])
    yy = np.arange(H)[:, None]
    for i in range(5):
        t = i / 4
        col = lerp(rgb('#b5c9c1'), rgb('#14302a'), t)
        base = (0.45 + i * 0.1) * H
        line = np.full(W, base) + noise1d(W, rng, 3, 2, 0.5) * 30
        trees = np.zeros(W)
        x = -20.0
        while x < W + 20:
            w = rng.uniform(16, 34) * (0.6 + t)
            hgt = rng.uniform(70, 150) * (0.6 + t)
            xs = np.arange(max(0, int(x - w)), min(W, int(x + w)))
            prof = hgt * (1 - np.abs(xs - x) / w)
            trees[xs] = np.maximum(trees[xs], prof)
            x += w * rng.uniform(0.7, 1.3)
        fill_below(img, line - trees, col)
        fog = np.exp(-((yy - base - 30) / (H * 0.05)) ** 2)[..., None] * 0.35
        img[:] = lerp(img, rgb('#e8f0ec'), fog)
    return finish(img, rng, vignette=0.18)


def lake_reflection(rng):
    img = sky([(0, '#5aa0d8'), (0.5, '#bfe0f2'), (0.58, '#e9f4f7'), (1, '#e9f4f7')])
    mountains(img, rng, 3, '#2e4a3f', '#7d97b8', '#cfe3ef', start=0.32, step=0.09, amp=0.14)
    fill_below(img, ridge(rng, 0.565, 0.012, octaves=5, base=6), rgb('#1f3a2c'))
    water(img, 0.58, rng, 0.004)
    return finish(img, rng)


def lavender_hills(rng):
    img = sky([(0, '#7f8fd6'), (0.4, '#c9b6e4'), (0.6, '#f7d6e0'), (1, '#f7d6e0')])
    glow(img, 900, 380, 220, '#fff4e6', 0.7)
    for i, col in enumerate(('#b39ddb', '#9575cd', '#7e57c2', '#5e35b1', '#3f2a7a')):
        fill_below(img, ridge(rng, 0.5 + i * 0.1, 0.06, octaves=3, base=2, rough=0.35), rgb(col))
    yy, xx = np.mgrid[0:H, 0:W]
    rows = np.sin(xx * 0.06 + yy * 0.012) * 0.5 + 0.5
    m = (yy > 0.8 * H)[..., None] * rows[..., None] * 0.12
    img[:] = img + m
    return finish(img, rng)


def starry_valley(rng):
    img = sky([(0, '#05040f'), (0.55, '#1a1440'), (1, '#2b1d4f')])
    yy, xx = np.mgrid[0:H, 0:W]
    band = np.exp(-(((yy - (0.9 * H - xx * 0.55)) / (H * 0.12)) ** 2))
    img[:] = img + band[..., None] * (rgb('#6d5bd0') * 0.35 + 0.08 * noise1d(W, rng, 6, 30)[None, :, None])
    stars(img, rng, 1400, 0, 0.8)
    mountains(img, rng, 2, '#05030a', '#1c1533', '#2b1d4f', start=0.68, step=0.1, amp=0.12)
    return finish(img, rng, vignette=0.32)


def mesas(rng, ground: float, top: tuple[float, float], count: int) -> np.ndarray:
    line = (ground + 0.015 * noise1d(W, rng, 5, 6)) * H
    for _ in range(count):
        cx = rng.uniform(0, W)
        half = rng.uniform(60, 220)
        foot = half + rng.uniform(25, 60)
        peak = rng.uniform(*top) * H
        xs = np.arange(W)
        d = np.abs(xs - cx)
        prof = np.where(d < half, peak, np.where(d < foot, peak + (d - half) / (foot - half) * (line - peak), line))
        prof = prof + noise1d(W, rng, 6, 60) * 3
        line = np.minimum(line, prof)
    return line


def red_canyon(rng):
    img = sky([(0, '#2f80c9'), (0.45, '#a7d3f2'), (0.7, '#f4dcc0'), (1, '#f4dcc0')])
    yy = np.arange(H)[:, None]
    for i, (top, bot, ground, peaks, n) in enumerate((
        ('#e7b08d', '#d39270', 0.66, (0.38, 0.5), 4),
        ('#d0764a', '#a24a26', 0.74, (0.45, 0.6), 3),
        ('#9c4424', '#5a1f0e', 0.86, (0.8, 0.84), 0),
    )):
        line = mesas(rng, ground, peaks, n)
        depth = np.clip((yy - line[None, :]) / (0.3 * H), 0, 1)[..., None]
        strata = (np.sin(yy * 0.22 + i * 2) > 0.6)[..., None] * 0.05
        col = lerp(rgb(top), rgb(bot), depth) - strata
        mask = np.clip((yy - line[None, :]) / 1.5 + 0.5, 0, 1)[..., None]
        img[:] = lerp(img, col, mask)
    return finish(img, rng, grain=0.02)


def moonrise(rng):
    img = sky([(0, '#0b1b3a'), (0.45, '#24477a'), (0.6, '#5d7fb0'), (1, '#5d7fb0')])
    stars(img, rng, 300, 0, 0.45, 0.8)
    glow(img, 600, 380, 230, '#cfe0ff', 0.55)
    disc(img, 600, 380, 95, '#f3f6ff')
    yy, xx = np.mgrid[0:H, 0:W]
    inside = (xx - 600) ** 2 + (yy - 380) ** 2 < 92 ** 2
    shade = Image.fromarray((rng.random((24, 24)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    img[inside] = img[inside] * (0.9 + 0.1 * (np.asarray(shade, dtype=np.float64)[inside] / 255))[:, None]
    water(img, 0.62, rng, 0.008)
    return finish(img, rng, vignette=0.28)


SCENES = {
    'alpine-dawn': alpine_dawn,
    'night-aurora': night_aurora,
    'ocean-dusk': ocean_dusk,
    'desert-dunes': desert_dunes,
    'misty-forest': misty_forest,
    'lake-reflection': lake_reflection,
    'lavender-hills': lavender_hills,
    'starry-valley': starry_valley,
    'red-canyon': red_canyon,
    'moonrise': moonrise,
}

#: scikit-image sample data — CC0 / public domain (see CREDITS.md)
PHOTOS = {
    'coffee': 'coffee.png',
    'rocket': 'rocket.jpg',
    'deep-field': 'hubble_deep_field.jpg',
    'cat': 'chelsea.png',
}


def save(name: str, im: Image.Image) -> None:
    os.makedirs(os.path.join(ROOT, 'full'), exist_ok=True)
    full = im.copy()
    full.thumbnail((1200, 1200), Image.LANCZOS)
    full.save(os.path.join(ROOT, 'full', f'{name}.webp'), 'WEBP', quality=80, method=6)
    cover = ImageOps.fit(im, (448, 448), Image.LANCZOS)
    cover.save(os.path.join(ROOT, f'{name}.webp'), 'WEBP', quality=72, method=6)


def main() -> None:
    for i, (name, paint) in enumerate(SCENES.items()):
        save(name, paint(np.random.default_rng(2026 + i)).filter(ImageFilter.SMOOTH_MORE))
    try:
        import skimage.data
    except ImportError:
        sys.exit('scikit-image is needed for the photos (pip install scikit-image)')
    data = os.path.dirname(skimage.data.__file__)
    for name, file in PHOTOS.items():
        save(name, Image.open(os.path.join(data, file)).convert('RGB'))


if __name__ == '__main__':
    main()
