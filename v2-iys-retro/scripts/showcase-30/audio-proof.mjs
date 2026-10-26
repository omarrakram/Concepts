/**
 * The 5-second proof's soundtrack: the first five seconds of the film's
 * original score (lib/score.mjs: the intro pad and riser, the groove landing
 * on the 2.0 s downbeat with the real click), faded out at the end, plus
 * sounds placed from the take's own marks: the CRT power-on, the push-in,
 * the site's own click and window-open sounds (lib/sfx.mjs UI = the site's
 * src/lib/sound.ts recipes), soft whooshes on the camera moves. The site's
 * sound setting stays OFF; this track is separate from the site.
 *
 * Writes out/v2-film/proof/<NAME>-audio.wav (48 kHz, exactly 5.000 s) + -cues.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, FRAMES, NAME, OUT_DIR, TAKES_DIR, loadTakes } from './edit-proof.mjs';
import { masterTo } from './lib/master.mjs';
import { score } from './lib/score.mjs';
import { FILM, UI } from './lib/sfx.mjs';
import { SR, buffer, mix } from './lib/synth.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT = resolve(ROOT, OUT_DIR);
mkdirSync(OUT, { recursive: true });
const SECONDS = FRAMES / FPS;
const M = loadTakes(resolve(ROOT, TAKES_DIR)).proof.marks;
const at = (frame) => frame / FPS; // the proof plays the take at real speed

const cues = [
  { t: 0.0, name: 'crtOn', gain: 0.85 },
  { t: 0.7, name: 'whooshUp', gain: 0.7 },
  { t: at(M.click), name: 'click', gain: 1 },
  { t: at(M.open), name: 'open', gain: 0.9 },
  { t: at(M.click) + 0.06, name: 'whoosh', gain: 0.35 },
  { t: at(M.home) + 0.02, name: 'whoosh', gain: 0.4 },
  { t: at(M.scroll), name: 'whoosh', gain: 0.3 },
];
const VOICES = {
  crtOn: FILM.crtOn,
  click: UI.click,
  open: UI.open,
  whoosh: () => FILM.whoosh(0.3, false, 0.35),
  whooshUp: () => FILM.whoosh(0.34, true, 0.45),
};

// the score's opening, cut to length with an equal-power fade over the last 0.45 s
const full = score(30);
const music = buffer(SECONDS);
const fade0 = SECONDS - 0.45;
for (let i = 0; i < music.n; i++) {
  const t = i / SR;
  const g = t < fade0 ? 1 : Math.cos(((t - fade0) / (SECONDS - fade0)) * (Math.PI / 2));
  music.L[i] = full.L[i] * g;
  music.R[i] = full.R[i] * g;
}
const fx = buffer(SECONDS);
for (const c of cues) mix(fx, c.t, VOICES[c.name](), c.gain, 0);
const master = buffer(SECONDS);
for (let i = 0; i < master.n; i++) {
  master.L[i] = music.L[i] * 0.82 + fx.L[i] * 0.95;
  master.R[i] = music.R[i] * 0.82 + fx.R[i] * 0.95;
}
const FILE = resolve(OUT, `${NAME}-audio.wav`);
const result = masterTo(FILE, master, SECONDS);
writeFileSync(resolve(OUT, `${NAME}-cues.json`), JSON.stringify({ sampleRate: SR, seconds: SECONDS, master: result, cues }, null, 1));
console.log(`[audio] ✓ ${cues.length} cues → ${FILE}`);
