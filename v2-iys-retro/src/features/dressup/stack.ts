import type { ModelId, Slot } from './classify';
import { BODY, type Outfit } from './outfit';
import { layerFor, validBase, type Box, type Layer, type LookLayer, type ModelLayers, type StylistCatalogue } from './registry';

/**
 * What one model's frame draws, back to front, for an outfit, over the
 * canonical photo. Pure, so the slot rules are unit-tested.
 *
 * A whole look worn (one official photo's full outfit): that photo's body,
 * then the canonical head. Otherwise slot pieces, over the canonical
 * photo's empty room:
 *
 *   room → bottom (the chosen one, else the canonical trousers)
 *   → top (the chosen one, else the canonical upper body)
 *   → or, with a layer on: the layer (a whole upper body, its own arms and
 *     hands), the chosen top showing only through its open front (clipped
 *     to that opening); under a closed layer the top is worn but hidden
 *   → the canonical head.
 *
 * A set replaces both the top and the bottom. Nothing chosen (or only the
 * pieces the model wears in the canonical photo) → null: the photo as it is.
 */
export interface DrawLayer {
  key: string;
  file: string;
  box: Box;
  /** What the layer stands for. */
  part: 'room' | 'base' | Slot | 'head';
  handle?: string;
  /** Show only where this full-frame mask is opaque (a top seen through an open layer's front). */
  clip?: Layer;
}

export interface Stack {
  layers: DrawLayer[];
  /** A chosen top that is worn but hidden under a closed layer. */
  coveredTop: boolean;
}

export function stackFor(s: StylistCatalogue, model: ModelId, outfit: Outfit, base: ModelLayers | undefined): Stack | null {
  const pick = (slot: Slot) => {
    const h = outfit[slot];
    const l = h ? layerFor(s.byHandle.get(h), model) : null;
    return l ? { handle: h!, l } : null;
  };
  // a whole look: its photo's body, worn alone (wearPiece keeps it alone), and the canonical head
  for (const slot of BODY) {
    const w = pick(slot);
    if (w && !('shoot' in w.l) && w.l.scope === 'whole') {
      const head: DrawLayer[] = base && base.head ? [{ key: 'head', file: base.headFile, box: base.head, part: 'head' }] : [];
      return { layers: [{ key: `${slot}:${w.handle}`, file: w.l.file, box: w.l.box, part: slot, handle: w.handle }, ...head], coveredTop: false };
    }
  }
  if (!validBase(base)) return null;
  const top = pick('top'), bottom = pick('bottom'), outer = pick('outer'), set = pick('onepiece');
  if (![top, bottom, outer, set].some((x) => x && !('shoot' in x.l))) return null;
  const layers: DrawLayer[] = [{ key: 'room', file: base.room.file, box: base.room.box, part: 'room' }];
  const add = (key: string, l: Layer, part: DrawLayer['part'], handle?: string, clip?: Layer) => layers.push({ key, file: l.file, box: l.box, part, handle, ...(clip ? { clip } : {}) });
  const own = (x: ReturnType<typeof pick>): LookLayer | null => (x && !('shoot' in x.l) ? x.l : null);
  const setL = own(set);
  const topL = setL ? null : own(top);
  // a shoot piece chosen = the model's own canonical layer (the canonical photo is that piece)
  const outerL: Pick<LookLayer, 'file' | 'box' | 'inner'> | null = outer ? (own(outer) ?? { file: base.upper.file, box: base.upper.box, ...(base.inner ? { inner: base.inner } : {}) }) : null;
  if (setL) add(`onepiece:${set!.handle}`, setL, 'onepiece', set!.handle);
  else {
    const b = own(bottom);
    if (b) add(`bottom:${bottom!.handle}`, b, 'bottom', bottom!.handle);
    else add('base:lower', base.lower, 'base');
  }
  // a layer is a whole upper body (its own arms and hands): under it the top only shows through an
  // open front, never in full (its arms would show beside the layer's)
  if (!outerL) {
    if (topL) add(`top:${top!.handle}`, topL, 'top', top!.handle);
    else if (!setL) add('base:upper', base.upper, 'base');
  }
  let coveredTop = false;
  if (outerL) {
    add(`outer:${outer!.handle}`, outerL, 'outer', outer!.handle);
    if (topL) {
      if (outerL.inner) add(`top:${top!.handle}:front`, topL, 'top', top!.handle, outerL.inner);
      else coveredTop = true;
    }
  }
  layers.push({ key: 'head', file: base.headFile, box: base.head, part: 'head' });
  return { layers, coveredTop };
}
