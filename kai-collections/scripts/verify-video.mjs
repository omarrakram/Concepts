/**
 * npm run verify:video [-- --file=output/kai-before-after-16s.mp4]
 *
 * Checks the film against its spec and writes output/video-verification.json and
 * output/showcase-contact-sheet.png. Exits non-zero on any failed check.
 * A passing ffmpeg exit code is not proof of quality — this also scans for black
 * and frozen stretches and builds a contact sheet for a human to look at.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { openSync, readSync, statSync, writeFileSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, arg } from './lib/server.mjs';

const FILE = resolve(ROOT, arg('file', 'output/kai-before-after-16s.mp4'));
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
/** ffmpeg prints filter reports on stderr even when it succeeds */
const ffmpegLog = (args) => spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 64 << 20 }).stderr;

const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_format', '-show_streams', '-of', 'json', FILE]));
const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');

// faststart: the moov atom must precede mdat
const fd = openSync(FILE, 'r');
const head = Buffer.alloc(64 * 1024);
readSync(fd, head, 0, head.length, 0);
closeSync(fd);
const moov = head.indexOf('moov');
const mdat = head.indexOf('mdat');

const black = ffmpegLog(['-hide_banner', '-i', FILE, '-vf', 'blackdetect=d=0.05:pic_th=0.98:pix_th=0.08', '-an', '-f', 'null', '-'])
  .split('\n')
  .filter((l) => l.includes('black_start'));
const freeze = ffmpegLog(['-hide_banner', '-i', FILE, '-vf', 'freezedetect=n=-60dB:d=0.4', '-an', '-f', 'null', '-'])
  .split('\n')
  .filter((l) => l.includes('freeze_start') || l.includes('freeze_duration'));

const sheetTimes = [0.5, 1.6, 2.5, 3.1, 3.7, 4.6, 5.3, 6.2, 6.9, 7.3, 7.8, 8.3, 8.8, 9.5, 10.3, 10.75, 11.2, 11.7, 12.2, 12.7, 13.3, 14.4, 15.2, 15.95];
const sel = sheetTimes.map((t) => `eq(n\\,${Math.round(t * 60)})`).join('+');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', FILE, '-vf', `select='${sel}',scale=270:480,tile=8x3:padding=6:margin=6:color=0x173843`, '-frames:v', '1', '-fps_mode', 'vfr', resolve(ROOT, 'output/showcase-contact-sheet.png')]);

const num = (x) => Number(x);
const checks = {
  container: probe.format.format_name.includes('mp4'),
  duration_16s: Math.abs(num(probe.format.duration) - 16) < 0.0005,
  video_duration_16s: Math.abs(num(v.duration) - 16) < 0.0005,
  frames_960: num(v.nb_read_frames) === 960,
  fps_60: v.r_frame_rate === '60/1' && v.avg_frame_rate === '60/1',
  size_1080x1920: v.width === 1080 && v.height === 1920,
  h264: v.codec_name === 'h264',
  yuv420p: v.pix_fmt === 'yuv420p',
  faststart: moov >= 0 && (mdat < 0 || moov < mdat),
  audio_aac: !!a && a.codec_name === 'aac',
  audio_16s: !!a && Math.abs(num(a.duration) - 16) < 0.03,
  no_black_stretches: black.length === 0,
  no_freezes: freeze.length === 0,
};
const report = {
  file: FILE.replace(ROOT + '/', ''),
  bytes: statSync(FILE).size,
  megabytes: +(statSync(FILE).size / 1048576).toFixed(2),
  format_duration: probe.format.duration,
  video: { codec: v.codec_name, profile: v.profile, width: v.width, height: v.height, pix_fmt: v.pix_fmt, r_frame_rate: v.r_frame_rate, frames: v.nb_read_frames, duration: v.duration, bit_rate: v.bit_rate },
  audio: a ? { codec: a.codec_name, sample_rate: a.sample_rate, channels: a.channels, duration: a.duration, bit_rate: a.bit_rate } : null,
  black_detect: black,
  freeze_detect: freeze,
  contact_sheet: 'output/showcase-contact-sheet.png',
  contact_sheet_times: sheetTimes,
  checks,
  verifiedAt: new Date().toISOString(),
};
writeFileSync(resolve(ROOT, 'output/video-verification.json'), JSON.stringify(report, null, 2));
for (const [k, ok] of Object.entries(checks)) console.log(`${ok ? '✓' : '✗'} ${k}`);
console.log(`${report.megabytes} MB · ${v.nb_read_frames} frames · ${probe.format.duration}s`);
if (!Object.values(checks).every(Boolean)) process.exit(1);
