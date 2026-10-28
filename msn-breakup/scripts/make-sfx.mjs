/**
 * npm run sfx
 *
 * Writes the reel's sound effects to public/sfx/*.wav. Every sound is
 * synthesised here from sine/square/noise primitives: ORIGINAL sounds that
 * evoke a 2006 messenger (a two-note "new message" chime, a rising sign-in
 * chime, a buzzing nudge, keyboard and mouse clicks), never Microsoft's own
 * recordings. Deterministic: same code in, same bytes out (seeded noise).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/sfx');
mkdirSync(out, { recursive: true });

/** A seeded PRNG (mulberry32), so the noise is the same on every run. */
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

function wav(name, seconds, fill) {
  const n = Math.round(seconds * RATE);
  const buf = new Float32Array(n);
  fill(buf);
  // soft limiter + gentle fade-out so nothing clicks
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0.89 ? 0.89 / peak : 1;
  const fade = Math.round(0.006 * RATE);
  const data = Buffer.alloc(44 + n * 2);
  data.write('RIFF', 0);
  data.writeUInt32LE(36 + n * 2, 4);
  data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(RATE, 24);
  data.writeUInt32LE(RATE * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write('data', 36);
  data.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const f = i > n - fade ? (n - i) / fade : 1;
    const s = Math.max(-1, Math.min(1, buf[i] * gain * f));
    data.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  writeFileSync(resolve(out, `${name}.wav`), data);
  console.log(`sfx ${name}.wav ${seconds}s`);
}

/** A soft bell / marimba tone: sine + a little 2nd and 3rd partial, quick attack, exponential decay. */
function bell(buf, t0, freq, { amp = 0.5, decay = 7, bright = 0.25, fm = 0 } = {}) {
  const s0 = Math.round(t0 * RATE);
  for (let i = s0; i < buf.length; i++) {
    const t = (i - s0) / RATE;
    const env = Math.min(1, t / 0.004) * Math.exp(-decay * t);
    if (t > 0.004 && env < 1e-4) break; // (not during the attack, where env starts at 0)
    const mod = fm ? Math.sin(2 * Math.PI * freq * 2 * t) * fm * Math.exp(-12 * t) : 0;
    const v = Math.sin(2 * Math.PI * freq * t + mod) + bright * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-14 * t) + 0.08 * Math.sin(2 * Math.PI * freq * 3.01 * t) * Math.exp(-20 * t);
    buf[i] += amp * env * v;
  }
}

// New message: a quick, glassy two-note "di-dum" (falling fifth).
wav('message', 0.75, (b) => {
  bell(b, 0.0, 1318.5, { amp: 0.42, decay: 9, bright: 0.3, fm: 0.6 });
  bell(b, 0.085, 880, { amp: 0.5, decay: 6.5, bright: 0.25, fm: 0.4 });
});

// Contact signed in: a rising three-note chime.
wav('online', 0.95, (b) => {
  bell(b, 0.0, 784, { amp: 0.32, decay: 7, bright: 0.2, fm: 0.3 });
  bell(b, 0.09, 1046.5, { amp: 0.34, decay: 6.5, bright: 0.2, fm: 0.3 });
  bell(b, 0.18, 1568, { amp: 0.36, decay: 5, bright: 0.18, fm: 0.25 });
});

// The small popup ("is listening to"): one soft, low "pop".
wav('toast', 0.5, (b) => {
  bell(b, 0.0, 659.3, { amp: 0.3, decay: 8, bright: 0.12, fm: 0.2 });
});

// Nudge: a buzzing rattle that shakes and dies away.
wav('nudge', 0.95, (b) => {
  const r = rng(7);
  for (let i = 0; i < b.length; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.01) * (t < 0.62 ? 1 : Math.exp(-14 * (t - 0.62)));
    const rattle = 0.55 + 0.45 * Math.sign(Math.sin(2 * Math.PI * 21 * t));
    const buzz = Math.sign(Math.sin(2 * Math.PI * 62 * t)) * 0.35 + Math.sin(2 * Math.PI * 124 * t) * 0.25;
    const grit = (r() * 2 - 1) * 0.22;
    b[i] = env * rattle * (buzz + grit) * 0.8;
  }
  // a tiny low-pass so the square edges sound like plastic, not a synth
  let y = 0;
  for (let i = 0; i < b.length; i++) b[i] = y += (b[i] - y) * 0.18;
});

// Keyboard: three short plastic clicks (filtered noise + a tiny thump).
for (const [k, seed, tone] of [[1, 11, 2900], [2, 23, 3400], [3, 37, 2500]]) {
  wav(`key${k}`, 0.06, (b) => {
    const r = rng(seed);
    let y = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / RATE;
      const env = Math.exp(-90 * t);
      const noise = r() * 2 - 1;
      y += (noise - y) * 0.45;
      b[i] = env * (0.55 * y + 0.35 * Math.sin(2 * Math.PI * tone * t) * Math.exp(-160 * t) + 0.3 * Math.sin(2 * Math.PI * 180 * t) * Math.exp(-60 * t));
    }
  });
}

// Mouse click (the Send button): a short double tick.
wav('click', 0.09, (b) => {
  const r = rng(5);
  for (const t0 of [0, 0.035]) {
    const s0 = Math.round(t0 * RATE);
    for (let i = s0; i < Math.min(b.length, s0 + 0.02 * RATE); i++) {
      const t = (i - s0) / RATE;
      b[i] += Math.exp(-220 * t) * ((r() * 2 - 1) * 0.5 + 0.5 * Math.sin(2 * Math.PI * 4200 * t)) * (t0 ? 0.55 : 0.8);
    }
  }
});

// The carousel's opening (a present-day screen that breaks into 2007): a soft, airy swell as it lights up.
wav('screen-on', 0.6, (b) => {
  const r = rng(41);
  let y = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.18) * Math.exp(-5 * Math.max(0, t - 0.18));
    y += (r() * 2 - 1 - y) * 0.04; // filtered air
    b[i] = env * (0.16 * Math.sin(2 * Math.PI * 523.25 * t) + 0.1 * Math.sin(2 * Math.PI * 784 * t) + 0.5 * y);
  }
});

// ...then it glitches: stuttering bursts of bit-crushed noise and buzz, with dead-air gaps.
wav('glitch', 0.9, (b) => {
  const r = rng(53);
  const bursts = [];
  for (let t = 0; t < 0.88; ) {
    const len = 0.025 + r() * 0.07;
    bursts.push([t, len, 90 + r() * 900, r()]);
    t += len + r() * 0.05;
  }
  for (const [t0, len, freq, kind] of bursts) {
    const s0 = Math.round(t0 * RATE);
    const n = Math.round(len * RATE);
    const hold = 4 + Math.floor(kind * 40); // sample-and-hold: the "bit-crush"
    let held = 0;
    for (let i = 0; i < n && s0 + i < b.length; i++) {
      const t = i / RATE;
      if (i % hold === 0) held = kind > 0.45 ? r() * 2 - 1 : Math.sign(Math.sin(2 * Math.PI * freq * t));
      b[s0 + i] += held * 0.55 * Math.min(1, (n - i) / 60) * (0.6 + 0.4 * (t0 / 0.88));
    }
  }
});

// ...and crashes: the picture collapses like an old monitor switching off (a falling zap and a thump).
wav('crash', 0.6, (b) => {
  const r = rng(67);
  let phase = 0;
  let y = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / RATE;
    const f = 60 + 1500 * Math.exp(-14 * t);
    phase += (2 * Math.PI * f) / RATE;
    y += (r() * 2 - 1 - y) * 0.3;
    const zap = Math.sin(phase) * Math.exp(-7 * t) * 0.5;
    const thump = Math.sin(2 * Math.PI * 48 * t) * Math.exp(-11 * t) * 0.6;
    b[i] = zap + thump + y * 0.35 * Math.exp(-18 * t);
  }
});

// ...and the old computer comes on: a CRT's degauss, a thunk and a buzzing hum that wobbles and dies away.
wav('degauss', 0.9, (b) => {
  const r = rng(79);
  let y = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / RATE;
    const env = Math.min(1, t / 0.008) * Math.exp(-4.2 * t);
    const wob = 1 + 0.35 * Math.sin(2 * Math.PI * 7 * t) * Math.exp(-3 * t);
    const hum = 0.5 * Math.sin(2 * Math.PI * 60 * t) + 0.3 * wob * Math.sin(2 * Math.PI * 180 * t) + 0.15 * Math.sin(2 * Math.PI * 300 * t) + 0.08 * Math.sin(2 * Math.PI * 420 * t);
    const thunk = Math.sin(2 * Math.PI * 38 * t) * Math.exp(-16 * t) * 0.7;
    y += (r() * 2 - 1 - y) * 0.05;
    b[i] = env * hum * 0.55 + thunk + y * 0.12 * Math.exp(-9 * t);
  }
});

// QA only (npm run render:reel -- --props='{"cueTone":true}'): a sharp marker tone at the music cue.
wav('cue-tone', 0.25, (b) => {
  for (let i = 0; i < b.length; i++) b[i] = 0.6 * Math.sin((2 * Math.PI * 1000 * i) / RATE) * Math.min(1, (b.length - i) / 400);
});
