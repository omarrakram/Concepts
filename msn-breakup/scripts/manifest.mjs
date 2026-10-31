// npm run manifest: the slide order + export metadata (ffprobe) + SHA-256 of every
// delivered file → <OUT_DIR>/manifest.json and MANIFEST.md
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CAROUSEL, OUT_DIR } from './carousel-list.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
export function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-print_format', 'json', '-show_streams', '-show_format', file], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  const j = JSON.parse(r.stdout);
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  const [n, d] = v.r_frame_rate.split('/').map(Number);
  const g = (x, y) => (y ? g(y, x % y) : x);
  const k = g(v.width, v.height);
  return {
    duration: +Number(j.format.duration).toFixed(3),
    /** the video stream's own length (the container's can be a few ms longer: AAC pads its last frame) */
    videoDuration: +Number(v.duration).toFixed(3),
    width: v.width,
    height: v.height,
    aspect: `${v.width / k}:${v.height / k}`,
    fps: n / d,
    frames: Number(v.nb_read_frames),
    video: `${v.codec_name} (${v.profile})`,
    pix_fmt: v.pix_fmt,
    color: `${v.color_space ?? '?'} / ${v.color_range ?? '?'}`,
    audio: a ? `${a.codec_name} (${a.profile ?? ''})`.replace(' ()', '') : 'none',
    sample_rate: a ? Number(a.sample_rate) : null,
    channels: a ? a.channels : null,
    bitrate_kbps: Math.round(Number(j.format.bit_rate) / 1000),
    bytes: statSync(file).size,
    sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const entry = (file, extra) => (existsSync(`${root}/${file}`) ? { file, ...extra, ...probe(`${root}/${file}`) } : null);
  const slides = CAROUSEL.map((c) => entry(`${OUT_DIR}/${c.file}`, { slide: c.slide, composition: c.id, title: c.title, cover: `${OUT_DIR}/covers/${c.cover.file}` }));
  const extras = [
    ...CAROUSEL.filter((c) => c.clean).map((c) => entry(`${OUT_DIR}/${c.clean.file}`, { composition: c.id, title: `slide ${c.slide} without the song (to add a licensed track in the app)`, props: c.clean.props })),
    entry('out/msn-breakup-reel.mp4', { composition: 'HeroReel', title: 'the film, 9:16 master' }),
    entry('out/msn-breakup-teaser.mp4', { composition: 'Teaser', title: 'teaser, 9:16 (unchanged)' }),
  ].filter(Boolean);
  if (slides.some((s) => !s)) {
    console.error('a carousel video is missing: run npm run render:carousel');
    process.exit(1);
  }
  const manifest = { generated: new Date().toISOString(), order: slides.map((s) => s.file.split('/').at(-1)), slides, extras };
  writeFileSync(`${root}/${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
  const row = (s) => `| ${s.slide ?? '-'} | \`${s.file.split('/').at(-1)}\` | ${s.composition} | ${s.duration} s | ${s.width}×${s.height} (${s.aspect}) | ${s.fps} | ${s.frames} | ${s.video} | ${s.pix_fmt} | ${s.audio} ${s.sample_rate ?? ''} Hz | ${(s.bytes / 1e6).toFixed(2)} MB | \`${s.sha256.slice(0, 16)}…\` |`;
  const head = '| # | file | composition | duration | size | fps | frames | video | pix_fmt | audio | size | sha256 |\n| - | - | - | - | - | - | - | - | - | - | - | - |';
  const md = [
    '# MSN breakup: Instagram carousel',
    '',
    'Post the three videos as one carousel, in this order (all 4:5, 1080 × 1350, 30 fps):',
    '',
    ...slides.map((s) => `${s.slide}. \`${s.file.split('/').at(-1)}\`: ${s.title}`),
    '',
    head,
    ...slides.map(row),
    '',
    'Also rendered:',
    '',
    head,
    ...extras.map(row),
    '',
    'Full SHA-256 and every ffprobe field: `manifest.json`.',
    '',
  ].join('\n');
  writeFileSync(`${root}/${OUT_DIR}/MANIFEST.md`, md);
  console.log(md);
}
