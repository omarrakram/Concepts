/**
 * npm run render [-- --workers=3] [-- --plates] [-- --keep-frames]
 *
 * Produces output/kai-before-after-16s.mp4 end to end:
 *   1. builds the site and serves it (vite preview)
 *   2. photographs the film plates from the built site if missing (or with --plates), then rebuilds
 *   3. synthesises the soundtrack (scripts/make-audio.mjs)
 *   4. renders every frame t = f/60 for f = 0…959 through /showcase?capture (1080×1920)
 *   5. encodes H.264 High, yuv420p, 60 fps, CRF 16, + AAC 192k, faststart
 *   6. verifies the result (scripts/verify-video.mjs)
 *
 * Live BEFORE captures are used automatically when public/film/before/manifest.json
 * exists (npm run capture:before, needs access to kaicollections.com).
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { openFilm } from './lib/film-page.mjs';
import { ROOT, arg, startServer } from './lib/server.mjs';

const FPS = 60;
const FRAMES = 960;
const WORKERS = Number(arg('workers', 3));
const OUT = resolve(ROOT, 'output/kai-before-after-16s.mp4');
const FRAMES_DIR = resolve(ROOT, '.frames');
const AUDIO = resolve(ROOT, '.cache/film/soundtrack.wav');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const t0 = Date.now();
const log = (...a) => console.log(`[render ${((Date.now() - t0) / 1000).toFixed(0)}s]`, ...a);

let server = await startServer({ port: 4320, build: true });
if (arg('plates') || !existsSync(resolve(ROOT, 'public/film/plates/manifest.json'))) {
  log('capturing plates from the built site…');
  execFileSync('node', ['scripts/capture-plates.mjs', `--base=${server.base}`], { cwd: ROOT, stdio: 'inherit' });
  server.stop();
  server = await startServer({ port: 4320, build: true });
}
log(existsSync(resolve(ROOT, 'public/film/before/manifest.json')) ? 'BEFORE: live kaicollections.com captures' : 'BEFORE: text-view fallback (no live captures)');

execFileSync('node', ['scripts/make-audio.mjs'], { cwd: ROOT, stdio: 'inherit' });

rmSync(FRAMES_DIR, { recursive: true, force: true });
mkdirSync(FRAMES_DIR, { recursive: true });
let done = 0;
async function worker(w) {
  const film = await openFilm(server.base);
  for (let f = w; f < FRAMES; f += WORKERS) {
    await film.seek(f / FPS);
    await film.page.screenshot({ path: resolve(FRAMES_DIR, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 95, timeout: 180000 });
    if (++done % 60 === 0) log(`${done}/${FRAMES} frames`);
  }
  if (film.errors.length) throw new Error('page errors during render:\n' + film.errors.join('\n'));
  await film.close();
}
await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)));
server.stop();
log('frames done; encoding');

mkdirSync(resolve(ROOT, 'output'), { recursive: true });
execFileSync(
  ffmpeg,
  [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(FPS), '-start_number', '0', '-i', resolve(FRAMES_DIR, 'f%04d.jpg'),
    '-i', AUDIO,
    '-map', '0:v:0', '-map', '1:a:0',
    '-frames:v', String(FRAMES),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-r', String(FPS), '-g', '120', '-bf', '2',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-t', '16',
    '-movflags', '+faststart',
    OUT,
  ],
  { stdio: 'inherit' },
);
if (!arg('keep-frames')) rmSync(FRAMES_DIR, { recursive: true, force: true });
log('encoded →', OUT);
execSync('node scripts/verify-video.mjs', { cwd: ROOT, stdio: 'inherit' });
