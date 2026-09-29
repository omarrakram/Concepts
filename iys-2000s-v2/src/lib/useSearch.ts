import { useEffect, useState } from 'react';
import type { Product } from './catalogue/types';
import { useCatalogue } from './catalogue/load';

/** Fuse.js is code-split: loaded the first time anyone searches. */
export function useSearch(query: string) {
  const cat = useCatalogue();
  const [state, setState] = useState<{ q: string; results: Product[] | null; ms: number }>({ q: '', results: null, ms: 0 });
  useEffect(() => {
    if (!cat) return;
    const q = query.trim();
    if (!q) {
      setState({ q: '', results: null, ms: 0 });
      return;
    }
    let alive = true;
    import('./catalogue/search').then(async ({ getSearcher }) => {
      const s = await getSearcher(cat);
      const t0 = performance.now();
      const results = s.search(q);
      if (alive) setState({ q, results, ms: performance.now() - t0 });
    });
    return () => {
      alive = false;
    };
  }, [cat, query]);
  return { cat, ...state, pending: Boolean(query.trim()) && state.q !== query.trim() };
}
