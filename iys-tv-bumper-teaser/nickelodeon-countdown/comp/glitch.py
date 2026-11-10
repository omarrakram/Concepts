"""The broadcast glitch: 18 frames (0.6 s) between the card's last frame (the IN YOUR SHOE logo on black) and the
countdown's locked signal. Every frame is a fixed recipe (KEYS) with seeded noise, so it renders identically every
time. No new imagery: only the card's own last frames, static, and the countdown's signal breaking through. No white
flash: the static's average brightness is held far below full white, and brightness swings stay under three a
second. (The recipe is the one first made for the Nickelodeon ident in this slot, unchanged.)

  A  (before)   the card, up to its last frame
  B  g0-g1      the picture freezes on the card's last frame and stutters back to the one before, a band tears
                sideways
  C  g2-g5      strong but controlled interference: tearing, scanline displacement, RGB split, static rising
  D  g6-g10     brief signal loss (dark, one bright sync line), then a new signal rolls in: horizontal distortion,
                RGB displacement
  E  g11-g17    the countdown locks: the roll stops, the tearing and static die away
"""
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RASTER_H, RASTER_W, rng  # noqa: E402

# per glitch frame: source ('last', 'prev': the card's last frame and the one before; 'cd': the countdown; or None),
# its opacity, vertical roll (fraction of the height), tears [(y0, y1, dx)] in fractions, wave amplitude (px), RGB split
# (px), static amount, random-walk jitter (px), extra: 'sync' = a bright horizontal sync line, 'loss' = the dark
# no-signal frame
KEYS = [
    dict(src='last', a=1.0, roll=0.00, tears=[(0.55, 0.68, 0.045)], wave=0, rgb=3, static=0.00, jitter=0),
    dict(src='prev', a=1.0, roll=-0.012, tears=[(0.30, 0.38, -0.06), (0.71, 0.74, 0.03)], wave=0, rgb=5, static=0.06, jitter=2),
    dict(src='last', a=1.0, roll=0.00, tears=[(0.12, 0.20, 0.05), (0.47, 0.60, -0.08), (0.80, 0.86, 0.11)], wave=14, rgb=7, static=0.22, jitter=6),
    dict(src='last', a=0.92, roll=0.05, tears=[(0.05, 0.22, -0.13), (0.40, 0.44, 0.20), (0.62, 0.77, 0.07)], wave=34, rgb=11, static=0.42, jitter=26, extra='sync'),
    dict(src='last', a=0.45, roll=0.21, tears=[(0.30, 0.52, 0.16)], wave=48, rgb=14, static=0.70, jitter=40),
    dict(src='last', a=0.15, roll=0.43, tears=[], wave=60, rgb=16, static=0.88, jitter=55),
    dict(src=None, a=0.0, roll=0.0, tears=[], wave=0, rgb=0, static=0.14, jitter=0, extra='loss'),
    dict(src='cd', a=0.35, roll=-0.38, tears=[(0.10, 0.30, 0.18), (0.55, 0.70, -0.12)], wave=40, rgb=16, static=0.62, jitter=45),
    dict(src='cd', a=0.60, roll=-0.24, tears=[(0.35, 0.47, -0.15), (0.70, 0.76, 0.09)], wave=28, rgb=12, static=0.44, jitter=28),
    dict(src='cd', a=0.80, roll=-0.12, tears=[(0.48, 0.56, 0.10)], wave=20, rgb=9, static=0.30, jitter=16, extra='sync'),
    dict(src='cd', a=0.92, roll=-0.05, tears=[(0.20, 0.26, -0.07)], wave=12, rgb=7, static=0.20, jitter=9),
    dict(src='cd', a=1.0, roll=0.0, tears=[(0.58, 0.64, 0.05)], wave=6, rgb=5, static=0.12, jitter=5),
    dict(src='cd', a=1.0, roll=0.0, tears=[], wave=3, rgb=3, static=0.08, jitter=3),
    dict(src='cd', a=1.0, roll=0.018, tears=[(0.40, 0.43, 0.025)], wave=2, rgb=3, static=0.06, jitter=2),
    dict(src='cd', a=1.0, roll=0.0, tears=[], wave=1.5, rgb=2, static=0.045, jitter=1.5),
    dict(src='cd', a=1.0, roll=0.0, tears=[], wave=1, rgb=1.2, static=0.03, jitter=1),
    dict(src='cd', a=1.0, roll=0.0, tears=[], wave=0.5, rgb=0.6, static=0.02, jitter=0.5),
    dict(src='cd', a=1.0, roll=0.0, tears=[], wave=0, rgb=0.3, static=0.015, jitter=0),
]
STATIC_MEAN = 0.26      # linear: the static's average brightness (full white is about 0.86)


def static(frame, amount):
    """TV snow: fine grains, a little longer across than down, faint colour speckle, a few brighter streaks."""
    g = rng('static', frame)
    n = g.random((RASTER_H // 2, RASTER_W // 3), dtype=np.float32)
    n = cv2.resize(n, (RASTER_W, RASTER_H), interpolation=cv2.INTER_NEAREST)
    n = cv2.GaussianBlur(n, (0, 0), sigmaX=1.2, sigmaY=0.5)
    n = (n - n.mean()) / (n.std() + 1e-6)
    streak = g.random(RASTER_H, dtype=np.float32)
    streak = (streak > 0.985).astype(np.float32) * g.random(RASTER_H, dtype=np.float32) * 1.6
    lum = np.clip(STATIC_MEAN * (1 + 0.85 * n) + streak[:, None] * STATIC_MEAN, 0, 1.2)
    tint = 1 + 0.06 * g.standard_normal((RASTER_H // 2, RASTER_W // 3, 3)).astype(np.float32)
    tint = cv2.resize(tint, (RASTER_W, RASTER_H), interpolation=cv2.INTER_LINEAR)
    return lum[..., None] * tint * amount


def _shift_rows(img, dx_rows):
    """Move each row sideways by dx_rows[y] pixels (subpixel); what slides off leaves black (blanking)."""
    h, w = img.shape[:2]
    mx = np.arange(w, dtype=np.float32)[None, :] - dx_rows[:, None].astype(np.float32)
    my = np.repeat(np.arange(h, dtype=np.float32)[:, None], w, axis=1)
    return cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def _rgb_split(img, px):
    if px <= 0:
        return img
    h, w = img.shape[:2]
    out = img.copy()
    for c, d in ((0, px), (2, -px)):
        M = np.float32([[1, 0, d], [0, 1, 0]])
        out[..., c] = cv2.warpAffine(img[..., c], M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return out


def _roll(img, frac):
    """The picture losing vertical hold: it slides by frac of its height, with the dark blanking bar between."""
    if abs(frac) < 1e-4:
        return img
    h = img.shape[0]
    k = int(round(frac * h))
    out = np.roll(img, k, axis=0)
    bar = int(0.075 * h)
    y = k % h
    lo, hi = max(0, y - bar), y
    out[lo:hi] *= 0.04
    return out


def frame(gi, film_frame, held, countdown_lin):
    """The signal at glitch frame gi (0-17): linear float32 HxWx3. held: the card's last two frames, linear
    ({'prev': lin, 'last': lin}); countdown_lin: the countdown's picture for this frame."""
    k = KEYS[gi]
    g = rng('glitch', gi)
    h, w = RASTER_H, RASTER_W
    if k['src'] == 'last':
        pic = held['last'].copy()
    elif k['src'] == 'prev':
        pic = held['prev'].copy()
    elif k['src'] == 'cd':
        pic = countdown_lin.copy()
    else:
        pic = np.zeros((h, w, 3), np.float32)
    # rows torn sideways, a travelling wave of scanline displacement, a random-walk jitter
    y = np.arange(h, dtype=np.float32)
    dx = np.zeros(h, np.float32)
    for y0, y1, d in k['tears']:
        a, b = int(y0 * h), int(y1 * h)
        dx[a:b] += d * w
    if k['wave']:
        ph = g.random() * 2 * np.pi
        dx += k['wave'] * np.sin(2 * np.pi * y / h * (2.5 + 2 * g.random()) + ph) \
            * (0.6 + 0.4 * np.sin(2 * np.pi * y / h * 11 + ph * 3))
    if k['jitter']:
        walk = np.cumsum(g.standard_normal(h // 8)).astype(np.float32)
        walk = (walk - walk.mean()) / (np.abs(walk).max() + 1e-6) * k['jitter']
        dx += np.repeat(walk, 8)[:h]
    if np.any(dx):
        pic = _shift_rows(pic, dx)
    pic = _rgb_split(pic, k['rgb'])
    pic = _roll(pic, k['roll'])
    out = pic * k['a']
    if k['static']:
        out = out * (1 - 0.6 * k['static']) + static(film_frame, k['static'])
    extra = k.get('extra')
    if extra == 'loss':
        out = out + 0.012
        yl = int(0.52 * h)
        out[yl - 2:yl + 2] += 0.55
        out[yl - 6:yl + 6] += 0.08
    elif extra == 'sync':
        yl = int((0.74 if gi < 6 else 0.31) * h)
        out[yl - 9:yl + 9] = out[yl - 9:yl + 9] * 0.3 + 0.62
    return np.maximum(out, 0).astype(np.float32)
