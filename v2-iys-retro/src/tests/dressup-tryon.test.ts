import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';
import index from '../data/catalogue-index.json';
import registryJson from '../data/stylist.generated.json';
import { hydrate } from '../lib/catalogue/hydrate';
import type { IndexFile } from '../lib/catalogue/types';
import { classify } from '../features/dressup/classify';
import { OFFICIAL_SLOT_CANDIDATES } from '../features/dressup/looks';
import { wear, type Outfit } from '../features/dressup/outfit';
import { buildStylist, type MappedItem, type ModelLayers, type Registry } from '../features/dressup/registry';
import { stackFor } from '../features/dressup/stack';
import { ingestible, jobId, PLAN, PROMPT_VERSION, promptFor, statusOf, validateJob, type Approval, type Built, type TryonJob } from '../features/dressup/tryon';
// the development-time pipeline itself, exercised on fixtures in a temp dir
// @ts-expect-error — plain ESM module shared with the Node scripts
import * as pipeline from '../../scripts/lib/tryon-pipeline.mjs';

const cat = hydrate(index as unknown as IndexFile);
const registry = registryJson as unknown as Registry;
const manifest: { version: number; catalogueGeneratedAt: string; promptVersion: number; jobs: TryonJob[] } = JSON.parse(readFileSync('scripts/stylist/tryon/jobs.json', 'utf8'));
const approvals: Approval[] = JSON.parse(readFileSync('scripts/stylist/tryon/approvals.json', 'utf8'));
const productOf = (h: string) => cat.byHandle.get(h);
const classOf = (h: string) => (productOf(h) ? classify(productOf(h)!) : undefined);
const findProduct = (slot: string, audience: string) =>
  cat.products.find((p) => {
    const c = classify(p);
    return c.relevant && c.slot === slot && c.audience === audience;
  })!.handle;

describe('DRESSUP.EXE slot jobs: the rules (tryon.ts)', () => {
  const job = { id: 'men--x' };
  const ap = (decision: Approval['decision'], candidate = 'aaa'): Approval => ({ id: 'men--x', decision, candidate, notes: 'checked at full size', reviewedAt: '2026-10-08T00:00:00Z' });
  const built: Built = { candidate: 'aaa', layer: 'L1', box: { x: 0, y: 0, w: 1, h: 1 } };

  it('status comes from the files + the review record: pending → generated → needs-review → approved / rejected', () => {
    expect(statusOf(job, { candidate: null }, [])).toBe('pending');
    expect(statusOf(job, { inbox: true, candidate: null }, [])).toBe('generated');
    expect(statusOf(job, { candidate: 'aaa' }, [])).toBe('needs-review');
    expect(statusOf(job, { candidate: 'aaa' }, [ap('approved')])).toBe('approved');
    expect(statusOf(job, { candidate: 'aaa' }, [ap('rejected')])).toBe('rejected');
    // re-generated after review: a new, unreviewed candidate
    expect(statusOf(job, { candidate: 'bbb' }, [ap('approved')])).toBe('needs-review');
    // the latest decision wins
    expect(statusOf(job, { candidate: 'aaa' }, [ap('approved'), ap('rejected')])).toBe('rejected');
    // no candidate on this machine, but the approved layer was built from it
    expect(statusOf(job, { candidate: null, built }, [ap('approved')])).toBe('approved');
    expect(statusOf(job, { candidate: null, built: { ...built, candidate: 'zzz' } }, [ap('approved')])).toBe('pending');
  });

  it('pending, generated, needs-review, rejected and changed candidates are never ingestible', () => {
    expect(ingestible(job, null, null, undefined, [])).toBe(false);
    expect(ingestible(job, 'aaa', null, undefined, [])).toBe(false);
    expect(ingestible(job, 'aaa', null, undefined, [ap('rejected')])).toBe(false);
    expect(ingestible(job, 'bbb', null, undefined, [ap('approved')])).toBe(false);
    expect(ingestible(job, 'aaa', null, undefined, [ap('approved'), ap('rejected')])).toBe(false);
    // approval of exactly this candidate
    expect(ingestible(job, 'aaa', null, undefined, [ap('approved')])).toBe(true);
    // no candidate here: only the committed layer built from that approval, unchanged
    expect(ingestible(job, null, 'L1', built, [ap('approved')])).toBe(true);
    expect(ingestible(job, null, 'L2', built, [ap('approved')])).toBe(false);
    expect(ingestible(job, null, null, built, [ap('approved')])).toBe(false);
    expect(ingestible(job, null, 'L1', { ...built, candidate: 'other' }, [ap('approved')])).toBe(false);
  });

  it('a job must match the live catalogue: invalid handle, wrong model, wrong slot and bad ids are refused', () => {
    const top = findProduct('top', 'shared'), womens = findProduct('top', 'women');
    const j = (over: Partial<TryonJob>) => ({ id: jobId('derived', 'men', top), method: 'derived' as const, handle: top, model: 'men' as const, slot: 'top' as const, ...over });
    expect(validateJob(j({}), classOf(top))).toBeNull();
    expect(validateJob(j({ handle: 'not-a-real-product', id: 'men--not-a-real-product' }), classOf('not-a-real-product'))).toBe('not-in-catalogue');
    expect(validateJob(j({ handle: womens, id: jobId('derived', 'men', womens) }), classOf(womens))).toBe('wrong-model');
    expect(validateJob(j({ slot: 'bottom' }), classOf(top))).toBe('wrong-slot');
    expect(validateJob(j({ id: 'men--something-else' }), classOf(top))).toBe('bad-id');
    expect(validateJob(j({ model: 'kids' as never }), classOf(top))).toBe('unknown-model');
    expect(validateJob(j({ slot: 'head' as never }), classOf(top))).toBe('unknown-slot');
  });

  it('the prompts are strict same-photo edits per slot, never a new editorial image', () => {
    for (const slot of ['top', 'outer', 'bottom', 'onepiece'] as const) {
      const p = promptFor(slot, 'Grey Pants', 'men');
      expect(p).toMatch(/^IMAGE EDIT · VIRTUAL TRY-ON · (TOP|OUTERWEAR|BOTTOM|FULL LOOK)\./);
      expect(p).toContain('"Grey Pants"');
      expect(p).toMatch(/KEEP EXACTLY/);
      expect(p).toMatch(/CHANGE ONLY/);
      expect(p).toMatch(/GARMENT FIDELITY/);
      expect(p).toMatch(/DO NOT: change the face, hair, body, pose or hands/);
      expect(p).toMatch(/not a new editorial photograph/);
      expect(p).toMatch(/exactly the framing of input 1/);
    }
    expect(promptFor('bottom', 'X', 'men')).toMatch(/KEEP EXACTLY[^\n]*the top and any layer exactly as they are/);
    for (const slot of ['top', 'outer', 'bottom', 'onepiece'] as const) expect(promptFor(slot, 'X', 'men'), slot).toMatch(/KEEP EXACTLY[^\n]*shoes/);
    expect(promptFor('top', 'X', 'men')).toMatch(/KEEP EXACTLY[^\n]*the bottoms \(trousers \/ shorts\) and the shoes exactly as they are/);
    expect(promptFor('top', 'X', 'women')).toMatch(/glasses/);
  });
});

type Detail = { images: { id: number }[]; colors?: string[]; colorOption?: string; options: { name: string }[]; variants: { options: string[]; imageId: number | null }[] };
const details: Record<string, Detail> = Object.assign({}, ...readdirSync('public/catalogue').map((f) => JSON.parse(readFileSync(`public/catalogue/${f}`, 'utf8'))));

describe('DRESSUP.EXE slot jobs: the committed queue (scripts/stylist/tryon/jobs.json)', () => {
  const derived = manifest.jobs.filter((j) => j.method === 'derived');
  const official = manifest.jobs.filter((j) => j.method === 'official');

  it('a real first batch: 50–100 derived try-on jobs across both models and every planned bucket', () => {
    expect(derived.length).toBeGreaterThanOrEqual(50);
    expect(derived.length).toBeLessThanOrEqual(100);
    for (const [model, buckets] of Object.entries(PLAN))
      for (const b of buckets) expect(derived.filter((j) => j.model === model && j.bucket === b.bucket).length, `${model} ${b.bucket}`).toBe(b.take);
    expect(new Set(manifest.jobs.map((j) => j.id)).size).toBe(manifest.jobs.length);
  });

  it('every job resolves to a real product of its slot and model, with real image references', () => {
    for (const j of manifest.jobs) {
      expect(validateJob(j, classOf(j.handle)), j.id).toBeNull();
      expect(j.id).toBe(jobId(j.method, j.model, j.handle));
      for (const r of j.references) expect(r.image < details[j.handle]!.images.length, `${j.id} #${r.image}`).toBe(true);
      expect(existsSync(j.canonical), j.canonical).toBe(true);
    }
    for (const j of derived) {
      expect(j.prompt, j.id).toBe(promptFor(j.slot, productOf(j.handle)!.title, j.model, j.color));
      expect(j.references.filter((r) => r.role === 'packshot-front').length, j.id).toBeLessThanOrEqual(1);
      expect(j.promptVersion).toBe(PROMPT_VERSION);
      expect(j.references.length, j.id).toBeGreaterThan(0);
    }
    // the official jobs are exactly the reviewed official slot candidates
    for (const [m, list] of Object.entries(OFFICIAL_SLOT_CANDIDATES))
      for (const s of list) expect(official.some((j) => j.model === m && j.handle === s.handle && j.source?.image === s.image), `${m} ${s.handle}`).toBe(true);
    expect(official.length).toBe(OFFICIAL_SLOT_CANDIDATES.men.length + OFFICIAL_SLOT_CANDIDATES.women.length);
  });

  it('a piece sold in several colours targets ONE colourway, and every reference shows that colour', () => {
    let multi = 0;
    for (const j of derived) {
      const d = details[j.handle]!;
      const several = (d.colors ?? []).length > 1;
      expect(Boolean(j.color), j.id).toBe(several);
      if (!several) continue;
      multi++;
      const ci = d.options.findIndex((o) => o.name === d.colorOption);
      const linked = new Set(d.variants.filter((v) => v.options[ci] === j.color).map((v) => d.images.findIndex((im) => im.id === v.imageId)));
      for (const r of j.references) expect(linked.has(r.image), `${j.id} #${r.image}`).toBe(true);
      expect(j.prompt).toContain(`in its ${j.color} colourway (only that colour)`);
    }
    expect(multi).toBeGreaterThan(0);
    // the rule itself, on a synthetic two-colour product
    const shots = [0, 1, 2, 3].map((image) => ({ image, packshot: image >= 2 }));
    const synthetic = { colorOption: 'Color', colors: ['Black', 'White'], options: [{ name: 'Size' }, { name: 'Color' }], images: [{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }], variants: [{ options: ['S', 'Black'], imageId: 10 }, { options: ['S', 'White'], imageId: 12 }, { options: ['M', 'White'], imageId: 13 }] };
    expect(pipeline.colourwayOf(synthetic, shots)).toEqual({ color: 'White', images: new Set([2, 3]) });
    expect(pipeline.colourwayOf({ ...synthetic, colors: ['Black'] }, shots)).toBeNull();
  });

  it('the manifest never copies commerce data (prices, variants, availability, sizes)', () => {
    const forbidden = new Set(['price', 'priceMax', 'compareAtPrice', 'onSale', 'available', 'variants', 'variantId', 'sizes', 'options', 'currency', 'quickVariant', 'sku', 'inventory']);
    const walk = (v: unknown, path: string) => {
      if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) (expect(forbidden.has(k), `${path}.${k}`).toBe(false), walk(x, `${path}.${k}`));
    };
    walk(manifest, 'jobs.json');
    expect(JSON.stringify(manifest)).not.toMatch(/EGP|LE\s?\d/);
  });

  it('no unreviewed asset is in production: every slot layer has an approval of exactly its candidate', () => {
    const slotLayers = Object.entries(registry.items).flatMap(([h, it]) => Object.entries(it.looks).flatMap(([m, l]) => (l && !('shoot' in l) && l.scope === 'slot' ? [{ h, m, l }] : [])));
    for (const { h, m, l } of slotLayers) {
      const a = approvals.filter((x) => x.id === l.job).at(-1);
      expect(a && a.decision === 'approved' && a.candidate === l.candidate, `${m} ${h}`).toBe(true);
    }
    // today: no approvals, so production is the deployed whole looks only
    if (!approvals.some((a) => a.decision === 'approved')) {
      expect(slotLayers).toEqual([]);
      for (const m of ['men', 'women'] as const) expect(registry.models![m].room).toBeUndefined();
    }
    for (const a of approvals) expect(a.notes.length > 0 && /^[0-9a-f]{64}$/.test(a.candidate), a.id).toBe(true);
  });
});

// ── the pipeline on fixtures (temp dirs; nothing real is read or written besides the inputs) ──
describe('DRESSUP.EXE slot jobs: import → review → approval gate → ingestion (fixtures)', () => {
  const root = process.cwd();
  let tmp = '';
  let ctx: ReturnType<typeof pipeline.context>;
  const C = pipeline.loadCatalogue(root);
  const real = (slot: string, n = 0) => manifest.jobs.filter((j) => j.method === 'derived' && j.model === 'men' && j.slot === slot)[n]!;
  // fixture jobs: copies of real queued jobs, without references (so nothing is downloaded)
  const T = { ...real('top'), references: [] }, T2 = { ...real('top', 1), references: [] }, B = { ...real('bottom'), references: [] };
  const womens = findProduct('top', 'women');
  const wrongModel = { ...T, id: jobId('derived', 'men', womens), handle: womens };
  const wrongSlot = { ...B, id: jobId('derived', 'men', real('top', 2).handle), handle: real('top', 2).handle };
  const gone = { ...T, id: 'men--not-a-real-product', handle: 'not-a-real-product' };
  const official = manifest.jobs.find((j) => j.method === 'official')!;

  /** A FIXTURE candidate: the canonical photo with one slot's pixels recoloured. Clearly not a real try-on. */
  async function fixture(slot: 'upper' | 'lower', tint: [number, number, number]) {
    const K = await pipeline.canonical(ctx, 'men');
    const px = Buffer.from(K.B.base);
    const U = K.upper.layer as Buffer, L = K.lower.layer as Buffer;
    // upper: the garment above the hands; lower: the trousers where they show (not under the top or the hands)
    const hit = (i: number) => (slot === 'upper' ? U[i * 4 + 3]! > 200 && i < 600 * 480 : L[i * 4 + 3]! > 200 && U[i * 4 + 3]! < 10);
    for (let i = 0; i < 600 * 900; i++) if (hit(i)) for (let k = 0; k < 3; k++) px[i * 3 + k] = Math.round(px[i * 3 + k]! * 0.45 + tint[k]! * 0.55);
    return sharp(px, { raw: { width: 600, height: 900, channels: 3 } }).png().toBuffer();
  }
  const inbox = (name: string, buf: Buffer) => writeFileSync(join(ctx.inbox, name), buf);
  const status = (id: string) => pipeline.statuses(ctx).find((r: { job: TryonJob }) => r.job.id === id)?.status;
  const itemsOf = (looks: Record<string, MappedItem['looks']>): Record<string, MappedItem> =>
    Object.fromEntries(Object.entries(looks).map(([h, by]) => [h, { kind: 'on-model', slot: (classify(productOf(h)!) as { slot: MappedItem['slot'] }).slot, looks: by }]));

  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), 'dressup-tryon-'));
    const pub = join(tmp, 'public');
    mkdirSync(join(pub, 'iys/stylist'), { recursive: true });
    cpSync(resolve(root, 'public/iys/stylist/models'), join(pub, 'iys/stylist/models'), { recursive: true });
    ctx = pipeline.context(root, { state: join(tmp, 'state'), work: join(tmp, 'work'), inbox: join(tmp, 'inbox'), public: pub, downloads: join(tmp, 'downloads'), log: () => {} });
    mkdirSync(ctx.inbox, { recursive: true });
    mkdirSync(dirname(ctx.manifest), { recursive: true });
    writeFileSync(ctx.manifest, JSON.stringify({ version: 1, jobs: [T, T2, B, wrongModel, wrongSlot, gone, official] }));
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('import validates job identity, product, model, slot and size; refused files stay in the inbox', async () => {
    inbox(`${T.id}.png`, await fixture('upper', [200, 30, 40]));
    inbox(`${T2.id}.png`, await fixture('upper', [30, 160, 60]));
    inbox(`${B.id}.png`, await fixture('lower', [40, 60, 200]));
    writeFileSync(join(ctx.inbox, `${B.id}.json`), JSON.stringify({ id: B.id, handle: B.handle, model: 'men', slot: 'bottom' }));
    const small = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#888' } }).png().toBuffer();
    inbox('men--not-a-real-product.png', await fixture('upper', [0, 0, 0]));
    inbox(`${wrongModel.id}.png`, await fixture('upper', [0, 0, 0]));
    inbox(`${wrongSlot.id}.png`, await fixture('upper', [0, 0, 0]));
    inbox('men--no-job-for-this.png', small);
    inbox('kids--x.png', small);
    inbox(`${official.id}.png`, small);
    expect(status(T.id)).toBe('generated');
    const r: { id: string; ok: boolean; reason?: string }[] = await pipeline.importCandidates(ctx, C);
    const why = Object.fromEntries(r.map((x) => [x.id, x.ok ? 'ok' : x.reason]));
    expect(why).toEqual({
      [T.id]: 'ok',
      [T2.id]: 'ok',
      [B.id]: 'ok',
      'men--not-a-real-product': 'not-in-catalogue',
      [wrongModel.id]: 'wrong-model',
      [wrongSlot.id]: 'wrong-slot',
      'men--no-job-for-this': 'no-such-job',
      'kids--x': 'unknown-model',
      [official.id]: 'official-job',
    });
    expect(status(T.id)).toBe('needs-review');
    expect(status(wrongSlot.id)).toBe('generated');
    expect(existsSync(join(ctx.inbox, `${T.id}.png`))).toBe(false);
    // the fixtures are the canonical frame: the head is where it belongs
    expect(pipeline.recordOf(ctx, T.id).checks.hard).toEqual([]);
    // a size that isn't the 2:3 frame is refused
    inbox(`${T2.id}.png`, small);
    expect((await pipeline.importCandidates(ctx, C)).find((x: { id: string }) => x.id === T2.id)).toMatchObject({ ok: false, reason: expect.stringMatching(/^bad-size/) });
    rmSync(join(ctx.inbox, `${T2.id}.png`));
    // a returned job.json naming another job is refused
    inbox(`${T2.id}.png`, await fixture('upper', [30, 160, 60]));
    writeFileSync(join(ctx.inbox, `${T2.id}.json`), JSON.stringify({ id: T.id, handle: T.handle, model: 'men', slot: 'top' }));
    expect((await pipeline.importCandidates(ctx, C)).find((x: { id: string }) => x.id === T2.id)).toMatchObject({ ok: false, reason: 'job-mismatch' });
    rmSync(join(ctx.inbox, `${T2.id}.json`));
    rmSync(join(ctx.inbox, `${T2.id}.png`));
  }, 120_000);

  it('needs-review never reaches production; approval needs notes, the sheet of this candidate, and an extractable layer', async () => {
    expect((await pipeline.ingest(ctx, C)).looks).toEqual({});
    await expect(pipeline.decide(ctx, C, T.id, 'approved', { notes: 'x' })).rejects.toThrow(/notes/);
    await expect(pipeline.decide(ctx, C, T.id, 'approved', { notes: 'colour, print and hands checked' })).rejects.toThrow(/review sheet/);
    await expect(pipeline.decide(ctx, C, gone.id, 'approved', { notes: 'colour, print and hands checked' })).rejects.toThrow(/no candidate/);
    // the fixture top ends where the canonical one does: nothing of the trousers' continuation is uncovered
    expect((await pipeline.extract(ctx, C, T)).uncovers).toBeLessThanOrEqual(pipeline.WAIST_FLAG);
    for (const j of [T, T2, B]) expect(await pipeline.makeSheet(ctx, C, j, 'needs-review')).toBeTruthy();
    expect(existsSync(join(ctx.review, `${T.id}.png`))).toBe(true);
    await expect(pipeline.decide(ctx, C, T2.id, 'rejected', { notes: 'fixture, not a real try-on' })).rejects.toThrow(/--reasons/);
    await expect(pipeline.decide(ctx, C, T2.id, 'rejected', { notes: 'fixture, not a real try-on', reasons: ['made-up'] })).rejects.toThrow(/unknown reasons/);
    await pipeline.decide(ctx, C, T2.id, 'rejected', { notes: 'fixture, not a real try-on', reasons: ['color'] });
    await pipeline.decide(ctx, C, T.id, 'approved', { notes: 'FIXTURE approval in a temp dir (test only)' });
    await pipeline.decide(ctx, C, B.id, 'approved', { notes: 'FIXTURE approval in a temp dir (test only)' });
    expect([status(T.id), status(T2.id), status(B.id)]).toEqual(['approved', 'rejected', 'approved']);
  }, 180_000);

  it('only the approved candidates become slot assets; rejected, changed and missing ones stay out (view-only)', async () => {
    const { looks, report } = await pipeline.ingest(ctx, C);
    expect(Object.keys(looks).sort()).toEqual([T.handle, B.handle].sort());
    expect(looks[T.handle].men).toMatchObject({ source: 'derived', scope: 'slot', job: T.id, file: `/iys/stylist/slot/men/${T.handle}.webp` });
    expect(existsSync(join(ctx.public, `iys/stylist/slot/men/${T.handle}.webp`))).toBe(true);
    expect(existsSync(join(ctx.public, `iys/stylist/slot/men/${T2.handle}.webp`))).toBe(false);
    expect(report.stale.map((s: { id: string }) => s.id).sort()).toEqual([gone.id, wrongModel.id, wrongSlot.id].sort());
    const built = JSON.parse(readFileSync(ctx.built, 'utf8'));
    expect(Object.keys(built).sort()).toEqual([T.id, B.id].sort());

    // a machine without the candidate keeps the committed layer built from the approval…
    rmSync(pipeline.candidateFile(ctx, T.id));
    expect(status(T.id)).toBe('approved');
    expect(Object.keys((await pipeline.ingest(ctx, C)).looks)).toContain(T.handle);
    // …but not once that layer file changed or went missing: the piece is view-only again
    const layer = join(ctx.public, `iys/stylist/slot/men/${T.handle}.webp`);
    writeFileSync(layer, Buffer.from('tampered'));
    expect(Object.keys((await pipeline.ingest(ctx, C)).looks)).not.toContain(T.handle);
    rmSync(layer, { force: true });
    const again = await pipeline.ingest(ctx, C);
    expect(Object.keys(again.looks)).toEqual([B.handle]);
    const s = buildStylist(cat, { items: itemsOf(again.looks), skip: {} });
    expect(s.byHandle.get(T.handle)!.kind).toBe('view-only');
    // a re-generated candidate is a new, unreviewed one
    inbox(`${B.id}.png`, await fixture('lower', [200, 200, 40]));
    await pipeline.importCandidates(ctx, C);
    expect(status(B.id)).toBe('needs-review');
    expect((await pipeline.ingest(ctx, C)).looks).toEqual({});
  }, 240_000);

  it('approved fixture slot layers combine on the stage with TOP / BOTTOM independent', async () => {
    // re-approve both fixtures (a fresh candidate for the top), then ingest + build the runtime registry from them
    inbox(`${T.id}.png`, await fixture('upper', [200, 30, 40]));
    await pipeline.importCandidates(ctx, C);
    for (const j of [T, B]) {
      await pipeline.makeSheet(ctx, C, j, 'needs-review');
      await pipeline.decide(ctx, C, j.id, 'approved', { notes: 'FIXTURE approval in a temp dir (test only)' });
    }
    const { looks } = await pipeline.ingest(ctx, C);
    const K = await pipeline.canonical(ctx, 'men');
    const room = { file: '/iys/stylist/models/men-room.webp', box: { x: 0, y: 0, w: 1, h: 1 } };
    const base: ModelLayers = { ...registry.models!.men, room, upper: await pipeline.saveLayer(ctx, K.upper, '/iys/stylist/models/men-upper.webp'), lower: await pipeline.saveLayer(ctx, K.lower, '/iys/stylist/models/men-lower.webp') };
    const s = buildStylist(cat, { items: itemsOf(looks), skip: {} });
    const draw = (o: Outfit) => stackFor(s, 'men', o, base)?.layers.map((l) => `${l.part}${l.handle ? `:${l.handle}` : ''}`);
    let o = wear({}, 'top', T.handle);
    expect(draw(o)).toEqual(['room', 'base', `top:${T.handle}`, 'head']);
    o = wear(o, 'bottom', B.handle);
    expect(draw(o)).toEqual(['room', `bottom:${B.handle}`, `top:${T.handle}`, 'head']);
    // the top stays when the bottom comes off, and vice versa
    expect(draw({ top: T.handle })).toEqual(['room', 'base', `top:${T.handle}`, 'head']);
    expect(draw({ bottom: B.handle })).toEqual(['room', `bottom:${B.handle}`, 'base', 'head']);
    for (const l of stackFor(s, 'men', o, base)!.layers) if (l.part !== 'room') expect(existsSync(join(ctx.public, l.file)), l.file).toBe(true);
  }, 240_000);
});

describe('DRESSUP.EXE: zero AI at runtime', () => {
  /** Every module the app can load, from its entry (static and dynamic imports). */
  function appGraph() {
    const seen = new Set<string>();
    const stack = [resolve('src/main.tsx')];
    while (stack.length) {
      const f = stack.pop()!;
      if (seen.has(f)) continue;
      seen.add(f);
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s+['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
        const spec = m[1] ?? m[2]!;
        const base = resolve(dirname(f), spec);
        const hit = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')].find((x) => existsSync(x) && /\.(tsx?|mjs|js)$/.test(x));
        if (hit) stack.push(hit);
      }
    }
    return [...seen];
  }

  it('the app never imports the try-on tooling, and nothing it loads talks to an image-generation service', () => {
    const graph = appGraph();
    expect(graph.length).toBeGreaterThan(50);
    expect(graph.some((f) => f.endsWith('features/dressup/registry.ts'))).toBe(true);
    expect(graph.some((f) => /dressup\/tryon\.ts$|scripts\//.test(f))).toBe(false);
    for (const f of graph) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/api\.openai\.com|replicate\.com|stability\.ai|huggingface\.co|fal\.(ai|run)|generativelanguage|api\.anthropic\.com|IMAGE EDIT · VIRTUAL TRY-ON/);
    }
  });

  it('no AI SDK is a dependency, and DRESSUP.EXE shows no AI copy', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    for (const d of deps) expect(d, d).not.toMatch(/openai|anthropic|replicate|stability|huggingface|@google\/(generative|genai)|@fal-ai|diffusers|onnxruntime|tensorflow|transformers/i);
    for (const f of ['ui/parts.tsx', 'ui/MobileDressUp.tsx', 'stack.ts', 'registry.ts', 'outfit.ts', 'useStylist.ts', 'store.ts'])
      expect(readFileSync(`src/features/dressup/${f}`, 'utf8'), f).not.toMatch(/\bAI\b|GENERATING|TRY ON WITH|POWERED BY|fetch\(|XMLHttpRequest/);
  });
});
