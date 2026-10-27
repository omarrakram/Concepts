/**
 * The V2 film's soundtrack: the original score (lib/score.mjs, 120 BPM: the
 * groove from 2.0 s, the hook melody 10–18 s under the product and ADD TO BAG,
 * the 2:13 AM breakdown 18–20 s under PJOYS, the drop at 22.0 s for IYS MOBILE,
 * double time for the montage, the C major finish at 27.0) plus sounds placed
 * from the takes themselves: a click at every real press and a tap at every
 * real tap the edit shows, the site's own UI sounds where the site plays them
 * (lib/sfx.mjs UI = src/lib/sound.ts recipes), and a few film sounds (CRT
 * power-on, whooshes on the big camera moves). The site's sound setting stays
 * OFF by default; this track is separate from the site.
 *
 * Writes out/v2-film/final/<NAME>-audio.wav (48 kHz, exactly 30.000 s) + -cues.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, FRAMES, NAME, OUT_DIR, TAKES_DIR, buildShots, loadTakes } from './edit-v2.mjs';
import { masterTo } from './lib/master.mjs';
import { score } from './lib/score.mjs';
import { FILM, UI } from './lib/sfx.mjs';
import { SR, buffer, mix, shape } from './lib/synth.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT = resolve(ROOT, OUT_DIR);
mkdirSync(OUT, { recursive: true });
const SECONDS = FRAMES / FPS;
const takes = loadTakes(resolve(ROOT, TAKES_DIR));
const SHOTS = buildShots(takes);

/** Output times at which take frame `f` is on screen (the first frame of each shot showing it). */
function whenShown(takeId, f) {
  const out = [];
  for (const s of SHOTS) {
    if (s.take !== takeId || !s.map) continue;
    for (let i = 1; i < s.map.length; i++) {
      const [t0, a] = s.map[i - 1];
      const [t1, b] = s.map[i];
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
  if (t !== undefined && t >= 0 && t < SECONDS - 0.05) cues.push({ t: +t.toFixed(4), name, gain, pan });
};
const at = (takeId, mark, d = 0) => whenShown(takeId, takes[takeId].marks[mark] + d)[0];

// 1. every real press / tap the edit shows
for (const [id, take] of Object.entries(takes)) {
  take.meta.forEach((m, f) => {
    const prev = take.meta[f - 1];
    if (m.down && !prev?.down) for (const t of whenShown(id, f)) cue(t, 'click', 0.5, (m.x / take.viewport.width - 0.5) * 0.6);
    if (m.touch && m.touch.t0 === f) for (const t of whenShown(id, f)) cue(t, 'tap', 0.75, (m.touch.x / take.viewport.width - 0.5) * 0.5);
  });
}
// 2. the site's own sounds, where the site plays them
for (const [take, mark, d, name, gain] of [
  ['w-shop', 'click', 3, 'open', 0.55], // IYS INTERNET window
  ['w-shop', 'sizeGuideClick', 3, 'open', 0.5], // SIZE GUIDE window
  ['w-shop', 'addClick', 1, 'done', 0.85], // addToBag(): play('done')
  ['w-shop', 'guideClose', 1, 'close', 0.5],
  ['w-shop', 'bagClick', 2, 'open', 0.5], // MY BAG window
  ['w-explore', 'desktopClick', 2, 'minimize', 0.5],
  ['w-explore', 'wardrobeClick', 4, 'open', 0.5], // the shot opens on the window appearing
  ['w-explore', 'balloon', 2, 'ping', 0.6], // PJOYS' ping, on the shot's first frame
  ['w-explore', 'chatClick', 2, 'open', 0.45],
  ['w-play', 'gamesClick', 2, 'open', 0.5],
  ['w-play', 'cameraClick', 2, 'open', 0.5],
  ['w-play', 'controlClick', 2, 'open', 0.5],
]) cue(at(take, mark, d), name, gain);
// typing هودي: one soft key per letter shown, then Enter
for (let k = 0; k < 4; k++) cue(at('w-explore', 'typing', k * 5), 'key', 0.7, 0.1);
cue(at('w-explore', 'enter'), 'key', 0.8);
// the copy dialog's data trickle under ADD TO BAG
const add = at('w-shop', 'addClick', 2);
if (add !== undefined) cue(add + 0.05, 'copying', 0.9, -0.15);
// 3. film-only sound design
cue(0, 'crtOn', 0.9);
cue(1.32, 'whooshUp', 0.55); // the push into the desktop
cue(2.36, 'whoosh', 0.26); // whip across the strip to the IYS INTERNET icon
cue(3.1, 'whoosh', 0.3); // following the window
cue(9.37, 'whoosh', 0.25); // the pull back for the whole SIZE GUIDE window
cue(10.22, 'whoosh', 0.28); // whip to the properties column
cue(21.82, 'whooshUp', 0.7); // into the transformation
cue(26.86, 'whooshUp', 0.55); // into the poster

const VOICES = {
  click: UI.click,
  open: UI.open,
  close: UI.close,
  minimize: UI.minimize,
  ping: UI.ping,
  done: UI.done,
  crtOn: FILM.crtOn,
  key: () => FILM.key(0.4),
  tap: () => FILM.tap(0.35),
  copying: () => FILM.copying(0.62, 0.1),
  whoosh: () => FILM.whoosh(0.3, false, 0.35),
  whooshUp: () => FILM.whoosh(0.34, true, 0.45),
};

const music = score(SECONDS);
const fx = buffer(SECONDS);
const rendered = new Map();
cues.sort((a, b) => a.t - b.t);
for (const c of cues) {
  if (!rendered.has(c.name)) rendered.set(c.name, VOICES[c.name]());
  mix(fx, c.t, rendered.get(c.name), c.gain, c.pan);
}
// give the moments that should be heard a little room
const ducks = cues.filter((c) => c.name === 'done' || c.name === 'ping').map((c) => c.t);
shape(music, (t) => {
  let g = 1;
  for (const d of ducks) {
    const u = t - d;
    if (u > -0.03 && u < 0.45) g = Math.min(g, 0.62 + (0.38 * Math.max(0, u - 0.15)) / 0.3);
  }
  return g;
});
const master = buffer(SECONDS);
for (let i = 0; i < master.n; i++) {
  master.L[i] = music.L[i] * 0.82 + fx.L[i] * 0.95;
  master.R[i] = music.R[i] * 0.82 + fx.R[i] * 0.95;
}
const FILE = resolve(OUT, `${NAME}-audio.wav`);
const result = masterTo(FILE, master, SECONDS);
writeFileSync(resolve(OUT, `${NAME}-cues.json`), JSON.stringify({ sampleRate: SR, seconds: SECONDS, fps: FPS, master: result, cues }, null, 1));
console.log(`[audio] ✓ ${cues.length} cues → ${FILE}`);
