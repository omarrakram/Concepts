import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BODY, CONFLICTS, emptyLooks, isValid, LAYER_ORDER, layerIndex, looksReducer, paintOrder, randomLook, remove, seeded, wear, wearPiece, type Outfit } from '../features/dressup/outfit';
import { lookPlacement, placementStyle } from '../features/dressup/stage';

describe('DRESSUP.EXE outfit domain', () => {
  it('wearing fills one slot per piece and replaces what was there', () => {
    let o: Outfit = {};
    o = wear(o, 'top', 'tee-a');
    o = wear(o, 'head', 'cap-a');
    o = wear(o, 'top', 'tee-b');
    expect(o).toEqual({ top: 'tee-b', head: 'cap-a' });
  });

  it('slot independence (the V2 invariant): top, bottom and layer change on their own', () => {
    // 1–2. top A, then bottom A
    let o: Outfit = wear({}, 'top', 'top-a');
    o = wear(o, 'bottom', 'bottom-a');
    // 3. top A remains
    expect(o.top).toBe('top-a');
    // 4–5. bottom B: top A unchanged
    o = wear(o, 'bottom', 'bottom-b');
    expect(o).toEqual({ top: 'top-a', bottom: 'bottom-b' });
    // 6–7. top B: bottom B unchanged
    o = wear(o, 'top', 'top-b');
    expect(o).toEqual({ top: 'top-b', bottom: 'bottom-b' });
    // 8–9. a layer: top and bottom stay underneath
    o = wear(o, 'outer', 'layer-a');
    expect(o).toEqual({ top: 'top-b', bottom: 'bottom-b', outer: 'layer-a' });
    // 10–11. layer off: the same top is back
    o = remove(o, 'outer');
    expect(o).toEqual({ top: 'top-b', bottom: 'bottom-b' });
    expect(CONFLICTS.outer).toEqual([]);
  });

  it('a set replaces top + bottom (a top or a bottom replaces a set); the layer stays over either', () => {
    const set = wear({ top: 't', bottom: 'b', outer: 'h' }, 'onepiece', 'dress');
    expect(set).toEqual({ outer: 'h', onepiece: 'dress' });
    expect(wear(set, 'bottom', 'jeans')).toEqual({ outer: 'h', bottom: 'jeans' });
    expect(CONFLICTS.onepiece).toEqual(['top', 'bottom']);
    expect(isValid({ top: 't', onepiece: 'd' })).toBe(false);
    expect(isValid({ top: 't', outer: 'h', bottom: 'b' })).toBe(true);
    expect(BODY).toEqual(['top', 'outer', 'bottom', 'onepiece']);
  });

  it('wearing the same piece again takes it off (toggle)', () => {
    expect(wear({ top: 'tee-a' }, 'top', 'tee-a')).toEqual({});
  });

  it('a whole look (one official photo’s whole outfit) is worn alone on the body, as deployed', () => {
    const wholes = new Set(['look-a', 'look-b']);
    let o = wearPiece({ top: 't', bottom: 'b', head: 'cap' }, 'top', 'look-a', wholes);
    // the other body pieces come off; accessories stay
    expect(o).toEqual({ top: 'look-a', head: 'cap' });
    o = wearPiece(o, 'outer', 'look-b', wholes);
    expect(o).toEqual({ outer: 'look-b', head: 'cap' });
    // any other body piece takes the whole look off
    expect(wearPiece(o, 'bottom', 'jeans', wholes)).toEqual({ bottom: 'jeans', head: 'cap' });
    // the same piece again takes it off
    expect(wearPiece(o, 'outer', 'look-b', wholes)).toEqual({ head: 'cap' });
    // slot pieces keep combining
    expect(wearPiece({ top: 't' }, 'bottom', 'b', wholes)).toEqual({ top: 't', bottom: 'b' });
    expect(looksReducer(emptyLooks(), { type: 'wear', model: 'men', slot: 'top', handle: 'look-a', wholes }).men).toEqual({ top: 'look-a' });
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

  it('placements live in the normalised stage space: an on-model layer keeps the box measured at build time', () => {
    const p = lookPlacement({ x: 0.1, y: 0.2, w: 0.8, h: 0.75 });
    expect(p).toEqual({ left: 0.1, top: 0.2, width: 0.8, height: 0.75 });
    expect(placementStyle(p)).toEqual({ left: '10.000%', top: '20.000%', width: '80.000%' });
  });

  it('RANDOM LOOK is reproducible and combines wearable pieces only: a top + a bottom, sometimes a layer', () => {
    const slots = { top: ['t1', 't2'], outer: ['o1'], bottom: ['b1', 'b2'], onepiece: ['d1'], head: ['c1'], bag: ['bag1'] };
    const pool = { slots, wholes: ['w1'], slotOf: { w1: 'top' as const } };
    const a = randomLook(pool, seeded(7));
    expect(randomLook(pool, seeded(7))).toEqual(a);
    let layered = 0;
    for (let seed = 0; seed < 60; seed++) {
      const o = randomLook(pool, seeded(seed));
      expect(isValid(o)).toBe(true);
      expect(o.top && o.bottom).toBeTruthy();
      for (const [slot, h] of Object.entries(o)) expect((slots as Record<string, string[]>)[slot]).toContain(h);
      // accessories, sets and whole looks never join a slot combination
      expect('head' in o || 'bag' in o || 'onepiece' in o || Object.values(o).includes('w1')).toBe(false);
      if (o.outer) layered++;
    }
    expect(layered).toBeGreaterThan(5);
    // only a set is wearable → the set
    expect(randomLook({ slots: { onepiece: ['d1'] } }, seeded(1))).toEqual({ onepiece: 'd1' });
    // only tops → a top alone, never an invented bottom
    expect(randomLook({ slots: { top: ['t1'] } }, seeded(2))).toEqual({ top: 't1' });
    // no slot pieces (production today): one whole look, in its own slot
    for (let seed = 0; seed < 20; seed++) {
      const o = randomLook({ slots: {}, wholes: ['w1', 'w2'], slotOf: { w1: 'top', w2: 'bottom' } }, seeded(seed));
      expect(Object.entries(o).length).toBe(1);
      expect([['top', 'w1'], ['bottom', 'w2']]).toContainEqual(Object.entries(o)[0]);
    }
    expect(randomLook({ slots: {} }, seeded(1))).toEqual({});
  });

  it('outfits are never persisted: the looks store has no storage at all', () => {
    const src = readFileSync(new URL('../features/dressup/store.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/persist\(|localStorage\.|sessionStorage\.|zustand\/middleware|state\/storage/);
  });
});
