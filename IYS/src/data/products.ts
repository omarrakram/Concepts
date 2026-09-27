/**
 * Product data layer.
 *
 * Every product on screen comes from here. Commerce facts (name, price, sale
 * state, sizes + availability, colours, description, imagery, URLs) are read
 * from `catalogue.generated.json`, which `npm run fetch-assets` builds from
 * IN YOUR SHOE's public storefront JSON. Nothing commercial is typed by hand.
 *
 * The `curation` table below is the concept layer: which room a product lives
 * in, which moods it answers (hand-curated, see moods.ts), a short nickname,
 * and a caption quoted verbatim from the product's official description.
 */
import catalogue from './catalogue.generated.json';
import type { MoodId } from './moods';

export type Category =
  | 'pjoys'
  | 'fluffy-pjoys'
  | 'hoodies'
  | 'tees'
  | 'long-sleeves'
  | 'shirts'
  | 'jerseys'
  | 'bottoms'
  | 'accessories'
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
  /** verbatim excerpt of the official product description */
  caption?: string;
  /** close-up used when the pattern is the hero (index into gallery) */
  patternImage: Img;
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
  pattern?: number;
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
// `caption` is a verbatim excerpt of the product's OFFICIAL description on
// inyourshoe.com (captionSource: 'official'); `nick` is a shortened product name.
const curation: Curated[] = [
  // THE PJOY ROOM
  { handle: 'cereal-killer-pjoys', category: 'pjoys', rooms: ['bedroom'], moods: ['sleepy', 'staying-in', 'chaotic'], nick: 'Cereal Killer', caption: 'Relax, it’s just about breakfast (probably).', pattern: 1 },
  { handle: 'doggies-pjoys', category: 'pjoys', rooms: ['bedroom'], moods: ['staying-in'], nick: 'Doggies', caption: 'Pyjama pants for pup-obsessed humans.', pattern: 0, focus: '50% 62%' },
  { handle: 'love-you-so-matcha-pjoys', category: 'pjoys', rooms: ['bedroom'], moods: ['staying-in', 'sleepy'], nick: 'Love You So Matcha', caption: 'Matcha made in lazy heaven.', pattern: 1 },
  { handle: 'sunset-pjoys', category: 'pjoys', rooms: ['bedroom'], moods: ['sleepy', 'going-out'], nick: 'Sunset', caption: 'Maximum stripes, relaxed on bed vibes.', pattern: 1 },
  { handle: 'main-character-pjoys', category: 'pjoys', rooms: ['bedroom'], moods: ['chaotic', 'staying-in'], nick: 'Main Character', caption: 'Pyjama pants for plot-twist protagonists.', pattern: 1 },
  { handle: 'mood-swings-fluffy-pjoys', category: 'fluffy-pjoys', rooms: ['bedroom'], moods: ['chaotic', 'sleepy'], nick: 'Mood Swings', caption: '“MOOD SWINGS.” Subtle?', pattern: 1 },
  { handle: 'just-sleepy-fluffy-pjoys', category: 'fluffy-pjoys', rooms: ['bedroom'], moods: ['sleepy'], nick: 'Just Sleepy', caption: 'My eyes are half closed, but my pj pants have answers.', pattern: 1 },
  // THE WARDROBE
  { handle: 'cairo-is-a-mindset-oversized-hoodie', category: 'hoodies', rooms: ['closet', 'balcony'], moods: ['cairo', 'going-out'], nick: 'Cairo Is A Mindset', caption: 'Cairo isn’t a location. It’s noise, chaos, confidence, and a state of mind.' },
  { handle: 'egyptian-culture-oversized-long-sleeves', category: 'long-sleeves', rooms: ['closet', 'balcony'], moods: ['cairo', 'going-out'], nick: 'Egyptian Culture', caption: 'Turns the whole piece into wearable artwork.' },
  { handle: 'cereal-crimes-oversized-tee', category: 'tees', rooms: ['closet'], moods: ['chaotic', 'going-out'], nick: 'Cereal Crimes', caption: 'Wanted for crunching too loudly and leaving no marshmallows behind.' },
  { handle: 'female-denim-blue-washed-wide-leg-jeans', category: 'bottoms', rooms: ['closet'], moods: ['going-out'], nick: 'Wide Leg Jeans', caption: 'A wide-leg cut for a laid-back, roomy shape.', womens: true },
  { handle: 'female-red-striped-regular-shirt', category: 'shirts', rooms: ['closet'], moods: ['going-out'], nick: 'Red Striped Shirt', caption: 'A lightweight everyday finish.', womens: true },
  { handle: 'orange-cairo-jersey', category: 'jerseys', rooms: ['closet', 'balcony'], moods: ['cairo', 'match-day', 'chaotic'], nick: 'Orange Cairo', caption: 'Designed & produced in Cairo, Egypt.' },
  { handle: 'blue-cairo-kids-jersey', category: 'kids', rooms: ['kids', 'balcony'], moods: ['cairo', 'match-day'], nick: 'Blue Cairo (Kids)', caption: 'For kids who act like they’ve got a whole stadium cheering them on.', kids: true },
  // THE LOCKER ROOM · IYS × ZED FC
  { handle: 'zed-stars-jersey', category: 'jerseys', rooms: ['locker'], moods: ['match-day'], nick: 'ZED Stars', caption: 'Gold stars, dual logos, “روح الفريق” on the back.', collab: 'zed' },
  { handle: 'striped-youth-dept-jersey', category: 'jerseys', rooms: ['locker'], moods: ['match-day', 'going-out'], nick: 'Youth Dept', caption: 'Bold “YOUTH DEPT.” chest graphics.', collab: 'zed' },
  { handle: 'dna-is-football-oversized-tee', category: 'tees', rooms: ['locker'], moods: ['match-day'], nick: 'DNA Is Football', caption: 'Built for the love of the game.', collab: 'zed' },
  // THE DRAWER
  { handle: 'i-love-cairo-neck-socks', category: 'accessories', rooms: ['drawer'], moods: ['cairo', 'chaotic'], nick: 'I Love Cairo', caption: 'For people who romanticize Cairo traffic, koshary dates, and surviving on hot tea and pure chaos.' },
  { handle: 'masr-washed-cap', category: 'accessories', rooms: ['drawer'], moods: ['cairo', 'going-out'], nick: 'Masr Cap' },
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
      patternImage: r.images[c.pattern ?? 1] ?? image!,
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
  shirts: 'Shirts',
  jerseys: 'Jerseys',
  bottoms: 'Denim',
  accessories: 'Accessories',
  kids: 'Kids',
};

export const formatPrice = (n: number | null) =>
  n == null ? '' : `${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} EGP`;

export const catalogueVerifiedAt = (catalogue as { verifiedAt: string | null }).verifiedAt;
