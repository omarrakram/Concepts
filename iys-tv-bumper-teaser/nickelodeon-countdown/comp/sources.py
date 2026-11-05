"""The supplied clip, prepared as the TV signal (4:3, 1440x1080, sRGB 8-bit), frame for frame:

  cartoon  the Fairly OddParents scene, all 226 frames: the 4:3 picture cut out of the file's pillarbox (no stretch)

The Nickelodeon ident that followed it is no longer used: the card (comp/card.py) plays in its slot.

  python comp/sources.py            -> build/content/cartoon.npy, build/content/check-sources.png
"""
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import BUILD, RASTER_H, RASTER_W, load_json, verify_source  # noqa: E402

CONTENT = os.path.join(BUILD, 'content')


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
    # a check image: the cartoon's wish and its last frame
    sheet = np.concatenate([car[150], car[225]], axis=1)
    cv2.imwrite(os.path.join(CONTENT, 'check-sources.png'), cv2.cvtColor(cv2.resize(sheet, None, fx=0.5, fy=0.5,
                interpolation=cv2.INTER_AREA), cv2.COLOR_RGB2BGR))
