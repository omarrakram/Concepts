/**
 * npm run sync [-- --origin=https://kaicollections.com] [-- --fixture=dir] [-- --no-image-check] [-- --no-backdrops]
 *
 * Builds the concept's catalog DIRECTLY from KAI's public Shopify storefront:
 *
 *   1. /products.json (paged)              → every published product: title, type,
 *                                            variants (price, compare-at, availability),
 *                                            images, description
 *   2. /collections/<handle>/products.json → membership of the live SS26 collections
 *                                            that KAI's own navigation links to
 *   3. HEAD on each product's lead image   → the photograph actually resolves
 *   4. pixel rows of every square photo    → flat packshot backdrops (scripts/photo-backdrops.mjs)
 *
 * and writes
 *
 *   src/data/catalog.live.json         the current SS26 assortment the site renders
 *   research/catalog-reconciliation.json  the earlier search-index snapshot checked
 *                                         against the live store (current / listed /
 *                                         no longer listed)
 *
 * Photography is REFERENCED, never copied: image entries are paths on KAI's own
 * Shopify CDN (cdn.shopify.com) and the browser loads them from there. No image
 * file is downloaded into this repository. Product copy is reduced to factual
 * lines (composition, construction, fit, care); KAI's marketing paragraphs are
 * not republished.
 *
 * Node's built-in fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY=1, so when a
 * proxy is configured the script re-runs itself with that flag.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { writeCatalog } from './lib/catalog-file.mjs';
import { ROOT, arg } from './lib/server.mjs';

const ORIGIN = String(arg('origin', 'https://kaicollections.com')).replace(/\/$/, '');
const FIXTURE = arg('fixture');
const CHECK_IMAGES = !arg('no-image-check', false);
const BACKDROPS = !arg('no-backdrops', false);

/** KAI's live navigation (Men › Summer, Women › Summer, Kids) → concept departments. */
export const DEPARTMENTS = { men: 'ss26-mens', women: 'ss26-womens', kids: 'ss26-kids-swim' };
/** KAI sub-collections → concept groups. A product can sit in several. */
export const GROUPS = {
  swimwear: ['ss26-mens-swimwear', 'ss26-womens-swimwear', 'ss26-kids-swim'],
  linen: ['ss26-mens-linen', 'ss26-womens-linen'],
  knitwear: ['ss26-mens-knitwear'],
  shirts: ['ss26-mens-shirts'],
  tees: ['mens-t-shirts-ss26'],
  bottoms: ['ss26-mens-linen-pants', 'ss26-mens-linen-shorts', 'ss26-womens-pants'],
  tops: ['ss26-womens-tops'],
  'skirts-dresses': ['skirts-dresses'],
  'cover-ups': ['ss26-womens-cover-ups'],
  accessories: ['ss26-womens-accessories'],
  sets: ['ss26-mens-sets', 'ss26-womens-sets'],
};
/** Edits KAI merchandises separately. */
export const EDITS = { new: ['ss26-new-arrivals'] };
/** KAI's "Best sellers" collections (Men, Women) — their order is used for the Featured sort. */
export const RANKED = ['ss26-mens-copy', 'ss26-womens-copy'];

/* ── normalisation ─────────────────────────────────────────────────────────── */

const ENT = { '&amp;': '&', '&nbsp;': ' ', '&quot;': '"', '&#39;': "'", '&rsquo;': '’', '&ndash;': '–', '&mdash;': '—', '&lt;': '<', '&gt;': '>' };
const decode = (s) => s.replace(/&[a-z#0-9]+;/gi, (m) => ENT[m] ?? ' ');
const clean = (s) => decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Description → list items and paragraphs as plain lines. */
export function lines(html) {
  const h = String(html ?? '');
  // innermost list items only — KAI nests a whole list inside one <li> on some pages
  const items = [...h.matchAll(/<li[^>]*>((?:(?!<li)[\s\S])*?)<\/li>/gi)].map((m) => clean(m[1])).filter(Boolean);
  const paras = [...h.replace(/<ul[\s\S]*?<\/ul>/gi, '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .flatMap((m) => m[1].split(/<br\s*\/?>/i))
    .map(clean)
    .filter(Boolean);
  if (!items.length && !paras.length && h.trim()) return { items: [], paras: [clean(h)] };
  return { items, paras };
}

const titleCase = (s) =>
  s
    .toLowerCase()
    .replace(/(^|[\s\-(/])([a-z])/g, (_, a, b) => a + b.toUpperCase())
    .replace(/\b(And|Of|The|Del|By|With)\b/g, (w, _x, i) => (i === 0 ? w : w.toLowerCase()));

/** KAI titles with apostrophes, spacing and case made consistent ("women`s dusty taupe linen shirt"). */
export function cleanName(title) {
  const t = String(title).replace(/[`´]/g, '’').replace(/'/g, '’').replace(/\s+/g, ' ').trim();
  return t
    .split(' ')
    .map((w, i) => (/^[a-z]/.test(w) && !(i > 0 && /^(del|by|the|and|of|with|on)$/.test(w)) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
    .replace(/^(Women|Womens)\b(?!’)/, 'Women’s')
    .replace(/^Mens\b/, 'Men’s');
}

/** "100% Washed Linen and a relaxed lounge fit" → "100% Washed Linen"; "82% Nylon 18% Elastane" → "82% Nylon, 18% Elastane". */
export function cleanMaterial(s) {
  const parts = [...String(s).matchAll(/(\d{1,3})\s*%\s*([A-Za-z][A-Za-z\- ]*?)(?=\s*(?:[,/;.(]|\d{1,3}\s*%|\b(?:and|for|with|fabric|material|tank top)\b|$))/gi)];
  if (!parts.length) return null;
  return parts
    .map(([, n, m]) => `${n}% ${titleCase(m.trim().replace(/\s+/g, ' '))}`)
    .join(', ');
}

const COLOUR_WORDS = [
  'apple green', 'sage green', 'baby blue', 'baby pink', 'baby yellow', 'capri blue', 'sky blue', 'cobalt blue', 'sapphire blue',
  'dusty taupe', 'dusty grey', 'dusty cherry', 'dove grey', 'dark mocha', 'off-white', 'off white', 'charcoal', 'peppermint', 'mint', 'sand',
  'black', 'white', 'ivory', 'cream', 'stone', 'beige', 'taupe', 'mocha', 'espresso', 'brown', 'cumin', 'khaki', 'butter',
  'olive', 'matcha', 'pistachio', 'sage', 'green', 'teal', 'navy', 'blue', 'sky', 'sapphire', 'pink', 'fuchsia', 'coral',
  'rust', 'plum', 'purple', 'yellow', 'orange', 'grey', 'gray', 'pear', 'apple',
];
/** First colour named in the title, or null for a print name ("Festival del Mare"). */
export function colourOf(name) {
  const n = name.toLowerCase().replace(/[’']s\b/g, '');
  let best = null;
  for (const w of COLOUR_WORDS) {
    const i = n.search(new RegExp(`(^|\\s)${w.replace('-', '\\-')}(\\s|$)`));
    if (i >= 0 && (best == null || i < best.i || (i === best.i && w.length > best.w.length))) best = { i, w };
  }
  return best ? best.w.replace(' ', '-').replace('off-white', 'off-white').replace('gray', 'grey') : null;
}

const KIND_RULES = [
  [/\bmini\b|\bkid/i, 'kids-swim-short', (d) => d === 'kids'],
  [/swim\s*short|4 way stretch/i, 'swim-short'],
  [/one\s*piece|swimsuit/i, 'one-piece'],
  [/bikini top/i, 'bikini-top'],
  [/bikini bottom/i, 'bikini-bottom'],
  [/head\s*scarf|bandana/i, 'scarf'],
  [/sarong|pareo/i, 'sarong'],
  [/poncho|cape|cover\s*up|kaftan|kimono/i, 'cover-up'],
  [/dress/i, 'dress'],
  [/skirt/i, 'skirt'],
  [/over\s*shirt/i, 'overshirt'],
  [/cuban/i, 'cuban-shirt'],
  [/polo/i, 'polo'],
  [/long sleeve t|long-sleeve t/i, 'tee-long'],
  [/t-?shirt|\btee\b/i, 'tee'],
  [/shirt/i, 'shirt'],
  [/tank/i, 'tank'],
  [/sweat\s*pant|jogger/i, 'sweatpants'],
  [/pant|trouser/i, 'pants'],
  [/short/i, 'shorts'],
  [/sweater|cardigan|knit|crochet/i, 'knit'],
  [/\btop\b/i, 'top'],
  [/\bhat\b|\bcap\b|bucket/i, 'hat'],
];
export function kindOf(name, dept) {
  for (const [re, kind, when] of KIND_RULES) if (re.test(name) && (!when || when(dept))) return kind;
  return 'other';
}

/** The print/style name that links a family of products ("Yellow Zebra", "Black Maya"). */
export function familyOf(name, kind) {
  const n = name.replace(/^(Women’s|Men’s|Women|Men)\s+/i, '');
  if (kind === 'swim-short' || kind === 'kids-swim-short')
    return n.replace(/^Mini\s+/i, '').replace(/\s*Swim Shorts?.*$/i, '').trim();
  if (kind === 'bikini-top' || kind === 'bikini-bottom') return n.replace(/\s*Bikini (Top|Bottom)$/i, '').trim();
  return null;
}

/** Fabric family named in the title — shown only as "from the product name", never as a composition. */
export function fabricOf(name) {
  const m = name.match(/\b(linen|tencel|terry towel|crochet|knit|jaquard|jacquard|sparkle|mercerised cotton|cotton|seersucker|crinkle)\b/i);
  return m ? titleCase(m[1].replace(/jaquard/i, 'jacquard')) : null;
}

const shape = (raw) => (typeof raw.variants?.[0]?.price === 'number' ? 'js' : 'json');
/** Prices: /products/<h>.js gives integer cents; products.json gives decimal strings. */
export const money = (v, from) => {
  if (v == null || v === '') return null;
  const n = from === 'js' ? Number(v) / 100 : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

/** One Shopify product (either public shape) → one concept product. */
export function normalize(raw, ctx = {}) {
  const from = shape(raw);
  const name = cleanName(raw.title);
  const dept = ctx.dept ?? null;
  const kind = kindOf(name, dept);
  const opts = (raw.options ?? []).map((o) => (typeof o === 'string' ? o : o.name));
  const sizeIdx = opts.findIndex((o) => /^(size|sizes|age)$/i.test(o));
  const variants = raw.variants ?? [];
  const label = (v) => (sizeIdx >= 0 ? v[`option${sizeIdx + 1}`] : v.title) || 'One size';
  // KAI's labels, typographically tidied only ("M ( 32-34)" → "M (32-34)", "XL(36-38)" → "XL (36-38)", "one size" → "One size")
  const tidy = (l) =>
    String(l)
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/(\S)\(/g, '$1 (')
      .replace(/(\d)-\s+(\d)/g, '$1-$2')
      .replace(/^(one size|default title)$/i, 'One size');
  const sizes = variants.map((v) => ({
    label: tidy(label(v)),
    available: !!v.available,
    price: money(v.price, from),
  }));
  const sizesOut = () => sizes.map((s) => (s.price === price ? { label: s.label, available: s.available } : s));
  const live = sizes.filter((s) => s.available);
  const pool = (live.length ? live : sizes).map((s) => s.price).filter((x) => x != null);
  const price = pool.length ? Math.min(...pool) : null;
  const cmpAll = variants.map((v) => money(v.compare_at_price, from)).filter((x) => x != null);
  const compareAt = cmpAll.length && price != null && Math.max(...cmpAll) > price ? Math.max(...cmpAll) : null;
  const { items, paras } = lines(raw.body_html ?? raw.description);
  const matLine = items.find((l) => /\d{1,3}\s*%/.test(l)) ?? paras.find((l) => /\d{1,3}\s*%/.test(l));
  const material = matLine ? cleanMaterial(matLine) : null;
  const colour = colourOf(name);
  const model = [...items, ...paras].find((l) => /^model\b/i.test(l)) ?? null;
  const fit = [...items, ...paras].map((l) => l.match(/\b((?:wide leg )?(?:relaxed|regular|slim|oversized|loose|classic|boxy) fit)\b/i)?.[1]).find(Boolean) ?? null;
  const care = [...items, ...paras].find((l) => /\b(wash|tumble|iron|dry clean|rinse)\b/i.test(l) && l.length < 160) ?? null;
  // care and fit are shown in their own sections; a bullet that only repeats them is dropped
  const repeats = (l) => l === care || (fit && l.toLowerCase() === fit.toLowerCase());
  // a bare colour line ("Black") repeats the title; construction words keep short lines in
  const colourOnly = (l) => /^[A-Za-z\- ]{1,14}$/.test(l) && !/fit|lined|pocket|waist|cord|zip|button|collar/i.test(l);
  const details = items
    .filter((l) => l !== matLine && l.length < 140 && !/^(model|size tip)/i.test(l) && !colourOnly(l) && !repeats(l))
    .map((l) => l.replace(/\s*\.$/, ''))
    .slice(0, 6);
  const imgs = (raw.images ?? []).slice(0, 8).map((im) => {
    const o = typeof im === 'string' ? { src: im } : im;
    let src = String(o.src);
    if (src.startsWith('//')) src = `https:${src}`;
    return { src, w: o.width ?? null, h: o.height ?? null };
  });
  return {
    handle: raw.handle ?? null,
    name,
    dept,
    type: raw.product_type || raw.type || null,
    kind,
    family: familyOf(name, kind),
    colour,
    groups: ctx.groups ?? [],
    edits: ctx.edits ?? [],
    order: ctx.order ?? 0,
    rank: ctx.rank ?? null,
    price,
    compareAt,
    sizes: sizesOut(),
    stock: !variants.length ? 'unknown' : live.length ? 'in-stock' : 'sold-out',
    material,
    details,
    fabric: fabricOf(name),
    fit: fit ? fit.toLowerCase().replace(/^./, (c) => c.toUpperCase()) : null,
    model,
    care,
    published: (raw.published_at ?? '').slice(0, 10) || null,
    images: imgs,
  };
}

/* ── network ───────────────────────────────────────────────────────────────── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(url, tries = 4) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'kai-concept-sync/2 (+catalog check)' } });
      if (r.status === 404) return null;
      if (r.ok) return await r.json();
      if (i >= tries - 1) throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      if (i >= tries - 1) throw e;
    }
    await sleep(800 * 2 ** i);
  }
}
async function paged(path) {
  const all = [];
  for (let page = 1; ; page++) {
    const j = await getJSON(`${ORIGIN}${path}${path.includes('?') ? '&' : '?'}limit=250&page=${page}`);
    const got = j?.products ?? [];
    all.push(...got);
    if (got.length < 250) return all;
    await sleep(300);
  }
}
async function mapLimit(items, n, fn) {
  const out = new Array(items.length);
  let k = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (k < items.length) { const i = k++; out[i] = await fn(items[i], i); } }));
  return out;
}

/* ── main ──────────────────────────────────────────────────────────────────── */

async function main() {
  const fx = FIXTURE ? (f) => JSON.parse(readFileSync(resolve(FIXTURE, f), 'utf8')) : null;
  let all;
  try {
    all = fx ? fx('products.json').products : await paged('/products.json');
  } catch (e) {
    console.error(`[sync] ${ORIGIN} is not reachable from this machine (${e.cause?.code ?? e.message}). Nothing written.`);
    process.exit(2);
  }
  console.log(`[sync] ${all.length} published products on ${ORIGIN}`);
  const byHandle = new Map(all.map((p) => [p.handle, p]));

  const wanted = [...new Set([...Object.values(DEPARTMENTS), ...Object.values(GROUPS).flat(), ...Object.values(EDITS).flat(), ...RANKED])];
  const members = {};
  for (const c of wanted) {
    members[c] = fx ? fx(`collection-${c}.json`).products.map((p) => p.handle) : (await paged(`/collections/${c}/products.json`)).map((p) => p.handle);
    process.stdout.write(`  ${c}: ${members[c].length}\n`);
  }
  const inAny = (h, cols) => cols.some((c) => members[c]?.includes(h));

  const products = [];
  for (const [dept, col] of Object.entries(DEPARTMENTS)) {
    members[col].forEach((h, order) => {
      const raw = byHandle.get(h);
      if (!raw || products.some((p) => p.handle === h)) return;
      products.push(
        normalize(raw, {
          dept,
          order,
          groups: Object.entries(GROUPS).filter(([, cols]) => inAny(h, cols)).map(([g]) => g),
          edits: Object.entries(EDITS).filter(([, cols]) => inAny(h, cols)).map(([e]) => e),
          rank: RANKED.map((c) => members[c].indexOf(h)).find((i) => i >= 0) ?? null,
        }),
      );
    });
  }

  let imageCheck = null;
  if (CHECK_IMAGES && !fx) {
    const res = await mapLimit(products, 8, async (p) => {
      const im = p.images[0];
      if (!im) return { handle: p.handle, ok: false, status: 'no image' };
      const url = `${im.src}${im.src.includes('?') ? '&' : '?'}width=64`;
      try {
        const r = await fetch(url, { method: 'HEAD' });
        return { handle: p.handle, ok: r.ok && /^image\//.test(r.headers.get('content-type') ?? ''), status: r.status };
      } catch (e) {
        return { handle: p.handle, ok: false, status: e.message };
      }
    });
    imageCheck = { checked: res.length, ok: res.filter((r) => r.ok).length, failed: res.filter((r) => !r.ok) };
    console.log(`[sync] lead images resolving: ${imageCheck.ok}/${imageCheck.checked}`);
  }

  // Store image paths relative to the store's CDN folder (one shared prefix) to keep the file small.
  const prefixes = products.flatMap((p) => p.images.map((im) => im.src.match(/^https:\/\/cdn\.shopify\.com\/s\/files\/\d+\/\d+\/\d+\//)?.[0])).filter(Boolean);
  const cdn = Object.entries(prefixes.reduce((t, x) => ((t[x] = (t[x] ?? 0) + 1), t), {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  for (const p of products) for (const im of p.images) if (cdn && im.src.startsWith(cdn)) im.src = im.src.slice(cdn.length);

  const today = new Date().toISOString().slice(0, 10);
  const out = {
    checkedAt: today,
    origin: ORIGIN,
    method: 'storefront',
    cdn,
    note: 'Read directly from KAI’s public Shopify storefront endpoints. Images are references to KAI’s CDN and are not stored in this repository. Prices are EGP as listed on the checked date.',
    collections: { departments: DEPARTMENTS, groups: GROUPS, edits: EDITS, ranked: RANKED },
    counts: {
      published: all.length,
      products: products.length,
      inStock: products.filter((p) => p.stock === 'in-stock').length,
      soldOut: products.filter((p) => p.stock === 'sold-out').length,
      images: products.reduce((n, p) => n + p.images.length, 0),
    },
    imageCheck,
    backdrops: null,
    products,
  };
  if (BACKDROPS && !fx) {
    // Chromium reads pixels; a sync without a browser still succeeds and keeps the cover crop everywhere
    const { backdrops } = await import('./photo-backdrops.mjs');
    out.backdrops = await backdrops(out).catch((e) => (console.warn('[sync] backdrops skipped:', e.message), null));
  }
  writeCatalog(out);
  console.log(`[sync] ✓ ${products.length} products (${out.counts.inStock} in stock, ${out.counts.soldOut} sold out) → src/data/catalog.live.json`);

  // Reconcile the earlier search-index snapshot against the live store.
  const snapPath = resolve(ROOT, 'research/search-index-snapshot.json');
  if (existsSync(snapPath)) {
    const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
    const current = new Set(products.map((p) => p.handle));
    const byTitle = new Map(all.map((p) => [cleanName(p.title).toLowerCase(), p.handle]));
    const rows = snap.products.map((s) => {
      const handle = s.handle && byHandle.has(s.handle) ? s.handle : byTitle.get(cleanName(s.name).toLowerCase()) ?? null;
      const status = !handle ? 'not-listed' : current.has(handle) ? 'current-ss26' : 'listed-outside-ss26';
      const raw = handle ? byHandle.get(handle) : null;
      const n = raw ? normalize(raw) : null;
      return {
        slug: s.slug,
        name: s.name,
        indexedHandle: s.handle,
        liveHandle: handle,
        status,
        indexedPrice: s.price,
        livePrice: n?.price ?? null,
        liveStock: n?.stock ?? null,
      };
    });
    const tally = rows.reduce((t, r) => ((t[r.status] = (t[r.status] ?? 0) + 1), t), {});
    mkdirSync(resolve(ROOT, 'research'), { recursive: true });
    writeFileSync(
      resolve(ROOT, 'research/catalog-reconciliation.json'),
      JSON.stringify({ checkedAt: today, origin: ORIGIN, snapshotCheckedAt: snap.snapshot?.checkedAt, tally, rows }, null, 1) + '\n',
    );
    console.log(`[sync] search-index snapshot reconciled: ${JSON.stringify(tally)} → research/catalog-reconciliation.json`);
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const proxied = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxied && !process.env.NODE_USE_ENV_PROXY && !FIXTURE) {
    const r = spawnSync(process.execPath, process.argv.slice(1), {
      stdio: 'inherit',
      env: { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1' },
    });
    process.exit(r.status ?? 1);
  }
  main().catch((e) => {
    console.error('[sync] failed:', e);
    process.exit(1);
  });
}
