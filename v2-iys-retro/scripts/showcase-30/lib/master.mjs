/**
 * Master a stereo buffer to a WAV: gain → tanh soft clip → look-ahead limiter,
 * measured with FFmpeg's EBU R128 meter and repeated until about -14 LUFS
 * integrated with a true peak at or under -1.2 dBTP (the same chain as audio.mjs).
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { buffer, limit, truePeak, wav } from './synth.mjs';

export function measure(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const sum = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  return { lufs: Number(/I:\s+(-?[\d.]+) LUFS/.exec(sum)[1]), tp: Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(sum)[1]) };
}

export function masterTo(file, master, seconds, { target = -14, tpMax = -1.2 } = {}) {
  let ceilDb = -1.6;
  let gain = 1.6;
  let result;
  for (let pass = 0; pass < 8; pass++) {
    const CEIL = Math.pow(10, ceilDb / 20);
    const b = buffer(seconds);
    for (let i = 0; i < b.n; i++) {
      b.L[i] = Math.tanh(master.L[i] * gain * 0.9) / 0.9;
      b.R[i] = Math.tanh(master.R[i] * gain * 0.9) / 0.9;
    }
    const out = limit(b, CEIL, 0.004, 0.09);
    writeFileSync(file, wav(out));
    result = { ...measure(file), estTp: 20 * Math.log10(truePeak(out)), gain, ceilingDb: ceilDb };
    console.log(`[audio] pass ${pass}: gain ${gain.toFixed(3)}, ceiling ${ceilDb.toFixed(2)} dBFS → ${result.lufs} LUFS, true peak ${result.tp} dBTP`);
    if (Math.abs(result.lufs - target) <= 0.3 && result.tp <= tpMax) break;
    if (result.tp > tpMax) ceilDb -= result.tp - tpMax + 0.2; // inter-sample overs: pull the sample ceiling down
    gain *= Math.pow(10, (target - result.lufs) / 20);
  }
  return result;
}
