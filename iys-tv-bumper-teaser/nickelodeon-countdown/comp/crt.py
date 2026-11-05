"""The television's own look, applied to every picture it shows (cartoon, card, glitch, countdown alike):

  signal()      on the 4:3 signal: an analog picture's limited sharpness (softer across than down), colour that
                bleeds a little sideways (composite video), a faint shimmer of analog noise
  structure()   on the glass, in the film's pixels: the scanlines and the phosphor stripes, which only show once
                the camera is close enough to resolve them (they are band-limited, never aliased into moire),
                and the tube's darker corners
"""
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import rng  # noqa: E402

LINES = 288          # visible lines in one PAL field: what a camera close to a CRT resolves as scanlines
STRIPES = 400        # phosphor stripe triads across the picture (aperture-grille look)

# Rec.601 luma / colour difference, used only for the sideways colour bleed
_Y = np.array([0.299, 0.587, 0.114], np.float32)


def signal(lin, frame, noise=0.006):
    """lin: HxWx3 linear float32 -> the same, as an analog TV picture."""
    img = cv2.GaussianBlur(lin, (0, 0), sigmaX=1.5, sigmaY=0.9)
    y = img @ _Y
    c = img - y[..., None]
    c = cv2.GaussianBlur(c, (0, 0), sigmaX=2.6, sigmaY=0.4)      # chroma is narrower than luma
    img = y[..., None] + c * 1.04                                   # a touch of the set's saturation
    if noise:
        g = rng('signal-noise', frame)
        n = g.standard_normal(img.shape[:2]).astype(np.float32)
        n = cv2.GaussianBlur(n, (0, 0), sigmaX=0.9, sigmaY=0.3)
        img = img + n[..., None] * noise * (0.25 + np.sqrt(np.maximum(y, 0)))[..., None]
    return np.maximum(img, 0)


def _fade(freq, lo=0.24, hi=0.42):
    """1 when a pattern of this frequency (cycles per film pixel) is comfortably resolved, 0 near Nyquist."""
    return float(np.clip((hi - freq) / (hi - lo), 0, 1))


def structure(rgb, px, py, pic_w_out, depth_lines=0.26, depth_stripes=0.05):
    """Scanlines and phosphor stripes, from each film pixel's position on the signal (px, py in raster pixels of a
    1440x1080 picture); pic_w_out is the picture's width in film pixels (sets what can be resolved)."""
    pic_h_out = pic_w_out * 0.75
    a_l = _fade(LINES / pic_h_out)
    a_s = _fade(STRIPES / pic_w_out)
    out = rgb
    if a_l > 0:
        lum = np.clip(rgb @ _Y, 0, 1)
        phase = py / 1080.0 * LINES
        line = 0.5 - 0.5 * np.cos(2 * np.pi * phase)               # 1 at a line's centre, 0 between lines
        d = depth_lines * a_l * (1 - 0.4 * lum)                    # bright lines bloom into the gaps
        out = out * ((1 - d * (1 - line)) / (1 - d * 0.5))[..., None]
    if a_s > 0:
        phase = px / 1440.0 * STRIPES
        k = depth_stripes * a_s
        m = np.stack([1 - k * (0.5 - 0.5 * np.cos(2 * np.pi * (phase - c / 3))) for c in range(3)], axis=-1)
        out = out * (m / (1 - k * 0.5))
    return out


def corner_falloff(u, v, strength=0.20):
    """A tube is brightest in the middle: the corners fall off a little."""
    du, dv = (u - 0.5) * 2, (v - 0.5) * 2
    return (1 - strength * (0.55 * du * du + 0.45 * dv * dv) ** 1.5).astype(np.float32)
