/**
 * Safe demo state for the takes. Real catalogue items only; no personal data,
 * no credentials, nothing that talks to Shopify, mail or rewards.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const idx = JSON.parse(readFileSync(fileURLToPath(new URL('../../../src/data/catalogue-index.json', import.meta.url)), 'utf8'));

/** The film's hero item, straight from the catalogue snapshot. */
export const HERO = 'main-character-pjoys';
export const HERO_SIZE = 'M';
/** The hoodie take B finds with the Arabic search and saves to FAVORITES. */
export const FAV_PICK = 'cairo-is-a-mindset-oversized-hoodie';

export function product(handle) {
  const p = idx.products.find((x) => x.h === handle);
  if (!p) throw new Error(`film: ${handle} is not in the catalogue snapshot`);
  return p;
}

/** A bag line exactly as the site's own ADD TO BAG writes it (same key, price and photo). */
export function bagLine(handle, size) {
  const p = product(handle);
  const row = p.sz.find((s) => s[0] === size);
  if (!row || !row[1]) throw new Error(`film: ${handle} ${size} is not available in the snapshot`);
  const variantId = row[2];
  return { key: `${handle}::${variantId}`, handle, title: p.t, variantId, variantTitle: size, size, quantity: 1, price: p.p, image: idx.imageBase + p.i };
}

/** Site defaults (sound stays OFF, as shipped) with the site's own CRT overlay off: the film adds one even texture over every crop. */
export const prefs = (wallpaper = { kind: 'preset', id: 'hills' }) => ({ state: { sound: false, crt: false, wallpaper, wallpaperMode: 'stretch' }, version: 1 });
export const sessionFlags = (o = {}) => ({ state: { bootSeen: true, welcomeSeen: true, pjoysPinged: true, pjoysRead: false, welcomeMinimized: false, ...o }, version: 1 });
export const bag = (items = []) => ({ state: { items, discountCode: null }, version: 1 });
export const favorites = (handles = []) => ({ state: { handles }, version: 1 });
