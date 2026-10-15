/**
 * npm run sync [-- --origin=https://kaicollections.com] [-- --fixture=path.json]
 *
 * Upgrades the catalog from the search-index snapshot to a DIRECT storefront
 * snapshot: for every curated product with a verified handle it reads KAI's
 * public Shopify endpoint (/products/<handle>.js) and writes
 * src/data/live/catalog.json with current prices, compare-at prices, sizes,
 * per-size stock, materials text and KAI's own product photography.
 *
 * Photography is HOTLINKED from KAI's CDN (cdn.shopify.com) — image files are
 * never downloaded into this public repository. src/data/live/ is git-ignored by
 * default; commit it only if you have KAI's permission to republish the data.
 *
 * Needs network access to kaicollections.com. The build environment that made
 * this concept could not reach it, so the committed site runs on the snapshot.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, arg } from './lib/server.mjs';

const ORIGIN = arg('origin', 'https://kaicollections.com');
const FIXTURE = arg('fixture');
const snapshot = JSON.parse(readFileSync(resolve(ROOT, 'src/data/products.json'), 'utf8'));
const targets = snapshot.products.filter((p) => p.handle);

const SIZE_OPTION = /^(size|sizes|المقاس)$/i;
const strip = (html) =>
  String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{2,}/g, '\n')
    .trim();
const money = (v) => (v == null ? null : typeof v === 'number' ? (v > 10000 ? Math.round(v / 100) : v) : Math.round(Number(v)));

/** Normalises Shopify's /products/<handle>.js payload (prices in cents) or products.json item (prices as strings). */
export function normalize(raw) {
  const optIndex = (raw.options ?? []).findIndex((o) => SIZE_OPTION.test(typeof o === 'string' ? o : o.name));
  const variants = raw.variants ?? [];
  const sizes = optIndex >= 0 ? [...new Set(variants.map((v) => v[`option${optIndex + 1}`]).filter(Boolean))] : [];
  const prices = variants.map((v) => money(v.price)).filter((x) => x != null);
  const compares = variants.map((v) => money(v.compare_at_price)).filter((x) => x != null && x > 0);
  const price = prices.length ? Math.min(...prices) : null;
  const compareAt = compares.length && Math.max(...compares) > (price ?? 0) ? Math.max(...compares) : null;
  const anyAvailable = variants.some((v) => v.available);
  const text = strip(raw.description ?? raw.body_html);
  const material = (text.match(/\b\d{1,3}%\s*[A-Za-z][^\n.,]*(?:,\s*\d{1,3}%\s*[A-Za-z][^\n.,]*)*/) ?? [null])[0];
  const imgs = (raw.images ?? []).map((im) => (typeof im === 'string' ? { src: im } : { src: im.src, width: im.width, height: im.height }));
  return {
    name: raw.title,
    price,
    compareAt,
    sizes,
    sizesSource: sizes.length ? 'product' : 'none',
    stock: variants.length ? (anyAvailable ? 'in-stock' : 'sold-out') : 'unknown',
    sizeStock: optIndex >= 0 ? Object.fromEntries(variants.map((v) => [v[`option${optIndex + 1}`], !!v.available])) : {},
    ...(material ? { material: material.trim() } : {}),
    description: text.slice(0, 1200),
    images: imgs.map((im, i) => ({
      src: im.src.startsWith('//') ? `https:${im.src}` : im.src,
      alt: `${raw.title} — KAI photograph ${i + 1}`,
      ...(im.width ? { width: im.width, height: im.height } : {}),
    })),
  };
}

async function fetchProduct(handle) {
  const r = await fetch(`${ORIGIN}/products/${handle}.js`, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`${handle}: HTTP ${r.status}`);
  return r.json();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixture = FIXTURE ? JSON.parse(readFileSync(resolve(FIXTURE), 'utf8')) : null;
  const out = { checkedAt: new Date().toISOString().slice(0, 10), origin: ORIGIN, products: {} };
  const failed = [];
  for (const p of targets) {
    try {
      const raw = fixture ? fixture[p.handle] : await fetchProduct(p.handle);
      if (!raw) throw new Error('not in fixture');
      out.products[p.handle] = normalize(raw);
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, fixture ? 0 : 350));
    } catch (e) {
      failed.push(`${p.handle} (${e.message})`);
      if (!fixture && failed.length === 1 && /fetch failed|ENOTFOUND|ECONN|tunnel/i.test(String(e.cause ?? e.message))) {
        console.error(`\n[sync] ${ORIGIN} is not reachable from this machine. Nothing written.`);
        process.exit(2);
      }
    }
  }
  const dir = resolve(ROOT, 'src/data/live');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'catalog.json'), JSON.stringify(out, null, 2));
  console.log(`\n[sync] ✓ ${Object.keys(out.products).length}/${targets.length} products → src/data/live/catalog.json`);
  if (failed.length) console.log(`[sync] not updated (kept snapshot values): ${failed.join(', ')}`);
}
