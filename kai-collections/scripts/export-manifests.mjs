/**
 * npm run manifests
 * Writes research/product-manifest.json and research/asset-manifest.json from the live
 * catalog snapshot (src/data/catalog.live.json), the campaign list (src/data/media.ts)
 * and the reconciliation file, so the research never drifts from what the site renders.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT } from './lib/server.mjs';

const live = JSON.parse(readFileSync(resolve(ROOT, 'src/data/catalog.live.json'), 'utf8'));
const rec = JSON.parse(readFileSync(resolve(ROOT, 'research/catalog-reconciliation.json'), 'utf8'));
const abs = (src) => (/^https?:/.test(src) ? src : live.cdn + src);

const products = live.products.map((p) => ({
  handle: p.handle,
  name: p.name,
  department: p.dept,
  kaiProductType: p.type,
  garment: p.kind,
  groups: p.groups,
  newArrival: p.edits.includes('new'),
  officialUrl: `${live.origin}/products/${p.handle}`,
  currency: 'EGP',
  price: p.price,
  compareAtPrice: p.compareAt,
  sizes: p.sizes,
  stock: p.stock,
  composition: p.material,
  details: p.details,
  fit: p.fit,
  care: p.care,
  photographs: { count: p.images.length, lead: abs(p.images[0].src) },
  compositionStated: !!p.material,
}));
const verification = {
  method: 'direct — KAI’s public Shopify storefront endpoints (products.json, collections/<handle>/products.json)',
  checkedAt: live.checkedAt,
  name: 'verified (products.json title; apostrophes/case normalised)',
  url: 'verified (handle from products.json and SS26 collection membership)',
  price: 'verified on the snapshot date — not live',
  sizes: 'verified per variant, with availability on the snapshot date; labels whitespace-normalised',
  composition: 'verified from the product description where KAI states one (compositionStated)',
  photography: 'KAI’s own, referenced from KAI’s CDN; every lead image checked to resolve',
  usageRestrictions: 'Factual product data cited for an unofficial concept. Photographs are KAI’s; referenced by URL, not stored in this repository.',
};

const by = (k) => Object.fromEntries([...new Set(products.map((p) => p[k]))].map((v) => [v, products.filter((p) => p[k] === v).length]));
const head = JSON.stringify(
  {
      brand: 'KAI COLLECTIONS',
      storefront: live.origin,
      snapshot: { checkedAt: live.checkedAt, method: live.method, collections: live.collections, note: live.note },
      verification,
      totals: {
        publishedOnKai: live.counts.published,
        products: products.length,
        byDepartment: by('department'),
        inStock: live.counts.inStock,
        soldOut: live.counts.soldOut,
        onSale: products.filter((p) => p.compareAtPrice != null).length,
        withComposition: products.filter((p) => p.compositionStated).length,
        photographs: live.counts.images,
        leadImagesResolving: live.imageCheck ? `${live.imageCheck.ok}/${live.imageCheck.checked}` : 'not checked',
      },
      historical: {
        note: 'The earlier search-index snapshot (56 products, ' + rec.snapshotCheckedAt + ') checked against the live store. Only current SS26 products are presented as current.',
        tally: rec.tally,
        file: 'research/catalog-reconciliation.json',
      },
  },
  null,
  1,
);
// one product per line: readable diffs between syncs
writeFileSync(
  resolve(ROOT, 'research/product-manifest.json'),
  head.replace(/\n}$/, ',\n "products": [\n') + products.map((p) => '  ' + JSON.stringify(p)).join(',\n') + '\n ]\n}\n',
);

// campaign images from src/data/media.ts (parsed, not executed)
const media = readFileSync(resolve(ROOT, 'src/data/media.ts'), 'utf8');
const campaign = [...media.matchAll(/id: '([^']+)',\s*src: '([^']+)',\s*w: (\d+),\s*h: (\d+),\s*usedOn: '([^']+)'/g)].map(([, id, src, w, h, usedOn]) => ({
  id,
  url: live.cdn + src,
  width: Number(w),
  height: Number(h),
  usedOnKai: usedOn,
}));
const logo = media.match(/src: CDN \+ '([^']+)'/)[1];
const before = existsSync(resolve(ROOT, 'research/before-capture.json')) ? JSON.parse(readFileSync(resolve(ROOT, 'research/before-capture.json'), 'utf8')) : null;

const assets = {
  generatedAt: live.checkedAt,
  summary:
    'No KAI photograph, logo file, site capture or film is stored in this repository. KAI’s photographs and logo are referenced by URL from KAI’s own CDN; everything else is rendered in code or is this concept’s own work. Media that captures KAI’s photography is generated locally and delivered separately.',
  rights:
    'KAI’s logo and photographs belong to KAI Collections. They are shown for an unofficial proposal; public hosting needs KAI’s permission. `VITE_KAI_MEDIA=off npm run build` produces a build without any KAI-hosted media.',
  kaiAssets: [
    { slot: 'Official logo', status: 'referenced', url: live.cdn + logo, usedIn: 'nav, mobile menu, footer, finale, film; WebGL horizon draws its KAI letters', fallback: 'typeset stand-in, labelled as not KAI’s logo' },
    { slot: 'Product photography', status: 'referenced', count: live.counts.images, products: products.length, usedIn: 'cards, gallery + close-up, quick view, search, bag, saved, sets, related, builder, atlas, edit, horizon, journal' },
    { slot: 'Campaign photography (kaicollections.com homepage)', status: 'referenced', count: campaign.length, images: campaign, usedIn: 'escape doors, departments, mega menu, journal, lookbook, stores' },
    {
      slot: 'Live captures of kaicollections.com (film BEFORE)',
      status: before ? 'captured locally, git-ignored' : 'not captured on this machine',
      capturedAt: before?.capturedAt ?? null,
      pages: before ? Object.values(before.phone).map((p) => p.url) : [],
      record: 'research/before-capture.json',
    },
  ],
  generatedLocally: [
    { asset: 'Film plates (screenshots of this concept, showing KAI photography)', path: 'public/film/plates/', command: 'npm run capture:plates', committed: false },
    { asset: 'BEFORE captures (phone + desktop)', path: 'public/film/before/, output/before/', command: 'npm run capture:before', committed: false },
    { asset: 'Film MP4 (1080×1920, 60 fps, 16 s)', path: 'output/kai-before-after-16s.mp4', command: 'npm run render', committed: false },
    { asset: 'Site screenshots and contact sheet', path: 'output/screenshots/, output/showcase-contact-sheet.png', command: 'npm run shots, npm run verify:video', committed: false },
  ],
  projectAssets: [
    { asset: 'Seascape (sky, sun, sea, sand; KAI logo letters standing on the horizon)', kind: 'WebGL shader', file: 'src/gl/sea.ts', origin: 'original code', rights: 'project (logo letters are KAI’s, loaded at runtime)' },
    { asset: 'Concept sketches (optional “Sketch” view, 19 garment types)', kind: 'SVG', file: 'src/components/GarmentFlat.tsx', origin: 'original drawings', rights: 'project' },
    { asset: 'Whitewashed arches', kind: 'SVG', file: 'src/home/Horizon.tsx', origin: 'original drawing', rights: 'project' },
    { asset: 'Fraunces Variable', kind: 'font', file: '@fontsource-variable/fraunces', origin: 'Undercase Type', rights: 'SIL Open Font License 1.1' },
    { asset: 'Jost Variable', kind: 'font', file: '@fontsource-variable/jost', origin: 'indestructible type*', rights: 'SIL Open Font License 1.1' },
    { asset: 'Favicon', kind: 'SVG', file: 'public/favicon.svg', origin: 'original', rights: 'project' },
    { asset: 'Film soundtrack', kind: 'synthesised audio', file: 'scripts/make-audio.mjs', origin: 'original code, no samples', rights: 'project' },
  ],
};
writeFileSync(resolve(ROOT, 'research/asset-manifest.json'), JSON.stringify(assets, null, 2) + '\n');
console.log(`[manifests] ✓ ${products.length} products, ${campaign.length} campaign images, logo referenced`);
