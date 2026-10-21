import { Audio, getStaticFiles, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Scene } from './Scene';
import { keyTimes } from './story/state';
import type { Story } from './story/types';

export interface ReelProps {
  /** QA: a sharp marker tone exactly on the music cue (to check sync). */
  cueTone?: boolean;
  /** Where to start inside the song file, in seconds (e.g. the chorus). */
  songStartSeconds?: number;
  /** Song level 0..1. */
  songVolume?: number;
}

/**
 * The licensed song is never in the repo. Drop it at
 * public/music/when-youre-gone.(mp3|m4a|wav|aac|ogg) and it plays from the
 * "is listening to" popup frame onward; without it the cue stays silent
 * (and `npm run cues` prints the exact timecode for an editor).
 */
export function songFile(): string | null {
  const f = getStaticFiles().find((x) => /^music\/when-youre-gone\.(mp3|m4a|wav|aac|ogg)$/i.test(x.name));
  return f ? f.name : null;
}

const sfx = (name: string) => staticFile(`sfx/${name}.wav`);

export function Reel({ story, cueTone, songStartSeconds = 0, songVolume = 0.85 }: { story: Story } & ReelProps) {
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
      keyTimes(b).forEach((kt, k) => {
        if ([...b.text][k] === ' ' && k % 2) return;
        sounds.push({ at: kt - 0.02, src: sfx(`key${1 + ((k * 7 + i) % 3)}`), volume: 0.3, key: `k${i}-${k}` });
      });
      // Enter
      sounds.push({ at: b.at - 0.03, src: sfx('key1'), volume: 0.42, key: `e${i}` });
    }
  });
  story.cursor.filter((c) => c.click).forEach((c, i) => sounds.push({ at: c.t, src: sfx('click'), volume: 0.6, key: `c${i}` }));
  const cue = story.beats.find((b) => b.type === 'listening')?.at;
  const song = songFile();
  return (
    <>
      <Scene story={story} t={t} frameSeed={frame} />
      {sounds.map((s) => (
        <Sequence key={s.key} from={Math.max(0, f(s.at))} layout="none" name={s.key}>
          <Audio src={s.src} volume={s.volume} />
        </Sequence>
      ))}
      {cue !== undefined && song && (
        <Sequence from={f(cue)} layout="none" name="SONG (licensed file)">
          <Audio
            src={staticFile(song)}
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
