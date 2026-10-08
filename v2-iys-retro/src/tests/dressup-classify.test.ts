import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import index from '../data/catalogue-index.json';
import registryJson from '../data/stylist.generated.json';
import { hydrate } from '../lib/catalogue/hydrate';
import type { IndexFile, Product } from '../lib/catalogue/types';
import { audienceOf, CATEGORY_SLOT, classify, fitsModel, isKids, type ClassifyInput } from '../features/dressup/classify';
import { buildStylist, layerFor, resolveEntry, type MappedItem, type Registry } from '../features/dressup/registry';
import { LOOK_SOURCES, SHOOT_LOOKS } from '../features/dressup/looks';
import { MODELS } from '../features/dressup/models';

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
    const hoodie = cat.products.find((x) => {
      const c = classify(x);
      return c.relevant && c.slot === 'outer' && c.audience === 'shared';
    })!;
    const look = { file: '/iys/stylist/look/men/x.webp', box: { x: 0.1, y: 0.2, w: 0.8, h: 0.8 }, image: 0, src: 'x.jpg', score: 0.8 };
    const item: MappedItem = { kind: 'on-model', slot: 'outer', looks: { men: look } };
    const one = (it: unknown) => resolveEntry(hoodie, { items: { [hoodie.handle]: it as MappedItem }, skip: {} });
    expect(one(item)).toMatchObject({ kind: 'wearable', models: ['men'] });
    // photographed on him only: wearable on him, never drawn on her
    expect(layerFor(one(item), 'men')).toEqual(look);
    expect(layerFor(one(item), 'women')).toBeNull();
    // the catalogue now files it under another slot → view-only, not a broken stage
    expect(one({ ...item, slot: 'bottom' })).toMatchObject({ kind: 'view-only', reason: 'not-mapped-yet' });
    // a malformed record is never drawn
    expect(one({ ...item, looks: { men: { ...look, file: 'https://evil.example/x.png' } } }).kind).toBe('view-only');
    expect(one({ ...item, looks: { men: { ...look, box: { ...look.box, w: Number.NaN } } } }).kind).toBe('view-only');
    expect(one({ ...item, looks: {} }).kind).toBe('view-only');
    // the piece worn at the shoot: wearable, and nothing is drawn (the canonical photo already shows it)
    expect(layerFor(one({ ...item, looks: { men: { shoot: true, src: 'reference-men.webp' } } }), 'men')).toEqual({ shoot: true, src: 'reference-men.webp' });
    // a flat packshot (the retired kind of layer) never dresses a model: it would look pasted on
    expect(one({ kind: 'packshot', slot: 'outer', file: '/iys/stylist/g/x.webp', w: 300, h: 320 }).kind).toBe('view-only');
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
      // every layer is an official photo of the model wearing it, on a body slot
      expect(it.kind, h).toBe('on-model');
      expect(['top', 'outer', 'bottom', 'onepiece'], h).toContain(it.slot);
      for (const [m, l] of Object.entries(it.looks)) {
        // the piece worn at the shoot draws nothing: the canonical photo already shows it
        if ('shoot' in l) expect(SHOOT_LOOKS[m as keyof typeof SHOOT_LOOKS], h).toBe(h);
        else {
          expect(l.file, h).toBe(`/iys/stylist/look/${m}/${h}.webp`);
          expect(existsSync(`public${l.file}`), l.file).toBe(true);
        }
      }
    }
    for (const h of Object.keys(registry.skip)) expect(cat.byHandle.has(h), h).toBe(true);
  });

  it('every on-model layer comes from a reviewed official photo of that same product (or the shoot photo itself)', () => {
    const details: Record<string, { images: { src: string }[] }> = Object.assign({}, ...readdirSync('public/catalogue').map((f) => JSON.parse(readFileSync(`public/catalogue/${f}`, 'utf8'))));
    let n = 0;
    for (const [h, it] of Object.entries(registry.items)) {
      for (const [m, l] of Object.entries(it.looks) as [keyof typeof LOOK_SOURCES, NonNullable<(typeof it.looks)['men']>][]) {
        n++;
        if ('shoot' in l) {
          expect(SHOOT_LOOKS[m], h).toBe(h);
          expect(l.src, h).toBe(MODELS[m].source.file.split('/').pop());
          continue;
        }
        expect(LOOK_SOURCES[m].some((x) => x.handle === h && x.image === l.image), `${m} ${h}#${l.image} reviewed`).toBe(true);
        expect(details[h]!.images[l.image]!.src.split('?')[0]!.endsWith(`/${l.src}`), `${h} provenance`).toBe(true);
      }
    }
    expect(n).toBeGreaterThan(0);
  });
});
