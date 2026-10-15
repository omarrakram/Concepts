/**
 * npm run capture:before [-- --origin=https://kaicollections.com] [-- --out=public/film/before]
 *
 * Captures the CURRENT kaicollections.com for the film's BEFORE section —
 * homepage, a collection and a product page — at the same phone viewport the
 * film uses (432×768 CSS px × 2.5 = 1080×1920). Pop-ups are dismissed, nothing
 * is restyled. The captures are third-party UI and are git-ignored: they stay
 * on the machine that renders the film.
 *
 * Needs network access to kaicollections.com. When it is unreachable this
 * script exits non-zero and the film falls back to an honest text view.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch } from './lib/browser.mjs';
import { ROOT, arg } from './lib/server.mjs';

const ORIGIN = arg('origin', 'https://kaicollections.com');
const OUT = resolve(ROOT, arg('out', 'public/film/before'));
const W = 432;
const H = 768;
const PAGES = [
  { key: 'home', path: '/', screens: 3 },
  { key: 'collection', path: '/collections/ss26-mens-swimwear', screens: 2 },
  { key: 'product', path: '/products/festival-del-mare-swim-shorts', screens: 2 },
];

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, locale: 'en-US' });
const page = await ctx.newPage();
try {
  const r = await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!r || !r.ok()) throw new Error(`HTTP ${r?.status()}`);
} catch (e) {
  console.error(`[before] ${ORIGIN} is not reachable from here (${e.message}). The film will use its text-view fallback.`);
  await browser.close();
  process.exit(2);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, '.gitkeep'), '');

async function dismiss() {
  await page.keyboard.press('Escape').catch(() => {});
  for (const sel of ['[aria-label*="close" i]', 'button:has-text("Close")', 'button:has-text("No thanks")', '.klaviyo-close-form', '[class*="popup"] [class*="close"]', 'button:has-text("Accept")']) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) await el.click({ timeout: 1500 }).catch(() => {});
  }
}

const manifest = { origin: ORIGIN, capturedAt: new Date().toISOString(), w: W, h: H, dpr: 2.5, pages: {} };
for (const p of PAGES) {
  await page.goto(ORIGIN + p.path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await dismiss();
  const shots = [];
  for (let i = 0; i < p.screens; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), i * H);
    await page.waitForTimeout(1200);
    await dismiss();
    const file = `${p.key}-${i}.jpg`;
    await page.screenshot({ path: resolve(OUT, file), type: 'jpeg', quality: 90 });
    shots.push(`/film/before/${file}`);
    console.log('[before]', file);
  }
  manifest.pages[p.key] = { url: ORIGIN + p.path, shots };
}
writeFileSync(resolve(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
await browser.close();
console.log('[before] ✓ live captures written to', OUT);
