import { Composition, Still } from 'remotion';
import './fonts';
import { FPS } from './constants';
import { Reel, type ReelProps } from './Reel';
import { CarouselStill, SignInStill } from './Stills';
import { REEL, TEASER } from './story/stories';

export function Root() {
  return (
    <>
      <Composition
        id="HeroReel"
        component={(p: ReelProps) => <Reel story={REEL} {...p} />}
        durationInFrames={Math.round(REEL.duration * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ cueTone: false, songStartSeconds: 0, songVolume: 0.85 } satisfies ReelProps}
      />
      <Composition
        id="Teaser"
        component={(p: ReelProps) => <Reel story={TEASER} {...p} />}
        durationInFrames={Math.round(TEASER.duration * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ cueTone: false } satisfies ReelProps}
      />
      <Still id="Carousel" component={CarouselStill} width={1080} height={1350} defaultProps={{ slide: 0 }} />
      <Still id="SignIn" component={SignInStill} width={1080} height={1350} />
    </>
  );
}
