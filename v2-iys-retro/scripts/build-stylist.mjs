/**
 * npm run build-stylist [-- --models-only]
 *
 * Prepares DRESSUP.EXE's assets, deterministically (no AI, no generative step,
 * no runtime vision): same catalogue + same photos + same approvals in →
 * same files out.
 *
 *  1. Models: crops the two supplied official IYS studio photos
 *     (scripts/stylist/reference-*.webp, kept untouched) to 600 × 900, and cuts
 *     each head + hair out of the same photo (studio wall removed inside a
 *     hand-measured outline), the layer drawn over every outfit.
 *  2. Whole looks (official, worn one at a time): for each official product
 *     photo in src/features/dressup/looks.ts WHOLE_LOOKS (one of the two
 *     canonical models wearing the piece), the canonical head is found in the
 *     photo, the photo is scaled + shifted onto the canonical frame, and the
 *     model's body below the chin (that photo's whole outfit, arms and hands
 *     included) becomes one transparent layer (scripts/lib/stylist-look.mjs).
 *  3. Slot layers (they combine: any top with any bottom): ONLY from the
 *     manually approved candidates of the job manifest
 *     (scripts/stylist/tryon/, scripts/lib/tryon-pipeline.mjs): an approved
 *     official photo cut to its slot, or an approved offline try-on of the
 *     canonical photo. A slot layer replaces that piece's whole look on that
 *     model. Only a model with at least one slot layer gets its canonical
 *     photo split into the room / upper body / trousers they are drawn over.
 *  A piece with none of these stays view-only: a flat packshot never looks worn.
 *
 * Writes:
 *   public/iys/stylist/models/{men,women}{,-head}.webp
 *   public/iys/stylist/models/{men,women}-{room,upper,lower,inner}.webp   only with slot layers
 *   public/iys/stylist/look/{men,women}/<handle>.webp                     whole looks
 *   public/iys/stylist/slot/{men,women}/<handle>{,.inner}.webp            approved slot layers
 *   scripts/stylist/tryon/built.json                                      what each approved layer was built from
 *   src/data/stylist.generated.json                                       the registry (stylist data only)
 *
 * Sources are official IYS photos only: the public catalogue snapshot's CDN
 * images (cached under .cache/stylist/, never committed), the two supplied
 * reference photos, and approved candidates (.cache/stylist/tryon/, never
 * committed). Needs Node ≥ 22.18 (imports the shared .ts). Behind an HTTP
 * proxy, run node with NODE_USE_ENV_PROXY=1.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { classify, fitsModel } from '../src/features/dressup/classify.ts';
import { MODELS } from '../src/features/dressup/models.ts';
import { SLOT_POLICY } from '../src/features/dressup/overrides.ts';
import { FIT_REJECTED, SHOOT_LOOKS, WHOLE_LOOKS } from '../src/features/dressup/looks.ts';
import { compose, H, locate, locateBeside, prepareBase, W } from './lib/stylist-look.mjs';
import { canonical, cdn, context, fetchCached, ingest, loadCatalogue, saveLayer, saveMask } from './lib/tryon-pipeline.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modelsOnly = process.argv.includes('--models-only');
const outDir = resolve(root, 'public/iys/stylist');
const ctx = context(root, { log: (...a) => console.log('[stylist]', ...a) });
const log = ctx.log;

const C = loadCatalogue(root);
const { index, cat, details } = C;

/** Body slots: the only ones an official on-model photo can dress. */
const BODY = new Set(['top', 'outer', 'bottom', 'onepiece']);
/** Product photos are aligned at this width (the canonical frame is 600 px wide). */
const LOOK_W = 1000;
/** Head-match floor: below it the photo changed since review (or shows someone else). */
const MIN_SCORE = { solo: 0.72, beside: 0.5 };

// ── pixel helpers ───────────────────────────────────────────────────────
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

async function saveLook(model, handle, res) {
  const { x0, y0, x1, y1 } = res.box;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const rel = `look/${model}/${handle}.webp`;
  const file = resolve(outDir, rel);
  mkdirSync(dirname(file), { recursive: true });
  await sharp(res.layer, { raw: { width: W, height: H, channels: 4 } }).extract({ left: x0, top: y0, width: bw, height: bh }).webp({ quality: 82, alphaQuality: 90, effort: 6, smartSubsample: true }).toFile(file);
  const f = (n) => +n.toFixed(5);
  return { file: `/iys/stylist/${rel}`, box: { x: f(x0 / W), y: f(y0 / H), w: f(bw / W), h: f(bh / H) } };
}

/** 2. Whole looks, exactly as deployed. */
async function buildLooks(models, bySlot) {
  const looks = {};
  const failed = new Set();
  const headFile = (id) => resolve(root, 'public' + MODELS[id].headFile);
  for (const m of Object.values(MODELS)) {
    const a = { cx: m.anchors.cx, hipW: m.anchors.hipW, chinY: m.headCut.chinY, legsFrom: m.anchors.legsFrom, legsHalf: m.anchors.legsHalf };
    const head = models[m.id].head;
    const B = await prepareBase(resolve(root, 'public' + m.file), a);
    const add = async (handle, res, image, src, score) => {
      const saved = await saveLook(m.id, handle, res);
      (looks[handle] ??= {})[m.id] = { file: saved.file, box: saved.box, source: 'official', scope: 'whole', image, src, score: +score.toFixed(3) };
    };
    // the piece worn in the canonical photo: nothing to draw, the photo already shows it
    const shoot = SHOOT_LOOKS[m.id];
    if (BODY.has(bySlot.get(shoot))) (looks[shoot] ??= {})[m.id] = { shoot: true, src: m.source.file.split('/').pop() };
    for (const s of WHOLE_LOOKS[m.id]) {
      const tag = `look ${m.id} ${s.handle}#${s.image}`;
      if (!BODY.has(bySlot.get(s.handle))) {
        log(`${tag}: not a garment in the catalogue any more, skipped`);
        continue;
      }
      const im = details[s.handle]?.images[s.image];
      if (!im) {
        log(`${tag}: image gone, view-only`);
        failed.add(s.handle);
        continue;
      }
      const buf = await fetchCached(ctx, cdn(im.src, LOOK_W));
      // pair shot: find him first, then her beside him (a free search is unreliable)
      const anchor = await locate(buf, headFile(s.beside ? 'men' : m.id));
      const loc = s.beside ? await locateBeside(buf, headFile(m.id), anchor, -1) : anchor;
      const floor = s.beside ? MIN_SCORE.beside : MIN_SCORE.solo;
      if (loc.score < floor || (s.beside && anchor.score < MIN_SCORE.solo)) {
        log(`${tag}: head match ${loc.score.toFixed(2)} below ${floor}, view-only`);
        failed.add(s.handle);
        continue;
      }
      const res = await compose(buf, loc, head, B);
      if (!res.layer) {
        log(`${tag}: ${res.reason}, view-only`);
        failed.add(s.handle);
        continue;
      }
      await add(s.handle, res, s.image, im.src.split('?')[0].split('/').pop(), loc.score);
    }
  }
  return { looks, failed };
}

// ── 3. slot layers (approved candidates only) ───────────────────────────
const CANON_PARTS = ['room', 'upper', 'lower', 'inner'];
/** A model's canonical photo split into what slot layers are drawn over (only for a model with slot layers). */
async function writeCanonical(models, model) {
  const K = await canonical(ctx, model);
  const rel = (p) => `/iys/stylist/models/${model}-${p}.webp`;
  await sharp(K.room, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 84, effort: 6, smartSubsample: true }).toFile(resolve(root, 'public' + rel('room')));
  const layers = {
    room: { file: rel('room'), box: { x: 0, y: 0, w: 1, h: 1 } },
    upper: await saveLayer(ctx, K.upper, rel('upper')),
    lower: await saveLayer(ctx, K.lower, rel('lower')),
    ...(K.inner ? { inner: await saveMask(ctx, K.inner, rel('inner')) } : {}),
  };
  for (const l of Object.values(layers)) models[model].bytes += statSync(resolve(root, 'public' + l.file)).size;
  Object.assign(models[model], layers);
  log(`model ${model}: room + upper + lower${K.inner ? ' + open front' : ''} (slot layers are drawn over them)`);
}

// ── main ────────────────────────────────────────────────────────────────
const models = await buildModels();
if (modelsOnly) process.exit(0);
const relevant = cat.products.map((p) => ({ p, c: classify(p) })).filter((x) => x.c.relevant);
log(`catalogue ${cat.products.length}, stylist-relevant ${relevant.length}`);
const { looks, failed } = await buildLooks(models, new Map(relevant.map(({ p, c }) => [p.handle, c.slot])));

const { looks: slots, report } = await ingest(ctx, C);
for (const s of report.stale) log(`slot job ${s.id}: stale (${s.reason}), not ingested`);
for (const s of report.skipped) log(`slot job ${s.id}: ${s.reason}, not ingested`);
const slotModels = new Set(Object.values(slots).flatMap((l) => Object.keys(l)));
for (const m of Object.keys(MODELS)) {
  if (slotModels.has(m)) await writeCanonical(models, m);
  else for (const p of CANON_PARTS) rmSync(resolve(outDir, `models/${m}-${p}.webp`), { force: true });
}
// an approved slot layer replaces that piece's whole look on that model (it combines with the other slots)
for (const [h, by] of Object.entries(slots)) Object.assign((looks[h] ??= {}), by);

const items = {};
const skip = {};
const keepFiles = new Set();
for (const { p, c } of relevant) {
  const policy = SLOT_POLICY[c.slot];
  if (policy || !BODY.has(c.slot)) {
    skip[p.handle] = policy ?? 'not-on-these-models';
    continue;
  }
  // a model only wears what the store lists for them (a piece filed as women's stays off him, even if he modelled it)
  const own = Object.fromEntries(Object.entries(looks[p.handle] ?? {}).filter(([m]) => fitsModel(c.audience, m)));
  if (Object.keys(own).length) {
    items[p.handle] = { kind: 'on-model', slot: c.slot, looks: own };
    for (const l of Object.values(own)) for (const f of [l.file, l.inner?.file]) if (f) keepFiles.add(f);
  } else skip[p.handle] = looks[p.handle] ? 'other-model' : failed.has(p.handle) || p.handle in FIT_REJECTED ? 'fit-rejected' : 'not-on-these-models';
}

// Drop layers no mapping uses (products that left the catalogue, rejected photos, withdrawn
// approvals) and the retired flat cut-outs: stale files never linger.
rmSync(resolve(outDir, 'g'), { recursive: true, force: true });
for (const dir of ['look/men', 'look/women', 'slot/men', 'slot/women'])
  for (const f of existsSync(resolve(outDir, dir)) ? readdirSync(resolve(outDir, dir)) : []) if (!keepFiles.has(`/iys/stylist/${dir}/${f}`)) rmSync(resolve(outDir, dir, f));
for (const dir of ['slot/men', 'slot/women', 'slot']) if (existsSync(resolve(outDir, dir)) && !readdirSync(resolve(outDir, dir)).length) rmSync(resolve(outDir, dir), { recursive: true });

const bytes = [...keepFiles].reduce((n, f) => n + statSync(resolve(root, 'public' + f)).size, 0);
const registry = {
  generatedAt: new Date().toISOString(),
  catalogueGeneratedAt: index.generatedAt,
  source: 'Official IYS product photos (cdn.shopify.com, public catalogue snapshot) + the two supplied IYS studio photos. Deterministic alignment (head template match, scale + translate), backdrop flood-fill and crop only. Slot layers only from manually approved candidates (scripts/stylist/tryon/approvals.json).',
  models,
  items: Object.fromEntries(Object.entries(items).sort(([a], [b]) => a.localeCompare(b))),
  skip: Object.fromEntries(Object.entries(skip).sort(([a], [b]) => a.localeCompare(b))),
};
writeFileSync(resolve(root, 'src/data/stylist.generated.json'), JSON.stringify(registry, null, 1) + '\n');
const bySlot = {};
const perModel = { men: 0, women: 0 };
let slotN = 0;
for (const it of Object.values(items)) {
  bySlot[it.slot] = (bySlot[it.slot] ?? 0) + 1;
  for (const [m, l] of Object.entries(it.looks)) perModel[m]++, (slotN += l.scope === 'slot' ? 1 : 0);
}
const reasons = {};
for (const r of Object.values(skip)) reasons[r] = (reasons[r] ?? 0) + 1;
log(`wearable ${Object.keys(items).length} ${JSON.stringify(bySlot)} (layers ${JSON.stringify(perModel)}, slot layers ${slotN}); view-only ${Object.keys(skip).length} ${JSON.stringify(reasons)}; layers ${(bytes / 1024).toFixed(0)} KB`);
