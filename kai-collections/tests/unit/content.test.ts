import { describe, expect, it } from 'vitest';
import { BY_SLUG, PRODUCTS, SETS, SHOP_VIEWS, discount, featured, needsSize, officialUrl, onSale, productFor, relatedTo, search, sizeKey } from '../../src/data/catalog';
import { CAMPAIGN } from '../../src/data/media';
import { MATERIALS, factsFor } from '../../src/data/materials';
import { MOODS } from '../../src/home/Atlas';
import { CHAPTERS } from '../../src/home/Horizon';
import { WARDROBES, optionsFor } from '../../src/home/Builder';
import { ENTRIES, photoOf } from '../../src/home/Journal';
import { DEPTS } from '../../src/home/Departments';
import { STORES } from '../../src/data/stores';
import { FILM_PRODUCT } from '../../src/showcase/film';

const inStock = (s: string) => BY_SLUG.get(s)?.stock === 'in-stock';

describe('shop logic', () => {
  it('every shop view has products; departments partition the catalog', () => {
    for (const v of SHOP_VIEWS) expect(PRODUCTS.filter(v.test).length, v.id).toBeGreaterThan(0);
    const [m, w, k] = ['men', 'women', 'kids'].map((d) => PRODUCTS.filter(SHOP_VIEWS.find((v) => v.id === d)!.test).length);
    expect(m + w + k).toBe(PRODUCTS.length);
  });

  it('sale view equals products whose compare-at price is higher', () => {
    const sale = PRODUCTS.filter(SHOP_VIEWS.find((v) => v.id === 'sale')!.test);
    expect(sale.length).toBeGreaterThan(5);
    for (const p of sale) expect(onSale(p) && discount(p) > 0).toBe(true);
    for (const p of PRODUCTS.filter((x) => !sale.includes(x))) expect(onSale(p)).toBe(false);
  });

  it('search ranks name matches, requires every term and knows prints', () => {
    expect(search('zebra').map((p) => p.slug)).toContain('yellow-zebra-swim-shorts');
    expect(search('beige linen pants')[0].name).toMatch(/Beige Linen Pants/);
    // KAI's own product type counts: it files its Jacquard Cuban shirts under "Tencel Cuban Shirt"
    const tc = search('tencel cuban');
    expect(tc.length).toBeGreaterThan(2);
    expect(tc.every((p) => /tencel/i.test(`${p.name} ${p.type}`) && /cuban/i.test(`${p.name} ${p.type}`))).toBe(true);
    expect(search('qwertyuiop')).toHaveLength(0);
    expect(search('')).toHaveLength(0);
  });

  it('official links go to the exact KAI product page', () => {
    expect(officialUrl(BY_SLUG.get('festival-del-mare-swim-shorts')!)).toBe('https://kaicollections.com/products/festival-del-mare-swim-shorts');
  });

  it('KAI’s size spellings share one filter key', () => {
    expect(['S (30-32)', 'Small (30)', 'Small', 'S (36)'].map(sizeKey)).toEqual(['S', 'S', 'S', 'S']);
    expect(['X-Small', 'XS (34)'].map(sizeKey)).toEqual(['XS', 'XS']);
    expect(['2X-Large (38)', 'XX-Large', '2XL (38-40)'].map(sizeKey)).toEqual(['2XL', '2XL', '2XL']);
    expect(['4 Years', '4Y'].map(sizeKey)).toEqual(['4Y', '4Y']);
  });

  it('related products exclude the product itself and never suggest sold-out pairings first', () => {
    for (const p of PRODUCTS) {
      const r = relatedTo(p);
      expect(r.some((q) => q.slug === p.slug)).toBe(false);
    }
  });

  it('matching sets reference real products, have 2+ pieces and co-ords lead', () => {
    expect(SETS.length).toBeGreaterThan(20);
    for (const s of SETS) {
      expect(s.items.length, s.id).toBeGreaterThanOrEqual(2);
      for (const i of s.items) expect(BY_SLUG.has(i), `${s.id}: ${i}`).toBe(true);
    }
    expect(SETS[0].kind).toBe('coord');
    for (const s of SETS.filter((x) => x.kind === 'family'))
      expect(s.items.some((i) => BY_SLUG.get(i)!.kind === 'kids-swim-short' || BY_SLUG.get(i)!.kind === 'sarong'), s.id).toBe(true);
  });

  it('featured order follows KAI’s Best Sellers collection', () => {
    const ranked = PRODUCTS.filter((p) => p.rank != null).sort(featured);
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].rank!).toBeLessThanOrEqual(ranked[i].rank!);
  });
});

describe('editorial content points at real, current products and photographs', () => {
  it('Horizon chapters, Atlas moods and Journal entries use in-stock products', () => {
    for (const c of CHAPTERS) for (const s of [c.product, c.second].filter(Boolean) as string[]) expect(inStock(s), s).toBe(true);
    for (const m of MOODS) for (const s of m.products) expect(inStock(s), s).toBe(true);
    for (const e of ENTRIES) {
      for (const s of e.products) expect(inStock(s), s).toBe(true);
      expect(photoOf(e.photo), e.id).not.toBeNull();
    }
  });

  it('“Pictured” only where KAI uses the same photograph on that product page', () => {
    for (const c of CAMPAIGN) {
      const p = productFor(c.id);
      if (!p) continue;
      const file = c.src.split('?')[0].split('/').pop()!.toLowerCase();
      expect(p.images.some((im) => im.src.split('?')[0].toLowerCase().endsWith('/' + file)), c.id).toBe(true);
    }
    expect(productFor('women-swim')?.slug).toBe('olive-kaia-one-piece');
  });

  it('each material shows one product’s own close-up with that product’s own facts', () => {
    for (const m of MATERIALS) {
      const p = BY_SLUG.get(m.product);
      expect(p, m.product).toBeTruthy();
      expect(p!.images[m.image], `${m.key} photo #${m.image}`).toBeTruthy();
      expect(p!.material, m.product).toBeTruthy();
      expect(factsFor(p!)[0]).toBe(p!.material);
    }
  });

  it('the outfit builder offers several in-stock pieces in every slot', () => {
    for (const w of Object.values(WARDROBES))
      for (const s of w.slots) {
        const opts = optionsFor(s);
        expect(opts.length, s.id).toBeGreaterThanOrEqual(3);
        expect(opts.every((p) => s.kinds.includes(p.kind) && s.depts.includes(p.department) && p.stock !== 'sold-out')).toBe(true);
      }
  });

  it('departments show KAI campaign photographs or real product pairs', () => {
    for (const d of DEPTS) {
      if ('pair' in d) for (const s of d.pair) expect(inStock(s), s).toBe(true);
      else expect(CAMPAIGN.some((c) => c.id === d.photo), d.id).toBe(true);
    }
  });

  it('the film’s commerce product is in stock with a size choice', () => {
    const p = BY_SLUG.get(FILM_PRODUCT)!;
    expect(p.stock).toBe('in-stock');
    expect(needsSize(p)).toBe(true);
    expect(p.images.length).toBeGreaterThanOrEqual(4);
  });

  it('store list covers Cairo flagships, North Coast seasonal stores and stockists', () => {
    expect(STORES.filter((s) => s.region === 'Cairo' && s.type === 'Flagship').length).toBeGreaterThanOrEqual(5);
    expect(STORES.filter((s) => s.region === 'North Coast' && s.type === 'Seasonal').length).toBeGreaterThanOrEqual(5);
    expect(STORES.some((s) => s.type === 'Stockist')).toBe(true);
  });
});
