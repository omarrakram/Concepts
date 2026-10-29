import { Composition } from 'remotion';
import './fonts';
import { Cartoon, CARTOON } from './Cartoon';
import { Teaser } from './Teaser';
import { FPS, T, TOTAL } from './timeline';
import { TVScreen } from './TVScreen';

export function Root() {
  return (
    <>
      {/* the 9:16 master */}
      <Composition id="Teaser" component={Teaser} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} defaultProps={{ set: 'final' as const, audio: true }} />
      {/* the 4:5 feed version (optional): the same picture, cropped, the bug in the feed frame's corner */}
      <Composition id="Teaser4x5" component={Teaser} durationInFrames={TOTAL} fps={FPS} width={1080} height={1350} defaultProps={{ set: 'final' as const, audio: true, format: '4x5' as const }} />
      {/* what the TV shows (mapped onto the CRT in the room render) */}
      <Composition id="TVScreen" component={TVScreen} durationInFrames={T.roomEnd + 1} fps={FPS} width={CARTOON.w} height={CARTOON.h} defaultProps={{ set: 'final' as const }} />
      {/* the cartoon alone */}
      <Composition id="Cartoon" component={Cartoon} durationInFrames={T.roomEnd + 1} fps={FPS} width={CARTOON.w} height={CARTOON.h} />
    </>
  );
}
