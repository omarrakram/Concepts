import type { Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { classify, fitsModel, type ModelId, type Slot } from '../../src/features/dressup/classify';
import { index } from './fixtures';

/** The generated stylist registry, read the same way the app bundles it. */
export const registry = JSON.parse(readFileSync(new URL('../../src/data/stylist.generated.json', import.meta.url), 'utf8')) as {
  items: Record<string, { kind: 'on-model'; slot: Slot; looks: Partial<Record<ModelId, { file?: string; shoot?: true; scope?: 'whole' | 'slot' }>> }>;
  skip: Record<string, string>;
};
/** The layer file a piece draws on a model (the official photo of them wearing it; none for the shoot piece). */
export const layerFile = (handle: string, model: ModelId): string | undefined => registry.items[handle]?.looks[model]?.file;

type Entry = { h: string; t: string; ty: string; k: number[]; tg?: string; a?: 0 | 1; sz?: [string, 0 | 1, number?, number?][] };
const products = index.products as Entry[];
const asInput = (e: Entry) => ({ handle: e.h, title: e.t, productType: e.ty, collections: e.k.map((i) => index.collections[i].h as string), tags: e.tg ?? '' });

export interface Piece {
  handle: string;
  title: string;
  slot: Slot;
}
/** Wearable real pieces for a model + slot, in catalogue order (deterministic). */
export function wearable(model: ModelId, slot: Slot, opts: { sizedAndAvailable?: boolean } = {}): Piece[] {
  return products
    .filter((e) => registry.items[e.h]?.slot === slot && layerFile(e.h, model))
    .filter((e) => {
      const c = classify(asInput(e));
      return c.relevant && c.slot === slot && fitsModel(c.audience, model);
    })
    .filter((e) => !opts.sizedAndAvailable || (e.a === 1 && (e.sz ?? []).some((s) => s[1] === 1) && (e.sz ?? []).length > 1))
    .map((e) => ({ handle: e.h, title: e.t, slot }));
}
/** Wearable pieces of a slot that combine (approved slot layers, not whole looks). */
export const slotPieces = (model: ModelId, slot: Slot): Piece[] => wearable(model, slot).filter((p) => registry.items[p.handle]?.looks[model]?.scope === 'slot');
/** The piece a model wears in the canonical photo itself. */
export function shootPiece(model: ModelId): Piece {
  const e = products.find((x) => registry.items[x.h]?.looks[model]?.shoot)!;
  return { handle: e.h, title: e.t, slot: registry.items[e.h]!.slot };
}
/** A stylist-relevant piece never photographed on either model (view-only), for a model. */
export function viewOnly(model: ModelId): Piece {
  const e = products.find((x) => {
    const c = classify(asInput(x));
    return c.relevant && fitsModel(c.audience, model) && !registry.items[x.h] && registry.skip[x.h] === 'not-on-these-models';
  })!;
  const c = classify(asInput(e));
  return { handle: e.h, title: e.t, slot: (c as { slot: Slot }).slot };
}
export const regexEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Choose every option explicitly (first purchasable value of each group, in order). */
export async function chooseAll(scope: Locator, tap = false) {
  const groups = scope.locator('.variants__group');
  for (let i = 0; i < (await groups.count()); i++) {
    const chip = groups.nth(i).locator('.chip:not(.is-out) label').first();
    await (tap ? chip.tap() : chip.click());
  }
}
