// Opens /showcase?capture at the film's native size (432×768 CSS × 2.5 = 1080×1920) and exposes a deterministic seek.
import { launch } from './browser.mjs';

export async function openFilm(base) {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}/showcase?capture`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 180000 });
  const duration = await page.evaluate(() => window.__duration);
  async function seek(t) {
    // __seek renders synchronously (flushSync + layout-effect WebGL draw). Any photograph that mounts at this
    // moment (KAI's product photos load from KAI's CDN) is decoded before the frame is taken; then two frames
    // so the compositor has the canvas.
    await page.evaluate(
      (x) =>
        new Promise((res) => {
          window.__seek(x);
          // every wait is bounded: an image that never starts loading must not stall the render
          const within = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
          Promise.all(
            [...document.images].map(async (i) => {
              if (!i.complete) await within(new Promise((r) => (i.addEventListener('load', r, { once: true }), i.addEventListener('error', r, { once: true }))), 20000);
              await within(i.decode().catch(() => {}), 5000);
            }),
          ).then(() => requestAnimationFrame(() => requestAnimationFrame(() => res())));
        }),
      t,
    );
  }
  return { browser, page, duration, seek, errors, close: () => browser.close() };
}
