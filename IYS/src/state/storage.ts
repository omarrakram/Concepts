import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** Storage that survives private mode / blocked storage by degrading to memory. */
function safe(get: () => Storage): StateStorage {
  const memory = new Map<string, string>();
  return {
    getItem: (k) => {
      try {
        return get().getItem(k);
      } catch {
        return memory.get(k) ?? null;
      }
    },
    setItem: (k, v) => {
      try {
        get().setItem(k, v);
      } catch {
        memory.set(k, v);
      }
    },
    removeItem: (k) => {
      try {
        get().removeItem(k);
      } catch {
        memory.delete(k);
      }
    },
  };
}

export const local = createJSONStorage(() => safe(() => window.localStorage));
export const session = createJSONStorage(() => safe(() => window.sessionStorage));
