/**
 * Films the real site: each take is a scripted, deterministic session
 * written as numbered frames + take.json (gitignored).
 *
 * V2 film (wide desktop, the locally reproduced conversion-upgrade source):
 *   node scripts/showcase-30/shoot.mjs --set=takes-v2 --takes=proof [--base=http://127.0.0.1:4317]
 *   needs out/source/source-build.json (source-build.mjs) and that build served on --base;
 *   refuses to film anything else. Output: out/v2-film/takes/<id>/.
 *
 * Previous film (archived, 864×1536): --set=takes, output out/showcase-30/takes/.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openTake } from './lib/stage.mjs';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const SET = arg('set', 'takes-v2');
const V2 = SET === 'takes-v2';
const BASE = arg('base', V2 ? 'http://127.0.0.1:4317' : 'http://127.0.0.1:4173');
const ALL = V2 ? ['proof'] : ['desktop-a', 'desktop-b', 'desktop-c', 'morph', 'mobile'];
const ids = arg('takes', ALL.join(',')).split(',');
const OUT = resolve(arg('out', V2 ? 'out/v2-film/takes' : 'out/showcase-30/takes'));
const SOURCE = resolve(arg('source', 'out/source/source-build.json'));
if (V2 && !existsSync(SOURCE)) throw new Error(`film: no source record at ${SOURCE}; run scripts/showcase-30/source-build.mjs first`);
const source = V2 ? JSON.parse(readFileSync(SOURCE, 'utf8')) : null;
if (source) console.log(`[film] source ${source.branch} @ ${source.sha} (${source.buildDir}) on ${BASE}`);

for (const id of ids) {
  const take = (await import(`./${SET}/${id}.mjs`)).default;
  const t0 = Date.now();
  const t = await openTake({ base: BASE, dir: resolve(OUT, id), source, ...take });
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
