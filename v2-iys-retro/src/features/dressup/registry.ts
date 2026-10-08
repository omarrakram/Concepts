import type { Catalogue, Product } from '../../lib/catalogue/types';
import { classify, fitsModel, type Audience, type Category, type ModelId, type NonStylistReason, type Slot } from './classify';
import type { ViewOnlyReason } from './overrides';

/**
 * The stylist mapping registry (src/data/stylist.generated.json, written by
 * scripts/build-stylist.mjs) joined with the live catalogue.
 *
 * The registry holds stylist-only data, keyed by product handle: which cut-out
 * to draw and how it fits. Titles, prices, sale state, availability and
 * variants are always read from the catalogue, never from here.
 *
 * Stale-safe by construction: a mapping is used only when its handle is in the
 * catalogue AND the classifier still files it under the same slot AND the
 * record is well-formed. Anything else degrades to view-only (or is dropped
 * when the product left the catalogue), never to a broken stage.
 */

export interface Fit {
  /** Hem (or torso) width, as a fraction of the cut-out width. */
  hemW: number;
  /** Garment centre line, fraction of the cut-out width. */
  cx: number;
  /** Shoulder line, fraction of the cut-out height. */
  shoulderY: number;
  /** Waistband width (bottoms), fraction of the cut-out width. */
  waistW: number;
  /** hemW / shoulderY are the slot median (the hem could not be measured on this cut-out). */
  hemFromSlot?: boolean;
  scale?: number;
  dx?: number;
  dy?: number;
}
export interface MappedItem {
  slot: Slot;
  file: string;
  w: number;
  h: number;
  /** Index of the official product image the cut-out was made from. */
  image: number;
  /** That image's CDN filename (provenance). */
  src: string;
  packshots: number[];
  fit: Fit;
}
export interface Registry {
  generatedAt: string;
  catalogueGeneratedAt: string;
  source: string;
  models: Record<ModelId, { file: string; headFile: string; head: { x: number; y: number; w: number; h: number }; bytes: number }> | null;
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
  | (Base & { kind: 'wearable'; item: MappedItem })
  | (Base & { kind: 'view-only'; reason: ViewOnlyReason })
  | { kind: 'non-stylist'; product: Product; reason: NonStylistReason };

const unit = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
/** Is a registry record well-formed enough to draw? */
export function validItem(it: MappedItem | undefined): it is MappedItem {
  return Boolean(
    it &&
      typeof it.file === 'string' &&
      it.file.startsWith('/iys/stylist/g/') &&
      it.w > 0 &&
      it.h > 0 &&
      it.fit &&
      unit(it.fit.hemW) &&
      unit(it.fit.cx) &&
      unit(it.fit.shoulderY) &&
      unit(it.fit.waistW) &&
      // the measurement each slot is sized from must be real
      (it.slot === 'bottom' ? it.fit.waistW > 0 : it.slot === 'head' || it.slot === 'bag' ? true : it.fit.hemW > 0),
  );
}

export function resolveEntry(p: Product, reg: Pick<Registry, 'items' | 'skip'>): StylistEntry {
  const c = classify(p);
  if (!c.relevant) return { kind: 'non-stylist', product: p, reason: c.reason };
  const base: Base = { product: p, category: c.category, slot: c.slot, audience: c.audience };
  const it = reg.items[p.handle];
  if (it && it.slot === c.slot && validItem(it)) return { ...base, kind: 'wearable', item: it };
  return { ...base, kind: 'view-only', reason: it ? 'not-mapped-yet' : reg.skip[p.handle] ?? 'not-mapped-yet' };
}

export interface StylistCatalogue {
  entries: StylistEntry[];
  byHandle: Map<string, StylistEntry>;
  counts: Counts;
}
export interface Counts {
  total: number;
  relevant: number;
  wearable: number;
  viewOnly: number;
  /** View-only because the catalogue is newer than the stylist build. */
  unmapped: number;
  nonStylist: number;
  /** Of the stylist-relevant products. */
  men: number;
  women: number;
  shared: number;
  /** Wearable pieces per model (shared pieces count for both). */
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
      if (fitsModel(e.audience, 'men')) counts.wearableMen++;
      if (fitsModel(e.audience, 'women')) counts.wearableWomen++;
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
  for (const e of s.entries)
    if (e.kind === 'wearable' && fitsModel(e.audience, model) && (!onlyAvailable || e.product.available !== false)) (pool[e.slot] ??= []).push(e.product.handle);
  return pool;
}
