/**
 * Starting state for the V2 takes. Nothing is invented: the catalogue comes
 * from the website SOURCE checkout (out/source/source-build.json), and a take
 * that continues the visit starts from the storage the previous take's real
 * clicks wrote (recorded in its take.json → notes). Display preferences are
 * never seeded: the site's defaults (hills wallpaper, its CRT overlay, sound off).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const source = JSON.parse(readFileSync(resolve(ROOT, 'out/source/source-build.json'), 'utf8'));
const idx = JSON.parse(readFileSync(resolve(source.buildDir, '..', 'src/data/catalogue-index.json'), 'utf8'));

/** The product the film opens, sizes and adds to the bag (JUST DROPPED #1 and TOP 8 #1; official size chart). */
export const HERO = 'dropout-oversized-hoodie';
export const HERO_SIZE = 'M';
/** The hoodie the Arabic search finds and the film saves to FAVORITES (also on the home's CAIRO shelf). */
export const FAV_PICK = 'cairo-is-a-mindset-oversized-hoodie';

export function product(handle) {
  const p = idx.products.find((x) => x.h === handle);
  if (!p) throw new Error(`film: ${handle} is not in the catalogue snapshot`);
  return p;
}

/** What an earlier take recorded (its notes), e.g. the bag the site wrote after ADD TO BAG. */
export function recorded(takeId, key) {
  const t = JSON.parse(readFileSync(resolve(ROOT, 'out/v2-film/takes', takeId, 'take.json'), 'utf8'));
  if (t.notes?.[key] === undefined) throw new Error(`film: take ${takeId} recorded no "${key}"; shoot it first`);
  return t.notes[key];
}

/** Session flags: the visit continues (boot and welcome already seen). */
export const sessionFlags = (o = {}) => ({ state: { bootSeen: true, welcomeSeen: true, pjoysPinged: true, pjoysRead: false, welcomeMinimized: false, ...o }, version: 1 });

/** Read the storage the site itself wrote, to hand to the next take. */
export const STORAGE_KEYS = ['iys2006.bag', 'iys2006.favorites'];
export async function snapshotStorage(t) {
  return t.eval((keys) => Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)]).filter(([, v]) => v !== null)), STORAGE_KEYS);
}
