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
 * Every layer is on-model: the body of an OFFICIAL product photo in which that
 * same model wears the piece, aligned to the canonical photo (clothes, arms and
 * hands from the official photo; the canonical head stays on top). One per
 * model the piece was photographed on. A flat packshot never dresses a model:
 * it can't look worn.
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
export interface LookLayer {
  file: string;
  /** Where the layer sits in the model frame (normalised). */
  box: Box;
  /** Official product image it was made from + its CDN filename. */
  image: number;
  src: string;
  /** Head-alignment match score (masked normalised cross-correlation). */
  score: number;
}
/** The piece the model wears in the canonical photo itself: nothing to draw, the shoot photo already shows it. */
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

export interface Registry {
  generatedAt: string;
  catalogueGeneratedAt: string;
  source: string;
  models: Record<ModelId, { file: string; headFile: string; head: Box; bytes: number }> | null;
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
export const validLook = (l: LookLayer | ShootLook | undefined): l is LookLayer | ShootLook =>
  Boolean(l && ('shoot' in l ? l.shoot === true : typeof l.file === 'string' && /^\/iys\/stylist\/look\/(men|women)\/[a-z0-9-]+\.webp$/.test(l.file) && validBox(l.box)));

/** Is a registry record well-formed enough to draw? */
export const validItem = (it: MappedItem | undefined): it is MappedItem => Boolean(it && it.kind === 'on-model' && Object.values(it.looks ?? {}).some(validLook));

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

/** Wearable handles per slot for one model (RANDOM LOOK's pool). */
export function wearablePool(s: StylistCatalogue, model: ModelId, onlyAvailable = true): Partial<Record<Slot, string[]>> {
  const pool: Partial<Record<Slot, string[]>> = {};
  for (const e of s.entries) if (wearableOn(e, model) && (!onlyAvailable || e.product.available !== false)) (pool[e.slot] ??= []).push(e.product.handle);
  return pool;
}
