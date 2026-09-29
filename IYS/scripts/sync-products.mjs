/**
 * npm run sync-products [-- --offline] [-- --allow-shrink]
 *
 * Discovers, validates and snapshots the ENTIRE current public In Your Shoe
 * catalogue from the EGYPTIAN storefront (https://inyourshoe.com, EGP).
 *
 * WHY EGYPT: the storefront also serves /en-sa, /en-uae, /en-kw, /en-uk,
 * /en-international markets with converted prices and slightly different
 * assortments. The Egyptian storefront is the authority for this concept:
 * only unprefixed URLs are used, every request carries the storefront's own
 * `localization=EG; cart_currency=EGP` cookies, the homepage's
 * `Shopify.currency.active` must read EGP, and a sample of prices is
 * cross-checked against the product Ajax endpoint.
 *
 * DISCOVERY FALLBACK CHAIN (public endpoints only, sequential + paced):
 *   1. sitemap.xml → Egyptian product sitemaps → every public product handle
 *      + homepage navigation → the collections IYS actually surfaces
 *   2. /products.json?limit=250&page=N        (storefront JSON, bulk)
 *   3. /collections/<h>/products.json         (membership + order; also fills gaps)
 *   4. /products/<handle>.js                  (per-product JSON for anything still missing)
 *   5. JSON-LD in /products/<handle> HTML     (last resort)
 *   6. otherwise → reported as unparseable (never invented)
 *
 * OUTPUT (deterministic: products sorted by the storefront's own All Products
 * order, keys stable):
 *   src/data/catalogue-index.json    everything cards/filters/search need
 *   public/catalogue/<shard>.json    full product records (description, all
 *                                    images, variants) loaded on demand
 *   src/data/catalogue-meta.json     snapshot metadata + validation report
 *
 * Fails loudly (exit 1, nothing written) on integrity problems.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORIGIN, get } from './lib/http.mjs';
import {
  CURRENCY,
  extractJsonLdProduct,
  handleFromProductUrl,
  isInternationalMarketUrl,
  normalizeAjaxProduct,
  normalizeJsonLdProduct,
  normalizeStorefrontProduct,
  sitemapLocs,
  validateCatalogue,
} from './lib/normalize.mjs';
import { buildOutputs, SHARD_COUNT } from './lib/outputs.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(root, '.cache/sync');
const offline = process.argv.includes('--offline');
const allowShrink = process.argv.includes('--allow-shrink');
mkdirSync(CACHE, { recursive: true });

const log = (...a) => console.log('[sync]', ...a);
const cacheFile = (name) => resolve(CACHE, `${name.replace(/[^\w.-]+/g, '_')}`);

/** Fetch through the on-disk raw cache (the cache is the audit trail of what the public site returned). */
async function cached(name, url, as = 'json') {
  const file = cacheFile(name);
  if (offline) {
    if (existsSync(`${file}.404`)) throw Object.assign(new Error(`404 ${url} (cached)`), { status: 404 });
    if (!existsSync(file)) throw new Error(`--offline: no cached ${name}`);
    const body = readFileSync(file, 'utf8');
    return as === 'json' ? JSON.parse(body) : body;
  }
  try {
    const body = await get(url, { as });
    writeFileSync(file, as === 'json' ? JSON.stringify(body) : body);
    rmSync(`${file}.404`, { force: true });
    return body;
  } catch (e) {
    // Remember public 404s so an --offline rebuild reaches the same verdict.
    if (e.status === 404) writeFileSync(`${file}.404`, new Date().toISOString());
    throw e;
  }
}

/** Collections this concept needs membership for, beyond what the homepage nav links. */
const REQUIRED_COLLECTIONS = [
  'all-products', 'newest', 'pjoys', 'fluffy-pjoys', 'kids-pjoys', 'kids-fluffy-pjoys', 'cairo', 'cereal-killer',
  'women', 'men', 'unisex', 'all-kids-products', 'all-accessories', 'all-tops', 'all-bottoms', 'homewear',
  'on-sale', 'best-sellers', 'hoodies', 'outwear', 'all-socks', 'hats-caps', 'bandanas', 'headbands', 'all-bags',
  'inyourshoexzed', 'stripes', 'kids', 'neck-socks', 'fluffy-socks', 'caps',
];

async function main() {
  // Offline rebuilds keep the ORIGINAL retrieval time of the cached responses.
  const retrievedAt = offline && existsSync(cacheFile('products_p1.json')) ? statSync(cacheFile('products_p1.json')).mtime.toISOString() : new Date().toISOString();
  const sourceMethods = new Set();

  // ── 0. Market check ───────────────────────────────────────────────────
  const home = await cached('home.html', `${ORIGIN}/`, 'text');
  const cur = /Shopify\.currency\s*=\s*(\{[^}]*\})/.exec(home);
  const activeCurrency = cur ? JSON.parse(cur[1]).active : null;
  if (activeCurrency !== CURRENCY) throw new Error(`storefront currency is ${activeCurrency}, expected ${CURRENCY} — refusing to sync a non-Egyptian market`);
  log(`storefront currency: ${activeCurrency} ✓`);

  const navCollections = [...new Set([...home.matchAll(/href="\/collections\/([a-z0-9-]+)"/g)].map((m) => m[1]))];
  log(`homepage navigation links ${navCollections.length} collections`);

  // ── 1. Sitemap discovery (Egyptian, unprefixed sitemaps only) ─────────
  const index = await cached('sitemap.xml', `${ORIGIN}/sitemap.xml`, 'text');
  const productMaps = sitemapLocs(index).filter((u) => /\/sitemap_products_\d+\.xml/.test(u) && !isInternationalMarketUrl(u));
  const discovered = [];
  for (const [i, map] of productMaps.entries()) {
    const xml = await cached(`sitemap_products_${i + 1}.xml`, map, 'text');
    for (const loc of sitemapLocs(xml)) {
      if (isInternationalMarketUrl(loc)) continue;
      const h = handleFromProductUrl(loc);
      if (h) discovered.push(h);
    }
  }
  const discoveredSet = new Set(discovered);
  sourceMethods.add('sitemap.xml');
  log(`sitemap: ${productMaps.length} Egyptian product sitemaps → ${discoveredSet.size} product URLs`);

  // ── 2. Bulk storefront JSON ────────────────────────────────────────────
  const raw = new Map();
  for (let page = 1; page < 60; page++) {
    const { products } = await cached(`products_p${page}.json`, `${ORIGIN}/products.json?limit=250&page=${page}`);
    if (!products?.length) break;
    for (const p of products) raw.set(p.handle, { p, method: 'products.json' });
    log(`products.json page ${page}: +${products.length} (total ${raw.size})`);
  }
  sourceMethods.add('products.json');

  // ── 3. Collections: titles + ordered membership ──────────────────────
  let titles = {};
  try {
    const { collections } = await cached('collections.json', `${ORIGIN}/collections.json?limit=250`);
    titles = Object.fromEntries(collections.map((c) => [c.handle, c.title]));
  } catch (e) {
    console.warn(`[sync] collections.json unavailable (${e.message}) — titles fall back to handles`);
  }
  const wanted = [...new Set([...REQUIRED_COLLECTIONS, ...navCollections])];
  const membership = {};
  for (const h of wanted) {
    const order = [];
    try {
      for (let page = 1; page < 30; page++) {
        const { products } = await cached(`collection_${h}_p${page}.json`, `${ORIGIN}/collections/${h}/products.json?limit=250&page=${page}`);
        if (!products?.length) break;
        for (const p of products) {
          order.push(p.handle);
          if (!raw.has(p.handle)) raw.set(p.handle, { p, method: 'collection products.json' });
        }
      }
    } catch (e) {
      if (e.status === 404 || /no cached/.test(e.message)) {
        log(`  collection ${h}: not public (${e.status ?? 'uncached'}) — skipped`);
        continue;
      }
      throw e;
    }
    membership[h] = [...new Set(order)];
    log(`  collection ${h}: ${membership[h].length}`);
  }
  sourceMethods.add('collection products.json');

  // ── 4/5. Per-product fallbacks for anything the bulk endpoints missed ─
  const normalized = new Map();
  for (const [h, { p, method }] of raw) normalized.set(h, normalizeStorefrontProduct(p, { retrievedAt, method }));

  const unparseable = [];
  const notPublic = [];
  const missing = [...discoveredSet].filter((h) => !normalized.has(h));
  if (missing.length) log(`${missing.length} sitemap products missing from bulk JSON — trying per-product fallbacks`);
  for (const h of missing) {
    let gone = 0;
    try {
      const p = await cached(`product_${h}.js.json`, `${ORIGIN}/products/${encodeURIComponent(h)}.js`);
      normalized.set(h, normalizeAjaxProduct(p, { retrievedAt }));
      sourceMethods.add('product.js');
      continue;
    } catch (e) {
      if (e.status && e.status !== 404) throw e;
      if (e.status === 404) gone++;
    }
    try {
      const html = await cached(`product_${h}.html`, `${ORIGIN}/products/${encodeURIComponent(h)}`, 'text');
      const ld = extractJsonLdProduct(html);
      if (ld) {
        normalized.set(h, normalizeJsonLdProduct(ld, h, { retrievedAt }));
        sourceMethods.add('json-ld');
        continue;
      }
    } catch (e) {
      if (e.status && e.status !== 404) throw e;
      if (e.status === 404) gone++;
    }
    // Listed in the sitemap but both the product page and its JSON 404: not public.
    if (gone === 2) notPublic.push(h);
    else unparseable.push(h);
  }

  // ── Price cross-check against the product Ajax endpoint (EGP) ─────────
  const sampleHandles = [...normalized.keys()].filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 5)) === 0).slice(0, 5);
  const priceChecks = [];
  for (const h of sampleHandles) {
    const js = await cached(`check_${h}.js.json`, `${ORIGIN}/products/${encodeURIComponent(h)}.js`);
    const ajaxPrice = js.price / 100;
    const ours = normalized.get(h).price;
    priceChecks.push({ handle: h, productsJson: ours, productJs: ajaxPrice, ok: ours === ajaxPrice });
  }
  const priceMismatch = priceChecks.filter((c) => !c.ok);
  log(`price cross-check (${priceChecks.length} products, .js vs products.json): ${priceMismatch.length ? `✗ ${priceMismatch.length} mismatch` : '✓ identical'}`);

  // ── Attach collection membership ──────────────────────────────────────
  for (const [ch, handles] of Object.entries(membership)) {
    for (const h of handles) normalized.get(h)?.collections.push(ch);
  }

  // Universe = every product the public Egyptian storefront publishes
  // (sitemap ∪ storefront JSON ∪ collection JSON). Ordered by the
  // storefront's own All Products order, then everything else by handle.
  const allOrder = membership['all-products'] ?? [];
  const pos = new Map(allOrder.map((h, i) => [h, i]));
  const products = [...normalized.values()].sort((a, b) => (pos.get(a.handle) ?? 1e9) - (pos.get(b.handle) ?? 1e9) || a.handle.localeCompare(b.handle));

  // ── Validate ──────────────────────────────────────────────────────────
  const metaFile = resolve(root, 'src/data/catalogue-meta.json');
  const previousCount = existsSync(metaFile) && !allowShrink ? JSON.parse(readFileSync(metaFile, 'utf8')).productCount : null;
  const publicHandles = [...discoveredSet].filter((h) => !notPublic.includes(h));
  const { report, errors } = validateCatalogue(products, { discoveredHandles: publicHandles, expectedMin: 100, previousCount });
  report.unparseable = unparseable;
  report.sitemapNotPublic = notPublic;
  if (unparseable.length > Math.max(5, discoveredSet.size * 0.01)) errors.push(`${unparseable.length} unparseable products`);
  report.priceChecks = priceChecks;
  if (priceMismatch.length) errors.push(`${priceMismatch.length} price cross-check mismatches`);
  report.notInSitemap = products.filter((p) => !discoveredSet.has(p.handle)).map((p) => p.handle);
  report.notInAllProducts = products.filter((p) => !pos.has(p.handle)).map((p) => p.handle);

  printReport(report, errors);
  writeFileSync(resolve(CACHE, 'last-report.json'), JSON.stringify({ report, errors }, null, 2));
  if (errors.length) {
    console.error('\n[sync] ✗ integrity check failed — nothing written.');
    process.exit(1);
  }

  // ── Write deterministic outputs ───────────────────────────────────────
  const collectionMeta = Object.fromEntries(
    Object.entries(membership).map(([h, list]) => [h, { title: titles[h] ?? null, count: list.length, order: list }]),
  );
  const meta = {
    concept: 'IYS INTERNET 2006 — unofficial speculative concept. Snapshot of public data; not live commerce.',
    generatedAt: retrievedAt,
    storefront: ORIGIN,
    market: 'Egypt',
    currency: CURRENCY,
    // Distinct metrics — do not conflate them:
    //  publicProductsTotal       every product the Egyptian storefront publishes (sitemap ∪ storefront JSON)
    //  allProductsCollectionCount IYS's own /collections/all-products membership
    //  productsOutsideAllProducts public products IYS does not list in All Products (e.g. collab capsules)
    productCount: products.length,
    publicProductsTotal: products.length,
    allProductsCollectionCount: allOrder.length,
    productsOutsideAllProducts: { count: report.notInAllProducts.length, handles: report.notInAllProducts },
    variantCount: report.variantCount,
    variantsTotal: report.variantCount,
    sitemapNotPublic: notPublic,
    sourceMethods: [...sourceMethods],
    navCollections,
    report: { ...report, missingFromSync: report.missingFromSync.length ? report.missingFromSync : [] },
  };
  const out = buildOutputs(products, collectionMeta, meta);
  rmSync(resolve(root, 'public/catalogue'), { recursive: true, force: true });
  mkdirSync(resolve(root, 'public/catalogue'), { recursive: true });
  for (const [name, body] of Object.entries(out.shards)) writeFileSync(resolve(root, 'public/catalogue', name), body);
  writeFileSync(resolve(root, 'src/data/catalogue-index.json'), out.index);
  writeFileSync(metaFile, out.meta);
  log(`wrote ${products.length} products → src/data/catalogue-index.json (${kb(out.index)}), ${SHARD_COUNT} detail shards (${kb(Object.values(out.shards).join(''))} total), meta (${kb(out.meta)})`);
}

const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`;

function printReport(r, errors) {
  const n = (x) => (Array.isArray(x) ? x.length : x);
  console.log(`
┌─ IYS CATALOGUE SYNC REPORT (Egypt · ${CURRENCY}) ─────────────────
│ discovered (sitemap)        ${r.discovered}
│ normalized products         ${r.normalized}
│ unique handles              ${r.uniqueHandles}
│ duplicate handles           ${n(r.duplicateHandles)}
│ with images / without       ${r.withImages} / ${n(r.withoutImages)}
│ with prices / without       ${r.withPrices} / ${n(r.withoutPrices)}
│ with compare-at (on sale)   ${r.withCompareAt}
│ variants                    ${r.variantCount}
│ collections (synced)        ${r.collectionCount}
│ product types               ${r.productTypeCount}
│ invalid URLs                ${n(r.invalidUrls)}
│ unparseable                 ${n(r.unparseable)}
│ in sitemap but 404 (hidden) ${n(r.sitemapNotPublic)}
│ currency mismatches         ${n(r.currencyMismatches)}
│ international contamination ${n(r.internationalContamination)}
│ discovered but not synced   ${n(r.missingFromSync)}
│ synced but not in sitemap   ${n(r.notInSitemap)}
│ not in All Products         ${n(r.notInAllProducts)}
└──────────────────────────────────────────────────────────────${errors.length ? `\n ERRORS:\n  - ${errors.join('\n  - ')}` : '\n ✓ no integrity errors'}`);
}

main().catch((e) => {
  console.error('[sync] ✗', e);
  process.exit(1);
});
