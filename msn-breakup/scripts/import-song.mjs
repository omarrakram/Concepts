// npm run import:song -- <file you are licensed to use>
// Takes the audio of a file you supply (e.g. the official video) and writes, into the
// gitignored public/music/:
//   when-youre-gone.<m4a|mp3|wav>   the audio stream, copied untouched (no re-encode)
//   when-youre-gone-analysis.wav    the same audio as mono 22.05 kHz PCM, read only by
//                                   the player's visualisation (never played)
// then checks it is the file the cue points were measured on (src/story/player.ts).
// Nothing here downloads anything, and nothing it writes is ever committed.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadTs } from './load-ts.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error('usage: npm run import:song -- <path to the audio or video file you are licensed to use>');
  process.exit(2);
}
const { SONG_SOURCE } = await loadTs(fileURLToPath(new URL('../src/story/player.ts', import.meta.url)));
const { FPS } = await loadTs(fileURLToPath(new URL('../src/constants.ts', import.meta.url)));
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
  return r.stdout;
};
const probe = (f) => JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', f]));

const src = probe(input);
const audio = src.streams.find((s) => s.codec_type === 'audio');
if (!audio) {
  console.error(`${input} has no audio stream`);
  process.exit(1);
}
const dir = `${root}/public/music`;
mkdirSync(dir, { recursive: true });
for (const ext of ['mp3', 'm4a', 'wav', 'aac', 'ogg']) rmSync(`${dir}/when-youre-gone.${ext}`, { force: true });
// keep the original encoding where a container allows it; anything else becomes lossless PCM
const ext = audio.codec_name === 'aac' ? 'm4a' : audio.codec_name === 'mp3' ? 'mp3' : 'wav';
const song = `${dir}/when-youre-gone.${ext}`;
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-map', `0:${audio.index}`, '-vn', '-map_metadata', '-1', ...(ext === 'wav' ? ['-c:a', 'pcm_s16le'] : ['-c:a', 'copy']), song]);
const analysis = `${dir}/when-youre-gone-analysis.wav`;
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', song, '-ac', '1', '-ar', '22050', '-c:a', 'pcm_s16le', analysis]);

const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const out = probe(song).streams[0];
const duration = Number(out.duration ?? probe(song).format.duration);
console.log(`source    ${input}`);
console.log(`          ${audio.codec_name} ${audio.sample_rate} Hz ${audio.channels} ch, ${Number(audio.duration ?? src.format.duration).toFixed(3)} s`);
console.log(`song      public/music/when-youre-gone.${ext}  (${ext === 'wav' ? 'decoded to PCM' : 'stream copy, untouched'})`);
console.log(`          ${out.codec_name} ${out.sample_rate} Hz ${out.channels} ch, ${duration.toFixed(3)} s, sha256 ${sha(song)}`);
console.log(`analysis  public/music/when-youre-gone-analysis.wav  (mono 22.05 kHz PCM, for the visualisation only)`);
if (Math.abs(duration - SONG_SOURCE.duration) > 0.05) {
  console.warn(
    `\n!! this audio is ${duration.toFixed(3)} s; the cue points were measured on a ${SONG_SOURCE.duration} s file.` +
      `\n   Re-measure the first note and update SONG_SOURCE in src/story/player.ts before rendering.`,
  );
  process.exit(3);
}
console.log(`\nok: same length as the measured file; playback starts at ${(SONG_SOURCE.inFrames / FPS).toFixed(3)} s (first note ${SONG_SOURCE.firstNote} s).`);
