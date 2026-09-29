import { useEffect, useState } from 'react';
import { hydrate } from './hydrate';
import { loadDetail } from './shard';
import type { Catalogue, IndexFile, ProductDetail } from './types';

let promise: Promise<Catalogue> | null = null;
let ready: Catalogue | null = null;

/**
 * The compact index is its own chunk (dynamic import), requested as soon as
 * the app starts so it downloads while the boot sequence plays — it never
 * blocks the boot animation.
 */
export function loadCatalogue(): Promise<Catalogue> {
  if (!promise) {
    promise = import('../../data/catalogue-index.json').then((m) => {
      ready = hydrate(m.default as unknown as IndexFile);
      return ready;
    });
    promise.catch(() => {
      promise = null;
    });
  }
  return promise;
}

export const catalogueNow = () => ready;

export function useCatalogue(): Catalogue | null {
  const [cat, setCat] = useState<Catalogue | null>(ready);
  useEffect(() => {
    if (ready) return;
    let alive = true;
    loadCatalogue().then((c) => alive && setCat(c));
    return () => {
      alive = false;
    };
  }, []);
  return cat;
}

type DetailState = { status: 'loading' } | { status: 'ready'; product: ProductDetail } | { status: 'missing' } | { status: 'error'; error: string };

export function useProductDetail(handle: string | undefined): DetailState {
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  useEffect(() => {
    if (!handle) return;
    let alive = true;
    setState({ status: 'loading' });
    loadCatalogue()
      .then(async () => {
        const meta = (await import('../../data/catalogue-index.json')).default as unknown as IndexFile;
        return loadDetail(handle, meta.shardCount);
      })
      .then((p) => alive && setState(p ? { status: 'ready', product: p } : { status: 'missing' }))
      .catch((e: Error) => alive && setState({ status: 'error', error: e.message }));
    return () => {
      alive = false;
    };
  }, [handle]);
  return state;
}
