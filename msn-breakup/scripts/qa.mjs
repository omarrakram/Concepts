// npm run qa: checks the rendered files themselves (run npm run render:carousel and
// npm run render:reel first). Writes out/qa/report.json and exits non-zero on any failure.
//   - ffprobe: 1080 × 1350 (4:5) / 1080 × 1920, 30 fps, exactly the composition's frames, H.264 yuv420p, AAC
//   - every file decodes start to end without an error (no corrupt video or audio)
//   - no black frames and no frozen stretch outside the designed ones, audio not clipped, not silent
//   - the music-player slide: the song begins exactly on PLAY_FRAME: in a song-only render as uncompressed WAV
//     (the exact mix: digital zero until the first sample of PLAY_FRAME), in the delivered MP4
//     (its first note at the Play frame), and the button turns to Pause on that frame (its pixels)
//   - nothing from public/music is tracked by git
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CAROUSEL, MASTER_FRAMES, MASTER_HOLDS, OUT_DIR } from './carousel-list.mjs';
import { loadTs } from './load-ts.mjs';
import { probe } from './manifest.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = (p) => fileURLToPath(new URL(`../src/${p}`, import.meta.url));
const { FPS } = await loadTs(src('constants.ts'));
const { PLAY_FRAME, playerAt, WMP, WMP_WIN } = await loadTs(src('story/player.ts'));
const { CAROUSEL_VIEW } = await loadTs(src('story/stories.ts'));

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? `  (${detail})` : ''}`);
};
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: opts.binary ? 'buffer' : 'utf8', maxBuffer: 1 << 30, cwd: root });
const ffmpegLog = (args) => run('ffmpeg', ['-hide_banner', '-nostats', ...args]).stderr;
/** mono s16 PCM of a file's audio at `rate` */
const pcm = (file, rate = 48000) => {
  const r = run('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(rate), '-f', 's16le', '-'], { binary: true });
  return new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 2);
};
const dbfs = (x) => (x > 0 ? 20 * Math.log10(x / 32768) : -Infinity);

/** the music-player slide (it carries the song, and the clean export) */
const PLAYER_SLIDE = CAROUSEL.find((c) => c.id === 'MusicPlayerBreakup');
const files = [
  ...CAROUSEL.map((c) => ({ file: `${OUT_DIR}/${c.file}`, w: 1080, h: 1350, frames: c.frames, holds: c.holds ?? [], dark: c.dark ?? [] })),
  { file: `${OUT_DIR}/${PLAYER_SLIDE.clean.file}`, w: 1080, h: 1350, frames: PLAYER_SLIDE.frames, holds: [], dark: [] },
  { file: 'out/msn-breakup-reel.mp4', w: 1080, h: 1920, frames: MASTER_FRAMES, holds: MASTER_HOLDS, dark: [] },
];
for (const f of files) {
  const path = `${root}/${f.file}`;
  if (!existsSync(path)) {
    check(`${f.file} exists`, false, 'not rendered');
    continue;
  }
  const m = probe(path);
  // every frame of the composition, no more, no less, and a video stream exactly that long
  check(
    `${f.file}: ${m.width}×${m.height} ${m.aspect}, ${m.fps} fps, ${m.frames} frames (composition: ${f.frames}), ${m.video}, ${m.pix_fmt}, ${m.audio} ${m.sample_rate} Hz`,
    m.width === f.w && m.height === f.h && m.fps === FPS && m.frames === f.frames && Math.abs(m.videoDuration - f.frames / FPS) < 0.5 / FPS && m.video.startsWith('h264') && m.pix_fmt === 'yuv420p' && m.audio.startsWith('aac'),
    `video ${m.videoDuration} s, container ${m.duration} s, ${(m.bytes / 1e6).toFixed(2)} MB`,
  );
  const decode = run('ffmpeg', ['-v', 'error', '-i', path, '-f', 'null', '-']).stderr.trim();
  check(`${f.file}: decodes start to end with no error`, decode === '', decode.slice(0, 200));
  // a black picture is only allowed inside a designed dark moment (± 0.1 s): slide 1's crash and old Windows starting
  const blackLog = ffmpegLog(['-i', path, '-an', '-vf', 'blackdetect=d=0.05:pix_th=0.10', '-f', 'null', '-']);
  const black = [...blackLog.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((x) => [Number(x[1]), Number(x[2])]);
  const strayBlack = black.filter(([a, b]) => !f.dark.some(([d0, d1]) => a >= d0 - 0.1 && b <= d1 + 0.1));
  const blackShown = black.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)} s`).join(', ');
  check(`${f.file}: no black frames outside the designed dark moments`, strayBlack.length === 0, blackShown ? `black: ${blackShown}; designed: ${f.dark.map(([a, b]) => `${a}–${b} s`).join(', ') || 'none'}` : 'none');
  // a still picture of 1 s or more is only allowed inside a designed hold (± 0.1 s)
  const log = ffmpegLog(['-i', path, '-an', '-vf', 'freezedetect=n=0.0005:d=1.0', '-f', 'null', '-']);
  const starts = [...log.matchAll(/freeze_start: ([\d.]+)/g)].map((x) => Number(x[1]));
  const ends = [...log.matchAll(/freeze_end: ([\d.]+)/g)].map((x) => Number(x[1]));
  const spans = starts.map((st, i) => [st, ends[i] ?? m.duration]);
  const unplanned = spans.filter(([a, b]) => !f.holds.some(([h0, h1]) => a >= h0 - 0.1 && b <= h1 + 0.1));
  const shown = spans.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)} s`).join(', ');
  check(`${f.file}: no frozen stretch (1 s or longer) outside the designed holds`, unplanned.length === 0, shown ? `still: ${shown}; designed: ${f.holds.map(([a, b]) => `${a}–${b} s`).join(', ') || 'none'}` : 'none');
  const a = pcm(path);
  let peak = 0;
  let sq = 0;
  let full = 0;
  for (const v of a) {
    const x = Math.abs(v);
    if (x > peak) peak = x;
    if (x >= 32767) full++;
    sq += v * v;
  }
  const rms = Math.sqrt(sq / a.length);
  check(`${f.file}: audio sound, not clipped`, a.length > 0 && rms > 0 && full === 0 && peak < 32767, `peak ${dbfs(peak).toFixed(1)} dBFS, RMS ${dbfs(rms).toFixed(1)} dBFS, ${(a.length / 48000).toFixed(3)} s`);
  // ebur128 logs a running value from t = 0; the measurement is the Summary at the end
  const ebu = ffmpegLog(['-i', path, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const lufs = ebu.slice(ebu.lastIndexOf('Summary:')).match(/I:\s+(-?[\d.]+) LUFS[\s\S]*?LRA:\s+(-?[\d.]+) LU[\s\S]*?Peak:\s+(-?[\d.]+) dBFS/);
  check(`${f.file}: loudness measured (EBU R128)`, Boolean(lufs), lufs ? `integrated ${lufs[1]} LUFS, range ${lufs[2]} LU, true peak ${lufs[3]} dBFS` : 'no summary');
}

// --- the music-player slide: the song begins on PLAY_FRAME ------------------------------
const playAt = PLAY_FRAME / FPS;
const songOnly = `${root}/out/qa/qa-song-only.wav`;
mkdirSync(`${root}/out/qa`, { recursive: true });
console.log('\nrendering the song-only check (MusicPlayerBreakup, clicks off, uncompressed WAV)…');
const r = spawnSync('node', ['scripts/render.mjs', 'MusicPlayerBreakup', 'out/qa/qa-song-only.wav', '--codec=wav', '--props={"uiSounds":false}', '--log=error'], { cwd: root, stdio: 'inherit' });
if (r.status === 0) {
  const a = pcm(songOnly, 48000);
  const first = (db, from = 0) => {
    const th = 32768 * 10 ** (db / 20);
    for (let i = from; i < a.length; i++) if (Math.abs(a[i]) >= th) return i;
    return -1;
  };
  const playSample = Math.round(playAt * 48000);
  let before = 0;
  for (let i = 0; i < playSample; i++) before = Math.max(before, Math.abs(a[i]));
  const nonZero = first(-90.3); // the first sample that is not digital zero
  const on = first(-50);
  check(
    `song-only WAV: digital zero before sample ${playSample} (${playAt.toFixed(4)} s, the first sample of frame ${PLAY_FRAME}), the song from that sample`,
    before === 0 && nonZero === playSample && on >= playSample && on <= playSample + 48,
    `max before: ${before === 0 ? 'exactly 0' : `${dbfs(before).toFixed(1)} dBFS`}; first non-zero sample ${nonZero}; first −50 dBFS sample at Δ ${(((on - playSample) / 48000) * 1000).toFixed(2)} ms; first −20 dBFS at Δ ${(((first(-20) - playSample) / 48000) * 1000).toFixed(1)} ms`,
  );
} else check('song-only render', false, 'render failed');

const deliverable = `${root}/${OUT_DIR}/${PLAYER_SLIDE.file}`;
const delivered = `delivered slide ${PLAYER_SLIDE.slide} (the music player)`;
if (existsSync(deliverable)) {
  const a = pcm(deliverable, 48000);
  const playSample = Math.round(playAt * 48000);
  // the Play click (2.50–2.59 s) is over; the window just before the Play frame must be quiet.
  // (AAC smears a sharp onset back into its frame by up to 1024 samples: reported, inaudible)
  let gap = 0;
  let preEcho = 0;
  for (let i = playSample - Math.round(0.006 * 48000); i < playSample - 24; i++) gap = Math.max(gap, Math.abs(a[i]));
  for (let i = playSample - 24; i < playSample; i++) preEcho = Math.max(preEcho, Math.abs(a[i]));
  let on = -1;
  for (let i = playSample - 24; i < playSample + 4800; i++) if (Math.abs(a[i]) >= 32768 * 10 ** (-30 / 20)) { on = i; break; }
  check(
    `${delivered}: the song's first note at the Play frame`,
    dbfs(gap) < -45 && on >= playSample && on <= playSample + 48 * 3,
    `${dbfs(gap).toFixed(1)} dBFS from 6 ms to 0.5 ms before; AAC pre-echo in the last 0.5 ms ${dbfs(preEcho).toFixed(1)} dBFS; first −30 dBFS sample at Δ ${(((on - playSample) / 48000) * 1000).toFixed(2)} ms`,
  );
  // pixels of the button's glyph: the middle is white inside ▶; for ❚❚ the middle is the blue
  // of the (hovered) button showing between two white bars, 4 px either side
  const cam = playerAt(playAt, CAROUSEL_VIEW).camera;
  const px = Math.round(((WMP_WIN.x + WMP.play.x - cam.x) * cam.z + CAROUSEL_VIEW.w / 2) * 2);
  const py = Math.round(((WMP_WIN.y + WMP.play.y - cam.y) * cam.z + CAROUSEL_VIEW.h / 2) * 2);
  const bar = Math.round(4 * cam.z * 2);
  const rgb = (n, x) => {
    const out = run('ffmpeg', ['-v', 'error', '-i', deliverable, '-vf', `select=eq(n\\,${n}),crop=3:3:${x - 1}:${py - 1}`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { binary: true }).stdout;
    const c = [0, 1, 2].map((k) => out.filter((_, i) => i % 3 === k).reduce((s, v) => s + v, 0) / (out.length / 3));
    return { white: Math.min(...c) > 220, blue: c[2] - c[0] > 80, c: c.map(Math.round).join('/') };
  };
  const shows = (n) => {
    const mid = rgb(n, px);
    if (mid.white) return { glyph: '▶', detail: `mid ${mid.c}` };
    const l = rgb(n, px - bar);
    const rr = rgb(n, px + bar);
    return { glyph: mid.blue && l.white && rr.white ? '❚❚' : '?', detail: `mid ${mid.c}, bars ${l.c} | ${rr.c}` };
  };
  const seq = [PLAY_FRAME - 2, PLAY_FRAME - 1, PLAY_FRAME, PLAY_FRAME + 1].map((n) => [n, shows(n)]);
  check(
    `${delivered}: ▶ until frame ${PLAY_FRAME - 1}, ❚❚ from frame ${PLAY_FRAME} (pixels around ${px},${py})`,
    seq[0][1].glyph === '▶' && seq[1][1].glyph === '▶' && seq[2][1].glyph === '❚❚' && seq[3][1].glyph === '❚❚',
    seq.map(([n, x]) => `${n}: ${x.glyph} (${x.detail})`).join('; '),
  );
}

// --- the song never enters git ------------------------------------------------------
const tracked = run('git', ['ls-files', 'public/music']).stdout.trim().split('\n');
check('git tracks nothing in public/music but its README', tracked.length === 1 && tracked[0] === 'public/music/README.md', tracked.join(', '));

writeFileSync(`${root}/out/qa/report.json`, JSON.stringify({ when: new Date().toISOString(), results }, null, 2) + '\n');
const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed → out/qa/report.json`);
process.exit(failed.length ? 1 : 0);
