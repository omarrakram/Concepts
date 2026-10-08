import type { Catalogue, Product } from '../../lib/catalogue/types';
import { classify, fitsModel, type Audience, type Category, type ModelId, type NonStylistReason, type Slot } from './classify';
import type { ViewOnlyReason } from './overrides';

/**
 * The stylist mapping registry (src/data/stylist.generated.json, written by
 * scripts/build-stylist.mjs) joined with the live catalogue.
 *
 * The registry holds stylist-only data, keyed by product handle: which layer
 * to draw and where. Titles, prices, sale state, availability and variants are
 * always read from the catalogue, never from here.
 *
 * Every layer is the model actually wearing the piece; a flat packshot never
 * dresses a model (it can't look worn). Two scopes:
 *  - whole: an OFFICIAL product photo of that same model in the piece, aligned
 *    to the canonical photo: the model's whole body below the chin, i.e. that
 *    photo's full outfit. One body photo at a time.
 *  - slot: one slot only (a top's upper body with its arms and hands, a
 *    bottom's legs), drawn over the canonical photo's empty room, so slots
 *    combine freely. Only from candidates that passed the manual approval
 *    gate (scripts/stylist/tryon/): an official photo cut to the slot, or a
 *    development-time try-on of the canonical photo (source 'derived').
 * The canonical head always goes back on top.
 *
 * Stale-safe by construction: a mapping is used only when its handle is in the
 * catalogue AND the classifier still files it under the same slot AND the
 * record is well-formed. Anything else degrades to view-only (or is dropped
 * when the product left the catalogue), never to a broken stage.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** A layer image placed in the model frame (normalised box). */
export interface Layer {
  file: string;
  box: Box;
}
export type LookSourceType = 'official' | 'derived';
export type LookScope = 'whole' | 'slot';
export interface LookLayer extends Layer {
  source: LookSourceType;
  scope: LookScope;
  /** official: the product image it was made from (index + CDN filename) and the head-match score. */
  image?: number;
  src?: string;
  score?: number;
  /** slot: the approved job and the reviewed candidate's content hash (provenance). */
  job?: string;
  candidate?: string;
  /** An open layer's front (full-frame mask of the top it was photographed over): where a chosen top shows instead. */
  inner?: Layer;
}
/** The piece the model wears in the canonical photo itself: its own layers (the model's base) are the piece. */
export interface ShootLook {
  shoot: true;
  /** The supplied studio photo's filename (provenance). */
  src: string;
}
export interface OnModelItem {
  kind: 'on-model';
  slot: Slot;
  looks: Partial<Record<ModelId, LookLayer | ShootLook>>;
}
export type MappedItem = OnModelItem;

/** The canonical photo split into what the slots need. */
export interface ModelLayers {
  file: string;
  headFile: string;
  head: Box;
  /** The photo with the model's body below the chin removed (the empty room). */
  room?: Layer;
  /** The canonical upper body (garment, arms, hands) and trousers, worn while nothing replaces them. */
  upper?: Layer;
  lower?: Layer;
  /** The canonical layer's open front (full-frame mask: his tee between the jacket's panels), if any. */
  inner?: Layer;
  bytes: number;
}

export interface Registry {
  generatedAt: string;
  catalogueGeneratedAt: string;
  source: string;
  models: Record<ModelId, ModelLayers> | null;
  items: Record<string, MappedItem>;
  skip: Record<string, ViewOnlyReason>;
}

interface Base {
  product: Product;
  category: Category;
  slot: Slot;
  audience: Audience;
}
export type StylistEntry =
  | (Base & { kind: 'wearable'; item: MappedItem; models: ModelId[] })
  | (Base & { kind: 'view-only'; reason: ViewOnlyReason })
  | { kind: 'non-stylist'; product: Product; reason: NonStylistReason };

const unit = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
const validBox = (b: Box | undefined) => Boolean(b && unit(b.x) && unit(b.y) && unit(b.w) && unit(b.h) && b.w > 0 && b.h > 0 && b.x + b.w <= 1.0001 && b.y + b.h <= 1.0001);
const WHOLE_FILE = /^\/iys\/stylist\/look\/(men|women)\/[a-z0-9-]+\.webp$/;
const SLOT_FILE = /^\/iys\/stylist\/slot\/(men|women)\/[a-z0-9-]+(\.inner)?\.webp$/;
const MODEL_FILE = /^\/iys\/stylist\/models\/(men|women)(-head|-room|-upper|-lower|-inner)?\.webp$/;
const validLayer = (l: Layer | undefined, re: RegExp) => Boolean(l && typeof l.file === 'string' && re.test(l.file) && validBox(l.box));
export const validLook = (l: LookLayer | ShootLook | undefined): l is LookLayer | ShootLook => {
  if (!l) return false;
  if ('shoot' in l) return l.shoot === true;
  // a whole look is always an official photo; a slot layer only ever enters through the approval gate
  if (l.scope === 'whole') return l.source === 'official' && validLayer(l, WHOLE_FILE);
  if (l.scope === 'slot') return (l.source === 'official' || l.source === 'derived') && validLayer(l, SLOT_FILE) && typeof l.job === 'string' && typeof l.candidate === 'string' && (l.inner === undefined || validLayer(l.inner, SLOT_FILE));
  return false;
};
/** Slots a worn layer can fill (accessories have no on-model source). */
export const LAYER_SLOTS: Slot[] = ['top', 'outer', 'bottom', 'onepiece'];

/** Are a model's canonical slot layers all there (else the stage shows the plain photo)? */
export const validBase = (b: ModelLayers | undefined): b is ModelLayers & Required<Pick<ModelLayers, 'room' | 'upper' | 'lower'>> =>
  Boolean(b && [b.room, b.upper, b.lower, ...(b.inner ? [b.inner] : [])].every((l) => validLayer(l, MODEL_FILE)) && MODEL_FILE.test(b.headFile) && validBox(b.head));

/** Is a registry record well-formed enough to draw? */
export const validItem = (it: MappedItem | undefined): it is MappedItem =>
  Boolean(it && it.kind === 'on-model' && LAYER_SLOTS.includes(it.slot) && Object.values(it.looks ?? {}).some(validLook));

/** Which models a mapping can dress: the models it was photographed on (and is listed for). */
export const mappedModels = (it: MappedItem, audience: Audience): ModelId[] => (['men', 'women'] as const).filter((m) => fitsModel(audience, m) && validLook(it.looks[m]));

export function resolveEntry(p: Product, reg: Pick<Registry, 'items' | 'skip'>): StylistEntry {
  const c = classify(p);
  if (!c.relevant) return { kind: 'non-stylist', product: p, reason: c.reason };
  const base: Base = { product: p, category: c.category, slot: c.slot, audience: c.audience };
  const it = reg.items[p.handle];
  if (it && it.slot === c.slot && validItem(it)) {
    const models = mappedModels(it, c.audience);
    if (models.length) return { ...base, kind: 'wearable', item: it, models };
    return { ...base, kind: 'view-only', reason: 'not-on-these-models' };
  }
  return { ...base, kind: 'view-only', reason: it ? 'not-mapped-yet' : reg.skip[p.handle] ?? 'not-mapped-yet' };
}

/** Can this entry be put on this model? */
export const wearableOn = (e: StylistEntry | undefined, m: ModelId): e is Extract<StylistEntry, { kind: 'wearable' }> => Boolean(e && e.kind === 'wearable' && e.models.includes(m));

/** What an entry puts on a model: a layer to draw, the shoot photo itself, or null when it can't dress that model. */
export function layerFor(e: StylistEntry | undefined, m: ModelId): LookLayer | ShootLook | null {
  if (!wearableOn(e, m)) return null;
  const look = e.item.looks[m];
  return validLook(look) ? look : null;
}

/** Is what this entry puts on this model a whole look (its photo's full outfit, one at a time)? */
export function isWholeOn(e: StylistEntry | undefined, m: ModelId): boolean {
  const l = layerFor(e, m);
  return Boolean(l && !('shoot' in l) && l.scope === 'whole');
}

/** The handles worn whole on a model (for wearPiece). */
export const wholesOf = (s: StylistCatalogue, m: ModelId): ReadonlySet<string> =>
  new Set(s.entries.flatMap((e) => (e.kind === 'wearable' && isWholeOn(e, m) ? [e.product.handle] : [])));

export interface StylistCatalogue {
  entries: StylistEntry[];
  byHandle: Map<string, StylistEntry>;
  counts: Counts;
}
export interface Counts {
  total: number;
  relevant: number;
  /** Wearable on at least one model. */
  wearable: number;
  viewOnly: number;
  /** View-only because the catalogue is newer than the stylist build. */
  unmapped: number;
  nonStylist: number;
  /** Of the stylist-relevant products. */
  men: number;
  women: number;
  shared: number;
  /** Pieces each model can actually wear. */
  wearableMen: number;
  wearableWomen: number;
}

export function buildStylist(cat: Catalogue, reg: Pick<Registry, 'items' | 'skip'>): StylistCatalogue {
  const entries = cat.products.map((p) => resolveEntry(p, reg));
  const counts: Counts = { total: entries.length, relevant: 0, wearable: 0, viewOnly: 0, unmapped: 0, nonStylist: 0, men: 0, women: 0, shared: 0, wearableMen: 0, wearableWomen: 0 };
  for (const e of entries) {
    if (e.kind === 'non-stylist') {
      counts.nonStylist++;
      continue;
    }
    counts.relevant++;
    counts[e.audience]++;
    if (e.kind === 'wearable') {
      counts.wearable++;
      if (e.models.includes('men')) counts.wearableMen++;
      if (e.models.includes('women')) counts.wearableWomen++;
    } else {
      counts.viewOnly++;
      if (e.reason === 'not-mapped-yet') counts.unmapped++;
    }
  }
  return { entries, byHandle: new Map(entries.map((e) => [e.product.handle, e])), counts };
}

/** RANDOM LOOK's pools for one model: slot pieces per slot (they combine) and pieces worn one at a time (whole looks, the shoot piece). */
export function wearablePool(s: StylistCatalogue, model: ModelId, onlyAvailable = true): { slots: Partial<Record<Slot, string[]>>; wholes: string[]; slotOf: Record<string, Slot> } {
  const slots: Partial<Record<Slot, string[]>> = {};
  const wholes: string[] = [];
  const slotOf: Record<string, Slot> = {};
  for (const e of s.entries) {
    if (!wearableOn(e, model) || (onlyAvailable && e.product.available === false)) continue;
    const l = layerFor(e, model);
    if (!l) continue;
    slotOf[e.product.handle] = e.slot;
    // (the shoot piece is drawn by no layer: worn alone it is the photo itself, as deployed)
    if ('shoot' in l || l.scope === 'whole') wholes.push(e.product.handle);
    else (slots[e.slot] ??= []).push(e.product.handle);
  }
  return { slots, wholes, slotOf };
}
