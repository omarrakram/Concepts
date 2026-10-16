import { BY_SLUG, type Product } from './catalog';

/**
 * The Material Edit: each cloth KAI uses, inspected through KAI's own close-up photograph of a
 * product made from it. The facts shown are that same product's composition and details, quoted
 * from its KAI page — the photograph and the facts always come from one product.
 */
export interface Material {
  key: string;
  name: string;
  kicker: string;
  /** the product whose close-up and facts are shown */
  product: string;
  /** which of that product's photographs is the close-up */
  image: number;
  /** more pieces in the same cloth */
  also: string[];
}

export const MATERIALS: Material[] = [
  { key: 'linen', name: 'Washed linen', kicker: 'Shirts · pants · tops', product: 'white-short-sleeve-linen-shirt', image: 5, also: ['women-s-white-linen-v-neck-top', 'womens-white-linen-pants', 'sky-blue-cuban-linen-shirt'] },
  { key: 'swim', name: 'Swim polyester', kicker: 'Swim shorts', product: 'festival-del-mare-swim-shorts', image: 7, also: ['yellow-zebra-swim-shorts', 'pink-polar-swim-shorts', 'mini-pink-polar-swim-shorts'] },
  { key: 'recycled', name: 'Recycled swim jersey', kicker: 'One pieces', product: 'black-kaia-one-piece', image: 5, also: ['olive-kaia-one-piece', 'mocha-kaia-one-piece', 'matcha-perla-one-piece'] },
  { key: 'crinkle', name: 'Crinkle linen', kicker: 'Linen–cotton', product: 'brown-linen-crinkle-cuban-shirt', image: 4, also: ['brown-linen-crinkle-shorts', 'olive-linen-crinkle-cuban-shirt', 'womens-brown-linen-crinkle-shirt'] },
  { key: 'tencel', name: 'Tencel–cotton', kicker: 'Pants', product: 'olive-tencel-pants', image: 3, also: ['brown-tencel-pants', 'charcoal-tencel-pants', 'black-tencel-pants'] },
  { key: 'terry', name: 'Terry towel', kicker: 'Polos · tees · shorts', product: 'navy-terry-towel-zip-polo', image: 1, also: ['navy-terry-towel-t-shirt', 'taupe-terry-towel-zip-polo', 'black-terry-towel-zip-polo'] },
  { key: 'knit', name: 'Cotton knit', kicker: 'Polos · crochet', product: 'off-white-heavy-knit-polo', image: 1, also: ['beige-croshet-knit-polo', 'womens-off-white-croshet-poncho', 'navy-capri-knit-t-shirt'] },
];

/** composition + up to three construction details, verbatim from the product's KAI page */
export function factsFor(p: Product) {
  return [p.material, ...p.details.filter((d) => !/^(relaxed|slim|oversized|regular) fit$/i.test(d)).slice(0, 3)].filter(Boolean) as string[];
}

export const materialProducts = (m: Material) =>
  [m.product, ...m.also].map((s) => BY_SLUG.get(s)).filter((p): p is Product => !!p && p.stock !== 'sold-out');
