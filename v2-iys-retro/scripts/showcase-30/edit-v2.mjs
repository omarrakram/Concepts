/**
 * THE V2 FILM: IYS Retro V2 (feature/iys-retro-conversion-upgrade), 30.000 s,
 * 1080×1920, 60 fps = 1,800 frames. Every picture is a real frame of the
 * verified source build filmed by takes-v2/ (desktop 1440×900 @3x, IYS MOBILE
 * 390×844 @3x); lib/wide.mjs frames the wide desktop into 9:16 without
 * stretching. Beat grid: 120 BPM (0.5 s), lib/score.mjs.
 *
 * A shot plays one take: `map` is output second → take frame (linear between
 * keys, so 60 frames per second is real speed); `cam` keys are
 * [t, cx, cy, s, free] in the take's CSS px (s = output px per CSS px;
 * free lets the camera see past the screen's top/bottom edge, at the monitor).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { view, wideOps } from './lib/wide.mjs';

export const NAME = 'IYS-RETRO-V2-FINAL-30S-1080x1920';
export const FPS = 60;
export const FRAMES = 1800;
export const W = 1080;
export const H = 1920;
export const TAKES_DIR = 'out/v2-film/takes';
export const OUT_DIR = 'out/v2-film/final';
export const SOURCE_PUBLIC = true;
export const COVER_AT = 29.3; // the poster composition, fully settled
export const POSTER_TOP = 196; // 1080×1350 crop (196–1546): monitor, phone, title, credit and disclaimer with margins
export const TAKE_IDS = ['w-shop', 'w-explore', 'w-play', 'w-morph', 'w-mobile'];

export function loadTakes(dir) {
  const takes = {};
  for (const id of TAKE_IDS) {
    const t = JSON.parse(readFileSync(resolve(dir, id, 'take.json'), 'utf8'));
    if (t.failed) throw new Error(`edit: take ${id} failed: ${t.failed}`);
    t.id = id;
    takes[id] = t;
  }
  return takes;
}

// ── easing ───────────────────────────────────────────────────────────
const clamp01 = (k) => Math.max(0, Math.min(1, k));
const inOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const outC = (k) => 1 - Math.pow(1 - k, 3);
const smooth = (a, b, x) => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const lerp = (a, b, k) => a + (b - a) * k;
const EASE = { inOut, out: outC, linear: (k) => k };

/** Camera keys [t, cx, cy, s, free?, ease?] → camera at t (zoom interpolated in log space). */
function camAt(keys, t) {
  if (t <= keys[0][0]) return { cx: keys[0][1], cy: keys[0][2], s: keys[0][3], free: keys[0][4] ?? 0 };
  for (let i = 1; i < keys.length; i++) {
    const [t1, x1, y1, s1, f1 = 0, e = 'inOut'] = keys[i];
    if (t <= t1) {
      const [t0, x0, y0, s0, f0 = 0] = keys[i - 1];
      const k = EASE[e](clamp01((t - t0) / (t1 - t0)));
      return { cx: lerp(x0, x1, k), cy: lerp(y0, y1, k), s: Math.exp(lerp(Math.log(s0), Math.log(s1), k)), free: lerp(f0, f1, k) };
    }
  }
  const k = keys[keys.length - 1];
  return { cx: k[1], cy: k[2], s: k[3], free: k[4] ?? 0 };
}
const frameAt = (map, t) => {
  if (t <= map[0][0]) return map[0][1];
  for (let i = 1; i < map.length; i++) {
    if (t <= map[i][0]) {
      const [t0, a] = map[i - 1];
      const [t1, b] = map[i];
      return Math.round(lerp(a, b, (t - t0) / (t1 - t0)));
    }
  }
  return map[map.length - 1][1];
};

// ── the phone (IYS MOBILE 390×844) and the desktop framings ───────────
export const PHONE = { x: 240, y: 250, w: 600, h: 1298, sr: 30 }; // 390×844 at 1.538, inside the social-safe area
const COVER = H / 900; // full-height framing of a 1440×900 desktop
/** Sections of the home page (3 columns: x 412–862, header ≈343 px down, clear of the overlays; both rows of names + prices in the safe area). */
const SHELF_Y = 469;
const SHELF3 = (cx = 637) => [cx, SHELF_Y, 2.4];
/** IYS TOWER, the score bar at ≈300 px, the playfield below it (the pointer is hidden: the game is played with the keys). */
const TOWER = (t0, t1, s = 2.4) => [[t0, 772, 438, s, 0], [t1, 772, 438, s * 1.05, 0, 'linear']];

/** The shot list, built from the takes' own marks. */
export function buildShots(takes) {
  const M = (id, name, d = 0) => {
    const v = takes[id].marks[name];
    if (v === undefined) throw new Error(`edit: no mark ${name} in ${id}`);
    return v + d;
  };
  const S = 'w-shop';
  const E = 'w-explore';
  const P = 'w-play';
  const shots = [];
  const add = (s) => shots.push(s);

  // 0:00–6:40 · ONE CONTINUOUS SHOT. The monitor powers on in the dark (title above, reflection
  // below), the whole OS in view; push in to MY BAG, ride the top strip with the cursor (the
  // IYS 2006 / REAL IYS switch, a hover), MENU and the IYS INTERNET icon; the click on 3.0;
  // the site's loader; the homepage; a real scroll to JUST DROPPED ✧ FRESH 4 U; on to TOP 8.
  add({
    id: 'intro', t0: 0, t1: 6.4, take: S, kind: 'wide', power: [-0.1, 0.25], title: [0.3, 1.5],
    // the cursor's trip along the strip (past the switch) plays fast under a whip pan; the click stays on 3.0
    map: [[0, M(S, 'start')], [2.35, M(S, 'toSwitch')], [2.62, M(S, 'toIcon')], [3.0, M(S, 'click')], [6.4, M(S, 'click') + 204]],
    cam: [
      [0, 720, 300, 0.74, 1],
      [1.3, 720, 316, 0.76, 1, 'linear'],
      [2.0, 1230, 242, 2.6, 1], // MY BAG and the right icon column (the strip ≈330 px down, the monitor's edge above it)
      [2.35, 1222, 242, 2.6, 1, 'linear'],
      [2.66, 208, 242, 2.6, 1], // whip across to MENU and the left icon column: IYS INTERNET, the click on 3.0
      [3.08, 208, 242, 2.6, 1, 'linear'],
      [3.32, 720, 356, 2.7, 0], // "Loading IYS INTERNET..."
      [3.42, 720, 356, 2.7, 0, 'linear'],
      [3.95, 453, 450, COVER, 0], // the homepage's left column: window title, IN YOUR SHOE, SHOP BY CATEGORY, the new drop
      [4.0, 455, 450, COVER, 0, 'linear'],
      [4.8, ...SHELF3(), 0], // the scroll lands on JUST DROPPED: 3 columns, header in the safe area
      [5.35, 637, SHELF_Y, 2.46, 0, 'linear'],
      [5.95, ...SHELF3(), 0], // scrolling on to TOP 8 COOL DECISIONS
      [6.4, 637, SHELF_Y, 2.47, 0, 'linear'],
    ],
  });
  // 6:40–9:00 · THE CLOTHES: cuts on the beat between the real shelves, each landing as the scroll arrives
  const shelf = (id, name, t0, t1, drift = 1) => add({ id, t0, t1, take: S, kind: 'wide', map: [[t0, M(S, name, -8)], [t1, M(S, name, -8) + Math.round((t1 - t0) * FPS)]], cam: [[t0, 637 - 6 * drift, SHELF_Y, 2.38, 0], [t1, 637 + 6 * drift, SHELF_Y, 2.5, 0, 'linear']], fx: [['flash', t0, 0.05, 0.22]] });
  shelf('best', 'best', 6.4, 6.95, 1);
  shelf('hoodies', 'hoodies', 6.95, 7.5, -1);
  shelf('pjoys', 'pjoys', 7.5, 8.05, 1);
  // back up to TOP 8 · the cursor finds #1, Dropout Oversized Hoodie · the click on 8.5
  add({ id: 'pick', t0: 8.05, t1: 8.5, take: S, kind: 'wide', map: [[8.05, M(S, 'heroClick', -27)], [8.5, M(S, 'heroClick')]], cam: [[8.05, ...SHELF3(632), 0], [8.5, 520, 420, 2.9, 0]], fx: [['flash', 8.05, 0.05, 0.2]] });

  // 8:50–12:20 · THE PRODUCT: photo, gallery, SIZE GUIDE (read, closed with its ×), size M, ADD TO BAG on 11.0
  add({ id: 'product', t0: 8.5, t1: 9.0, take: S, kind: 'wide', map: [[8.5, M(S, 'heroClick')], [9.0, M(S, 'heroClick') + 30]], cam: [[8.5, 470, 450, 2.4, 0], [9.0, 470, 470, 2.55, 0, 'linear']] });
  add({ id: 'gallery', t0: 9.0, t1: 9.35, take: S, kind: 'wide', map: [[9.0, M(S, 'galleryNext', -2)], [9.35, M(S, 'galleryNext', 19)]], cam: [[9.0, 470, 470, 2.6, 0], [9.35, 470, 480, 2.7, 0, 'linear']], fx: [['flash', 9.0, 0.04, 0.18]] });
  // SIZE GUIDE: the camera pulls back to the monitor's edges so the whole window (chart, title, controls) is in view
  add({ id: 'guide', t0: 9.35, t1: 10.2, take: S, kind: 'wide', map: [[9.35, M(S, 'sizeGuideClick', -2)], [10.2, M(S, 'guideClose', 4)]], cam: [[9.35, 481, 450, 2.3, 0], [9.6, 481, 480, 2.0, 0], [10.2, 481, 480, 2.03, 0, 'linear']] });
  // size M and ADD TO BAG: the properties column, whole
  add({ id: 'size', t0: 10.2, t1: 11.0, take: S, kind: 'wide', map: [[10.2, M(S, 'guideClose', 4)], [11.0, M(S, 'addClick')]], cam: [[10.2, 481, 480, 2.03, 0], [10.5, 1000, 420, 2.2, 0], [10.85, 960, 400, 2.35, 0], [11.0, 900, 395, 2.38, 0, 'linear']] });
  // the site's "Copying..." dialog: 7% … 100% - ADDED 2 BAG :) (the hook melody is under it)
  add({ id: 'add', t0: 11.0, t1: 12.2, take: S, kind: 'wide', map: [[11.0, M(S, 'addClick')], [12.2, M(S, 'added')]], cam: [[11.0, 900, 395, 2.38, 0], [11.25, 750, 390, 2.42, 0], [12.2, 750, 390, 2.52, 0, 'linear']] }); // the dialog (x 540–900) and ADD TO BAG, whole

  // 12:20–14:00 · MY BAG (badge 1): the line, U MIGHT ALSO LIKE scrolling, a tilt down to CHECKOUT (hovered, never pressed)
  add({ id: 'bagopen', t0: 12.2, t1: 12.5, take: S, kind: 'wide', map: [[12.2, M(S, 'bagClick', -14)], [12.5, M(S, 'bagClick', 4)]], cam: [[12.2, 1215, 284, 2.5, 1], [12.5, 1215, 300, 2.5, 1]], fx: [['flash', 12.2, 0.04, 0.18]] });
  add({ id: 'bag', t0: 12.5, t1: 14.0, take: S, kind: 'wide', map: [[12.5, M(S, 'bagOpen', -8)], [13.25, M(S, 'recoScroll', 34)], [14.0, M(S, 'checkoutHover', 16)]], cam: [[12.5, 1215, 400, 2.4, 0], [13.3, 1215, 405, 2.4, 0, 'linear'], [13.7, 1205, 566, 2.3, 1], [14.0, 1205, 570, 2.32, 1, 'linear']] });

  // 14:00–16:00 · SEARCH + FAVS: هودي → "IYS understood: hoodie" → ADD TO FAVORITES → FAVORITES
  // "SEARCH THE IYS INTERNET", then a glide to the box as هودي is typed (Arabic sits at its left)
  add({ id: 'typing', t0: 14.0, t1: 14.55, take: E, kind: 'wide', map: [[14.0, M(E, 'typing', -8)], [14.55, M(E, 'typing', 25)]], cam: [[14.0, 700, 390, 2.4, 0], [14.12, 700, 390, 2.4, 0, 'linear'], [14.4, 548, 402, 2.45, 0], [14.55, 545, 405, 2.45, 0, 'linear']], fx: [['flash', 14.0, 0.05, 0.22]] });
  // "Results 1 - 20 of 133 for هودي" · "IYS understood: hoodie" · four real hoodies with prices
  add({ id: 'results', t0: 14.55, t1: 15.05, take: E, kind: 'wide', map: [[14.55, M(E, 'results', -2)], [15.05, M(E, 'results', 28)]], cam: [[14.55, 545, 405, 2.45, 0], [15.05, 530, 422, 2.45, 0, 'linear']] });
  // Cairo Is A Mindset Oversized Hoodie: the photo, then ADD TO FAVORITES → ★ IN FAVORITES
  add({ id: 'fav', t0: 15.05, t1: 15.55, take: E, kind: 'wide', map: [[15.05, M(E, 'favClick', -16)], [15.55, M(E, 'favClick', 14)]], cam: [[15.05, 1000, 436, 2.2, 0], [15.55, 1000, 440, 2.3, 0, 'linear']] });
  add({ id: 'favs', t0: 15.55, t1: 16.0, take: E, kind: 'wide', map: [[15.55, M(E, 'favs', -4)], [16.0, M(E, 'favs', 23)]], cam: [[15.55, 443, 450, COVER, 0], [16.0, 448, 450, 2.2, 0, 'linear']], fx: [['flash', 15.55, 0.04, 0.18]] });

  // 16:00–18:00 · THE COMPUTER IS THE STORE: DESKTOP, MY WARDROBE → CAIRO, STORES
  // DESKTOP (taskbar): every window tucks away; the left icon column, Catchy, the taskbar
  add({ id: 'desktop', t0: 16.0, t1: 16.35, take: E, kind: 'wide', map: [[16.0, M(E, 'desktopClick', -4)], [16.35, M(E, 'desktopClick', 17)]], cam: [[16.0, 225, 640, 2.4, 1], [16.35, 228, 636, 2.45, 1, 'linear']], fx: [['flash', 16.0, 0.05, 0.22]] });
  // MY WARDROBE opens · the folder tree · CAIRO: real items as files (two columns, cut at the column gap)
  add({ id: 'wardrobe', t0: 16.35, t1: 17.2, take: E, kind: 'wide', map: [[16.35, M(E, 'wardrobeClick', 4)], [17.2, M(E, 'cairo', -1)]], cam: [[16.35, 600, 430, COVER, 0], [17.2, 600, 440, 2.2, 0, 'linear']] });
  // STORES (desktop icon) → FIND IYS IRL: the photo and store columns (x 188–542, cut at the column boundary)
  add({ id: 'storesIcon', t0: 17.2, t1: 17.5, take: E, kind: 'wide', map: [[17.2, M(E, 'storesClick', -6)], [17.5, M(E, 'storesClick', 12)]], cam: [[17.2, 216, 560, 2.5, 0], [17.5, 220, 560, 2.56, 0, 'linear']] });
  add({ id: 'stores', t0: 17.5, t1: 18.0, take: E, kind: 'wide', map: [[17.5, M(E, 'storesClick', 12)], [18.0, M(E, 'storesClick', 42)]], cam: [[17.5, 365, 440, 3.0, 0], [18.0, 365, 445, 3.1, 0, 'linear']] });

  // 18:00–20:00 · MESSENGER + CATCHY (the 2:13 AM breakdown)
  // PJOYS pings (the tray balloon, framed below the screen's edge so it sits mid-frame)
  add({ id: 'balloon', t0: 18.0, t1: 18.4, take: E, kind: 'wide', map: [[18.0, M(E, 'balloon', 2)], [18.4, M(E, 'balloon', 26)]], cam: [[18.0, 1232, 640, 2.6, 1], [18.4, 1232, 650, 2.7, 1, 'linear']], fx: [['flash', 18.0, 0.05, 0.2]] });
  // IYS MESSENGER, whole (the monitor's edge in view): u awake? · enta sa7y? · the product files arriving
  add({ id: 'chat', t0: 18.4, t1: 19.2, take: E, kind: 'wide', map: [[18.4, M(E, 'fileCard', -40)], [19.2, M(E, 'fileCard', 8)]], cam: [[18.4, 1172, 422, 2.0, 1], [19.2, 1172, 422, 2.06, 1, 'linear']] });
  add({ id: 'catchy', t0: 19.2, t1: 20.0, take: E, kind: 'wide', map: [[19.2, M(E, 'poke', -18)], [20.0, M(E, 'poke', 30)]], cam: 'catchy' });

  // 20:00–22:00 · GAMES AND HIDDEN DETAILS: IYS GAMES, IYS TOWER played, IYS CAMERA, CONTROL PANEL
  // IYS GAMES: the six games starring Catchy (the tiles, whole)
  add({ id: 'games', t0: 20.0, t1: 20.35, take: P, kind: 'wide', map: [[20.0, M(P, 'games', -2)], [20.35, M(P, 'games', 19)]], cam: [[20.0, 830, 450, COVER, 0], [20.35, 830, 450, 2.2, 0, 'linear']], fx: [['flash', 20.0, 0.05, 0.22]] });
  // IYS TOWER, played: the playfield between the tower walls (below the score bar)
  add({ id: 'tower', t0: 20.35, t1: 21.15, take: P, kind: 'wide', map: [[20.35, M(P, 'play', 6)], [21.15, M(P, 'play', 54)]], cam: TOWER(20.35, 21.15), cursor: false });
  // IYS CAMERA: the DCIM photos (two columns, cut at the column gap)
  add({ id: 'camera', t0: 21.15, t1: 21.55, take: P, kind: 'wide', map: [[21.15, M(P, 'camera', -6)], [21.55, M(P, 'camera', 18)]], cam: [[21.15, 808, 500, 2.75, 0], [21.55, 808, 505, 2.85, 0, 'linear']], fx: [['flash', 21.15, 0.04, 0.18]] });
  // CONTROL PANEL, whole (the monitor's edge in view): IYS FW27 in its preview monitor, not applied
  add({ id: 'control', t0: 21.55, t1: 22.0, take: P, kind: 'wide', map: [[21.55, M(P, 'fw27Click', -6)], [22.0, M(P, 'fw27Click', 21)]], cam: [[21.55, 824, 523, 2.0, 1], [22.0, 824, 523, 2.06, 1, 'linear']] });

  // 22:00–25:00 · THE SIGNATURE TRANSFORMATION: the real viewport narrows, the site turns into IYS MOBILE
  add({ id: 'morph', t0: 22.0, t1: 23.35, take: 'w-morph', kind: 'morph', map: [[22.0, M('w-morph', 'shrink', -14)], [22.25, M('w-morph', 'shrink')], [23.25, M('w-morph', 'phone')], [23.35, M('w-morph', 'phone', 6)]], fx: [['flash', 22.0, 0.06, 0.3]] });
  // IYS MOBILE, real taps (a tap registers 6 frames before its mark; screens change instantly on mobile):
  // the home (where the switch landed) → Dropout Oversized Hoodie → photo 2 → SHOP ALL → FAVS
  const tap = (name) => M('w-mobile', name, -6);
  add({ id: 'mHome', t0: 23.35, t1: 23.75, take: 'w-mobile', kind: 'phone', map: [[23.35, 0], [23.72, tap('productTap') - 1], [23.75, tap('productTap')]] });
  add({ id: 'mProduct', t0: 23.75, t1: 24.25, take: 'w-mobile', kind: 'phone', map: [[23.75, tap('productTap')], [24.25, M('w-mobile', 'photo2', 8)]] });
  add({ id: 'mShopAll', t0: 24.25, t1: 24.6, take: 'w-mobile', kind: 'phone', map: [[24.25, tap('shopall') - 3], [24.6, tap('shopall') + 18]] });
  add({ id: 'mFavs', t0: 24.6, t1: 25.0, take: 'w-mobile', kind: 'phone', map: [[24.6, tap('favs') - 3], [25.0, tap('favs') + 21]] });

  // 25:00–27:00 · THE DETAIL MONTAGE, double time: eight different real moments
  const cut = (id, t0, take, f, cam) => add({ id, t0, t1: t0 + 0.25, take, kind: 'wide', map: [[t0, f], [t0 + 0.25, f + 15]], cam, fx: [['flash', t0, 0.04, 0.3]] });
  cut('xPhoto', 25.0, S, M(S, 'galleryNext', 26), [[25.0, 480, 420, 3.0, 0], [25.25, 480, 420, 3.2, 0, 'linear']]);
  cut('xAdded', 25.25, S, M(S, 'added', -14), [[25.25, 722, 384, 2.7, 0], [25.5, 722, 384, 2.85, 0, 'linear']]);
  cut('xReco', 25.5, S, M(S, 'recoScroll', 20), [[25.5, 1220, 420, 2.5, 0], [25.75, 1220, 420, 2.56, 0, 'linear']]);
  cut('xSearch', 25.75, E, M(E, 'results', 12), [[25.75, 498, 470, 2.6, 0], [26.0, 498, 470, 2.75, 0, 'linear']]);
  cut('xWardrobe', 26.0, E, M(E, 'cairo', 8), [[26.0, 720, 420, 2.6, 0], [26.25, 720, 420, 2.8, 0, 'linear']]);
  cut('xChat', 26.25, E, M(E, 'fileCard', 30), [[26.25, 1075, 380, 2.7, 0], [26.5, 1075, 380, 2.85, 0, 'linear']]);
  cut('xTower', 26.5, P, M(P, 'play', 40), TOWER(26.5, 26.75, 2.7));
  shots[shots.length - 1].cursor = false;
  add({ id: 'xMobile', t0: 26.75, t1: 27.0, take: 'w-mobile', kind: 'phone', map: [[26.75, M('w-mobile', 'bag', 1)], [27.0, M('w-mobile', 'bag', 16)]], fx: [['flash', 26.75, 0.04, 0.3]] });

  // 27:00–30:00 · THE POSTER: the real desktop and the real IYS MOBILE together, the wordmark, the credit
  add({ id: 'final', t0: 27.0, t1: 30.0, take: 'w-morph', kind: 'final', fx: [['flash', 27.0, 0.2, 0.42]] }); // a soft flash: the poster is already arriving under it
  return shots;
}

export function makePlanner(takes, { base = '' } = {}) {
  const SHOTS = buildShots(takes);
  const url = (take, f) => `${base}/takes/${take.id}/${take.frames[Math.max(0, Math.min(take.frames.length - 1, f))]}`;
  const meta = (take, f) => take.meta[Math.max(0, Math.min(take.meta.length - 1, f))];
  const rect = (take, name) => {
    const r = take.rects[name];
    if (!r) throw new Error(`edit: no rect ${name} in ${take.id}`);
    return r;
  };
  /** A camera that frames a recorded window/element rect: whole if it fits a full-height view, else centred. */
  const frameRect = (take, name, t0, t1) => {
    const r = rect(take, name);
    const s = Math.max(COVER, Math.min(3.2, (W - 60) / r.w));
    return [[t0, r.x + r.w / 2, r.y + r.h / 2, s, 0], [t1, r.x + r.w / 2, r.y + r.h / 2, s * 1.05, 0, 'linear']];
  };
  const catchyCam = (take, t0, t1) => {
    const r = take.rects.catchyPoked ?? take.rects.catchy;
    const x = r.x + r.w / 2;
    const y = r.y + r.h / 2;
    return [[t0, x, y - 30, 3.4, 0], [t1, x, y - 30, 3.65, 0, 'linear']];
  };
  const cams = new Map();
  const camFor = (shot) => {
    if (Array.isArray(shot.cam)) return shot.cam;
    if (!cams.has(shot.id)) {
      const take = takes[shot.take];
      cams.set(shot.id, shot.cam === 'catchy' ? catchyCam(take, shot.t0, shot.t1) : frameRect(take, shot.cam, shot.t0, shot.t1));
    }
    return cams.get(shot.id);
  };
  const size = (take, f) => {
    const m = meta(take, f);
    return { vw: m.vw ?? take.viewport.width, vh: m.vh ?? take.viewport.height };
  };

  /** The real desktop, soft and dim, behind the phone. */
  function backdrop(t, alpha = 1) {
    const take = takes['w-morph'];
    const f = take.marks.desktop;
    const { vw, vh } = size(take, f);
    const pw = vw * take.dsf;
    const ph = vh * take.dsf;
    const z = 1.04 + 0.02 * Math.sin(t * 0.7);
    const sh = ph / z;
    const sw = (sh * W) / H;
    return [{ op: 'image', src: url(take, f), sx: (pw - sw) / 2 - pw * 0.18, sy: (ph - sh) / 2, sw, sh, dx: 0, dy: 0, dw: W, dh: H, blur: 22, brightness: 0.62, saturate: 1.15, alpha }];
  }
  function phoneOps(take, f, rectOut = PHONE, alpha = 1) {
    const { vw, vh } = size(take, f);
    const ops = [{ op: 'phone', ...rectOut, bezel: 24, r: 64, alpha }];
    ops.push({ op: 'image', src: url(take, f), sx: 0, sy: 0, sw: vw * take.dsf, sh: vh * take.dsf, dx: rectOut.x, dy: rectOut.y, dw: rectOut.w, dh: rectOut.h, clip: { ...rectOut, r: rectOut.sr ?? 30 }, alpha });
    const m = meta(take, f);
    if (m?.touch) {
      const age = (f - m.touch.t0) / FPS;
      if (age >= 0 && age < 0.38) {
        const e = outC(age / 0.38);
        const k = rectOut.w / vw;
        ops.push({ op: 'ripple', x: rectOut.x + m.touch.x * k, y: rectOut.y + m.touch.y * k, r: (12 + 30 * e) * k * 0.5, alpha: 1 - e });
      }
    }
    ops.push({ op: 'glass', ...rectOut, alpha });
    return ops;
  }

  function wideShot(shot, t) {
    const take = takes[shot.take];
    const f = frameAt(shot.map, t);
    const { vw, vh } = size(take, f);
    const keys = camFor(shot);
    const v = view(camAt(keys, t), vw, vh, W, H);
    const prev = view(camAt(keys, Math.max(shot.t0, t - 0.5 / FPS)), vw, vh, W, H);
    const next = view(camAt(keys, Math.min(shot.t1, t + 0.5 / FPS)), vw, vh, W, H);
    const power = shot.power ? clamp01((t - shot.power[0]) / (shot.power[1] - shot.power[0])) : 1;
    const ops = wideOps({ v, prev, next, src: url(take, f), vw, vh, dsf: take.dsf, W, H, meta: meta(take, f), power, cursor: shot.cursor !== false });
    if (shot.title) ops.push(...titleOps(shot.title, t, v));
    return ops;
  }

  /** The cold-open title over the dark room, above the monitor; it lifts away with the screen as the camera pushes in. */
  function titleOps([a, b], t, v) {
    const k = smooth(a, a + 0.45, t) * (1 - smooth(b - 0.3, b, t));
    if (k <= 0.001) return [];
    const screenTop = (0 - v.y0) * v.s; // where the monitor's screen starts, in output px
    const y = screenTop - 372 + (1 - smooth(a, a + 0.45, t)) * 24;
    const line = { font: '30px "DejaVu Sans", Verdana, sans-serif', color: 'rgba(255,255,255,0.88)', alpha: k };
    return [
      { op: 'image', src: `${base}/public/iys/brand/in-your-shoe-white.png`, sx: 0, sy: 0, sw: 1100, sh: 102, dx: 200, dy: y, dw: 680, dh: Math.round((680 * 102) / 1100), alpha: k },
      { op: 'text', text: 'IYS INTERNET 2006', x: 540, y: y + 160, font: 'bold 68px "DejaVu Sans", Verdana, sans-serif', color: '#ff6060', letterSpacing: '2px', alpha: k, shadow: { color: 'rgba(0,0,0,0.45)', blur: 0, ox: 3, oy: 3 } },
      // the concept's own thesis (src/data/copy.ts)
      { op: 'text', text: 'What if today’s In Your Shoe', x: 540, y: y + 222, ...line },
      { op: 'text', text: 'travelled back to the internet of 2006?', x: 540, y: y + 262, ...line },
    ];
  }

  function morphShot(shot, t) {
    const take = takes[shot.take];
    const f = frameAt(shot.map, t);
    const { vw, vh } = size(take, f);
    const k = clamp01((1440 - vw) / (1440 - 390));
    const sStart = 0.95;
    const sEnd = PHONE.w / 390;
    const s = Math.exp(lerp(Math.log(sStart), Math.log(sEnd), inOut(k)));
    const w = vw * s;
    const h = vh * s;
    const cy = lerp(960, PHONE.y + PHONE.h / 2, inOut(k));
    const r = { x: (W - w) / 2, y: cy - h / 2, w, h };
    const mon = 1 - smooth(0.15, 0.6, k);
    const ph = smooth(0.45, 0.95, k);
    const ops = [];
    ops.push({ op: 'room', ...r, glow: 1, alpha: 1 });
    ops.push(...backdrop(t, smooth(0.05, 0.6, k)));
    if (mon > 0.001) ops.push({ op: 'monitor', ...r, bezel: 30 * s, chin: 52 * s, r: 16 * s, alpha: mon });
    if (ph > 0.001) ops.push({ op: 'phone', ...r, bezel: 24, r: 64, alpha: ph });
    ops.push({ op: 'image', src: url(take, f), sx: 0, sy: 0, sw: vw * take.dsf, sh: vh * take.dsf, dx: r.x, dy: r.y, dw: r.w, dh: r.h, clip: { ...r, r: lerp(0, 30, ph) } });
    ops.push({ op: 'glass', ...r, sr: lerp(0, 30, ph), alpha: 0.6 + 0.4 * ph });
    return ops;
  }

  function finalShot(shot, t) {
    const u = t - shot.t0 + 0.12; // the monitor and phone are already on their way in on the first frame
    const ops = [];
    const enter = outC(clamp01(u / 0.7));
    ops.push(...backdrop(t, 1));
    ops.push({ op: 'gradient', y0: 0, y1: H, stops: [[0, 'rgba(4,14,40,0.35)'], [0.55, 'rgba(4,14,40,0.2)'], [1, 'rgba(4,14,40,0.85)']] });
    // the real desktop (IYS INTERNET on JUST DROPPED) in its monitor, top
    const dt = takes['w-morph'];
    const df = dt.marks.desktop;
    const ds = 0.6 * lerp(0.94, 1, enter);
    const dw = 1440 * ds;
    const dh = 900 * ds;
    const drift = u / (shot.t1 - shot.t0); // 0 → 1 over the shot: a slow parallax, so the hold never freezes
    const dr = { x: (W - dw) / 2 - 40 * (1 - enter) + 8 * drift, y: 262 + 60 * (1 - enter) - 10 * drift, w: dw, h: dh };
    ops.push({ op: 'monitor', ...dr, bezel: 30 * ds, chin: 52 * ds, r: 16 * ds, alpha: enter });
    ops.push({ op: 'image', src: url(dt, df), sx: 0, sy: 0, sw: 1440 * dt.dsf, sh: 900 * dt.dsf, dx: dr.x, dy: dr.y, dw: dr.w, dh: dr.h, clip: { ...dr, r: 0 }, alpha: enter });
    ops.push({ op: 'sheen', ...dr, alpha: 0.5 * enter });
    // the real IYS MOBILE home, in front of the monitor's lower right corner
    const mt = takes['w-mobile'];
    const mf = 0; // the IYS MOBILE home, as the responsive switch lands on it
    const pk = outC(clamp01((u - 0.12) / 0.7));
    const pw = 300;
    const prc = { x: 690 + 60 * (1 - pk) - 10 * drift, y: 640 + 80 * (1 - pk) - 22 * drift, w: pw, h: (pw * 844) / 390, sr: 18 };
    ops.push(...phoneOps(mt, mf, prc, pk).map((o) => (o.op === 'phone' ? { ...o, bezel: 13, r: 38 } : o)));
    // the identity (the site's own end card, src/showcase): the white wordmark, IYS INTERNET 2006,
    // YOU'RE ABOUT TO MAKE A COOL DECISION., 2000s INTERNET CONCEPT, the name and the disclaimer
    const rise = (start, dur = 0.55) => {
      const k = outC(clamp01((u - start) / dur));
      return { a: k, dy: (1 - k) * 34 };
    };
    const X = 88;
    const sans = (px, bold = true) => `${bold ? 'bold ' : ''}${px}px "DejaVu Sans", Verdana, sans-serif`;
    const drop = { color: 'rgba(0,0,0,0.5)', blur: 0, ox: 3, oy: 3 };
    const logo = rise(0.25);
    ops.push({ op: 'image', src: `${base}/public/iys/brand/in-your-shoe-white.png`, sx: 0, sy: 0, sw: 1100, sh: 102, dx: X, dy: 930 + logo.dy, dw: 470, dh: Math.round((470 * 102) / 1100), alpha: logo.a });
    const title = rise(0.4);
    ops.push({ op: 'text', text: 'IYS INTERNET', x: X - 2, y: 1062 + title.dy, align: 'left', font: sans(60), color: '#ffffff', alpha: title.a, shadow: drop });
    ops.push({ op: 'text', text: '2006', x: X - 2, y: 1132 + title.dy, align: 'left', font: sans(60), color: '#ff6060', letterSpacing: '4px', alpha: title.a, shadow: drop });
    const line = rise(0.6);
    ops.push({ op: 'text', text: 'YOU’RE ABOUT TO', x: X, y: 1198 + line.dy, align: 'left', font: sans(30), color: '#ff6060', alpha: line.a, shadow: { ...drop, ox: 2, oy: 2 } });
    ops.push({ op: 'text', text: 'MAKE A COOL DECISION.', x: X, y: 1234 + line.dy, align: 'left', font: sans(30), color: '#ff6060', alpha: line.a, shadow: { ...drop, ox: 2, oy: 2 } });
    const credit = rise(0.85);
    ops.push({ op: 'text', text: '2000s INTERNET CONCEPT', x: X, y: 1296 + credit.dy, align: 'left', font: '19px "DejaVu Sans Mono", monospace', color: 'rgba(255,255,255,0.9)', letterSpacing: '3px', alpha: credit.a });
    ops.push({ op: 'text', text: 'OMAR AKRAM · 2026', x: X, y: 1336 + credit.dy, align: 'left', font: sans(26), color: '#ffffff', letterSpacing: '1px', alpha: credit.a });
    const disc = rise(1.05);
    const box = { x: 170, y: 1422 + disc.dy, w: 740, h: 50 };
    ops.push({ op: 'fill', color: 'rgba(4,14,40,0.35)', rect: box, stroke: { width: 1.5, color: 'rgba(255,255,255,0.6)' }, alpha: disc.a });
    ops.push({ op: 'text', text: 'UNOFFICIAL SPECULATIVE CONCEPT · NOT AFFILIATED WITH IN YOUR SHOE', x: 540, y: box.y + 32, font: '16px "DejaVu Sans Mono", monospace', color: 'rgba(255,255,255,0.92)', letterSpacing: '1px', alpha: disc.a });
    return ops;
  }

  function shotOps(shot, t) {
    if (shot.kind === 'morph') return morphShot(shot, t);
    if (shot.kind === 'final') return finalShot(shot, t);
    if (shot.kind === 'phone') {
      const take = takes[shot.take];
      return [...backdrop(t), ...phoneOps(take, frameAt(shot.map, t))];
    }
    return wideShot(shot, t);
  }

  function fxOps(t, n) {
    const ops = [];
    for (const s of SHOTS)
      for (const [kind, at, dur, amt] of s.fx ?? []) {
        const u = t - at;
        if (u < 0 || u > dur) continue;
        const k = 1 - u / dur;
        if (kind === 'flash') ops.push({ op: 'fill', color: '#ffffff', alpha: amt * k * k });
      }
    void n;
    return ops;
  }

  return {
    SHOTS,
    shotAt(t) {
      return SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
    },
    plan(n) {
      const t = n / FPS;
      const shot = this.shotAt(t);
      return { n, shot: shot.id, ops: [...shotOps(shot, t), ...fxOps(t, n)] };
    },
    sources(n) {
      return this.plan(n).ops.filter((o) => o.op === 'image').map((o) => o.src);
    },
  };
}

/** Sanity: the shots tile 0–30 s with no gaps or overlaps. */
export function checkShots(takes) {
  if (!takes) return true;
  let t = 0;
  for (const s of buildShots(takes)) {
    if (Math.abs(s.t0 - t) > 1e-9) throw new Error(`edit: gap/overlap before ${s.id} (${t} → ${s.t0})`);
    if (s.t1 <= s.t0) throw new Error(`edit: ${s.id} has no length`);
    t = s.t1;
  }
  if (Math.abs(t - FRAMES / FPS) > 1e-9) throw new Error(`edit: shots end at ${t}, not 30 s`);
  return true;
}
