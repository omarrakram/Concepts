/**
 * npm run film30:render [-- --edit=edit-proof.mjs] [-- --stills=0,1.2,11.5] [-- --from=0 --to=1800]
 *
 * Draws the frames of an edit (default edit.mjs, the archived film) with the compositor
 * (compositor/, run in Chromium) and pipes them to FFmpeg:
 * H.264 High, yuv420p, CRF 16, 60 fps, 1080×1920. The takes must exist
 * (npm run film30:shoot). Audio is added by mux.mjs. Output goes to
 * out/showcase-30/ (gitignored); nothing is committed.
 * --stills=<seconds,...> writes PNG stills instead (QA).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../lib/chromium.mjs';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const EDIT = arg('edit', 'edit.mjs');
const { FPS, FRAMES, H, W, checkShots, loadTakes, makePlanner, NAME, TAKES_DIR, OUT_DIR, SOURCE_PUBLIC } = await import(`./${EDIT}`);
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT = resolve(ROOT, arg('out', OUT_DIR ?? 'out/showcase-30'));
const TAKES = TAKES_DIR ? resolve(ROOT, TAKES_DIR) : resolve(OUT, 'takes');
// V2 edits draw the site's own art (cursors, logos) from the website source checkout, not from this branch.
const PUBLIC = SOURCE_PUBLIC ? resolve(JSON.parse(readFileSync(resolve(ROOT, 'out/source/source-build.json'), 'utf8')).buildDir, '..', 'public') : resolve(ROOT, 'public');
const stills = arg('stills', null);
const from = Number(arg('from', '0'));
const to = Number(arg('to', String(FRAMES)));

const takes = loadTakes(TAKES);
checkShots(takes);
const planner = makePlanner(takes, { base: 'http://film.local' });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const browser = await launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.route('http://film.local/**', (route) => {
  const p = decodeURIComponent(new URL(route.request().url()).pathname);
  const file = p.startsWith('/takes/') ? resolve(TAKES, p.slice(7)) : p.startsWith('/public/') ? resolve(PUBLIC, p.slice(8)) : resolve(ROOT, 'scripts/showcase-30/compositor', p.slice(1));
  if (!existsSync(file)) return route.fulfill({ status: 404, body: 'missing' });
  return route.fulfill({ status: 200, contentType: TYPES[extname(file)] ?? 'application/octet-stream', body: readFileSync(file) });
});
await page.route(/^(?!http:\/\/film\.local)/, (r) => r.abort());
await page.goto('http://film.local/index.html');
await page.waitForFunction(() => window.__film?.ready);
await page.evaluate(() => window.__film.ready);

const draw = (n) => page.evaluate((plan) => window.__film.draw(plan), planner.plan(n));
const shotCanvas = () => page.locator('#film').screenshot({ type: 'png', animations: 'disabled' });

if (stills) {
  const dir = resolve(OUT, 'stills');
  mkdirSync(dir, { recursive: true });
  const { writeFileSync } = await import('node:fs');
  for (const s of stills.split(',').map(Number)) {
    const n = Math.min(FRAMES - 1, Math.round(s * FPS));
    await draw(n);
    const file = resolve(dir, `still-${String(n).padStart(4, '0')}-${planner.shotAt(n / FPS).id}.png`);
    writeFileSync(file, await shotCanvas());
    console.log(`[render] ${s}s (frame ${n}) → ${file}`);
  }
  await browser.close();
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
const VIDEO = resolve(OUT, NAME ? `${NAME}-video.mp4` : 'iys-internet-2006-30s-video.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2', '-g', '120', '-bf', '2', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', '-r', String(FPS), VIDEO], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
const t0 = Date.now();
for (let n = from; n < to; n++) {
  await draw(n);
  const png = await shotCanvas();
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (n % 120 === 0) console.log(`[render] ${n}/${to} ${planner.shotAt(n / FPS).id} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
ff.stdin.end();
await done;
await browser.close();
console.log(`[render] ✓ ${to - from} frames → ${VIDEO}`);
