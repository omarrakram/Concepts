"""The card the set plays where the Nickelodeon ident used to be: SINGLE’S DAY, then OFFER ENDS IN, black on the
broadcast's white. It is drawn at the CRT raster's size (1440x1080, linear light) and shown through the same
television as everything else. The glitch then freezes and tears its last two frames (comp/glitch.py).

  line 1  lands on the card's first frame, settling from slightly larger in a few frames (the sting sounds with it)
  line 2  lands the same way at `secondLineAt` (card frames), smaller and letter-spaced
  both    then hold, with a slow push in, until the glitch interrupts the card

The words are config/timeline.json -> card.lines. Only those characters are drawn.
The white is the ident's own backdrop level (sRGB 239), so the set lights the room as before.

  python comp/card.py        -> build/card/card-*.png (the raster at a few frames, before the TV's treatment)
"""
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import BUILD, RASTER_H, RASTER_W, load_json, srgb_to_linear  # noqa: E402

FONT = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'   # the countdown's typeface
PAPER = float(srgb_to_linear(239 / 255))      # the white: the ident's backdrop level, linear about 0.863
INK = float(srgb_to_linear(14 / 255))         # the type: near black
SS = 2                                        # each line is drawn at twice the raster's size, then placed subpixel

LINE1_WIDTH = 0.80     # line 1 spans the same width as the countdown that follows (title safe)
LINE2_SIZE = 0.42      # line 2's type size, relative to line 1's
LINE2_TRACK = 0.16     # line 2's extra letter spacing, in em
GAP = 0.62             # between line 1's baseline and line 2's cap height, in line 1's cap heights
PUSH = 0.035           # the slow push in over the card (scale gained by its last frame)
LAND = 5               # frames a line takes to settle
LAND_SCALE = (0.09, 0.06)   # how much larger each line is on its first frame


def _ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


class Line:
    """One line of type: its coverage mask at SS times the raster's size, and its cap box (where the ink is)."""

    def __init__(self, text, size, track=0.0):
        self.text = text
        font = ImageFont.truetype(FONT, int(round(size * SS)))
        if track:
            # letter-spaced: set character by character (the spacing then matters more than kerning)
            adv = [font.getlength(c) for c in text]
            width = sum(adv) + track * size * SS * (len(text) - 1)
            pen = [sum(adv[:i]) + track * size * SS * i for i in range(len(text))]
        else:
            width, pen = font.getlength(text), None
        pad = int(size * SS * 0.3)
        asc, desc = font.getmetrics()
        im = Image.new('L', (int(math.ceil(width)) + 2 * pad, asc + desc + 2 * pad), 0)
        d = ImageDraw.Draw(im)
        if pen is None:
            d.text((pad, pad), text, font=font, fill=255)
        else:
            for c, x in zip(text, pen):
                d.text((pad + x, pad), c, font=font, fill=255)
        m = np.asarray(im, np.float32) / 255.0
        # a touch of blur at the drawing size, so placing it at half size never aliases
        self.mask = cv2.GaussianBlur(m, (0, 0), 0.5)
        ys, xs = np.where(m > 0.5)
        # the cap box: the ink's extent (caps only: from the cap height to the baseline)
        cap_top = font.getbbox('H')[1] + pad
        base = font.getbbox('H')[3] + pad
        self.box = (xs.min() / SS, cap_top / SS, (xs.max() + 1) / SS, base / SS)    # in raster px, mask origin 0,0
        self.cap_h = (base - cap_top) / SS
        self.width = self.box[2] - self.box[0]


class Card:
    def __init__(self, tl=None):
        tl = tl or load_json('config', 'timeline.json')
        c = tl['card']
        self.lines_text = c['lines']
        self.n = c['frames']
        self.second_at = c['secondLineAt']
        probe = Line(self.lines_text[0], 200)
        size1 = 200 * LINE1_WIDTH * RASTER_W / probe.width
        self.l1 = Line(self.lines_text[0], size1)
        self.l2 = Line(self.lines_text[1], size1 * LINE2_SIZE, LINE2_TRACK)
        # the block (line 1's cap height to line 2's baseline) is centred on the raster
        gap = GAP * self.l1.cap_h
        block = self.l1.cap_h + gap + self.l2.cap_h
        top = RASTER_H / 2 - block / 2
        self.cx = RASTER_W / 2
        # where each line's cap box centre sits at rest (raster px)
        self.rest = [(self.cx, top + self.l1.cap_h / 2), (self.cx, top + self.l1.cap_h + gap + self.l2.cap_h / 2)]
        self.cache = {}

    def lines(self, c):
        """(line, its landing scale, its opacity) for each line on screen at card frame c."""
        out = []
        for i, (ln, at) in enumerate(((self.l1, 0), (self.l2, self.second_at))):
            if c < at:
                continue
            k = c - at
            scale = 1 + LAND_SCALE[i] * (1 - _ease_out(k / LAND))
            alpha = min(1.0, 0.7 + 0.3 * k)
            out.append((i, ln, scale, alpha))
        return out

    def coverage(self, c):
        """The type's coverage at card frame c (HxW float32, 0 to 1)."""
        cov = np.zeros((RASTER_H, RASTER_W), np.float32)
        push = 1 + PUSH * c / max(self.n - 1, 1)
        for i, ln, scale, alpha in self.lines(c):
            # the line's cap-box centre: its rest position, pushed away from the raster's centre with the push
            rx, ry = self.rest[i]
            tx = RASTER_W / 2 + (rx - RASTER_W / 2) * push
            ty = RASTER_H / 2 + (ry - RASTER_H / 2) * push
            s = scale * push / SS                       # mask px -> raster px
            bx = (ln.box[0] + ln.box[2]) / 2 * SS       # the cap box centre, in mask px
            by = (ln.box[1] + ln.box[3]) / 2 * SS
            M = np.float32([[s, 0, tx - s * bx], [0, s, ty - s * by]])
            cov += alpha * cv2.warpAffine(ln.mask, M, (RASTER_W, RASTER_H), flags=cv2.INTER_LINEAR,
                                          borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        return np.minimum(cov, 1.0)

    def render(self, c):
        """The signal at card frame c: linear float32 HxWx3."""
        cov = self.coverage(c)
        lum = PAPER - (PAPER - INK) * cov
        return np.repeat(lum[..., None], 3, axis=2).astype(np.float32)

    def held(self, c):
        """A frame the glitch holds (its last two): rendered once, kept."""
        if c not in self.cache:
            self.cache[c] = self.render(c)
        return self.cache[c]


if __name__ == '__main__':
    from common import encode8
    card = Card()
    d = os.path.join(BUILD, 'card')
    os.makedirs(d, exist_ok=True)
    print('line 1', card.l1.text, 'width', round(card.l1.width), 'cap', round(card.l1.cap_h))
    print('line 2', card.l2.text, 'width', round(card.l2.width), 'cap', round(card.l2.cap_h))
    for c in (0, 1, 2, 5, 17, 18, 19, 23, 60, 94, 95):
        cv2.imwrite(os.path.join(d, f'card-{c:02d}.png'), encode8(card.render(c))[..., ::-1])
    print('written', d)
