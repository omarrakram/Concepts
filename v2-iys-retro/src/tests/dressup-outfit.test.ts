import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONFLICTS, emptyLooks, isCovered, isValid, LAYER_ORDER, layerIndex, looksReducer, paintOrder, randomLook, remove, seeded, wear, type Outfit } from '../features/dressup/outfit';
import { MODELS } from '../features/dressup/models';
import { EASE, place } from '../features/dressup/stage';
import type { MappedItem } from '../features/dressup/registry';

const item = (slot: MappedItem['slot'], over: Partial<MappedItem['fit']> = {}): MappedItem => ({ slot, file: '/iys/stylist/g/a.webp', w: 360, h: 400, image: 0, src: 'a.jpg', packshots: [0], fit: { hemW: 0.62, cx: 0.5, shoulderY: 0.18, waistW: 0.7, ...over } });

describe('DRESSUP.EXE outfit domain', () => {
  it('wearing fills one slot per piece and replaces what was there', () => {
    let o: Outfit = {};
    o = wear(o, 'top', 'tee-a');
    o = wear(o, 'bottom', 'jeans-a');
    o = wear(o, 'top', 'tee-b');
    expect(o).toEqual({ top: 'tee-b', bottom: 'jeans-a' });
  });

  it('the piece you pick is the one you see: a top under a layer is kept but hidden, picking a top takes the layer off', () => {
    const layered = wear({ top: 'tee' }, 'outer', 'hoodie');
    expect(layered).toEqual({ top: 'tee', outer: 'hoodie' });
    expect(isCovered(layered, 'top')).toBe(true);
    expect(paintOrder(layered)).toEqual(['outer']);
    expect(wear(layered, 'top', 'tee-2')).toEqual({ top: 'tee-2' });
    expect(isValid(layered)).toBe(true);
  });

  it('wearing the same piece again takes it off (toggle)', () => {
    expect(wear({ top: 'tee-a' }, 'top', 'tee-a')).toEqual({});
  });

  it('a set / dress replaces top + bottom, and a top or bottom replaces a set', () => {
    const set = wear({ top: 't', bottom: 'b', outer: 'h' }, 'onepiece', 'dress');
    expect(set).toEqual({ outer: 'h', onepiece: 'dress' });
    expect(wear(set, 'bottom', 'jeans')).toEqual({ outer: 'h', bottom: 'jeans' });
    expect(CONFLICTS.onepiece).toEqual(['top', 'bottom']);
  });

  it('every reachable outfit is valid', () => {
    const rand = seeded(42);
    const slots = ['top', 'outer', 'bottom', 'onepiece', 'head', 'bag'] as const;
    let o: Outfit = {};
    for (let i = 0; i < 500; i++) {
      const s = slots[Math.floor(rand() * slots.length)]!;
      o = rand() < 0.2 ? remove(o, s) : wear(o, s, `${s}-${Math.floor(rand() * 4)}`);
      expect(isValid(o)).toBe(true);
    }
  });

  it('each model has an independent outfit', () => {
    let s = emptyLooks();
    s = looksReducer(s, { type: 'wear', model: 'men', slot: 'top', handle: 'tee' });
    s = looksReducer(s, { type: 'wear', model: 'women', slot: 'outer', handle: 'hoodie' });
    expect(s).toEqual({ men: { top: 'tee' }, women: { outer: 'hoodie' } });
    s = looksReducer(s, { type: 'clear', model: 'men' });
    expect(s).toEqual({ men: {}, women: { outer: 'hoodie' } });
  });

  it('the reducer is pure: no-ops keep identity, and invalid "set" outfits are refused', () => {
    const s = emptyLooks();
    expect(looksReducer(s, { type: 'remove', model: 'men', slot: 'top' })).toEqual(s);
    expect(looksReducer(s, { type: 'clear', model: 'men' })).toBe(s);
    expect(looksReducer(s, { type: 'set', model: 'men', outfit: { top: 't', onepiece: 'd' } })).toBe(s);
  });

  it('layer order is explicit and central: bottoms < tops < layers < head < headwear < bag', () => {
    expect(layerIndex('bottom')).toBeLessThan(layerIndex('top'));
    expect(layerIndex('top')).toBeLessThan(layerIndex('outer'));
    expect(layerIndex('outer')).toBeLessThan(layerIndex('@head'));
    expect(layerIndex('@head')).toBeLessThan(layerIndex('head'));
    expect(LAYER_ORDER.at(-1)).toBe('bag');
    expect(paintOrder({ head: 'cap', top: 't', bottom: 'b' })).toEqual(['bottom', 'top', 'head']);
  });

  it('placements live in the normalised stage space and follow the model anchors', () => {
    for (const m of Object.values(MODELS)) {
      const top = place(m, item('top'));
      // the shoulder line of the piece lands on the model's shoulder line
      expect(top.top + 0.18 * top.height).toBeCloseTo(m.anchors.shoulderY, 5);
      // the piece is centred on the body and its hem matches the shoulder width
      expect(top.left + 0.5 * top.width).toBeCloseTo(m.anchors.cx, 5);
      expect(top.width * 0.62).toBeCloseTo(m.anchors.shoulderW * EASE.top!, 5);
      const bottom = place(m, item('bottom'));
      expect(bottom.top).toBeCloseTo(m.anchors.waistY - 0.012, 5);
      for (const v of [top.left, top.top, top.width, bottom.width]) expect(Number.isFinite(v)).toBe(true);
      expect(top.width).toBeGreaterThan(0.25);
      expect(top.width).toBeLessThanOrEqual(1.1);
    }
  });

  it('RANDOM LOOK is reproducible, uses only the given wearable pool, and stays valid', () => {
    const pool = { top: ['t1', 't2'], outer: ['o1'], bottom: ['b1'], onepiece: ['d1'], head: ['c1'] };
    const a = randomLook(pool, seeded(7));
    expect(randomLook(pool, seeded(7))).toEqual(a);
    expect(isValid(a)).toBe(true);
    for (const [slot, h] of Object.entries(a)) expect((pool as Record<string, string[]>)[slot]).toContain(h);
    expect(randomLook({}, seeded(1))).toEqual({});
    expect('bag' in randomLook({ ...pool, bag: ['bag1'] }, seeded(3))).toBe(false);
  });

  it('outfits are never persisted: the looks store has no storage at all', () => {
    const src = readFileSync(new URL('../features/dressup/store.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/persist\(|localStorage\.|sessionStorage\.|zustand\/middleware|state\/storage/);
  });
});
