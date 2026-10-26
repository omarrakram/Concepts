/**
 * npm run film30:mux [-- --edit=edit-proof.mjs]
 * Video (render.mjs) + soundtrack → the deliverable MP4 (H.264 copy, AAC-LC
 * 256 kb/s 48 kHz), cut to the edit's exact length.
 * Default (edit.mjs, the archived film): out/showcase-30/iys-internet-2006-30s-1080x1920.mp4.
 * Other edits: <OUT_DIR>/<NAME>.mp4 from <NAME>-video.mp4 + <NAME>-audio.wav.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const { FPS, FRAMES, NAME, OUT_DIR } = await import(`./${arg('edit', 'edit.mjs')}`);
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT = resolve(ROOT, OUT_DIR ?? 'out/showcase-30');
const VIDEO = resolve(OUT, NAME ? `${NAME}-video.mp4` : 'iys-internet-2006-30s-video.mp4');
const AUDIO = resolve(OUT, NAME ? `${NAME}-audio.wav` : 'iys-internet-2006-30s-audio.wav');
const FINAL = resolve(OUT, NAME ? `${NAME}.mp4` : 'iys-internet-2006-30s-1080x1920.mp4');
const title = NAME ? 'IYS Retro V2 (conversion-upgrade) showcase' : 'IYS INTERNET 2006';

const r = spawnSync(
  'ffmpeg',
  ['-y', '-loglevel', 'error', '-i', VIDEO, '-i', AUDIO, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', '-t', String(FRAMES / FPS), '-movflags', '+faststart', '-metadata', `title=${title}`, '-metadata', 'comment=Unofficial concept by Omar Akram. Not affiliated with In Your Shoe. Original music and sound design.', FINAL],
  { stdio: 'inherit' },
);
if (r.status !== 0) throw new Error('mux failed');
console.log(`[mux] ✓ ${FINAL}`);
