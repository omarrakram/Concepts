/**
 * npm run audio → public/audio/mix.wav (48 kHz, 16-bit stereo, 15 s)
 *
 * The teaser's whole soundtrack, synthesised here from oscillators, noise,
 * filters and a reverb: original sounds only, no samples, no recordings, no
 * borrowed jingle. Deterministic (seeded noise): same code, same file.
 *
 * Its structure follows the ident's (docs/01-reference-breakdown.md: a whoosh,
 * a boing, a slide, quick bouncy pulses, a bright chord at the logo), but the
 * melodies, timbres and timing are this teaser's own. Every cue is placed on the
 * animation's frames (30 fps; see CUES at the bottom, and docs/02-storyboard.md).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 48000;
const FPS = 30;
const DUR = 15;
const N = SR * DUR;
const at = (frame) => frame / FPS;
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/audio/mix.wav');

// ---------------------------------------------------------------- utilities
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const TAU = Math.PI * 2;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** A stereo bus: two Float32Arrays. */
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const master = bus();
const tv = bus(); // the cartoon, heard through the set's small speaker
const verbSend = bus();

/** Add a mono signal (fn(t) for t in [0, len)) at time t0 to a bus, panned (-1..1), with a reverb send. */
function add(target, t0, len, fn, { gain = 1, pan = 0, send = 0 } = {}) {
  const s0 = Math.round(t0 * SR);
  const n = Math.round(len * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const k = s0 + i;
    if (k < 0 || k >= N) continue;
    const v = fn(i / SR, i);
    target.L[k] += v * gl;
    target.R[k] += v * gr;
    if (send) {
      verbSend.L[k] += v * gl * send;
      verbSend.R[k] += v * gr * send;
    }
  }
}

/** A state-variable filter that can sweep (cutoff fn of time). mode: lp | bp | hp */
function svf(mode, q = 0.7) {
  let low = 0, band = 0;
  return (x, cutoff) => {
    const f = 2 * Math.sin(Math.PI * clamp(cutoff, 20, SR / 6) / SR);
    low += f * band;
    const high = x - low - band / q;
    band += f * high;
    return mode === 'lp' ? low : mode === 'bp' ? band : high;
  };
}

const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

// ---------------------------------------------------------------- instruments
/** marimba-ish: a sine with a woody 4th partial and a fast decay */
function marimba(target, t0, note, { gain = 0.3, pan = 0, decay = 0.35, send = 0.25 } = {}) {
  const fq = midi(note);
  add(target, t0, decay * 5, (t) => env(t, 0.002, decay) * (Math.sin(TAU * fq * t) + 0.32 * Math.sin(TAU * fq * 4 * t) * Math.exp(-t / (decay * 0.25)) + 0.12 * Math.sin(TAU * fq * 10 * t) * Math.exp(-t / 0.02)), { gain, pan, send });
}

/** a bell: FM, bright, long */
function bell(target, t0, note, { gain = 0.2, pan = 0, decay = 1.4, send = 0.45, ratio = 3.5, index = 2.2 } = {}) {
  const fq = midi(note);
  add(target, t0, decay * 4, (t) => env(t, 0.003, decay) * Math.sin(TAU * fq * t + index * Math.exp(-t / (decay * 0.5)) * Math.sin(TAU * fq * ratio * t)), { gain, pan, send });
}

/** a plucked bass: a falling-pitch sine with a little bite */
function pluckBass(target, t0, note, { gain = 0.32, decay = 0.22 } = {}) {
  const fq = midi(note);
  let ph = 0;
  add(target, t0, decay * 5, (t) => {
    ph += (TAU * fq * (1 + 0.04 * Math.exp(-t / 0.01))) / SR;
    const v = Math.sin(ph) + 0.25 * Math.sin(2 * ph);
    return env(t, 0.003, decay) * Math.tanh(1.4 * v);
  }, { gain });
}

/** boing: a sine whose pitch leaps up and wobbles down (a spring) */
function boing(target, t0, { from = 180, to = 420, len = 0.42, gain = 0.32, pan = 0, send = 0.2 } = {}) {
  let ph = 0;
  add(target, t0, len, (t) => {
    const u = t / len;
    const f = from + (to - from) * Math.exp(-u * 3) * (1 + 0.35 * Math.sin(TAU * 11 * t) * Math.exp(-u * 2.5));
    ph += (TAU * f) / SR;
    return Math.sin(ph + 0.8 * Math.sin(2 * ph)) * env(t, 0.004, len * 0.45);
  }, { gain, pan, send });
}

/** a slide whistle: a sine glide with vibrato */
function slide(target, t0, len, f0, f1, { gain = 0.18, pan = 0, send = 0.3 } = {}) {
  let ph = 0;
  add(target, t0, len, (t) => {
    const u = t / len;
    const f = f0 * Math.pow(f1 / f0, u) * (1 + 0.012 * Math.sin(TAU * 6 * t));
    ph += (TAU * f) / SR;
    const a = Math.min(1, t / 0.02) * Math.min(1, (len - t) / 0.05);
    return a * (Math.sin(ph) + 0.08 * Math.sin(3 * ph));
  }, { gain, pan, send });
}

/** whoosh: noise through a sweeping band-pass */
function whoosh(target, t0, len, f0, f1, { gain = 0.35, pan = 0, send = 0.3, seed = 1, q = 1.4 } = {}) {
  const r = rng(seed);
  const filt = svf('bp', q);
  add(target, t0, len, (t) => {
    const u = t / len;
    const a = Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 1.5;
    return a * filt(r() * 2 - 1, f0 * Math.pow(f1 / f0, u));
  }, { gain, pan, send });
}

/** pop: a quick downward sine chirp with a click */
function pop(target, t0, { gain = 0.35, pan = 0, f0 = 900, f1 = 220 } = {}) {
  let ph = 0;
  add(target, t0, 0.09, (t) => {
    const f = f1 + (f0 - f1) * Math.exp(-t / 0.012);
    ph += (TAU * f) / SR;
    return Math.sin(ph) * Math.exp(-t / 0.025);
  }, { gain, pan, send: 0.15 });
}

/** a soft knock (the ball's bounces) */
function tok(target, t0, { gain = 0.3, pan = 0, f = 520 } = {}) {
  add(target, t0, 0.12, (t) => Math.sin(TAU * f * t * (1 - 0.3 * t)) * Math.exp(-t / 0.018) + 0.3 * Math.sin(TAU * f * 2.7 * t) * Math.exp(-t / 0.006), { gain, pan, send: 0.2 });
}

/** a deep hit: a falling sine, saturated, with a click and a body */
function hit(target, t0, { gain = 0.7, f0 = 140, f1 = 42, decay = 0.6 } = {}) {
  let ph = 0;
  const r = rng(77);
  add(target, t0, decay * 4, (t) => {
    const f = f1 + (f0 - f1) * Math.exp(-t / 0.05);
    ph += (TAU * f) / SR;
    return Math.tanh(1.8 * Math.sin(ph)) * env(t, 0.002, decay) + (r() * 2 - 1) * 0.25 * Math.exp(-t / 0.004);
  }, { gain, send: 0.25 });
}

/** a pad chord: detuned saws through a low-pass, slow attack */
function pad(target, t0, len, notes, { gain = 0.12, cutoff = 1400, attack = 0.4, release = 0.8, send = 0.5, pan = 0 } = {}) {
  const voices = notes.flatMap((n) => [midi(n) * 0.997, midi(n) * 1.003]);
  const phs = voices.map((_, i) => i * 0.37);
  const filt = [svf('lp', 0.9), svf('lp', 0.9)];
  let k = 0;
  add(target, t0, len + release, (t) => {
    let v = 0;
    for (let i = 0; i < voices.length; i++) {
      phs[i] += voices[i] / SR;
      v += 2 * (phs[i] % 1) - 1;
    }
    v /= voices.length;
    const a = Math.min(1, t / attack) * (t > len ? Math.exp(-(t - len) / (release / 3)) : 1);
    k ^= 1;
    return a * filt[0](filt[1](v, cutoff), cutoff);
  }, { gain, send, pan });
}

// ---------------------------------------------------------------- the score

// 0–3.2 s: the room. A warm, quiet room tone and, far off, birds; the set's hum.
{
  const r = rng(3);
  let b = 0;
  add(master, 0, at(142), (t) => {
    b = 0.995 * b + 0.02 * (r() * 2 - 1);
    const fade = Math.min(1, t / 0.4) * (t > at(124) ? Math.max(0, 1 - (t - at(124)) / at(18)) : 1);
    return fade * (b * 0.6 + 0.012 * Math.sin(TAU * 50 * t) + 0.006 * Math.sin(TAU * 100 * t));
  }, { gain: 0.5 });
  const br = rng(11);
  for (let i = 0; i < 6; i++) {
    const t0 = 0.25 + i * 0.47 + br() * 0.2;
    const f0 = 2600 + br() * 1400;
    let ph = 0;
    add(master, t0, 0.12, (t) => {
      ph += (TAU * f0 * (1 + 0.25 * Math.sin(TAU * 28 * t))) / SR;
      return Math.sin(ph) * Math.sin(Math.PI * (t / 0.12)) ** 2;
    }, { gain: 0.025, pan: -0.6 + br() * 0.4, send: 0.4 });
  }
}

// The cartoon on the TV (0–3.2 s): a bouncy little tune, boings on the creature's hops.
{
  const beat = 16 / FPS; // the creature hops every 16 frames
  const tune = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84];
  tune.forEach((n, i) => {
    const t0 = 0.05 + i * (beat / 2);
    if (t0 < at(96)) marimba(tv, t0, n, { gain: 0.32, decay: 0.18, pan: 0, send: 0 });
  });
  [48, 48, 53, 55, 48, 48].forEach((n, i) => {
    const t0 = 0.05 + i * beat;
    if (t0 < at(96)) pluckBass(tv, t0, n, { gain: 0.3, decay: 0.12 });
  });
  for (let k = 0; k * beat < at(96); k++) boing(tv, k * beat + beat * 0.86, { from: 260, to: 520, len: 0.22, gain: 0.16 });
}

// 3.2 s: the interruption. A bright ident hit, a swoosh across the screen.
pop(master, at(96), { gain: 0.25, f0: 2400, f1: 600 });
bell(master, at(96), 91, { gain: 0.09, decay: 0.5, ratio: 2.0, index: 1.2 });
whoosh(master, at(96), 0.5, 700, 6000, { gain: 0.42, seed: 5 });
// on the TV, the bumper starts small: a first marimba figure; then the flight into the screen
[79, 83, 86].forEach((n, i) => marimba(master, at(104) + i * 0.09, n, { gain: 0.16, decay: 0.15, send: 0.3 }));
whoosh(master, at(112), at(30), 200, 2600, { gain: 0.38, seed: 9, q: 1.0 });
slide(master, at(124), at(14), 300, 900, { gain: 0.12 });

// The cube hops in (far away), then the big hop and the flat landing; it pops up with a face.
[110, 124, 138].forEach((f, i) => tok(master, at(f), { gain: 0.14 + 0.03 * i, f: 300 + 40 * i }));
slide(master, at(138), at(10), 420, 1250, { gain: 0.2, pan: 0 });
boing(master, at(148), { from: 140, to: 380, len: 0.45, gain: 0.38 });
pop(master, at(152), { gain: 0.32 });
bell(master, at(154), 84, { gain: 0.1, decay: 0.9 });
bell(master, at(154), 88, { gain: 0.08, decay: 0.9, pan: 0.2 });

// The character beat: a bouncy figure, a blink.
{
  const figure = [[156, 76], [160, 79], [164, 83], [172, 81], [176, 79], [180, 76], [188, 84], [192, 88]];
  for (const [f, n] of figure) marimba(master, at(f), n, { gain: 0.2, decay: 0.2, pan: (n - 80) / 20 });
  [[156, 45], [172, 47], [188, 50]].forEach(([f, n]) => pluckBass(master, at(f), n, { gain: 0.26 }));
  pop(master, at(166), { gain: 0.1, f0: 2600, f1: 1400 }); // the blink
}

// The ball: rolls in with small knocks, arcs onto the head (boing), bounces up high.
[172, 178, 184].forEach((f, i) => tok(master, at(f), { gain: 0.16, pan: 0.6 - i * 0.15, f: 640 + i * 30 }));
slide(master, at(186), at(12), 500, 1100, { gain: 0.12, pan: 0.4 });
boing(master, at(198), { from: 220, to: 600, len: 0.38, gain: 0.32, pan: 0 });
// the spin: a whoosh and a quick rising run; the landing
whoosh(master, at(203), at(14), 400, 5200, { gain: 0.3, seed: 13, q: 2.0 });
[74, 78, 81, 86, 90].forEach((n, i) => marimba(master, at(204) + i * 0.05, n, { gain: 0.15, decay: 0.14 }));
hit(master, at(216), { gain: 0.32, f0: 120, f1: 60, decay: 0.18 });
pluckBass(master, at(216), 43, { gain: 0.28 });

// The lid opens like a mouth; the ball falls in (a falling slide); gulp.
pop(master, at(224), { gain: 0.28, f0: 1400, f1: 500 });
slide(master, at(229), at(7), 1300, 300, { gain: 0.2 });
{
  let ph = 0; // gulp: a low, bubbly downward blip
  add(master, at(238), 0.28, (t) => {
    const f = 90 + 220 * Math.exp(-t / 0.05) + 18 * Math.sin(TAU * 26 * t);
    ph += (TAU * f) / SR;
    return Math.sin(ph) * env(t, 0.004, 0.09);
  }, { gain: 0.5, send: 0.2 });
}
// a puzzled beat; the warm glow starts to hum inside
marimba(master, at(250), 79, { gain: 0.13, decay: 0.3 });
marimba(master, at(258), 78, { gain: 0.13, decay: 0.4 });
pad(master, at(246), at(46), [43, 50], { gain: 0.07, cutoff: 500, attack: 0.8, release: 0.4, send: 0.3 });

// The expected ident ending: it settles in the logo pose, the bright sting rings out...
const sting = bus();
[[0, 72], [0, 76], [0, 79], [0, 84], [0.02, 88], [0.04, 91]].forEach(([dt, n], i) => bell(sting, at(284) + dt, n, { gain: 0.13, decay: 1.6, pan: (i - 2.5) / 4, send: 0.5, ratio: 2.0, index: 1.4 }));
pad(sting, at(284), at(10), [60, 64, 67, 72], { gain: 0.08, cutoff: 3000, attack: 0.04, release: 0.3 });
// ...and at frame 292 it slows like a tape stopping: the subversion
{
  const stop0 = at(292);
  const len = 0.45;
  const s0 = Math.round(stop0 * SR);
  let pos = s0;
  for (let i = 0; i < Math.round(len * SR); i++) {
    const u = i / (len * SR);
    const rate = Math.pow(1 - u, 1.6);
    pos += rate;
    const p = Math.floor(pos), fr = pos - p;
    const k = s0 + i;
    if (k >= N || p + 1 >= N) break;
    const amp = 1 - u * u;
    master.L[k] += amp * (sting.L[p] * (1 - fr) + sting.L[p + 1] * fr);
    master.R[k] += amp * (sting.R[p] * (1 - fr) + sting.R[p + 1] * fr);
  }
  for (let k = Math.round(at(284) * SR); k < s0 && k < N; k++) {
    master.L[k] += sting.L[k];
    master.R[k] += sting.R[k];
  }
}

// The transformation: a deep riser under the light sweep, the box locks.
{
  const r = rng(21);
  const filt = svf('bp', 1.2);
  const t0 = at(296), len = at(28);
  let ph = 0;
  add(master, t0, len, (t) => {
    const u = t / len;
    ph += (TAU * (55 + 110 * u * u)) / SR;
    return (Math.sin(ph) * 0.5 + filt(r() * 2 - 1, 300 * Math.pow(26, u)) * 0.9) * u ** 1.4;
  }, { gain: 0.32, send: 0.3 });
  whoosh(master, at(300), at(18), 1200, 9000, { gain: 0.16, seed: 23, q: 3.0, pan: -0.3 });
  hit(master, at(322), { gain: 0.42, f0: 110, f1: 46, decay: 0.35 });
}

// The turn and the wordmark: a glassy rising sparkle across it, then the reveal hit.
[69, 73, 76, 80, 81, 85, 88, 92].forEach((n, i) => bell(master, at(336) + i * 0.055, n, { gain: 0.06, decay: 0.6, pan: -0.7 + i * 0.2, send: 0.6, ratio: 3.0, index: 1.0 }));
whoosh(master, at(336), at(18), 2000, 11000, { gain: 0.1, seed: 31, q: 4.0 });
hit(master, at(354), { gain: 0.72, f0: 150, f1: 38, decay: 0.9 });
pad(master, at(354), at(95), [38, 45, 52, 57, 64], { gain: 0.11, cutoff: 900, attack: 0.05, release: 0.6, send: 0.55 });

// The tease: the lid lifts (a warm swell), the glow pulses, the signature under the line.
whoosh(master, at(362), at(18), 150, 900, { gain: 0.22, seed: 41, q: 0.8 });
for (let k = 0; k < 3; k++) hit(master, at(380) + k * 0.82, { gain: 0.16, f0: 70, f1: 40, decay: 0.25 });
[[392, 76, 0.2], [398, 79, 0.2], [406, 83, 0.32]].forEach(([f, n, g]) => {
  bell(master, at(f), n, { gain: g * 0.55, decay: 1.8, send: 0.6, ratio: 2.0, index: 0.9 });
  marimba(master, at(f), n - 12, { gain: g * 0.6, decay: 0.5, send: 0.4 });
});

// ---------------------------------------------------------------- the TV speaker
{
  // small and boxy: band-limited, a little gritty, in the room
  const hp = [svf('hp', 0.7), svf('hp', 0.7)];
  const lp = [svf('lp', 0.8), svf('lp', 0.8)];
  const cut = Math.round(at(96) * SR);
  for (let k = 0; k < N; k++) {
    const m = (tv.L[k] + tv.R[k]) * 0.5;
    let v = lp[0](lp[1](hp[0](hp[1](m, 320), 320), 4200), 4200);
    v = Math.tanh(1.6 * v) * 0.8;
    if (k >= cut) v *= Math.max(0, 1 - (k - cut) / (0.012 * SR)); // the cut
    // across the room, under the bumper's level: so the interruption really interrupts
    master.L[k] += v * 0.4;
    master.R[k] += v * 0.4;
    verbSend.L[k] += v * 0.2;
    verbSend.R[k] += v * 0.2;
  }
}

// ---------------------------------------------------------------- reverb (Freeverb-style)
function reverb(input, roomSize = 0.82, damp = 0.35) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116].map((n) => Math.round((n * SR) / 44100));
  const allp = [556, 441, 341, 225].map((n) => Math.round((n * SR) / 44100));
  const res = new Float32Array(N);
  const cb = combs.map((n) => ({ buf: new Float32Array(n), i: 0, store: 0 }));
  const ab = allp.map((n) => ({ buf: new Float32Array(n), i: 0 }));
  for (let k = 0; k < N; k++) {
    const x = input[k] * 0.015;
    let y = 0;
    for (const c of cb) {
      const o = c.buf[c.i];
      c.store = o * (1 - damp) + c.store * damp;
      c.buf[c.i] = x + c.store * roomSize;
      c.i = (c.i + 1) % c.buf.length;
      y += o;
    }
    for (const a of ab) {
      const o = a.buf[a.i];
      a.buf[a.i] = y + o * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      y = o - y;
    }
    res[k] = y;
  }
  return res;
}
const wl = reverb(verbSend.L);
const wr = reverb(verbSend.R.map((v, i) => (i > 23 ? verbSend.R[i - 23] : 0)));
for (let k = 0; k < N; k++) {
  master.L[k] += wl[k] * 1.6;
  master.R[k] += wr[k] * 1.6;
}

// ---------------------------------------------------------------- master: clean end, loudness, a look-ahead limiter
const TARGET_LUFS = -14; // integrated, the usual level for social video
const CEILING = Math.pow(10, -1.8 / 20); // sample peak; leaves room for inter-sample peaks (≤ −1 dBTP)

/** Integrated loudness (ITU-R BS.1770-4: K-weighting, 400 ms blocks, 75 % overlap, absolute and relative gates). */
function lufs(L, R) {
  const kw = (x) => {
    const y = new Float64Array(x.length);
    const st = [
      [[1.53512485958697, -2.69169618940638, 1.19839281085285], [-1.69065929318241, 0.73248077421585]],
      [[1.0, -2.0, 1.0], [-1.99004745483398, 0.99007225036621]],
    ];
    let src = x;
    for (const [[b0, b1, b2], [a1, a2]] of st) {
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let k = 0; k < src.length; k++) {
        const v = b0 * src[k] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = src[k]; y2 = y1; y1 = v;
        y[k] = v;
      }
      src = Float64Array.from(y);
    }
    return src;
  };
  const kl = kw(L), kr = kw(R);
  const block = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
  const z = [];
  for (let s = 0; s + block <= N; s += hop) {
    let e = 0;
    for (let k = s; k < s + block; k++) e += kl[k] * kl[k] + kr[k] * kr[k];
    z.push(e / block);
  }
  const loud = (e) => -0.691 + 10 * Math.log10(e);
  const mean = (a) => a.reduce((p, c) => p + c, 0) / a.length;
  const abs = z.filter((e) => loud(e) > -70);
  const rel = loud(mean(abs)) - 10;
  return loud(mean(abs.filter((e) => loud(e) > rel)));
}

/** Brick-wall look-ahead limiter: the gain never lets a sample pass the ceiling, and it moves smoothly (no clicks). */
function limit(L, R, ceiling) {
  const la = Math.round(0.0025 * SR); // 2.5 ms look-ahead
  const rel = 1 - Math.exp(-1 / (0.09 * SR)); // 90 ms release
  const need = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    const p = Math.max(Math.abs(L[k]), Math.abs(R[k]));
    need[k] = p > ceiling ? ceiling / p : 1;
  }
  // the lowest gain needed within ±la, then averaged over ±la/2: every average stays at or below need[k]
  const m = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    let g = 1;
    for (let j = Math.max(0, k - la); j <= Math.min(N - 1, k + la); j++) if (need[j] < g) g = need[j];
    m[k] = g;
  }
  const r = la >> 1;
  let g = 1;
  let peakReduction = 1;
  for (let k = 0; k < N; k++) {
    let s = 0, c = 0;
    for (let j = Math.max(0, k - r); j <= Math.min(N - 1, k + r); j++) { s += m[j]; c++; }
    const b = s / c;
    g = b < g ? b : g + (b - g) * rel;
    L[k] *= g;
    R[k] *= g;
    peakReduction = Math.min(peakReduction, g);
  }
  return 20 * Math.log10(peakReduction);
}

let gr = 0;
{
  // fade out over 14.45–14.92 s, then true silence: the end is clean, and a looping player starts again from quiet
  const fadeFrom = Math.round(14.45 * SR), fadeTo = Math.round(14.92 * SR);
  for (let k = fadeFrom; k < N; k++) {
    const g = k >= fadeTo ? 0 : Math.cos(((k - fadeFrom) / (fadeTo - fadeFrom)) * (Math.PI / 2));
    master.L[k] *= g;
    master.R[k] *= g;
  }
  // set the level from the measured loudness, limit, measure again: the limiter only shaves peaks, so this converges
  const dryL = Float32Array.from(master.L), dryR = Float32Array.from(master.R);
  let gainDb = TARGET_LUFS - lufs(dryL, dryR);
  for (let pass = 0; pass < 4; pass++) {
    const a = Math.pow(10, gainDb / 20);
    for (let k = 0; k < N; k++) {
      master.L[k] = dryL[k] * a;
      master.R[k] = dryR[k] * a;
    }
    gr = limit(master.L, master.R, CEILING);
    gainDb += TARGET_LUFS - lufs(master.L, master.R);
  }
}

// ---------------------------------------------------------------- write
mkdirSync(dirname(out), { recursive: true });
const data = Buffer.alloc(44 + N * 4);
data.write('RIFF', 0);
data.writeUInt32LE(36 + N * 4, 4);
data.write('WAVEfmt ', 8);
data.writeUInt32LE(16, 16);
data.writeUInt16LE(1, 20);
data.writeUInt16LE(2, 22);
data.writeUInt32LE(SR, 24);
data.writeUInt32LE(SR * 4, 28);
data.writeUInt16LE(4, 32);
data.writeUInt16LE(16, 34);
data.write('data', 36);
data.writeUInt32LE(N * 4, 40);
for (let k = 0; k < N; k++) {
  data.writeInt16LE(Math.round(clamp(master.L[k], -1, 1) * 32767), 44 + k * 4);
  data.writeInt16LE(Math.round(clamp(master.R[k], -1, 1) * 32767), 46 + k * 4);
}
writeFileSync(out, data);
console.log(`audio → ${out} (${DUR} s, ${SR} Hz stereo, ${lufs(master.L, master.R).toFixed(1)} LUFS, limiter at most ${gr.toFixed(1)} dB)`);

/** The cue list (frame → sound), for the storyboard. */
export const CUES = [
  [0, 'room tone, distant birds; the cartoon through the TV speaker (marimba tune, bass, boings on the hops)'],
  [96, 'the interruption: a bright pop and bell, a swoosh across the screen; the cartoon cuts'],
  [104, 'the bumper starts on the TV: a marimba figure; then the flight into the screen (a rising whoosh, a slide)'],
  [138, 'the big hop: a rising slide whistle; 148: boing (the flat landing); 152: pop (the face)'],
  [156, 'the character beat: a bouncy marimba figure and plucked bass; 166: the blink'],
  [172, "the ball rolls in (knocks), 186: arcs up (slide), 198: boing on the cube's head"],
  [203, 'the spin: a whoosh and a rising run; 216: a thump as it lands'],
  [224, 'the lid opens (pop); 229: the ball falls in (falling slide); 238: gulp'],
  [246, 'a puzzled two-note beat; a warm hum starts inside'],
  [284, 'the expected ident sting (a bright bell chord)…'],
  [292, '…which slows to a stop like a tape: the subversion'],
  [296, 'the transformation: a deep riser under the light sweep; 322: the box locks (hit)'],
  [336, 'a glassy rising sparkle across the wordmark; 354: the reveal hit and a low, cool chord'],
  [362, 'the lid lifts (a warm swell); 380: soft pulses; 392–406: the three-note signature under STAY TUNED.'],
  [434, 'a clean fade to silence by 14.92 s'],
];
