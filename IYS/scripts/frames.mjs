/**
 * Grab still frames from /showcase at exact times (QA, posters, thumbnails).
 *
 *   npm run dev                                   # in another terminal
 *   npm run frames                                # default QA times → out/frames/
 *   npm run frames -- 0.4 5.8 16.5                # custom times
 *
 * Env: BASE_URL (default http://127.0.0.1:5173), CHROMIUM (browser binary).
 */
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'out/frames');
const times = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const QA = [0.4, 1.4, 2.8, 4.3, 5.8, 7.2, 9.1, 10.8, 12.5, 14.4, 16.5];

const guessChromium = () =>
  process.env.CHROMIUM ?? ['/opt/pw-browsers/chromium'].find((p) => existsSync(p));

mkdirSync(out, { recursive: true });
const exe = guessChromium();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}/showcase?autoplay=0`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__iysShowcase?.ready, null, { timeout: 30000 });
for (const t of times.length ? times : QA) {
  await page.evaluate((s) => window.__iysShowcase.seek(s), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const file = resolve(out, `showcase-${t.toFixed(2).padStart(5, '0')}s.png`);
  await page.screenshot({ path: file });
  console.log(file);
}
await browser.close();
