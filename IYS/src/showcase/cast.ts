/**
 * Who appears in the film. Everything resolves to real catalogue entries
 * (products.ts) or official imagery (assets.ts); a slot with no real asset is
 * filled by the next real product of the same kind, never by a stand-in.
 */
import { asset, assetsIn, type Asset } from '../data/assets';
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

export const film = {
  door: pick(['cereal-killer-pjoys', 'cairo-is-a-mindset-oversized-hoodie', 'zed-stars-jersey', 'sunset-pjoys', 'egyptian-culture-oversized-long-sleeves', 'doggies-pjoys'], products, 6),
  stickers: pick(['love-you-so-matcha-pjoys', 'dna-is-football-oversized-tee'], products, 2),
  pjoys: pick(['cereal-killer-pjoys', 'doggies-pjoys', 'sunset-pjoys', 'love-you-so-matcha-pjoys'], pjoyAll, 4),
  outfit: pick(
    ['cairo-is-a-mindset-oversized-hoodie', 'egyptian-culture-oversized-long-sleeves', 'cereal-crimes-oversized-tee'],
    [...inCategory('hoodies'), ...inCategory('long-sleeves'), ...inCategory('tees'), ...inCategory('bottoms')],
    4,
  ),
  cairoProduct: byId.get('cairo-is-a-mindset-oversized-hoodie') ?? inCategory('hoodies')[0],
  zed: products.filter((p) => p.collab === 'zed').slice(0, 3),
  mirror: pick(['cereal-killer-pjoys'], pjoyAll, 1)[0],
};

export const cairoPhoto: Asset | Img | undefined = asset('campaign-cairo') ?? film.cairoProduct?.secondaryImage ?? film.cairoProduct?.image;
export const zedPhoto: Asset | Img | undefined = asset('zed-campaign') ?? film.zed[0]?.secondaryImage;

export const wallPhotos: (Asset | Img)[] = [
  ...assetsIn('wall-'),
  ...assetsIn('campaign-'),
  ...assetsIn('store-'),
  ...products.filter((p) => p.secondaryImage).map((p) => p.secondaryImage!),
].slice(0, 5);

export const wallTags = [...new Set(stores.map((s) => s.name))].slice(0, 4);

export const outfitLabels = (p: Product) =>
  p.category === 'hoodies' ? 'Hoodie' : p.category === 'long-sleeves' ? 'Long sleeve' : p.category === 'tees' ? 'Tee' : p.category === 'bottoms' ? 'Pants' : 'Piece';

/** Every image the film shows — preloaded + decoded before `ready`. */
export const filmImages = () =>
  [
    ...film.door.map((p) => p.image.src),
    ...film.stickers.map((p) => p.image.src),
    ...film.pjoys.map((p) => p.image.src),
    ...film.outfit.map((p) => p.image.src),
    ...film.zed.map((p) => p.image.src),
    film.mirror?.image.src,
    film.cairoProduct?.image.src,
    cairoPhoto?.src,
    zedPhoto?.src,
    ...wallPhotos.map((a) => a.src),
    asset('logo')?.src,
  ].filter((s): s is string => !!s);
