// node scripts/contact-sheet.mjs <video.mp4> <out.jpg> [--every=15] [--cols=6] [--w=270]
//   a timestamped contact sheet: every Nth frame (default every 15 = 0.5 s) and the last frame,
//   each stamped with its frame number and timecode
// node scripts/contact-sheet.mjs --storyboard <video.mp4> <out.jpg>
//   the picture storyboard: one panel per beat of docs/02-storyboard.md, with its time and caption
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** One representative frame per beat (docs/02-storyboard.md). */
export const BEATS = [
  [48, '0.0-3.2 s', 'Something is playing'],
  [99, '3.2 s', 'The interruption'],
  [124, '3.5-4.7 s', 'Into the TV'],
  [144, '4.5-4.9 s', 'Through the glass'],
  [158, '5.0-5.5 s', 'It has a face'],
  [192, '5.5-6.8 s', 'The orange ball'],
  [209, '6.8-7.4 s', 'The spin'],
  [231, '7.4-7.9 s', 'The gulp'],
  [266, '8.0-9.7 s', 'What did it just eat?'],
  [312, '9.7-11.0 s', 'The turn'],
  [352, '11.0-12.0 s', 'IN YOUR SHOE'],
  [380, '12.1-13.0 s', 'The tease'],
  [432, '13.1-15.0 s', 'STAY TUNED.'],
];

const args = process.argv.slice(2);
const board = args.includes('--storyboard');
const [video, out] = args.filter((a) => !a.startsWith('--'));
const opt = (k, d) => Number(args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d);
if (!video || !out) {
  console.error('usage: node scripts/contact-sheet.mjs [--storyboard] <video.mp4> <out.jpg> [--every=15] [--cols=6] [--w=270]');
  process.exit(2);
}
const FONT = ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'].find(existsSync);
if (!FONT) throw new Error('no DejaVu font found for the frame stamps');

const probe = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames,r_frame_rate,width,height', '-of', 'json', video], { encoding: 'utf8' });
const st = JSON.parse(probe.stdout).streams[0];
const total = Number(st.nb_read_frames);
const [num, den] = st.r_frame_rate.split('/').map(Number);
const fps = num / den;
const w = opt('w', 270);
const h = Math.round((w * st.height) / st.width / 2) * 2;
const tc = (f) => `${String(Math.floor(f / fps / 60)).padStart(2, '0')}:${(f / fps % 60).toFixed(2).padStart(5, '0')}`;

const tmp = mkdtempSync(join(tmpdir(), 'iys-sheet-'));
const text = (name, s) => {
  const p = join(tmp, `${name}.txt`);
  writeFileSync(p, s);
  return p.replace(/\\/g, '/').replace(/:/g, '\\:');
};
const font = FONT.replace(/:/g, '\\:');
let frames;
const draw = [];
let cols;
let capH;
if (board) {
  frames = BEATS.map((b) => b[0]);
  cols = 7;
  capH = 64;
  BEATS.forEach(([f, time, title], i) => {
    const en = `enable='eq(n\\,${f})'`;
    draw.push(`drawtext=fontfile='${font}':textfile='${text(`t${i}`, `${i + 1}  ${title}`)}':x=10:y=${h + 12}:fontsize=15:fontcolor=white:${en}`);
    draw.push(`drawtext=fontfile='${font}':textfile='${text(`s${i}`, `${time}   f${f}`)}':x=10:y=${h + 38}:fontsize=13:fontcolor=0xffa040:${en}`);
  });
} else {
  const every = opt('every', 15);
  frames = [];
  for (let f = 0; f < total; f += every) frames.push(f);
  if (frames.at(-1) !== total - 1) frames.push(total - 1);
  cols = opt('cols', 6);
  capH = 30;
  for (const f of frames) draw.push(`drawtext=fontfile='${font}':textfile='${text(`f${f}`, `f${String(f).padStart(3, '0')}  ${tc(f)}`)}':x=8:y=${h + 8}:fontsize=14:fontcolor=white:enable='eq(n\\,${f})'`);
}
const rows = Math.ceil(frames.length / cols);
const graph = [
  `[0:v]scale=${w}:${h}:flags=lanczos,pad=${w}:${h + capH}:0:0:color=0x0b0d18`,
  ...draw,
  `select='${frames.map((f) => `eq(n\\,${f})`).join('+')}'`,
  `tile=${cols}x${rows}:padding=6:margin=6:color=0x05060c`,
].join(',');
const script = join(tmp, 'graph.txt');
writeFileSync(script, graph);
const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-filter_complex_script', script, '-frames:v', '1', '-q:v', '3', out], { stdio: 'inherit' });
rmSync(tmp, { recursive: true, force: true });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(`${board ? 'storyboard' : 'contact sheet'} (${frames.length} frames, ${cols} × ${rows}) → ${out}`);
