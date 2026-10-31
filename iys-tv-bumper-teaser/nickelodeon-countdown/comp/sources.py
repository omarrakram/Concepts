"""The two supplied clips, prepared as the TV signal (4:3, 1440x1080, sRGB 8-bit), frame for frame:

  cartoon  the Fairly OddParents scene, all 226 frames: the 4:3 picture cut out of the file's pillarbox (no stretch)
  ident    the Nickelodeon ident, source frames 0-95 (95 = the interruption: 'nickelode...'), with two cleanups:
           * the TikTok watermark the clip was recorded with (logo + username, bottom left, over plain backdrop) is
             replaced by the same backdrop from the clip's own frames 150-163, where the watermark has moved to the
             other side; its brightness follows each frame. The ident's animation and lettering are not touched.
           * mild compression cleanup (light non-local-means), then a Lanczos upscale: no AI upscaling, no new frames.

  python comp/sources.py            -> build/content/cartoon.npy, build/content/ident.npy, build/content/check-*.png
"""
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import BUILD, RASTER_H, RASTER_W, load_json, verify_source  # noqa: E402

CONTENT = os.path.join(BUILD, 'content')

# the watermark, in the ident's own pixels (464x352): logo + 'TikTok' at y 215-233, the username at y 240-247
WATERMARK = {'x0': 2, 'x1': 72, 'y0': 209, 'y1': 251, 'feather': 4}
CLEAN_FRAMES = (150, 164)        # the watermark sits at the bottom right in these: the bottom left is bare backdrop
RING = [(slice(200, 206), slice(0, 92)), (slice(253, 259), slice(0, 92)), (slice(206, 253), slice(80, 92))]


def decode(src, vf, w, h):
    cmd = ['ffmpeg', '-v', 'error', '-i', src, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def scale_filter(matrix):
    return f'in_color_matrix={matrix}:in_range=tv:out_range=pc:flags=lanczos+accurate_rnd+full_chroma_int'


def cartoon(tl):
    c = tl['cartoon']
    src = verify_source(c)
    x, y, w, h = c['crop']
    vf = f'crop={w}:{h}:{x}:{y},scale={RASTER_W}:{RASTER_H}:{scale_filter(c["matrix"])}'
    frames = decode(src, vf, RASTER_W, RASTER_H)
    assert len(frames) >= c['sourceIn'] + c['frames'], len(frames)
    return frames[c['sourceIn']:c['sourceIn'] + c['frames']]


def watermark_mask(shape):
    m = np.zeros(shape[:2], np.float32)
    W = WATERMARK
    m[W['y0']:W['y1'], W['x0']:W['x1']] = 1
    k = 2 * W['feather'] + 1
    return cv2.blur(m, (k, k))[..., None]


def ident(tl):
    c = tl['ident']
    src = verify_source(c)
    full = decode(src, f'scale=464:352:{scale_filter(c["matrix"])}', 464, 352)
    clean = np.median(full[CLEAN_FRAMES[0]:CLEAN_FRAMES[1]].astype(np.float32), axis=0)
    mask = watermark_mask(full.shape[1:])
    ring_clean = np.concatenate([clean[r].reshape(-1, 3) for r in RING]).mean(axis=0)
    x, y, w, h = c['crop']
    out = []
    for i in range(c['sourceIn'], c['sourceIn'] + c['frames']):
        f = full[i].astype(np.float32)
        ring = np.concatenate([f[r].reshape(-1, 3) for r in RING]).mean(axis=0)
        patched = f * (1 - mask) + (clean + (ring - ring_clean)) * mask
        f8 = np.clip(np.round(patched), 0, 255).astype(np.uint8)
        f8 = cv2.fastNlMeansDenoisingColored(f8, None, 2.5, 2.5, 5, 15)
        f8 = f8[y:y + h, x:x + w]
        out.append(cv2.resize(f8, (RASTER_W, RASTER_H), interpolation=cv2.INTER_LANCZOS4))
    return np.stack(out), full


def save(name, frames):
    os.makedirs(CONTENT, exist_ok=True)
    p = os.path.join(CONTENT, f'{name}.npy')
    mm = np.lib.format.open_memmap(p, mode='w+', dtype=np.uint8, shape=frames.shape)
    mm[:] = frames
    mm.flush()
    return p


def load(name):
    return np.load(os.path.join(CONTENT, f'{name}.npy'), mmap_mode='r')


if __name__ == '__main__':
    tl = load_json('config', 'timeline.json')
    car = cartoon(tl)
    print('cartoon', car.shape, save('cartoon', car))
    idn, full = ident(tl)
    print('ident', idn.shape, save('ident', idn))
    # a check image: the interruption frame, before and after the cleanup, and the cartoon's wish
    a = cv2.resize(full[95, 2:350], (RASTER_W, RASTER_H), interpolation=cv2.INTER_LANCZOS4)
    sheet = np.concatenate([np.concatenate([a, idn[95]], axis=1),
                            np.concatenate([car[150], car[225]], axis=1)], axis=0)
    cv2.imwrite(os.path.join(CONTENT, 'check-sources.png'), cv2.cvtColor(cv2.resize(sheet, None, fx=0.5, fy=0.5,
                interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2BGR))
