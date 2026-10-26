/**
 * THE 5-SECOND SOURCE PROOF (V2): 1080×1920, 60 fps, 300 frames, one take
 * (takes-v2/proof.mjs: desktop 1440×900 @3x of the conversion-upgrade source),
 * played at real speed (output frame n = take frame n). One continuous camera:
 *
 *   0.00–0.25  the monitor powers on: the whole real desktop, wide, in a dark room
 *   0.25–0.70  hold on the full OS (wallpaper, icons both sides, top strip, taskbar, Catchy)
 *   0.70–1.05  push in to the top right, where the cursor rests on MY BAG
 *   1.03–2.00  the camera rides with the cursor along the top strip: MY BAG → a hover on
 *              the IYS 2006 / REAL IYS switch → the IYS INTERNET icon, past MENU
 *   2.00       the real click, on the downbeat
 *   2.06–2.30  follow the window to the site's own "Loading IYS INTERNET..."
 *   2.39–2.82  the homepage fades in; pull back to its left column (window title,
 *              IN YOUR SHOE, SHOP BY CATEGORY, the new drop, the FW27 campaign)
 *   2.82–3.03  hold on the homepage
 *   3.03–3.93  a real scroll; the camera pushes into JUST DROPPED ✧ FRESH 4 U
 *   3.93–5.00  four real products, the cursor resting on one
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { view, wideOps } from './lib/wide.mjs';

export const NAME = 'IYS-RETRO-V2-PROOF-5S-1080x1920';
export const FPS = 60;
export const FRAMES = 300;
export const W = 1080;
export const H = 1920;
export const TAKES_DIR = 'out/v2-film/takes';
export const OUT_DIR = 'out/v2-film/proof';
export const SOURCE_PUBLIC = true; // cursor art etc. from the source checkout's public/
export const SHOTS = [{ id: 'proof', t0: 0, t1: FRAMES / FPS, take: 'proof' }];

export function loadTakes(dir) {
  const t = JSON.parse(readFileSync(resolve(dir, 'proof', 'take.json'), 'utf8'));
  t.id = 'proof';
  return { proof: t };
}

const clamp01 = (k) => Math.max(0, Math.min(1, k));
const inOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const outC = (k) => 1 - Math.pow(1 - k, 3);
const lerp = (a, b, k) => a + (b - a) * k;
const span = (t, a, b, ease = inOut) => ease(clamp01((t - a) / (b - a)));
/** Zoom moves feel even when interpolated in log space. */
const zoom = (a, b, k) => Math.exp(lerp(Math.log(a), Math.log(b), k));

export function makePlanner(takes, { base = '' } = {}) {
  const take = takes.proof;
  const { width: vw, height: vh } = take.viewport;
  const dsf = take.dsf;
  const M = take.marks;
  const url = (f) => `${base}/takes/proof/${take.frames[Math.max(0, Math.min(take.frames.length - 1, f))]}`;
  const meta = (f) => take.meta[Math.max(0, Math.min(take.meta.length - 1, f))];
  const tOf = (frame) => frame / FPS;

  // The camera, as a function of output time (the take plays at real speed: frame = t·60).
  // Framings are in the take's CSS px, measured on its frames (1440×900).
  const T = { push0: 0.7, push1: 1.05, click: tOf(M.click), loader: tOf(M.click) + 0.3, reveal: tOf(M.home) + 0.02, home: tOf(M.home) + 0.55, scroll: tOf(M.scroll), products: tOf(M.products) };
  // Riding the top strip: look 100 px above the screen's top edge (free framing), so MENU,
  // IYS 2006 / REAL IYS and MY BAG sit ~250 px down, below the area social apps cover.
  const STRIP = { cy: 284, s: 2.5, free: 1 };
  const follow = (t) => {
    // trail the cursor gently: the average of its last 8 positions
    const f = Math.round(t * FPS);
    let x = 0;
    for (let i = 0; i < 8; i++) x += meta(f - i).x;
    return { cx: x / 8, ...STRIP };
  };
  // The site's own loading state: "Loading IYS INTERNET..." and its red progress bar (x 620–820, y 105–188).
  const LOADER = { cx: 720, cy: 330, s: 2.7, free: 0 };
  // The homepage's left column, whole: window title, IN YOUR SHOE, SHOP BY CATEGORY, "omg new drop just landed :)".
  const HOME = { cx: 453, cy: 450, s: 1920 / 900, free: 0 };
  const HOME2 = { cx: 458, cy: 450, s: 2.17, free: 0 };
  // JUST DROPPED ✧ FRESH 4 U as a clean 2×2: the section title, Dropout Oversized Hoodie, Mustard Guarded
  // Boxy Zip-Up Hoodie, Off White and Butter Yellow Raglan Pullovers. x 413–715 (cards 418–711), y 197–733:
  // below the photo caption the scroll leaves at the top, nothing else in that band: no card, name or price cut.
  const SHELF = { cx: 564, cy: 465, s: 3.58, free: 0 };
  const SHELF2 = { cx: 564, cy: 465, s: 3.62, free: 0 };
  const mix = (a, b, k) => ({ cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: zoom(a.s, b.s, k), free: lerp(a.free ?? 0, b.free ?? 0, k) });

  function camera(t) {
    const WIDE = { cx: 720, cy: 450, s: lerp(0.7, 0.735, clamp01(t / T.push0)), free: 1 };
    if (t < T.push0) return WIDE;
    if (t < T.click) return mix(WIDE, follow(Math.max(t, T.push1)), span(t, T.push0, T.push1));
    const at = follow(T.click);
    if (t < T.loader) return mix(at, LOADER, span(t, T.click + 0.06, T.loader));
    if (t < T.reveal) return LOADER;
    if (t < T.home) return mix(LOADER, HOME, span(t, T.reveal, T.home));
    if (t < T.scroll) return mix(HOME, HOME2, span(t, T.home, T.scroll, (x) => x));
    if (t < T.products) return mix(HOME2, SHELF, span(t, T.scroll, T.products));
    return mix(SHELF, SHELF2, span(t, T.products, FRAMES / FPS, outC));
  }

  return {
    shotAt: () => SHOTS[0],
    camera,
    plan(n) {
      const t = n / FPS;
      const f = n; // real speed
      const v = view(camera(t), vw, vh, W, H);
      const prev = view(camera(t - 0.5 / FPS), vw, vh, W, H);
      const next = view(camera(t + 0.5 / FPS), vw, vh, W, H);
      const power = clamp01(t / 0.25);
      const ops = wideOps({ v, prev, next, src: url(f), vw, vh, dsf, W, H, meta: meta(f), power });
      return { n, shot: 'proof', ops };
    },
    sources(n) {
      return this.plan(n).ops.filter((o) => o.op === 'image').map((o) => o.src);
    },
  };
}

export function checkShots() {
  return true;
}
