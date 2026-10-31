"""The photograph, its screen glass and the camera.

The glass is described by its four measured edges (config/plate.json). A point's place on the glass is read
straight off them: u runs from the left edge to the right edge along the point's row, v from the top edge to the
bottom edge along its column. So the picture curves exactly as the glass does, and u, v are 0 and 1 on its rim.
"""
import math
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RASTER_H, RASTER_W, decode8, load_json, path, sha256  # noqa: E402


class Plate:
    def __init__(self, cfg=None):
        self.cfg = cfg or load_json('config', 'plate.json')
        f = path(self.cfg['file'])
        if not os.path.exists(f):
            raise SystemExit(f'missing the TV photo: {self.cfg["file"]} (see plate/README.md)')
        got = sha256(f)
        if got != self.cfg['sha256']:
            raise SystemExit(f'{self.cfg["file"]} is not the supplied photo (sha256 {got})')
        bgr = cv2.imread(f, cv2.IMREAD_COLOR)
        self.srgb8 = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        self.H, self.W = self.srgb8.shape[:2]
        assert [self.W, self.H] == self.cfg['size']
        self.lin = decode8(self.srgb8)
        g = self.cfg['glass']
        self.top, self.bottom = np.poly1d(g['top']), np.poly1d(g['bottom'])
        self.left, self.right = np.poly1d(g['left']), np.poly1d(g['right'])
        self.radius = g['cornerRadius']
        self.soft = g['edgeSoftness']
        # the centre of the glass and its width/height through the centre (photo px)
        cy = (self.top(470) + self.bottom(470)) / 2
        cx = (self.left(cy) + self.right(cy)) / 2
        for _ in range(4):
            cy = (self.top(cx) + self.bottom(cx)) / 2
            cx = (self.left(cy) + self.right(cy)) / 2
        self.centre = (cx, cy)
        self.wc = self.right(cy) - self.left(cy)
        self.hc = self.bottom(cx) - self.top(cx)
        ox = self.cfg['picture']['overscanX']
        self.ox = ox
        # the picture (4:3, square pixels) is (1 + 2 ox) glass-widths wide; v covers hc of its height
        self.pic_w = self.wc * (1 + 2 * ox)
        self.pic_h = self.pic_w * 3 / 4
        self.kv = self.hc / self.pic_h
        # where the glass is, with a margin for the light around it
        ys = np.linspace(self.top(cx) - 5, self.bottom(cx) + 5, 50)
        xs = np.linspace(self.left(cy) - 5, self.right(cy) + 5, 50)
        self.bbox = (float(min(self.left(ys).min(), xs.min())), float(min(self.top(xs).min(), ys.min())),
                     float(max(self.right(ys).max(), xs.max())), float(max(self.bottom(xs).max(), ys.max())))
        self.spill_map = self._spill_map()

    # --- the glass, at any photo coordinates (OpenCV convention: pixel centres on integers) --------------------
    def uv(self, x, y):
        L, R = self.left(y), self.right(y)
        T, B = self.top(x), self.bottom(x)
        return (x - L) / (R - L), (y - T) / (B - T)

    def signed_distance(self, x, y):
        """Photo pixels from the glass's rim: positive inside, rounded corners."""
        a = np.minimum(x - self.left(y), self.right(y) - x)
        b = np.minimum(y - self.top(x), self.bottom(x) - y)
        r = self.radius
        qx, qy = r - a, r - b
        d = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r
        return -d

    def picture_xy(self, u, v):
        """u, v on the glass -> the signal's pixel (raster 1440x1080)."""
        px = (u + self.ox) / (1 + 2 * self.ox) * RASTER_W - 0.5
        py = (0.5 + (v - 0.5) * self.kv) * RASTER_H - 0.5
        return px, py

    # --- where the set's light falls in the room ---------------------------------------------------------------
    def _spill_map(self):
        s = self.cfg['spill']
        yy, xx = np.mgrid[0:self.H, 0:self.W].astype(np.float32)
        w = np.zeros((self.H, self.W), np.float32)
        for cx, cy, rx, ry, k in s['regions']:
            e = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
            w = np.maximum(w, k * np.exp(-0.5 * e ** 1.5))
        gx, gy = self.centre
        d2 = (xx - gx) ** 2 + (yy - gy) ** 2
        w *= np.exp(-d2 / (2 * s['falloff'] ** 2))
        w[self.signed_distance(xx, yy) > -40] = 0   # never on the glass or the set's own front around it
        return cv2.GaussianBlur(w, (0, 0), 6)


def _pchip(ts, ys):
    """Monotone cubic interpolation (Fritsch-Carlson): no overshoot, so the camera never backs up."""
    ts, ys = np.asarray(ts, float), np.asarray(ys, float)
    h = np.diff(ts)
    d = np.diff(ys) / h
    m = np.zeros_like(ys)
    m[0], m[-1] = d[0], d[-1]
    for i in range(1, len(ys) - 1):
        if d[i - 1] * d[i] <= 0:
            m[i] = 0
        else:
            w1, w2 = 2 * h[i] + h[i - 1], h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])

    def f(t):
        t = min(max(t, ts[0]), ts[-1])
        i = min(np.searchsorted(ts, t, side='right') - 1, len(h) - 1)
        x = (t - ts[i]) / h[i]
        h00, h10 = 2 * x ** 3 - 3 * x ** 2 + 1, x ** 3 - 2 * x ** 2 + x
        h01, h11 = -2 * x ** 3 + 3 * x ** 2, x ** 3 - x ** 2
        return h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1]
    return f


class Camera:
    """The push-in, as a window on the photo for every frame of one format: the distance travelled so far
    (the integral of the speed curve) moves the window from its start to its end, zoom and centre together."""

    def __init__(self, plate, fmt, out_w, out_h, fps=30):
        cam = plate.cfg['camera']
        c = cam[fmt]
        self.aspect = c['aspect']
        assert abs(out_w / out_h - self.aspect) < 1e-3
        keys = np.array(cam['speed'], float)
        speed = _pchip(keys[:, 0], keys[:, 1])
        # the distance travelled, integrated finely (100 steps a frame), sampled at every frame's start
        n = int(round(keys[-1, 0] * fps)) + 1
        t = np.linspace(0, keys[-1, 0], (n - 1) * 100 + 1)
        v = np.maximum([speed(x) for x in t], 0)
        s = np.concatenate([[0], np.cumsum((v[1:] + v[:-1]) / 2 * np.diff(t))])
        self.progress = s[::100] / s[-1]
        self.start, self.end = np.array(c['start'], float), np.array(c['end'], float)
        self.plate, self.out_w, self.out_h, self.fps = plate, out_w, out_h, fps

    def window(self, frame):
        p = self.progress[min(max(frame, 0), len(self.progress) - 1)]
        h = math.exp(math.log(self.start[2]) + (math.log(self.end[2]) - math.log(self.start[2])) * p)
        w = h * self.aspect
        cx = self.start[0] + (self.end[0] - self.start[0]) * p
        cy = self.start[1] + (self.end[1] - self.start[1]) * p
        W, H = self.plate.W, self.plate.H
        cx = min(max(cx, w / 2), W - w / 2)
        cy = min(max(cy, h / 2), H - h / 2)
        return cx, cy, w, h

    def matrix(self, frame):
        """2x3 affine, photo (OpenCV pixel coordinates) -> output, and the scale (output px per photo px)."""
        cx, cy, w, h = self.window(frame)
        s = self.out_h / h
        x0, y0 = cx - w / 2, cy - h / 2
        M = np.float32([[s, 0, s * (0.5 - x0) - 0.5], [0, s, s * (0.5 - y0) - 0.5]])
        return M, s
