import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import index from '../data/catalogue-index.json';
import registryJson from '../data/stylist.generated.json';
import { hydrate } from '../lib/catalogue/hydrate';
import type { IndexFile, Product } from '../lib/catalogue/types';
import { audienceOf, CATEGORY_SLOT, classify, fitsModel, isKids, type ClassifyInput } from '../features/dressup/classify';
import { buildStylist, layerFor, resolveEntry, type MappedItem, type Registry } from '../features/dressup/registry';
import { OFFICIAL_SLOT_CANDIDATES, SHOOT_LOOKS, WHOLE_LOOKS } from '../features/dressup/looks';
import { jobId } from '../features/dressup/tryon';
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
    // a pullover hoodie or crewneck is the top (a zip-up or jacket goes over it)
    expect(classify(p({ productType: 'Printed Hoodies' }))).toMatchObject({ category: 'tops', slot: 'top' });
    expect(classify(p({ productType: 'Crewnecks' }))).toMatchObject({ category: 'tops', slot: 'top' });
    expect(classify(p({ productType: 'Denim Jacket' }))).toMatchObject({ category: 'layers', slot: 'outer' });
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
    const look = { file: '/iys/stylist/look/men/x.webp', box: { x: 0.1, y: 0.2, w: 0.8, h: 0.8 }, source: 'official' as const, scope: 'whole' as const, image: 0, src: 'x.jpg', score: 0.8 };
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
    // an unknown source class or scope is never drawn; a whole look is always an official photo
    expect(one({ ...item, looks: { men: { ...look, source: 'generated' } } }).kind).toBe('view-only');
    expect(one({ ...item, looks: { men: { ...look, source: 'derived' } } }).kind).toBe('view-only');
    expect(one({ ...item, looks: { men: { ...look, scope: undefined } } }).kind).toBe('view-only');
    // a slot layer only with its approved job + reviewed candidate, from the slot folder
    const slot = { ...look, scope: 'slot' as const, file: '/iys/stylist/slot/men/x.webp', job: 'men--x', candidate: 'a'.repeat(64) };
    expect(one({ ...item, looks: { men: slot } })).toMatchObject({ kind: 'wearable' });
    expect(one({ ...item, looks: { men: { ...slot, source: 'derived' } } })).toMatchObject({ kind: 'wearable' });
    expect(one({ ...item, looks: { men: { ...slot, job: undefined } } }).kind).toBe('view-only');
    expect(one({ ...item, looks: { men: { ...slot, candidate: undefined } } }).kind).toBe('view-only');
    expect(one({ ...item, looks: { men: { ...slot, file: '/iys/stylist/look/men/x.webp' } } }).kind).toBe('view-only');
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
          expect(l.file, h).toBe(`/iys/stylist/${l.scope === 'whole' ? 'look' : 'slot'}/${m}/${h}.webp`);
          expect(existsSync(`public${l.file}`), l.file).toBe(true);
        }
      }
    }
    for (const h of Object.keys(registry.skip)) expect(cat.byHandle.has(h), h).toBe(true);
  });

  it('every whole look is a reviewed official photo of that same product (or the shoot piece itself)', () => {
    const details: Record<string, { images: { src: string }[] }> = Object.assign({}, ...readdirSync('public/catalogue').map((f) => JSON.parse(readFileSync(`public/catalogue/${f}`, 'utf8'))));
    let n = 0;
    for (const [h, it] of Object.entries(registry.items))
      for (const [m, l] of Object.entries(it.looks) as [keyof typeof WHOLE_LOOKS, NonNullable<(typeof it.looks)['men']>][]) {
        if ('shoot' in l) {
          expect(SHOOT_LOOKS[m], h).toBe(h);
          expect(l.src, h).toBe(MODELS[m].source.file.split('/').pop());
          continue;
        }
        if (l.scope !== 'whole') continue;
        n++;
        expect(l.source, h).toBe('official');
        expect(WHOLE_LOOKS[m].some((x) => x.handle === h && x.image === l.image), `${m} ${h}#${l.image} reviewed`).toBe(true);
        expect(details[h]!.images[l.image!]!.src.split('?')[0]!.endsWith(`/${l.src}`), `${h} provenance`).toBe(true);
      }
    expect(n).toBeGreaterThan(0);
  });

  it('every slot layer is an approved job of exactly the reviewed candidate (official or derived)', () => {
    const approvals: { id: string; decision: string; candidate: string }[] = JSON.parse(readFileSync('scripts/stylist/tryon/approvals.json', 'utf8'));
    for (const [h, it] of Object.entries(registry.items))
      for (const [m, l] of Object.entries(it.looks) as [keyof typeof WHOLE_LOOKS, NonNullable<(typeof it.looks)['men']>][]) {
        if ('shoot' in l || l.scope !== 'slot') continue;
        expect(l.job, `${m} ${h}`).toBe(jobId(l.source, m, h));
        const a = approvals.filter((x) => x.id === l.job).at(-1);
        expect(a?.decision, `${m} ${h}`).toBe('approved');
        expect(l.candidate, `${m} ${h}`).toBe(a!.candidate);
        if (l.source === 'official') expect(OFFICIAL_SLOT_CANDIDATES[m].some((x) => x.handle === h && x.image === l.image), `${m} ${h}`).toBe(true);
      }
  });

  it('a model gets its canonical room / upper / lower layers only when it has slot layers (else the plain photo + head)', () => {
    for (const [id, b] of Object.entries(registry.models!)) {
      expect(existsSync(`public${b.headFile}`), id).toBe(true);
      expect(b.head.y).toBeLessThan(0.15);
      const hasSlots = Object.values(registry.items).some((it) => {
        const l = it.looks[id as keyof typeof it.looks];
        return l && !('shoot' in l) && l.scope === 'slot';
      });
      const parts = [b.room, b.upper, b.lower, b.inner];
      if (!hasSlots) {
        expect(parts.filter(Boolean), id).toEqual([]);
        for (const p of ['room', 'upper', 'lower', 'inner']) expect(existsSync(`public/iys/stylist/models/${id}-${p}.webp`), `${id}-${p}`).toBe(false);
        continue;
      }
      for (const l of parts.filter((x) => x !== undefined)) {
        expect(existsSync(`public${l.file}`), l.file).toBe(true);
        expect(l.box.x + l.box.w).toBeLessThanOrEqual(1.0001);
        expect(l.box.y + l.box.h).toBeLessThanOrEqual(1.0001);
      }
      expect(b.room!.box).toEqual({ x: 0, y: 0, w: 1, h: 1 });
      expect(b.upper!.box.y).toBeGreaterThan(b.head.y);
      expect(b.lower!.box.y + b.lower!.box.h).toBeCloseTo(1, 2);
    }
  });
});
