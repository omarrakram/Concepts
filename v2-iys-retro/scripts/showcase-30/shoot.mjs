/**
 * npm run film30:shoot [-- --takes=desktop-a,desktop-b] [-- --base=http://127.0.0.1:4173]
 *
 * Films the real site for the 30-second showcase: each take is a scripted,
 * deterministic session (see takes/*.mjs) written to
 * out/showcase-30/takes/<id>/ as numbered frames + take.json (gitignored).
 * Needs a running production build: `npm run build && npm run preview`.
 */
import { resolve } from 'node:path';
import { openTake } from './lib/stage.mjs';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const BASE = arg('base', 'http://127.0.0.1:4173');
const ALL = ['desktop-a', 'desktop-b', 'desktop-c', 'morph', 'mobile'];
const ids = arg('takes', ALL.join(',')).split(',');
const OUT = resolve(arg('out', 'out/showcase-30/takes'));

for (const id of ids) {
  const take = (await import(`./takes/${id}.mjs`)).default;
  const t0 = Date.now();
  const t = await openTake({ base: BASE, dir: resolve(OUT, id), ...take });
  try {
    await take.script(t);
  } catch (e) {
    console.error(`[film] take ${id} failed at frame ${t.frame}:`, e.message);
    await t.close({ id, failed: e.message });
    process.exit(1);
  }
  const info = await t.close({ id });
  console.log(`[film] ${id}: ${info.frames} frames (${info.unique} unique) in ${((Date.now() - t0) / 1000).toFixed(0)} s`, info.marks);
}
