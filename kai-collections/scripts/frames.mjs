/**
 * npm run frames -- 0.5 3.1 4.6 …   [--base=http://127.0.0.1:4173] [--out=output/frames]
 * Renders individual film frames (1080×1920) through the same seek path as the renderer — for QC.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { openFilm } from './lib/film-page.mjs';
import { ROOT, arg, startServer } from './lib/server.mjs';

const times = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
const out = resolve(ROOT, arg('out', 'output/frames'));
mkdirSync(out, { recursive: true });
const server = arg('base') ? { base: arg('base'), stop: () => {} } : await startServer({ port: 4319 });
const film = await openFilm(server.base);
for (const t of times) {
  await film.seek(t);
  const file = resolve(out, `t${t.toFixed(2).padStart(5, '0')}.png`);
  await film.page.screenshot({ path: file, timeout: 120000 });
  console.log(file);
}
await film.close();
server.stop();
