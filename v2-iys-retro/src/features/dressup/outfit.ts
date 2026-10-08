import type { ModelId, Slot } from './classify';

/**
 * DRESSUP.EXE outfit domain. Pure, deterministic, unit-tested.
 *
 * Each model has an independent outfit: one product handle per slot. Outfits
 * live in memory only (a React reducer inside the app): never written to
 * localStorage, never sent anywhere. Closing DRESSUP.EXE forgets them.
 */

export type Outfit = Partial<Record<Slot, string>>;
export type Looks = Record<ModelId, Outfit>;

/**
 * Paint order, back to front. '@head' is the model's own head + hair layer
 * (cut from the same photo): drawn above tops and layers so hoods sit behind
 * the head, below headwear.
 */
export const LAYER_ORDER = ['socks', 'feet', 'bottom', 'onepiece', 'top', 'outer', '@head', 'neck', 'head', 'bag'] as const;
export type Layer = (typeof LAYER_ORDER)[number];
export const layerIndex = (l: Layer) => LAYER_ORDER.indexOf(l);

/** Human labels for CURRENT LOOK rows. */
export const SLOT_LABEL: Record<Slot, string> = {
  top: 'TOP',
  outer: 'LAYER',
  bottom: 'BOTTOM',
  onepiece: 'SET / DRESS',
  head: 'HEADWEAR',
  neck: 'NECK',
  socks: 'SOCKS',
  feet: 'FOOTWEAR',
  bag: 'BAG',
};

/**
 * Wearing a slot takes these slots off: a set / dress covers both top and
 * bottom, and a top or bottom replaces a set.
 */
export const CONFLICTS: Record<Slot, Slot[]> = {
  top: ['onepiece'],
  bottom: ['onepiece'],
  onepiece: ['top', 'bottom'],
  outer: [],
  head: [],
  neck: [],
  socks: [],
  feet: [],
  bag: [],
};

/**
 * A worn slot can hide another one: a top under a hoodie / jacket is still
 * part of the look (CURRENT LOOK lists it, it can go in the bag) but is not
 * drawn, since a flat tee's sleeves would poke out from under a layer.
 */
export const COVERED_BY: Partial<Record<Slot, Slot[]>> = { top: ['outer'] };

/** Is this worn slot hidden under another worn piece? */
export const isCovered = (o: Outfit, slot: Slot) => (COVERED_BY[slot] ?? []).some((c) => c in o);

export const emptyLooks = (): Looks => ({ men: {}, women: {} });

export type OutfitAction =
  | { type: 'wear'; model: ModelId; slot: Slot; handle: string }
  | { type: 'remove'; model: ModelId; slot: Slot }
  | { type: 'clear'; model: ModelId }
  | { type: 'set'; model: ModelId; outfit: Outfit };

/**
 * Put a piece on (same piece again = take it off, like a toggle). The piece
 * you pick is always the one you see: picking a top while a layer is worn
 * takes the layer off; picking a layer keeps the top on underneath.
 */
export function wear(o: Outfit, slot: Slot, handle: string): Outfit {
  if (o[slot] === handle) return remove(o, slot);
  const next: Outfit = { ...o };
  for (const c of [...CONFLICTS[slot], ...(COVERED_BY[slot] ?? [])]) delete next[c];
  next[slot] = handle;
  return next;
}
export function remove(o: Outfit, slot: Slot): Outfit {
  if (!(slot in o)) return o;
  const next: Outfit = { ...o };
  delete next[slot];
  return next;
}

/** A valid outfit never holds a set together with a top or bottom. */
export function isValid(o: Outfit): boolean {
  return (Object.keys(o) as Slot[]).every((s) => CONFLICTS[s].every((c) => !(c in o)));
}

export function looksReducer(state: Looks, a: OutfitAction): Looks {
  switch (a.type) {
    case 'wear':
      return { ...state, [a.model]: wear(state[a.model], a.slot, a.handle) };
    case 'remove':
      return { ...state, [a.model]: remove(state[a.model], a.slot) };
    case 'clear':
      return Object.keys(state[a.model]).length ? { ...state, [a.model]: {} } : state;
    case 'set':
      return isValid(a.outfit) ? { ...state, [a.model]: { ...a.outfit } } : state;
  }
}

/** The slots the stage draws, back to front (covered ones are skipped). */
export function paintOrder(o: Outfit): Slot[] {
  return LAYER_ORDER.filter((l): l is Slot => l !== '@head' && l in o && !isCovered(o, l));
}

/**
 * RANDOM LOOK: one pick per slot from wearable pieces only. `rand` is
 * injected (Math.random in the app, a seeded PRNG in tests). A set is only
 * drawn when no top + bottom pair is drawn; bags are never drawn, and nothing
 * is ever added to MY BAG.
 */
export function randomLook(pool: Partial<Record<Slot, string[]>>, rand: () => number): Outfit {
  const pick = (s: Slot) => {
    const list = pool[s] ?? [];
    return list.length ? list[Math.floor(rand() * list.length) % list.length] : undefined;
  };
  const o: Outfit = {};
  const top = pick('top');
  const outer = pick('outer');
  const bottom = pick('bottom');
  if (top) o.top = top;
  if (outer && (rand() < 0.6 || !top)) o.outer = outer;
  if (bottom) o.bottom = bottom;
  if (!top && !bottom) {
    const set = pick('onepiece');
    if (set) o.onepiece = set;
  }
  const head = pick('head');
  if (head && rand() < 0.35) o.head = head;
  return o;
}

/** A tiny seeded PRNG (mulberry32) for reproducible tests and QA. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
