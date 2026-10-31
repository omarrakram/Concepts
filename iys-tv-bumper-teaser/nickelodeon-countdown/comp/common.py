"""Paths, configuration and colour helpers shared by the compositor."""
import hashlib
import json
import os

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, 'build')
OUT = os.path.join(ROOT, 'out')
RASTER_W, RASTER_H = 1440, 1080          # the TV signal: 4:3, square pixels


def path(*p):
    return os.path.join(ROOT, *p)


def load_json(*p):
    with open(path(*p)) as f:
        return json.load(f)


def sha256(file):
    h = hashlib.sha256()
    with open(file, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def verify_source(entry):
    """The supplied clip must be the exact file recorded in config/timeline.json."""
    f = path(entry['source'])
    if not os.path.exists(f):
        raise SystemExit(f'missing source: {entry["source"]} (see sources/README.md); nothing is substituted')
    got = sha256(f)
    if got != entry['sha256']:
        raise SystemExit(f'{entry["source"]} is not the supplied file (sha256 {got})')
    return f


def srgb_to_linear(x):
    x = np.asarray(x, np.float32)
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4).astype(np.float32)


def linear_to_srgb(x):
    x = np.clip(np.asarray(x, np.float32), 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055).astype(np.float32)


# a 16384-entry lookup is plenty for 8-bit output and much faster than the power function per pixel
_LUT_IN = np.linspace(0, 1, 16384, dtype=np.float32)
_LUT_OUT = np.round(linear_to_srgb(_LUT_IN) * 255).astype(np.uint8)
_DEC = srgb_to_linear(np.arange(256, dtype=np.float32) / 255)


def encode8(lin):
    """linear float -> sRGB uint8 (via LUT, rounding to nearest)."""
    idx = np.clip(lin * 16383 + 0.5, 0, 16383).astype(np.int32)
    return _LUT_OUT[idx]


def decode8(img8):
    """sRGB uint8 -> linear float32."""
    return _DEC[img8]


def rng(*key):
    """A deterministic random generator for one named purpose and frame."""
    h = hashlib.sha256(repr(key).encode()).digest()
    return np.random.default_rng(int.from_bytes(h[:8], 'little'))
