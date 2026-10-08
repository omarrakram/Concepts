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
 * (the canonical photo): drawn above the body photo so the face never changes.
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
 * The body slots. A slot piece is its own layer cut to its slot (a top's upper
 * body, a bottom's legs), so they combine freely: changing the bottom never
 * changes the top, and a layer goes over whichever top is on. Only a set (one
 * piece covering both) conflicts with a top or a bottom.
 *
 * A whole look is different: one official photo's full outfit. It dresses the
 * whole body, so it is worn alone (wearPiece): putting it on takes every other
 * body piece off, and any other body piece takes it off.
 */
export const BODY: Slot[] = ['top', 'outer', 'bottom', 'onepiece'];

/** Wearing a slot takes these slots off. */
export const CONFLICTS: Record<Slot, Slot[]> = {
  top: ['onepiece'],
  outer: [],
  bottom: ['onepiece'],
  onepiece: ['top', 'bottom'],
  head: [],
  neck: [],
  socks: [],
  feet: [],
  bag: [],
};

export const emptyLooks = (): Looks => ({ men: {}, women: {} });

export type OutfitAction =
  | { type: 'wear'; model: ModelId; slot: Slot; handle: string; wholes?: ReadonlySet<string> }
  | { type: 'remove'; model: ModelId; slot: Slot }
  | { type: 'clear'; model: ModelId }
  | { type: 'set'; model: ModelId; outfit: Outfit };

/** Put a piece on (same piece again = take it off, like a toggle). */
export function wear(o: Outfit, slot: Slot, handle: string): Outfit {
  if (o[slot] === handle) return remove(o, slot);
  const next: Outfit = { ...o };
  for (const c of CONFLICTS[slot]) delete next[c];
  next[slot] = handle;
  return next;
}
/**
 * Put a piece on, whole looks included: `wholes` are the handles that are
 * whole looks on this model. A whole look is worn alone on the body; any
 * other body piece takes a whole look off. Same piece again = take it off.
 */
export function wearPiece(o: Outfit, slot: Slot, handle: string, wholes: ReadonlySet<string> = new Set()): Outfit {
  if (o[slot] === handle) return remove(o, slot);
  const next = wear(o, slot, handle);
  for (const b of BODY) {
    if (b === slot || !(b in next)) continue;
    if (wholes.has(handle) || wholes.has(next[b]!)) delete next[b];
  }
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
      return { ...state, [a.model]: wearPiece(state[a.model], a.slot, a.handle, a.wholes) };
    case 'remove':
      return { ...state, [a.model]: remove(state[a.model], a.slot) };
    case 'clear':
      return Object.keys(state[a.model]).length ? { ...state, [a.model]: {} } : state;
    case 'set':
      return isValid(a.outfit) ? { ...state, [a.model]: { ...a.outfit } } : state;
  }
}

/** The slots the stage draws, back to front. */
export function paintOrder(o: Outfit): Slot[] {
  return LAYER_ORDER.filter((l): l is Slot => l !== '@head' && l in o);
}

/**
 * RANDOM LOOK, from wearable pieces only: a top + a bottom (sometimes a layer)
 * when slot pieces exist, a set instead when only sets do, else one whole
 * look. `rand` is injected (Math.random in the app, a seeded PRNG in tests).
 * Nothing is ever added to MY BAG.
 */
export function randomLook(pool: { slots: Partial<Record<Slot, string[]>>; wholes?: string[]; slotOf?: Record<string, Slot> }, rand: () => number): Outfit {
  const pick = (list: string[] | undefined) => (list?.length ? list[Math.floor(rand() * list.length) % list.length] : undefined);
  const o: Outfit = {};
  const top = pick(pool.slots.top), bottom = pick(pool.slots.bottom), outer = pick(pool.slots.outer);
  if (top) o.top = top;
  if (bottom) o.bottom = bottom;
  if (outer && (rand() < 0.4 || (!top && !bottom))) o.outer = outer;
  if (!top && !bottom) {
    const set = pick(pool.slots.onepiece);
    if (set) o.onepiece = set;
  }
  if (!Object.keys(o).length) {
    const w = pick(pool.wholes);
    if (w) o[pool.slotOf?.[w] ?? 'top'] = w;
  }
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
