/**
 * npm run film30:qa
 * Verifies the EXPORTED file (not the timeline config) and writes the
 * supporting deliverables next to it in out/showcase-30/:
 *   validation.json + VALIDATION.md  ffprobe streams, exact frame count, black /
 *                                    frozen-frame scan, loudness, first/last frame
 *   contact-sheet.jpg                one frame per second, timestamped
 *   scene-sheet.jpg                  the first frame of every shot, timestamped
 *   cover-1080x1920.png              the hero frame
 *   poster-1080x1350.jpg, thumbnail-540x960.jpg
 *   frame-first.png, frame-last.png
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { FPS, FRAMES, SHOTS } from './edit.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT = resolve(ROOT, 'out/showcase-30');
const FILE = resolve(OUT, 'iys-internet-2006-30s-1080x1920.mp4');
const TMP = resolve(OUT, 'qa-frames');
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')}\n${r.stderr}`);
  return r;
};

// ── ffprobe ──
const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', FILE]).stdout);
const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');

// ── black / frozen scan ──
const black = run('ffmpeg', ['-hide_banner', '-nostats', '-i', FILE, '-vf', 'blackdetect=d=0.05:pix_th=0.10:pic_th=0.98', '-an', '-f', 'null', '-']).stderr;
const blackRanges = [...black.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
const frozen = run('ffmpeg', ['-hide_banner', '-nostats', '-i', FILE, '-vf', 'freezedetect=n=0.0008:d=0.75', '-an', '-f', 'null', '-']).stderr;
const frozenRanges = [...frozen.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_end: ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
// per-frame luma extremes: any fully black/white frame?
const sig = run('ffmpeg', ['-hide_banner', '-nostats', '-i', FILE, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-an', '-f', 'null', '-']).stderr;
const yavg = [...sig.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));

// ── loudness of the delivered AAC track ──
const loud = run('ffmpeg', ['-hide_banner', '-nostats', '-i', FILE, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr;
const sum = loud.slice(loud.lastIndexOf('Summary:'));
const lufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(sum)?.[1]);
const tp = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(sum)?.[1]);
const silence = run('ffmpeg', ['-hide_banner', '-nostats', '-i', FILE, '-vn', '-af', 'silencedetect=n=-60dB:d=0.3', '-f', 'null', '-']).stderr;
const silentRanges = [...silence.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);

// ── frames ──
const grab = (frame, file) => run('ffmpeg', ['-v', 'error', '-y', '-i', FILE, '-vf', `select=eq(n\\,${frame})`, '-vsync', '0', '-frames:v', '1', file]);
grab(0, resolve(OUT, 'frame-first.png'));
grab(FRAMES - 1, resolve(OUT, 'frame-last.png'));
const label = (w, text) => Buffer.from(`<svg width="${w}" height="30"><rect width="${w}" height="30" fill="#000" opacity="0.75"/><text x="8" y="21" font-size="18" fill="#ffe25a" font-family="DejaVu Sans Mono">${text}</text></svg>`);
async function sheet(items, out, cols, tw) {
  const th = Math.round((tw * 16) / 9);
  const tiles = [];
  for (const [k, it] of items.entries()) {
    const f = resolve(TMP, `s-${it.frame}.png`);
    grab(it.frame, f);
    tiles.push({ input: await sharp(f).resize(tw, th).composite([{ input: label(tw, it.label), left: 0, top: 0 }]).toBuffer(), left: (k % cols) * (tw + 6), top: Math.floor(k / cols) * (th + 6) });
  }
  await sharp({ create: { width: cols * (tw + 6), height: Math.ceil(items.length / cols) * (th + 6), channels: 3, background: '#1a1a1a' } }).composite(tiles).jpeg({ quality: 86 }).toFile(out);
}
const ts = (n) => `${String(Math.floor(n / FPS / 60)).padStart(2, '0')}:${(n / FPS % 60).toFixed(2).padStart(5, '0')} f${n}`;
await sheet(Array.from({ length: 30 }, (_, s) => ({ frame: s * FPS + 30, label: ts(s * FPS + 30) })), resolve(OUT, 'contact-sheet.jpg'), 6, 240);
await sheet(SHOTS.map((s) => ({ frame: Math.round(s.t0 * FPS), label: `${ts(Math.round(s.t0 * FPS))} ${s.id}` })), resolve(OUT, 'scene-sheet.jpg'), 7, 220);

// ── cover / poster / thumbnail (from the delivered file) ──
const coverFrame = Math.round(28.8 * FPS);
grab(coverFrame, resolve(OUT, 'cover-1080x1920.png'));
await sharp(resolve(OUT, 'cover-1080x1920.png')).extract({ left: 0, top: 420, width: 1080, height: 1350 }).jpeg({ quality: 90, mozjpeg: true }).toFile(resolve(OUT, 'poster-1080x1350.jpg'));
await sharp(resolve(OUT, 'cover-1080x1920.png')).resize(540, 960).jpeg({ quality: 88, mozjpeg: true }).toFile(resolve(OUT, 'thumbnail-540x960.jpg'));
rmSync(TMP, { recursive: true, force: true });

// ── verdicts ──
const fps = v.r_frame_rate.split('/').map(Number);
const checks = {
  container: probe.format.format_name.includes('mp4'),
  duration30: Math.abs(Number(probe.format.duration) - 30) < 0.03,
  videoDuration30: Math.abs(Number(v.duration) - 30) < 1e-6,
  frames1800: Number(v.nb_read_frames) === FRAMES,
  size1080x1920: v.width === 1080 && v.height === 1920,
  fps60: fps[0] / fps[1] === 60,
  h264: v.codec_name === 'h264',
  yuv420p: v.pix_fmt === 'yuv420p',
  audioPresent: !!a && a.codec_name === 'aac' && Number(a.sample_rate) === 48000 && a.channels === 2,
  audioDuration30: !!a && Math.abs(Number(a.duration) - 30) < 0.03,
  noBlackRuns: blackRanges.length === 0,
  noFullyBlackFrame: yavg.length === FRAMES && Math.min(...yavg) > 16.5,
  loudness: Math.abs(lufs + 14) <= 1,
  truePeakUnder1: tp <= -1,
};
const report = {
  file: FILE.replace(ROOT, ''),
  sizeBytes: Number(probe.format.size),
  formatDuration: Number(probe.format.duration),
  bitRate: Number(probe.format.bit_rate),
  video: { codec: v.codec_name, profile: v.profile, level: v.level, pix_fmt: v.pix_fmt, width: v.width, height: v.height, r_frame_rate: v.r_frame_rate, avg_frame_rate: v.avg_frame_rate, duration: Number(v.duration), nb_frames: Number(v.nb_frames), nb_read_frames: Number(v.nb_read_frames), bit_rate: Number(v.bit_rate), color: [v.color_primaries, v.color_transfer, v.color_space].join('/') },
  audio: a ? { codec: a.codec_name, profile: a.profile, sample_rate: Number(a.sample_rate), channels: a.channels, duration: Number(a.duration), bit_rate: Number(a.bit_rate) } : null,
  loudness: { integratedLufs: lufs, truePeakDbtp: tp, silentRanges },
  blackRanges,
  frozenRanges,
  luma: { min: Math.min(...yavg), max: Math.max(...yavg), darkestFrame: yavg.indexOf(Math.min(...yavg)) },
  checks,
  pass: Object.values(checks).every(Boolean),
};
writeFileSync(resolve(OUT, 'validation.json'), JSON.stringify(report, null, 2));
const md = [
  '# IYS INTERNET 2006 · 30 s showcase · export validation',
  '',
  `File: \`${report.file}\` (${(report.sizeBytes / 1e6).toFixed(1)} MB, ${(report.bitRate / 1e6).toFixed(1)} Mb/s)`,
  '',
  '| Check | Result |',
  '| --- | --- |',
  ...Object.entries(checks).map(([k, ok]) => `| ${k} | ${ok ? 'PASS' : 'FAIL'} |`),
  '',
  '```json',
  JSON.stringify({ format: { duration: report.formatDuration }, video: report.video, audio: report.audio, loudness: report.loudness, blackRanges, frozenRanges, luma: report.luma }, null, 2),
  '```',
  '',
  `Overall: **${report.pass ? 'PASS' : 'FAIL'}**`,
  '',
].join('\n');
writeFileSync(resolve(OUT, 'VALIDATION.md'), md);
console.log(md);
if (!report.pass) process.exitCode = 1;
