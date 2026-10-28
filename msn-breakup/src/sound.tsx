import { Audio, Sequence, useVideoConfig } from 'remotion';
import { sfx } from './Reel';
import { keyTimes } from './story/state';
import type { Beat, CursorKey } from './story/types';

/** One sound effect at a story time (seconds). */
export interface Cue {
  at: number;
  src: string;
  volume: number;
  key: string;
}

/**
 * The key clicks of one of her lines, exactly as the film plays them (see
 * Reel): a click per character (every other space is silent), the sample
 * picked by the line's index in the first cut, and Enter if she sends it.
 */
export function typingCues(b: Extract<Beat, { type: 'her' }>, key: string, enter: boolean): Cue[] {
  const v = b.orig?.index ?? 0;
  const cues: Cue[] = [];
  keyTimes(b).forEach((kt, k) => {
    if ([...b.text][k] === ' ' && k % 2) return;
    cues.push({ at: kt - 0.02, src: sfx(`key${1 + ((k * 7 + v) % 3)}`), volume: 0.3, key: `${key}-${k}` });
  });
  if (enter) cues.push({ at: b.at - 0.03, src: sfx('key1'), volume: 0.42, key: `${key}-enter` });
  return cues;
}

/** A mouse click for every `click` key of a cursor path. */
export const clickCues = (cursor: CursorKey[]): Cue[] => cursor.filter((c) => c.click).map((c, i) => ({ at: c.t, src: sfx('click'), volume: 0.6, key: `c${i}` }));

export function Cues({ cues }: { cues: Cue[] }) {
  const { fps } = useVideoConfig();
  return (
    <>
      {cues.map((c) => (
        <Sequence key={c.key} from={Math.max(0, Math.round(c.at * fps))} layout="none" name={c.key}>
          <Audio src={c.src} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
}
