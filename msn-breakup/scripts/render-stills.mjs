// npm run render:stills: every carousel slide plus the bonus sign-in still,
// 1080 × 1350 PNG, into out/stills/.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadTs } from './load-ts.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const { SLIDES, BONUS } = await loadTs(fileURLToPath(new URL('../src/story/slides.ts', import.meta.url)));
mkdirSync(`${root}/out/stills`, { recursive: true });

const jobs = [
  ...SLIDES.map((s, i) => ({ id: 'Carousel', props: { slide: i }, name: s.name })),
  { id: 'SignIn', props: {}, name: BONUS.name },
];
for (const job of jobs) {
  const out = `out/stills/${job.name}.png`;
  console.log(`→ ${out}`);
  const r = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['remotion', 'still', 'src/index.ts', job.id, out, `--props=${JSON.stringify(job.props)}`, '--log=error'],
    { cwd: root, stdio: 'inherit' },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log(`done: ${jobs.length} stills in out/stills/`);
