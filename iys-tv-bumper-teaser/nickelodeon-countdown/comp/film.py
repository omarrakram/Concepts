"""The film, frame by frame: the photo (exactly as supplied), the camera's push-in, and inside the screen glass the
television's signal: the cartoon, the card, the glitch, the countdown. In linear light; written to ffmpeg.

  python comp/film.py --format 9x16                       -> build/film-9x16.mp4 (picture only, H.264 CRF 17), build/film-9x16.json
  python comp/film.py --format 4x5
  python comp/film.py --format 9x16 --stills 0,150,321,330,504 --no-video   -> build/stills-9x16/*.png
"""
import argparse
import json
import math
import os
import subprocess
import sys
import time

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import crt  # noqa: E402
import glitch  # noqa: E402
import sources  # noqa: E402
from card import Card  # noqa: E402
from common import BUILD, RASTER_H, RASTER_W, decode8, encode8, load_json, rng  # noqa: E402
from countdown import Countdown, CountdownPicture  # noqa: E402
from screen import Camera, Plate  # noqa: E402

FORMATS = {'9x16': (1080, 1920), '4x5': (1080, 1350)}
WHITE = np.array([0.97, 1.0, 1.03], np.float32)   # the set's white: a shade cooler than the room's lamp light
GRAIN = 0.016                                      # the camera's sensor grain, over everything (photo and screen)
GRAIN_BANK = 8
COUNTDOWN_SNOW = 0.035                             # the same snow the glitch ends on, very faint


def shoulder(x, knee=0.72):
    """Roll highlights off softly instead of clipping them (the screen and its glow only ever exceed the knee)."""
    over = np.maximum(x - knee, 0)
    return np.where(x > knee, knee + (1 - knee) * (1 - np.exp(-over / (1 - knee))), x)


class Film:
    def __init__(self, fmt):
        self.fmt = fmt
        self.W, self.H = FORMATS[fmt]
        self.tl = load_json('config', 'timeline.json')
        self.fps = self.tl['fps']
        self.n = self.tl['frames']
        self.plate = Plate()
        self.cam = Camera(self.plate, fmt, self.W, self.H, self.fps)
        self.cd = Countdown()
        self.cdpic = CountdownPicture(countdown=self.cd)
        self.cartoon = sources.load('cartoon')
        self.card = Card(self.tl)
        self.light = self.plate.cfg['light']
        g = rng('grain-bank', self.W, self.H)
        self.grain = [cv2.GaussianBlur(g.standard_normal((self.H, self.W)).astype(np.float32), (0, 0), 0.6) * 1.9
                      for _ in range(GRAIN_BANK)]
        # the visible part of the signal (for the colour of the set's light): what the glass shows of the raster
        p = self.plate
        self.vis_rows = (int((0.5 - 0.5 * p.kv) * RASTER_H), int((0.5 + 0.5 * p.kv) * RASTER_H))
        self.vis_cols = (int(p.ox / (1 + 2 * p.ox) * RASTER_W), int((1 + p.ox) / (1 + 2 * p.ox) * RASTER_W))

    # --- what the set is showing ----------------------------------------------------------------------------
    def segment(self, f):
        tl = self.tl
        if f < tl['card']['first']:
            return 'cartoon'
        if f < tl['glitch']['first']:
            return 'card'
        if f < tl['glitch']['first'] + tl['glitch']['frames']:
            return 'glitch'
        return 'countdown'

    def signal(self, f):
        tl, seg = self.tl, self.segment(f)
        if seg == 'cartoon':
            raw = decode8(np.asarray(self.cartoon[f - tl['cartoon']['first'] + tl['cartoon']['sourceIn']]))
        elif seg == 'card':
            raw = self.card.render(f - tl['card']['first'])
        elif seg == 'glitch':
            gi = f - tl['glitch']['first']
            last = tl['card']['interruptFrame']
            held = {last - 1: self.card.held(last - 1), last: self.card.held(last)}
            raw = glitch.frame(gi, f, held, self.cdpic.render(f))
        else:
            # the hijacking signal: the countdown, and the faint snow of a weak broadcast in its black
            raw = self.cdpic.render(f) + glitch.static(f, COUNTDOWN_SNOW)
        return crt.signal(raw, f), seg

    # --- the frame ------------------------------------------------------------------------------------------
    def compose(self, f, sig):
        p, L, W, H = self.plate, self.light, self.W, self.H
        M, s = self.cam.matrix(f)
        photo = np.maximum(cv2.warpAffine(p.lin, M, (W, H), flags=cv2.INTER_LANCZOS4,
                                          borderMode=cv2.BORDER_REFLECT), 0)
        # the glass's region in the frame, with room around it for its light
        bx0, by0, bx1, by1 = p.bbox
        corners = np.array([[bx0, by0], [bx1, by0], [bx0, by1], [bx1, by1]], np.float32)
        o = corners @ M[:, :2].T + M[:, 2]
        margin = int(math.ceil(70 * s))
        X0, X1 = max(0, int(o[:, 0].min()) - margin), min(W, int(o[:, 0].max()) + margin + 1)
        Y0, Y1 = max(0, int(o[:, 1].min()) - margin), min(H, int(o[:, 1].max()) + margin + 1)
        gx, gy = np.meshgrid(np.arange(X0, X1, dtype=np.float32), np.arange(Y0, Y1, dtype=np.float32))
        Mi = cv2.invertAffineTransform(M)
        px = Mi[0, 0] * gx + Mi[0, 2]
        py = Mi[1, 1] * gy + Mi[1, 2]
        u, v = p.uv(px, py)
        sd = p.signed_distance(px, py)
        mask = np.clip(0.5 + sd * s / max(1.0, p.soft * s), 0, 1).astype(np.float32)
        # the signal on the glass: prefiltered to the size it is seen at, then mapped onto the curved glass
        rx, ry = p.picture_xy(u, v)
        pic_w_out = p.pic_w * s
        k = pic_w_out / RASTER_W
        if k < 0.999:
            size = (max(1, round(RASTER_W * k)), max(1, round(RASTER_H * k)))
            src = cv2.resize(sig, size, interpolation=cv2.INTER_AREA)
            sx = (rx + 0.5) * (size[0] / RASTER_W) - 0.5
            sy = (ry + 0.5) * (size[1] / RASTER_H) - 0.5
        else:
            src, sx, sy = sig, rx, ry
        pic = cv2.remap(src, sx.astype(np.float32), sy.astype(np.float32), cv2.INTER_LINEAR,
                        borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        pic = crt.structure(pic, rx, ry, pic_w_out)
        pic = pic * crt.corner_falloff(u, v)[..., None]
        E = pic * (L['emission'] * WHITE)
        Em = E * mask[..., None]
        # glow: the phosphor's halation and the lens's bloom, physical sizes (they grow as the camera nears)
        g1 = cv2.GaussianBlur(Em, (0, 0), 2.0 * s)
        q = 4
        small = cv2.resize(Em, (max(1, (X1 - X0) // q), max(1, (Y1 - Y0) // q)), interpolation=cv2.INTER_AREA)
        g2 = cv2.resize(cv2.GaussianBlur(small, (0, 0), 18.0 * s / q), (X1 - X0, Y1 - Y0),
                        interpolation=cv2.INTER_LINEAR)
        bloom = L['bloom'] * (1.4 * g1 + 1.0 * g2)
        # the black lip of the bezel around the glass catches the picture's light
        lip_w = np.where(sd < 0, np.exp(sd / 7.0) * np.clip((sd + 30) / 12, 0, 1), 0).astype(np.float32)
        num = cv2.GaussianBlur(Em, (0, 0), 9 * s)
        den = cv2.GaussianBlur(mask, (0, 0), 9 * s)
        lip = (L['lip'] * 0.12) * lip_w[..., None] * (num / np.maximum(den, 0.05)[..., None])
        # the room catches it too: the chest's top, the things beside the set, the plant, the armchair
        r0, r1 = self.vis_rows
        c0, c1 = self.vis_cols
        mid = (c0 + c1) // 2
        left = sig[r0:r1, c0:mid].mean(axis=(0, 1)) * L['emission'] * WHITE
        right = sig[r0:r1, mid:c1].mean(axis=(0, 1)) * L['emission'] * WHITE
        cx, cy = p.centre
        xl = (p.left(cy) * M[0, 0] + M[0, 2])
        xr = (p.right(cy) * M[0, 0] + M[0, 2])
        t = np.clip((np.arange(W, dtype=np.float32) - xl) / max(xr - xl, 1), 0, 1)[None, :, None]
        colour = left[None, None, :] * (1 - t) + right[None, None, :] * t
        spill_w = cv2.warpAffine(p.spill_map, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        out = photo + photo * spill_w[..., None] * colour * L['spill']
        # the glass: its reflection of the room (kept, but the lit picture now outshines it), plus the picture
        reg = out[Y0:Y1, X0:X1]
        m3 = mask[..., None]
        reg = reg * (1 - m3 * (1 - L['reflection'])) + Em + bloom + lip * (1 - m3)
        out[Y0:Y1, X0:X1] = shoulder(reg)
        # the camera's grain, over the whole frame
        g = rng('grain', f)
        gr = np.roll(self.grain[f % GRAIN_BANK], (int(g.integers(0, H)), int(g.integers(0, W))), axis=(0, 1))
        out = out + (GRAIN * gr)[..., None] * np.sqrt(np.maximum(out, 0) + 0.003)
        return encode8(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--format', default='9x16', choices=FORMATS)
    ap.add_argument('--stills', default='')
    ap.add_argument('--no-video', action='store_true')
    ap.add_argument('--first', type=int, default=0)
    ap.add_argument('--last', type=int, default=-1)
    a = ap.parse_args()
    film = Film(a.format)
    W, H = film.W, film.H
    stills = [int(x) for x in a.stills.split(',') if x != '']
    sdir = os.path.join(BUILD, f'stills-{a.format}')
    os.makedirs(sdir, exist_ok=True)
    frames = range(film.n) if not a.no_video else sorted(stills)
    if a.last >= 0 and not a.no_video:
        frames = range(a.first, a.last + 1)
    proc = None
    video = os.path.join(BUILD, f'film-{a.format}.mp4')
    if not a.no_video:
        cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
               '-r', str(film.fps), '-i', '-',
               '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,setsar=1',
               '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-tune', 'film', '-pix_fmt', 'yuv420p',
               '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
               '-movflags', '+faststart', video]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    log = []
    t0 = time.time()
    for f in frames:
        sig, seg = film.signal(f)
        img = film.compose(f, sig)
        if proc:
            proc.stdin.write(img.tobytes())
        if f in stills:
            cv2.imwrite(os.path.join(sdir, f'frame-{f:03d}.png'), cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        cx, cy, w, h = film.cam.window(f)
        log.append({'frame': f, 'segment': seg,
                    'countdown': film.cd.text(f) if seg == 'countdown' or (seg == 'glitch' and f >= film.tl['countdown']['visibleFrom']) else None,
                    'window': [round(cx, 2), round(cy, 2), round(w, 2), round(h, 2)]})
        if f % 30 == 0:
            el = time.time() - t0
            print(f'{a.format} frame {f} {seg} {el:.0f}s', flush=True)
    if proc:
        proc.stdin.close()
        if proc.wait() != 0:
            raise SystemExit('ffmpeg failed')
        with open(os.path.join(BUILD, f'film-{a.format}.json'), 'w') as fh:
            json.dump(log, fh, indent=0)
    print('done', a.format, f'{time.time() - t0:.0f}s')


if __name__ == '__main__':
    main()
