/**
 * npm run backdrops   (also the last step of `npm run sync`)
 *
 * KAI shoots most pieces 2:3, but photographs its swim shorts, sarongs and scarves as square
 * packshots on a plain backdrop. The concept's stages are 2:3, so a cover crop trims the sides of
 * those packshots. This step reads the top and bottom pixel rows of every square photograph in
 * src/data/catalog.live.json — in Chromium, straight from KAI's CDN; nothing is saved — and, when
 * both rows are one flat colour, records that colour as the image's `bg`. The site then shows the
 * photograph whole, letterboxed in its own backdrop (`.stage--fit`). Square on-model crops (KAI's
 * linen shorts) bleed off the frame, get no `bg`, and keep the cover crop.
 */
import { launch } from './lib/browser.mjs';
import { readCatalog, writeCatalog } from './lib/catalog-file.mjs';

export const isSquare = (im) => !!im.w && !!im.h && Math.abs(im.w / im.h - 1) < 0.05;

/** Adds `bg` to the flat-backdrop square photographs of `catalog` (mutates) and returns a summary. */
export async function backdrops(catalog) {
  const square = catalog.products.flatMap((p) => p.images.filter(isSquare));
  for (const im of square) delete im.bg;
  const url = (src) => {
    const u = /^https?:/.test(src) ? src : catalog.cdn + src;
    return `${u}${u.includes('?') ? '&' : '?'}width=360`;
  };
  const browser = await launch();
  let colours;
  try {
    const page = await browser.newPage();
    colours = await page.evaluate(async (urls) => {
      const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
      // a row is flat when every pixel sits within a few levels of its median colour
      const flat = (data, w, y) => {
        const px = [];
        for (let x = 0; x < w; x++) px.push([0, 1, 2].map((k) => data[(y * w + x) * 4 + k]));
        const med = [0, 1, 2].map((k) => px.map((p) => p[k]).sort((a, b) => a - b)[px.length >> 1]);
        return px.every((p) => p.every((v, k) => Math.abs(v - med[k]) <= 6)) ? med : null;
      };
      const read = async (u) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // KAI's CDN sends Access-Control-Allow-Origin: *
        img.src = u;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0);
        const { data } = g.getImageData(0, 0, c.width, c.height);
        const top = flat(data, c.width, 1);
        const bottom = flat(data, c.width, c.height - 2);
        if (!top || !bottom || top.some((v, k) => Math.abs(v - bottom[k]) > 6)) return null;
        return hex(top);
      };
      const out = new Array(urls.length).fill(null);
      let next = 0;
      await Promise.all(
        Array.from({ length: 8 }, async () => {
          while (next < urls.length) {
            const i = next++;
            out[i] = await read(urls[i]).catch(() => null);
          }
        }),
      );
      return out;
    }, square.map((im) => url(im.src)));
  } finally {
    await browser.close();
  }
  square.forEach((im, i) => colours[i] && (im.bg = colours[i]));
  const summary = { square: square.length, flat: colours.filter(Boolean).length };
  console.log(`[backdrops] ${summary.flat} of ${summary.square} square photographs sit on a flat backdrop → shown whole`);
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const catalog = readCatalog();
  catalog.backdrops = await backdrops(catalog);
  writeCatalog(catalog);
}
