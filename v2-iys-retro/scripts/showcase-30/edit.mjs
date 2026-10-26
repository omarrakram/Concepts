/**
 * THE EDIT: IYS INTERNET 2006, 30.000 s, 1080×1920, 60 fps = 1,800 frames.
 *
 * Every picture is a real frame of the site filmed by shoot.mjs. A shot says
 * which take, which source frames (`map`: output second → take frame, linear
 * in between, so 1:1 is real speed) and where the camera looks (`cam`:
 * output second → [x, y] centre in the take's CSS pixels and zoom z, where
 * z = 1 shows the whole screen). planFrame(n) turns that into drawing ops for
 * compositor/compositor.js. Beat grid: 120 BPM (0.5 s), see lib/score.mjs.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const FPS = 60;
export const FRAMES = 1800;
export const W = 1080;
export const H = 1920;

// ── the takes ────────────────────────────────────────────────────────
export function loadTakes(dir) {
  const takes = {};
  for (const id of ['desktop-a', 'desktop-b', 'desktop-c', 'morph', 'mobile']) {
    const t = JSON.parse(readFileSync(resolve(dir, id, 'take.json'), 'utf8'));
    t.id = id;
    takes[id] = t;
  }
  return takes;
}
/** 'addClick+6' → that take frame. */
function frameOf(take, v) {
  if (typeof v === 'number') return v;
  const m = /^([a-zA-Z0-9]+)([+-]\d+)?$/.exec(v);
  if (!m || take.marks[m[1]] === undefined) throw new Error(`edit: no mark "${v}" in ${take.id}`);
  return take.marks[m[1]] + Number(m[2] ?? 0);
}

// ── easing ───────────────────────────────────────────────────────────
const inOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const outC = (k) => 1 - Math.pow(1 - k, 3);
const clamp01 = (k) => Math.max(0, Math.min(1, k));
const lerp = (a, b, k) => a + (b - a) * k;
function piecewise(keys, t, ease = inOut) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, ...a] = keys[i - 1];
      const [t1, ...b] = keys[i];
      const k = ease(clamp01((t - t0) / (t1 - t0)));
      return a.map((v, j) => lerp(v, b[j], k));
    }
  }
  return keys[keys.length - 1].slice(1);
}
const linearMap = (keys, t) => piecewise(keys, t, (k) => k)[0];

// ── the shot list ─────────────────────────────────────────────────────
// cam keys: [t, x, y, z]  (CSS px of the take viewport; desktop 864×1536, mobile 405×720)
const D = { a: 'desktop-a', b: 'desktop-b', c: 'desktop-c' };
export const SHOTS = [
  // 0:00–0:01.5  HOOK — CRT power-on into the site's real boot (its own flash, POST lines, IN YOUR SHOE, TIME TARGET: 2006), real speed
  { id: 'hook', t0: 0, t1: 1.5, take: D.a, map: [[0, 9], [1.5, 99]], cam: [[0, 432, 760, 1.32], [0.55, 432, 770, 1.36], [0.95, 300, 862, 2.0], [1.3, 290, 866, 2.2], [1.5, 432, 768, 1.0]], fx: [['glow', 0, 1.5, 0.32], ['bloom', 0, 1.5, 0.5], ['crtOn', 0, 0.2]] },
  // 0:01.5–0:04  DESKTOP ALIVE — welcome "Obviously" → IYS INTERNET opens → MENU (real speed)
  { id: 'desktop', t0: 1.5, t1: 4.0, take: D.a, map: [[1.5, 112], [4.0, 262]], cam: [[1.5, 432, 768, 1.0], [1.9, 432, 770, 1.12], [2.3, 432, 770, 1.18], [2.62, 432, 768, 1.0], [2.86, 270, 470, 1.58], [3.6, 270, 470, 1.62], [4.0, 432, 700, 1.08]], fx: [['flash', 1.5, 0.12, 0.7], ['glitch', 1.49, 0.07]] },
  // 0:04–0:06.6  IYS INTERNET home: cool decision → JUST DROPPED → TOP 8 → PJOYS link
  { id: 'home', t0: 4.0, t1: 6.6, take: D.a, map: [[4.0, 262], [6.6, 418]], cam: [[4.0, 432, 700, 1.08], [4.45, 432, 720, 1.1], [5.1, 523, 700, 1.45], [6.0, 523, 700, 1.6], [6.4, 300, 420, 1.5], [6.6, 300, 420, 1.5]] },
  // 0:06.6–0:09  CLOTHES TAKE OVER: the PJOYS shelf → the hero card → its page
  { id: 'pjoys', t0: 6.6, t1: 8.05, take: D.a, map: [[6.6, 418], [8.05, 505]], cam: [[6.6, 432, 900, 1.22], [7.2, 432, 760, 1.3], [7.65, 260, 640, 1.65], [8.05, 230, 600, 1.9]], fx: [['flash', 6.6, 0.07, 0.35]] },
  { id: 'product', t0: 8.05, t1: 9.0, take: D.a, map: [[8.05, 505], [9.0, 562]], cam: [[8.05, 432, 780, 1.16], [9.0, 432, 790, 1.3]], fx: [['flash', 8.05, 0.08, 0.5]] },
  // 0:09–0:12.2  SHOPPING WORKS: properties → SIZE GUIDE → M → ADD TO BAG (the site's copy dialog)
  { id: 'props', t0: 9.0, t1: 9.55, take: D.a, map: [[9.0, 562], [9.55, 595]], cam: [[9.0, 432, 800, 1.3], [9.55, 270, 870, 1.66]] },
  { id: 'guide', t0: 9.55, t1: 10.35, take: D.a, map: [[9.55, 595], [10.35, 643]], cam: [[9.55, 270, 860, 1.66], [9.85, 250, 480, 1.8], [10.35, 250, 470, 1.95]] },
  { id: 'size', t0: 10.35, t1: 10.95, take: D.a, map: [[10.35, 643], [10.95, 679]], cam: [[10.35, 250, 860, 1.95], [10.95, 250, 860, 2.0]], fx: [['flash', 10.35, 0.06, 0.3]] },
  { id: 'add', t0: 10.95, t1: 12.3, take: D.a, map: [[10.95, 679], [12.3, 760]], cam: [[10.95, 250, 860, 2.0], [11.12, 250, 860, 2.0], [11.4, 432, 620, 1.95], [12.3, 432, 620, 2.1]] },
  // 0:12.2–0:14  MY BAG: the badge → the one real line, U MIGHT ALSO LIKE, CHECKOUT (never pressed)
  { id: 'bag', t0: 12.3, t1: 13.55, take: D.a, map: [[12.3, 794], [13.55, 869]], cam: [[12.3, 560, 600, 1.3], [12.62, 600, 640, 1.32], [12.95, 618, 1090, 1.6], [13.55, 618, 1110, 1.74]], fx: [['flash', 12.3, 0.06, 0.3]] },
  { id: 'checkout', t0: 13.55, t1: 14.0, take: D.a, map: [[13.55, 898], [14.0, 925]], cam: [[13.55, 618, 1250, 1.95], [14.0, 618, 1260, 2.05]] },
  // 0:14–0:16  SEARCH (Arabic) + FAVORITES
  { id: 'search', t0: 14.0, t1: 14.75, take: D.b, map: [[14.0, 40], [14.75, 100]], cam: [[14.0, 432, 420, 1.85], [14.4, 300, 440, 1.75], [14.75, 270, 480, 1.7]], fx: [['glitch', 13.99, 0.07], ['chroma', 13.99, 0.08, 7]] },
  { id: 'fav', t0: 14.75, t1: 15.3, take: D.b, map: [[14.75, 196], [15.3, 229]], cam: [[14.75, 230, 800, 1.95], [15.3, 230, 800, 2.05]], fx: [['flash', 14.75, 0.06, 0.3]] },
  { id: 'favs', t0: 15.3, t1: 16.0, take: D.b, map: [[15.3, 250], [16.0, 292]], cam: [[15.3, 300, 560, 1.5], [16.0, 300, 560, 1.6]] },
  // 0:16–0:18  OS PERSONALITY: DESKTOP → MY WARDROBE → CAIRO → STORES
  { id: 'desk2', t0: 16.0, t1: 16.55, take: D.b, map: [[16.0, 312], [16.55, 345]], cam: [[16.0, 432, 768, 1.2], [16.55, 432, 768, 1.0]], fx: [['glitch', 15.99, 0.06]] },
  { id: 'wardrobe', t0: 16.55, t1: 16.95, take: D.b, map: [[16.55, 352], [16.95, 376]], cam: [[16.55, 432, 768, 1.0], [16.95, 432, 700, 1.18]] },
  { id: 'cairo', t0: 16.95, t1: 17.35, take: D.b, map: [[16.95, 396], [17.35, 420]], cam: [[16.95, 432, 620, 1.45], [17.35, 432, 640, 1.55]], fx: [['flash', 16.95, 0.06, 0.3]] },
  { id: 'stores', t0: 17.35, t1: 18.0, take: D.b, map: [[17.35, 500], [18.0, 539]], cam: [[17.35, 300, 640, 1.45], [18.0, 300, 640, 1.6]], fx: [['flash', 17.35, 0.06, 0.3]] },
  // 0:18–0:20  PJOYS "u awake?" → IYS MESSENGER → a poke for Catchy
  { id: 'chat', t0: 18.0, t1: 18.55, take: D.b, map: [[18.0, 690], [18.55, 735]], cam: [[18.0, 460, 384, 2.0], [18.55, 460, 384, 2.08]], fx: [['glitch', 17.99, 0.06], ['chroma', 17.99, 0.06, 6]] },
  { id: 'chatFile', t0: 18.55, t1: 19.2, take: D.b, map: [[18.55, 790], [19.2, 862]], cam: [[18.55, 460, 400, 1.9], [19.2, 460, 420, 2.0]], fx: [['flash', 18.55, 0.06, 0.3]] },
  { id: 'carry', t0: 19.2, t1: 19.55, take: D.b, map: [[19.2, 'grab+2'], [19.55, 'grab+32']], cam: [[19.2, 230, 1250, 1.9], [19.55, 420, 1010, 2.3]], fx: [['flash', 19.2, 0.06, 0.3]] },
  { id: 'catchy', t0: 19.55, t1: 20.0, take: D.b, map: [[19.55, 'poke-6'], [20.0, 'poke+21']], cam: 'catchy' },
  // 0:20–0:22  GAMES + SURPRISES: IYS GAMES → IYS TOWER → CONTROL PANEL wallpaper → FW27 desktop
  { id: 'games', t0: 20.0, t1: 20.45, take: D.c, map: [[20.0, 'games+6'], [20.45, 'games+33']], cam: [[20.0, 458, 708, 1.55], [20.45, 458, 708, 1.62]], fx: [['glitch', 19.99, 0.06], ['chroma', 19.99, 0.06, 6]] },
  { id: 'tower', t0: 20.45, t1: 21.25, take: D.c, map: [[20.45, 'play+22'], [21.25, 'play+70']], cam: [[20.45, 484, 760, 1.62], [21.25, 484, 760, 1.72]], fx: [['flash', 20.45, 0.06, 0.3]] },
  { id: 'control', t0: 21.25, t1: 21.55, take: D.c, map: [[21.25, 'fw27Click+4'], [21.55, 'applyClick+4']], cam: [[21.25, 510, 760, 1.66], [21.55, 510, 760, 1.72]], fx: [['flash', 21.25, 0.06, 0.3]] },
  { id: 'fw27', t0: 21.55, t1: 22.0, take: 'morph', map: [[21.55, 'desktop+8'], [21.85, 'restore-4'], [22.0, 'shrink-2']], cam: [[21.55, 432, 768, 1.1], [22.0, 432, 768, 1.0]], fx: [['flash', 21.55, 0.08, 0.45]] },
  // 0:22–0:25  IYS MOBILE: the real resize → the phone → MY BAG → MENU → SHOP ALL → SEARCH
  { id: 'morph', t0: 22.0, t1: 22.75, take: 'morph', kind: 'morph', map: [[22.0, 'shrink-2'], [22.75, 'phone+2']], fx: [['flash', 22.0, 0.1, 0.55], ['chroma', 22.0, 0.08, 8]] },
  { id: 'mProduct', t0: 22.75, t1: 23.2, take: 'mobile', kind: 'phone', map: [[22.75, 10], [23.2, 37]] },
  { id: 'mBag', t0: 23.2, t1: 23.85, take: 'mobile', kind: 'phone', map: [[23.2, 'bag-7'], [23.85, 'bag+32']] },
  { id: 'mMenu', t0: 23.85, t1: 24.35, take: 'mobile', kind: 'phone', map: [[23.85, 'menu-7'], [24.35, 'menu+23']] },
  { id: 'mShop', t0: 24.35, t1: 24.7, take: 'mobile', kind: 'phone', map: [[24.35, 'shopall-7'], [24.7, 'shopall+14']] },
  { id: 'mSearch', t0: 24.7, t1: 25.0, take: 'mobile', kind: 'phone', map: [[24.7, 'search-7'], [25.0, 'search+11']] },
  // 0:25–0:27  MONTAGE on the eighth notes
  { id: 'mFavs', t0: 25.0, t1: 25.25, take: 'mobile', kind: 'phone', map: [[25.0, 'favs-7'], [25.25, 'favs+8']], fx: [['flash', 25.0, 0.04, 0.35]] },
  { id: 'mStores', t0: 25.25, t1: 25.5, take: 'mobile', kind: 'phone', map: [[25.25, 'stores-7'], [25.5, 'stores+8']], fx: [['flash', 25.25, 0.04, 0.35]] },
  { id: 'mMsg', t0: 25.5, t1: 25.75, take: 'mobile', kind: 'phone', map: [[25.5, 'msg-7'], [25.75, 'msg+8']], fx: [['flash', 25.5, 0.04, 0.35]] },
  { id: 'xAdd', t0: 25.75, t1: 26.0, take: D.a, map: [[25.75, 'addClick+36'], [26.0, 'addClick+51']], cam: [[25.75, 432, 614, 2.3], [26.0, 432, 614, 2.5]], cursor: false, fx: [['flash', 25.75, 0.05, 0.5], ['chroma', 25.75, 0.05, 6]] },
  { id: 'xSearch', t0: 26.0, t1: 26.25, take: D.b, map: [[26.0, 'results+8'], [26.25, 'results+23']], cam: [[26.0, 260, 400, 2.3], [26.25, 260, 400, 2.5]], cursor: false, fx: [['flash', 26.0, 0.04, 0.35]] },
  { id: 'xGuide', t0: 26.25, t1: 26.5, take: D.a, map: [[26.25, 'sizeGuideOpen+6'], [26.5, 'sizeGuideOpen+21']], cam: [[26.25, 250, 420, 2.3], [26.5, 250, 420, 2.5]], cursor: false, fx: [['flash', 26.25, 0.04, 0.35]] },
  { id: 'xMenu', t0: 26.5, t1: 26.75, take: D.a, map: [[26.5, 'menuClick+14'], [26.75, 'menuClick+29']], cam: [[26.5, 250, 440, 1.9], [26.75, 250, 440, 2.1]], cursor: false, fx: [['flash', 26.5, 0.04, 0.35]] },
  { id: 'xBoot', t0: 26.75, t1: 27.0, take: D.a, map: [[26.75, 70], [27.0, 85]], cam: [[26.75, 290, 868, 2.0], [27.0, 290, 868, 2.2]], cursor: false, fx: [['flash', 26.75, 0.04, 0.4], ['glitch', 26.95, 0.05]] },
  // 0:27–0:30  FINAL HERO FRAME
  { id: 'final', t0: 27.0, t1: 30.0, take: 'morph', kind: 'card', map: [[27.0, 'desktop+20'], [30.0, 'desktop+20']], cam: [[27.0, 432, 768, 1.12], [30.0, 432, 768, 1.0]], fx: [['flash', 27.0, 0.25, 0.95]] },
];

// The phone the mobile takes play in (screen rect in output px; 9:16).
export const PHONE = { x: 160, y: 250, w: 760, h: Math.round((760 * 16) / 9), sr: 22 };

// ── per-frame plan ────────────────────────────────────────────────────
export function makePlanner(takes, { base = '' } = {}) {
  const takeUrl = (take, f) => `${base}/takes/${take.id}/${take.frames[Math.max(0, Math.min(take.frames.length - 1, f))]}`;
  const imgSize = (take, f) => {
    const m = take.meta[f] ?? take.meta[take.meta.length - 1];
    const vw = m.vw ?? take.viewport.width;
    const vh = m.vh ?? take.viewport.height;
    return { vw, vh, pw: vw * take.dsf, ph: vh * take.dsf };
  };
  // Catchy's real position in take B, for the poke close-up.
  const catchyCam = () => {
    const r = takes['desktop-b'].rects.catchyPoked ?? takes['desktop-b'].rects.catchy;
    const x = r.x + r.w / 2;
    const y = r.y + r.h / 2 - 40;
    return [[19.55, x, y - 34, 2.5], [20.0, x, y - 34, 2.7]];
  };

  /** Ops for one take frame through a camera, into a destination rect. */
  function screen(shot, t, dest = { x: 0, y: 0, w: W, h: H }, extra = {}) {
    const take = takes[shot.take];
    const f = Math.round(linearMap(shot.map.map(([tt, v]) => [tt, frameOf(take, v)]), t));
    const { vw, vh, pw, ph } = imgSize(take, f);
    let [cx, cy, z] = shot.cam ? piecewise(shot.cam === 'catchy' ? catchyCam() : shot.cam, t) : [vw / 2, vh / 2, 1];
    const w = vw / z;
    const h = vh / z;
    cx = Math.min(Math.max(cx, w / 2), vw - w / 2);
    cy = Math.min(Math.max(cy, h / 2), vh - h / 2);
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;
    const sx = pw / vw;
    const ops = [{ op: 'image', src: takeUrl(take, f), sx: x0 * sx, sy: y0 * sx, sw: w * sx, sh: h * sx, dx: dest.x, dy: dest.y, dw: dest.w, dh: dest.h, ...extra }];
    const m = take.meta[f];
    const k = dest.w / w; // output px per CSS px
    if (m?.cursor && shot.cursor !== false && !extra.noCursor) {
      const x = dest.x + (m.x - x0) * k;
      const y = dest.y + (m.y - y0) * k;
      if (x > -40 && x < W + 40 && y > -40 && y < H + 40) ops.push({ op: 'cursor', type: m.cursor, x, y, scale: k, down: m.down });
    }
    if (m?.touch) {
      const age = (f - m.touch.t0) / FPS;
      if (age >= 0 && age < 0.38) {
        const e = outC(age / 0.38);
        ops.push({ op: 'ripple', x: dest.x + (m.touch.x - x0) * k, y: dest.y + (m.touch.y - y0) * k, r: (10 + 26 * e) * k * 0.5, alpha: 1 - e });
      }
    }
    return { ops, f, vw, vh };
  }

  function phoneShot(shot, t, alpha = 1) {
    const { ops } = screen(shot, t, PHONE, {});
    return [{ op: 'phone', ...PHONE, alpha }, ...ops.map((o) => (o.op === 'image' ? { ...o, clip: { ...PHONE, r: PHONE.sr } } : o)), { op: 'glass', ...PHONE }];
  }

  /** The backdrop behind the phone: the FW27 desktop (real), soft and dark. */
  function backdrop(t) {
    const take = takes.morph;
    const f = frameOf(take, 'desktop+20');
    const { pw, ph } = imgSize(take, f);
    const z = 1.06 + 0.02 * Math.sin(t * 0.6);
    return [{ op: 'image', src: takeUrl(take, f), sx: (pw - pw / z) / 2, sy: (ph - ph / z) / 2, sw: pw / z, sh: ph / z, dx: 0, dy: 0, dw: W, dh: H, blur: 18, brightness: 0.55, saturate: 1.1 }];
  }

  function card(shot, t) {
    const u = t - shot.t0; // 0 … 3 s
    const ops = [];
    const take = takes[shot.take];
    const f = frameOf(take, 'desktop+20');
    const { pw, ph } = imgSize(take, f);
    const z = piecewise(shot.cam, t, outC)[2];
    ops.push({ op: 'image', src: takeUrl(take, f), sx: (pw - pw / z) / 2, sy: (ph - ph / z) / 2, sw: pw / z, sh: ph / z, dx: 0, dy: 0, dw: W, dh: H, brightness: lerp(1, 0.8, clamp01(u / 0.8)) });
    ops.push({ op: 'gradient', y0: 860, y1: 1920, stops: [[0, 'rgba(6,20,52,0)'], [0.35, 'rgba(6,20,52,0.78)'], [1, 'rgba(6,20,52,0.96)']] });
    const rise = (start, dur = 0.55) => {
      const k = outC(clamp01((u - start) / dur));
      return { a: k, dy: (1 - k) * 34 };
    };
    const logo = rise(0.12);
    ops.push({ op: 'image', src: `${base}/public/iys/brand/in-your-shoe-white.png`, sx: 0, sy: 0, sw: 1100, sh: 102, dx: 160, dy: 1150 + logo.dy, dw: 760, dh: Math.round((760 * 102) / 1100), alpha: logo.a });
    const title = rise(0.3);
    ops.push({ op: 'text', text: 'IYS INTERNET 2006', x: 540, y: 1340 + title.dy, font: 'bold 88px "DejaVu Sans", Verdana, sans-serif', color: '#ff6060', letterSpacing: '2px', alpha: title.a, shadow: { color: 'rgba(0,0,0,0.45)', blur: 0, ox: 4, oy: 4 } });
    const line = rise(0.55);
    ops.push({ op: 'text', text: 'A 2000s internet concept for today’s In Your Shoe catalogue.', x: 540, y: 1412 + line.dy, font: '32px "DejaVu Sans", Verdana, sans-serif', color: '#ffffff', alpha: line.a });
    const credit = rise(0.8);
    ops.push({ op: 'text', text: 'UNOFFICIAL CONCEPT BY OMAR AKRAM · NOT AFFILIATED WITH IN YOUR SHOE', x: 540, y: 1530 + credit.dy, font: '21px "DejaVu Sans Mono", monospace', color: 'rgba(255,255,255,0.86)', letterSpacing: '1px', alpha: credit.a });
    return ops;
  }

  function morph(shot, t) {
    const take = takes.morph;
    const f = Math.round(linearMap(shot.map.map(([tt, v]) => [tt, frameOf(take, v)]), t));
    const { vw, pw, ph } = imgSize(take, f);
    const k = inOut(clamp01((864 - vw) / (864 - 405)));
    const dest = { x: lerp(0, PHONE.x, k), y: lerp(0, PHONE.y, k), w: lerp(W, PHONE.w, k), h: lerp(H, PHONE.h, k) };
    const r = lerp(0, PHONE.sr, k);
    return [
      ...backdrop(t).map((o) => ({ ...o, alpha: k })),
      { op: 'phone', ...dest, sr: r, bezel: lerp(0, 26, k), r: lerp(0, 70, k), alpha: k },
      { op: 'image', src: takeUrl(take, f), sx: 0, sy: 0, sw: pw, sh: ph, dx: dest.x, dy: dest.y, dw: dest.w, dh: dest.h, clip: { ...dest, r } },
      { op: 'glass', ...dest, sr: r, alpha: k },
    ];
  }

  function shotOps(shot, t) {
    if (shot.kind === 'card') return card(shot, t);
    if (shot.kind === 'morph') return morph(shot, t);
    if (shot.kind === 'phone') return [...backdrop(t), ...phoneShot(shot, t)];
    return screen(shot, t).ops;
  }

  function fxOps(t, n) {
    const ops = [];
    for (const s of SHOTS) {
      for (const [kind, at, dur, amt, px] of s.fx ?? []) {
        const u = t - at;
        if (u < 0 || u > dur) continue;
        const k = 1 - u / dur;
        if (kind === 'flash') ops.push({ op: 'fill', color: '#ffffff', alpha: amt * k * k });
        if (kind === 'glitch') ops.push({ op: 'glitch', amount: 60 * k, seed: n * 31 + 7 });
        if (kind === 'chroma') ops.push({ op: 'chroma', amount: (px ?? 6) * k, alpha: 0.55 * k });
        if (kind === 'crtOn') ops.push({ op: 'squeeze', k: outC(u / dur) });
        if (kind === 'glow') ops.push({ op: 'glow', amount: amt * (u < dur - 0.1 ? 1 : (dur - u) / 0.1) });
        if (kind === 'bloom') ops.push({ op: 'bloom', alpha: amt * (u < dur - 0.12 ? 1 : (dur - u) / 0.12) });
      }
    }
    return ops;
  }

  return {
    shotAt(t) {
      return SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
    },
    plan(n) {
      const t = n / FPS;
      const shot = this.shotAt(t);
      const ops = [...shotOps(shot, t), ...fxOps(t, n)];
      ops.push({ op: 'crt', scan: shot.id === 'final' ? 0.55 : 0.85, vignette: shot.id === 'final' ? 0.7 : 0.9, grain: 0.035, seed: n });
      return { n, shot: shot.id, ops };
    },
    /** Every image the frame needs (for preloading the next frames). */
    sources(n) {
      return this.plan(n).ops.filter((o) => o.op === 'image').map((o) => o.src);
    },
  };
}

/** Sanity: shots tile 0–30 s with no gaps or overlaps. */
export function checkShots() {
  let t = 0;
  for (const s of SHOTS) {
    if (Math.abs(s.t0 - t) > 1e-9) throw new Error(`edit: gap/overlap before ${s.id} (${t} → ${s.t0})`);
    if (s.t1 <= s.t0) throw new Error(`edit: ${s.id} has no length`);
    t = s.t1;
  }
  if (Math.abs(t - FRAMES / FPS) > 1e-9) throw new Error(`edit: shots end at ${t}, not 30 s`);
  return true;
}
