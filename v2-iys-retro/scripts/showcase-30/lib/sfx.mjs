/**
 * Sound design for the film. The UI sounds are the site's OWN original
 * Web Audio recipes (src/lib/sound.ts: click, open, close, minimize, ping,
 * done, boot, modem), re-rendered offline with the same oscillators, pitches
 * and timings. The film-only sounds (CRT power-on, whooshes, key ticks, taps)
 * are synthesized here. Nothing is sampled or borrowed.
 */
import { SR, biquad, osc, render, rng } from './synth.mjs';

const noise = rng(7);

/** sound.ts tone(): exp attack to v in 8 ms, exp decay to silence at d (optional exp glide f → f2). */
function tone({ f, f2, t0 = 0, d, type = 'square', v = 0.5 }) {
  let ph = 0;
  const shape = type === 'sawtooth' ? 'saw' : type === 'triangle' ? 'tri' : type;
  const s = render(t0 + d + 0.03, (t) => {
    if (t < t0) return 0;
    const k = t - t0;
    const freq = f2 ? f * Math.pow(f2 / f, Math.min(1, k / d)) : f;
    ph = (ph + freq / SR) % 1;
    const a = k < 0.008 ? 0.0001 * Math.pow(v / 0.0001, k / 0.008) : k < d ? v * Math.pow(0.0001 / v, (k - 0.008) / (d - 0.008)) : 0;
    return osc(shape, ph, freq / SR) * a;
  });
  return s;
}
/** sound.ts noise(): seeded white noise, linear fade, high-passed. */
function hiss(t0, d, v = 0.4, hp = 1200) {
  const f = biquad('hp', hp);
  return render(t0 + d + 0.01, (t) => (t < t0 || t > t0 + d ? f.process(0) : f.process(noise() * (1 - (t - t0) / d)) * v));
}
function sum(...parts) {
  const n = Math.max(...parts.map((p) => p.length));
  const out = new Float32Array(n);
  for (const p of parts) for (let i = 0; i < p.length; i++) out[i] += p[i];
  return out;
}

/** The site's own UI sounds. */
export const UI = {
  click: () => tone({ f: 1800, d: 0.025, type: 'square', v: 0.25 }),
  open: () => tone({ f: 520, f2: 880, d: 0.09, type: 'triangle', v: 0.35 }),
  close: () => tone({ f: 760, f2: 420, d: 0.08, type: 'triangle', v: 0.3 }),
  minimize: () => tone({ f: 900, f2: 300, d: 0.12, type: 'sine', v: 0.3 }),
  ping: () => sum(tone({ f: 1320, d: 0.12, type: 'sine', v: 0.4 }), tone({ f: 1760, t0: 0.09, d: 0.2, type: 'sine', v: 0.35 })),
  done: () => sum(...[660, 880, 1320].map((f, i) => tone({ f, t0: i * 0.07, d: 0.12, type: 'triangle', v: 0.3 }))),
  boot: () => sum(...[392, 523, 659, 1047].map((f, i) => tone({ f, t0: i * 0.085, d: 0.22, type: 'triangle', v: 0.28 }))),
  modem: () => sum(tone({ f: 1650, d: 0.12, type: 'sine', v: 0.2 }), tone({ f: 980, f2: 2100, t0: 0.12, d: 0.18, type: 'sawtooth', v: 0.08 }), hiss(0.28, 0.22, 0.12, 900)),
  error: () => sum(tone({ f: 220, d: 0.16, type: 'square', v: 0.28 }), tone({ f: 180, t0: 0.14, d: 0.2, type: 'square', v: 0.24 })),
};

/** Film-only sounds. */
export const FILM = {
  /** CRT power-on: a low thunk, the faint flyback whine rising in, a crackle of static. */
  crtOn: () => {
    let ph = 0;
    let pw = 0;
    const lp = biquad('lp', 600);
    const hp = biquad('hp', 3000);
    return render(1.1, (t) => {
      ph += (42 + 30 * Math.exp(-t / 0.05)) / SR;
      const thunk = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.16) * 0.9;
      pw += (7800 + 200 * t) / SR;
      const whine = Math.sin(2 * Math.PI * pw) * 0.018 * Math.min(1, t / 0.3) * Math.exp(-Math.max(0, t - 0.5) / 0.3);
      const crackle = hp.process(noise() * (noise() > 0.93 ? 1 : 0.05)) * 0.22 * Math.exp(-t / 0.35);
      const hum = lp.process(noise()) * 0.15 * Math.exp(-t / 0.25);
      return thunk + whine + crackle + hum;
    });
  },
  /** Band-passed noise sweep; `up` rises, otherwise falls. */
  whoosh: (len = 0.32, up = true, v = 0.5) => {
    const bp = biquad('bp', 400, 1.6);
    return render(len, (t, i) => {
      const k = t / len;
      if (i % 32 === 0) bp.set(up ? 300 * Math.pow(25, k) : 7500 * Math.pow(1 / 25, k));
      return bp.process(noise()) * Math.sin(Math.PI * k) ** 1.5 * v * 2;
    });
  },
  /** A soft key press (typing). */
  key: (v = 0.35) => {
    const hp = biquad('hp', 2200);
    let ph = 0;
    return render(0.05, (t) => {
      ph += 140 / SR;
      return (hp.process(noise()) * Math.exp(-t / 0.006) * 0.7 + Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.012) * 0.5) * v;
    });
  },
  /** A finger tap on glass (mobile). */
  tap: (v = 0.3) => {
    let ph = 0;
    const hp = biquad('hp', 1500);
    return render(0.06, (t) => {
      ph += (2300 - 6000 * t) / SR;
      return (Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.012) * 0.6 + hp.process(noise()) * Math.exp(-t / 0.004) * 0.4) * v;
    });
  },
  /** Data trickle under the COPYING dialog: soft blips climbing with the progress bar. */
  copying: (len = 0.62, v = 0.12) => sum(...Array.from({ length: 8 }, (_, i) => tone({ f: 900 + i * 110, t0: (i * len) / 8, d: 0.035, type: 'square', v }))),
  /** Short digital glitch for the CRT snap between scenes. */
  glitch: (len = 0.09, v = 0.25) => {
    let hold = 0;
    let cur = 0;
    return render(len, (t, i) => {
      if (i % 64 === 0) hold = Math.floor(8 + Math.abs(noise()) * 40);
      if (i % hold === 0) cur = noise();
      return Math.round(cur * 6) / 6 * v * (1 - t / len);
    });
  },
};
