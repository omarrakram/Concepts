/**
 * "COOL DECISION" — the film's original score (Omar Akram concept film, 2026).
 * 120 BPM, A minor / C major, 30.000 s. Written as code so it renders the
 * same every time; no samples, no loops from anywhere else.
 *
 *  0 – 2   CRT power-on, boot chime, riser          (bar 1)
 *  2 – 10  groove A: Am F C G ×1, drums + bass       (bars 2–5)
 * 10 – 18  groove A + the hook melody                (bars 6–9)
 * 18 – 20  2:13 AM breakdown: pad + soft arp         (bar 10)
 * 20 – 22  build: chip arp climbing, snare roll      (bar 11)
 * 22 – 27  drop for IYS MOBILE, montage double-time  (bars 12–14½)
 * 27 – 30  C major hit, logo sparkle, tail to silence
 */
import { SR, adsr, biquad, buffer, hz, mix, osc, perc, pingpong, render, reverb, rng, addInto, shape } from './synth.mjs';

export const BPM = 120;
export const BEAT = 60 / BPM; // 0.5 s
const bt = (b) => b * BEAT; // beat → seconds

// ── instruments ────────────────────────────────────────────────────────
const noiseOf = rng(2006);

function kick(vel = 1) {
  let ph = 0;
  const click = biquad('hp', 2500);
  return render(0.42, (t) => {
    const f = 46 + 110 * Math.exp(-t / 0.035);
    ph += f / SR;
    const body = Math.sin(2 * Math.PI * ph) * perc(t, 0.002, 0.34);
    const c = click.process(noiseOf()) * perc(t, 0.0005, 0.006) * 0.5;
    return Math.tanh((body * 1.25 + c) * 1.2) * vel;
  });
}
function snare(vel = 1) {
  const bp = biquad('bp', 1900, 0.8);
  const hp = biquad('hp', 700);
  let ph = 0;
  return render(0.3, (t) => {
    ph += 190 / SR;
    const n = hp.process(bp.process(noiseOf()) * 2.2) * perc(t, 0.001, 0.17);
    const tone = Math.sin(2 * Math.PI * ph) * perc(t, 0.001, 0.07) * 0.55;
    return (n + tone) * vel;
  });
}
function clap(vel = 1) {
  const bp = biquad('bp', 1250, 1.1);
  return render(0.3, (t) => {
    const bursts = perc(t, 0.0005, 0.012) + perc(t - 0.011, 0.0005, 0.012) + perc(t - 0.022, 0.0005, 0.16);
    return bp.process(noiseOf()) * bursts * 1.6 * vel;
  });
}
function hat(open = false, vel = 1) {
  const hp = biquad('hp', 7600);
  const bp = biquad('bp', 10500, 0.7);
  return render(open ? 0.3 : 0.06, (t) => bp.process(hp.process(noiseOf())) * perc(t, 0.0008, open ? 0.24 : 0.035) * 1.8 * vel);
}
function crash(len = 1.8, vel = 1) {
  const hp = biquad('hp', 4200);
  const ratios = [1, 1.483, 1.932, 2.546, 2.63, 3.897];
  const ph = ratios.map(() => 0);
  return render(len, (t) => {
    let m = 0;
    ratios.forEach((r, i) => {
      ph[i] = (ph[i] + (420 * r) / SR) % 1;
      m += ph[i] < 0.5 ? 1 : -1;
    });
    return hp.process(noiseOf() * 0.8 + m * 0.07) * perc(t, 0.002, len * 0.7) * vel;
  });
}
/** Bass: polyBLEP saw + sub sine, envelope-swept low-pass. */
function bass(f, len, vel = 1) {
  const lp = biquad('lp', 900, 1.1);
  let p1 = 0;
  let p2 = 0;
  return render(len + 0.08, (t, i) => {
    const dt = f / SR;
    p1 = (p1 + dt) % 1;
    p2 = (p2 + dt / 2) % 1;
    if (i % 16 === 0) lp.set(260 + 1500 * perc(t, 0.003, 0.12));
    const s = lp.process(osc('saw', p1, dt)) * 0.7 + Math.sin(2 * Math.PI * p2) * 0.55;
    return s * adsr(t, len, 0.004, 0.05, 0.8, 0.06) * vel;
  });
}
/** Offbeat chord stab: detuned squares through a low-pass. */
function stab(freqs, len = 0.2, vel = 1, cutoff = 2400) {
  const lp = biquad('lp', cutoff, 0.9);
  const ph = freqs.flatMap(() => [0, 0.37]);
  return render(len + 0.1, (t) => {
    let s = 0;
    freqs.forEach((f, k) => {
      for (const [j, det] of [[0, 0.997], [1, 1.004]]) {
        const dt = (f * det) / SR;
        ph[k * 2 + j] = (ph[k * 2 + j] + dt) % 1;
        s += osc('square', ph[k * 2 + j], dt, 0.42);
      }
    });
    return (lp.process(s / (freqs.length * 2)) * adsr(t, len, 0.003, 0.08, 0.45, 0.09)) * vel;
  });
}
/** Warm pad: 3 detuned saws per note, slow attack. */
function pad(freqs, len, vel = 1, cutoff = 1300) {
  const lp = biquad('lp', cutoff, 0.6);
  const ph = freqs.flatMap(() => [0.1, 0.5, 0.8]);
  return render(len + 0.9, (t) => {
    let s = 0;
    freqs.forEach((f, k) => {
      [0.994, 1, 1.006].forEach((d, j) => {
        const dt = (f * d) / SR;
        ph[k * 3 + j] = (ph[k * 3 + j] + dt) % 1;
        s += osc('saw', ph[k * 3 + j], dt);
      });
    });
    return lp.process(s / (freqs.length * 3)) * adsr(t, len, 0.35, 0.4, 0.75, 0.85) * vel;
  });
}
/** Chip pluck for the arp / hook (pulse wave). */
function pluck(f, len = 0.12, vel = 1, duty = 0.25) {
  let ph = 0;
  const lp = biquad('lp', 5200);
  return render(len + 0.05, (t) => {
    const dt = f / SR;
    ph = (ph + dt) % 1;
    return lp.process(osc('square', ph, dt, duty)) * perc(t, 0.002, len) * vel;
  });
}
/** Lead: square + triangle with delayed vibrato. */
function lead(f, len, vel = 1) {
  let p1 = 0;
  let p2 = 0;
  const lp = biquad('lp', 3800, 0.8);
  return render(len + 0.12, (t) => {
    const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, t / 0.25);
    const dt = (f * vib) / SR;
    p1 = (p1 + dt) % 1;
    p2 = (p2 + dt) % 1;
    const s = osc('square', p1, dt, 0.5) * 0.55 + osc('tri', p2, dt) * 0.6;
    return lp.process(s) * adsr(t, len, 0.006, 0.08, 0.7, 0.1) * vel;
  });
}
/** FM bell for the logo sparkle. */
function bell(f, len = 1.6, vel = 1) {
  let pc = 0;
  let pm = 0;
  return render(len, (t) => {
    pm = (pm + (f * 3.5) / SR) % 1;
    const idx = 2.2 * perc(t, 0.001, 0.5);
    pc = (pc + f / SR) % 1;
    return Math.sin(2 * Math.PI * pc + idx * Math.sin(2 * Math.PI * pm)) * perc(t, 0.002, len * 0.8) * vel;
  });
}
/** Noise riser (band-pass sweeping up) of `len` seconds. */
export function riser(len, vel = 1, from = 300, to = 9000) {
  const bp = biquad('bp', from, 2.5);
  return render(len, (t, i) => {
    const k = t / len;
    if (i % 32 === 0) bp.set(from * Math.pow(to / from, k * k));
    return bp.process(noiseOf()) * k * k * 2.4 * vel;
  });
}
/** Sub drop / impact boom. */
export function impact(vel = 1, len = 1.6) {
  let ph = 0;
  const lp = biquad('lp', 1800);
  return render(len, (t) => {
    ph += (38 + 70 * Math.exp(-t / 0.09)) / SR;
    const body = Math.sin(2 * Math.PI * ph) * perc(t, 0.002, len * 0.65);
    const dust = lp.process(noiseOf()) * perc(t, 0.001, 0.25) * 0.5;
    return Math.tanh((body + dust) * 1.4) * vel;
  });
}

// ── harmony ───────────────────────────────────────────────────────────
const CH = {
  Am: ['A3', 'C4', 'E4'],
  F: ['F3', 'A3', 'C4'],
  C: ['C4', 'E4', 'G4'],
  G: ['G3', 'B3', 'D4'],
  Fmaj7: ['F3', 'A3', 'C4', 'E4'],
  Cadd9: ['C4', 'E4', 'G4', 'D5'],
};
const ROOT = { Am: 'A1', F: 'F1', C: 'C2', G: 'G1', Fmaj7: 'F1', Cadd9: 'C2' };
const up = (n, oct) => n.replace(/-?\d$/, (d) => String(Number(d) + oct));
/** chord per beat 0..59 (bar = 4 beats) */
function chordAt(b) {
  const bar = Math.floor(b / 4);
  if (bar === 0) return 'Am';
  if (bar === 9) return 'Fmaj7';
  if (bar === 10) return 'G';
  if (b >= 54) return 'Cadd9'; // 27.0 s
  return ['Am', 'F', 'C', 'G'][(bar - 1) % 4];
}

// Hook melody (bars 6–9): [beat offset within the 4-bar phrase, note, length in beats]
const HOOK = [
  [0, 'E5', 0.5], [1, 'E5', 0.5], [1.5, 'D5', 0.5], [2, 'C5', 1], [3, 'A4', 1],
  [4, 'C5', 0.5], [5, 'C5', 0.5], [5.5, 'D5', 0.5], [6, 'E5', 1], [7, 'C5', 1],
  [8, 'G5', 1], [9, 'E5', 1], [10, 'D5', 0.5], [10.5, 'C5', 0.5], [11, 'D5', 0.5], [11.5, 'E5', 0.5],
  [12, 'D5', 1], [13, 'B4', 1], [14, 'G4', 2],
];

/**
 * Render the score into a 30 s stereo buffer. `duck(t)` (0..1) lets the
 * mixer pull the music down under key sound moments.
 */
export function score(seconds = 30) {
  const drums = buffer(seconds);
  const music = buffer(seconds);
  const arpBus = buffer(seconds);
  const padBus = buffer(seconds);

  // ── bar 1: intro pad (Am) under the boot, swelling in
  mix(padBus, 0.55, pad(CH.Am.map(hz), 1.35, 0.42, 900), 1, 0);
  mix(music, 1.25, riser(0.75, 0.55, 400, 7000), 0.8, 0.2);

  for (let b = 4; b < 60; b++) {
    const t = bt(b);
    const bar = Math.floor(b / 4);
    const beat = b % 4;
    const ch = chordAt(b);
    const breakdown = bar === 9; // 18–20 s
    const build = bar === 10; // 20–22 s
    const finale = b >= 54; // 27 s →
    const montage = b >= 50 && b < 54; // 25–27 s
    if (finale) continue; // the finale is written separately below

    // drums
    if (!breakdown) {
      if (!(build && beat === 3)) mix(drums, t, kick(0.95), 0.72, 0);
      if (beat === 1 || beat === 3) {
        mix(drums, t, snare(0.7), 0.5, 0.05);
        mix(drums, t, clap(0.8), 0.42, -0.08);
      }
      const hats = montage || bar >= 11 ? 4 : 2;
      for (let k = 0; k < hats; k++) {
        const o = (k * BEAT) / hats;
        const openHat = hats === 2 && k === 1 && beat % 2 === 1 && bar >= 6;
        mix(drums, t + o, hat(openHat, k % 2 ? 0.75 : 0.5), 0.34, k % 2 ? 0.35 : -0.25);
      }
    } else {
      // 2:13 AM: a heartbeat kick, a soft hat tick and a held bass note
      if (beat === 0 || beat === 2) mix(drums, t, kick(0.6), 0.5, 0);
      mix(drums, t + BEAT / 2, hat(false, 0.5), 0.3, 0.3);
      if (beat === 0) mix(music, t, bass(hz(ROOT[ch]), BEAT * 3.8, 0.7), 0.42, 0);
    }
    if (build) {
      // snare roll that tightens into the drop
      const n = beat < 2 ? 2 : 4;
      for (let k = 0; k < n; k++) mix(drums, t + (k * BEAT) / n, snare(0.35 + 0.15 * (b - 40) / 4), 0.42, 0);
    }
    if (montage && beat >= 2) for (let k = 0; k < 2; k++) mix(drums, t + (k * BEAT) / 2, snare(0.45), 0.35, 0);

    // bass (8ths, octave pop on the offbeat)
    if (!breakdown) {
      const r = ROOT[ch];
      mix(music, t, bass(hz(r), BEAT * 0.45, 0.85), 0.62, 0);
      mix(music, t + BEAT / 2, bass(hz(up(r, 1)), BEAT * 0.35, 0.7), 0.56, 0);
    }
    // offbeat chord stabs
    if (!breakdown && bar >= 1) mix(music, t + BEAT / 2, stab(CH[ch].map((n) => hz(up(n, 1))), 0.16, 0.8, bar >= 11 ? 3400 : 2400), 0.3, 0.15);

    // arp 16ths (chord tones, up), louder in the build
    const tones = CH[ch].map((n) => up(n, 2));
    const nSteps = 4;
    for (let k = 0; k < nSteps; k++) {
      const f = hz(tones[(beat * nSteps + k) % tones.length]) * (build && beat >= 2 ? 2 : 1);
      mix(arpBus, t + (k * BEAT) / nSteps, pluck(f, breakdown ? 0.16 : 0.09, breakdown ? 0.6 : 0.7), build ? 0.2 : breakdown ? 0.15 : 0.13, k % 2 ? 0.4 : -0.4);
    }
    // pads under the breakdown and the drop
    if (beat === 0 && (breakdown || bar >= 11)) mix(padBus, t, pad(CH[ch].map(hz), BEAT * 4 - 0.1, breakdown ? 1 : 0.35, breakdown ? 1700 : 2200), 1, 0);
  }

  // hook melody bars 6–9 (10–18 s), and its first half again in the drop (22–26 s)
  for (const [o, n, l] of HOOK) {
    mix(music, 10 + bt(o), lead(hz(n), bt(l) * 0.85, 0.7), 0.2, -0.1);
    if (o < 8) mix(music, 22 + bt(o), lead(hz(up(n, 0)), bt(l) * 0.85, 0.75), 0.21, 0.1);
  }

  // 22.0: the drop (desktop becomes IYS MOBILE)
  mix(music, 21.25, riser(0.75, 0.8, 300, 11000), 0.9, 0);
  mix(drums, 22, crash(1.6, 0.8), 0.32, -0.2);
  mix(music, 22, impact(0.9, 1.2), 0.6, 0);

  // 27.0: finale. C major hit, sparkle, long tail that is silent by 29.9 s.
  mix(music, 26.35, riser(0.65, 0.7, 500, 12000), 0.85, 0);
  mix(drums, 27, kick(1), 0.95, 0);
  mix(drums, 27, crash(2.6, 0.9), 0.36, 0.15);
  mix(music, 27, impact(1, 2.2), 0.7, 0);
  mix(music, 27, bass(hz('C2'), 1.6, 0.9), 0.5, 0);
  mix(padBus, 27, pad(CH.Cadd9.map(hz), 1.9, 0.75, 2600), 1, 0);
  mix(music, 27, stab(CH.Cadd9.map((n) => hz(up(n, 1))), 0.9, 1, 3600), 0.3, 0);
  ['C6', 'E6', 'G6', 'D7', 'C7'].forEach((n, i) => mix(music, 27.5 + i * 0.125, bell(hz(n), 1.6, 0.5), 0.16, i % 2 ? 0.45 : -0.45));

  // buses: arp → ping-pong delay (dotted 8th), pads/arp → reverb, sidechain the pads/bass to the kick
  const delay = pingpong(arpBus, BEAT * 0.75, 0.34, 3200);
  addInto(arpBus, delay, 0.55);
  const kickAt = [];
  for (let b = 4; b < 54; b++) if (Math.floor(b / 4) !== 9) kickAt.push(bt(b));
  const duck = (t) => {
    let g = 1;
    for (const k of kickAt) {
      const d = t - k;
      if (d >= 0 && d < 0.22) g = Math.min(g, 0.45 + 0.55 * (d / 0.22));
    }
    return g;
  };
  shape(padBus, duck);
  const space = reverb({ L: Float32Array.from(padBus.L, (v, i) => v + arpBus.L[i] * 0.6 + music.L[i] * 0.15), R: Float32Array.from(padBus.R, (v, i) => v + arpBus.R[i] * 0.6 + music.R[i] * 0.15), n: padBus.n }, { room: 0.8, damp: 0.4 });

  const out = buffer(seconds);
  addInto(out, drums, 1);
  addInto(out, music, 1);
  addInto(out, arpBus, 1);
  addInto(out, padBus, 0.55);
  addInto(out, space, 0.35);
  // fade the very end to digital silence (29.4 → 29.92 s)
  shape(out, (t) => (t < 29.4 ? 1 : t > 29.92 ? 0 : Math.cos(((t - 29.4) / 0.52) * (Math.PI / 2)) ** 2));
  return out;
}
