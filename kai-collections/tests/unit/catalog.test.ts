import { describe, expect, it } from 'vitest';
import snapshot from '../../src/data/products.json';

/* The catalog module uses import.meta.glob (Vite); test its data contract directly. */
type P = (typeof snapshot.products)[number];
const products = snapshot.products as P[];
const bySlug = new Map(products.map((p) => [p.slug, p]));

describe('catalog snapshot', () => {
  it('has 30–60 real products with unique slugs', () => {
    expect(products.length).toBeGreaterThanOrEqual(30);
    expect(products.length).toBeLessThanOrEqual(60);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });

  it('covers every department and the core categories', () => {
    for (const d of ['men', 'women', 'kids']) expect(products.some((p) => p.department === d)).toBe(true);
    for (const c of ['swimwear', 'linen', 'resort', 'everyday', 'knitwear']) expect(products.some((p) => p.categories.includes(c))).toBe(true);
  });

  it('every product cites at least one KAI source', () => {
    for (const p of products) {
      expect(p.sources.length, p.slug).toBeGreaterThan(0);
      expect(p.sources.some((s) => s.startsWith('https://kaicollections.com/') || s.startsWith('https://jay-stores.com/')), p.slug).toBe(true);
    }
  });

  it('a verified handle means a product URL was indexed for it', () => {
    for (const p of products.filter((x) => x.handle)) {
      expect(p.sources.some((s) => s.includes(`/products/${p.handle}`)), p.slug).toBe(true);
    }
  });

  it('prices are EGP integers, compare-at only when higher', () => {
    for (const p of products) {
      if (p.price != null) {
        expect(Number.isInteger(p.price)).toBe(true);
        expect(p.price).toBeGreaterThan(100);
        expect(p.price).toBeLessThan(5000);
      }
      if (p.compareAt != null) expect(p.compareAt, p.slug).toBeGreaterThan(p.price ?? 0);
    }
  });

  it('size lists carry their provenance', () => {
    for (const p of products) {
      if (p.sizes.length) expect(['product', 'range', 'sibling']).toContain(p.sizesSource);
      else expect(p.sizesSource).toBe('none');
    }
  });

  it('pairings point at real products', () => {
    for (const p of products) for (const s of (p as { pair?: string[] }).pair ?? []) expect(bySlug.has(s), `${p.slug} → ${s}`).toBe(true);
  });

  it('never ships product photography in the repository snapshot', () => {
    for (const p of products) expect((p as { images?: unknown[] }).images ?? []).toHaveLength(0);
  });
});
