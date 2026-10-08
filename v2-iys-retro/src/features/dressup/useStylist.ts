import { useMemo } from 'react';
import registry from '../../data/stylist.generated.json';
import { useCatalogue } from '../../lib/catalogue/load';
import { buildStylist, type Registry, type StylistCatalogue } from './registry';

/** The generated mapping registry (part of the lazy DRESSUP.EXE chunk only). */
export const REGISTRY = registry as unknown as Registry;

/** Catalogue + registry → every product's stylist entry (memoised per catalogue). */
export function useStylist(): StylistCatalogue | null {
  const cat = useCatalogue();
  return useMemo(() => (cat ? buildStylist(cat, REGISTRY) : null), [cat]);
}
