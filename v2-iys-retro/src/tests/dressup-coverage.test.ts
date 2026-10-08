import { describe, expect, it } from 'vitest';
import index from '../data/catalogue-index.json';
import registryJson from '../data/stylist.generated.json';
import { hydrate } from '../lib/catalogue/hydrate';
import type { IndexFile } from '../lib/catalogue/types';
import { buildStylist, type Registry } from '../features/dressup/registry';

/** Coverage is generated from the real catalogue + registry, never typed in by hand. */
describe('DRESSUP.EXE coverage (real catalogue)', () => {
  it('reports generated coverage and keeps it consistent', () => {
    const cat = hydrate(index as unknown as IndexFile);
    const s = buildStylist(cat, registryJson as unknown as Registry);
    const styled = s.entries.filter((e) => e.kind !== 'non-stylist') as Exclude<(typeof s.entries)[number], { kind: 'non-stylist' }>[];
    const by = <T extends string>(xs: T[]) => xs.reduce<Record<string, number>>((a, k) => ((a[k] = (a[k] ?? 0) + 1), a), {});
    const report = {
      ...s.counts,
      menCompatible: styled.filter((e) => e.audience !== 'women').length,
      womenCompatible: styled.filter((e) => e.audience !== 'men').length,
      wearableBySlot: by(styled.filter((e) => e.kind === 'wearable').map((e) => e.slot)),
      viewOnlyReasons: by(styled.flatMap((e) => (e.kind === 'view-only' ? [e.reason] : []))),
      nonStylistReasons: by(s.entries.flatMap((e) => (e.kind === 'non-stylist' ? [e.reason] : []))),
    };
    console.log('[dressup coverage]', JSON.stringify(report));
    expect(s.counts.wearable).toBeGreaterThan(50);
    expect(s.counts.wearableMen).toBeGreaterThan(0);
    expect(s.counts.wearableWomen).toBeGreaterThan(0);
    // every mapping in the registry resolves (no orphans left after a build)
    expect(Object.keys((registryJson as unknown as Registry).items).length).toBe(s.counts.wearable);
  });
});
