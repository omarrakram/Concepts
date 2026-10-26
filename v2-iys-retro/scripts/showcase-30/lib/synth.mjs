/**
 * Tiny offline synthesizer for the film's ORIGINAL score and sound design.
 * Everything is generated from oscillators and seeded noise: no samples, no
 * recordings, no OS or messenger sounds. Deterministic: same input, same WAV.
 */
export const SR = 48_000;

/** Stereo float buffer of `seconds`. */
export function buffer(seconds) {
  const n = Math.round(seconds * SR);
  return { L: new Float32Array(n), R: new Float32Array(n), n };
}

export const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
/** 'A4' → 69 */
export function note(name) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return (Number(m[2]) + 1) * 12 + NOTES[m[1]];
}
export const hz = (name) => midi(note(name));

/** Seeded white noise. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return (s / 4294967296) * 2 - 1;
  };
}

// PolyBLEP anti-aliased oscillators.
function blep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}
export function osc(type, phase, dt, duty = 0.5) {
  switch (type) {
    case 'sine':
      return Math.sin(2 * Math.PI * phase);
    case 'tri':
      return 1 - 4 * Math.abs(phase - 0.5);
    case 'saw':
      return 2 * phase - 1 - blep(phase, dt);
    case 'square': {
      let v = phase < duty ? 1 : -1;
      v += blep(phase, dt);
      v -= blep((phase + 1 - duty) % 1, dt);
      return v;
    }
    default:
      throw new Error(type);
  }
}

/** RBJ biquad; call set() to change the cutoff, process(x) per sample. */
export function biquad(type, f, q = 0.707) {
  let b0, b1, b2, a1, a2;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  const set = (freq, Q = q) => {
    const w = (2 * Math.PI * Math.min(Math.max(freq, 10), SR * 0.45)) / SR;
    const c = Math.cos(w);
    const a = Math.sin(w) / (2 * Q);
    let n0, n1, n2;
    if (type === 'lp') [n0, n1, n2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
    else if (type === 'hp') [n0, n1, n2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
    else [n0, n1, n2] = [a, 0, -a]; // band-pass (0 dB peak)
    const d0 = 1 + a;
    b0 = n0 / d0;
    b1 = n1 / d0;
    b2 = n2 / d0;
    a1 = (-2 * c) / d0;
    a2 = (1 - a) / d0;
  };
  set(f);
  return {
    set,
    process(x) {
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    },
  };
}

/** Exponential-ish envelope: attack (s) then decay to 0 over `decay` (s). */
export const perc = (t, attack, decay) => (t < 0 ? 0 : t < attack ? t / attack : Math.exp((-(t - attack) * 6.9) / decay));
/** ADSR with gate length `len`. */
export function adsr(t, len, a, d, s, r) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - ((t - a) / d) * (1 - s);
  if (t < len) return s;
  const k = (t - len) / r;
  return k >= 1 ? 0 : s * (1 - k);
}

/** Add a mono voice into the stereo buffer with constant-power pan (-1 … 1). */
export function mix(buf, start, samples, gain = 1, pan = 0) {
  const i0 = Math.round(start * SR);
  const l = Math.cos(((pan + 1) * Math.PI) / 4) * gain;
  const r = Math.sin(((pan + 1) * Math.PI) / 4) * gain;
  for (let i = 0; i < samples.length; i++) {
    const k = i0 + i;
    if (k < 0 || k >= buf.n) continue;
    buf.L[k] += samples[i] * l;
    buf.R[k] += samples[i] * r;
  }
}

/** Render a mono voice: fn(t, i) → sample, for `seconds`. */
export function render(seconds, fn) {
  const n = Math.max(1, Math.round(seconds * SR));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i);
  return out;
}

/** Freeverb-style stereo reverb (8 combs + 4 allpasses per side). Returns a new wet buffer. */
export function reverb(buf, { room = 0.78, damp = 0.35, wet = 1 } = {}) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const alls = [556, 441, 341, 225];
  const scale = SR / 44100;
  const side = (input, spread) => {
    const out = new Float32Array(input.length);
    const cs = combs.map((c) => ({ b: new Float32Array(Math.round((c + spread) * scale)), i: 0, f: 0 }));
    const as = alls.map((a) => ({ b: new Float32Array(Math.round((a + spread) * scale)), i: 0 }));
    for (let n = 0; n < input.length; n++) {
      const x = input[n] * 0.015;
      let y = 0;
      for (const c of cs) {
        const o = c.b[c.i];
        c.f = o * (1 - damp) + c.f * damp;
        c.b[c.i] = x + c.f * room;
        c.i = (c.i + 1) % c.b.length;
        y += o;
      }
      for (const a of as) {
        const o = a.b[a.i];
        a.b[a.i] = y + o * 0.5;
        a.i = (a.i + 1) % a.b.length;
        y = o - y;
      }
      out[n] = y * wet;
    }
    return out;
  };
  return { L: side(buf.L, 0), R: side(buf.R, 23), n: buf.n };
}

/** Stereo ping-pong delay (seconds), feedback, low-passed repeats. */
export function pingpong(buf, time, feedback = 0.38, tone = 3500) {
  const d = Math.round(time * SR);
  const L = new Float32Array(buf.n);
  const R = new Float32Array(buf.n);
  const lpL = biquad('lp', tone);
  const lpR = biquad('lp', tone);
  for (let i = 0; i < buf.n; i++) {
    const inL = buf.L[i] + buf.R[i];
    const fromR = i >= d ? R[i - d] : 0;
    const fromL = i >= d ? L[i - d] : 0;
    L[i] = lpL.process(inL * 0.5 + fromR * feedback);
    R[i] = lpR.process(fromL);
  }
  return { L, R, n: buf.n };
}

export function addInto(dst, src, gain = 1) {
  for (let i = 0; i < dst.n; i++) {
    dst.L[i] += src.L[i] * gain;
    dst.R[i] += src.R[i] * gain;
  }
}

/** Multiply a bus by a gain curve g(t) (sidechain ducking, fades). */
export function shape(buf, g) {
  for (let i = 0; i < buf.n; i++) {
    const k = g(i / SR);
    buf.L[i] *= k;
    buf.R[i] *= k;
  }
}

/** Look-ahead peak limiter (sample peak), plus 4× oversampled true-peak estimate. */
export function limit(buf, ceiling = 0.84, lookahead = 0.004, release = 0.08) {
  const la = Math.round(lookahead * SR);
  const rel = Math.exp(-1 / (release * SR));
  const n = buf.n;
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(buf.L[i]), Math.abs(buf.R[i]));
    need[i] = p > ceiling ? ceiling / p : 1;
  }
  // gain(i) = min need over [i, i+la], smoothed with fast attack / slow release
  let g = 1;
  const out = { L: new Float32Array(n), R: new Float32Array(n), n };
  const win = [];
  for (let i = 0; i < n + la; i++) {
    if (i < n) {
      while (win.length && win[win.length - 1][1] >= need[i]) win.pop();
      win.push([i, need[i]]);
    }
    const j = i - la;
    if (j < 0) continue;
    while (win.length && win[0][0] < j) win.shift();
    const target = win.length ? win[0][1] : 1;
    g = target < g ? target : target + (g - target) * rel;
    out.L[j] = buf.L[j] * g;
    out.R[j] = buf.R[j] * g;
  }
  return out;
}

export function truePeak(buf) {
  // 4× linear-phase-ish interpolation (cubic Hermite) — a close, conservative estimate.
  let peak = 0;
  for (const ch of [buf.L, buf.R]) {
    for (let i = 1; i < ch.length - 2; i++) {
      const y0 = ch[i - 1];
      const y1 = ch[i];
      const y2 = ch[i + 1];
      const y3 = ch[i + 2];
      for (let k = 0; k < 4; k++) {
        const t = k / 4;
        const c0 = y1;
        const c1 = 0.5 * (y2 - y0);
        const c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
        const c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
        const v = Math.abs(((c3 * t + c2) * t + c1) * t + c0);
        if (v > peak) peak = v;
      }
    }
  }
  return peak;
}

/** 16-bit PCM stereo WAV. */
export function wav(buf) {
  const n = buf.n;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, buf.L[i]));
    const r = Math.max(-1, Math.min(1, buf.R[i]));
    data.writeInt16LE(Math.round(l * 32767), i * 4);
    data.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
