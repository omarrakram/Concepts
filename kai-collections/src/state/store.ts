import { useSyncExternalStore } from 'react';

export interface BagLine {
  slug: string;
  size: string | null;
  qty: number;
}
interface State {
  bag: BagLine[];
  saved: string[];
}

const KEY = 'kai-concept-v1';
const read = (): State => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (Array.isArray(s.bag) && Array.isArray(s.saved)) return s;
    }
  } catch {
    /* storage unavailable: start empty */
  }
  return { bag: [], saved: [] };
};

let state: State = read();
const subs = new Set<() => void>();
const set = (next: State) => {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode: keep in memory */
  }
  subs.forEach((f) => f());
};
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

export function useShop() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export const shop = {
  add(slug: string, size: string | null, qty = 1) {
    const i = state.bag.findIndex((l) => l.slug === slug && l.size === size);
    const bag = [...state.bag];
    if (i >= 0) bag[i] = { ...bag[i], qty: Math.min(9, bag[i].qty + qty) };
    else bag.push({ slug, size, qty });
    set({ ...state, bag });
  },
  setQty(slug: string, size: string | null, qty: number) {
    const bag = state.bag
      .map((l) => (l.slug === slug && l.size === size ? { ...l, qty: Math.max(0, Math.min(9, qty)) } : l))
      .filter((l) => l.qty > 0);
    set({ ...state, bag });
  },
  remove(slug: string, size: string | null) {
    set({ ...state, bag: state.bag.filter((l) => !(l.slug === slug && l.size === size)) });
  },
  toggleSaved(slug: string) {
    const saved = state.saved.includes(slug) ? state.saved.filter((s) => s !== slug) : [...state.saved, slug];
    set({ ...state, saved });
  },
  clear() {
    set({ bag: [], saved: state.saved });
  },
};

/** UI chrome state (drawers / overlays) shared across routes. */
type Panel = null | 'bag' | 'saved' | 'search' | 'menu' | { quick: string };
let panel: Panel = null;
const psubs = new Set<() => void>();
export const ui = {
  open(p: Panel) {
    panel = p;
    psubs.forEach((f) => f());
  },
  close() {
    ui.open(null);
  },
};
export function usePanel() {
  return useSyncExternalStore(
    (f) => {
      psubs.add(f);
      return () => psubs.delete(f);
    },
    () => panel,
    () => panel,
  );
}
