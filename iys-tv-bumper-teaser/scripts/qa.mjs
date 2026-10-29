// npm run qa [-- --set=final|animatic] [video.mp4]
//
// The technical validation of a rendered master, written to out/<set>/qa/validation.{json,md}:
//   streams      H.264 High, yuv420p, 1080 × 1920, 30 fps CFR, 450 frames, BT.709; AAC stereo 48 kHz; durations match
//   faststart    the index (moov) is before the media (mdat)
//   picture      every frame decoded: no black or near-black frames, no frozen runs before the end card (whose
//                hold is measured), no duplicated frames,
//                highlight clipping measured, the biggest frame-to-frame changes listed (the designed cuts)
//   audio        integrated loudness, true peak, loudness range, clipped samples, a clean start and end
//   copy         the only on-screen line is the approved one; no event name, offer, price, discount,
//                date or urgency anywhere in the copy, the code or the docs
//   placement    the line and the corner bug are on screen when they should be, and not before
// Exits 1 if any check fails.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, openSync, readFileSync, readSync, closeSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const set = args.find((a) => a.startsWith('--set='))?.slice(6) ?? 'final';
const MASTER = 'IYS-LOST-TV-BUMPER-TEASER-1080x1920.mp4';
const video = resolve(root, args.find((a) => !a.startsWith('--')) ?? `out/${set}/${set === 'final' ? MASTER : `IYS-LOST-TV-BUMPER-${set.toUpperCase()}-1080x1920.mp4`}`);
if (!existsSync(video)) throw new Error(`no video at ${video}`);

const W = 1080, H = 1920, FPS = 30, FRAMES = 450;
const results = [];
const check = (group, name, ok, value, expect = '') => results.push({ group, name, status: ok === null ? 'INFO' : ok ? 'PASS' : 'FAIL', value, expect });
const run = (cmd, argv) => spawnSync(cmd, argv, { encoding: 'utf8', maxBuffer: 1 << 28 });

// ------------------------------------------------------------------ streams
const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_format', '-show_streams', '-of', 'json', video]).stdout);
const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');
check('streams', 'video codec', v.codec_name === 'h264', `${v.codec_name} (${v.profile}, level ${v.level / 10})`, 'h264');
check('streams', 'pixel format', v.pix_fmt === 'yuv420p', v.pix_fmt, 'yuv420p');
check('streams', 'resolution', v.width === W && v.height === H, `${v.width} × ${v.height}`, `${W} × ${H}`);
check('streams', 'display aspect', (v.sample_aspect_ratio ?? '1:1') === '1:1', `SAR ${v.sample_aspect_ratio ?? '1:1'}, DAR ${v.display_aspect_ratio ?? '9:16'}`, 'square pixels');
check('streams', 'frame rate', v.r_frame_rate === '30/1' && v.avg_frame_rate === '30/1', `r ${v.r_frame_rate}, avg ${v.avg_frame_rate}`, '30/1 constant');
check('streams', 'frames', Number(v.nb_read_frames) === FRAMES, Number(v.nb_read_frames), FRAMES);
check('streams', 'video duration', Math.abs(Number(v.duration) - FRAMES / FPS) < 0.5 / FPS, `${Number(v.duration).toFixed(3)} s`, '15.000 s');
check('streams', 'colour', v.color_space === 'bt709' && v.color_primaries === 'bt709' && v.color_transfer === 'bt709', `${v.color_space}/${v.color_primaries}/${v.color_transfer}, ${v.color_range ?? 'unspecified'} range`, 'bt709');
check('streams', 'scan', !v.field_order || v.field_order === 'progressive', v.field_order ?? 'progressive', 'progressive');
check('streams', 'audio codec', a?.codec_name === 'aac', a ? `${a.codec_name} (${a.profile})` : 'none', 'aac');
check('streams', 'audio layout', a?.channels === 2 && Number(a?.sample_rate) === 48000, a ? `${a.channels} ch (${a.channel_layout}), ${a.sample_rate} Hz` : 'none', 'stereo, 48000 Hz');
check('streams', 'audio duration', a && Math.abs(Number(a.duration) - FRAMES / FPS) <= 1 / FPS + 0.03, a ? `${Number(a.duration).toFixed(3)} s` : 'none', 'within a frame of 15.000 s');
check('streams', 'file', null, `${(Number(probe.format.size) / 1e6).toFixed(2)} MB, ${(Number(probe.format.bit_rate) / 1e6).toFixed(1)} Mb/s overall, video ${(Number(v.bit_rate) / 1e6).toFixed(1)} Mb/s, audio ${(Number(a?.bit_rate) / 1e3).toFixed(0)} kb/s`);

// ------------------------------------------------------------------ faststart: the order of the top-level boxes
{
  const fd = openSync(video, 'r');
  const size = statSync(video).size;
  const order = [];
  for (let pos = 0; pos < size && order.length < 12;) {
    const hd = Buffer.alloc(16);
    readSync(fd, hd, 0, 16, pos);
    let len = hd.readUInt32BE(0);
    const type = hd.toString('latin1', 4, 8);
    if (len === 1) len = Number(hd.readBigUInt64BE(8));
    if (len < 8) break;
    order.push(type);
    pos += len;
  }
  closeSync(fd);
  check('streams', 'faststart', order.indexOf('moov') !== -1 && order.indexOf('moov') < order.indexOf('mdat'), order.join(' → '), 'moov before mdat');
}

// ------------------------------------------------------------------ picture: ffmpeg's detectors
{
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', video, '-vf', 'blackdetect=d=0.03:pix_th=0.10:pic_th=0.98,freezedetect=n=0.002:d=0.25', '-an', '-f', 'null', '-']);
  const blacks = [...r.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => `${m[1]}–${m[2]} s`);
  // a freeze still running at the end of the file reports no end: it runs to the end
  const freezes = [];
  for (const m of r.stderr.matchAll(/freeze_(start|end): ([\d.]+)/g)) {
    if (m[1] === 'start') freezes.push({ start: Number(m[2]), end: FRAMES / FPS });
    else if (freezes.length) freezes[freezes.length - 1].end = Number(m[2]);
  }
  // the end card holds once the bug is in (src/timeline.ts, T.bug): stillness there is designed, up to a second of it
  const endCard = Number(/bug: \[\d+, (\d+)\]/.exec(readFileSync(join(root, 'src/timeline.ts'), 'utf8'))[1]) / FPS;
  const span = (z) => `${z.start.toFixed(2)}–${z.end.toFixed(2)} s`;
  const unplanned = freezes.filter((z) => z.start < endCard);
  const hold = freezes.filter((z) => z.start >= endCard);
  const held = hold.reduce((s, z) => s + z.end - z.start, 0);
  check('picture', 'black frames (ffmpeg blackdetect)', blacks.length === 0, blacks.length ? blacks.join(', ') : 'none', 'none');
  check('picture', 'frozen runs ≥ 0.25 s before the end card (ffmpeg freezedetect)', unplanned.length === 0, unplanned.length ? unplanned.map(span).join(', ') : 'none', `none before ${endCard.toFixed(2)} s`);
  check('picture', 'the end card holding still (freezedetect, from the bug landing)', held <= 1.0, hold.length ? `${hold.map(span).join(', ')}: ${held.toFixed(2)} s` : 'none', '≤ 1.0 s');
}

// ------------------------------------------------------------------ picture: every frame, measured here
const pw = 540, ph = 960;
const stats = await new Promise((done, fail) => {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', video, '-vf', `scale=${pw}:${ph}:flags=area,format=gray`, '-f', 'rawvideo', '-']);
  const n = pw * ph;
  let buf = Buffer.alloc(0), prev = null;
  const out = [];
  p.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (buf.length >= n) {
      const fr = buf.subarray(0, n);
      let sum = 0, clip = 0, diff = 0, lo = 255, hi = 0;
      for (let i = 0; i < n; i++) {
        const y = fr[i];
        sum += y;
        if (y >= 250) clip++;
        if (y < lo) lo = y;
        if (y > hi) hi = y;
        if (prev) diff += Math.abs(y - prev[i]);
      }
      out.push({ mean: sum / n, clip: clip / n, mad: prev ? diff / n : null, lo, hi });
      prev = Buffer.from(fr);
      buf = buf.subarray(n);
    }
  });
  p.on('error', fail);
  p.on('close', (code) => (code === 0 ? done(out) : fail(new Error(`ffmpeg exited ${code}`))));
});
{
  check('picture', 'frames decoded', stats.length === FRAMES, stats.length, FRAMES);
  const darkest = stats.reduce((m, s, i) => (s.mean < m.v ? { v: s.mean, i } : m), { v: 999, i: -1 });
  check('picture', 'darkest frame (mean luma, 0–255)', darkest.v > 16, `${darkest.v.toFixed(1)} at frame ${darkest.i}`, '> 16 (no black or near-black frame)');
  const dup = stats.map((s, i) => ({ i, mad: s.mad })).filter((s) => s.mad !== null && s.mad < 0.05);
  check('picture', 'duplicated frames (mean change < 0.05)', dup.length === 0, dup.length ? dup.map((d) => d.i).join(', ') : 'none', 'none');
  const stillest = stats.map((s, i) => ({ i, mad: s.mad })).filter((s) => s.mad !== null).sort((x, y) => x.mad - y.mad).slice(0, 3);
  check('picture', 'stillest frames (mean change vs previous)', null, stillest.map((s) => `f${s.i} ${s.mad.toFixed(2)}`).join(', '));
  const jumps = stats.map((s, i) => ({ i, mad: s.mad ?? 0 })).sort((x, y) => y.mad - x.mad).slice(0, 5);
  check('picture', 'biggest frame-to-frame changes', null, jumps.map((s) => `f${s.i} ${s.mad.toFixed(1)}`).join(', '), 'the action (the lid, the spin, the landing), under 25 except the flash');
  const designed = new Set([96, 97]);
  const wild = jumps.filter((j) => !designed.has(j.i) && j.mad > 25);
  check('picture', 'unplanned hard changes (> 25 mean luma)', wild.length === 0, wild.length ? wild.map((j) => `f${j.i}`).join(', ') : 'none', 'none outside 96–97');
  const clipped = stats.map((s, i) => ({ i, c: s.clip })).filter((s) => !designed.has(s.i)).sort((x, y) => y.c - x.c);
  check('picture', 'highlight clipping (pixels ≥ 250)', clipped[0].c < 0.01, `max ${(clipped[0].c * 100).toFixed(2)} % at frame ${clipped[0].i} (the flash frame 96 excluded: ${(stats[96].clip * 100).toFixed(1)} %)`, '< 1 % of the frame');
  const crushed = stats.reduce((m, s, i) => (s.lo === 0 && s.mean < 40 ? m.concat(i) : m), []);
  check('picture', 'crushed dark frames (min 0 and mean < 40)', crushed.length === 0, crushed.length ? crushed.slice(0, 10).join(', ') : 'none', 'none');
}

// ------------------------------------------------------------------ audio
{
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', video, '-vn', '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-']);
  const num = (re) => Number(re.exec(r.stderr)?.[1]);
  const I = num(/I:\s+(-?[\d.]+) LUFS/), LRA = num(/LRA:\s+([\d.]+) LU/), TP = num(/Peak:\s+(-?[\d.]+) dBFS/);
  check('audio', 'integrated loudness', I >= -16 && I <= -12, `${I.toFixed(1)} LUFS`, '−14 ± 2 LUFS (social video)');
  check('audio', 'true peak', TP <= -1.0, `${TP.toFixed(1)} dBTP`, '≤ −1.0 dBTP');
  check('audio', 'loudness range', null, `${LRA.toFixed(1)} LU`);
  const pcm = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', video, '-vn', '-f', 's16le', '-ac', '2', '-ar', '48000', '-'], { maxBuffer: 1 << 28 }).stdout;
  const s = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2);
  let clip = 0, dc = 0;
  for (const x of s) {
    if (x >= 32766 || x <= -32767) clip++;
    dc += x;
  }
  const rms = (from, to) => {
    let e = 0, c = 0;
    for (let k = Math.max(0, from * 2); k < Math.min(s.length, to * 2); k++) { e += (s[k] / 32768) ** 2; c++; }
    return 10 * Math.log10(e / Math.max(1, c) + 1e-12);
  };
  const n = s.length / 2;
  check('audio', 'clipped samples', clip === 0, clip, 0);
  check('audio', 'DC offset', Math.abs(dc / s.length) < 30, `${(dc / s.length / 32768 * 100).toFixed(4)} %`, '≈ 0');
  check('audio', 'clean end (last 50 ms)', rms(n - 2400, n) < -50, `${rms(n - 2400, n).toFixed(1)} dBFS RMS`, '< −50 dBFS');
  check('audio', 'room before the interruption (0–3.1 s)', null, `${rms(0, 3.1 * 48000).toFixed(1)} dBFS RMS`);
  check('audio', 'the interruption (3.2–3.7 s)', rms(3.2 * 48000, 3.7 * 48000) > rms(0, 3.1 * 48000) + 3, `${rms(3.2 * 48000, 3.7 * 48000).toFixed(1)} dBFS RMS`, 'at least 3 dB above the room');
}

// ------------------------------------------------------------------ copy
{
  const teaser = readFileSync(join(root, 'src/Teaser.tsx'), 'utf8');
  const line = /export const COPY = \{ line: '([^']*)' \}/.exec(teaser)?.[1];
  check('copy', 'the on-screen line', line === 'STAY TUNED.', JSON.stringify(line), '"STAY TUNED."');
  // text written into the picture's JSX (parsed, not pattern-matched): anything visible must come from COPY or the official artwork
  const literal = [];
  for (const f of readdirSync(join(root, 'src')).filter((n) => n.endsWith('.tsx'))) {
    const src = ts.createSourceFile(f, readFileSync(join(root, 'src', f), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node) => {
      if (ts.isJsxText(node) && node.getText().trim()) literal.push(`${f}: "${node.getText().trim()}"`);
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ['text', 'tspan', 'textPath'].includes(node.tagName.getText())) literal.push(`${f}: <${node.tagName.getText()}>`);
      ts.forEachChild(node, visit);
    };
    visit(src);
  }
  check('copy', 'other text written into the picture', literal.length === 0, literal.length ? literal.join(' | ') : 'none (JSX text nodes and SVG text elements, all src/*.tsx)', 'none');

  const event = new RegExp(['sin', "gle'?s?'?", '[\\s_-]*', 'day'].join(''), 'i'); // the November event's name, in any spelling
  const offer = /\b(\d+\s?%|percent|discount|sale\b|off\b|promo|coupon|voucher|code\b|free shipping|free delivery|shop now|buy now|order now|limited time|hurry|last chance|everything must go|countdown|EGP|L\.?E\.?\b|\$\s?\d|£|€)/i;
  const dates = /\b(11[./:-]11|\d{1,2}\s?(nov|november)\b|(nov|november)\s?\d{1,2}\b)/i;
  check('copy', 'offers, prices, urgency or dates in the line', !offer.test(line) && !dates.test(line) && !event.test(line), 'none', 'none');

  const walk = (d) => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    if (['node_modules', 'out', 'renders', '.git'].includes(n) || n.startsWith('.')) return [];
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(tsx?|mjs|js|py|md|json|txt)$/.test(n) && !p.endsWith('package-lock.json') ? [p] : [];
  });
  const files = walk(root).filter((p) => !p.endsWith(join('scripts', 'qa.mjs')) && !p.includes(join('public', 'fonts')));
  const hits = files.flatMap((p) => readFileSync(p, 'utf8').split('\n').map((l, i) => (event.test(l) ? `${relative(root, p)}:${i + 1}` : null)).filter(Boolean));
  check('copy', "the event's name anywhere in the project", hits.length === 0, hits.length ? hits.join(', ') : `none (${files.length} files scanned)`, 'none');
}

// ------------------------------------------------------------------ placement: the line and the bug appear on cue, not before
{
  const crop = (frame, x, y, w, h) => {
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', video, '-vf', `select=eq(n\\,${frame}),crop=${w}:${h}:${x}:${y},format=gray`, '-frames:v', '1', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 26 });
    let sum = 0, bright = 0;
    for (const b of r.stdout) { sum += b; if (b > 200) bright++; }
    return { mean: sum / r.stdout.length, bright: bright / r.stdout.length };
  };
  const teaser = readFileSync(join(root, 'src/Teaser.tsx'), 'utf8');
  const lineTop = Number(/export const LINE_TOP = (\d+)/.exec(teaser)[1]);
  const [, br, bt, bw] = /export const BUG = \{ right: (\d+), top: (\d+), width: (\d+) \}/.exec(teaser).map(Number);
  const band = [240, lineTop - 6, 600, 64]; // where STAY TUNED. sits
  const bug = [W - br - bw, bt, bw, bw];
  const before = crop(386, ...band), after = crop(430, ...band);
  check('placement', 'STAY TUNED. appears on cue (frame 430 vs 386)', after.bright > before.bright + 0.05, `bright pixels ${(before.bright * 100).toFixed(1)} % → ${(after.bright * 100).toFixed(1)} %`, 'clearly more at 430');
  const bugBefore = crop(398, ...bug), bugAfter = crop(430, ...bug);
  check('placement', 'the corner bug appears on cue (frame 430 vs 398)', bugAfter.mean > bugBefore.mean + 8, `mean luma ${bugBefore.mean.toFixed(1)} → ${bugAfter.mean.toFixed(1)}`, 'clearly brighter at 430');
}

// ------------------------------------------------------------------ report
const fails = results.filter((r) => r.status === 'FAIL');
const dir = resolve(root, `out/${set}/qa`);
mkdirSync(dir, { recursive: true });
const report = { video: relative(root, video), checkedAt: new Date().toISOString(), summary: { pass: results.filter((r) => r.status === 'PASS').length, fail: fails.length, info: results.filter((r) => r.status === 'INFO').length }, results };
writeFileSync(join(dir, 'validation.json'), `${JSON.stringify(report, null, 2)}\n`);
const md = [
  `# Technical validation: \`${relative(root, video)}\``,
  '',
  `Checked ${report.checkedAt} by \`scripts/qa.mjs\`: **${report.summary.pass} pass, ${report.summary.fail} fail**, ${report.summary.info} for information.`,
  '',
  '| Group | Check | Result | Value | Expected |',
  '| --- | --- | --- | --- | --- |',
  ...results.map((r) => `| ${r.group} | ${r.name} | ${r.status} | ${String(r.value).replace(/\|/g, '\\|')} | ${String(r.expect).replace(/\|/g, '\\|')} |`),
  '',
].join('\n');
writeFileSync(join(dir, 'validation.md'), md);
for (const r of results) console.log(`${r.status.padEnd(4)}  ${r.group.padEnd(9)} ${r.name}: ${r.value}${r.expect !== '' ? `  (expect ${r.expect})` : ''}`);
console.log(`\n${report.summary.pass} pass, ${report.summary.fail} fail → ${relative(root, join(dir, 'validation.md'))}`);
process.exit(fails.length ? 1 : 0);
