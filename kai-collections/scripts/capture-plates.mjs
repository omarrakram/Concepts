/**
 * npm run capture:plates [-- --base=http://127.0.0.1:4173]
 *
 * Photographs the FINISHED concept for the film: real pages, real interaction
 * states (gallery change, size chosen, item added to the concept bag), shot at
 * a phone viewport of 432×768 CSS px with a device scale of 2.5 — exactly one
 * 1080×1920 film frame per plate. Writes public/film/plates/*.jpg and a
 * manifest with the tap targets the film animates.
 *
 * Nothing here is a mock-up: every plate is a screenshot of the built site.
 */
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, SETTLE_CSS, HIDE_NAV_CSS } from './lib/browser.mjs';
import { ROOT, arg, startServer } from './lib/server.mjs';

const W = 432;
const H = 768;
const DPR = 2.5;
const OUT = resolve(ROOT, 'public/film/plates');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const server = arg('base') ? { base: arg('base'), stop: () => {} } : await startServer({ port: 4318 });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: true, isMobile: true, reducedMotion: 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const manifest = { w: W, h: H, dpr: DPR, capturedAt: new Date().toISOString(), plates: {}, taps: {} };

async function open(path, { hideNav = true } = {}) {
  await page.goto(server.base + path, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: SETTLE_CSS + (hideNav ? HIDE_NAV_CSS : '') });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}
async function scrollTo(y) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForTimeout(900);
}
async function shot(name) {
  const file = `${name}.jpg`;
  await page.screenshot({ path: resolve(OUT, file), type: 'jpeg', quality: 90, timeout: 120000 });
  console.log('[plates]', file);
  return `/film/plates/${file}`;
}
const top = (sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY, sel);
const box = (sel) => page.evaluate((s) => {
  if (!document.querySelector(s)) throw new Error('missing ' + s);
  const r = document.querySelector(s).getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}, sel);
/** element box in page coordinates (CSS px) */
const pageBox = (sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) throw new Error('missing ' + s);
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height };
}, sel);
/** consecutive, seamless viewport screens from y0 to y1 (CSS px) */
async function strip(name, y0, y1) {
  const out = [];
  for (let y = y0, i = 0; y < y1; y += H, i++) {
    await scrollTo(y);
    out.push(await shot(`${name}-${i}`));
  }
  return out;
}

// 1 — homepage below the hero: the KAI philosophy (the film draws the hero itself, live)
await open('/');
await page.waitForTimeout(1500);
{
  const y = await top('#philosophy');
  const end = await top('[data-testid=horizon]');
  manifest.plates.home = await strip('home', Math.round(y), Math.round(end));
  manifest.plates.homeHeight = Math.round(end - y);
}

// 2 — the three wardrobes
{
  const y = Math.round(await top('[data-testid=departments]'));
  const end = Math.round(await top('#atlas'));
  manifest.plates.deptsWomen = Math.round((await top('[data-testid=dept-women]')) - y);
  manifest.plates.depts = await strip('depts', y, end);
  manifest.plates.deptsHeight = end - y;
}

// 3 — device screens for the mobile composition
await scrollTo(Math.round(await top('#atlas')));
await page.waitForTimeout(1600);
manifest.plates.atlas = await shot('atlas');
await scrollTo(Math.round(await top('#build')));
manifest.plates.build = await shot('build');
await scrollTo(Math.round(await top('[data-testid=journal]')) + 260);
await page.waitForTimeout(800);
manifest.plates.journal = await shot('journal');

// 4 — the women's shop as one seamless scroll. The fixed nav and the sticky toolbar are
//     released for the strip; the film draws the real nav on top.
const STRIP_CSS = '.toolbar{position:static!important}.pdp__bar{display:none!important}';
await open('/shop/women');
await page.addStyleTag({ content: STRIP_CSS });
await page.waitForTimeout(1200);
manifest.plates.shop = await strip('shop', 0, Math.round(H * 2.2));
manifest.taps.card = await pageBox('[data-slug=black-playa-one-piece] .card__media');

// 5 — commerce: a real product page, real interactions (nav + sticky bar drawn by the film)
await open('/product/black-playa-one-piece');
await page.addStyleTag({ content: STRIP_CSS });
await page.waitForTimeout(900);
manifest.plates.pdp = await shot('pdp-0');
manifest.taps.next = await pageBox('[data-testid=gallery-next]');
await page.click('[data-testid=gallery-next]');
await page.waitForTimeout(900);
manifest.plates.pdpDetail = await shot('pdp-1');
await page.click('[data-testid=gallery-next]');
await page.waitForTimeout(900);
manifest.plates.pdpMaterial = await shot('pdp-2');
await scrollTo(H);
manifest.plates.pdpStrip = [manifest.plates.pdpMaterial, await shot('pdp-strip-1')];
{
  const y = Math.round((await top('.pdp__info')) - 40);
  manifest.plates.pdpInfoScroll = y;
  await scrollTo(y);
}
manifest.taps.size = await pageBox('.size:nth-child(2)');
manifest.taps.add = await pageBox('[data-testid=add-to-bag]');
await page.click('.size:nth-child(2)');
await page.waitForTimeout(400);
manifest.plates.pdpSize = await shot('pdp-size');
await page.click('[data-testid=add-to-bag]');
await page.waitForTimeout(1200);
manifest.plates.pdpBag = await shot('pdp-bag');

writeFileSync(resolve(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
await browser.close();
server.stop();
if (errors.length) {
  console.error('[plates] page errors:\n' + errors.join('\n'));
  process.exit(1);
}
console.log(`[plates] ✓ ${Object.keys(manifest.plates).length} plate groups → public/film/plates`);
