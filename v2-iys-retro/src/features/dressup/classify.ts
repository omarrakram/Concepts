import type { Product } from '../../lib/catalogue/types';

/**
 * DRESSUP.EXE: the one place that decides what a catalogue product means to
 * the stylist. Pure and deterministic (same product in, same answer out), and
 * self-contained, so the asset script (scripts/build-stylist.mjs) and the app
 * share it. Nothing here guesses from images: only the product's own type,
 * title, tags and collections are read.
 *
 * Three outcomes, decided together with the mapping registry (registry.ts):
 *  - wearable:    stylist-relevant AND has a valid cut-out → shown on the model
 *  - view-only:   stylist-relevant, but no usable garment-only photo (or the
 *                 slot is not visible in the models' framing) → still listed
 *  - non-stylist: not something the adult models can wear (kids sizing,
 *                 home goods, stationery…) → left to MY WARDROBE / the shop
 */

export type Category = 'tops' | 'layers' | 'bottoms' | 'sets' | 'headwear' | 'neckwear' | 'socks' | 'footwear' | 'bags';
export type Slot = 'top' | 'outer' | 'bottom' | 'onepiece' | 'head' | 'neck' | 'socks' | 'feet' | 'bag';
export type Audience = 'men' | 'women' | 'shared';
export type ModelId = 'men' | 'women';

export type ClassifyInput = Pick<Product, 'handle' | 'title' | 'productType' | 'collections' | 'tags'>;

export type NonStylistReason = 'kids' | 'not-worn' | 'unknown-type';
export type Classification =
  | { relevant: false; reason: NonStylistReason }
  | { relevant: true; category: Category; slot: Slot; audience: Audience; evidence: string[] };

/** Which slot each category dresses. */
export const CATEGORY_SLOT: Record<Category, Slot> = {
  tops: 'top',
  layers: 'outer',
  bottoms: 'bottom',
  sets: 'onepiece',
  headwear: 'head',
  neckwear: 'neck',
  socks: 'socks',
  footwear: 'feet',
  bags: 'bag',
};

/** Browser filter labels, in display order. */
export const CATEGORY_LABEL: Record<Category, string> = {
  tops: 'TOPS',
  layers: 'HOODIES & LAYERS',
  bottoms: 'BOTTOMS',
  sets: 'SETS & DRESSES',
  headwear: 'HEADWEAR',
  neckwear: 'SCARVES',
  socks: 'SOCKS',
  footwear: 'FOOTWEAR',
  bags: 'BAGS',
};
export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

/**
 * Official IYS product types → stylist category. Explicit on purpose: a new
 * type falls through to the collection rules below, never to a guess.
 */
const TYPE_CATEGORY: Record<string, Category | 'not-worn'> = {
  // tops (worn under a layer)
  'Printed Oversized Tees': 'tops', 'Printed Regular Tees': 'tops', 'Tops': 'tops', 'Tank Tops': 'tops', 'Long Sleeves': 'tops',
  'Polo T-Shirts': 'tops', 'Jersey': 'tops', 'Short Sleeve Shirt': 'tops', 'Sleeveless Tops': 'tops', 'Oversized Shirts': 'tops',
  'Long Sleeve Tops': 'tops', 'Baby Tees': 'tops', 'Printed Boxy Tee': 'tops', 'Basic Oversized Tees': 'tops',
  'Statement Cropped Tee': 'tops', 'Boyfriend Shirt': 'tops', 'Basic Boxy Tee': 'tops', 'Boxy Shirt': 'tops', 'Sleeveless Tees': 'tops',
  'Basic Regular Tee': 'tops', 'Washed Oversized Tee': 'tops', 'Hawaiian Shirt': 'tops', 'Cropped Shirt': 'tops', 'Fishnet Top': 'tops',
  'Striped Oversized Tees': 'tops', 'Wrinkled Top': 'tops', 'Oxford Shirt': 'tops', 'Neck Tops': 'tops', 'Regular Shirts': 'tops',
  'Knit Top': 'tops', 'Boxy Linen Shirts': 'tops', 'Fitted Shirts': 'tops', 'Waffled Shirt': 'tops', 'Corduroy Shirts': 'tops',
  'Crochet Shirt': 'tops', 'Linen Shirt': 'tops', 'Half Sleeve Tops': 'tops', 'Worker Shirt': 'tops', 'Stitched Cropped T-shirts': 'tops',
  'PJ Long Sleeves': 'tops',
  // layers (hoodies, sweats, jackets: worn over a top)
  'Printed Hoodies': 'layers', 'Acid Washed Hoodies': 'layers', 'Boxy Hoodies': 'layers', 'Plain Hoodies': 'layers',
  'Acid Washed Crewnecks': 'layers', 'Windbreaker': 'layers', 'Crewnecks': 'layers', 'Zip Up Hoodies': 'layers', 'Linen Vest': 'layers',
  'Knit Sweater': 'layers', 'Coats': 'layers', 'Curduroy Jackets': 'layers', 'Pullovers': 'layers', 'Cardigans': 'layers',
  'Quarter Zipper': 'layers', 'Fleece Jacket': 'layers', 'Cropped Hoodies': 'layers', 'Fleece Vest': 'layers', 'Leather Jacket': 'layers',
  'Knit Jacket': 'layers', 'Knit Pullover': 'layers', 'Knit Vest': 'layers', 'Denim Jacket': 'layers', 'Balloon Fit Hoodies': 'layers',
  'Cropped Sweatshirts': 'layers', 'Overshirt Jacket': 'layers', 'Robes': 'layers', 'Floppy Robes': 'layers',
  // bottoms (PJOYS are IYS pyjama pants)
  'Jeans': 'bottoms', 'Pants': 'bottoms', 'Swim Shorts': 'bottoms', 'Pshorts': 'bottoms', 'Swants': 'bottoms', 'Skirt': 'bottoms',
  'Sworts': 'bottoms', 'Jorts': 'bottoms', 'Linen Pants': 'bottoms', 'Leggings': 'bottoms', 'Linen Shorts': 'bottoms', 'Boxer Pants': 'bottoms',
  'Knit Pants': 'bottoms', 'Boxer Shorts': 'bottoms', 'Denim Short': 'bottoms', 'Linen Skirt': 'bottoms', 'Flowy Shorts': 'bottoms',
  'Gabardine Shorts': 'bottoms', 'Cargo Pants': 'bottoms', 'Knit Short': 'bottoms', 'Waffled Short': 'bottoms', 'Leather Pants': 'bottoms',
  'Flare Pants': 'bottoms', 'Cargo Shorts': 'bottoms', 'Cargo Jeans': 'bottoms', 'Flowy Pants': 'bottoms', 'PJOYS': 'bottoms',
  'Fluffy Pjoys': 'bottoms', 'Flowy Wraps': 'bottoms', 'Flowy Wraps Maxi': 'bottoms',
  // sets & dresses (one piece covers top + bottom)
  'Onesies': 'sets', 'Linen Set': 'sets', 'Winter Knit Set': 'sets', 'Knit Set': 'sets', 'Waffled Set': 'sets', 'Crochet Set': 'sets',
  'Crinkled Set': 'sets', 'Beach Sets': 'sets', 'Knit Dress': 'sets', 'Fishnet Dress': 'sets', 'Ruffled Midi Dress': 'sets',
  // accessories that are worn
  'Washed Cap': 'headwear', 'Bucket': 'headwear', 'Headband': 'headwear', 'Crochet Hat': 'headwear', 'Bandana': 'headwear',
  'Scarves': 'neckwear',
  'Neck Socks': 'socks', 'Fluffy Socks': 'socks', 'Short Socks': 'socks',
  'Footwear': 'footwear',
  'Corduroy Bag': 'bags', 'Net Tote Bag': 'bags', 'Slouchy Sling Bag': 'bags', 'Gabardine Tote Bags': 'bags', 'Wool Tote Bag': 'bags',
  'Crossbody Bag': 'bags', 'Leather Bag': 'bags', 'Nylon Tote Bag': 'bags', 'Backpacks': 'bags', 'Denim Totes': 'bags',
  // not worn by a model
  'Beach Towels': 'not-worn', 'Fluffy Blanket': 'not-worn', 'Candle': 'not-worn', 'Puzzle': 'not-worn', 'Stickers': 'not-worn',
  'Pins': 'not-worn', 'Toiletry Bag': 'not-worn', 'Laptop Sleeve': 'not-worn', 'Wallet': 'not-worn',
};

/** Fallback for types the table does not know yet: the storefront's own department collections. */
const COLLECTION_CATEGORY: [string, Category][] = [
  ['all-dresses', 'sets'],
  ['all-tops', 'tops'],
  ['all-bottoms', 'bottoms'],
  ['all-socks', 'socks'],
  ['hats-caps', 'headwear'],
  ['all-bags', 'bags'],
];

const KIDS_TYPE = /\bkids?\b/i;
const KIDS_COLLECTIONS = ['all-kids-products', 'kids'];

export function isKids(p: ClassifyInput): boolean {
  return KIDS_TYPE.test(p.productType ?? '') || p.collections.some((c) => KIDS_COLLECTIONS.includes(c));
}

/** Tags arrive as one space-joined string ("Female outwear tank top Women"). */
const tokens = (tags: string) => new Set(tags.toLowerCase().split(/[\s,]+/).filter(Boolean));

/**
 * MEN / WOMEN / shared, from the product's own evidence, strongest first:
 * the official title ("Male …", "Female …"), then the tags, then the
 * men / women / unisex collections. No evidence → shared (IYS sells most
 * pieces unisex), and the evidence list says so.
 */
export function audienceOf(p: ClassifyInput): { audience: Audience; evidence: string[] } {
  const t = p.title.trim().toLowerCase();
  if (/^(male|men'?s?)\b/.test(t)) return { audience: 'men', evidence: ['title'] };
  if (/^(female|women'?s?)\b/.test(t)) return { audience: 'women', evidence: ['title'] };
  const tg = tokens(p.tags);
  const tagW = tg.has('female') || tg.has('women') || tg.has('woman');
  const tagM = tg.has('male') || tg.has('men') || tg.has('man') || tg.has("men's");
  if (tg.has('unisex') || (tagW && tagM)) return { audience: 'shared', evidence: ['tags'] };
  if (tagW) return { audience: 'women', evidence: ['tags'] };
  if (tagM) return { audience: 'men', evidence: ['tags'] };
  const c = new Set(p.collections);
  if (c.has('unisex') || (c.has('men') && c.has('women'))) return { audience: 'shared', evidence: ['collections'] };
  if (c.has('women') || c.has('bags-for-her') || c.has('womens-sets')) return { audience: 'women', evidence: ['collections'] };
  if (c.has('men')) return { audience: 'men', evidence: ['collections'] };
  return { audience: 'shared', evidence: ['none'] };
}

/** Product types can carry stray whitespace (one ships with a non-breaking space). */
const normType = (t: string | null) => (t ?? '').replace(/\s+/g, ' ').trim();

export function classify(p: ClassifyInput): Classification {
  if (isKids(p)) return { relevant: false, reason: 'kids' };
  const byType = TYPE_CATEGORY[normType(p.productType)];
  if (byType === 'not-worn') return { relevant: false, reason: 'not-worn' };
  const category = byType ?? COLLECTION_CATEGORY.find(([c]) => p.collections.includes(c))?.[1];
  if (!category) return { relevant: false, reason: 'unknown-type' };
  const { audience, evidence } = audienceOf(p);
  return { relevant: true, category, slot: CATEGORY_SLOT[category], audience, evidence: [byType ? 'type' : 'collection', ...evidence] };
}

/** Can this product be shown on (or listed for) that model? */
export const fitsModel = (audience: Audience, model: ModelId) => audience === 'shared' || audience === model;
