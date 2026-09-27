/**
 * Who appears in the film. Everything resolves to real catalogue entries
 * (products.ts) or official imagery (assets.ts); a slot with no real asset is
 * filled by the next real product of the same kind, never by a stand-in.
 */
import { asset, type Asset } from '../data/assets';
import { stores } from '../data/stores';
import { byId, inCategory, products, type Img, type Product } from '../data/products';

const pick = (ids: string[], fallback: Product[], n: number) => {
  const out: Product[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (p && !out.includes(p)) out.push(p);
  }
  for (const p of fallback) if (out.length < n && !out.includes(p)) out.push(p);
  return out.slice(0, n);
};

const pjoyAll = inCategory('pjoys', 'fluffy-pjoys');
const real = <T,>(xs: (T | undefined)[]) => xs.filter((x): x is T => !!x);

export const film = {
  /** two rails inside the wardrobe */
  door: pick(['cereal-killer-pjoys', 'cairo-is-a-mindset-oversized-hoodie', 'orange-cairo-jersey', 'sunset-pjoys', 'zed-stars-jersey', 'mood-swings-fluffy-pjoys'], products, 6),
  /** photos taped to the wardrobe doors — people from frame one */
  taped: real<Asset | Img>([asset('campaign-couch'), byId.get('doggies-pjoys')?.gallery[1] ?? byId.get('doggies-pjoys')?.image]),
  pjoys: pick(['doggies-pjoys', 'love-you-so-matcha-pjoys', 'sunset-pjoys', 'cereal-killer-pjoys'], pjoyAll, 4),
  hero: byId.get('cereal-killer-pjoys') ?? pjoyAll[0],
  outfit: pick(
    ['cairo-is-a-mindset-oversized-hoodie', 'egyptian-culture-oversized-long-sleeves', 'cereal-crimes-oversized-tee', 'female-denim-blue-washed-wide-leg-jeans'],
    [...inCategory('hoodies'), ...inCategory('long-sleeves'), ...inCategory('tees'), ...inCategory('bottoms')],
    4,
  ),
  cairoProduct: byId.get('cairo-is-a-mindset-oversized-hoodie') ?? inCategory('hoodies')[0],
  cairoSticker: byId.get('orange-cairo-jersey'),
  zed: products.filter((p) => p.collab === 'zed').slice(0, 3),
  mirror: byId.get('cereal-killer-pjoys') ?? pjoyAll[0],
};

export const cairoPhoto: Asset | Img | undefined = film.cairoProduct?.image;
export const zedPhoto: Asset | Img | undefined = asset('zed-pitch') ?? film.zed[0]?.secondaryImage;

export const wallPhotos: (Asset | Img)[] = real([asset('campaign-couch'), asset('store-open-air-mall'), asset('zed-court'), asset('campaign-fw27-room'), asset('store-the-yard')]);

export const wallTags = ['city-stars', 'mall-of-egypt', 'almaza', 'el-gouna'].map((id) => stores.find((s) => s.id === id)?.name).filter((n): n is string => !!n);

export const outfitLabels = (p: Product) =>
  p.category === 'hoodies' ? 'Hoodie' : p.category === 'long-sleeves' ? 'Long sleeve' : p.category === 'tees' ? 'Tee' : p.category === 'bottoms' ? 'Pants' : 'Piece';

/** Every image the film shows — preloaded + decoded before `ready`. */
export const filmImages = () =>
  [
    ...film.door.map((p) => p.image.src),
    ...film.taped.map((a) => a.src),
    ...film.pjoys.map((p) => p.image.src),
    film.hero?.patternImage.src,
    ...film.outfit.map((p) => p.image.src),
    ...film.zed.map((p) => p.image.src),
    film.mirror?.image.src,
    film.cairoProduct?.image.src,
    film.cairoSticker?.image.src,
    cairoPhoto?.src,
    zedPhoto?.src,
    ...wallPhotos.map((a) => a.src),
    asset('logo')?.src,
    asset('logo-white')?.src,
    asset('mark')?.src,
  ].filter((s): s is string => !!s);
