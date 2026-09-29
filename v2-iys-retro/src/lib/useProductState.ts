import { useEffect, useMemo, useState } from 'react';
import { useCatalogue, useProductDetail } from './catalogue/load';
import { findVariant, initialSelection } from './variants';
import { addToBag, detailRequest } from '../state/status';

/** Shared product logic (desktop page + mobile gallery). */
export function useProductState(handle: string | undefined) {
  const cat = useCatalogue();
  const indexed = handle ? cat?.byHandle.get(handle) ?? null : null;
  const detail = useProductDetail(handle);
  const p = detail.status === 'ready' ? detail.product : null;
  const [selected, setSelected] = useState<(string | null)[]>([]);
  useEffect(() => {
    if (p) setSelected(initialSelection(p));
  }, [p]);
  const variant = useMemo(() => (p ? findVariant(p, selected) : null), [p, selected]);
  const needsChoice = Boolean(p && p.options.length && !variant);
  const canAdd = Boolean(p && variant && variant.available === true && variant.price !== null);
  const add = () => {
    if (!p || !variant) return false;
    const req = detailRequest(p, variant);
    if (!req) return false;
    addToBag(req);
    return true;
  };
  const select = (oi: number, v: string) => setSelected((s) => s.map((x, i) => (i === oi ? v : x)));
  const missing = Boolean(cat && detail.status === 'missing' && !indexed);
  return { cat, indexed, detail, p, selected, select, variant, needsChoice, canAdd, add, missing };
}
