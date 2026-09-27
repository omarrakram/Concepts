/**
 * Pull the real, public IN YOUR SHOE product data + imagery for the concept.
 *
 *   npm run fetch-assets              # products listed in scripts/cast.json
 *   npm run fetch-assets -- --discover   # also dump the public catalogue to .qa/catalogue.json
 *
 * Source: the storefront's public Shopify product endpoints
 * (https://inyourshoe.com/products/<handle>.js) — the same JSON the live
 * product pages read. Nothing private, nothing behind a login.
 *
 * Writes:
 *   public/iys/products/<handle>-<n>.webp   (resized locally, max 1400px)
 *   public/iys/<dir>/<name>.webp            (brand / campaign / stores / collabs, from cast.json "images")
 *   src/data/catalogue.generated.json       (verified fields only)
 *   .qa/SOURCES.generated.md                (url → file → date table for docs/SOURCES.md)
 *
 * Needs network access to inyourshoe.com and its CDN (behind an HTTP proxy, run
 * with NODE_USE_ENV_PROXY=1). Requests are sequential and paced, and a 429 is
 * retried after the storefront's Retry-After. Image conversion uses Pillow if
 * available (python3 -m pip install pillow), otherwise keeps the original file.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cast = JSON.parse(readFileSync(resolve(root, 'scripts/cast.json'), 'utf8'));
const ORIGIN = 'https://inyourshoe.com';
const today = new Date().toISOString().slice(0, 10);
const force = process.argv.includes('--force');
const discover = process.argv.includes('--discover');

// Egypt market, EGP — the storefront otherwise localises by IP.
const headers = {
  'User-Agent': 'Mozilla/5.0 (concept research; public storefront data)',
  Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
  Cookie: 'localization=EG; cart_currency=EGP',
};

const sources = [];
const log = (...a) => console.log('[iys]', ...a);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PACE = Number(process.env.PACE_MS ?? 6000);

async function get(url, as = 'json', tries = 5) {
  await wait(url.includes('/cdn/') || url.includes('cdn.shopify.com') ? 150 : PACE);
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30000) });
  if ((res.status === 429 || res.status >= 500) && tries > 0) {
    const after = Number(res.headers.get('retry-after')) || (res.status === 429 ? 30 : 10);
    console.warn(`[iys] ${res.status} — waiting ${after}s`);
    await wait(after * 1000);
    return get(url, as, tries - 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  if (as === 'json') return res.json();
  if (as === 'text') return res.text();
  return Buffer.from(await res.arrayBuffer());
}

const abs = (src) => (src.startsWith('//') ? `https:${src}` : src.startsWith('/') ? ORIGIN + src : src);
const sized = (src, w) => {
  const u = new URL(abs(src));
  u.searchParams.set('width', String(w));
  if (/\.heic$/i.test(u.pathname)) u.searchParams.set('format', 'jpg');
  return u.toString();
};

function toWebp(input, output, max = 1400, trim = false) {
  const py = `
import sys
from PIL import Image
im = Image.open(sys.argv[1]); im = im.convert('RGBA' if im.mode in ('RGBA','LA','P') else 'RGB')
if sys.argv[4] == '1' and im.mode == 'RGBA':
    bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if bb: im = im.crop(bb)
m = int(sys.argv[3]); r = min(1, m / max(im.size))
if r < 1: im = im.resize((round(im.size[0]*r), round(im.size[1]*r)), Image.LANCZOS)
im.save(sys.argv[2], 'WEBP', quality=86, method=6)
print(im.size[0], im.size[1])`;
  const r = spawnSync('python3', ['-c', py, input, output, String(max), trim ? '1' : '0'], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const [w, h] = r.stdout.trim().split(' ').map(Number);
  return { w, h };
}

async function saveImage(url, dir, name, max = 1400, trim = false) {
  mkdirSync(resolve(root, 'public/iys', dir), { recursive: true });
  const webp = resolve(root, 'public/iys', dir, `${name}.webp`);
  const rel = `/iys/${dir}/${name}.webp`;
  if (!force && existsSync(webp)) {
    sources.push({ url, file: rel });
    const dims = spawnSync('python3', ['-c', 'import sys;from PIL import Image;print(*Image.open(sys.argv[1]).size)', webp], { encoding: 'utf8' }).stdout.trim().split(' ').map(Number);
    return dims.length === 2 && dims[0] ? { src: rel, width: dims[0], height: dims[1] } : { src: rel };
  }
  const buf = await get(url, 'buf');
  const tmp = resolve(root, '.qa', `${name}${extname(new URL(url).pathname) || '.jpg'}`);
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, buf);
  const size = toWebp(tmp, webp, max, trim);
  if (!size) {
    const jpg = resolve(root, 'public/iys', dir, `${name}.jpg`);
    writeFileSync(jpg, buf);
    rmSync(tmp, { force: true });
    sources.push({ url, file: `/iys/${dir}/${name}.jpg` });
    return { src: `/iys/${dir}/${name}.jpg` };
  }
  rmSync(tmp, { force: true });
  sources.push({ url, file: rel });
  return { src: rel, width: size.w, height: size.h };
}

const money = (cents) => Math.round(cents) / 100;

async function product(entry) {
  const { handle, images: pick = [0, 1], max = 1400 } = entry;
  const url = `${ORIGIN}/products/${handle}`;
  const p = await get(`${url}.js`);
  const media = (p.media ?? []).filter((m) => m.media_type === 'image');
  const gallery = [];
  for (const [i, idx] of pick.entries()) {
    const m = media[idx];
    if (!m) continue;
    const saved = await saveImage(sized(m.src, max), 'products', `${handle}-${i + 1}`, max);
    gallery.push({ ...saved, alt: m.alt || p.title, sourceUrl: abs(m.src).split('?')[0] });
  }
  const sizeOpt = p.options.find((o) => /size/i.test(o.name));
  const colourOpt = p.options.find((o) => /colou?r/i.test(o.name));
  return {
    handle: p.handle,
    title: p.title,
    type: p.type || null,
    price: money(p.price),
    compareAtPrice: p.compare_at_price && p.compare_at_price > p.price ? money(p.compare_at_price) : null,
    currency: 'EGP',
    available: p.available,
    sizes: sizeOpt
      ? sizeOpt.values.map((v) => ({
          label: v,
          available: p.variants.some((x) => x[`option${sizeOpt.position}`] === v && x.available),
        }))
      : [],
    colours: colourOpt ? colourOpt.values : [],
    description: p.description,
    publishedAt: p.published_at ?? null,
    images: gallery,
    productUrl: url,
    sourceUrl: `${url}.js`,
    verifiedAt: today,
  };
}

async function main() {
  mkdirSync(resolve(root, '.qa'), { recursive: true });

  if (discover) {
    const all = [];
    for (let page = 1; page < 30; page++) {
      const { products } = await get(`${ORIGIN}/products.json?limit=250&page=${page}`);
      if (!products.length) break;
      all.push(
        ...products.map((p) => ({
          handle: p.handle,
          title: p.title,
          type: p.product_type,
          tags: p.tags,
          price: p.variants[0]?.price,
          images: p.images.map((i) => `${i.width}x${i.height}`),
        })),
      );
    }
    writeFileSync(resolve(root, '.qa/catalogue.json'), JSON.stringify(all, null, 1));
    log(`catalogue: ${all.length} products → .qa/catalogue.json`);
    // Public pages kept for reading copy / store addresses (not shipped).
    mkdirSync(resolve(root, '.qa/pages'), { recursive: true });
    for (const path of cast.pages ?? []) {
      try {
        const html = await get(`${ORIGIN}${path}`, 'text');
        writeFileSync(resolve(root, '.qa/pages', `${path.replace(/\W+/g, '_') || 'home'}.html`), html);
        log(`page ${path}`);
      } catch (e) {
        console.warn(`[iys] ✗ page ${path}: ${e.message}`);
      }
    }
  }

  const outFile = resolve(root, 'src/data/catalogue.generated.json');
  const previous = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : { products: [] };
  const out = { verifiedAt: today, origin: ORIGIN, currency: 'EGP', products: [], images: {} };
  for (const entry of cast.products) {
    try {
      const p = await product(entry);
      out.products.push(p);
      log(`✓ ${p.title} — ${p.price} EGP — ${p.images.length} img`);
    } catch (e) {
      const old = previous.products?.find((x) => x.handle === entry.handle);
      console.warn(`[iys] ✗ ${entry.handle}: ${e.message}${old ? ` — keeping data verified ${old.verifiedAt}` : ''}`);
      if (old) out.products.push(old);
    }
  }
  for (const img of cast.images ?? []) {
    try {
      out.images[img.id] = { ...(await saveImage(sized(img.url, img.max ?? 1600), img.dir, img.id, img.max ?? 1600, !!img.trim)), sourceUrl: img.url, page: img.page, alt: img.alt };
      log(`✓ ${img.dir}/${img.id}`);
    } catch (e) {
      console.warn(`[iys] ✗ image ${img.id}: ${e.message}`);
    }
  }
  writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n');
  writeFileSync(
    resolve(root, '.qa/SOURCES.generated.md'),
    ['| file | source url | retrieved |', '| --- | --- | --- |', ...sources.map((s) => `| \`public${s.file}\` | ${s.url.split('?')[0]} | ${today} |`)].join('\n') + '\n',
  );
  log(`${out.products.length}/${cast.products.length} products, ${Object.keys(out.images).length} images`);
}

main().catch((e) => {
  console.error(`[iys] ${e.message}\nThe storefront could not be reached — check network access to inyourshoe.com.`);
  process.exit(1);
});
