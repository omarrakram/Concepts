/**
 * Non-product imagery (brand, campaign, stores, collabs).
 *
 * Every entry is an official public IN YOUR SHOE image downloaded by
 * `npm run fetch-assets` (see scripts/cast.json → "images") into public/iys/.
 * Source URLs + retrieval dates live in docs/SOURCES.md. If an image is not
 * present in the generated catalogue it is simply not rendered.
 */
import catalogue from './catalogue.generated.json';

export type Asset = { src: string; alt: string; width?: number; height?: number; sourceUrl: string; page?: string };

const images = (catalogue as unknown as { images: Record<string, Asset> }).images ?? {};

export const asset = (id: string): Asset | undefined => images[id];
export const assetsIn = (prefix: string): Asset[] =>
  Object.entries(images)
    .filter(([k]) => k.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

/** Current official logo (brand/logo). Falls back to the wordmark text. */
export const logo = asset('logo');
