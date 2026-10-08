import { create } from 'zustand';
import { notifyCatchy } from '../catchy/events';
import type { ModelId } from './classify';
import { emptyLooks, looksReducer, type Looks, type OutfitAction } from './outfit';

/**
 * DRESSUP.EXE's own state: the two looks + which model is being dressed.
 * In memory only, on purpose: no persist middleware, no localStorage /
 * sessionStorage, nothing sent anywhere. It lasts for the page session (so
 * closing and reopening DRESSUP.EXE keeps a look) and is gone on reload.
 * MY WARDROBE, MY BAG and every other app never read or write it.
 */
interface LooksState {
  looks: Looks;
  active: ModelId;
  dispatch: (a: OutfitAction) => void;
  setActive: (m: ModelId) => void;
  reset: () => void;
}

export const useLooks = create<LooksState>()((set, get) => ({
  looks: emptyLooks(),
  active: 'men',
  dispatch: (a) => {
    const before = get().looks;
    const looks = looksReducer(before, a);
    if (looks === before) return;
    set({ looks });
    // Catchy may notice (fire-and-forget; never part of the stylist itself).
    if (a.type === 'wear' && looks[a.model][a.slot] === a.handle) notifyCatchy({ type: 'look:wear' });
  },
  setActive: (active) => set({ active }),
  reset: () => set({ looks: emptyLooks(), active: 'men' }),
}));
