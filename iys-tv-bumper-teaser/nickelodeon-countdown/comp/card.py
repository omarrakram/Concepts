"""The card the set plays where the Nickelodeon ident used to be: the IN YOUR SHOE logo, white on black. It is drawn at
the CRT raster's size (1440x1080, linear light) and shown through the same television as everything else. The glitch
then freezes and tears its last two frames (comp/glitch.py).

  the logo  lands on the card's first frame, settling from slightly larger in a few frames (the sting sounds with
            it), then holds, with a slow push in, until the glitch interrupts the card

The logo is the supplied file (config/timeline.json -> card.logo, its hash checked), used as it is: its own alpha is
the coverage, and nothing is redrawn or retyped. It spans the same width as the countdown that follows.

  python comp/card.py        -> build/card/card-*.png (the raster at a few frames, before the TV's treatment)
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import BUILD, RASTER_H, RASTER_W, load_json, srgb_to_linear, verify_source  # noqa: E402

WHITE = float(srgb_to_linear(239 / 255))   # the logo's white: the level the card's white had (linear about 0.863)
BLACK = 0.0                                # the screen: broadcast black
SS = 2                                     # the logo is prepared at twice the size it is shown at, then placed subpixel
PUSH = 0.035                               # the slow push in over the card (scale gained by its last frame)
LAND = 5                                   # frames the logo takes to settle
LAND_SCALE = 0.09                          # how much larger the logo is on its first frame


def _ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


class Logo:
    """The supplied logo as a coverage mask, at SS times the size it is shown at, and its ink box in mask pixels."""

    def __init__(self, entry, width_px):
        src = verify_source({'source': entry['file'], 'sha256': entry['sha256']})
        a = np.asarray(Image.open(src).convert('RGBA'))[..., 3].astype(np.float32) / 255.0
        ys, xs = np.where(a > 0.5)                       # the ink: where the letters are more than half covered
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        pad = 8
        ox, oy = max(0, x0 - pad), max(0, y0 - pad)
        crop = a[oy:y1 + pad, ox:x1 + pad]
        k = width_px * SS / (x1 - x0)                    # file px -> mask px
        size = (int(round(crop.shape[1] * k)), int(round(crop.shape[0] * k)))
        kx, ky = size[0] / crop.shape[1], size[1] / crop.shape[0]
        m = cv2.resize(crop, size, interpolation=cv2.INTER_LANCZOS4 if k > 1 else cv2.INTER_AREA)
        # a touch of blur at the preparation size, so placing it at half size never aliases
        self.mask = np.clip(cv2.GaussianBlur(m, (0, 0), 0.5), 0, 1)
        self.box = ((x0 - ox) * kx, (y0 - oy) * ky, (x1 - ox) * kx, (y1 - oy) * ky)
        self.width = (self.box[2] - self.box[0]) / SS    # as shown, in raster px
        self.height = (self.box[3] - self.box[1]) / SS
        self.file_ink = (int(x1 - x0), int(y1 - y0))


class Card:
    def __init__(self, tl=None):
        tl = tl or load_json('config', 'timeline.json')
        c = tl['card']
        self.n = c['frames']
        self.logo = Logo(c['logo'], c['logo']['width'] * RASTER_W)
        self.cache = {}

    def coverage(self, c):
        """The logo's coverage at card frame c (HxW float32, 0 to 1), centred on the raster."""
        lg = self.logo
        scale = 1 + LAND_SCALE * (1 - _ease_out(c / LAND))
        alpha = min(1.0, 0.7 + 0.3 * c)
        push = 1 + PUSH * c / max(self.n - 1, 1)
        s = scale * push / SS                              # mask px -> raster px
        bx = (lg.box[0] + lg.box[2]) / 2                   # the ink box's centre, in mask px
        by = (lg.box[1] + lg.box[3]) / 2
        M = np.float32([[s, 0, RASTER_W / 2 - s * bx], [0, s, RASTER_H / 2 - s * by]])
        cov = alpha * cv2.warpAffine(lg.mask, M, (RASTER_W, RASTER_H), flags=cv2.INTER_LINEAR,
                                     borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        return np.minimum(cov, 1.0)

    def render(self, c):
        """The signal at card frame c: linear float32 HxWx3."""
        lum = BLACK + (WHITE - BLACK) * self.coverage(c)
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
    for f in os.listdir(d):
        if f.startswith('card-') and f.endswith('.png'):
            os.remove(os.path.join(d, f))
    lg = card.logo
    print('logo: ink %dx%d px in the file -> %.0fx%.0f px on the 1440x1080 signal' % (*lg.file_ink, lg.width, lg.height))
    for c in (0, 1, 2, 5, 18, 60, card.n - 2, card.n - 1):
        cv2.imwrite(os.path.join(d, f'card-{c:02d}.png'), encode8(card.render(c))[..., ::-1])
    print('written', d)
