// (type imports only: the scripts load this file in plain Node)
import type { Classification, ModelId, Slot } from './classify';

/**
 * DRESSUP.EXE slot-asset pipeline: DEVELOPMENT TIME ONLY. Never imported by
 * the app (a test enforces it); used by scripts/stylist-tryon.mjs and
 * scripts/build-stylist.mjs through scripts/lib/tryon-pipeline.mjs.
 *
 * A job asks for ONE slot layer of ONE product on ONE canonical model:
 *  - method 'derived': an image edit of the canonical photo in which only that
 *    slot's garment is replaced by the real IYS product (from its official
 *    product photos), made OFFLINE with an image-editing / virtual try-on
 *    capability, then manually reviewed;
 *  - method 'official': an official photo of that same model in the piece,
 *    cut to the slot (deterministic), then manually reviewed.
 *
 *   plan → (derived) export pack → generate outside this repo → drop the image
 *   in scripts/stylist/candidates/ → import (validated) → review sheet →
 *   approve / reject → build extracts the slot layer → registry → DRESSUP.EXE.
 *
 * Nothing here calls any service. Only an approval naming the exact candidate
 * (by content hash) ever reaches the registry: pending, generated,
 * needs-review, rejected or changed candidates never do. Commerce data
 * (prices, variants, availability) is never copied into a job: products are
 * referenced by handle and image index into the catalogue snapshot.
 */

export type TryonSlot = Extract<Slot, 'top' | 'outer' | 'bottom' | 'onepiece'>;
export const TRYON_SLOTS: TryonSlot[] = ['top', 'outer', 'bottom', 'onepiece'];
export type JobMethod = 'derived' | 'official';

/**
 * An official product image the generator gets as the garment reference (by
 * index into the catalogue snapshot): a clean packshot (the front one first)
 * or another official photo (on a model, a detail, a set).
 */
export interface ProductRef {
  image: number;
  role: 'packshot-front' | 'packshot' | 'photo';
}

export interface TryonJob {
  /** `<model>--<handle>` (derived) or `<model>--<handle>--official`. */
  id: string;
  method: JobMethod;
  handle: string;
  model: ModelId;
  slot: TryonSlot;
  /** derived, a product sold in several colours: the one colourway this try-on shows (references are of it only). */
  color?: string;
  /** Planning bucket (hoodie, tee, crewneck, layer, bottom, top…) and rank within it. */
  bucket: string;
  rank: number;
  /** derived: the canonical frame to edit (repo path, 600 × 900, the DRESSUP.EXE stage frame). */
  canonical: string;
  /** derived: the garment references; official: the photo cut to the slot. */
  references: ProductRef[];
  /** official only: the photo's index and whether it's a pair shot (located beside him). */
  source?: { image: number; beside?: true };
  /** derived only: the strict edit instruction (prompt template version in promptVersion). */
  prompt?: string;
  promptVersion?: number;
}

export type JobStatus = 'pending' | 'generated' | 'needs-review' | 'approved' | 'rejected';

export const REJECT_REASONS = ['identity', 'face', 'hair', 'pose', 'hands', 'body', 'print', 'logo', 'text', 'color', 'geometry', 'zipper-pockets', 'non-target', 'background', 'artifacts', 'compositing', 'other'] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];

/** One review decision on one candidate (scripts/stylist/tryon/approvals.json, append-only). */
export interface Approval {
  id: string;
  decision: 'approved' | 'rejected';
  /** sha256 of the reviewed candidate: a re-generated file is a new, unreviewed candidate. */
  candidate: string;
  reasons?: RejectReason[];
  /** What was checked / why it failed. */
  notes: string;
  reviewedAt: string;
}

/** What the build made from an approved candidate (scripts/stylist/tryon/built.json): lets a machine without the candidate keep the layer. */
export interface Built {
  candidate: string;
  /** sha256 of the slot layer file built from it. */
  layer: string;
  box: { x: number; y: number; w: number; h: number };
  inner?: string;
}

export const jobId = (method: JobMethod, model: ModelId, handle: string) => `${model}--${handle}${method === 'official' ? '--official' : ''}`;

const lastDecision = (id: string, approvals: Approval[]) => approvals.filter((a) => a.id === id).at(-1);

/**
 * A job's status, from the files and the review record (never stored, so it
 * can't drift): pending (nothing yet), generated (a file waits in the inbox,
 * not imported), needs-review (imported and validated, no decision on this
 * exact candidate), approved / rejected (the latest decision on exactly this
 * candidate). With no candidate on this machine, a job whose approved layer
 * was built stays approved.
 */
export function statusOf(job: Pick<TryonJob, 'id'>, files: { inbox?: boolean; candidate: string | null; built?: Built }, approvals: Approval[]): JobStatus {
  const a = lastDecision(job.id, approvals);
  if (!files.candidate) {
    if (a?.decision === 'approved' && files.built?.candidate === a.candidate) return 'approved';
    return files.inbox ? 'generated' : 'pending';
  }
  if (!a || a.candidate !== files.candidate) return 'needs-review';
  return a.decision;
}

/**
 * May this job's slot layer reach the production registry? Only when the
 * latest decision approves exactly the candidate on disk, or (no candidate
 * here) exactly the candidate the committed layer was built from, and that
 * layer file is unchanged.
 */
export function ingestible(job: Pick<TryonJob, 'id'>, candidate: string | null, layer: string | null, built: Built | undefined, approvals: Approval[]): boolean {
  const a = lastDecision(job.id, approvals);
  if (!a || a.decision !== 'approved') return false;
  if (candidate) return a.candidate === candidate;
  return Boolean(built && layer && built.candidate === a.candidate && built.layer === layer);
}

/**
 * Is a job still valid against the live catalogue? Returns why not, or null.
 * `c` is the product's classify() result (undefined: not in the catalogue).
 * The product must exist, be stylist-relevant, still be filed under the job's
 * slot, and be listed for the job's model (fitsModel).
 */
export function validateJob(job: Pick<TryonJob, 'id' | 'method' | 'handle' | 'model' | 'slot'>, c: Classification | undefined): string | null {
  if (job.model !== 'men' && job.model !== 'women') return 'unknown-model';
  if (!TRYON_SLOTS.includes(job.slot)) return 'unknown-slot';
  if (job.method !== 'derived' && job.method !== 'official') return 'unknown-method';
  if (job.id !== jobId(job.method, job.model, job.handle)) return 'bad-id';
  if (!c) return 'not-in-catalogue';
  if (!c.relevant) return 'not-stylist';
  if (c.slot !== job.slot) return 'wrong-slot';
  if (c.audience !== 'shared' && c.audience !== job.model) return 'wrong-model';
  return null;
}

export const PROMPT_VERSION = 1;

const KEEP_PERSON = (model: ModelId) =>
  `this exact person's identity, face, expression, hair${model === 'women' ? ', glasses' : ''}, skin tone, body shape and proportions, pose, arms, hands and fingers`;

const TARGET: Record<TryonSlot, { name: string; change: string; keep: string }> = {
  top: {
    name: 'TOP',
    change: 'the upper garment worn on the torso (the jacket and the top under it become this one top)',
    keep: 'the bottoms (trousers / shorts) and the shoes exactly as they are',
  },
  outer: {
    name: 'OUTERWEAR',
    change: 'the outer layer: put this garment on as the outermost layer over the existing top, worn open or closed as in its product photos',
    keep: 'the top underneath where it shows, the bottoms and the shoes exactly as they are',
  },
  bottom: {
    name: 'BOTTOM',
    change: 'the lower garment (the trousers / shorts / skirt), from the waist down',
    keep: 'the top and any layer exactly as they are (including how the hem falls over the waistband), and the shoes',
  },
  onepiece: {
    name: 'FULL LOOK',
    change: 'the whole outfit below the neck (top, layer and trousers) with this set / dress',
    keep: 'the neck, the hair falling over the shoulders, and the shoes',
  },
};

/** The strict per-slot edit instruction for a derived job: same photo, different garment. */
export function promptFor(slot: TryonSlot, title: string, model: ModelId, color?: string): string {
  const t = TARGET[slot];
  return [
    `IMAGE EDIT · VIRTUAL TRY-ON · ${t.name}. Input 1 is the canonical photo to edit. Inputs 2+ are the official product photos of the garment "${title}"${color ? `, in its ${color} colourway (only that colour)` : ''}; where they show it on someone, take only the garment from them, never that person's face, body, pose or styling.`,
    `KEEP EXACTLY, pixel for pixel wherever possible: ${KEEP_PERSON(model)}; ${t.keep}; the room and props behind them; the lighting and white balance; the camera angle, lens, framing and image size.`,
    `CHANGE ONLY ${t.change}: replace it with the exact garment from the product photos, fitted and draped the way it is worn in its on-model product photos.`,
    `GARMENT FIDELITY (non-negotiable): the exact colour; the exact print, artwork, logo, typography and embroidery, in the same place and at the same scale; the same collar, hood, cuffs, hem, waistband, pockets and zipper (count, placement, colour); the same sleeve length, fit and silhouette; text stays exactly as printed (e.g. "IYS" never becomes "IY5"). No invented details.`,
    `DO NOT: change the face, hair, body, pose or hands; invent a new pose; change or restyle any garment other than the target; add accessories, jewellery or extra layers; beautify, retouch, slim or stylise; change the background, props or light; crop, zoom, rotate or reframe.`,
    `This is a faithful e-commerce try-on asset, not a new editorial photograph. Return ONE full-frame image with exactly the framing of input 1 (2:3, at least 600 × 900).`,
  ].join('\n\n');
}

/** Product types per planning bucket (the catalogue's own product types). */
export const TYPES = {
  hoodie: ['Printed Hoodies', 'Boxy Hoodies', 'Acid Washed Hoodies', 'Plain Hoodies', 'Balloon Fit Hoodies', 'Cropped Hoodies'],
  crewneck: ['Crewnecks', 'Acid Washed Crewnecks', 'Pullovers', 'Quarter Zipper', 'Knit Sweater', 'Knit Pullover', 'Cropped Sweatshirts'],
  tee: ['Printed Oversized Tees', 'Printed Boxy Tee', 'Printed Regular Tees', 'Basic Oversized Tees', 'Basic Boxy Tee', 'Basic Regular Tee', 'Washed Oversized Tee', 'Striped Oversized Tees', 'Long Sleeves', 'PJ Long Sleeves'],
};

/**
 * The first batch: per model, how many jobs per bucket. Buckets with `types`
 * take those product types (`notTypes`: all but those); the others take
 * every product of the slot not taken by an earlier bucket. `own`: the
 * model's own range (filed for that model only) first. At most `perType` of
 * one product type (default 3) and 2 colourways of one product line per
 * bucket. Resolved against the live catalogue by the planner
 * (scripts/lib/tryon-pipeline.mjs).
 */
export interface PlanBucket {
  bucket: string;
  slot: TryonSlot;
  types?: string[];
  notTypes?: string[];
  own?: boolean;
  take: number;
  perType?: number;
}
export const PLAN: Record<ModelId, PlanBucket[]> = {
  men: [
    { bucket: 'hoodie', slot: 'top', types: TYPES.hoodie, take: 10 },
    { bucket: 'tee', slot: 'top', types: TYPES.tee, take: 10 },
    { bucket: 'crewneck', slot: 'top', types: TYPES.crewneck, take: 6 },
    { bucket: 'layer', slot: 'outer', take: 6 },
    { bucket: 'bottom', slot: 'bottom', take: 10, perType: 2 },
  ],
  women: [
    { bucket: 'hoodie-crewneck', slot: 'top', types: [...TYPES.hoodie, ...TYPES.crewneck], take: 10 },
    { bucket: 'top', slot: 'top', notTypes: [...TYPES.hoodie, ...TYPES.crewneck], own: true, take: 10, perType: 2 },
    { bucket: 'layer', slot: 'outer', take: 6 },
    { bucket: 'bottom', slot: 'bottom', own: true, take: 10, perType: 2 },
  ],
};
