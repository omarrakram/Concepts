// npm run render [-- --set=final|animatic] [--resume] [step ...]
//
// The whole film, in dependency order (default: every step):
//   audio      original sound design          → public/audio/mix.wav              (audio/synth.mjs)
//   bumper     the CGI bumper, 3D             → public/renders/<set>/bumper/####.png  (Blender)
//   tv         what the CRT shows             → public/renders/<set>/tv/####.png    (Remotion; needs bumper 96–142)
//   room       the room and the TV, 3D        → public/renders/<set>/room/####.png  (Blender; needs tv)
//   bumper-hd  the reveal at full resolution  → public/renders/final/bumper-hd/     (Blender, final only)
//   teaser     the 9:16 master                → out/<set>/<name>.mp4                (Remotion; needs all of the above)
//   stills     cover, first/last, style frames → out/<set>/stills/*.png             (Remotion)
//   feed       optional: the 4:5 feed version   → out/<set>/…-1080x1350.mp4          (Remotion, the same picture cropped)
//   silent     optional: the master without sound → out/<set>/…-silent.mp4          (ffmpeg, a stream copy)
//
// BLENDER=/path/to/blender if it is not on PATH. --resume skips 3D frames that already exist.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';
import { renderFrames, renderMedia, renderStill, selectComposition } from '@remotion/renderer';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const set = args.includes('--animatic') ? 'animatic' : (args.find((a) => a.startsWith('--set='))?.slice(6) ?? 'final');
const resume = args.includes('--resume');
const ALL = ['audio', 'bumper', 'tv', 'room', 'bumper-hd', 'teaser', 'stills', 'feed', 'silent'];
const steps = args.filter((a) => !a.startsWith('--'));
for (const s of steps) if (!ALL.includes(s)) throw new Error(`unknown step "${s}" (steps: ${ALL.join(', ')})`);
const run = (s) => (steps.length ? steps.includes(s) : true);
const BLENDER = process.env.BLENDER ?? 'blender';

export const MASTER = 'IYS-LOST-TV-BUMPER-TEASER-1080x1920.mp4';
const outName = set === 'final' ? MASTER : `IYS-LOST-TV-BUMPER-${set.toUpperCase()}-1080x1920.mp4`;

/**
 * The 3D shots. The animatic is quarter-size, few samples, no motion blur. In the final, the
 * bumper renders at 720 × 1280 while the picture is still "television" (softened, scanned and
 * colour-split in the composite), and the reveal (from frame 330, while the period texture
 * clears) renders natively at 1080 × 1920, so the logo and the wordmark are pin sharp.
 */
const SHOTS = {
  animatic: {
    bumper: { scene: 'bumper', frames: '96-449', res: '360x640', samples: 6, blur: false },
    room: { scene: 'room', frames: '0-142', res: '360x640', samples: 6, blur: false },
  },
  final: {
    bumper: { scene: 'bumper', frames: '96-336', res: '720x1280', samples: 12, blur: true },
    room: { scene: 'room', frames: '0-142', res: '720x1280', samples: 12, blur: true },
    'bumper-hd': { scene: 'bumper', frames: '330-449', res: '1080x1920', samples: 16, blur: true },
  },
}[set];
if (!SHOTS) throw new Error(`unknown set "${set}" (final | animatic)`);

/** The stills: the cover (the hero moment), the first and the last frame, and four style frames. */
export const STILLS = { first: 0, 'style-1-room': 64, 'style-2-bumper': 196, 'style-3-transformation': 312, 'style-4-reveal': 372, cover: 420, last: 449 };

const shell = (() => {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const dir = '/opt/pw-browsers';
  const found = existsSync(dir) && readdirSync(dir).find((d) => d.startsWith('chromium_headless_shell-'));
  // the shell's layout differs between Playwright builds
  const bin = found && ['chrome-linux/headless_shell', 'chrome-headless-shell-linux64/chrome-headless-shell'].map((p) => join(dir, found, p)).find(existsSync);
  return bin ?? null;
})();

const sh = (cmd, argv, env = {}) => {
  console.log(`\n$ ${[cmd, ...argv].join(' ')}`);
  const r = spawnSync(cmd, argv, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`${cmd} failed (${r.status ?? r.signal})`);
};

const blender = (shot) => {
  const s = SHOTS[shot];
  if (!s) return console.log(`(no ${shot} pass in the ${set} set)`);
  sh(BLENDER, ['-b', '--factory-startup', '-noaudio', '--python', 'blender/render.py', '--', '--scene', s.scene, '--frames', s.frames, '--res', s.res, '--samples', String(s.samples), '--out', `public/renders/${set}/${shot}`, ...(s.blur ? [] : ['--no-blur']), ...(resume ? ['--resume'] : [])], { IYS_SET: set });
};

let served = null;
const serve = async () => {
  // the frame folders are large: link public/ into the bundle instead of copying it
  served ??= await bundle({ entryPoint: resolve(root, 'src/index.ts'), symlinkPublicDir: true, onProgress: () => undefined });
  return served;
};
const composition = async (id, inputProps) => selectComposition({ serveUrl: await serve(), id, inputProps, browserExecutable: shell });
const progress = (label, total) => (n) => {
  if (n % 30 === 0 || n === total) process.stdout.write(`  ${label} ${n}/${total}\n`);
};

if (run('audio')) sh(process.execPath, ['audio/synth.mjs']);
if (run('bumper')) blender('bumper');

if (run('tv')) {
  // 0–142: the cartoon, and from 96 the bumper on the set; named ####.png to match the 3D frames
  const inputProps = { set };
  const comp = await composition('TVScreen', inputProps);
  const dir = resolve(root, `public/renders/${set}/tv`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  await renderFrames({
    serveUrl: await serve(), composition: comp, inputProps, outputDir: dir, imageFormat: 'png',
    imageSequencePattern: 'f[frame].[ext]', browserExecutable: shell, concurrency: 4,
    onStart: () => undefined, onFrameUpdate: progress('tv', comp.durationInFrames),
  });
  for (const f of readdirSync(dir)) {
    const m = /^f(\d+)\.png$/.exec(f);
    if (m) renameSync(join(dir, f), join(dir, `${m[1].padStart(4, '0')}.png`));
  }
}

if (run('room')) blender('room');
if (run('bumper-hd')) blender('bumper-hd');

/** Render a composition of the film to an H.264/AAC MP4 at the master's settings, index at the front. */
const encode = async (id, inputProps, out, label) => {
  const comp = await composition(id, inputProps);
  mkdirSync(resolve(root, `out/${set}`), { recursive: true });
  await renderMedia({
    serveUrl: await serve(), composition: comp, inputProps, outputLocation: out, codec: 'h264', crf: 16,
    x264Preset: 'slow', pixelFormat: 'yuv420p', colorSpace: 'bt709', imageFormat: 'png', audioCodec: 'aac',
    audioBitrate: '320k', browserExecutable: shell, concurrency: 4, overwrite: true,
    onProgress: ({ renderedFrames }) => progress(label, comp.durationInFrames)(renderedFrames),
  });
  // move the index to the front (playback can start before the whole file has downloaded)
  const fast = out.replace(/\.mp4$/, '.faststart.mp4');
  sh('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', out, '-c', 'copy', '-map', '0', '-movflags', '+faststart', fast]);
  renameSync(fast, out);
  console.log(`\n${label} → ${out}`);
};
const master = resolve(root, `out/${set}/${outName}`);

if (run('teaser')) await encode('Teaser', { set, audio: true }, master, 'master');

if (run('stills')) {
  const inputProps = { set, audio: false };
  const comp = await composition('Teaser', inputProps);
  mkdirSync(resolve(root, `out/${set}/stills`), { recursive: true });
  for (const [name, frame] of Object.entries(STILLS)) {
    const output = resolve(root, `out/${set}/stills/${name}-f${String(frame).padStart(3, '0')}.png`);
    await renderStill({ serveUrl: await serve(), composition: comp, inputProps, frame, output, imageFormat: 'png', browserExecutable: shell, overwrite: true });
    console.log(`  still ${name} (frame ${frame}) → ${output.slice(root.length)}`);
  }
}

if (run('feed')) await encode('Teaser4x5', { set, audio: true, format: '4x5' }, master.replace('1080x1920', '1080x1350'), 'feed (4:5)');

if (run('silent')) {
  const out = master.replace(/\.mp4$/, '-silent.mp4');
  sh('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', master, '-map', '0:v', '-c', 'copy', '-movflags', '+faststart', out]);
  console.log(`\nsilent → ${out}`);
}
