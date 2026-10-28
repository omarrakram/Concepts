// npm run qa:regression: re-render what must not have changed and compare it, byte for byte,
// with the archive of the first release (out/archive/original-38f0d3a/SHA256SUMS):
//   the teaser, the first cut of the film (HeroReelOriginal) and the six carousel stills.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sums = `${root}/out/archive/original-38f0d3a/SHA256SUMS`;
if (!existsSync(sums)) {
  console.error('no archive at out/archive/original-38f0d3a/ (it is made before the first re-render)');
  process.exit(2);
}
const want = Object.fromEntries(readFileSync(sums, 'utf8').trim().split('\n').map((l) => l.split(/\s+/).reverse()));
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const step = (args) => {
  const r = spawnSync('node', args, { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
step(['scripts/render.mjs', 'Teaser', 'out/qa/regression/msn-breakup-teaser.mp4', '--log=error']);
// the first release was rendered with an empty song slot, so the first cut is re-rendered without the song
step(['scripts/render.mjs', 'HeroReelOriginal', 'out/qa/regression/msn-breakup-reel.mp4', '--props={"song":false}', '--log=error']);
step(['scripts/render-stills.mjs', '--out=out/qa/regression/stills']);
let bad = 0;
for (const [name, hash] of Object.entries(want)) {
  const got = sha(`${root}/out/qa/regression/${name}`);
  const ok = got === hash;
  if (!ok) bad++;
  console.log(`${ok ? '✓ identical' : '✗ DIFFERENT'}  ${name}  ${got.slice(0, 16)}…`);
}
console.log(bad ? `\n${bad} file(s) differ from the first release` : '\nall identical to the first release');
process.exit(bad ? 1 : 0);
