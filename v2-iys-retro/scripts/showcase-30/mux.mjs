/**
 * npm run film30:mux
 * Video (render.mjs) + soundtrack (audio.mjs) → the deliverable MP4:
 * out/showcase-30/iys-internet-2006-30s-1080x1920.mp4 (H.264 copy, AAC-LC 256 kb/s 48 kHz).
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT = resolve(ROOT, 'out/showcase-30');
const VIDEO = resolve(OUT, 'iys-internet-2006-30s-video.mp4');
const AUDIO = resolve(OUT, 'iys-internet-2006-30s-audio.wav');
const FINAL = resolve(OUT, 'iys-internet-2006-30s-1080x1920.mp4');

const r = spawnSync(
  'ffmpeg',
  ['-y', '-loglevel', 'error', '-i', VIDEO, '-i', AUDIO, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', '30', '-movflags', '+faststart', '-metadata', 'title=IYS INTERNET 2006', '-metadata', 'comment=Unofficial concept by Omar Akram. Not affiliated with In Your Shoe. Original music and sound design.', FINAL],
  { stdio: 'inherit' },
);
if (r.status !== 0) throw new Error('mux failed');
console.log(`[mux] ✓ ${FINAL}`);
