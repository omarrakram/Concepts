import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Catalogue, Product } from './types';

interface Doc {
  p: Product;
  title: string;
  type: string;
  collections: string;
  tags: string;
}

export const FUSE_OPTIONS: IFuseOptions<Doc> = {
  keys: [
    { name: 'title', weight: 0.62 },
    { name: 'type', weight: 0.18 },
    { name: 'collections', weight: 0.1 },
    { name: 'tags', weight: 0.1 },
  ],
  threshold: 0.34,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeScore: true,
};

export interface Searcher {
  search(q: string): Product[];
}

/** Build once per catalogue; ~1k docs index in a few ms. */
export function createSearcher(cat: Catalogue): Searcher {
  const docs: Doc[] = cat.products.map((p) => ({
    p,
    title: p.title,
    type: p.productType ?? '',
    collections: p.collections.map((h) => cat.collections.get(h)?.title ?? h.replace(/-/g, ' ')).join(' '),
    tags: p.tags,
  }));
  const fuse = new Fuse(docs, FUSE_OPTIONS);
  return {
    search(q: string) {
      const query = normalizeQuery(q);
      if (!query) return [];
      // Exact (case-insensitive) title containment always wins, then fuzzy order.
      const lower = query.toLowerCase();
      const results = fuse.search(query);
      const exact = results.filter((r) => r.item.title.toLowerCase().includes(lower));
      const rest = results.filter((r) => !r.item.title.toLowerCase().includes(lower));
      return [...exact, ...rest].map((r) => r.item.p);
    },
  };
}

export const normalizeQuery = (q: string) => q.replace(/\s+/g, ' ').trim().slice(0, 80);

let pending: Promise<Searcher> | null = null;
let forCat: Catalogue | null = null;
/** Lazily builds (and caches) the searcher for a catalogue. */
export function getSearcher(cat: Catalogue): Promise<Searcher> {
  if (!pending || forCat !== cat) {
    forCat = cat;
    pending = Promise.resolve(createSearcher(cat));
  }
  return pending;
}
