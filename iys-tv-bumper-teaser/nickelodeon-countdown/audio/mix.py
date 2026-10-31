"""The film's sound, 48 kHz stereo, sample-accurate to the 30 fps picture (config/timeline.json).

  cartoon    the supplied clip's own audio (dialogue, the full wish), through a small TV speaker into the room
  ident      the supplied ident's own audio, from its start to the interruption frame, the same way
  glitch     the picture's stutter, heard: the ident's own last two frames of sound, repeated as the picture repeats
             them; then static whose loudness follows the static on screen frame by frame; a pop at the signal loss
  countdown  a low lock-in thump as the signal locks; a tick exactly on each frame a digit changes (tick, tock);
             a low, restrained drone under it, still sounding when the film cuts

  python audio/mix.py        -> build/audio/mix.wav (before loudness normalisation), build/audio/cues.json
All synthesis is seeded; the supplied audio is used as is (filtered, never replaced).
"""
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, 'comp'))
from common import load_json, rng, verify_source  # noqa: E402
import glitch  # noqa: E402

SR = 48000
OUT = os.path.join(ROOT, 'build', 'audio')


def at(frame, fps=30):
    """The sample a film frame starts on (exact: 48000 / 30 = 1600 samples a frame)."""
    return frame * SR // fps


def decode(src, start, dur):
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{start:.6f}', '-t', f'{dur:.6f}', '-i', src, '-vn',
           '-af', 'aresample=48000:resampler=soxr:precision=28', '-ac', '2', '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def spectral(x, response):
    """Zero-phase filtering in the frequency domain; response(freqs) -> gain."""
    n = len(x)
    nfft = 1 << int(np.ceil(np.log2(n + SR)))
    X = np.fft.rfft(x, n=nfft, axis=0)
    f = np.fft.rfftfreq(nfft, 1 / SR)
    y = np.fft.irfft(X * response(f)[:, None], n=nfft, axis=0)
    return y[:n]


def hp(fc, order=2):
    return lambda f: 1 / np.sqrt(1 + (fc / np.maximum(f, 1e-3)) ** (2 * order))


def lp(fc, order=2):
    return lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order))


def bell(fc, db, octaves):
    return lambda f: 10 ** (db / 20 * np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) / (octaves / 2)) ** 2))


def chain(*fs):
    def r(f):
        g = np.ones_like(f)
        for fn in fs:
            g = g * fn(f)
        return g
    return r


def tv_speaker(x):
    """A small CRT set's speaker: no deep bass, soft top, a little forward in the presence range, near-mono."""
    y = spectral(x, chain(hp(150, 2), lp(8000, 2), bell(2600, 2.5, 1.2), bell(320, 1.5, 1.0)))
    mid, side = (y[:, 0] + y[:, 1]) / 2, (y[:, 0] - y[:, 1]) / 2
    return np.stack([mid + 0.2 * side, mid - 0.2 * side], axis=1)


def room(x, wet=0.10):
    """The living room around the set: a few early reflections and a short tail (RT60 about 0.4 s)."""
    g = rng('room-ir')
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for ms, gain, pan in ((6.5, 0.55, -0.3), (11.0, 0.42, 0.4), (17.5, 0.33, -0.1), (24.0, 0.25, 0.25), (31.0, 0.18, -0.35)):
        k = int(ms / 1000 * SR)
        ir[k, 0] += gain * (1 - pan) / 2 * 2
        ir[k, 1] += gain * (1 + pan) / 2 * 2
    tail = g.standard_normal((n, 2)) * np.exp(-t / (0.4 / 6.91))[:, None] * 0.09
    tail[:int(0.012 * SR)] = 0
    ir += spectral(tail, chain(lp(5000, 1), hp(200, 1)))
    nfft = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, nfft, axis=0) * np.fft.rfft(ir, nfft, axis=0), nfft, axis=0)[:len(x)]
    return x * (1 - wet) + y * wet


def loudness(x):
    """Integrated loudness, ITU-R BS.1770 (K-weighting, 400 ms blocks, absolute and relative gates), in LUFS."""
    k = spectral(x, chain(hp(38, 2), lambda f: np.sqrt((1 + (f / 1681) ** 2 * 10 ** (4 / 10)) / (1 + (f / 1681) ** 2))))
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    if len(k) < blk:
        k = np.concatenate([k, np.zeros((blk - len(k), 2))])
    z = np.array([np.mean(k[i:i + blk] ** 2, axis=0).sum() for i in range(0, len(k) - blk + 1, hop)])
    lb = -0.691 + 10 * np.log10(np.maximum(z, 1e-12))
    z1 = z[lb > -70]
    rel = -0.691 + 10 * np.log10(z1.mean()) - 10
    z2 = z[(lb > -70) & (lb > rel)]
    return float(-0.691 + 10 * np.log10(z2.mean()))


def to_lufs(x, target):
    """Scale x so its integrated loudness is target (LUFS); returns the scaled signal and the gain in dB."""
    g = target - loudness(x)
    return x * 10 ** (g / 20), g


# the balance (before the whole film is normalised to -14 LUFS): the dialogue on top, the glitch a step under it,
# the countdown's ticks and drone quieter still, the drone well under the ticks
LEVELS = {'cartoon': -16.0, 'ident': -17.0, 'glitch': -19.0, 'countdown': -19.0, 'drone': -26.0}
MASTER = -14.0     # the whole film, integrated (the true peak is then held under -1 dBTP by a limiter at the encode)


def fade(x, a, b):
    """Short linear fades in (a samples) and out (b samples), so no cut ever clicks."""
    x = x.copy()
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None]
    if b:
        x[-b:] *= np.linspace(1, 0, b)[:, None]
    return x


def place(bus, x, start):
    end = min(len(bus), start + len(x))
    bus[start:end] += x[:end - start]


def noise_static(n, key, lo=250, hi=9000):
    g = rng('static-audio', key)
    w = g.standard_normal((n, 2))
    w = spectral(w, chain(hp(lo, 2), lp(hi, 2)))
    w /= np.sqrt(np.mean(w ** 2)) + 1e-12
    # crackle: sparse sharp clicks, as static has
    clicks = (g.random((n, 2)) > 0.9985) * g.standard_normal((n, 2)) * 6.0
    k = np.exp(-np.arange(int(0.002 * SR)) / (0.0004 * SR))
    clicks = np.stack([np.convolve(clicks[:, c], k)[:n] for c in range(2)], axis=1)
    return w * 0.8 + clicks * 0.6


def tick(pitch, seed, level=1.0):
    """One tick: a dry mechanical click with a short metallic ring and a little body."""
    g = rng('tick', seed)
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    click = g.standard_normal(n) * np.exp(-t / 0.0011)
    click = spectral(np.stack([click, click], 1), chain(hp(1800, 2), lp(12000, 1)))[:, 0]
    ring = np.sin(2 * np.pi * pitch * t) * np.exp(-t / 0.018) * 0.55 \
        + np.sin(2 * np.pi * pitch * 2.71 * t) * np.exp(-t / 0.009) * 0.18
    body = np.sin(2 * np.pi * 165 * t) * np.exp(-t / 0.035) * 0.45
    s = click * 0.9 + ring + body
    s = np.tanh(2.4 * s / np.abs(s).max()) / np.tanh(2.4) * level     # dense and woody, not a spike
    return np.stack([s, s], axis=1)


def thump(n_sec=0.7, f0=58):
    t = np.arange(int(n_sec * SR)) / SR
    pitch = f0 * (1 + 0.6 * np.exp(-t / 0.03))
    ph = 2 * np.pi * np.cumsum(pitch) / SR
    s = np.sin(ph) * np.exp(-t / 0.22) * (1 - np.exp(-t / 0.002))
    return np.stack([s, s], axis=1)


def drone(n, seed='drone'):
    """Low and restrained: two low partials beating slowly, a breath of filtered air, a faint high shimmer that
    grows a little; no melody, no horror stings."""
    g = rng(seed)
    t = np.arange(n) / SR
    low = (np.sin(2 * np.pi * 55.0 * t) + 0.8 * np.sin(2 * np.pi * 55.35 * t + 1.1)
           + 0.45 * np.sin(2 * np.pi * 82.41 * t + 0.4) + 0.25 * np.sin(2 * np.pi * 110.2 * t + 2.0)) * 0.22
    air = g.standard_normal((n, 2))
    air = spectral(air, chain(hp(280, 2), lp(1300, 2))) * 0.05
    air *= (0.75 + 0.25 * np.sin(2 * np.pi * 0.31 * t + 0.6))[:, None]
    grow = np.clip(t / (n / SR), 0, 1)
    shimmer = (np.sin(2 * np.pi * 1318.5 * t) * 0.5 + np.sin(2 * np.pi * 1975.5 * t + 0.7) * 0.35) \
        * 0.010 * (0.4 + 0.6 * grow) * (0.85 + 0.15 * np.sin(2 * np.pi * 4.1 * t))
    s = np.stack([low + shimmer * 0.9, low * 0.98 + shimmer * 1.1], axis=1) + air
    return s


def main():
    tl = load_json('config', 'timeline.json')
    cd = load_json('config', 'countdown.json')
    fps = tl['fps']
    total = at(tl['frames'], fps)
    bus = np.zeros((total, 2))
    cues = []
    os.makedirs(OUT, exist_ok=True)

    # --- the cartoon: its own audio, the whole scene ------------------------------------------------------
    c = tl['cartoon']
    src = verify_source(c)
    a = decode(src, c['audioIn'], c['audioOut'] - c['audioIn'])
    a, ga = to_lufs(room(tv_speaker(a)), LEVELS['cartoon'])
    place(bus, fade(a, 48, 96), at(c['first'], fps))
    cues.append({'t': c['first'] / fps, 'cue': 'cartoon audio (supplied clip, 0.000-%.3f s)' % (len(a) / SR)})

    # --- the ident: its own audio, up to the interruption -------------------------------------------------
    i = tl['ident']
    src = verify_source(i)
    b = decode(src, i['audioIn'], i['audioOut'] - i['audioIn'])
    b, gb = to_lufs(room(tv_speaker(b)), LEVELS['ident'])
    place(bus, fade(b, 64, 48), at(i['first'], fps))
    cues.append({'t': i['first'] / fps, 'cue': 'ident audio (supplied clip, %.3f-%.3f s), cut at the interruption' % (i['audioIn'], i['audioOut'])})

    # --- the glitch ---------------------------------------------------------------------------------------------
    gfirst, gn = tl['glitch']['first'], tl['glitch']['frames']
    per = SR // fps
    # the stutter: the picture holds frame 95, jumps back to 94, holds 95 again -> so does the sound
    raw_ident = room(tv_speaker(decode(src, 0, 3.3))) * 10 ** (gb / 20)   # the same level as the ident

    def grain(src_frame):
        s0 = src_frame * per
        return fade(raw_ident[s0:s0 + per].copy(), 24, 24)
    for gi, sf, lvl in ((0, 95, 0.9), (1, 94, 0.8), (2, 95, 0.55), (3, 95, 0.3)):
        place(bus, grain(sf) * lvl, at(gfirst + gi, fps))
    cues.append({'t': gfirst / fps, 'cue': 'glitch: the ident\'s last two frames of sound repeat with the frozen/stuttering picture'})
    # static: its level follows the picture's static amount frame by frame (smoothed over 4 ms)
    n = gn * per + per
    env = np.zeros(n)
    for gi, k in enumerate(glitch.KEYS):
        env[gi * per:(gi + 1) * per] = k['static']
    env[gn * per:] = glitch.KEYS[-1]['static']
    sm = int(0.004 * SR)
    env = np.convolve(env, np.ones(sm) / sm, mode='same')
    gbus = np.zeros((n + int(0.3 * SR), 2))
    st = noise_static(n, 'glitch') * env[:, None]
    place(gbus, room(tv_speaker(st), 0.08), 0)
    cues.append({'t': (gfirst + 2) / fps, 'cue': 'glitch: static rising with the on-screen static (frame-by-frame envelope)'})
    # the sync buzz on the frames with a bright sync bar, and the drop at the signal loss
    for gi, k in enumerate(glitch.KEYS):
        if k.get('extra') == 'sync':
            tt = np.arange(per) / SR
            buzz = np.sign(np.sin(2 * np.pi * 50 * tt)) * 0.18 * np.exp(-tt / 0.03)
            buzz = spectral(np.stack([buzz, buzz], 1), chain(hp(120, 1), lp(4000, 1)))
            place(gbus, fade(buzz, 8, 48) * 1.2, gi * per)
            cues.append({'t': (gfirst + gi) / fps, 'cue': 'glitch: sync buzz (bright sync bar on screen)'})
        if k.get('extra') == 'loss':
            pop = thump(0.25, 90) * 0.6
            place(gbus, pop, gi * per)
            cues.append({'t': (gfirst + gi) / fps, 'cue': 'glitch: signal loss pop (dark frame)'})

    gbus, gg = to_lufs(gbus, LEVELS['glitch'])
    gbus = np.tanh(gbus / 0.5) * 0.5          # crackle never pokes out: a soft ceiling at -6 dBFS
    place(bus, gbus, at(gfirst, fps))

    # --- the countdown ---------------------------------------------------------------------------------------------
    origin = tl['countdown']['clockOriginFrame']
    cbus = np.zeros((total - at(origin, fps), 2))
    place(cbus, thump(0.8, 52) * 0.5, 0)
    cues.append({'t': origin / fps, 'cue': 'countdown: the signal locks (low thump); its clock starts (03:00:00:00)'})
    dn = total - at(origin, fps)
    d, gd = to_lufs(drone(dn), LEVELS['drone'])
    d[:int(0.45 * SR)] *= np.linspace(0, 1, int(0.45 * SR))[:, None] ** 2
    cues.append({'t': origin / fps, 'cue': 'countdown: low drone in (0.45 s), sounding to the last sample'})
    # a tick on every frame where the digits change (exactly: every fps frames after the clock's origin)
    for j, f in enumerate(range(origin + fps, tl['frames'], fps)):
        tk = tick(2350 if j % 2 == 0 else 2050, j, 0.62)
        place(cbus, room(tv_speaker(tk) * 1.6, 0.12), at(f, fps) - at(origin, fps))
        cues.append({'t': f / fps, 'cue': f'countdown: tick (frame {f}, the seconds change)'})
    # the ticks and the thump are levelled together; the drone sits under them at its own level
    cbus, gc = to_lufs(cbus, LEVELS['countdown'])
    place(bus, cbus + d, at(origin, fps))
    levels = {'cartoon': round(loudness(a), 1), 'ident': round(loudness(b), 1), 'glitch': round(loudness(gbus), 1),
              'countdown (ticks, thump)': round(loudness(cbus), 1), 'drone': round(loudness(d), 1)}
    print('levels (LUFS)', levels)
    # the last 8 ms only: the film cuts while everything is still sounding, without a click
    k = int(0.008 * SR)
    bus[-k:] *= np.linspace(1, 0, k)[:, None]

    whole = loudness(bus)
    bus *= 10 ** ((MASTER - whole) / 20)
    peak = float(np.abs(bus).max())
    # 32-bit float WAV: nothing is clipped here; the encode's limiter catches the few peaks over -1 dBTP
    raw = bus.astype('<f4').tobytes()
    import struct
    with open(os.path.join(OUT, 'mix.wav'), 'wb') as w:
        w.write(b'RIFF' + struct.pack('<I', 36 + len(raw)) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 3, 2, SR, SR * 8, 8, 32)
                + b'data' + struct.pack('<I', len(raw)) + raw)
    levels['film (before the limiter)'] = round(loudness(bus), 1)
    with open(os.path.join(OUT, 'cues.json'), 'w') as f:
        json.dump({'sampleRate': SR, 'fps': fps, 'samples': total, 'cues': cues, 'levelsLUFS': levels,
                   'countdown': {'start': cd['start'], 'target': cd['target'], 'timezone': cd['timezone']}}, f, indent=1)
    print('mix', total, 'samples', total / SR, 's; peak', round(20 * np.log10(peak), 2), 'dBFS')


if __name__ == '__main__':
    main()
