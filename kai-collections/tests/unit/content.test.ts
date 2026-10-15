import { describe, expect, it } from 'vitest';
import { BY_SLUG, PRODUCTS, SETS, SHOP_VIEWS, discount, officialUrl, onSale, relatedTo, search } from '../../src/data/catalog';
import { MATERIALS } from '../../src/gl/materials';
import { MOODS } from '../../src/home/Atlas';
import { CHAPTERS } from '../../src/home/Horizon';
import { WARDROBES, optionsFor } from '../../src/home/Builder';
import { ENTRIES } from '../../src/home/Journal';
import { STORES } from '../../src/data/stores';

describe('shop logic', () => {
  it('every shop view has products and men/women/kids partition sensibly', () => {
    for (const v of SHOP_VIEWS) expect(PRODUCTS.filter(v.test).length, v.id).toBeGreaterThan(0);
    const kids = PRODUCTS.filter(SHOP_VIEWS.find((v) => v.id === 'kids')!.test);
    expect(kids.every((p) => p.department === 'kids')).toBe(true);
  });

  it('sale view equals products whose compare-at price is higher', () => {
    const sale = PRODUCTS.filter(SHOP_VIEWS.find((v) => v.id === 'sale')!.test);
    expect(sale.length).toBeGreaterThan(5);
    for (const p of sale) expect(onSale(p) && discount(p) > 0).toBe(true);
  });

  it('search ranks name matches and requires every term', () => {
    expect(search('zebra').map((p) => p.slug)).toContain('yellow-zebra-swim-shorts');
    expect(search('beige linen pants')[0].name).toMatch(/Beige Linen Pants/);
    expect(search('qwertyuiop')).toHaveLength(0);
    expect(search('')).toHaveLength(0);
  });

  it('official links go to the exact KAI product, or to KAI search when the URL was not indexed', () => {
    expect(officialUrl(BY_SLUG.get('festival-del-mare-swim-shorts')!)).toBe('https://kaicollections.com/products/festival-del-mare-swim-shorts');
    expect(officialUrl(BY_SLUG.get('yellow-zebra-swim-shorts')!)).toMatch(/^https:\/\/kaicollections\.com\/search\?q=Yellow%20Zebra/);
  });

  it('related products exclude the product itself', () => {
    for (const p of PRODUCTS) expect(relatedTo(p).some((r) => r.slug === p.slug)).toBe(false);
  });

  it('matching sets reference real products', () => {
    for (const s of SETS) for (const i of s.items) expect(BY_SLUG.has(i), `${s.id}: ${i}`).toBe(true);
  });
});

describe('editorial content points at real products', () => {
  it('Horizon chapters, Atlas moods, Journal entries', () => {
    for (const c of CHAPTERS) for (const s of [c.product, c.second].filter(Boolean) as string[]) expect(BY_SLUG.has(s), s).toBe(true);
    for (const m of MOODS) for (const s of m.products) expect(BY_SLUG.has(s), s).toBe(true);
    for (const e of ENTRIES) for (const s of e.products) expect(BY_SLUG.has(s), s).toBe(true);
  });

  it('material facts are attributed to real products that carry that material', () => {
    for (const m of MATERIALS) {
      for (const f of m.facts) expect(BY_SLUG.has(f.product), f.product).toBe(true);
      for (const s of m.products) expect(BY_SLUG.has(s), s).toBe(true);
    }
  });

  it('the outfit builder offers several compatible pieces in every slot', () => {
    for (const w of Object.values(WARDROBES))
      for (const s of w.slots) {
        const opts = optionsFor(s);
        expect(opts.length, s.id).toBeGreaterThanOrEqual(3);
        expect(opts.every((p) => s.kinds.includes(p.kind) && s.depts.includes(p.department))).toBe(true);
      }
  });

  it('store list covers Cairo flagships and the North Coast', () => {
    expect(STORES.filter((s) => s.region === 'Cairo').length).toBeGreaterThanOrEqual(5);
    expect(STORES.some((s) => s.region === 'North Coast' && s.type === 'Seasonal')).toBe(true);
  });
});
