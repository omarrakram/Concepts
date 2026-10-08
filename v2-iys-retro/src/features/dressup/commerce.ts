import { useEffect, useMemo, useState } from 'react';
import { useProductDetail } from '../../lib/catalogue/load';
import type { ProductDetail } from '../../lib/catalogue/types';
import { findVariant } from '../../lib/variants';
import { clampQty } from '../../state/cart';
import { addToBag, detailRequest } from '../../state/status';

/**
 * DRESSUP.EXE → MY BAG. The stylist never invents commerce: variants, prices
 * and availability come from the product's own detail record, and adding goes
 * through the one existing cart (addToBag → useCart), exactly like the product
 * page. Trying a piece on never touches the bag.
 *
 * NEVER PRESELECT A SIZE: the size option always starts empty, even when a
 * product has a single size. Other single-value options (one colour) are
 * filled in, since there is nothing to choose.
 */
export function stylistSelection(p: ProductDetail): (string | null)[] {
  return p.options.map((o) => (o.name !== p.sizeOption && o.values.length === 1 ? o.values[0]! : null));
}

export type AddState = 'choose' | 'sold-out' | 'unavailable' | 'ready';
/** What ADD TO BAG can do right now (pure). */
export function addState(p: ProductDetail, selected: (string | null)[]): AddState {
  const v = findVariant(p, selected);
  if (!v) return p.options.length ? 'choose' : 'unavailable';
  if (v.available === false) return 'sold-out';
  if (v.available !== true || v.price === null) return 'unavailable';
  return 'ready';
}

/** The first option still waiting for a choice (for the button label). */
export const missingOption = (p: ProductDetail, selected: (string | null)[]) => p.options.find((_, i) => selected[i] === null)?.name ?? null;

/** Detail shard is fetched only when a piece's card is opened (never preloaded). */
export function useStylistProduct(handle: string | null) {
  const detail = useProductDetail(handle ?? undefined);
  const p = detail.status === 'ready' ? detail.product : null;
  const [selected, setSelected] = useState<(string | null)[]>([]);
  const [qty, setQtyState] = useState(1);
  useEffect(() => {
    if (p) {
      setSelected(stylistSelection(p));
      setQtyState(1);
    }
  }, [p]);
  const variant = useMemo(() => (p ? findVariant(p, selected) : null), [p, selected]);
  const state: AddState | null = p ? addState(p, selected) : null;
  const select = (oi: number, v: string) => setSelected((s) => s.map((x, i) => (i === oi ? v : x)));
  const add = () => {
    if (!p || !variant || state !== 'ready') return false;
    const req = detailRequest(p, variant);
    if (!req) return false;
    addToBag(req, qty);
    return true;
  };
  return { detail, p, selected, select, variant, state, qty, setQty: (n: number) => setQtyState(clampQty(n)), add };
}
