import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import index from '../data/catalogue-index.json';
import registryJson from '../data/stylist.generated.json';
import { hydrate } from '../lib/catalogue/hydrate';
import type { IndexFile } from '../lib/catalogue/types';
import { classify } from '../features/dressup/classify';
import { remove, wear, wearPiece, type Outfit } from '../features/dressup/outfit';
import { buildStylist, wholesOf, type LookLayer, type MappedItem, type ModelLayers, type Registry } from '../features/dressup/registry';
import { stackFor } from '../features/dressup/stack';

const cat = hydrate(index as unknown as IndexFile);
const registry = registryJson as unknown as Registry;

/**
 * A synthetic registry over real catalogue products (one per slot), so the
 * slot rules are tested without assets. These are test fixtures: nothing
 * here is, or claims to be, an approved asset.
 */
const pick = (slot: string, n = 0) =>
  cat.products.filter((p) => {
    const c = classify(p);
    return c.relevant && c.slot === slot && c.audience === 'shared';
  })[n]!.handle;
const T1 = pick('top'), T2 = pick('top', 1), B1 = pick('bottom'), B2 = pick('bottom', 1), O1 = pick('outer'), O2 = pick('outer', 1), S1 = pick('onepiece'), W1 = pick('top', 2);
const slotLook = (h: string, inner = false): LookLayer => ({
  file: `/iys/stylist/slot/men/${h}.webp`,
  box: { x: 0.2, y: 0.15, w: 0.6, h: 0.5 },
  source: 'derived',
  scope: 'slot',
  job: `men--${h}`,
  candidate: 'f'.repeat(64),
  ...(inner ? { inner: { file: `/iys/stylist/slot/men/${h}.inner.webp`, box: { x: 0, y: 0, w: 1, h: 1 } } } : {}),
});
const wholeLook = (h: string): LookLayer => ({ file: `/iys/stylist/look/men/${h}.webp`, box: { x: 0.2, y: 0.19, w: 0.6, h: 0.81 }, source: 'official', scope: 'whole', image: 0, src: 'x.jpg', score: 0.9 });
const item = (slot: MappedItem['slot'], l: LookLayer): MappedItem => ({ kind: 'on-model', slot, looks: { men: l } });
const reg = {
  items: {
    [T1]: item('top', slotLook(T1)),
    [T2]: item('top', slotLook(T2)),
    [B1]: item('bottom', slotLook(B1)),
    [B2]: item('bottom', slotLook(B2)),
    [O1]: item('outer', slotLook(O1, true)),
    [O2]: item('outer', slotLook(O2)),
    [S1]: item('onepiece', slotLook(S1)),
    [W1]: item('top', wholeLook(W1)),
  },
  skip: {},
};
const L = (f: string) => ({ file: `/iys/stylist/models/men-${f}.webp`, box: { x: 0, y: 0, w: 1, h: 1 } });
const base: ModelLayers = { file: '/iys/stylist/models/men.webp', headFile: '/iys/stylist/models/men-head.webp', head: { x: 0.4, y: 0.05, w: 0.2, h: 0.17 }, room: L('room'), upper: L('upper'), lower: L('lower'), inner: L('inner'), bytes: 0 };
const s = buildStylist(cat, reg);
const draw = (o: Outfit, b: ModelLayers | undefined = base) => stackFor(s, 'men', o, b)?.layers.map((l) => `${l.part}${l.handle ? `:${l.handle}` : ''}${l.clip ? '[clip]' : ''}`) ?? null;

describe('DRESSUP.EXE stage stack (slot layers)', () => {
  it('nothing chosen → the canonical photo as it is', () => {
    expect(draw({})).toBeNull();
  });

  it('slot independence on the stage: each slot draws its own layer, the others keep theirs', () => {
    let o = wear({}, 'top', T1);
    expect(draw(o)).toEqual(['room', 'base', `top:${T1}`, 'head']); // canonical trousers under the chosen top
    o = wear(o, 'bottom', B1);
    expect(draw(o)).toEqual(['room', `bottom:${B1}`, `top:${T1}`, 'head']);
    o = wear(o, 'bottom', B2);
    expect(draw(o)).toEqual(['room', `bottom:${B2}`, `top:${T1}`, 'head']);
    o = wear(o, 'top', T2);
    expect(draw(o)).toEqual(['room', `bottom:${B2}`, `top:${T2}`, 'head']);
    // an open layer: the chosen top shows through its front only (never in full beside the layer's own arms)
    o = wear(o, 'outer', O1);
    expect(draw(o)).toEqual(['room', `bottom:${B2}`, `outer:${O1}`, `top:${T2}[clip]`, 'head']);
    // a closed layer: the top is worn but hidden
    const closed = wear(o, 'outer', O2);
    expect(draw(closed)).toEqual(['room', `bottom:${B2}`, `outer:${O2}`, 'head']);
    expect(stackFor(s, 'men', closed, base)!.coveredTop).toBe(true);
    // layer off: the same top again
    expect(draw(remove(o, 'outer'))).toEqual(['room', `bottom:${B2}`, `top:${T2}`, 'head']);
  });

  it('a bottom alone keeps the canonical upper body; a set replaces both halves; the head is always last', () => {
    expect(draw({ bottom: B1 })).toEqual(['room', `bottom:${B1}`, 'base', 'head']);
    expect(draw({ onepiece: S1 })).toEqual(['room', `onepiece:${S1}`, 'head']);
    expect(draw({ onepiece: S1, outer: O2 })).toEqual(['room', `onepiece:${S1}`, `outer:${O2}`, 'head']);
  });

  it('a whole look draws its photo’s body + the head, alone, with or without canonical slot layers', () => {
    const wholes = wholesOf(s, 'men');
    expect([...wholes]).toEqual([W1]);
    expect(draw({ top: W1 })).toEqual([`top:${W1}`, 'head']);
    expect(draw({ top: W1 }, { ...base, room: undefined, upper: undefined, lower: undefined, inner: undefined })).toEqual([`top:${W1}`, 'head']);
    // wearing a slot piece takes it off (and vice versa): two photos' bodies never mix
    const o = wearPiece({ top: W1 }, 'bottom', B1, wholes);
    expect(o).toEqual({ bottom: B1 });
    expect(wearPiece({ top: T1, bottom: B1 }, 'top', W1, wholes)).toEqual({ top: W1 });
  });

  it('view-only, unknown or broken mappings never draw; missing canonical layers → the plain photo', () => {
    expect(draw({ top: 'not-a-real-product' })).toBeNull();
    const bad = buildStylist(cat, { items: { [T1]: item('top', { ...slotLook(T1), file: 'https://evil.example/x.png' }) }, skip: {} });
    expect(stackFor(bad, 'men', { top: T1 }, base)).toBeNull();
    expect(stackFor(s, 'men', { top: T1 }, { ...base, room: { file: 'x.png', box: base.room!.box } })).toBeNull();
    expect(stackFor(s, 'men', { top: T1 }, undefined)).toBeNull();
    // the deployed registry has no canonical slot layers: a slot piece can't draw without them
    expect(stackFor(s, 'men', { top: T1 }, { ...base, room: undefined })).toBeNull();
  });

  it('the real registry: every wearable piece draws over existing files, the head last', () => {
    const real = buildStylist(cat, registry);
    let n = 0;
    for (const m of ['men', 'women'] as const) {
      const wholes = wholesOf(real, m);
      for (const e of real.entries) {
        if (e.kind !== 'wearable' || !e.models.includes(m)) continue;
        const st = stackFor(real, m, wearPiece({}, e.slot, e.product.handle, wholes), registry.models![m]);
        // the shoot piece: the canonical photo as it is
        if (!st) continue;
        n++;
        expect(st.layers.at(-1)!.part).toBe('head');
        for (const l of st.layers) expect(existsSync(`public${l.file}`), l.file).toBe(true);
      }
    }
    expect(n).toBeGreaterThan(0);
  });
});
