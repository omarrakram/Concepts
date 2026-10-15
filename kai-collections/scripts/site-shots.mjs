/**
 * npm run shots [-- --base=http://127.0.0.1:4173]
 * Writes the deliverable screenshots of the built site to output/screenshots/.
 * Reveal choreography is settled first so every element is in its final state.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, SETTLE_CSS } from './lib/browser.mjs';
import { ROOT, arg, startServer } from './lib/server.mjs';

const OUT = resolve(ROOT, 'output/screenshots');
mkdirSync(OUT, { recursive: true });
const server = arg('base') ? { base: arg('base'), stop: () => {} } : await startServer({ port: 4321 });
const browser = await launch();

const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function shot(name, ctxOpts, path, prepare) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  await page.goto(server.base + path, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: SETTLE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  if (prepare) await prepare(page);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: resolve(OUT, `${name}.png`), timeout: 120000 });
  console.log('[shots]', `${name}.png`);
  await ctx.close();
}
const toSection = (sel, offset = 0) => async (page) => {
  await page.evaluate(
    ([s, o]) => {
      const el = document.querySelector(s);
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + o, behavior: 'instant' });
    },
    [sel, offset],
  );
  await page.waitForTimeout(1800);
};

await shot('desktop-home', DESKTOP, '/', async (p) => p.waitForTimeout(1800));
await shot('mobile-home', MOBILE, '/', async (p) => p.waitForTimeout(1800));
await shot('mens-collection', DESKTOP, '/shop/men');
await shot('womens-collection', DESKTOP, '/shop/women', toSection('[data-testid=toolbar]', -330));
await shot('product', DESKTOP, '/product/black-playa-one-piece', async (p) => {
  await p.click('.size:nth-child(2)');
});
await shot('horizon-interaction', DESKTOP, '/', async (p) => {
  await p.evaluate(() => {
    const el = document.querySelector('[data-testid=horizon]');
    window.scrollTo({ top: el.offsetTop + (el.offsetHeight - innerHeight) * 0.25, behavior: 'instant' });
  });
  await p.mouse.move(980, 420);
  await p.waitForTimeout(2200);
});
await shot('resort-atlas', DESKTOP, '/', async (p) => {
  await toSection('#atlas')(p);
  await p.click('[data-testid=mood-sunset]');
  await p.waitForTimeout(1800);
});
await shot('mobile-shop', MOBILE, '/shop/women', toSection('[data-testid=toolbar]', -120));
await browser.close();
server.stop();
