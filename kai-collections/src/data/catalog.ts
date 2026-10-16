import live from './catalog.live.json';
import { CAMPAIGN_BY_ID, MEDIA_ON, fileOf } from './media';

/**
 * The catalog is KAI's live SS26 assortment, read directly from kaicollections.com's public
 * storefront by `npm run sync` (scripts/sync-catalog.mjs) into catalog.live.json.
 * Nothing here is invented: names, prices, sizes, availability, composition and photography
 * all come from that snapshot. Derived fields (kind, colour, sets) are computed from KAI's own
 * product titles and collections, and labelled as such in the UI.
 */

export type Department = 'men' | 'women' | 'kids';
export type Category =
  | 'swimwear'
  | 'linen'
  | 'knitwear'
  | 'shirts'
  | 'tees'
  | 'bottoms'
  | 'tops'
  | 'skirts-dresses'
  | 'cover-ups'
  | 'accessories'
  | 'sets';
export type Kind =
  | 'swim-short'
  | 'kids-swim-short'
  | 'one-piece'
  | 'bikini-top'
  | 'bikini-bottom'
  | 'sarong'
  | 'scarf'
  | 'cover-up'
  | 'dress'
  | 'skirt'
  | 'overshirt'
  | 'cuban-shirt'
  | 'polo'
  | 'tee-long'
  | 'tee'
  | 'shirt'
  | 'tank'
  | 'sweatpants'
  | 'pants'
  | 'shorts'
  | 'knit'
  | 'top'
  | 'hat'
  | 'other';
export type Stock = 'in-stock' | 'sold-out' | 'unknown';

export interface Size {
  label: string;
  available: boolean;
  /** only when this size is priced differently from the product */
  price?: number;
}

export interface ProductImage {
  /** absolute URL on KAI's CDN */
  src: string;
  w: number | null;
  h: number | null;
  alt: string;
  /** square packshot on a flat backdrop (this colour): shown whole, letterboxed in it — see scripts/photo-backdrops.mjs */
  bg?: string;
}

export interface Product {
  slug: string;
  handle: string;
  name: string;
  department: Department;
  /** KAI's own product type label */
  type: string | null;
  kind: Kind;
  /** print / style name shared by a family ("Yellow Zebra", "Black Maya") */
  family: string | null;
  /** colour word named in the title, or null for a named print */
  colour: string | null;
  categories: Category[];
  isNew: boolean;
  /** position in KAI's department collection */
  order: number;
  /** position in KAI's Best Sellers collection (Featured sort), when listed there */
  rank: number | null;
  price: number | null;
  compareAt: number | null;
  sizes: Size[];
  stock: Stock;
  /** composition as written on KAI's product page */
  material: string | null;
  /** fabric family named in the title (used only when KAI gives no composition) */
  fabric: string | null;
  details: string[];
  fit: string | null;
  model: string | null;
  care: string | null;
  published: string | null;
  images: ProductImage[];
  /** other pieces it is sold alongside (sets, matching prints) */
  pair: string[];
}

type Raw = (typeof live.products)[number];

export const SNAPSHOT = {
  checkedAt: live.checkedAt,
  origin: live.origin,
  method: 'storefront' as const,
  counts: live.counts,
};

const DEPTS: Department[] = ['men', 'women', 'kids'];

export const KIND_LABEL: Record<Kind, string> = {
  'swim-short': 'Swim shorts',
  'kids-swim-short': 'Mini swim shorts',
  'one-piece': 'One piece',
  'bikini-top': 'Bikini top',
  'bikini-bottom': 'Bikini bottom',
  sarong: 'Sarong',
  scarf: 'Head scarf',
  'cover-up': 'Cover-up',
  dress: 'Dress',
  skirt: 'Skirt',
  overshirt: 'Overshirt',
  'cuban-shirt': 'Cuban shirt',
  polo: 'Polo',
  'tee-long': 'Long sleeve',
  tee: 'T-shirt',
  shirt: 'Shirt',
  tank: 'Tank top',
  sweatpants: 'Sweatpants',
  pants: 'Pants',
  shorts: 'Shorts',
  knit: 'Knitwear',
  top: 'Top',
  hat: 'Hat',
  other: 'Piece',
};

export const DEPARTMENT_LABEL: Record<Department, string> = { men: 'Men', women: 'Women', kids: 'Kids' };

export const CATEGORY_LABEL: Record<Category, string> = {
  swimwear: 'Swim',
  linen: 'Linen',
  knitwear: 'Knitwear',
  shirts: 'Shirts',
  tees: 'T-shirts',
  bottoms: 'Bottoms',
  tops: 'Tops',
  'skirts-dresses': 'Skirts & dresses',
  'cover-ups': 'Cover-ups',
  accessories: 'Accessories',
  sets: 'Sets',
};

/** "Linen Cuban shirt", "Tencel pants", "Swim shorts" — the line shown under a product name. */
export function typeLine(p: Pick<Product, 'kind' | 'fabric'>) {
  const k = KIND_LABEL[p.kind];
  return p.fabric && !k.toLowerCase().includes(p.fabric.toLowerCase()) ? `${p.fabric} ${k.toLowerCase()}` : k;
}

/**
 * Colour chips for the colour named in a title. The hex values are the concept's approximations,
 * not KAI's colour references; photography is always the reference.
 */
export const COLOURS: Record<string, { label: string; hex: string }> = {
  black: { label: 'Black', hex: '#1C1C1C' },
  white: { label: 'White', hex: '#F7F4EC' },
  'off-white': { label: 'Off-white', hex: '#EFE9DC' },
  ivory: { label: 'Ivory', hex: '#F2EADB' },
  cream: { label: 'Cream', hex: '#EEE3CB' },
  stone: { label: 'Stone', hex: '#CFC6B6' },
  sand: { label: 'Sand', hex: '#D9C6A5' },
  beige: { label: 'Beige', hex: '#D9C6A5' },
  taupe: { label: 'Taupe', hex: '#A8968A' },
  'dusty-taupe': { label: 'Dusty taupe', hex: '#B3A193' },
  mocha: { label: 'Mocha', hex: '#7A5B48' },
  'dark-mocha': { label: 'Dark mocha', hex: '#5A4032' },
  espresso: { label: 'Espresso', hex: '#4A3326' },
  brown: { label: 'Brown', hex: '#6E4A34' },
  cumin: { label: 'Cumin', hex: '#A87A3E' },
  khaki: { label: 'Khaki', hex: '#A79B76' },
  butter: { label: 'Butter', hex: '#F1DE9C' },
  'baby-yellow': { label: 'Baby yellow', hex: '#F3E3A0' },
  yellow: { label: 'Yellow', hex: '#EBC55E' },
  olive: { label: 'Olive', hex: '#6F6F3F' },
  matcha: { label: 'Matcha', hex: '#9EB37E' },
  pistachio: { label: 'Pistachio', hex: '#B8C99A' },
  sage: { label: 'Sage', hex: '#9CAF94' },
  'sage-green': { label: 'Sage green', hex: '#9CAF94' },
  'apple-green': { label: 'Apple green', hex: '#A9C66A' },
  apple: { label: 'Apple', hex: '#A9C66A' },
  green: { label: 'Green', hex: '#5F8E66' },
  mint: { label: 'Mint', hex: '#BFE0CF' },
  peppermint: { label: 'Peppermint', hex: '#C6E5D8' },
  teal: { label: 'Teal', hex: '#2F6F73' },
  navy: { label: 'Navy', hex: '#1F2E4C' },
  blue: { label: 'Blue', hex: '#3E72A8' },
  'baby-blue': { label: 'Baby blue', hex: '#BBD6EC' },
  'sky-blue': { label: 'Sky blue', hex: '#9CCBE4' },
  sky: { label: 'Sky', hex: '#9CCBE4' },
  'capri-blue': { label: 'Capri blue', hex: '#7FA7D6' },
  'cobalt-blue': { label: 'Cobalt blue', hex: '#2150B5' },
  'sapphire-blue': { label: 'Sapphire blue', hex: '#1F4D8A' },
  sapphire: { label: 'Sapphire', hex: '#1F4D8A' },
  pink: { label: 'Pink', hex: '#EBA6B5' },
  'baby-pink': { label: 'Baby pink', hex: '#F2C9CF' },
  fuchsia: { label: 'Fuchsia', hex: '#C42A6E' },
  coral: { label: 'Coral', hex: '#E4846B' },
  rust: { label: 'Rust', hex: '#A4532F' },
  'dusty-cherry': { label: 'Dusty cherry', hex: '#9C4F57' },
  plum: { label: 'Plum', hex: '#5E3446' },
  purple: { label: 'Purple', hex: '#7D64A8' },
  orange: { label: 'Orange', hex: '#E0824A' },
  grey: { label: 'Grey', hex: '#9D9E9A' },
  'dusty-grey': { label: 'Dusty grey', hex: '#A3A39F' },
  'dove-grey': { label: 'Dove grey', hex: '#B7B5B0' },
  charcoal: { label: 'Charcoal', hex: '#3A3B3C' },
  pear: { label: 'Pear', hex: '#C8CF6E' },
};
const PRINT = { label: 'Print', hex: '#C9D3CF' };
export const colourOf = (p: Pick<Product, 'colour'>) => (p.colour ? COLOURS[p.colour] ?? { label: p.colour, hex: '#BBB' } : PRINT);

function build(r: Raw): Product {
  const dept = (DEPTS.includes(r.dept as Department) ? r.dept : 'women') as Department;
  const n = r.images.length;
  return {
    slug: r.handle,
    handle: r.handle,
    name: r.name,
    department: dept,
    type: r.type,
    kind: r.kind as Kind,
    family: r.family,
    colour: r.colour,
    categories: r.groups as Category[],
    isNew: (r.edits as string[]).includes('new'),
    order: r.order,
    rank: r.rank,
    price: r.price,
    compareAt: r.compareAt,
    sizes: r.sizes as Size[],
    stock: r.stock as Stock,
    material: r.material,
    fabric: r.fabric,
    details: r.details,
    fit: r.fit,
    model: r.model,
    care: r.care,
    published: r.published,
    images: MEDIA_ON
      ? r.images.map((im, i) => ({
          src: /^https?:/.test(im.src) ? im.src : live.cdn + im.src,
          w: im.w,
          h: im.h,
          alt: `${r.name} — KAI photograph ${i + 1} of ${n}`,
          ...('bg' in im && im.bg ? { bg: im.bg } : {}),
        }))
      : [],
    pair: [],
  };
}

export const PRODUCTS: Product[] = live.products.map(build);
export const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));
export const getProduct = (slug: string | undefined) => (slug ? BY_SLUG.get(slug) : undefined);

export const officialUrl = (p: Product) => `${live.origin}/products/${p.handle}`;
export const onSale = (p: Product) => p.price != null && p.compareAt != null && p.compareAt > p.price;
export const discount = (p: Product) => (onSale(p) ? Math.round((1 - p.price! / p.compareAt!) * 100) : 0);
export const formatEGP = (n: number) => `EGP ${n.toLocaleString('en-US')}`;
export const availableSizes = (p: Product) => p.sizes.filter((s) => s.available);
/** a piece with one "One size" variant needs no size choice */
export const needsSize = (p: Product) => p.sizes.length > 1 || (p.sizes.length === 1 && !/^one size$/i.test(p.sizes[0].label));

/** KAI writes sizes several ways ("S (30-32)", "Small (30)", "X-Small", "2 Years", "4Y"); this is the shared key. */
export function sizeKey(label: string) {
  const t = label.split('(')[0].trim().toLowerCase();
  const kid = t.match(/^(\d+)\s*(y|years?|yrs?)$/);
  if (kid) return `${kid[1]}Y`;
  const map: Record<string, string> = {
    'xx-small': 'XXS', xxs: 'XXS', 'x-small': 'XS', xs: 'XS', small: 'S', s: 'S', medium: 'M', m: 'M', large: 'L', l: 'L',
    'x-large': 'XL', xl: 'XL', 'xx-large': '2XL', '2x-large': '2XL', xxl: '2XL', '2xl': '2XL', '3xl': '3XL', 'xxx-large': '3XL', '3x-large': '3XL',
  };
  return map[t] ?? label.trim();
}
/* ── Matching sets ──────────────────────────────────────────────────────────── */

export interface MatchSet {
  id: string;
  title: string;
  kind: 'family' | 'bikini' | 'coord';
  basis: string;
  items: string[];
}

const GARMENT = /\b(cuban|long sleeve|short sleeve|zip polo|polo|t-shirt|shirt|shorts?|pants?|relaxed|top|skirt|v-neck|wide leg|over ?shirt|jacket|strapless|cape|poncho|dress|knitted|sarong|wrap)\b/gi;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function buildSets(): MatchSet[] {
  const out: MatchSet[] = [];
  // 1 · Like father, like son: KAI cuts the same print for men and as a Mini (plus a sarong, sometimes)
  const adults = PRODUCTS.filter((p) => p.kind === 'swim-short' && p.family);
  for (const a of adults) {
    const fam = a.family!.toLowerCase();
    const mini = PRODUCTS.filter((p) => p.kind === 'kids-swim-short' && p.family?.toLowerCase() === fam);
    const sarong = PRODUCTS.filter((p) => p.kind === 'sarong' && p.name.toLowerCase().replace(/\s*sarong.*$/, '') === fam);
    if (mini.length || sarong.length)
      out.push({
        id: `print-${slugify(a.family!)}`,
        title: `${a.family}${mini.length ? ', father & son' : ', his & hers'}`,
        kind: 'family',
        basis: mini.length
          ? 'The same KAI print, cut for him and as a Mini — both in KAI’s SS26 collections.'
          : 'Swim shorts and sarong in the same KAI print.',
        items: [a, ...mini, ...sarong].map((p) => p.slug),
      });
  }
  // 2 · Bikinis: KAI sells top and bottom separately, in the same style and colour
  const tops = PRODUCTS.filter((p) => p.kind === 'bikini-top' && p.family);
  for (const t of tops) {
    const b = PRODUCTS.find((p) => p.kind === 'bikini-bottom' && p.family === t.family);
    if (b)
      out.push({
        id: `bikini-${slugify(t.family!)}`,
        title: `${t.family} bikini`,
        kind: 'bikini',
        basis: 'Top and bottom, sold separately by KAI in the same style and colour.',
        items: [t.slug, b.slug],
      });
  }
  // 3 · Co-ords: pieces KAI lists in its Matching Sets collections, grouped by colour and fabric line
  const groups = new Map<string, Product[]>();
  for (const p of PRODUCTS.filter((x) => x.categories.includes('sets'))) {
    const core = p.name
      .toLowerCase()
      .replace(/^(women’s|men’s|women|womens|men)\s+/, '')
      .replace(GARMENT, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const key = `${p.department}|${core}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    const [dept, core] = key.split('|');
    const order = (p: Product) => (['top', 'shirt', 'cuban-shirt', 'tee', 'polo', 'cover-up', 'tee-long', 'overshirt'].includes(p.kind) ? 0 : 1);
    out.push({
      id: `coord-${dept}-${slugify(core)}`,
      title: core.replace(/(^|\s)\S/g, (c) => c.toUpperCase()),
      kind: 'coord',
      basis: `Listed in KAI’s ${dept === 'men' ? 'Men' : 'Women'} › Matching Sets collection — same colour and fabric.`,
      items: list.sort((a, b) => order(a) - order(b) || a.order - b.order).map((p) => p.slug),
    });
  }
  return out;
}

const SET_ORDER: Record<MatchSet['kind'], number> = { coord: 0, family: 1, bikini: 2 };
/** Co-ords first (KAI's own Matching Sets), then father & son prints, then bikinis. */
export const SETS: MatchSet[] = buildSets().sort((a, b) => SET_ORDER[a.kind] - SET_ORDER[b.kind]);
for (const s of SETS) for (const slug of s.items) {
  const p = BY_SLUG.get(slug)!;
  p.pair = [...new Set([...p.pair, ...s.items.filter((x) => x !== slug)])];
}

/* ── Shop views ─────────────────────────────────────────────────────────────── */

export interface ShopView {
  id: string;
  title: string;
  kicker: string;
  intro: string;
  test: (p: Product) => boolean;
}

const isResort = (p: Product) =>
  p.categories.some((c) => c === 'cover-ups' || c === 'skirts-dresses' || c === 'accessories') || ['sarong', 'scarf', 'cover-up', 'dress'].includes(p.kind);

export const SHOP_VIEWS: ShopView[] = [
  {
    id: 'all',
    title: 'The Collection',
    kicker: 'SS26 · Everything',
    intro: 'KAI’s current summer assortment — swimwear, washed linen, Tencel, knitwear and resort pieces for men, women and children.',
    test: () => true,
  },
  {
    id: 'men',
    title: 'Men',
    kicker: 'Department',
    intro: 'Where KAI began in 2018: tailored swim shorts. Now with washed linen, Tencel co-ords, knit polos and terry towel.',
    test: (p) => p.department === 'men',
  },
  {
    id: 'women',
    title: 'Women',
    kicker: 'Department',
    intro: 'One pieces and bikini separates, washed linen in soft colours, Tencel, crochet and sarongs for the walk back.',
    test: (p) => p.department === 'women',
  },
  {
    id: 'kids',
    title: 'Kids',
    kicker: 'Department',
    intro: 'Mini swim shorts — most in the same prints as the grown-up pairs, so a beach day can be matched.',
    test: (p) => p.department === 'kids',
  },
  {
    id: 'swimwear',
    title: 'Swim',
    kicker: 'Category',
    intro: 'Swim shorts with mesh lining and engraved drawcords; one pieces and bikinis in recycled polyester and spandex.',
    test: (p) => p.categories.includes('swimwear'),
  },
  {
    id: 'linen',
    title: 'Linen',
    kicker: 'Category',
    intro: 'Washed pure linen in relaxed cuts — shirts, Cuban collars, pants, shorts, tops and skirts.',
    test: (p) => p.categories.includes('linen'),
  },
  {
    id: 'resort',
    title: 'Resort',
    kicker: 'Category',
    intro: 'Sarongs, crochet, cover-ups and dresses — the pieces worn between the water and dinner.',
    test: isResort,
  },
  {
    id: 'everyday',
    title: 'Knit & Jersey',
    kicker: 'Category',
    intro: 'Knit polos, mercerised and heavyweight cotton tees, terry towel and Tencel for the city.',
    test: (p) => p.categories.includes('knitwear') || p.categories.includes('tees') || p.kind === 'polo',
  },
  {
    id: 'new-arrivals',
    title: 'New Arrivals',
    kicker: 'Edit',
    intro: 'Everything in KAI’s SS26 New Arrivals collection on the day of the snapshot.',
    test: (p) => p.isNew,
  },
  {
    id: 'sale',
    title: 'Sale',
    kicker: 'Reduced',
    intro: 'Pieces KAI lists below their compare-at price. Prices are from the snapshot date — confirm on KAI.',
    test: onSale,
  },
];
export const VIEW_BY_ID = new Map(SHOP_VIEWS.map((v) => [v.id, v]));

/* ── Related & search ───────────────────────────────────────────────────────── */

export function relatedTo(p: Product, n = 4): Product[] {
  const paired = p.pair.map((s) => BY_SLUG.get(s)!).filter((q) => q && q.stock !== 'sold-out');
  const same = PRODUCTS.filter((q) => q.slug !== p.slug && !paired.includes(q) && q.department === p.department && q.kind === p.kind && q.stock !== 'sold-out');
  const cat = PRODUCTS.filter(
    (q) => q.slug !== p.slug && !paired.includes(q) && !same.includes(q) && q.department === p.department && q.categories.some((c) => p.categories.includes(c)),
  );
  return [...paired, ...same.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)), ...cat].slice(0, n);
}

const hayOf = (p: Product) =>
  [p.name, p.family ?? '', KIND_LABEL[p.kind], typeLine(p), colourOf(p).label, DEPARTMENT_LABEL[p.department], p.material ?? '', p.fabric ?? '', p.categories.join(' '), p.type ?? '']
    .join(' ')
    .toLowerCase();
const HAY = new Map(PRODUCTS.map((p) => [p.slug, hayOf(p)]));

/** Ranked search over name, print, garment type, colour, department and composition. */
export function search(query: string, limit = 8): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).map((t) => t.replace(/s$/, '') || t);
  const scored = PRODUCTS.map((p) => {
    const hay = HAY.get(p.slug)!;
    const name = p.name.toLowerCase();
    let s = 0;
    for (const t of terms) {
      if (!hay.includes(t)) return { p, s: -1 };
      if (name.startsWith(t)) s += 6;
      if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(name)) s += 4;
      s += 1;
    }
    if (name.includes(q)) s += 12; // the whole phrase, in order
    if (p.stock === 'sold-out') s -= 2;
    return { p, s };
  });
  return scored
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s || (a.p.rank ?? 999) - (b.p.rank ?? 999) || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}

export const SEARCH_SUGGESTIONS = ['Swim shorts', 'One piece', 'Bikini', 'Linen', 'Tencel', 'Crochet', 'Mini', 'Knit polo'];

/** The product KAI shows in a campaign photograph — only when KAI uses that same file on the product page. */
export function productFor(campaignId: string): Product | undefined {
  const c = CAMPAIGN_BY_ID.get(campaignId);
  if (!c) return undefined;
  const f = fileOf(c.src);
  return PRODUCTS.find((p) => p.images.some((im) => fileOf(im.src) === f));
}

/** Featured order: KAI's Best Sellers order, then KAI's department order. */
export const featured = (a: Product, b: Product) => (a.rank ?? 1e4 + a.order) - (b.rank ?? 1e4 + b.order);
