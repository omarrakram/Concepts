import { visualizeAudio, type MediaUtilsAudioData } from '@remotion/media-utils';
import { interpolate } from 'remotion';
import { SONG_SOURCE } from './story/player';

/**
 * The Now Playing bars, computed from the song's own spectrum (the analysis
 * WAV in public/music/), shared by slide 2 (where she starts the song) and
 * slide 3 (where it keeps playing). Everything is in the song's own frames
 * (file frames at the video's rate), so the bars run on across the two videos.
 */
export const BARS = 28;
const PEAK_FALL = 0.025; // per frame
const PEAK_HOLD = 40; // frames looked back (a full fall)
const FFT = 512; // bins: 21.5 Hz each at 22.05 kHz
const LO_HZ = 110;
const HI_HZ = 8000;
/**
 * A fixed display EQ (dB) across the bars, measured on the song's first
 * bars: it flattens the average spectrum (a quiet low end, a loud piano
 * middle) so every bar moves around the same height.
 */
const EQ: [number, number][] = [
  [0, -48],
  [6, -35],
  [12, -18],
  [20, -22],
  [27, -29],
];
const eqAt = (i: number) => interpolate(i, EQ.map((e) => e[0]), EQ.map((e) => e[1]));

/** The spectrum at one frame of the song's own timeline, as 28 log-spaced bars (0..1). */
export function spectrumBars(audioData: MediaUtilsAudioData, fps: number, songFrame: number): number[] {
  // the analysis window (2 × FFT samples) starts on the frame instead of being centred on it,
  // so the Play frame never reads the swell before the playback point
  const mags = visualizeAudio({ audioData, fps, frame: songFrame, numberOfSamples: FFT, smoothing: false, optimizeFor: 'speed', dataOffsetInSeconds: -FFT / audioData.sampleRate });
  const hz = audioData.sampleRate / 2 / FFT;
  const b0 = LO_HZ / hz;
  const b1 = HI_HZ / hz;
  return Array.from({ length: BARS }, (_, i) => {
    const lo = Math.round(b0 * Math.pow(b1 / b0, i / BARS));
    const hi = Math.max(lo + 1, Math.round(b0 * Math.pow(b1 / b0, (i + 1) / BARS)));
    let e = 0;
    for (let k = lo; k < hi; k++) e += (mags[k] ?? 0) ** 2;
    // energy in the band, +5 dB / octave (music falls off towards the highs), then ±13 dB around the EQ
    const db = 10 * Math.log10(e + 1e-12) + 5 * Math.log2((lo + hi) / 2 / b0);
    return Math.max(0, Math.min(1, (db - eqAt(i) + 13) / 26));
  });
}

/**
 * The bars and their falling peaks at one frame of the song (file frames). Nothing before the
 * playback point (SONG_SOURCE.inFrames) is ever read: there the bars are flat.
 */
export function songMeter(audioData: MediaUtilsAudioData | null, fps: number, songFrame: number): { bars: number[]; peaks: number[] } {
  const start = SONG_SOURCE.inFrames;
  const barsAt = (f: number) => (audioData && f >= start ? spectrumBars(audioData, fps, f) : new Array<number>(BARS).fill(0));
  const now = barsAt(songFrame);
  const prev = songFrame - 1 >= start ? barsAt(songFrame - 1) : now;
  const bars = now.map((v, i) => (v + prev[i]!) / 2);
  const peaks = bars.map((v, i) => {
    let p = v;
    for (let k = 1; k <= PEAK_HOLD && songFrame - k >= start; k++) p = Math.max(p, barsAt(songFrame - k)[i]! - PEAK_FALL * k);
    return p;
  });
  return { bars, peaks };
}
