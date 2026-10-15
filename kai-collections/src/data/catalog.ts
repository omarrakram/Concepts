import snapshot from './products.json';

export type Department = 'men' | 'women' | 'kids' | 'unisex';
export type Category = 'swimwear' | 'linen' | 'resort' | 'everyday' | 'knitwear';
export type Kind =
  | 'swim-short'
  | 'kids-swim-short'
  | 'one-piece'
  | 'one-piece-cutout'
  | 'bikini-top'
  | 'bikini-bottom'
  | 'sarong'
  | 'tank'
  | 'dress'
  | 'shirt'
  | 'overshirt'
  | 'pants'
  | 'v-top'
  | 'skirt'
  | 'shorts'
  | 'sweater'
  | 'tee'
  | 'tee-long'
  | 'sweatpants';
export type Stock = 'in-stock' | 'sold-out' | 'unknown';
export type SizesSource = 'product' | 'range' | 'sibling' | 'none';

export interface ProductImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Product {
  slug: string;
  handle: string | null;
  name: string;
  department: Department;
  kind: Kind;
  categories: Category[];
  collections: string[];
  price: number | null;
  compareAt: number | null;
  sizes: string[];
  sizesSource: SizesSource;
  sizesNote?: string;
  material: string | null;
  details: string[];
  fit?: string;
  care?: string;
  stock: Stock;
  colour: ColourKey;
  print?: string;
  pair?: string[];
  sources: string[];
  notes?: string;
  /** Official photography; filled only by `npm run sync` (hotlinked from KAI's CDN, never committed). */
  images: ProductImage[];
  verification: 'search-index' | 'storefront';
}

/**
 * Colour chips. Only the colour named in the product title is used; a print name
 * with no colour in it ("Festival del Mare") falls back to an undyed `sea` tone and
 * the UI says so. These are not KAI's colour references.
 */
export const COLOURS = {
  sea: { label: 'Print (colour not named)', hex: '#C9D3CF', ink: '#173843', named: false },
  yellow: { label: 'Yellow', hex: '#EBC55E', ink: '#3A2E0B', named: true },
  blue: { label: 'Blue', hex: '#3E72A8', ink: '#FFFDF7', named: true },
  pink: { label: 'Pink', hex: '#EBA6B5', ink: '#4A1E29', named: true },
  noir: { label: 'Noir', hex: '#1E2324', ink: '#F5F1E9', named: true },
  purple: { label: 'Purple', hex: '#7D64A8', ink: '#FFFDF7', named: true },
  orange: { label: 'Orange', hex: '#E0824A', ink: '#2E1508', named: true },
  green: { label: 'Green', hex: '#5F8E66', ink: '#FFFDF7', named: true },
  sky: { label: 'Sky', hex: '#9CCBE4', ink: '#16323F', named: true },
  navy: { label: 'Navy', hex: '#1F2E4C', ink: '#F5F1E9', named: true },
  black: { label: 'Black', hex: '#1A1B1C', ink: '#F5F1E9', named: true },
  fuchsia: { label: 'Fuchsia', hex: '#C42A6E', ink: '#FFFDF7', named: true },
  cobalt: { label: 'Cobalt blue', hex: '#2150B5', ink: '#FFFDF7', named: true },
  pear: { label: 'Pear', hex: '#C8CF6E', ink: '#2D300C', named: true },
  ivory: { label: 'Ivory', hex: '#F2EADB', ink: '#3A3328', named: true },
  olive: { label: 'Olive', hex: '#6F6F3F', ink: '#F5F1E9', named: true },
  matcha: { label: 'Matcha', hex: '#9EB37E', ink: '#1F2A12', named: true },
  sapphire: { label: 'Sapphire', hex: '#1F4D8A', ink: '#FFFDF7', named: true },
  brown: { label: 'Brown', hex: '#7A5235', ink: '#F5F1E9', named: true },
  beige: { label: 'Beige', hex: '#D9C6A5', ink: '#3A2F1F', named: true },
  white: { label: 'White', hex: '#F7F4EC', ink: '#2A2A28', named: true },
  cream: { label: 'Cream', hex: '#EEE3CB', ink: '#3A3020', named: true },
  grey: { label: 'Grey', hex: '#9D9E9A', ink: '#1F2020', named: true },
} as const;
export type ColourKey = keyof typeof COLOURS;

type Raw = Omit<Product, 'images' | 'verification'> & { images?: ProductImage[] };

/** Optional direct storefront snapshot written by `npm run sync` (src/data/live/catalog.json). */
const live = import.meta.glob<{ default: { checkedAt: string; products: Record<string, Partial<Product>> } }>(
  './live/*.json',
  { eager: true },
);
const liveSnap = Object.values(live)[0]?.default;

export const SNAPSHOT = {
  checkedAt: liveSnap?.checkedAt ?? snapshot.snapshot.checkedAt,
  method: liveSnap ? ('storefront' as const) : ('search-index' as const),
  note: snapshot.snapshot.note,
};

export const PRODUCTS: Product[] = (snapshot.products as Raw[]).map((p) => {
  const fromLive = p.handle ? liveSnap?.products[p.handle] : undefined;
  const base: Product = { ...p, images: p.images ?? [], verification: 'search-index' };
  return fromLive ? { ...base, ...fromLive, slug: p.slug, verification: 'storefront' } : base;
});

export const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));
export const getProduct = (slug: string | undefined) => (slug ? BY_SLUG.get(slug) : undefined);

export const officialUrl = (p: Product) =>
  p.handle
    ? `https://kaicollections.com/products/${p.handle}`
    : `https://kaicollections.com/search?q=${encodeURIComponent(p.name)}&type=product`;

export const onSale = (p: Product) => p.price != null && p.compareAt != null && p.compareAt > p.price;
export const discount = (p: Product) => (onSale(p) ? Math.round((1 - p.price! / p.compareAt!) * 100) : 0);

export const formatEGP = (n: number) => `EGP ${n.toLocaleString('en-US')}`;

export const KIND_LABEL: Record<Kind, string> = {
  'swim-short': 'Swim shorts',
  'kids-swim-short': 'Kids swim shorts',
  'one-piece': 'One piece',
  'one-piece-cutout': 'One piece',
  'bikini-top': 'Bikini top',
  'bikini-bottom': 'Bikini bottom',
  sarong: 'Sarong',
  tank: 'Tank top',
  dress: 'Dress',
  shirt: 'Linen shirt',
  overshirt: 'Overshirt',
  pants: 'Linen pants',
  'v-top': 'Linen top',
  skirt: 'Linen skirt',
  shorts: 'Linen shorts',
  sweater: 'Knitwear',
  tee: 'T-shirt',
  'tee-long': 'Long sleeve',
  sweatpants: 'Sweatpants',
};

export const DEPARTMENT_LABEL: Record<Department, string> = {
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  unisex: 'Unisex',
};

/** Shop views (route `/shop/:view`). `test` decides membership. */
export interface ShopView {
  id: string;
  title: string;
  kicker: string;
  intro: string;
  test: (p: Product) => boolean;
}

export const SHOP_VIEWS: ShopView[] = [
  {
    id: 'all',
    title: 'The Collection',
    kicker: 'Everything',
    intro: 'Swimwear, linen, resort pieces and everyday cotton — for men, women and children.',
    test: () => true,
  },
  {
    id: 'men',
    title: 'Men',
    kicker: 'Department',
    intro: 'Where KAI began in 2018: tailored swim shorts. Now with linen, overshirts and knitwear.',
    test: (p) => p.department === 'men' || p.department === 'unisex',
  },
  {
    id: 'women',
    title: 'Women',
    kicker: 'Department',
    intro: 'One pieces, bikini separates, washed linen and pieces for the hours after the beach.',
    test: (p) => p.department === 'women' || p.department === 'unisex',
  },
  {
    id: 'kids',
    title: 'Kids',
    kicker: 'Department',
    intro: 'Mini swim shorts — several made to match their grown-up prints in KAI’s Like Father, Like Son line.',
    test: (p) => p.department === 'kids',
  },
  {
    id: 'swimwear',
    title: 'Swim',
    kicker: 'Category',
    intro: 'Swim shorts treated against chlorine, salt water and UV; one pieces in nylon–elastane.',
    test: (p) => p.categories.includes('swimwear'),
  },
  {
    id: 'linen',
    title: 'Linen & Resort',
    kicker: 'Category',
    intro: 'Pure and washed linen in relaxed cuts — shirts, pants, shorts, tops and overshirts.',
    test: (p) => p.categories.includes('linen') || p.categories.includes('resort'),
  },
  {
    id: 'resort',
    title: 'Resort',
    kicker: 'Category',
    intro: 'Cover-ups, sarongs and the pieces worn between the water and dinner.',
    test: (p) => p.categories.includes('resort'),
  },
  {
    id: 'everyday',
    title: 'Everyday',
    kicker: 'Category',
    intro: 'Heavyweight cotton, French terry and knitwear for the city and the cooler months.',
    test: (p) => p.categories.includes('everyday') || p.categories.includes('knitwear'),
  },
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    kicker: 'Edit',
    intro: 'The newest pieces surfaced on KAI’s homepage and SS26 collections at the time of the snapshot.',
    test: (p) => p.collections.includes('new-arrivals') || p.collections.includes('ss26'),
  },
  {
    id: 'sale',
    title: 'Sale',
    kicker: 'Last chance',
    intro: 'Pieces that carried a reduced price in the snapshot. Prices are dated; confirm on KAI.',
    test: (p) => onSale(p),
  },
];
export const VIEW_BY_ID = new Map(SHOP_VIEWS.map((v) => [v.id, v]));

/** Matching sets. KAI sells every piece separately; a set is a pairing of real products. */
export interface MatchSet {
  id: string;
  title: string;
  basis: string;
  items: string[];
}

export const SETS: MatchSet[] = [
  {
    id: 'sky-penguins',
    title: 'Sky Penguins, father & son',
    basis: 'KAI’s Like Father, Like Son matching line',
    items: ['sky-penguins-swim-shorts', 'mini-sky-penguins'],
  },
  {
    id: 'funky-fish',
    title: 'Funky Fish, father & son',
    basis: 'KAI’s Like Father, Like Son matching line',
    items: ['funky-fish-swim-shorts', 'mini-funky-fish'],
  },
  {
    id: 'yellow-zebra',
    title: 'Yellow Zebra, father & son',
    basis: 'Adult and Mini versions of the same print, both listed by KAI',
    items: ['yellow-zebra-swim-shorts', 'mini-yellow-zebra-swim-shorts'],
  },
  {
    id: 'festival-del-mare',
    title: 'Festival del Mare',
    basis: 'Swim shorts and sarong in the same KAI print',
    items: ['festival-del-mare-swim-shorts', 'festival-del-mare-sarong'],
  },
  {
    id: 'beige-linen-women',
    title: 'Beige washed linen, top & pants',
    basis: 'Co-ord of separates — KAI lists linen sets among its categories',
    items: ['women-s-beige-linen-v-neck-top', 'womens-beige-linen-pants'],
  },
  {
    id: 'beige-linen-skirt',
    title: 'Beige linen, top & skirt',
    basis: 'Co-ord of separates from KAI’s New Arrivals',
    items: ['women-s-beige-linen-v-neck-top', 'women-beige-linen-skirt'],
  },
  {
    id: 'white-linen-shorts',
    title: 'White linen, top & shorts',
    basis: 'Co-ord of separates',
    items: ['women-s-white-linen-v-neck-top', 'womens-white-linen-shorts'],
  },
  {
    id: 'men-linen',
    title: 'White shirt, navy linen pants',
    basis: 'KAI suggests pairing its linen pants with its linen shirts',
    items: ['white-linen-shirt', 'navy-linen-pants'],
  },
  {
    id: 'men-linen-semi',
    title: 'Semi-collar shirt, beige pants',
    basis: 'KAI suggests pairing its linen pants with its linen shirts',
    items: ['white-semi-collar-shirt', 'beige-linen-pants'],
  },
];

export function relatedTo(p: Product, n = 4): Product[] {
  const paired = (p.pair ?? []).map((s) => BY_SLUG.get(s)).filter(Boolean) as Product[];
  const same = PRODUCTS.filter(
    (q) => q.slug !== p.slug && !paired.includes(q) && q.department === p.department && q.kind === p.kind,
  );
  const cat = PRODUCTS.filter(
    (q) =>
      q.slug !== p.slug &&
      !paired.includes(q) &&
      !same.includes(q) &&
      q.categories.some((c) => p.categories.includes(c)),
  );
  return [...paired, ...same, ...cat].slice(0, n);
}

/** Lightweight ranked search over name, print, kind, colour, department and material. */
export function search(query: string, limit = 8): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  const scored = PRODUCTS.map((p) => {
    const hay = [
      p.name,
      p.print ?? '',
      KIND_LABEL[p.kind],
      COLOURS[p.colour].label,
      DEPARTMENT_LABEL[p.department],
      p.material ?? '',
      p.categories.join(' '),
    ]
      .join(' ')
      .toLowerCase();
    let s = 0;
    for (const t of terms) {
      if (!hay.includes(t)) return { p, s: -1 };
      if (p.name.toLowerCase().startsWith(t)) s += 6;
      if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(p.name.toLowerCase())) s += 4;
      s += 1;
    }
    return { p, s };
  });
  return scored
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}

export const SEARCH_SUGGESTIONS = ['Swim shorts', 'One piece', 'Linen', 'Beige', 'Mini', 'Zebra', 'Overshirt', 'Knit'];
