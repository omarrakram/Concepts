"""The film's sound, 48 kHz stereo, sample-accurate to the 30 fps picture (config/timeline.json).

  cartoon    the supplied clip's own audio (dialogue, the full wish), through a small TV speaker into the room, cut
             at the end of its last frame of the wands waving
  card       the IN YOUR SHOE logo card's sting (synthesized): a bright chord as it cuts in, a lighter chime 0.6 s
             later, a warm chord held under it; the same speaker and room, cut at the interruption frame
  glitch     the picture's stutter, heard: the card's own last two frames of sound, repeated as the picture repeats
             them; then static whose loudness follows the static on screen frame by frame; a pop at the signal loss
  countdown  a low lock-in thump as the signal locks; a tick exactly on each frame a digit changes (tick, tock);
             a low, restrained drone under it, still sounding when the film cuts

  python audio/mix.py        -> build/audio/mix.wav (before the encode's limiter), build/audio/cues.json
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


# the balance: the dialogue on top, the card a step under it (the level the ident had), the glitch under that,
# the countdown's ticks and drone quieter still, the drone well under the ticks
LEVELS = {'cartoon': -16.0, 'card': -17.0, 'glitch': -19.0, 'countdown': -19.0, 'drone': -26.0}
MASTER = -14.0     # the whole film, integrated (the true peak is then held under -1 dBTP by a limiter at the encode)
# The master gain is the delivered film's (809ece1, when the ident played in the card's slot: its mix measured
# -17.267 LUFS and was raised 3.267 dB to -14). It is kept fixed so the cartoon's sound stays sample for sample what
# was delivered; the card sits at the ident's level, so the film still measures about -14 LUFS (checked below).
MASTER_GAIN_DB = 3.2670574378720794


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


def card_sound(n_sec, chime_at, seed='card'):
    """The card's sound, as a channel's promo card would have it (synthesized, seeded): a bright bell chord over a
    soft low hit and a breath of sparkle as the card cuts in, a lighter two-note chime a moment later (chime_at,
    seconds), and a warm chord held under the card, still sounding when the glitch cuts it."""
    g = rng(seed)
    n = int(n_sec * SR)
    t = np.arange(n) / SR
    x = np.zeros((n, 2))

    def bell(f0, t0, amp, decay, pan):
        tt = t - t0
        on = tt >= 0
        u = tt[on]
        v = (np.sin(2 * np.pi * f0 * u) + 0.32 * np.sin(2 * np.pi * f0 * 2.0 * u) * np.exp(-u / (decay * 0.45))
             + 0.16 * np.sin(2 * np.pi * f0 * 3.01 * u) * np.exp(-u / (decay * 0.25)))
        v *= np.exp(-u / decay) * (1 - np.exp(-u / 0.0015)) * amp
        x[on, 0] += v * (1 - pan)
        x[on, 1] += v * (1 + pan)

    # the sting: A major, high, over the held chord's root
    for f0, amp, pan in ((440.0, 0.30, 0.0), (880.0, 0.42, -0.15), (1108.73, 0.34, 0.15), (1318.51, 0.30, -0.05)):
        bell(f0, 0.0, amp, 0.85, pan)
    # the low hit: a short pitch drop, a little saturated so the small speaker still carries it
    pitch = 95 * (1 + 0.8 * np.exp(-t / 0.025))
    hit = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(pitch) / SR)) * np.exp(-t / 0.16) * (1 - np.exp(-t / 0.002))
    x += 0.55 * hit[:, None]
    # sparkle: a short bright breath of noise
    sp = spectral(g.standard_normal((n, 2)), chain(hp(5000, 2), lp(12000, 1))) * np.exp(-t / 0.09)[:, None]
    x += 0.10 * sp / (np.abs(sp).max() + 1e-12)
    # a moment later: a lighter chime
    for f0, amp, pan in ((1318.51, 0.26, 0.1), (1760.0, 0.20, -0.1)):
        bell(f0, chime_at, amp, 0.5, pan)
    # the held chord: soft, a little detuned, swelling gently under the card
    pad = np.zeros(n)
    for f0, amp in ((220.0, 1.0), (329.63, 0.8), (440.0, 0.7), (554.37, 0.55)):
        for det in (-0.0017, 0.0017):
            ph = g.random() * 2 * np.pi
            for k in range(1, 9):
                pad += amp / k ** 1.6 * np.sin(2 * np.pi * f0 * (1 + det) * k * t + ph * k)
    pad *= (1 - np.exp(-t / 0.08)) * (0.85 + 0.15 * np.clip(t / 3.0, 0, 1))
    x += 0.045 * np.stack([pad, pad], axis=1)
    pk = np.abs(x).max()
    return np.tanh(1.6 * x / pk) / np.tanh(1.6) * pk     # rounded peaks: the sting is full, never a spike


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

    # --- the cartoon: its own audio, up to the end of its last frame of the wands waving -------------------------
    c = tl['cartoon']
    src = verify_source(c)
    # the clip's whole sound is filtered and levelled as one piece, exactly as in the earlier deliveries, and only
    # then cut at audioOut: every sample it keeps is the one delivered before
    a = decode(src, c['audioIn'], c['audioWhole'] - c['audioIn'])
    a, ga = to_lufs(room(tv_speaker(a)), LEVELS['cartoon'])
    a = a[:int(round((c['audioOut'] - c['audioIn']) * SR))]
    place(bus, fade(a, 48, 96), at(c['first'], fps))
    cues.append({'t': c['first'] / fps, 'cue': 'cartoon audio (supplied clip, 0.000-%.3f s: cut at the end of its last frame of the wands waving)' % (len(a) / SR)})

    # --- the card: its sting and held chord, up to the interruption ------------------------------------------
    cc = tl['card']
    chime = cc['chimeAt'] / fps
    raw_card = room(tv_speaker(card_sound(cc['audioOut'] + 0.1, chime)))   # a frame or two past the cut, for the stutter
    b, gb = to_lufs(raw_card[:int(round(cc['audioOut'] * SR))], LEVELS['card'])
    place(bus, fade(b, 64, 48), at(cc['first'], fps))
    cues.append({'t': cc['first'] / fps, 'cue': 'card: the sting (bell chord, low hit) as the IN YOUR SHOE logo cuts in; a warm chord held under the card'})
    cues.append({'t': (cc['first'] + cc['chimeAt']) / fps, 'cue': 'card: the sting\'s lighter chime'})
    cues.append({'t': (cc['first'] + cc['frames']) / fps, 'cue': 'card: its sound cut at the interruption (0.000-%.3f s)' % cc['audioOut']})

    # --- the glitch ---------------------------------------------------------------------------------------------
    gfirst, gn = tl['glitch']['first'], tl['glitch']['frames']
    per = SR // fps
    # the stutter: the picture holds the card's last frame, jumps back to the one before, holds the last again -> so
    # does the sound
    raw_card = raw_card * 10 ** (gb / 20)            # the same level as the card

    def grain(src_frame):
        s0 = src_frame * per
        return fade(raw_card[s0:s0 + per].copy(), 24, 24)
    last = cc['interruptFrame']
    for gi, sf, lvl in ((0, last, 0.9), (1, last - 1, 0.8), (2, last, 0.55), (3, last, 0.3)):
        place(bus, grain(sf) * lvl, at(gfirst + gi, fps))
    cues.append({'t': gfirst / fps, 'cue': 'glitch: the card\'s last two frames of sound repeat with the frozen/stuttering picture'})
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
    cues.append({'t': origin / fps, 'cue': 'countdown: the signal locks (low thump); its clock starts (%s)' % cd['start']})
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
    levels = {'cartoon': round(loudness(a), 1), 'card': round(loudness(b), 1), 'glitch': round(loudness(gbus), 1),
              'countdown (ticks, thump)': round(loudness(cbus), 1), 'drone': round(loudness(d), 1)}
    print('levels (LUFS)', levels)
    # the last 8 ms only: the film cuts while everything is still sounding, without a click
    k = int(0.008 * SR)
    bus[-k:] *= np.linspace(1, 0, k)[:, None]

    whole = loudness(bus)
    bus *= 10 ** (MASTER_GAIN_DB / 20)
    film = loudness(bus)
    print('mix %.2f LUFS + %.3f dB (the delivered master gain) -> %.2f LUFS' % (whole, MASTER_GAIN_DB, film))
    if abs(film - MASTER) > 0.5:
        raise SystemExit('the film is %.2f LUFS, more than 0.5 LU off %.1f: the balance has changed' % (film, MASTER))
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
                   'masterGainDB': MASTER_GAIN_DB, 'countdown': {'format': cd['format'], 'start': cd['start']}}, f, indent=1)
    print('mix', total, 'samples', total / SR, 's; peak', round(20 * np.log10(peak), 2), 'dBFS')


if __name__ == '__main__':
    main()
