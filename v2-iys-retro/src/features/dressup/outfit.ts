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
 * The body pieces. Each is shown as the model actually wearing it, from an
 * official photo of that model in that piece, so only one body photo can be on
 * at a time: wearing a top, layer, bottom or set takes the other body piece
 * off. (Mixing the bodies of two photos would mean inventing the join.)
 */
export const BODY: Slot[] = ['top', 'outer', 'bottom', 'onepiece'];

/** Wearing a slot takes these slots off. */
export const CONFLICTS: Record<Slot, Slot[]> = {
  top: BODY.filter((s) => s !== 'top'),
  outer: BODY.filter((s) => s !== 'outer'),
  bottom: BODY.filter((s) => s !== 'bottom'),
  onepiece: BODY.filter((s) => s !== 'onepiece'),
  head: [],
  neck: [],
  socks: [],
  feet: [],
  bag: [],
};

export const emptyLooks = (): Looks => ({ men: {}, women: {} });

export type OutfitAction =
  | { type: 'wear'; model: ModelId; slot: Slot; handle: string }
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

/** The slots the stage draws, back to front. */
export function paintOrder(o: Outfit): Slot[] {
  return LAYER_ORDER.filter((l): l is Slot => l !== '@head' && l in o);
}

/**
 * RANDOM LOOK: one wearable body piece (each is a whole official photo).
 * `rand` is injected (Math.random in the app, a seeded PRNG in tests).
 * Nothing is ever added to MY BAG.
 */
export function randomLook(pool: Partial<Record<Slot, string[]>>, rand: () => number): Outfit {
  const body = BODY.flatMap((s) => (pool[s] ?? []).map((h) => [s, h] as const));
  if (!body.length) return {};
  const [s, h] = body[Math.floor(rand() * body.length) % body.length]!;
  return { [s]: h };
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
