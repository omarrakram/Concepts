import { describe, expect, it } from 'vitest';
import index from '../data/catalogue-index.json';
import registryJson from '../data/stylist.generated.json';
import { hydrate } from '../lib/catalogue/hydrate';
import type { IndexFile, Product } from '../lib/catalogue/types';
import { audienceOf, CATEGORY_SLOT, classify, fitsModel, isKids, type ClassifyInput } from '../features/dressup/classify';
import { buildStylist, resolveEntry, type Registry } from '../features/dressup/registry';

const cat = hydrate(index as unknown as IndexFile);
const registry = registryJson as unknown as Registry;
const p = (over: Partial<ClassifyInput>): ClassifyInput => ({ handle: 'x', title: 'Thing', productType: 'Printed Hoodies', collections: [], tags: '', ...over });

describe('DRESSUP.EXE classification', () => {
  it('is deterministic: the whole catalogue classifies the same way twice', () => {
    const a = cat.products.map((x) => JSON.stringify(classify(x)));
    const b = cat.products.map((x) => JSON.stringify(classify(x)));
    expect(a).toEqual(b);
  });

  it('maps real product types to the right slot (tops under layers, PJOYS are bottoms)', () => {
    expect(classify(p({ productType: 'Printed Oversized Tees' }))).toMatchObject({ relevant: true, category: 'tops', slot: 'top' });
    expect(classify(p({ productType: 'Zip Up Hoodies' }))).toMatchObject({ category: 'layers', slot: 'outer' });
    expect(classify(p({ productType: 'PJOYS' }))).toMatchObject({ category: 'bottoms', slot: 'bottom' });
    expect(classify(p({ productType: 'Knit Dress' }))).toMatchObject({ category: 'sets', slot: 'onepiece' });
    expect(classify(p({ productType: 'Washed Cap' }))).toMatchObject({ category: 'headwear', slot: 'head' });
    expect(classify(p({ productType: 'Neck Socks' }))).toMatchObject({ category: 'socks', slot: 'socks' });
    for (const [c, s] of Object.entries(CATEGORY_SLOT)) expect(typeof s, c).toBe('string');
  });

  it('kids pieces and home goods are non-stylist (the models are adults)', () => {
    expect(classify(p({ productType: 'Kids Pjoys' }))).toEqual({ relevant: false, reason: 'kids' });
    expect(classify(p({ productType: 'Printed Hoodies (Kids)' }))).toEqual({ relevant: false, reason: 'kids' });
    expect(classify(p({ collections: ['all-kids-products'] }))).toEqual({ relevant: false, reason: 'kids' });
    expect(classify(p({ productType: 'Candle' }))).toEqual({ relevant: false, reason: 'not-worn' });
    expect(classify(p({ productType: 'Laptop Sleeve' }))).toEqual({ relevant: false, reason: 'not-worn' });
    for (const x of cat.products.filter((y) => isKids(y))) expect(classify(x).relevant, x.handle).toBe(false);
  });

  it('unknown types fall back to the storefront department collections, never a guess', () => {
    expect(classify(p({ productType: 'Brand New Thing', collections: ['all-bottoms'] }))).toMatchObject({ category: 'bottoms', evidence: ['collection', 'none'] });
    expect(classify(p({ productType: 'Brand New Thing', collections: ['newest'] }))).toEqual({ relevant: false, reason: 'unknown-type' });
    // stray whitespace in a type (one real type has a non-breaking space)
    expect(classify(p({ productType: 'Waffled Set' }))).toMatchObject({ category: 'sets' });
  });

  it('MEN / WOMEN / shared comes from evidence: title, then tags, then collections', () => {
    expect(audienceOf(p({ title: 'Female Brown Barrel Leg Jeans', tags: 'unisex' }))).toEqual({ audience: 'women', evidence: ['title'] });
    expect(audienceOf(p({ title: 'Male Beige Washed Baggy Jeans' }))).toEqual({ audience: 'men', evidence: ['title'] });
    expect(audienceOf(p({ tags: 'Female outwear tank top Women' }))).toEqual({ audience: 'women', evidence: ['tags'] });
    expect(audienceOf(p({ tags: 'Female Male men pants Pjoys' }))).toEqual({ audience: 'shared', evidence: ['tags'] });
    expect(audienceOf(p({ collections: ['men'] }))).toEqual({ audience: 'men', evidence: ['collections'] });
    expect(audienceOf(p({}))).toEqual({ audience: 'shared', evidence: ['none'] });
    expect(fitsModel('shared', 'men') && fitsModel('shared', 'women')).toBe(true);
    expect(fitsModel('women', 'men')).toBe(false);
  });

  it('every stylist-relevant product of the real catalogue stays discoverable (wearable or view-only)', () => {
    const s = buildStylist(cat, registry);
    expect(s.counts.total).toBe(cat.products.length);
    expect(s.counts.relevant).toBe(s.counts.wearable + s.counts.viewOnly);
    expect(s.counts.relevant + s.counts.nonStylist).toBe(s.counts.total);
    expect(s.counts.men + s.counts.women + s.counts.shared).toBe(s.counts.relevant);
    for (const x of cat.products) {
      const e = s.byHandle.get(x.handle)!;
      expect(e.kind === 'non-stylist').toBe(!classify(x).relevant);
    }
  });

  it('a mapping is only used while it still matches the live catalogue (stale-safe)', () => {
    const hoodie = cat.products.find((x) => classify(x).relevant && (classify(x) as { slot: string }).slot === 'outer')!;
    const item = { slot: 'outer' as const, file: '/iys/stylist/g/x.webp', w: 300, h: 320, image: 0, src: 'x.jpg', packshots: [0], fit: { hemW: 0.6, cx: 0.5, shoulderY: 0.2, waistW: 0.5 } };
    expect(resolveEntry(hoodie, { items: { [hoodie.handle]: item }, skip: {} }).kind).toBe('wearable');
    // the catalogue now files it under another slot → view-only, not a broken stage
    expect(resolveEntry(hoodie, { items: { [hoodie.handle]: { ...item, slot: 'bottom' } }, skip: {} })).toMatchObject({ kind: 'view-only', reason: 'not-mapped-yet' });
    // a malformed record is never drawn
    expect(resolveEntry(hoodie, { items: { [hoodie.handle]: { ...item, file: 'https://evil.example/x.png' } }, skip: {} }).kind).toBe('view-only');
    expect(resolveEntry(hoodie, { items: { [hoodie.handle]: { ...item, fit: { ...item.fit, hemW: Number.NaN } } }, skip: {} }).kind).toBe('view-only');
    // a product newer than the stylist build
    expect(resolveEntry(hoodie, { items: {}, skip: {} })).toMatchObject({ kind: 'view-only', reason: 'not-mapped-yet' });
    // mappings for products that left the catalogue are simply never listed
    const s = buildStylist(cat, { items: { 'gone-forever': item }, skip: {} });
    expect(s.byHandle.has('gone-forever')).toBe(false);
  });

  it('the generated registry holds stylist data only, and only for real stylist products', () => {
    const forbidden = ['price', 'compareAtPrice', 'variants', 'variantId', 'id', 'title', 'available', 'sizes'];
    for (const [h, it] of Object.entries(registry.items)) {
      const prod = cat.byHandle.get(h) as Product | undefined;
      expect(prod, h).toBeTruthy();
      const c = classify(prod!);
      expect(c.relevant && c.slot, h).toBe(it.slot);
      for (const k of forbidden) expect(k in it, `${h}.${k}`).toBe(false);
      expect(it.file).toMatch(/^\/iys\/stylist\/g\/[a-z0-9-]+\.webp$/);
    }
    for (const h of Object.keys(registry.skip)) expect(cat.byHandle.has(h), h).toBe(true);
  });
});
