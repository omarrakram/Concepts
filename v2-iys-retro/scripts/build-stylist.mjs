/**
 * npm run build-stylist [-- --force] [-- --scan-only | --models-only | --partial]
 *
 * Prepares DRESSUP.EXE's paper-doll assets, deterministically (no AI, no
 * generative step, no runtime vision): same catalogue + same photos in →
 * same files out.
 *
 *  1. Models: crops the two supplied official IYS studio photos
 *     (scripts/stylist/reference-*.webp, kept untouched) to 600 × 900, and cuts
 *     each head + hair out of the same photo (studio wall removed inside a
 *     hand-measured outline) so hoods can sit behind the head.
 *  2. Scan: every image of every stylist-relevant product (classify.ts) is
 *     checked, at 200 px, for a garment-only packshot: near-white borders, the
 *     subject fully inside the frame, garment-like proportions (a standing
 *     person is far taller than wide).
 *  3. Pick: the front packshot (overrides.ts can name one): IYS shoots the
 *     back (big print) then the front, so it is the less-detailed shot of the
 *     first pair, the later one on a near-tie.
 *  4. Cut out: flood-fill of the white backdrop from the borders at 800 px,
 *     specks dropped, 1 px edge softening, trimmed, ≤ 360 px WebP.
 *  5. Fit: hem / waist width and shoulder line measured from the mask, so
 *     stage.ts can size each piece to the model's anchors.
 *
 * Writes:
 *   public/iys/stylist/models/{men,women}{,-head}.webp
 *   public/iys/stylist/g/<handle>.webp
 *   src/data/stylist.generated.json   the mapping registry (stylist data only)
 *
 * Sources are official IYS photos only: the public catalogue snapshot's CDN
 * images (cached under .cache/stylist/, never committed) and the two
 * supplied reference photos. Needs Node ≥ 22.18 (imports the shared .ts).
 * Behind an HTTP proxy, run node with NODE_USE_ENV_PROXY=1.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { get } from './lib/http.mjs';
import { hydrate } from '../src/lib/catalogue/hydrate.ts';
import { classify } from '../src/features/dressup/classify.ts';
import { MODELS } from '../src/features/dressup/models.ts';
import { OVERRIDES, SLOT_POLICY, TYPE_POLICY } from '../src/features/dressup/overrides.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');
const scanOnly = process.argv.includes('--scan-only');
const modelsOnly = process.argv.includes('--models-only');
/** Dev preview: build from already-cached scan thumbnails only (no scan fetches, scan.json untouched). */
const partial = process.argv.includes('--partial');
const cacheDir = resolve(root, '.cache/stylist');
const outDir = resolve(root, 'public/iys/stylist');
mkdirSync(cacheDir, { recursive: true });
const log = (...a) => console.log('[stylist]', ...a);

const index = JSON.parse(readFileSync(resolve(root, 'src/data/catalogue-index.json'), 'utf8'));
const cat = hydrate(index);
const details = Object.assign({}, ...readdirSync(resolve(root, 'public/catalogue')).map((f) => JSON.parse(readFileSync(resolve(root, 'public/catalogue', f), 'utf8'))));

/** Slots composited on the models (everything else is view-only by policy). */
const COMPOSITE = new Set(['top', 'outer', 'bottom', 'onepiece', 'head', 'bag']);
const MAX_ASPECT = { top: 1.5, outer: 1.5, onepiece: 2.3, bottom: 2.3, head: 1.2, bag: 1.6 };
/** Cut-out widths: garments are shown up to ~300 css px, headwear and bags far smaller. */
const OUT_W = { top: 360, outer: 360, bottom: 300, onepiece: 360, head: 220, bag: 240 };

const cdn = (src, width) => {
  const u = new URL(src);
  u.search = '';
  u.searchParams.set('width', String(width));
  if (/\.heic$/i.test(u.pathname)) u.searchParams.set('format', 'jpg');
  return u.toString();
};
async function fetchCached(url) {
  const file = resolve(cacheDir, createHash('sha1').update(url).digest('hex'));
  if (existsSync(file)) return readFileSync(file);
  const buf = await get(url, { as: 'buffer' });
  writeFileSync(file, buf);
  return buf;
}
const rgbOf = async (buf, width) => sharp(buf).rotate().resize({ width, withoutEnlargement: true }).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });

// ── pixel helpers ───────────────────────────────────────────────────────
/** Flood-fill the backdrop from every border pixel; returns 1 = background. */
function floodBackdrop(d, w, h, isBg) {
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (i) => {
    if (!bg[i] && isBg(i)) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) push(x), push((h - 1) * w + x);
  for (let y = 0; y < h; y++) push(y * w), push(y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  return bg;
}
function bboxOf(mask, w, h, on = 1) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (mask[y * w + x] === on) {
        n++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return { x0, y0, x1, y1, n };
}
/** Keep connected foreground components ≥ 3 % of the largest (socks come in pairs). */
function dropSpecks(fg, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const sizes = [];
  for (let s = 0; s < w * h; s++) {
    if (!fg[s] || label[s] >= 0) continue;
    const id = sizes.length;
    let n = 0;
    const stack = [s];
    label[s] = id;
    while (stack.length) {
      const i = stack.pop();
      n++;
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w])
        if (j >= 0 && j < w * h && fg[j] && label[j] < 0) {
          label[j] = id;
          stack.push(j);
        }
    }
    sizes.push(n);
  }
  const max = Math.max(0, ...sizes);
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (label[i] >= 0 && sizes[label[i]] >= max * 0.03) out[i] = 1;
  return out;
}
const lum = (d, i) => 0.2126 * d[i * 3] + 0.7152 * d[i * 3 + 1] + 0.0722 * d[i * 3 + 2];

// ── 1. models ───────────────────────────────────────────────────────────
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
async function buildModels() {
  mkdirSync(resolve(outDir, 'models'), { recursive: true });
  const out = {};
  for (const m of Object.values(MODELS)) {
    const src = resolve(root, m.source.file);
    const crop = sharp(src).extract(m.source.crop).resize(m.width, m.height, { kernel: 'lanczos3' });
    const { data, info } = await crop.clone().removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    const file = resolve(root, 'public' + m.file);
    await sharp(data, { raw: { width: w, height: h, channels: 3 } }).webp({ quality: 84, effort: 6, smartSubsample: true }).toFile(file);
    // Head layer: inside the outline, minus the studio wall (light, low-chroma,
    // connected to the outline's outside), and below the chin only neck + dark hair.
    const keep = new Uint8Array(w * h);
    const { chinY, neck, hairLum } = m.headCut;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const nx = x / w, ny = y / h, i = y * w + x;
        if (!inPoly(nx, ny, m.headOutline)) continue;
        if (ny > chinY && !(nx >= neck[0] && nx <= neck[1]) && lum(data, i) > hairLum) continue;
        keep[i] = 1;
      }
    const wallish = (i) => {
      const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
      return Math.min(r, g, b) > 196 && Math.max(r, g, b) - Math.min(r, g, b) < 34;
    };
    // Flood the wall from outside the kept region.
    const wall = new Uint8Array(w * h);
    const stack = [];
    for (let i = 0; i < w * h; i++) if (!keep[i]) wall[i] = 2;
    for (let i = 0; i < w * h; i++)
      if (wall[i] === 2) {
        const x = i % w;
        for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w])
          if (j >= 0 && j < w * h && keep[j] && !wall[j] && wallish(j)) {
            wall[j] = 1;
            stack.push(j);
          }
      }
    while (stack.length) {
      const i = stack.pop();
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w])
        if (j >= 0 && j < w * h && keep[j] && !wall[j] && wallish(j)) {
          wall[j] = 1;
          stack.push(j);
        }
    }
    const alpha = Buffer.alloc(w * h);
    for (let i = 0; i < w * h; i++) alpha[i] = keep[i] && wall[i] !== 1 ? 255 : 0;
    const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } }).blur(0.6).extractChannel(0).raw().toBuffer();
    const { x0, y0, x1, y1 } = bboxOf(alpha, w, h, 255);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const rgba = Buffer.alloc(bw * bh * 4);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        const s = (y + y0) * w + (x + x0), t = (y * bw + x) * 4;
        rgba[t] = data[s * 3];
        rgba[t + 1] = data[s * 3 + 1];
        rgba[t + 2] = data[s * 3 + 2];
        rgba[t + 3] = soft[s];
      }
    await sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }).webp({ quality: 86, alphaQuality: 90, effort: 6 }).toFile(resolve(root, 'public' + m.headFile));
    out[m.id] = { file: m.file, headFile: m.headFile, head: { x: x0 / w, y: y0 / h, w: bw / w, h: bh / h }, bytes: statSync(file).size + statSync(resolve(root, 'public' + m.headFile)).size };
    log(`model ${m.id}: ${w}×${h}, head layer ${bw}×${bh}`);
  }
  return out;
}

// ── 2. packshot scan ────────────────────────────────────────────────────
const SCAN_W = 200;
function analyse(d, w, h) {
  const strict = (i) => Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) >= 242 && Math.max(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) - Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) <= 14;
  let ring = 0, white = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x < 3 || y < 3 || x >= w - 3 || y >= h - 3) {
        ring++;
        if (strict(y * w + x)) white++;
      }
  const loose = (i) => Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) >= 234 && Math.max(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) - Math.min(d[i * 3], d[i * 3 + 1], d[i * 3 + 2]) <= 18;
  const bg = floodBackdrop(d, w, h, loose);
  const fg = dropSpecks(bg.map((v) => 1 - v), w, h);
  const b = bboxOf(fg, w, h);
  const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
  // Print detail: share of the garment far from its dominant colour.
  const rs = [], gs = [], bs = [];
  for (let i = 0; i < w * h; i += 1) if (fg[i]) rs.push(d[i * 3]), gs.push(d[i * 3 + 1]), bs.push(d[i * 3 + 2]);
  const med = (a) => a.sort((x, y) => x - y)[a.length >> 1] ?? 0;
  const dom = [med(rs.slice()), med(gs.slice()), med(bs.slice())];
  let far = 0;
  for (let i = 0; i < w * h; i++) if (fg[i] && Math.abs(d[i * 3] - dom[0]) + Math.abs(d[i * 3 + 1] - dom[1]) + Math.abs(d[i * 3 + 2] - dom[2]) > 110) far++;
  return {
    border: +(white / ring).toFixed(3),
    fgFrac: +(b.n / (w * h)).toFixed(3),
    fill: b.n ? +(b.n / (bw * bh)).toFixed(3) : 0,
    aspect: b.n ? +(bh / bw).toFixed(3) : 0,
    touches: !b.n || b.x0 <= 1 || b.y0 <= 1 || b.x1 >= w - 2 || b.y1 >= h - 2,
    detail: b.n ? +(far / b.n).toFixed(3) : 0,
  };
}
// Detail cap: two models standing side by side on white also fit inside the
// frame, but their mix of skin, hair and clothes scores far above any garment.
const isPackshot = (a) => a.border >= 0.97 && !a.touches && a.fgFrac >= 0.05 && a.fgFrac <= 0.8 && a.aspect <= 2.3 && a.fill >= 0.3 && a.detail <= 0.42;
/**
 * Front of the first back/front pair: IYS shoots the back (big print) first,
 * then the front. The less-detailed shot of the pair wins; a near-tie (pastel
 * or tonal prints) goes to the later one.
 */
function pickFront(shots) {
  const [a, b] = shots;
  if (!b) return a;
  return b.detail <= a.detail + 0.015 ? b : a;
}

async function scan(relevant) {
  const file = resolve(cacheDir, 'scan.json');
  const prev = existsSync(file) && !force ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const out = {};
  let n = 0;
  for (const p of relevant) {
    const d = details[p.handle];
    if (!d) continue;
    out[p.handle] = [];
    for (const [i, im] of d.images.entries()) {
      const key = im.src.split('?')[0];
      let a = prev[p.handle]?.find((x) => x.src === key);
      if (!a && partial && !existsSync(resolve(cacheDir, createHash('sha1').update(cdn(im.src, SCAN_W)).digest('hex')))) continue;
      if (!a) {
        const { data, info } = await rgbOf(await fetchCached(cdn(im.src, SCAN_W)), SCAN_W);
        a = { i, src: key, ...analyse(data, info.width, info.height) };
      }
      out[p.handle].push({ ...a, i });
    }
    if (++n % 50 === 0 && !partial) {
      log(`scanned ${n}/${relevant.length}`);
      writeFileSync(file, JSON.stringify(out));
    }
  }
  if (!partial) writeFileSync(file, JSON.stringify(out));
  return out;
}

// ── 4. cut-out + 5. fit ─────────────────────────────────────────────────
const CUT_W = 800;
async function cutout(handle, slot, src) {
  const { data: d, info } = await rgbOf(await fetchCached(cdn(src, CUT_W)), CUT_W);
  const { width: w, height: h } = info;
  // Backdrop colour = median of the border ring; tolerance hugs it.
  const ring = [];
  for (let x = 0; x < w; x++) ring.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) ring.push(y * w, y * w + w - 1);
  const med = (c) => ring.map((i) => d[i * 3 + c]).sort((a, b) => a - b)[ring.length >> 1];
  const bgc = [med(0), med(1), med(2)];
  const isBg = (i) => Math.max(Math.abs(d[i * 3] - bgc[0]), Math.abs(d[i * 3 + 1] - bgc[1]), Math.abs(d[i * 3 + 2] - bgc[2])) <= 12;
  const bg = floodBackdrop(d, w, h, isBg);
  const fg = dropSpecks(bg.map((v) => 1 - v), w, h);
  const b = bboxOf(fg, w, h);
  const pad = 2;
  const x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad), x1 = Math.min(w - 1, b.x1 + pad), y1 = Math.min(h - 1, b.y1 + pad);
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const alpha = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = fg[i] ? 255 : 0;
  const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } }).blur(0.7).extractChannel(0).raw().toBuffer();
  const rgba = Buffer.alloc(bw * bh * 4);
  const mask = new Uint8Array(bw * bh);
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      const s = (y + y0) * w + (x + x0), t = (y * bw + x) * 4;
      rgba[t] = d[s * 3];
      rgba[t + 1] = d[s * 3 + 1];
      rgba[t + 2] = d[s * 3 + 2];
      // Only soften the outside edge: never punch holes into the garment.
      rgba[t + 3] = fg[s] ? Math.max(soft[s], 200) : soft[s] > 96 ? soft[s] >> 1 : 0;
      mask[y * bw + x] = fg[s];
    }
  // Fit metrics on the trimmed mask (fractions of the cut-out).
  const rows = [];
  const cx = Math.round(bw / 2);
  for (let y = 0; y < bh; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < bw; x++) if (mask[y * bw + x]) (l < 0 && (l = x), (r = x));
    let cl = cx, cr = cx;
    let hit = Boolean(mask[y * bw + cx]);
    if (!hit && l >= 0) {
      // Open front (zip-up worn open): bridge the gap to the nearest panel on each side.
      while (cl > 0 && !mask[y * bw + cl]) cl--;
      while (cr < bw - 1 && !mask[y * bw + cr]) cr++;
      hit = Boolean(mask[y * bw + cl] && mask[y * bw + cr]) && cr - cl < bw * 0.2;
    }
    if (hit) {
      while (cl > 0 && mask[y * bw + cl - 1]) cl--;
      while (cr < bw - 1 && mask[y * bw + cr + 1]) cr++;
    }
    rows.push({ span: l < 0 ? 0 : r - l + 1, run: hit ? cr - cl + 1 : 0, mid: hit ? (cl + cr) / 2 : cx });
  }
  const band = (a, z) => rows.slice(Math.floor(bh * a), Math.ceil(bh * z)).filter((r) => r.run > 0);
  const median = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1] ?? 0;
  // On cropped boxy fits the sleeves hang below the hem, so this band misses the
  // body: hemW stays 0 here and is filled with the slot's median afterwards.
  const hem = band(0.86, 0.95);
  const hemW = median(hem.map((r) => r.run)) / bw;
  const hemMid = median(hem.map((r) => r.mid)) / bw;
  const top = band(0.01, 0.06);
  const waistW = median(top.map((r) => r.span)) / bw;
  const shoulderRow = rows.findIndex((r) => r.span >= 0.8 * hemW * bw);
  const fit = { hemW: +hemW.toFixed(4), cx: +hemMid.toFixed(4), shoulderY: +(Math.max(0, shoulderRow) / bh).toFixed(4), waistW: +waistW.toFixed(4) };
  const outW = Math.min(OUT_W[slot], bw);
  const outH = Math.round((bh * outW) / bw);
  const rel = `g/${handle}.webp`;
  const file = resolve(outDir, rel);
  mkdirSync(dirname(file), { recursive: true });
  await sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } }).resize(outW, outH, { kernel: 'lanczos3' }).webp({ quality: 80, alphaQuality: 85, effort: 6, smartSubsample: true }).toFile(file);
  const area = b.n / (bw * bh);
  return { file: `/iys/stylist/${rel}`, w: outW, h: outH, fit, area: +area.toFixed(3), bytes: statSync(file).size };
}

// ── main ────────────────────────────────────────────────────────────────
const models = scanOnly ? null : await buildModels();
if (modelsOnly) process.exit(0);
const classified = cat.products.map((p) => ({ p, c: classify(p) }));
const relevant = classified.filter((x) => x.c.relevant);
log(`catalogue ${cat.products.length}, stylist-relevant ${relevant.length}`);
const scanned = await scan(relevant.map((x) => x.p));
if (scanOnly) {
  const withShot = Object.values(scanned).filter((a) => a.some(isPackshot)).length;
  log(`scan only: ${withShot} products have a packshot`);
  process.exit(0);
}

const items = {};
const skip = {};
const keepFiles = new Set();
let bytes = 0;
for (const { p, c } of relevant) {
  const ov = OVERRIDES[p.handle] ?? {};
  const policy = SLOT_POLICY[c.slot] ?? TYPE_POLICY[(p.productType ?? '').replace(/\s+/g, ' ').trim()];
  if (policy) {
    skip[p.handle] = policy;
    continue;
  }
  // Per-slot proportions: a flat top / layer is at most ~1.4× taller than wide
  // (two models side by side are 1.5–1.8×); trousers may be up to 2.3×.
  const shots = (scanned[p.handle] ?? []).filter((a) => isPackshot(a) && a.aspect <= (MAX_ASPECT[c.slot] ?? 2.3));
  if (!COMPOSITE.has(c.slot) || !shots.length) {
    skip[p.handle] = 'no-packshot';
    continue;
  }
  if (ov.reject) {
    skip[p.handle] = 'cutout-rejected';
    continue;
  }
  const pick = ov.image !== undefined ? (scanned[p.handle] ?? []).find((s) => s.i === ov.image) : pickFront(shots);
  if (!pick) {
    skip[p.handle] = 'cutout-rejected';
    continue;
  }
  const src = details[p.handle].images[pick.i].src;
  const cut = await cutout(p.handle, c.slot, src);
  keepFiles.add(cut.file);
  bytes += cut.bytes;
  items[p.handle] = {
    slot: c.slot,
    file: cut.file,
    w: cut.w,
    h: cut.h,
    image: pick.i,
    src: src.split('?')[0].split('/').pop(),
    packshots: shots.map((s) => s.i),
    fit: { ...cut.fit, ...(ov.scale ? { scale: ov.scale } : {}), ...(ov.dx ? { dx: ov.dx } : {}), ...(ov.dy ? { dy: ov.dy } : {}) },
  };
}
// Pieces whose hem could not be measured take their slot's median hem ratio.
for (const slot of ['top', 'outer', 'onepiece']) {
  const ok = Object.values(items).filter((it) => it.slot === slot && it.fit.hemW > 0);
  const med = (k) => ok.map((it) => it.fit[k]).sort((a, b) => a - b)[ok.length >> 1];
  for (const it of Object.values(items))
    if (it.slot === slot && !(it.fit.hemW > 0) && ok.length) Object.assign(it.fit, { hemW: med('hemW'), cx: 0.5, shoulderY: med('shoulderY'), hemFromSlot: true });
}

// Drop cut-outs of products that left the catalogue (stale files never linger).
for (const f of existsSync(resolve(outDir, 'g')) ? readdirSync(resolve(outDir, 'g')) : []) if (!keepFiles.has(`/iys/stylist/g/${f}`)) rmSync(resolve(outDir, 'g', f));

const registry = {
  generatedAt: new Date().toISOString(),
  catalogueGeneratedAt: index.generatedAt,
  source: 'Official IYS product photos (cdn.shopify.com, public catalogue snapshot) + the two supplied IYS studio photos. Deterministic crop / flood-fill cut-out only.',
  models,
  items: Object.fromEntries(Object.entries(items).sort(([a], [b]) => a.localeCompare(b))),
  skip: Object.fromEntries(Object.entries(skip).sort(([a], [b]) => a.localeCompare(b))),
};
writeFileSync(resolve(root, 'src/data/stylist.generated.json'), JSON.stringify(registry, null, 1) + '\n');
const bySlot = {};
for (const it of Object.values(items)) bySlot[it.slot] = (bySlot[it.slot] ?? 0) + 1;
const reasons = {};
for (const r of Object.values(skip)) reasons[r] = (reasons[r] ?? 0) + 1;
log(`wearable ${Object.keys(items).length} ${JSON.stringify(bySlot)}; view-only ${Object.keys(skip).length} ${JSON.stringify(reasons)}; cut-outs ${(bytes / 1024).toFixed(0)} KB`);
