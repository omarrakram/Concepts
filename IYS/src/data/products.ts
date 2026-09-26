/**
 * Product data layer.
 *
 * Every product on screen comes from here. Commerce facts (name, price, sale
 * state, sizes + availability, colours, description, imagery, URLs) are read
 * from `catalogue.generated.json`, which `npm run fetch-assets` builds from
 * IN YOUR SHOE's public storefront JSON. Nothing commercial is typed by hand.
 *
 * The `curation` table below is the concept layer: which room a product lives
 * in, which moods it answers, and a short nickname/caption. Captions are
 * CONCEPT COPY — NOT OFFICIAL BRAND LANGUAGE.
 */
import catalogue from './catalogue.generated.json';
import type { MoodId } from './moods';

export type Category =
  | 'pjoys'
  | 'fluffy-pjoys'
  | 'hoodies'
  | 'tees'
  | 'long-sleeves'
  | 'bottoms'
  | 'accessories'
  | 'sportswear'
  | 'kids';

export type Room = 'bedroom' | 'closet' | 'drawer' | 'locker' | 'balcony' | 'kids';

export type Img = { src: string; alt: string; width?: number; height?: number; sourceUrl?: string };

export type SizeInfo = { label: string; available: boolean };

export type Product = {
  id: string;
  name: string;
  /** Friend-caption name, e.g. CEREAL KILLER (derived from the real name). */
  nick: string;
  category: Category;
  rooms: Room[];
  moods: MoodId[];
  price: number | null;
  compareAtPrice: number | null;
  currency: 'EGP';
  status: 'available' | 'sold-out';
  sizeInfo: SizeInfo[];
  colours: string[];
  image: Img;
  secondaryImage?: Img;
  gallery: Img[];
  description?: string;
  productUrl: string;
  sourceUrl: string;
  verifiedAt: string;
  publishedAt?: string | null;
  /** CONCEPT COPY */
  caption?: string;
  /** object-position used when cropping into the fabric/pattern */
  focus?: string;
  womens?: boolean;
  kids?: boolean;
  collab?: 'zed';
};

type Curated = {
  handle: string;
  category: Category;
  rooms: Room[];
  moods: MoodId[];
  nick?: string;
  caption?: string;
  focus?: string;
  womens?: boolean;
  kids?: boolean;
  collab?: 'zed';
};

type Raw = {
  handle: string;
  title: string;
  price: number | null;
  compareAtPrice: number | null;
  available: boolean;
  sizes: SizeInfo[];
  colours: string[];
  description?: string;
  publishedAt?: string | null;
  images: Img[];
  productUrl: string;
  sourceUrl: string;
  verifiedAt: string;
};

// ── curation (concept layer) ────────────────────────────────────────────
// CONCEPT COPY — NOT OFFICIAL BRAND LANGUAGE (nick/caption fields).
const curation: Curated[] = [
  { handle: 'cereal-killer-pjoys', category: 'pjoys', rooms: ['bedroom'], moods: ['sleepy', 'staying-in', 'chaotic'], nick: 'Cereal Killer', caption: 'for people who consider cereal dinner.' },
  { handle: 'sunset-pjoys', category: 'pjoys', rooms: ['bedroom'], moods: ['sleepy', 'staying-in'], nick: 'Sunset', caption: 'golden hour, but horizontal.' },
  { handle: 'doggies-pjoys', category: 'pjoys', rooms: ['bedroom'], moods: ['staying-in', 'chaotic'], nick: 'Doggies', caption: 'good boys only.' },
  { handle: 'love-you-so-matcha-pjoys', category: 'pjoys', rooms: ['bedroom'], moods: ['sleepy', 'staying-in'], nick: 'Love You So Matcha', caption: 'say it with a pun.' },
  { handle: 'cereal-killer-fluffy-pjoys', category: 'fluffy-pjoys', rooms: ['bedroom'], moods: ['sleepy', 'staying-in'], nick: 'Cereal Killer (Fluffy)', caption: 'same crime, warmer.' },
  { handle: 'mood-swings-fluffy-pjoys', category: 'fluffy-pjoys', rooms: ['bedroom'], moods: ['sleepy', 'chaotic'], nick: 'Mood Swings', caption: 'accurate.' },
  { handle: 'excuses-not-to-study-fluffy-pjoys', category: 'fluffy-pjoys', rooms: ['bedroom'], moods: ['staying-in', 'chaotic'], nick: 'Excuses Not To Study', caption: 'reading week, allegedly.' },
  { handle: 'cereal-crimes-oversized-tee', category: 'tees', rooms: ['closet'], moods: ['going-out', 'chaotic'], nick: 'Cereal Crimes', caption: 'the sequel nobody asked for.' },
  { handle: 'cairo-is-a-mindset-oversized-hoodie', category: 'hoodies', rooms: ['closet', 'balcony'], moods: ['cairo', 'going-out'], nick: 'Cairo Is A Mindset', caption: 'not a place. a setting.' },
  { handle: 'egyptian-culture-oversized-long-sleeves', category: 'long-sleeves', rooms: ['closet', 'balcony'], moods: ['cairo', 'going-out'], nick: 'Egyptian Culture', caption: 'wear the group chat.' },
  { handle: 'dna-is-football-oversized-tee', category: 'tees', rooms: ['closet', 'locker'], moods: ['match-day', 'cairo'], nick: 'DNA Is Football', caption: 'it’s genetic.' },
  { handle: 'zed-stars-jersey', category: 'sportswear', rooms: ['locker'], moods: ['match-day'], nick: 'ZED Stars', collab: 'zed' },
  { handle: 'striped-youth-dept-jersey', category: 'sportswear', rooms: ['locker'], moods: ['match-day', 'going-out'], nick: 'Striped Youth Dept', collab: 'zed' },
  { handle: 'distorted-youth-dept-jersey', category: 'sportswear', rooms: ['locker'], moods: ['match-day', 'chaotic'], nick: 'Distorted Youth Dept', collab: 'zed' },
  { handle: 'black-zed-stars-sworts', category: 'sportswear', rooms: ['locker'], moods: ['match-day'], nick: 'ZED Stars Sworts', collab: 'zed' },
];

const raw = (catalogue as unknown as { products: Raw[] }).products;
const byHandle = new Map(raw.map((r) => [r.handle, r]));

const nickFrom = (title: string) =>
  title
    .replace(/\b(oversized|fluffy|pjoys?|tee|t-shirt|hoodie|long sleeves?|jersey)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

export const products: Product[] = curation.flatMap((c) => {
  const r = byHandle.get(c.handle);
  if (!r || !r.images.length) return [];
  const [image, secondaryImage, ...rest] = r.images;
  return [
    {
      id: r.handle,
      name: r.title,
      nick: c.nick ?? nickFrom(r.title),
      category: c.category,
      rooms: c.rooms,
      moods: c.moods,
      price: r.price,
      compareAtPrice: r.compareAtPrice,
      currency: 'EGP' as const,
      status: r.available ? ('available' as const) : ('sold-out' as const),
      sizeInfo: r.sizes,
      colours: r.colours,
      image: image!,
      secondaryImage,
      gallery: [image!, ...(secondaryImage ? [secondaryImage] : []), ...rest],
      description: r.description,
      productUrl: r.productUrl,
      sourceUrl: r.sourceUrl,
      verifiedAt: r.verifiedAt,
      publishedAt: r.publishedAt,
      caption: c.caption,
      focus: c.focus,
      womens: c.womens,
      kids: c.kids,
      collab: c.collab,
    },
  ];
});

export const byId = new Map(products.map((p) => [p.id, p]));
export const inRoom = (room: Room) => products.filter((p) => p.rooms.includes(room));
export const inCategory = (...cats: Category[]) => products.filter((p) => cats.includes(p.category));
export const forMood = (mood: MoodId) => products.filter((p) => p.moods.includes(mood));

export const categoryLabel: Record<Category, string> = {
  pjoys: 'Pjoys',
  'fluffy-pjoys': 'Fluffy Pjoys',
  hoodies: 'Hoodies',
  tees: 'Tees',
  'long-sleeves': 'Long Sleeves',
  bottoms: 'Bottoms',
  accessories: 'Accessories',
  sportswear: 'Sportswear',
  kids: 'Kids',
};

export const formatPrice = (n: number | null) =>
  n == null ? '' : `${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} EGP`;

export const catalogueVerifiedAt = (catalogue as { verifiedAt: string | null }).verifiedAt;
