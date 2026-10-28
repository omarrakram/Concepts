// One contact sheet of all three carousel videos (key moments, timecoded), made from the
// rendered MP4s themselves: out/instagram-carousel/contact-sheet.png
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CAROUSEL, OUT_DIR } from './carousel-list.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const font = `${root}/public/fonts/wine-tahoma.ttf`;
/** seconds of each slide's key moments */
const MOMENTS = {
  // the opening (today's screen, the glitch, the crash, the XP loading bar, "welcome"), then the film (+4.8 s)
  1: [0.4, 1.9, 2.5, 3.2, 4.1, 4.8 + 2.0, 4.8 + 14.8, 4.8 + 24.9, 4.8 + 31.45, 4.8 + 34.95],
  2: [0.2, 1.3, 1.9, 2.3, 3.0, 3.8, 4.4, 4.93, 5.7, 8.87],
  3: [0.2, 0.8, 1.1, 1.4, 1.7, 2.1, 77 / 30, 78 / 30, 5.0, 12.77],
};
const tmp = `${root}/out/qa/sheet-rows`;
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const ff = (args) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
};
const rows = [];
for (const c of CAROUSEL) {
  const video = `${root}/${OUT_DIR}/${c.file}`;
  if (!existsSync(video)) {
    console.error(`missing ${OUT_DIR}/${c.file}: run npm run render:carousel first`);
    process.exit(1);
  }
  const frames = MOMENTS[c.slide].map((s) => Math.round(s * 30));
  const select = frames.map((f) => `eq(n\\,${f})`).join('+');
  const label = `${c.slide}. ${c.file}`.replaceAll(':', '\\:');
  const row = `${tmp}/row-${c.slide}.png`;
  ff([
    '-i', video,
    '-vf',
    [
      `select='${select}'`,
      'scale=216:270',
      `drawtext=fontfile=${font}:ft_load_flags=no_bitmap:text='%{pts\\:hms} · f%{n}':x=6:y=h-22:fontsize=15:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4`,
      'tile=10x1:padding=4:margin=4:color=white',
      `pad=iw:ih+30:0:30:white`,
      `drawtext=fontfile=${font}:ft_load_flags=no_bitmap:text='${label}':x=8:y=8:fontsize=18:fontcolor=black`,
    ].join(','),
    '-frames:v', '1', '-fps_mode', 'passthrough', row,
  ]);
  rows.push(row);
}
const out = `${root}/${OUT_DIR}/contact-sheet.png`;
ff([...rows.flatMap((r) => ['-i', r]), '-filter_complex', `${rows.map((_, i) => `[${i}]`).join('')}vstack=inputs=${rows.length}`, out]);
console.log(`contact sheet → ${OUT_DIR}/contact-sheet.png`);
