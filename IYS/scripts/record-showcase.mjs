/**
 * Render /showcase to a 1080×1920, 60 fps, H.264 MP4 — frame-exact, no screen recorder.
 *
 * The timeline is deterministic, so every frame is produced by seeking to n/60 s
 * and screenshotting; frames are piped straight into ffmpeg. Output never depends
 * on machine speed.
 *
 *   npm run dev          # in another terminal (or: npm run build && npm run preview, BASE_URL=http://127.0.0.1:4173)
 *   npm run record       # → out/iys-concept.mp4
 *
 * Env: BASE_URL (default http://127.0.0.1:5173), FPS (60), FFMPEG (path to ffmpeg),
 *      CHROMIUM (path to a Chromium/Chrome binary if Playwright's own is not installed).
 * ffmpeg lookup: $FFMPEG → `ffmpeg` on PATH → the binary shipped with the
 * `imageio-ffmpeg` Python package (python3 -m pip install imageio-ffmpeg).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
const FPS = Number(process.env.FPS ?? 60);
const root = resolve(import.meta.dirname, '..');
const outDir = resolve(root, 'out');
const out = resolve(outDir, 'iys-concept.mp4');

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync('ffmpeg', ['-version']).status === 0) return 'ffmpeg';
  const py = spawnSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' });
  if (py.status === 0 && py.stdout.trim()) return py.stdout.trim();
  console.error('ffmpeg not found — set FFMPEG=/path/to/ffmpeg or `python3 -m pip install imageio-ffmpeg`.');
  process.exit(1);
}

const ffmpeg = findFfmpeg();
const chromiumPath = process.env.CHROMIUM ?? ['/opt/pw-browsers/chromium'].find((p) => existsSync(p));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch(chromiumPath ? { executablePath: chromiumPath } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}/showcase?autoplay=0`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__iysShowcase?.ready, null, { timeout: 30000 });
const duration = await page.evaluate(() => window.__iysShowcase.duration);
const total = Math.round(duration * FPS);

const enc = spawn(
  ffmpeg,
  ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', out],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);
const done = new Promise((res, rej) => enc.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`)))));

const t0 = Date.now();
for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.__iysShowcase.seek(t), i / FPS);
  // two animation frames so styles and images are painted before capture
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const png = await page.screenshot({ type: 'png' });
  if (!enc.stdin.write(png)) await new Promise((r) => enc.stdin.once('drain', r));
  if (i % 60 === 0) process.stdout.write(`\rframe ${i}/${total}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
enc.stdin.end();
await browser.close();
await done;
console.log(`\n${total} frames @ ${FPS} fps → ${out}`);
