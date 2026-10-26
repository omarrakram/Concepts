/**
 * npm run film30:audio
 *
 * The film's soundtrack: the original score (lib/score.mjs) + sound effects
 * placed from the takes themselves. Every real mouse press / tap in a take
 * becomes a click / tap at the exact output time the edit shows it; the
 * site's own UI sounds (lib/sfx.mjs UI = src/lib/sound.ts recipes) play where
 * the site would play them if its sound were on (window open, ADD TO BAG
 * "done", PJOYS "ping"...). The site's own sound setting stays OFF by
 * default: this track is separate from the site.
 *
 * Writes out/showcase-30/iys-internet-2006-30s-audio.wav (48 kHz, 16-bit,
 * exactly 30.000 s) + audio-cues.json. Mastered to about -14 LUFS, true
 * peak under -1 dBTP (checked with FFmpeg's EBU R128 meter).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, SHOTS, loadTakes } from './edit.mjs';
import { score } from './lib/score.mjs';
import { FILM, UI } from './lib/sfx.mjs';
import { SR, buffer, limit, mix, shape, truePeak, wav } from './lib/synth.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT = resolve(ROOT, 'out/showcase-30');
const SECONDS = 30;
mkdirSync(OUT, { recursive: true });
const takes = loadTakes(resolve(OUT, 'takes'));

// ── where each take frame appears in the edit (inverse of the shot maps) ──
const frameOf = (take, v) => {
  if (typeof v === 'number') return v;
  const m = /^([a-zA-Z0-9]+)([+-]\d+)?$/.exec(v);
  return take.marks[m[1]] + Number(m[2] ?? 0);
};
/** Output times at which `take` frame `f` is on screen (first frame of each shot that shows it). */
function whenShown(takeId, f) {
  const out = [];
  for (const s of SHOTS) {
    if (s.take !== takeId || s.kind === 'card') continue;
    const take = takes[takeId];
    const keys = s.map.map(([t, v]) => [t, frameOf(take, v)]);
    for (let i = 1; i < keys.length; i++) {
      const [t0, a] = keys[i - 1];
      const [t1, b] = keys[i];
      if (b === a) continue;
      if (f >= Math.min(a, b) && f < Math.max(a, b)) {
        const t = t0 + ((f - a) / (b - a)) * (t1 - t0);
        if (t >= s.t0 && t < s.t1) out.push(t);
      }
    }
  }
  return out;
}

const cues = [];
const cue = (t, name, gain = 1, pan = 0) => {
  if (t >= 0 && t < SECONDS) cues.push({ t: +t.toFixed(4), name, gain, pan });
};

// 1. every real press / tap that the edit shows
for (const [id, take] of Object.entries(takes)) {
  take.meta.forEach((m, f) => {
    const prev = take.meta[f - 1];
    if (m.down && !prev?.down) for (const t of whenShown(id, f)) cue(t, 'click', 0.55, (m.x / take.viewport.width - 0.5) * 0.6);
    if (m.touch && m.touch.t0 === f) for (const t of whenShown(id, f)) cue(t, 'tap', 0.8, (m.touch.x / take.viewport.width - 0.5) * 0.5);
  });
}
// 2. the site's own sounds, where the site plays them
const at = (takeId, mark, d = 0) => whenShown(takeId, frameOf(takes[takeId], mark) + d)[0];
const site = [
  ['desktop-a', 'obviously', 2, 'open', 0.55], // IYS INTERNET window
  ['desktop-a', 'sizeGuideClick', 3, 'open', 0.5], // SIZE GUIDE window
  ['desktop-a', 'addClick', 1, 'done', 0.8], // addToBag(): play('done')
  ['desktop-a', 'bagClick', 2, 'open', 0.5], // MY BAG window
  ['desktop-b', 'resultClick', 1, 'click', 0.4],
  ['desktop-b', 'desktopClick', 2, 'minimize', 0.5],
  ['desktop-b', 'wardrobeClick', 2, 'open', 0.5],
  ['desktop-b', 'desktop2Click', 2, 'minimize', 0.5],
  ['desktop-c', 'gamesClick', 2, 'open', 0.5],
  ['desktop-c', 'controlClick', 2, 'open', 0.5],
  ['desktop-c', 'applyClick', 1, 'done', 0.6], // Control Panel Apply: play('done')
];
for (const [take, mark, d, name, gain] of site) {
  const t = at(take, mark, d);
  if (t !== undefined) cue(t, name, gain);
}
// picking Catchy up is a real press too (mouse.down without the click helper)
{
  const t = at('desktop-b', 'grab');
  if (t !== undefined) cue(t, 'click', 0.5);
}
// PJOYS' first line pings (Chat.tsx) — the chat shot opens on it
cue(SHOTS.find((s) => s.id === 'chat').t0 + 0.02, 'ping', 0.6, 0.3);
// typing هودي (take B): one soft key per letter shown
for (let k = 0; k < 4; k++) {
  const t = at('desktop-b', 'typing', k * 5);
  if (t !== undefined) cue(t, 'key', 0.7, 0.1);
}
const enter = at('desktop-b', 'enter');
if (enter !== undefined) cue(enter, 'key', 0.8);
// the copy dialog's data trickle under ADD TO BAG
const add = at('desktop-a', 'addClick', 2);
if (add !== undefined) cue(add + 0.05, 'copying', 0.9, -0.15);
// 3. film-only sound design
cue(0, 'crtOn', 0.9);
cue(0.02, 'boot', 0.75); // the boot's own chime (Boot.tsx plays it on the CRT flash)
const modemAt = whenShown('desktop-a', 52)[0];
if (modemAt !== undefined) cue(modemAt, 'modem', 0.6); // Boot.tsx: play('modem') with TIME TARGET: 2006
for (const s of SHOTS)
  for (const [kind, t0, , amt] of s.fx ?? []) {
    if (kind === 'glitch') cue(t0, 'glitch', 0.5);
    if (kind === 'flash' && amt >= 0.45 && t0 > 1) cue(t0 - 0.12, 'whoosh', 0.45, 0);
  }
cue(21.82, 'whooshUp', 0.7);
cue(26.86, 'whooshUp', 0.55);

const VOICES = {
  click: UI.click,
  open: UI.open,
  close: UI.close,
  minimize: UI.minimize,
  ping: UI.ping,
  done: UI.done,
  boot: UI.boot,
  modem: UI.modem,
  crtOn: FILM.crtOn,
  key: () => FILM.key(0.4),
  tap: () => FILM.tap(0.35),
  copying: () => FILM.copying(0.62, 0.1),
  glitch: () => FILM.glitch(0.09, 0.22),
  whoosh: () => FILM.whoosh(0.3, false, 0.35),
  whooshUp: () => FILM.whoosh(0.34, true, 0.45),
};

// ── mix ──
const music = score(SECONDS);
const fx = buffer(SECONDS);
const rendered = new Map();
cues.sort((a, b) => a.t - b.t);
for (const c of cues) {
  if (!rendered.has(c.name)) rendered.set(c.name, VOICES[c.name]());
  mix(fx, c.t, rendered.get(c.name), c.gain, c.pan);
}
// duck the music a little under the moments that should be heard
const ducks = cues.filter((c) => c.name === 'done' || c.name === 'ping' || c.name === 'boot').map((c) => c.t);
shape(music, (t) => {
  let g = 1;
  for (const d of ducks) {
    const u = t - d;
    if (u > -0.03 && u < 0.45) g = Math.min(g, 0.62 + 0.38 * Math.max(0, u - 0.15) / 0.3);
  }
  return g;
});
const master = buffer(SECONDS);
for (let i = 0; i < master.n; i++) {
  master.L[i] = music.L[i] * 0.82 + fx.L[i] * 0.95;
  master.R[i] = music.R[i] * 0.82 + fx.R[i] * 0.95;
}

// ── master: gain → soft clip → limiter → measure → repeat until about -14 LUFS ──
const FILE = resolve(OUT, 'iys-internet-2006-30s-audio.wav');
const measure = () => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', FILE, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const sum = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  return { lufs: Number(/I:\s+(-?[\d.]+) LUFS/.exec(sum)[1]), tp: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(sum)[1]) };
};
let ceilDb = -1.6;
let gain = 1.6;
let result;
for (let pass = 0; pass < 8; pass++) {
  const CEIL = Math.pow(10, ceilDb / 20);
  const b = buffer(SECONDS);
  for (let i = 0; i < b.n; i++) {
    b.L[i] = Math.tanh(master.L[i] * gain * 0.9) / 0.9;
    b.R[i] = Math.tanh(master.R[i] * gain * 0.9) / 0.9;
  }
  const out = limit(b, CEIL, 0.004, 0.09);
  writeFileSync(FILE, wav(out));
  result = { ...measure(), estTp: 20 * Math.log10(truePeak(out)), gain, ceilingDb: ceilDb };
  console.log(`[audio] pass ${pass}: gain ${gain.toFixed(3)}, ceiling ${ceilDb.toFixed(2)} dBFS → ${result.lufs} LUFS, true peak ${result.tp} dBTP`);
  if (Math.abs(result.lufs + 14) <= 0.3 && result.tp <= -1.2) break;
  if (result.tp > -1.2) ceilDb -= result.tp + 1.4; // inter-sample overs: pull the sample ceiling down
  gain *= Math.pow(10, (-14 - result.lufs) / 20);
}
writeFileSync(resolve(OUT, 'audio-cues.json'), JSON.stringify({ sampleRate: SR, seconds: SECONDS, fps: FPS, master: result, cues }, null, 1));
console.log(`[audio] ✓ ${cues.length} cues → ${FILE}`);
