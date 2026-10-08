/**
 * DRESSUP.EXE slot-asset pipeline (development time only; never bundled).
 * The pure rules live in src/features/dressup/tryon.ts; this is the file and
 * pixel side, shared by scripts/stylist-tryon.mjs (the CLI) and
 * scripts/build-stylist.mjs (ingestion).
 *
 *   plan      the job manifest (scripts/stylist/tryon/jobs.json): real
 *             catalogue products, referenced by handle + image index only
 *   export    a pack per derived job for an offline image-editing / virtual
 *             try-on capability: the canonical frame, the official product
 *             photos, the strict prompt, the return instructions
 *   import    returned images (scripts/stylist/candidates/<job id>.png)
 *             validated against the job (job identity, product, model, slot,
 *             size) and checked against the canonical photo; then
 *             needs-review
 *   official  official photos of the canonical model aligned to the frame
 *             (the candidates of the 'official' jobs); then needs-review
 *   sheet     review sheets: canonical | official product photos |
 *             candidate | extracted slot layer | in DRESSUP.EXE, + metadata
 *   decide    approve / reject exactly the reviewed candidate (by hash)
 *   ingest    approved candidates only → slot layers in public/ + built.json
 *
 * Nothing here calls an image service or generates anything: the generation
 * step happens outside this repo, by a person with an actual capability.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import sharp from 'sharp';
import { get } from './http.mjs';
import { analyse, isPackshot, pickFront, SCAN_W } from './packshots.mjs';
import { body, H, inPoly, locate, locateBeside, prepareBase, roomPlate, W } from './stylist-look.mjs';
import { innerOf, lowerLayer, seamOf, slotLayer, splitBody, upperLayer } from './stylist-slots.mjs';
import { hydrate } from '../../src/lib/catalogue/hydrate.ts';
import { classify } from '../../src/features/dressup/classify.ts';
import { MODELS } from '../../src/features/dressup/models.ts';
import { OFFICIAL_SLOT_CANDIDATES, SHOOT_LOOKS } from '../../src/features/dressup/looks.ts';
import { ingestible, jobId, PLAN, PROMPT_VERSION, promptFor, REJECT_REASONS, statusOf, validateJob } from '../../src/features/dressup/tryon.ts';

// ── paths ───────────────────────────────────────────────────────────────
/**
 * Where everything lives. Committed: the manifest, the review record and the
 * build record (scripts/stylist/tryon/), the inbox README. Never committed:
 * .cache/ (downloads, packs, candidates, sheets) and the inbox's contents.
 * Tests pass their own directories so nothing real is touched.
 */
export function context(root, over = {}) {
  const state = over.state ?? resolve(root, 'scripts/stylist/tryon');
  const work = over.work ?? resolve(root, '.cache/stylist/tryon');
  return {
    root,
    manifest: resolve(state, 'jobs.json'),
    approvals: resolve(state, 'approvals.json'),
    built: resolve(state, 'built.json'),
    inbox: over.inbox ?? resolve(root, 'scripts/stylist/candidates'),
    downloads: over.downloads ?? resolve(root, '.cache/stylist'),
    work,
    candidates: resolve(work, 'candidates'),
    outbox: resolve(work, 'outbox'),
    review: resolve(work, 'review'),
    public: over.public ?? resolve(root, 'public'),
    registry: resolve(root, 'src/data/stylist.generated.json'),
    log: over.log ?? ((...a) => console.log('[tryon]', ...a)),
  };
}

export const sha = (buf) => createHash('sha256').update(buf).digest('hex');
export const readJson = (f, d) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : d);
const writeJson = (f, v) => {
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(v, null, 1) + '\n');
};

// ── catalogue + CDN ─────────────────────────────────────────────────────
/** The catalogue snapshot (src/data + public/catalogue): products, their image lists, and classify() per handle. */
export function loadCatalogue(root) {
  const index = JSON.parse(readFileSync(resolve(root, 'src/data/catalogue-index.json'), 'utf8'));
  const cat = hydrate(index);
  const details = Object.assign({}, ...readdirSync(resolve(root, 'public/catalogue')).map((f) => JSON.parse(readFileSync(resolve(root, 'public/catalogue', f), 'utf8'))));
  const byHandle = new Map(cat.products.map((p) => [p.handle, p]));
  const classOf = (h) => (byHandle.has(h) ? classify(byHandle.get(h)) : undefined);
  return { index, cat, details, byHandle, classOf };
}

/** An official CDN image at a given width (Shopify's resizer). */
export const cdn = (src, width) => {
  const u = new URL(src);
  u.search = '';
  u.searchParams.set('width', String(width));
  if (/\.heic$/i.test(u.pathname)) u.searchParams.set('format', 'jpg');
  return u.toString();
};
export async function fetchCached(ctx, url) {
  mkdirSync(ctx.downloads, { recursive: true });
  const file = resolve(ctx.downloads, createHash('sha1').update(url).digest('hex'));
  if (existsSync(file)) return readFileSync(file);
  const buf = await get(url, { as: 'buffer' });
  writeFileSync(file, buf);
  return buf;
}

// ── the canonical frame ─────────────────────────────────────────────────
/** The anchors the slot split reads, per model. */
export const anchorsOf = (m) => ({ cx: m.anchors.cx, hipW: m.anchors.hipW, chinY: m.headCut.chinY, outline: m.bodyOutline, hands: m.handBoxes });
/** The canonical head box (normalised), as measured by the model build. */
export const headBox = (ctx, model) => readJson(ctx.registry, { models: {} }).models?.[model]?.head;

const canonMemo = new Map();
/**
 * The canonical photo split into what slot layers are drawn over: the empty
 * room, the canonical upper body and trousers, the open front of the
 * canonical layer, and the hem line a bottom has to reach.
 */
export async function canonical(ctx, model) {
  const key = `${ctx.public}|${model}`;
  if (canonMemo.has(key)) return canonMemo.get(key);
  const m = MODELS[model];
  const a = anchorsOf(m);
  const B = await prepareBase(resolve(ctx.public, '.' + m.file), a);
  const sp = splitBody(B.base, 3, B.fg, a, B.fg.bg);
  if (sp.reason) throw new Error(`canonical ${model}: ${sp.reason}`);
  const out = {
    m,
    a,
    B,
    room: roomPlate(B),
    upper: await upperLayer(B.base, 3, sp, B.fg.bg, a),
    lower: await lowerLayer(B.base, 3, sp, B.fg.bg, a, { keepRim: true }),
    inner: innerOf(B.base, 3, sp, a),
    hem: seamOf(sp) - 12,
  };
  canonMemo.set(key, out);
  return out;
}

// ── 1. plan ─────────────────────────────────────────────────────────────
/** Colour words a product line's colourways start with (black-basic-…, heather-grey-…). */
const COLOURS = new Set('black white off offwhite grey gray heather dark light navy blue baby sky green olive sage mint brown beige cream ivory sand camel burgundy maroon red pink rose butter yellow mustard orange purple lilac lavender khaki charcoal washed'.split(' '));
/** A product line: the handle without its leading colour words (gender prefixes too). */
export const lineOf = (handle) => {
  const parts = handle.split('-');
  let k = 0;
  while (k < parts.length - 1 && (COLOURS.has(parts[k]) || parts[k] === 'male' || parts[k] === 'female')) k++;
  return parts.slice(k).join('-');
};

/** Packshot analysis of a product's images (200 px thumbnails, cached). */
export async function analyseProduct(ctx, details, handle, slot) {
  const file = resolve(ctx.work, 'analysis.json');
  const cache = readJson(file, {});
  const images = details[handle]?.images ?? [];
  const out = [];
  let dirty = false;
  for (let k = 0; k < images.length; k++) {
    const src = images[k].src.split('?')[0];
    if (!cache[src]) {
      const buf = await fetchCached(ctx, cdn(src, SCAN_W));
      const { data, info } = await sharp(buf).rotate().resize({ width: SCAN_W }).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
      cache[src] = analyse(data, info.width, info.height);
      dirty = true;
    }
    out.push({ image: k, ...cache[src], packshot: isPackshot(cache[src], { maxAspect: slot === 'bottom' ? 3.6 : 2.3 }) });
  }
  if (dirty) writeJson(file, cache);
  return out;
}

/**
 * The garment references for a derived job. With a clean packshot: the front
 * packshot first, one more packshot, two other official photos. Without one
 * (IYS shoots many pieces only on models or on coloured sets): up to four
 * official photos. Null when the product has fewer than two images.
 */
export function referencesOf(shots) {
  const packs = shots.filter((s) => s.packshot);
  const photos = shots.filter((s) => !s.packshot);
  if (!packs.length) return shots.length >= 2 ? photos.slice(0, 4).map((s) => ({ image: s.image, role: 'photo' })) : null;
  const front = pickFront(packs);
  return [
    { image: front.image, role: 'packshot-front' },
    ...packs.filter((s) => s !== front).slice(0, 1).map((s) => ({ image: s.image, role: 'packshot' })),
    ...photos.slice(0, 2).map((s) => ({ image: s.image, role: 'photo' })),
  ];
}

/**
 * A product sold in several colours has one try-on per model, so its job
 * targets ONE colourway: the one with the most clean packshots among the
 * images its variants are linked to (ties: the catalogue's first colour).
 * Only that colourway's images are references (unlinked images could show
 * either colour). Null for a single-colour product (every image is it).
 */
export function colourwayOf(detail, shots) {
  const ci = (detail?.options ?? []).findIndex((o) => o.name === detail.colorOption);
  if (ci < 0 || (detail.colors ?? []).length < 2) return null;
  const by = new Map(detail.colors.map((c) => [c, new Set()]));
  for (const v of detail.variants ?? []) {
    const k = detail.images.findIndex((im) => im.id === v.imageId);
    if (k >= 0) by.get(v.options[ci])?.add(k);
  }
  const packs = (c) => shots.filter((s) => s.packshot && by.get(c).has(s.image)).length;
  const color = [...by.keys()].filter((c) => by.get(c).size).sort((a, b) => packs(b) - packs(a))[0];
  return color ? { color, images: by.get(color) } : { color: null, images: new Set() };
}

/**
 * The job manifest: the official slot candidates (looks.ts) and the first
 * batch of derived try-on jobs (tryon.ts PLAN), resolved against the live
 * catalogue. Per bucket, best-referenced first (after the model's own range,
 * for `own` buckets): pieces with a clean front packshot, then available
 * pieces, then the catalogue's own order; at most 2
 * colourways of one product line and `perType` of one product type, so the
 * batch covers the range rather than one bestseller in eight colours. A piece
 * that has an official job for that model, or is the one the canonical photo
 * shows, gets no derived job. Jobs that already carry a review decision are
 * kept even if re-planning would drop them.
 */
export async function planJobs(ctx, C) {
  const jobs = [];
  for (const [model, list] of Object.entries(OFFICIAL_SLOT_CANDIDATES))
    list.forEach((s, rank) => {
      const c = C.classOf(s.handle);
      if (!c?.relevant) return ctx.log(`official ${model} ${s.handle}: not stylist-relevant any more, no job`);
      jobs.push({
        id: jobId('official', model, s.handle),
        method: 'official',
        handle: s.handle,
        model,
        slot: c.slot,
        bucket: 'official',
        rank: rank + 1,
        canonical: `public${MODELS[model].file}`,
        references: [{ image: s.image, role: 'photo' }],
        source: { image: s.image, ...(s.beside ? { beside: true } : {}) },
      });
    });
  for (const [model, buckets] of Object.entries(PLAN)) {
    const official = new Set(OFFICIAL_SLOT_CANDIDATES[model].map((s) => s.handle));
    const taken = new Set();
    for (const b of buckets) {
      const pool = [];
      for (const [order, p] of C.cat.products.entries()) {
        const c = classify(p);
        if (!c.relevant || c.slot !== b.slot || (c.audience !== 'shared' && c.audience !== model)) continue;
        if (official.has(p.handle) || SHOOT_LOOKS[model] === p.handle || taken.has(p.handle)) continue;
        const type = (p.productType ?? '').trim();
        if ((b.types && !b.types.includes(type)) || b.notTypes?.includes(type)) continue;
        const shots = await analyseProduct(ctx, C.details, p.handle, b.slot);
        const way = colourwayOf(C.details[p.handle], shots);
        if (way && !way.color) continue;
        const refs = referencesOf(way ? shots.filter((x) => way.images.has(x.image)) : shots);
        if (refs) pool.push({ p, refs, order, color: way?.color, own: c.audience === model, packshot: refs[0].role === 'packshot-front' });
      }
      const by = (f) => (x, y) => Number(f(y)) - Number(f(x));
      const rankers = [...(b.own ? [by((e) => e.own)] : []), by((e) => e.packshot), by((e) => e.p.available !== false)];
      pool.sort((x, y) => rankers.reduce((r, f) => r || f(x, y), 0) || x.order - y.order);
      const perLine = new Map(), perType = new Map();
      let rank = 0;
      for (const { p, refs, color } of pool) {
        if (rank >= b.take) break;
        const line = lineOf(p.handle), type = (p.productType ?? '').trim();
        if ((perLine.get(line) ?? 0) >= 2 || (perType.get(type) ?? 0) >= (b.perType ?? 3)) continue;
        perLine.set(line, (perLine.get(line) ?? 0) + 1);
        perType.set(type, (perType.get(type) ?? 0) + 1);
        taken.add(p.handle);
        jobs.push({
          id: jobId('derived', model, p.handle),
          method: 'derived',
          handle: p.handle,
          model,
          slot: b.slot,
          bucket: b.bucket,
          rank: ++rank,
          canonical: `public${MODELS[model].file}`,
          ...(color ? { color } : {}),
          references: refs,
          prompt: promptFor(b.slot, p.title, model, color),
          promptVersion: PROMPT_VERSION,
        });
      }
      if (rank < b.take) ctx.log(`plan ${model} ${b.bucket}: only ${rank} of ${b.take}`);
    }
  }
  // never drop a job someone already reviewed
  const approvals = readJson(ctx.approvals, []);
  const ids = new Set(jobs.map((j) => j.id));
  for (const j of readJson(ctx.manifest, { jobs: [] }).jobs) if (!ids.has(j.id) && approvals.some((a) => a.id === j.id)) jobs.push(j);
  const manifest = { version: 1, catalogueGeneratedAt: C.index.generatedAt, promptVersion: PROMPT_VERSION, jobs };
  writeJson(ctx.manifest, manifest);
  return manifest;
}

export const loadJobs = (ctx) => readJson(ctx.manifest, { jobs: [] }).jobs;

// ── status ──────────────────────────────────────────────────────────────
const INBOX_EXT = ['.png', '.jpg', '.jpeg', '.webp'];
const inboxFiles = (ctx) => (existsSync(ctx.inbox) ? readdirSync(ctx.inbox).filter((f) => INBOX_EXT.includes(extname(f).toLowerCase())) : []);
export const candidateFile = (ctx, id) => resolve(ctx.candidates, `${id}.png`);
export const candidateHash = (ctx, id) => (existsSync(candidateFile(ctx, id)) ? sha(readFileSync(candidateFile(ctx, id))) : null);
export const recordOf = (ctx, id) => readJson(resolve(ctx.candidates, `${id}.json`), null);
export const slotFile = (job, inner = false) => `/iys/stylist/slot/${job.model}/${job.handle}${inner ? '.inner' : ''}.webp`;

/** Every job's status (from the files + the review record, never stored). */
export function statuses(ctx) {
  const approvals = readJson(ctx.approvals, []);
  const built = readJson(ctx.built, {});
  const inbox = new Set(inboxFiles(ctx).map((f) => basename(f, extname(f))));
  return loadJobs(ctx).map((job) => ({ job, status: statusOf(job, { inbox: inbox.has(job.id), candidate: candidateHash(ctx, job.id), built: built[job.id] }, approvals) }));
}

// ── 2. export (derived jobs) ────────────────────────────────────────────
/**
 * A generation pack per job, for whoever runs the offline try-on capability:
 * input-1 the canonical frame (edit THIS image), input-2… the official
 * product photos, prompt.txt, job.json, RETURN.txt.
 */
export async function exportPack(ctx, C, job) {
  if (job.method !== 'derived') throw new Error(`${job.id}: official jobs need no generation`);
  const dir = resolve(ctx.outbox, job.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  await sharp(resolve(ctx.root, job.canonical)).png().toFile(resolve(dir, 'input-1-canonical.png'));
  const images = C.details[job.handle].images;
  const files = [];
  for (const [k, r] of job.references.entries()) {
    const name = `input-${k + 2}-${r.role}.jpg`;
    const buf = await fetchCached(ctx, cdn(images[r.image].src, 1600));
    await sharp(buf).rotate().flatten({ background: '#ffffff' }).jpeg({ quality: 92 }).toFile(resolve(dir, name));
    files.push({ file: name, role: r.role, image: r.image, src: images[r.image].src.split('?')[0] });
  }
  writeFileSync(resolve(dir, 'prompt.txt'), job.prompt + '\n');
  writeJson(resolve(dir, 'job.json'), { id: job.id, handle: job.handle, model: job.model, slot: job.slot, ...(job.color ? { color: job.color } : {}), promptVersion: job.promptVersion, inputs: [{ file: 'input-1-canonical.png', role: 'canonical' }, ...files] });
  writeFileSync(
    resolve(dir, 'RETURN.txt'),
    [
      `Job ${job.id} (${job.slot}, ${job.model}).`,
      'Edit input-1 following prompt.txt, with inputs 2+ as the garment references. One result per job.',
      `Save the full frame (2:3, at least 600 × 900, same framing as input-1) as:`,
      `  scripts/stylist/candidates/${job.id}.png   (or .jpg / .webp)`,
      'Optionally put this job.json next to it as scripts/stylist/candidates/<job id>.json: it is checked against the job.',
      'Then: npm run stylist-tryon -- import && npm run stylist-tryon -- sheet',
      'Do not retouch the result by hand: the review judges what the capability produced.',
      '',
    ].join('\n'),
  );
  return dir;
}

// ── 3. import (derived candidates) ──────────────────────────────────────
/** Mean absolute colour difference (0…255) between two RGB frames over the pixels `use` accepts. */
function mad(a, b, use) {
  let s = 0, n = 0;
  for (let i = 0; i < W * H; i++) {
    if (!use(i)) continue;
    s += Math.abs(a[i * 3] - b[i * 3]) + Math.abs(a[i * 3 + 1] - b[i * 3 + 1]) + Math.abs(a[i * 3 + 2] - b[i * 3 + 2]);
    n++;
  }
  return n ? +(s / n / 3).toFixed(2) : 0;
}
/** A polygon mask grown by r pixels (box max filter). */
function polyMask(poly, r = 0) {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inPoly(x / W, y / H, poly)) m[y * W + x] = 1;
  if (!r) return m;
  const t = new Uint8Array(W * H), o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let d = -r; d <= r; d++) if (m[y * W + Math.min(W - 1, Math.max(0, x + d))]) (t[y * W + x] = 1), (d = r);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let d = -r; d <= r; d++) if (t[Math.min(H - 1, Math.max(0, y + d)) * W + x]) (o[y * W + x] = 1), (d = r);
  return o;
}

/** Thresholds of the automatic checks (the reviewer decides; these only flag). */
export const CHECKS = { headShift: 8, headScale: 0.05, headScore: 0.6, headMad: 10, backgroundMad: 8, keepMad: 12 };

/**
 * Automatic checks of a candidate against the canonical frame (both 600 × 900
 * RGB). Hard: the canonical head is found where it is in the canonical photo
 * (same person, same framing). Soft (shown on the sheet): how much the head,
 * the room and the zone the job must not touch changed.
 */
export async function checkCandidate(ctx, job, png) {
  const m = MODELS[job.model];
  const head = headBox(ctx, job.model);
  const canon = await sharp(resolve(ctx.public, '.' + m.file)).removeAlpha().raw().toBuffer();
  const cand = await sharp(png).removeAlpha().raw().toBuffer();
  const loc = await locate(png, resolve(ctx.public, '.' + m.headFile));
  const f = W / loc.fineW;
  const dx = +(loc.x * f - head.x * W).toFixed(1), dy = +(loc.y * f - head.y * H).toFixed(1), scale = +((loc.tw * f) / (head.w * W)).toFixed(3);
  const { data: hd, info } = await sharp(resolve(ctx.public, '.' + m.headFile)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const hx = Math.round(head.x * W), hy = Math.round(head.y * H);
  const inHead = (i) => {
    const x = (i % W) - hx, y = Math.floor(i / W) - hy;
    return x >= 0 && y >= 0 && x < info.width && y < info.height && hd[(y * info.width + x) * 4 + 3] > 160;
  };
  const body = polyMask(m.bodyOutline, 30);
  const inside = polyMask(m.bodyOutline);
  const y0 = (fy) => Math.round(fy * H);
  // the zone this job must leave alone: the legs for a top or a layer, the chest for a bottom
  const keep = {
    top: (i) => inside[i] && i >= y0(0.8) * W,
    outer: (i) => inside[i] && i >= y0(0.8) * W,
    bottom: (i) => inside[i] && i >= y0(m.headCut.chinY + 0.06) * W && i < y0(m.anchors.waistY - 0.07) * W && !inHead(i),
    onepiece: () => false,
  }[job.slot];
  const checks = {
    head: { score: +loc.score.toFixed(3), dx, dy, scale, mad: mad(canon, cand, inHead) },
    backgroundMad: mad(canon, cand, (i) => !body[i] && !inHead(i)),
    keepMad: job.slot === 'onepiece' ? null : mad(canon, cand, keep),
  };
  const hard = [], soft = [];
  if (loc.score < CHECKS.headScore || Math.abs(dx) > CHECKS.headShift || Math.abs(dy) > CHECKS.headShift || Math.abs(scale - 1) > CHECKS.headScale) hard.push('head-not-at-canonical-position');
  if (checks.head.mad > CHECKS.headMad) soft.push('head-changed');
  if (checks.backgroundMad > CHECKS.backgroundMad) soft.push('background-changed');
  if (checks.keepMad !== null && checks.keepMad > CHECKS.keepMad) soft.push('non-target-changed');
  return { ...checks, hard, soft };
}

/**
 * Import every returned image in the inbox. A file is refused (and left in
 * the inbox, with the reason) unless its name is a derived job's id, that
 * job still matches the catalogue (handle, slot, model), an optional
 * job.json beside it names the same job, and it is a 2:3 frame of at least
 * 600 × 900. Accepted files are normalised to the 600 × 900 frame, checked,
 * and moved to the candidate store: the job is now needs-review.
 */
export async function importCandidates(ctx, C) {
  const jobs = new Map(loadJobs(ctx).map((j) => [j.id, j]));
  const results = [];
  mkdirSync(ctx.candidates, { recursive: true });
  for (const f of inboxFiles(ctx)) {
    const file = resolve(ctx.inbox, f);
    const id = basename(f, extname(f));
    const refuse = (reason) => (results.push({ file: f, id, ok: false, reason }), ctx.log(`import ${f}: refused, ${reason}`));
    const job = jobs.get(id);
    if (!job) {
      const [model] = id.split('--');
      refuse(model === 'men' || model === 'women' ? 'no-such-job' : 'unknown-model');
      continue;
    }
    if (job.method !== 'derived') {
      refuse('official-job');
      continue;
    }
    const stale = validateJob(job, C.classOf(job.handle));
    if (stale) {
      refuse(stale);
      continue;
    }
    const side = resolve(ctx.inbox, `${id}.json`);
    if (existsSync(side)) {
      const s = readJson(side, {});
      if (s.id !== job.id || s.handle !== job.handle || s.model !== job.model || s.slot !== job.slot) {
        refuse('job-mismatch');
        continue;
      }
    }
    let meta;
    try {
      meta = await sharp(file).rotate().metadata();
    } catch {
      refuse('unreadable');
      continue;
    }
    const [w, h] = meta.orientation >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
    if (!(w >= W && h >= H && Math.abs(w / h - W / H) <= 0.01)) {
      refuse(`bad-size ${w}×${h} (needs 2:3, ≥ ${W}×${H})`);
      continue;
    }
    const png = await sharp(file).rotate().resize(W, H, { fit: 'fill', kernel: 'lanczos3' }).removeAlpha().toColourspace('srgb').png().toBuffer();
    const checks = await checkCandidate(ctx, job, png);
    writeFileSync(candidateFile(ctx, id), png);
    copyFileSync(file, resolve(ctx.candidates, `${id}.returned${extname(f).toLowerCase()}`));
    const rec = { id, method: 'derived', candidate: sha(png), returned: f, returnedHash: sha(readFileSync(file)), size: [w, h], importedAt: new Date().toISOString(), promptVersion: job.promptVersion, checks };
    writeJson(resolve(ctx.candidates, `${id}.json`), rec);
    rmSync(file);
    if (existsSync(side)) rmSync(side);
    results.push({ file: f, id, ok: true, checks });
    ctx.log(`import ${f}: needs-review${checks.hard.length ? ` (FAILS ${checks.hard.join(', ')})` : ''}${checks.soft.length ? ` (flags ${checks.soft.join(', ')})` : ''}`);
  }
  return results;
}

// ── 4. official candidates ──────────────────────────────────────────────
/** Photos are aligned at this width. */
const LOOK_W = 1000;
/** Head-match floors: below them the photo changed since review (or shows someone else). */
const MIN_SCORE = { men: 0.72, women: 0.6, beside: 0.5 };

/** An official job's photo aligned onto the canonical frame (or why it can't be). Deterministic. */
export async function alignOfficial(ctx, C, job) {
  const im = C.details[job.handle]?.images?.[job.source.image];
  if (!im) return { reason: 'image-gone' };
  const buf = await fetchCached(ctx, cdn(im.src, LOOK_W));
  const headFile = (id) => resolve(ctx.public, '.' + MODELS[id].headFile);
  // pair shot: find him first, then her beside him (a free search is unreliable)
  const anchor = await locate(buf, headFile(job.source.beside ? 'men' : job.model));
  const loc = job.source.beside ? await locateBeside(buf, headFile(job.model), anchor, -1) : anchor;
  const floor = job.source.beside ? MIN_SCORE.beside : MIN_SCORE[job.model];
  if (loc.score < floor || (job.source.beside && anchor.score < MIN_SCORE.men)) return { reason: `head-match ${loc.score.toFixed(2)} < ${floor}` };
  const K = await canonical(ctx, job.model);
  const bd = await body(buf, loc, headBox(ctx, job.model), K.B);
  if (bd.reason) return { reason: bd.reason };
  const png = await sharp(bd.P.data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  return { png, bd, score: +loc.score.toFixed(3), src: im.src.split('?')[0] };
}

/** Align every official job's photo: the candidates of the official jobs (then needs-review). */
export async function buildOfficialCandidates(ctx, C) {
  mkdirSync(ctx.candidates, { recursive: true });
  const out = [];
  for (const job of loadJobs(ctx).filter((j) => j.method === 'official')) {
    const stale = validateJob(job, C.classOf(job.handle));
    const r = stale ? { reason: stale } : await alignOfficial(ctx, C, job);
    if (r.reason) {
      rmSync(candidateFile(ctx, job.id), { force: true });
      writeJson(resolve(ctx.candidates, `${job.id}.json`), { id: job.id, method: 'official', refused: r.reason });
      out.push({ id: job.id, ok: false, reason: r.reason });
      ctx.log(`official ${job.id}: no candidate, ${r.reason}`);
      continue;
    }
    writeFileSync(candidateFile(ctx, job.id), r.png);
    writeJson(resolve(ctx.candidates, `${job.id}.json`), { id: job.id, method: 'official', candidate: sha(r.png), image: job.source.image, src: r.src, score: r.score, importedAt: new Date().toISOString(), checks: { hard: [], soft: [] } });
    out.push({ id: job.id, ok: true });
  }
  return out;
}

// ── 5. extraction ───────────────────────────────────────────────────────
/** Lay `top` over `under` (both full-frame RGBA layers {layer, box}). */
function over(under, top) {
  const o = Buffer.from(under.layer);
  for (let i = 0; i < W * H; i++) {
    const a = top.layer[i * 4 + 3] / 255;
    if (!a) continue;
    const b = o[i * 4 + 3] / 255, ao = a + b * (1 - a);
    for (let k = 0; k < 3; k++) o[i * 4 + k] = Math.round((top.layer[i * 4 + k] * a + o[i * 4 + k] * b * (1 - a)) / ao);
    o[i * 4 + 3] = Math.round(ao * 255);
  }
  const U = under.box, T = top.box;
  return { layer: o, box: { x0: Math.min(U.x0, T.x0), y0: Math.min(U.y0, T.y0), x1: Math.max(U.x1, T.x1), y1: Math.max(U.y1, T.y1) } };
}

/**
 * Occlusion check for an upper layer: a top / layer ending above the canonical
 * hem uncovers that many rows of the bottom's continuation under the hem
 * (for the canonical trousers a repeat of the visible fabric, never
 * photographed). Flagged on the review sheet; the reviewer judges it.
 */
export const WAIST_FLAG = 8;
const waistOf = (K, res) => (res.hem === undefined ? {} : { uncovers: Math.max(0, K.hem - res.hem) });

/**
 * The slot layer of a candidate (or why it can't be cut). A derived
 * candidate is the canonical photo edited, so its body is found the way the
 * canonical one is, widened to wherever the edit changed the photo (a longer
 * or wider garment than the canonical one); an official candidate is the
 * aligned photo, cut exactly as the official slot layers are.
 */
export async function extract(ctx, C, job) {
  const K = await canonical(ctx, job.model);
  const part = job.slot === 'bottom' ? 'lower' : job.slot === 'onepiece' ? 'both' : 'upper';
  if (job.method === 'official') {
    if (part === 'both') return { reason: 'official-set-not-supported' };
    const r = await alignOfficial(ctx, C, job);
    if (r.reason) return r;
    const res = await slotLayer(r.bd.P.data, 4, r.bd.fg, r.bd.bg, { ...K.a, hands: [] }, part, { sliced: r.bd.sliced, busy: r.bd.busy, canonHem: K.hem });
    return res.reason ? res : { ...res, candidate: sha(r.png), image: job.source.image, src: r.src, score: r.score, ...waistOf(K, res) };
  }
  const file = candidateFile(ctx, job.id);
  if (!existsSync(file)) return { reason: 'no-candidate' };
  const png = readFileSync(file);
  const { a } = K;
  const B = await prepareBase(png, { ...a, outline: null });
  const cand = B.base, canon = K.B.base;
  // where the edit changed the photo (a garment larger than the canonical one), 2 px noise opened away
  const changed = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) changed[i] = Math.abs(cand[i * 3] - canon[i * 3]) + Math.abs(cand[i * 3 + 1] - canon[i * 3 + 1]) + Math.abs(cand[i * 3 + 2] - canon[i * 3 + 2]) > 48 ? 1 : 0;
  const outline = polyMask(a.outline);
  for (let i = 0; i < W * H; i++) {
    if (!B.fg[i] || outline[i]) continue;
    const x = i % W, y = (i / W) | 0;
    let n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) n += changed[Math.min(H - 1, Math.max(0, y + dy)) * W + Math.min(W - 1, Math.max(0, x + dx))];
    if (n < 13) B.fg[i] = 0;
  }
  if (part !== 'both') {
    const res = await slotLayer(cand, 3, B.fg, B.fg.bg, a, part, { canonHem: K.hem });
    return res.reason ? res : { ...res, candidate: sha(png), ...waistOf(K, res) };
  }
  const sp = splitBody(cand, 3, B.fg, a, B.fg.bg);
  if (sp.reason) return { reason: sp.reason };
  const lower = await lowerLayer(cand, 3, sp, B.fg.bg, a, { keepRim: true });
  return { layer: over(lower, await upperLayer(cand, 3, sp, B.fg.bg, a)), candidate: sha(png) };
}

/** Write a full-frame RGBA layer cropped to its box; returns { file, box } (normalised). */
export async function saveLayer(ctx, res, file) {
  const { x0, y0, x1, y1 } = res.box;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const out = resolve(ctx.public, '.' + file);
  mkdirSync(dirname(out), { recursive: true });
  await sharp(res.layer, { raw: { width: W, height: H, channels: 4 } }).extract({ left: x0, top: y0, width: bw, height: bh }).webp({ quality: 82, alphaQuality: 90, effort: 6, smartSubsample: true }).toFile(out);
  const f = (n) => +n.toFixed(5);
  return { file, box: { x: f(x0 / W), y: f(y0 / H), w: f(bw / W), h: f(bh / H) } };
}
/** A full-frame mask as an opaque/transparent layer (for CSS mask-image). */
export async function saveMask(ctx, mask, file) {
  const a = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) if (mask[i]) a[i * 4 + 3] = 255;
  const soft = await sharp(a, { raw: { width: W, height: H, channels: 4 } }).blur(0.8).raw().toBuffer();
  const out = resolve(ctx.public, '.' + file);
  mkdirSync(dirname(out), { recursive: true });
  await sharp(soft, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 60, alphaQuality: 80, effort: 6 }).toFile(out);
  return { file, box: { x: 0, y: 0, w: 1, h: 1 } };
}

// ── 6. review sheets ────────────────────────────────────────────────────
const P = 300, PH = 450;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rgbaPng = (buf) => sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();

/** The candidate's layer in DRESSUP.EXE: room → the other canonical slot → the layer → the head (what the stage draws). */
export async function stagePreview(ctx, job, res) {
  const K = await canonical(ctx, job.model);
  const head = headBox(ctx, job.model);
  const layer = await rgbaPng(res.layer.layer);
  const order =
    job.slot === 'bottom' ? [layer, await rgbaPng(K.upper.layer)] : job.slot === 'onepiece' ? [layer] : [await rgbaPng(K.lower.layer), layer];
  const headPng = await sharp(resolve(ctx.public, '.' + K.m.headFile)).png().toBuffer();
  return sharp(K.room, { raw: { width: W, height: H, channels: 3 } })
    .composite([...order.map((input) => ({ input, left: 0, top: 0 })), { input: headPng, left: Math.round(head.x * W), top: Math.round(head.y * H) }])
    .png()
    .toBuffer();
}

/** A layer over a checkerboard (transparency visible). */
async function onChecker(layerPng) {
  const s = 12;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><pattern id="c" width="${2 * s}" height="${2 * s}" patternUnits="userSpaceOnUse"><rect width="${2 * s}" height="${2 * s}" fill="#f4f4f4"/><rect width="${s}" height="${s}" fill="#d6d6d6"/><rect x="${s}" y="${s}" width="${s}" height="${s}" fill="#d6d6d6"/></pattern></defs><rect width="100%" height="100%" fill="url(#c)"/></svg>`;
  return sharp(Buffer.from(svg)).composite([{ input: layerPng }]).png().toBuffer();
}

/**
 * The review sheet of a job's current candidate (review/<id>.png + .json):
 * canonical | official product photo(s) | candidate | extracted slot layer |
 * in DRESSUP.EXE, with the job, the product, the checks, the extraction and
 * the commands to decide. Approval requires the sheet of exactly that
 * candidate to exist (the reviewer saw what they approve).
 */
export async function makeSheet(ctx, C, job, status) {
  const hash = candidateHash(ctx, job.id);
  if (!hash) return null;
  const rec = recordOf(ctx, job.id) ?? {};
  const panel = (b) => sharp(b).rotate().resize(P, PH, { fit: 'contain', background: '#e6e6e6' }).flatten({ background: '#e6e6e6' }).png().toBuffer();
  const images = C.details[job.handle]?.images ?? [];
  const refs = [];
  for (const r of job.method === 'official' ? [{ image: job.source.image, role: 'official photo' }] : job.references.slice(0, 2))
    if (images[r.image]) refs.push({ label: r.role === 'packshot-front' ? 'official packshot (front)' : r.role === 'packshot' ? 'official packshot' : 'official photo', png: await panel(await fetchCached(ctx, cdn(images[r.image].src, 600))) });
  const res = await extract(ctx, C, job);
  const panels = [
    { label: 'canonical', png: await panel(resolve(ctx.public, '.' + MODELS[job.model].file)) },
    ...refs,
    { label: job.method === 'official' ? 'candidate (aligned photo)' : 'candidate', png: await panel(candidateFile(ctx, job.id)) },
  ];
  if (!res.reason) {
    panels.push({ label: 'extracted slot layer', png: await panel(await onChecker(await rgbaPng(res.layer.layer))) });
    panels.push({ label: 'in DRESSUP.EXE', png: await panel(await stagePreview(ctx, job, res)) });
  }
  const p = C.byHandle.get(job.handle);
  const ch = rec.checks ?? {};
  const lines = [
    `${job.id}  ·  ${p?.title ?? '(not in the catalogue)'}${job.color ? ` (${job.color})` : ''}  ·  ${job.model} · ${job.slot} · ${job.method}${job.bucket ? ` · ${job.bucket} #${job.rank}` : ''}  ·  ${status.toUpperCase()}`,
    `candidate ${hash.slice(0, 16)}${rec.returned ? ` · returned ${rec.returned} ${rec.size?.join('×')}` : ''}${rec.score ? ` · head match ${rec.score}` : ''}${job.promptVersion ? ` · prompt v${job.promptVersion}` : ''}`,
    ch.head
      ? `checks: head Δ ${ch.head.dx}, ${ch.head.dy} px · scale ${ch.head.scale} · head diff ${ch.head.mad} · room diff ${ch.backgroundMad} · untouched-zone diff ${ch.keepMad ?? 'n/a'}${ch.hard.length ? ` · FAILS ${ch.hard.join(', ')}` : ''}${ch.soft.length ? ` · flags ${ch.soft.join(', ')}` : ''}`
      : 'checks: official photo, aligned by the canonical head',
    res.reason
      ? `extraction REFUSED: ${res.reason} (cannot be approved)`
      : `extraction: layer box ${res.layer.box.x0},${res.layer.box.y0} → ${res.layer.box.x1},${res.layer.box.y1}${res.innerMask ? ' · open front found' : ''}${res.uncovers > WAIST_FLAG ? ` · FLAG ends ${res.uncovers} px above the canonical hem: the bottom's continuation shows (check the waist in the last panel)` : ''}`,
    `approve:  npm run stylist-tryon -- approve ${job.id} --notes "<what you checked>"`,
    `reject:   npm run stylist-tryon -- reject ${job.id} --reasons <${REJECT_REASONS.slice(0, 4).join('|')}|…> --notes "<why>"`,
  ];
  const width = Math.max(panels.length * (P + 8), 1200), top = 18 * lines.length + 10;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${top + PH + 26}">${lines.map((l, k) => `<text x="6" y="${16 + 18 * k}" font-size="13" font-family="sans-serif"${k === 0 ? ' font-weight="700"' : ''}>${esc(l)}</text>`).join('')}${panels.map((pn, k) => `<text x="${k * (P + 8) + 6}" y="${top + PH + 18}" font-size="12" font-family="sans-serif">${esc(pn.label)}</text>`).join('')}</svg>`;
  mkdirSync(ctx.review, { recursive: true });
  const out = resolve(ctx.review, `${job.id}.png`);
  await sharp({ create: { width, height: top + PH + 26, channels: 3, background: '#ffffff' } })
    .composite([...panels.map((pn, k) => ({ input: pn.png, left: k * (P + 8), top })), { input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toFile(out);
  writeJson(resolve(ctx.review, `${job.id}.json`), { id: job.id, candidate: hash, extraction: res.reason ?? 'ok', ...(res.uncovers !== undefined ? { uncovers: res.uncovers } : {}), sheetAt: new Date().toISOString() });
  return out;
}

/** review/index.html: every job by status, its sheet, and the commands. */
export function writeIndex(ctx, C, rows) {
  const order = ['needs-review', 'generated', 'approved', 'rejected', 'pending'];
  const sorted = [...rows].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.job.id.localeCompare(b.job.id));
  const count = Object.fromEntries(order.map((s) => [s, rows.filter((r) => r.status === s).length]));
  const html = `<!doctype html><meta charset="utf-8"><title>DRESSUP.EXE review</title>
<style>body{font:13px/1.4 system-ui,sans-serif;margin:16px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left;vertical-align:top}img{max-width:100%;height:auto}code{background:#f3f3f3;padding:1px 4px}.s{font-weight:700}</style>
<h1>DRESSUP.EXE slot-asset review</h1>
<p>${order.map((s) => `${s}: ${count[s]}`).join(' · ')}. Only approved candidates reach production (npm run build-stylist).</p>
<table><tr><th>job</th><th>status</th><th>sheet / next step</th></tr>
${sorted
  .map(({ job, status }) => {
    const sheet = existsSync(resolve(ctx.review, `${job.id}.png`)) && status !== 'pending' && status !== 'generated';
    const next = {
      pending: job.method === 'derived' ? `generate from the pack: <code>npm run stylist-tryon -- export ${job.id}</code>` : '<code>npm run stylist-tryon -- official</code>',
      generated: '<code>npm run stylist-tryon -- import</code>',
      'needs-review': `<code>npm run stylist-tryon -- approve ${job.id} --notes "…"</code> or <code>reject ${job.id} --reasons … --notes "…"</code>`,
      approved: 'in production after <code>npm run build-stylist</code>',
      rejected: job.method === 'derived' ? 'regenerate, then import again' : 'stays view-only',
    }[status];
    return `<tr><td>${esc(job.id)}<br>${esc(C.byHandle.get(job.handle)?.title ?? '')}<br>${job.model} · ${job.slot} · ${job.method}</td><td class="s">${status}</td><td>${sheet ? `<a href="${esc(job.id)}.png"><img src="${esc(job.id)}.png" loading="lazy" width="900"></a><br>` : ''}${next}</td></tr>`;
  })
  .join('\n')}
</table>`;
  mkdirSync(ctx.review, { recursive: true });
  writeFileSync(resolve(ctx.review, 'index.html'), html);
  return resolve(ctx.review, 'index.html');
}

// ── 7. decisions ────────────────────────────────────────────────────────
/**
 * Record a review decision on exactly the candidate on disk (by hash), in
 * the append-only scripts/stylist/tryon/approvals.json. Notes are required
 * (the review is the record); a rejection names its reasons. An approval is
 * refused unless the candidate passed the hard checks, its slot layer can be
 * extracted, and its review sheet (of this very candidate) was made.
 */
export async function decide(ctx, C, id, decision, { notes, reasons = [] } = {}) {
  const job = loadJobs(ctx).find((j) => j.id === id);
  if (!job) throw new Error(`no job ${id} in the manifest`);
  const hash = candidateHash(ctx, id);
  if (!hash) throw new Error(`${id}: no candidate to review (import / official first)`);
  if (!notes || notes.trim().length < 8) throw new Error('--notes "what was checked / why" is required: the review is the record');
  if (decision === 'rejected') {
    if (!reasons.length) throw new Error(`--reasons is required to reject (${REJECT_REASONS.join(', ')})`);
    const bad = reasons.filter((r) => !REJECT_REASONS.includes(r));
    if (bad.length) throw new Error(`unknown reasons ${bad.join(', ')} (${REJECT_REASONS.join(', ')})`);
  } else {
    const stale = validateJob(job, C.classOf(job.handle));
    if (stale) throw new Error(`${id}: the job no longer matches the catalogue (${stale})`);
    const rec = recordOf(ctx, id);
    if (!rec || rec.candidate !== hash) throw new Error(`${id}: the candidate on disk was not imported (run import)`);
    if (rec.checks?.hard?.length) throw new Error(`${id}: fails ${rec.checks.hard.join(', ')}: cannot be approved, reject it`);
    const sheet = readJson(resolve(ctx.review, `${id}.json`), null);
    if (!sheet || sheet.candidate !== hash) throw new Error(`${id}: make and look at its review sheet first (npm run stylist-tryon -- sheet ${id})`);
    const res = await extract(ctx, C, job);
    if (res.reason) throw new Error(`${id}: its slot layer can't be extracted (${res.reason}): cannot be approved`);
  }
  const approvals = readJson(ctx.approvals, []);
  const a = { id, decision, candidate: hash, ...(decision === 'rejected' ? { reasons } : {}), notes: notes.trim(), reviewedAt: new Date().toISOString() };
  approvals.push(a);
  writeJson(ctx.approvals, approvals);
  return a;
}

// ── 8. ingestion (build time) ───────────────────────────────────────────
/**
 * The approved slot layers, for the registry. Per job in the manifest: the
 * job must still match the catalogue, and the latest decision must approve
 * exactly the candidate on disk (then its layer is extracted and written to
 * public/iys/stylist/slot/, recorded in built.json) or, with no candidate on
 * this machine, exactly the candidate the committed layer was built from,
 * with that layer file unchanged. Official beats derived for the same piece
 * and model. Everything else stays out.
 */
export async function ingest(ctx, C) {
  const approvals = readJson(ctx.approvals, []);
  const built = readJson(ctx.built, {});
  const looks = {};
  const report = { ingested: [], stale: [], skipped: [] };
  const jobs = loadJobs(ctx);
  const known = new Set(jobs.map((j) => j.id));
  for (const a of approvals) if (!known.has(a.id)) report.stale.push({ id: a.id, reason: 'decision-for-unknown-job' });
  for (const job of [...jobs].sort((x, y) => (x.method === 'official' ? -1 : 1) - (y.method === 'official' ? -1 : 1))) {
    const stale = validateJob(job, C.classOf(job.handle));
    if (stale) {
      report.stale.push({ id: job.id, reason: stale });
      continue;
    }
    if (!approvals.some((a) => a.id === job.id && a.decision === 'approved')) continue;
    if (looks[job.handle]?.[job.model]) {
      report.skipped.push({ id: job.id, reason: 'official-layer-wins' });
      continue;
    }
    const layerPath = resolve(ctx.public, '.' + slotFile(job));
    const layerHash = existsSync(layerPath) ? sha(readFileSync(layerPath)) : null;
    let cand = job.method === 'derived' ? candidateHash(ctx, job.id) : null;
    let res = null;
    if (job.method === 'official') {
      // the official candidate is re-derived from the CDN photo (offline: the committed layer is used)
      res = await extract(ctx, C, job).catch((e) => ({ reason: `offline (${e.message})` }));
      cand = res.candidate ?? null;
    }
    if (!ingestible(job, cand, layerHash, built[job.id], approvals)) {
      report.skipped.push({ id: job.id, reason: cand ? 'approval-is-for-another-candidate' : 'no-candidate-and-no-matching-built-layer' });
      continue;
    }
    const a = approvals.filter((x) => x.id === job.id).at(-1);
    let look;
    if (cand) {
      res ??= await extract(ctx, C, job);
      if (res.reason) {
        report.skipped.push({ id: job.id, reason: res.reason });
        continue;
      }
      look = await saveLayer(ctx, res.layer, slotFile(job));
      if (res.innerMask) look.inner = await saveMask(ctx, res.innerMask, slotFile(job, true));
      else rmSync(resolve(ctx.public, '.' + slotFile(job, true)), { force: true });
      built[job.id] = { candidate: cand, layer: sha(readFileSync(layerPath)), box: look.box, ...(look.inner ? { inner: look.inner.file } : {}) };
    } else {
      const b = built[job.id];
      look = { file: slotFile(job), box: b.box, ...(b.inner && existsSync(resolve(ctx.public, '.' + b.inner)) ? { inner: { file: b.inner, box: { x: 0, y: 0, w: 1, h: 1 } } } : {}) };
    }
    (looks[job.handle] ??= {})[job.model] = {
      ...look,
      source: job.method,
      scope: 'slot',
      job: job.id,
      candidate: a.candidate,
      ...(job.method === 'official' ? { image: job.source.image, ...(res?.src ? { src: res.src.split('/').pop() } : {}), ...(res?.score ? { score: res.score } : {}) } : {}),
    };
    report.ingested.push(job.id);
  }
  // built records of jobs no longer approved are dropped (their layers are removed by the build)
  const keep = new Set(report.ingested);
  for (const id of Object.keys(built)) if (!keep.has(id)) delete built[id];
  if (Object.keys(built).length || existsSync(ctx.built)) writeJson(ctx.built, built);
  return { looks, report };
}

/**
 * Manifest consistency against the catalogue and the records: every job
 * resolves to a real product of its slot and model, official sources exist,
 * derived jobs carry references + the current prompt, ids are unique, and
 * decisions / built records name known jobs. Returns the problems.
 */
export function validateManifest(ctx, C) {
  const problems = [];
  const jobs = loadJobs(ctx);
  const ids = new Set();
  for (const j of jobs) {
    if (ids.has(j.id)) problems.push(`${j.id}: duplicate id`);
    ids.add(j.id);
    const r = validateJob(j, C.classOf(j.handle));
    if (r) problems.push(`${j.id}: ${r}`);
    const n = C.details[j.handle]?.images?.length ?? 0;
    for (const ref of j.references ?? []) if (!(ref.image >= 0 && ref.image < n)) problems.push(`${j.id}: reference image ${ref.image} missing`);
    if (j.method === 'official' && !(j.source && j.source.image < n)) problems.push(`${j.id}: source image missing`);
    if (j.method === 'derived') {
      if ((j.references?.length ?? 0) < 1) problems.push(`${j.id}: no garment reference`);
      if (j.promptVersion !== PROMPT_VERSION || j.prompt !== promptFor(j.slot, C.byHandle.get(j.handle)?.title, j.model, j.color)) problems.push(`${j.id}: prompt missing or outdated (re-plan)`);
      if (j.color && !(C.details[j.handle]?.colors ?? []).includes(j.color)) problems.push(`${j.id}: colourway ${j.color} no longer sold`);
      if (!j.color && (C.details[j.handle]?.colors ?? []).length > 1) problems.push(`${j.id}: sold in several colours, the job names none (re-plan)`);
    }
  }
  for (const a of readJson(ctx.approvals, [])) if (!ids.has(a.id)) problems.push(`decision for unknown job ${a.id}`);
  for (const id of Object.keys(readJson(ctx.built, {}))) if (!ids.has(id)) problems.push(`built record for unknown job ${id}`);
  return problems;
}

