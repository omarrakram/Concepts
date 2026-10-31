// npm run render:carousel [-- --only=1,3]: the three 4:5 carousel videos, in carousel order (and
// the clean music-player export) into OUT_DIR (out/instagram-carousel-final/), then a cover PNG
// per slide, one contact sheet of all three, the ordered manifest (npm run manifest) and the cue sheet.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
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
for (const c of CAROUSEL.filter((c) => !only || only.includes(c.slide))) {
  console.log(`\n▶ slide ${c.slide}: ${c.id} → ${OUT_DIR}/${c.file}`);
  step('node', ['scripts/render.mjs', c.id, `${OUT_DIR}/${c.file}`]);
  if (c.clean) {
    console.log(`▶ slide ${c.slide} (clean, no song): → ${OUT_DIR}/${c.clean.file}`);
    step('node', ['scripts/render.mjs', c.id, `${OUT_DIR}/${c.clean.file}`, `--props=${JSON.stringify(c.clean.props)}`]);
  }
  step(npx, ['remotion', 'still', 'src/index.ts', c.id, `${OUT_DIR}/covers/${c.cover.file}`, `--frame=${c.cover.frame}`, '--image-format=png', '--log=error']);
}
if (CAROUSEL.every((c) => existsSync(`${root}/${OUT_DIR}/${c.file}`))) {
  step('node', ['scripts/contact-sheet.mjs']);
  step('node', ['scripts/manifest.mjs']);
  writeFileSync(`${root}/${OUT_DIR}/CUES.txt`, spawnSync('node', ['scripts/print-cues.mjs'], { cwd: root, encoding: 'utf8' }).stdout);
  console.log(`cue sheet → ${OUT_DIR}/CUES.txt`);
} else console.log('\n(contact sheet + manifest skipped: not all three slides are rendered yet)');
