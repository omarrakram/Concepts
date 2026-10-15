/**
 * npm run audio [-- --out=.cache/film/soundtrack.wav]
 *
 * The film's soundtrack, synthesised from scratch (no samples, no third-party
 * audio): 16.000 s, 48 kHz, stereo, 16-bit. Every event is placed on the film's
 * own timeline (src/showcase/film.ts), so picture and sound stay locked.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ROOT, arg } from './lib/server.mjs';

const SR = 48000;
const DUR = 16;
const N = SR * DUR;
const OUT = resolve(ROOT, arg('out', '.cache/film/soundtrack.wav'));
const L = new Float32Array(N);
const R = new Float32Array(N);
const sendL = new Float32Array(N);
const sendR = new Float32Array(N);

let seed = 0x6b6169;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const TAU = Math.PI * 2;
const at = (s) => Math.round(s * SR);
const note = (n) => 440 * Math.pow(2, (n - 69) / 12);
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const add = (i, l, r, send = 0) => {
  if (i < 0 || i >= N) return;
  L[i] += l;
  R[i] += r;
  if (send) {
    sendL[i] += l * send;
    sendR[i] += r * send;
  }
};

/** RBJ band-pass, state per channel */
function bandpass() {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f, q) => {
    const w = (TAU * f) / SR;
    const al = Math.sin(w) / (2 * q);
    const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * Math.cos(w), a2 = 1 - al;
    const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}
function lowpass() {
  let y = 0;
  return (x, f) => (y += (1 - Math.exp((-TAU * f) / SR)) * (x - y));
}

/* 1 — BEFORE: a dry, quiet room; soft clicks on each page change */
{
  const lp = lowpass();
  for (let i = 0; i < at(2.95); i++) {
    const t = i / SR;
    const n = lp(rnd() * 2 - 1, 300) * 0.05 * smooth(0, 0.3, t);
    add(i, n, n);
  }
  for (const c of [0.02, 1.1, 2.2]) click(c, 2400, 0.12, 0.1);
}

/* 2 — the tide: band-passed noise sweeping up, breaking on the reveal at 3.45 */
{
  const bl = bandpass(), br = bandpass();
  for (let i = at(2.4); i < at(3.56); i++) {
    const t = i / SR;
    const k = smooth(2.4, 3.42, t);
    const f = 260 * Math.pow(16, k);
    const amp = Math.pow(k, 2.2) * 0.55 * (1 - smooth(3.44, 3.56, t));
    add(i, bl(rnd() * 2 - 1, f, 0.9) * amp, br(rnd() * 2 - 1, f * 1.06, 0.9) * amp, 0.3);
  }
}

/* 3 — impact on the reveal */
function boom(t0, depth = 1) {
  let ph = 0;
  const lp = lowpass();
  for (let i = at(t0); i < at(t0 + 2.4); i++) {
    const t = i / SR - t0;
    const f = 42 + 48 * Math.exp(-t / 0.09);
    ph += (TAU * f) / SR;
    const s = Math.sin(ph) * Math.exp(-t / 0.75) * 0.62 * depth;
    const n = lp(rnd() * 2 - 1, 900) * Math.exp(-t / 0.18) * 0.35 * depth;
    add(i, s + n, s + n * 0.9, 0.15);
  }
}
function bell(t0, n, amp, decay = 2.6, pan = 0) {
  const f = note(n);
  for (let i = at(t0); i < at(t0 + decay * 2.2); i++) {
    const t = i / SR - t0;
    const env = Math.min(1, t / 0.004) * Math.exp(-t / decay);
    const mod = Math.sin(TAU * f * 3.5 * t) * 2.2 * Math.exp(-t / 0.5);
    const s = (Math.sin(TAU * f * t + mod) * 0.8 + Math.sin(TAU * f * 2.01 * t) * 0.12 * Math.exp(-t / 0.7)) * env * amp;
    add(i, s * (1 - pan * 0.5), s * (1 + pan * 0.5), 0.55);
  }
}
function click(t0, f, amp, dec = 0.012) {
  for (let i = at(t0); i < at(t0 + 0.08); i++) {
    const t = i / SR - t0;
    const s = Math.sin(TAU * f * t) * Math.exp(-t / dec) * amp + (rnd() * 2 - 1) * Math.exp(-t / 0.004) * amp * 0.3;
    add(i, s, s, 0.25);
  }
}
boom(3.45);
[74, 81, 90].forEach((n, k) => bell(3.47 + k * 0.05, n, 0.07, 2.4, (k - 1) * 0.6));

/* 4 — the sea, from the reveal to the end */
{
  const al = lowpass(), ar = lowpass();
  const hl = lowpass(), hr = lowpass();
  for (let i = at(3.3); i < N; i++) {
    const t = i / SR;
    const swell = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin((TAU * (t - 3.3)) / 4.4 - 1.2), 2);
    const swell2 = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin((TAU * (t - 3.3)) / 3.1 + 0.8), 2);
    const fade = smooth(3.3, 4.0, t) * (1 - smooth(15.4, 16, t));
    const wl = rnd() * 2 - 1, wr = rnd() * 2 - 1;
    const lowL = al(wl, 420), lowR = ar(wr, 460);
    const hissL = wl - hl(wl, 3800), hissR = wr - hr(wr, 3800);
    add(i, (lowL * 0.5 * swell + hissL * 0.018 * swell2) * fade, (lowR * 0.5 * swell2 + hissR * 0.018 * swell) * fade);
  }
}

/* 5 — warm pad that follows the scenes */
const CHORDS = [
  [3.45, 7.0, [50, 57, 66, 73, 76]], // Dmaj9
  [7.0, 9.0, [47, 54, 62, 69, 73]], // Bm9
  [9.0, 12.3, [43, 50, 59, 66, 69]], // Gmaj7(9)
  [12.3, 13.9, [45, 52, 62, 64, 71]], // Asus
  [13.9, 16.0, [50, 57, 62, 66, 73, 76]], // D add9
];
for (const [a, b, notes] of CHORDS) {
  const lp = lowpass(), lp2 = lowpass();
  for (let i = at(a - 0.25); i < Math.min(N, at(b + 0.45)); i++) {
    const t = i / SR;
    const env = smooth(a - 0.25, a + 0.45, t) * (1 - smooth(b - 0.05, b + 0.45, t)) * (b >= 16 ? 1 - smooth(15.2, 16, t) : 1);
    if (env <= 0) continue;
    let sl = 0, sr = 0;
    notes.forEach((n, k) => {
      const f = note(n);
      for (let h = 1; h <= 6; h++) {
        const amp = 1 / (h * h * 0.8 + 0.2);
        sl += Math.sin(TAU * f * h * (1 - 0.0016) * t + k) * amp;
        sr += Math.sin(TAU * f * h * (1 + 0.0016) * t + k * 1.3) * amp;
      }
    });
    const breath = 0.85 + 0.15 * Math.sin(TAU * 0.35 * t);
    const g = 0.022 * env * breath;
    add(i, lp(sl, 1400) * g, lp2(sr, 1400) * g, 0.35);
  }
}

/* 6 — light percussion, 120 bpm from the homepage to the devices */
for (let b = 0; b < 17; b++) {
  const t0 = 5.5 + b * 0.5;
  if (t0 >= 13.9) break;
  const quiet = t0 >= 10.8 && t0 < 12.3 ? 0.6 : 1;
  // soft kick
  let ph = 0;
  for (let i = at(t0); i < at(t0 + 0.35); i++) {
    const t = i / SR - t0;
    ph += (TAU * (48 + 70 * Math.exp(-t / 0.03))) / SR;
    const s = Math.sin(ph) * Math.exp(-t / 0.16) * 0.32 * quiet;
    add(i, s, s);
  }
  // shaker on the off-beat
  const hp = lowpass();
  const t1 = t0 + 0.25;
  for (let i = at(t1); i < at(t1 + 0.09); i++) {
    const t = i / SR - t1;
    const w = rnd() * 2 - 1;
    const s = (w - hp(w, 6500)) * Math.exp(-t / 0.025) * 0.09 * quiet;
    add(i, s * 0.8, s, 0.2);
  }
  // rim on 2 and 4
  if (b % 2 === 1) {
    const bp = bandpass();
    for (let i = at(t0); i < at(t0 + 0.12); i++) {
      const t = i / SR - t0;
      const s = bp(rnd() * 2 - 1, 1900, 2.5) * Math.exp(-t / 0.03) * 0.22 * quiet;
      add(i, s, s * 0.85, 0.3);
    }
  }
}

/* 7 — The Horizon: one pluck per chapter */
[7.05, 7.51, 7.97, 8.43, 8.89].forEach((t0, k) => bell(t0, [74, 78, 81, 85, 88][k], 0.06, 0.9, (k - 2) * 0.35));
/* scene accents */
boom(7.0, 0.35);
boom(9.0, 0.3);
/* whooshes: scroll into the wardrobes, the tide wipe, the shrink to devices */
for (const [a, b, f0, f1, amp] of [
  [8.86, 9.16, 500, 2400, 0.18],
  [9.86, 10.26, 300, 3000, 0.2],
  [12.2, 12.82, 2000, 7000, 0.12],
]) {
  const bl = bandpass(), br = bandpass();
  for (let i = at(a); i < at(b); i++) {
    const t = i / SR;
    const k = smooth(a, b, t);
    const env = Math.sin(Math.PI * k);
    const f = f0 * Math.pow(f1 / f0, k);
    add(i, bl(rnd() * 2 - 1, f, 1.1) * env * amp, br(rnd() * 2 - 1, f * 1.04, 1.1) * env * amp, 0.3);
  }
}
/* UI taps, and a two-note chime when the piece lands in the bag */
for (const t0 of [9.74, 10.64, 11.08, 11.3, 11.84, 12.0]) click(t0, 1700, 0.16, 0.01);
bell(12.04, 81, 0.05, 0.7, -0.3);
bell(12.12, 88, 0.045, 0.9, 0.3);

/* 8 — lockup: low swell and a slow bell arpeggio */
boom(14.05, 0.55);
[74, 81, 86, 90, 93].forEach((n, k) => bell(14.05 + k * 0.16, n, 0.055 - k * 0.004, 2.2, (k - 2) * 0.4));

/* reverb on the send bus (Schroeder: 4 combs + 2 all-passes per side) */
function reverb(inp, delays, seedOffset) {
  const out = new Float32Array(N);
  for (const d of delays.combs) {
    const buf = new Float32Array(d);
    let p = 0, lp = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[p];
      lp = y * 0.72 + lp * 0.28;
      buf[p] = inp[i] + lp * 0.8;
      out[i] += y * 0.25;
      p = (p + 1) % d;
    }
  }
  for (const d of delays.ap) {
    const buf = new Float32Array(d + seedOffset);
    let p = 0;
    for (let i = 0; i < N; i++) {
      const y = buf[p];
      const x = out[i];
      buf[p] = x + y * 0.5;
      out[i] = y - x * 0.5;
      p = (p + 1) % buf.length;
    }
  }
  return out;
}
const rvL = reverb(sendL, { combs: [1557, 1617, 1491, 1422].map((d) => d * 2), ap: [225 * 2, 556 * 2] }, 0);
const rvR = reverb(sendR, { combs: [1617, 1557, 1422, 1491].map((d) => d * 2 + 46), ap: [341 * 2, 441 * 2] }, 7);
for (let i = 0; i < N; i++) {
  L[i] += rvL[i] * 0.55;
  R[i] += rvR[i] * 0.55;
}

/* master: gentle saturation, normalise to -1 dBFS, clean edges */
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.1);
  R[i] = Math.tanh(R[i] * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.89 / peak;
const pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0);
pcm.writeUInt32LE(36 + N * 4, 4);
pcm.write('WAVE', 8);
pcm.write('fmt ', 12);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 4, 28);
pcm.writeUInt16LE(4, 32);
pcm.writeUInt16LE(16, 34);
pcm.write('data', 36);
pcm.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const edge = Math.min(1, i / 96, (N - 1 - i) / 960);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain * edge)) * 32767), 44 + i * 4);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain * edge)) * 32767), 46 + i * 4);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, pcm);
console.log(`[audio] ✓ ${OUT} — ${DUR}.000 s, ${SR} Hz stereo, peak normalised to -1 dBFS`);
