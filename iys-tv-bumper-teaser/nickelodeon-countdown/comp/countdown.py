"""The countdown: what it shows on every frame (exact integer arithmetic from config/countdown.json), and the picture
of it as the new signal: three two-digit groups (hours:minutes:seconds) and two colons, softly luminous on black.
No labels and no words: only digits and colons are ever drawn."""
import json
import math
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'


def load_config():
    with open(os.path.join(ROOT, 'config', 'countdown.json')) as f:
        cfg = json.load(f)
    with open(os.path.join(ROOT, 'config', 'timeline.json')) as f:
        tl = json.load(f)
    return cfg, tl


class Countdown:
    """Frame -> the value on screen. The film's frame clockOriginFrame shows `start`; from there the value is the time
    left, one second less every second, rounded up to the second (ceil)."""

    def __init__(self, cfg=None, tl=None):
        if cfg is None:
            cfg, tl = load_config()
        assert cfg['format'] == 'HH:MM:SS'
        h, m, s = (int(v) for v in cfg['start'].split(':'))
        assert 0 <= m < 60 and 0 <= s < 60 and 0 <= h < 100
        self.total = h * 3600 + m * 60 + s     # 80542 for 22:22:22
        self.start = cfg['start']
        self.fps = int(cfg['fps'])
        self.origin = int(tl['countdown']['clockOriginFrame'])

    def seconds(self, frame):
        """Whole seconds on screen at this frame: ceil(total - elapsed), never below 0, never above total."""
        k = max(0, frame - self.origin)              # frames since the clock started
        left = self.total * self.fps - k              # in frames
        return max(0, -(-left // self.fps))           # ceil(left / fps), integer arithmetic

    @staticmethod
    def groups(seconds):
        h, r = divmod(seconds, 3600)
        m, s = divmod(r, 60)
        assert h <= 99
        return h, m, s

    def text(self, frame):
        return '%02d:%02d:%02d' % self.groups(self.seconds(frame))

    def last_tick(self, frame):
        """(frame the current value appeared on, the value before it) for the tick animation; None before the
        first tick."""
        k = frame - self.origin
        if k < self.fps:
            return None
        tick = self.origin + (k // self.fps) * self.fps
        return tick, self.text(tick - 1)


def _ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


class CountdownPicture:
    """Draws the countdown at the CRT raster's size (linear light, float32, HxWx3). The changed digits settle
    in from just below with a short brightness swell while the old ones fade like phosphor; the rest stay still."""

    COLOR = np.array([0.86, 0.94, 1.0], np.float32)      # a cool CRT white

    def __init__(self, width=1440, height=1080, text_width=0.80, countdown=None):
        self.w, self.h = width, height
        self.cd = countdown or Countdown()
        # size the type so the line (its digits and colons) spans text_width of the raster (title-safe)
        probe = ImageFont.truetype(FONT, 200)
        adv_d, adv_c = probe.getlength('0'), probe.getlength(':')
        self.track = 0.04                                   # extra space after each character, in em
        sample = self.cd.text(self.cd.origin)
        nd, nc = sum(ch.isdigit() for ch in sample), sample.count(':')
        em_units = nd * adv_d / 200 + nc * adv_c / 200 + (len(sample) - 1) * self.track
        self.size = int(round(text_width * width / em_units))
        self.font = ImageFont.truetype(FONT, self.size)
        self.adv_d = self.font.getlength('0')
        self.adv_c = self.font.getlength(':')
        self.glyphs = {c: self._glyph(c) for c in '0123456789:'}
        # the digits' cap height decides the vertical centre; the colon is centred on it
        x0, y0, x1, y1 = self.font.getbbox('0')
        self.cap_top, self.cap_bottom = y0, y1
        self.digit_h = y1 - y0

    def _glyph(self, ch):
        """A glyph's coverage mask in a cell (pad px of air each side) plus the pen offset of its origin."""
        pad = int(self.size * 0.25)
        x0, y0, x1, y1 = self.font.getbbox(ch)
        w = int(math.ceil(self.font.getlength(ch))) + 2 * pad
        h = int(self.size * 1.3) + 2 * pad
        im = Image.new('L', (w, h), 0)
        ImageDraw.Draw(im).text((pad, pad), ch, font=self.font, fill=255)
        return np.asarray(im, np.float32) / 255.0, pad

    def layout(self, text):
        """x of each character's pen position, the whole line centred."""
        xs, x = [], 0.0
        for c in text:
            xs.append(x)
            x += (self.adv_d if c != ':' else self.adv_c) + self.track * self.size
        width = x - self.track * self.size
        left = (self.w - width) / 2
        return [left + v for v in xs]

    def _stamp(self, canvas, ch, x, y_shift, gain):
        mask, pad = self.glyphs[ch]
        # pen origin: x; the line's cap-height centre sits at the raster's centre
        cy = self.h / 2
        top = cy - (self.cap_top + self.cap_bottom) / 2
        if ch == ':':
            # centre the colon's dots on the digits' cap height instead of the font's lower position
            x0, y0, x1, y1 = self.font.getbbox(':')
            top = cy - (y0 + y1) / 2
        ox, oy = x - pad, top - pad + y_shift
        ix, iy = int(math.floor(ox)), int(math.floor(oy))
        fx, fy = ox - ix, oy - iy
        m = cv2.warpAffine(mask, np.float32([[1, 0, fx], [0, 1, fy]]), (mask.shape[1] + 1, mask.shape[0] + 1),
                           flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        h, w = m.shape
        x0, y0 = max(ix, 0), max(iy, 0)
        x1, y1 = min(ix + w, self.w), min(iy + h, self.h)
        if x1 > x0 and y1 > y0:
            canvas[y0:y1, x0:x1] += gain * m[y0 - iy:y1 - iy, x0 - ix:x1 - ix]

    def coverage(self, frame):
        """The luminous coverage of the line at this frame (HxW float32): 1 = a fully lit stroke."""
        cd = self.cd
        text = cd.text(frame)
        tick = cd.last_tick(frame)
        age = frame - tick[0] if tick else 99
        before = tick[1] if tick else text
        xs = self.layout(text)
        canvas = np.zeros((self.h, self.w), np.float32)
        dh = self.digit_h
        for i, (c, x) in enumerate(zip(text, xs)):
            if c == ':':
                self._stamp(canvas, c, x, 0.0, 1.0 + 0.10 * math.exp(-age / 3.0))
                continue
            if c != before[i] and age < 8:
                # the old digit leaves upward and fades like phosphor; the new one settles in from below
                if age < 5:
                    self._stamp(canvas, before[i], x, -0.06 * dh * _ease_out(age / 4.0),
                                0.45 * math.exp(-(age + 1) / 1.2))
                self._stamp(canvas, c, x, 0.07 * dh * (1 - _ease_out(age / 4.0)),
                            min(1.0, 0.35 + 0.65 * _ease_out((age + 1) / 2.0)) * (1 + 0.30 * math.exp(-age / 2.2)))
            else:
                self._stamp(canvas, c, x, 0.0, 1.0)
        return canvas

    def render(self, frame):
        """The signal itself: black, the digits, their soft glow (linear light)."""
        cov = self.coverage(frame)
        glow = cv2.GaussianBlur(cov, (0, 0), self.digit_h * 0.06) * 0.35 \
            + cv2.GaussianBlur(cov, (0, 0), self.digit_h * 0.22) * 0.16
        lum = 0.9 * np.minimum(cov, 1.2) + glow
        return lum[..., None] * self.COLOR[None, None, :]


if __name__ == '__main__':
    cd = Countdown()
    print('total seconds', cd.total, 'start', cd.start, 'origin frame', cd.origin)
    for f in (cd.origin - 1, cd.origin, cd.origin + 29, cd.origin + 30, cd.origin + 59, cd.origin + 60, 504):
        print(f, cd.text(f), cd.last_tick(f))
