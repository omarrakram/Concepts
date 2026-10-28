import { Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { VH, VW } from './constants';
import { songFile } from './music';
import { Scene } from './Scene';
import { keyTimes } from './story/state';
import type { Story } from './story/types';

export interface ReelProps {
  /** The song at the first cut's cue, if a file is in public/music (false: as first released, without it). */
  song?: boolean;
  /** QA: a sharp marker tone exactly on the music cue (to check sync). */
  cueTone?: boolean;
  /** Where to start inside the song file, in seconds (e.g. the chorus). */
  songStartSeconds?: number;
  /** Song level 0..1. */
  songVolume?: number;
}

export const sfx = (name: string) => staticFile(`sfx/${name}.wav`);

/**
 * The picture and every sound of a story. A story with a `listening` beat
 * (the first cut only) also plays the song from that frame, if a file is in
 * public/music (see src/music.ts); the current film has no song at all.
 */
export function Reel({ story, song = true, cueTone, songStartSeconds = 0, songVolume = 0.85, view = { w: VW, h: VH } }: { story: Story; view?: { w: number; h: number } } & ReelProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const f = (sec: number) => Math.round(sec * fps);
  const sounds: { at: number; src: string; volume: number; key: string }[] = [];
  story.beats.forEach((b, i) => {
    if (b.type === 'signin') sounds.push({ at: b.at, src: sfx('online'), volume: 0.85, key: `s${i}` });
    if (b.type === 'him') sounds.push({ at: b.at, src: sfx('message'), volume: 1, key: `m${i}` });
    if (b.type === 'nudge') sounds.push({ at: b.at, src: sfx('nudge'), volume: 1, key: `n${i}` });
    if (b.type === 'listening') sounds.push({ at: b.at, src: sfx('toast'), volume: 0.9, key: `l${i}` });
    if (b.type === 'her') {
      // a moved line keeps the key-click sounds it had in the first cut
      const v = b.orig?.index ?? i;
      keyTimes(b).forEach((kt, k) => {
        if ([...b.text][k] === ' ' && k % 2) return;
        sounds.push({ at: kt - 0.02, src: sfx(`key${1 + ((k * 7 + v) % 3)}`), volume: 0.3, key: `k${i}-${k}` });
      });
      // Enter
      sounds.push({ at: b.at - 0.03, src: sfx('key1'), volume: 0.42, key: `e${i}` });
    }
  });
  story.cursor.filter((c) => c.click).forEach((c, i) => sounds.push({ at: c.t, src: sfx('click'), volume: 0.6, key: `c${i}` }));
  const cue = story.beats.find((b) => b.type === 'listening')?.at;
  const file = songFile();
  return (
    <>
      <Scene story={story} t={t} view={view} frameSeed={frame} />
      {sounds.map((s) => (
        <Sequence key={s.key} from={Math.max(0, f(s.at))} layout="none" name={s.key}>
          <Audio src={s.src} volume={s.volume} />
        </Sequence>
      ))}
      {cue !== undefined && song && file && (
        <Sequence from={f(cue)} layout="none" name="SONG (licensed file)">
          <Audio
            src={staticFile(file)}
            trimBefore={Math.round(songStartSeconds * fps)}
            // audible on the cue frame itself (a 2-frame softening, not a fade from 0); out over the last second
            volume={(fr) => songVolume * interpolate(fr, [0, 2, durationInFrames - f(cue) - fps, durationInFrames - f(cue)], [0.6, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
          />
        </Sequence>
      )}
      {cue !== undefined && cueTone && (
        <Sequence from={f(cue)} layout="none" name="QA cue tone">
          <Audio src={sfx('cue-tone')} volume={0.8} />
        </Sequence>
      )}
    </>
  );
}
