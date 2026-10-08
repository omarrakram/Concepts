import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BODY, CONFLICTS, emptyLooks, isValid, LAYER_ORDER, layerIndex, looksReducer, paintOrder, randomLook, remove, seeded, wear, type Outfit } from '../features/dressup/outfit';
import { lookPlacement, placementStyle } from '../features/dressup/stage';

describe('DRESSUP.EXE outfit domain', () => {
  it('wearing fills one slot per piece and replaces what was there', () => {
    let o: Outfit = {};
    o = wear(o, 'top', 'tee-a');
    o = wear(o, 'head', 'cap-a');
    o = wear(o, 'top', 'tee-b');
    expect(o).toEqual({ top: 'tee-b', head: 'cap-a' });
  });

  it('body pieces are one official photo each, so only one is on at a time (other slots are untouched)', () => {
    let o: Outfit = wear({ head: 'cap' }, 'top', 'tee');
    o = wear(o, 'outer', 'hoodie');
    expect(o).toEqual({ head: 'cap', outer: 'hoodie' });
    o = wear(o, 'bottom', 'pjoys');
    expect(o).toEqual({ head: 'cap', bottom: 'pjoys' });
    o = wear(o, 'onepiece', 'set');
    expect(o).toEqual({ head: 'cap', onepiece: 'set' });
    for (const b of BODY) expect(CONFLICTS[b].sort()).toEqual(BODY.filter((x) => x !== b).sort());
    expect(CONFLICTS.head).toEqual([]);
    expect(isValid({ top: 't', outer: 'h' })).toBe(false);
    expect(isValid({ outer: 'h', head: 'c' })).toBe(true);
  });

  it('wearing the same piece again takes it off (toggle)', () => {
    expect(wear({ top: 'tee-a' }, 'top', 'tee-a')).toEqual({});
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
    expect(paintOrder({ head: 'cap', top: 't' })).toEqual(['top', 'head']);
  });

  it('placements live in the normalised stage space: an on-model layer keeps the box measured at build time', () => {
    const p = lookPlacement({ x: 0.1, y: 0.2, w: 0.8, h: 0.75 });
    expect(p).toEqual({ left: 0.1, top: 0.2, width: 0.8, height: 0.75 });
    expect(placementStyle(p)).toEqual({ left: '10.000%', top: '20.000%', width: '80.000%' });
  });

  it('RANDOM LOOK is reproducible, uses only the given wearable pool: one body piece, nothing else', () => {
    const pool = { top: ['t1', 't2'], outer: ['o1'], bottom: ['b1'], onepiece: ['d1'], head: ['c1'], bag: ['bag1'] };
    const a = randomLook(pool, seeded(7));
    expect(randomLook(pool, seeded(7))).toEqual(a);
    expect(isValid(a)).toBe(true);
    for (const [slot, h] of Object.entries(a)) expect((pool as Record<string, string[]>)[slot]).toContain(h);
    for (let seed = 0; seed < 50; seed++) {
      const o = randomLook(pool, seeded(seed));
      expect(Object.keys(o)).toHaveLength(1);
      expect(BODY).toContain(Object.keys(o)[0]);
    }
    expect(randomLook({}, seeded(1))).toEqual({});
  });

  it('outfits are never persisted: the looks store has no storage at all', () => {
    const src = readFileSync(new URL('../features/dressup/store.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/persist\(|localStorage\.|sessionStorage\.|zustand\/middleware|state\/storage/);
  });
});
