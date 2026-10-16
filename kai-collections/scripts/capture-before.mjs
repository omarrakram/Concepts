/**
 * npm run capture:before [-- --origin=https://kaicollections.com]
 *
 * Films the CURRENT kaicollections.com for the BEFORE section — homepage, a
 * collection and a product page — exactly as a visitor sees it today:
 *
 *   phone   432 CSS px wide × 2.5 (the film's 1080 px), one tall capture per page → public/film/before/
 *   desktop 1440×900 CSS px, first screen + long page       → output/before/        (review / handoff)
 *
 * Pop-ups are dismissed; nothing is restyled. The captures are third-party UI
 * and KAI photography, so both folders are git-ignored and stay on the machine
 * that renders the film. A text record (URLs, times, viewports, titles, HTTP
 * status — no images) is written to research/before-capture.json.
 *
 * When the site is unreachable this script exits 2 and the film falls back to
 * its plainly labelled text view.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch } from './lib/browser.mjs';
import { ROOT, arg } from './lib/server.mjs';

const ORIGIN = String(arg('origin', 'https://kaicollections.com')).replace(/\/$/, '');
const FILM = resolve(ROOT, 'public/film/before');
const DESK = resolve(ROOT, 'output/before');
const W = 432;
const H = 768;
const PAGES = [
  { key: 'home', path: '/', screens: 3 },
  { key: 'collection', path: '/collections/ss26-mens-swimwear', screens: 2 },
  { key: 'product', path: '/products/festival-del-mare-swim-shorts', screens: 2 },
];

const browser = await launch();
const probe = await browser.newPage();
try {
  const r = await probe.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  if (!r || !r.ok()) throw new Error(`HTTP ${r?.status()}`);
} catch (e) {
  console.error(`[before] ${ORIGIN} is not reachable from here (${e.message}). The film will use its text-view fallback.`);
  await browser.close();
  process.exit(2);
}
await probe.close();

for (const dir of [FILM, DESK]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}
writeFileSync(resolve(FILM, '.gitkeep'), '');

async function dismiss(page) {
  await page.keyboard.press('Escape').catch(() => {});
  for (const sel of ['[aria-label*="close" i]:visible', 'button:has-text("Close")', 'button:has-text("No thanks")', '.klaviyo-close-form', '[class*="popup"] [class*="close"]', 'button:has-text("Accept")']) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) await el.click({ timeout: 1500 }).catch(() => {});
  }
}

/** wait until every image currently on screen has decoded (KAI's lazy images load as the page scrolls) */
async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page
    .evaluate(() =>
      Promise.all(
        [...document.images]
          .filter((i) => {
            const r = i.getBoundingClientRect();
            return r.bottom > 0 && r.top < innerHeight && r.width > 0;
          })
          .map((i) => (i.complete ? i.decode().catch(() => {}) : new Promise((r) => (i.addEventListener('load', r, { once: true }), setTimeout(r, 8000))))),
      ),
    )
    .catch(() => {});
  await page.waitForTimeout(600);
}

const capturedAt = new Date().toISOString();
const film = { origin: ORIGIN, capturedAt, w: W, h: H, dpr: 2.5, pages: {} };
const record = { origin: ORIGIN, capturedAt, note: 'Live captures of kaicollections.com. Images are kept local (git-ignored); this file records what was captured.', phone: {}, desktop: {} };

// ---- phone: the film's BEFORE plates ----
{
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, locale: 'en-US' });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    const res = await page.goto(ORIGIN + p.path, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
    await page.waitForTimeout(2500);
    await dismiss(page);
    // scroll through so KAI's lazy images load, then one tall capture: the sticky header appears once,
    // at the top, exactly as it sits on the phone (stacked screen captures would repeat it mid-scroll)
    for (let i = 0; i < p.screens; i++) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), i * H);
      await settle(page);
      await dismiss(page);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await settle(page);
    const file = `${p.key}.jpg`;
    const height = Math.min(p.screens * H, await page.evaluate(() => document.documentElement.scrollHeight));
    await page.screenshot({ path: resolve(FILM, file), type: 'jpeg', quality: 88, fullPage: true, clip: { x: 0, y: 0, width: W, height } });
    const shots = [`/film/before/${file}`];
    console.log('[before] phone', file, height + 'px');
    film.pages[p.key] = { url: ORIGIN + p.path, shots, height };
    record.phone[p.key] = { url: ORIGIN + p.path, status: res?.status() ?? null, title: await page.title(), viewport: `${W}×${H} @2.5`, files: shots.map((s) => s.split('/').pop()) };
  }
  await ctx.close();
}

// ---- desktop: first screen + long page (Chromium caps one screenshot at 16,384 px) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'en-US' });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    const res = await page.goto(ORIGIN + p.path, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
    await page.waitForTimeout(2500);
    await dismiss(page);
    await settle(page);
    await page.screenshot({ path: resolve(DESK, `desktop-${p.key}.jpg`), type: 'jpeg', quality: 86 });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 800) {
      await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await settle(page);
    const clip = Math.min(height, 16000);
    await page.screenshot({ path: resolve(DESK, `desktop-${p.key}-long.jpg`), type: 'jpeg', quality: 80, fullPage: true, clip: { x: 0, y: 0, width: 1440, height: clip } });
    record.desktop[p.key] = {
      url: ORIGIN + p.path,
      status: res?.status() ?? null,
      title: await page.title(),
      viewport: '1440×900 @1',
      pageHeight: height,
      files: [`desktop-${p.key}.jpg`, `desktop-${p.key}-long.jpg`],
    };
    console.log('[before] desktop', p.key, height + 'px');
  }
  await ctx.close();
}

writeFileSync(resolve(FILM, 'manifest.json'), JSON.stringify(film, null, 2));
writeFileSync(resolve(ROOT, 'research/before-capture.json'), JSON.stringify(record, null, 2) + '\n');
await browser.close();
console.log('[before] ✓ live captures →', FILM, 'and', DESK, '· record → research/before-capture.json');
