// node scripts/render.mjs <CompositionId> <out.mp4> [--props=JSON]
// `remotion render` at the project's settings (CRF 17, see remotion.config.ts), except that an
// existing output is never silently overwritten: if <out> exists and no copy of it is archived
// yet, it is first copied to out/archive/previous/<name>-<sha256 prefix>.<ext>. (out/qa/ is
// scratch space for checks and is not archived.)
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const [id, out, ...rest] = process.argv.slice(2);
if (!id || !out) {
  console.error('usage: node scripts/render.mjs <CompositionId> <out.mp4> [--props=JSON]');
  process.exit(2);
}
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const archived = (hash) => {
  const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
  const dir = resolve(root, 'out/archive');
  return existsSync(dir) && walk(dir).some((f) => f.endsWith(extname(out)) && sha(f) === hash);
};
const target = resolve(root, out);
if (existsSync(target) && !target.startsWith(resolve(root, 'out/qa'))) {
  const hash = sha(target);
  if (!archived(hash)) {
    const keep = resolve(root, 'out/archive/previous', `${basename(out, extname(out))}-${hash.slice(0, 12)}${extname(out)}`);
    mkdirSync(dirname(keep), { recursive: true });
    copyFileSync(target, keep);
    console.log(`kept the previous ${out} → ${keep.slice(root.length)}`);
  }
}
mkdirSync(dirname(target), { recursive: true });
// CRF only applies to video (an audio-only render, e.g. out/qa/x.wav --codec=wav, takes none)
const crf = /\.(mp4|m4v|mov|mkv|webm)$/i.test(out) ? ['--crf=17'] : [];
const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['remotion', 'render', 'src/index.ts', id, out, ...crf, ...rest], { cwd: root, stdio: 'inherit' });
process.exit(r.status ?? 1);
