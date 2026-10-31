// npm run render:carousel [-- --only=1,3]: the three 4:5 carousel videos, in carousel order, into
// OUT_DIR (out/instagram-carousel-final-v2/): slides 1 and 3 rendered, slide 2 (the approved clean
// music-player master) copied unchanged with its cover, the SHA-256 checked; then a cover PNG per
// rendered slide, one contact sheet of all three, the ordered manifest (npm run manifest) and the cue sheet.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CAROUSEL, OUT_DIR } from './carousel-list.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',').map(Number);
const step = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
mkdirSync(`${root}/${OUT_DIR}/covers`, { recursive: true });
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
/** copy the first source whose SHA-256 is `want`, and check the copy */
const keep = (what, want, from, to) => {
  const source = from.find((f) => existsSync(`${root}/${f}`) && sha(`${root}/${f}`) === want);
  if (!source) {
    console.error(`✗ ${what}: no approved copy (SHA-256 ${want.slice(0, 16)}…) in ${from.join(', ')}. It is delivered unchanged, never re-rendered.`);
    process.exit(1);
  }
  copyFileSync(`${root}/${source}`, `${root}/${to}`);
  const got = sha(`${root}/${to}`);
  if (got !== want) {
    console.error(`✗ ${what}: the copy's SHA-256 ${got} is not ${want}`);
    process.exit(1);
  }
  console.log(`✓ ${what}: copied unchanged from ${source} (SHA-256 ${got})`);
};
for (const c of CAROUSEL.filter((c) => !only || only.includes(c.slide))) {
  if (c.keep) {
    console.log(`\n▶ slide ${c.slide}: ${c.id}, the approved master, unchanged → ${OUT_DIR}/${c.file}`);
    keep(`slide ${c.slide}`, c.keep.sha256, c.keep.from, `${OUT_DIR}/${c.file}`);
    keep(`slide ${c.slide} cover`, c.keep.cover.sha256, c.keep.cover.from, `${OUT_DIR}/covers/${c.cover.file}`);
    continue;
  }
  console.log(`\n▶ slide ${c.slide}: ${c.id} → ${OUT_DIR}/${c.file}`);
  step('node', ['scripts/render.mjs', c.id, `${OUT_DIR}/${c.file}`]);
  step(npx, ['remotion', 'still', 'src/index.ts', c.id, `${OUT_DIR}/covers/${c.cover.file}`, `--frame=${c.cover.frame}`, '--image-format=png', '--log=error']);
}
if (CAROUSEL.every((c) => existsSync(`${root}/${OUT_DIR}/${c.file}`))) {
  step('node', ['scripts/contact-sheet.mjs']);
  step('node', ['scripts/manifest.mjs']);
  writeFileSync(`${root}/${OUT_DIR}/CUES.txt`, spawnSync('node', ['scripts/print-cues.mjs'], { cwd: root, encoding: 'utf8' }).stdout);
  console.log(`cue sheet → ${OUT_DIR}/CUES.txt`);
} else console.log('\n(contact sheet + manifest skipped: not all three slides are rendered yet)');
