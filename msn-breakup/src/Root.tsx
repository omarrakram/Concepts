import { Composition, Still } from 'remotion';
import './fonts';
import { FPS } from './constants';
import { Reel, type ReelProps } from './Reel';
import { BreakupCarousel } from './BreakupCarousel';
import { CarouselStill, SignInStill } from './Stills';
import { INTRO } from './story/intro';
import { REEL, REEL_CAROUSEL, REEL_ORIGINAL, TEASER } from './story/stories';
import { MusicPlayerBreakup, type MusicPlayerProps } from './MusicPlayerBreakup';
import { PLAYER } from './story/player';
import { TUMBLR } from './story/tumblr';
import { TumblrBreakup } from './TumblrBreakup';

export function Root() {
  return (
    <>
      {/* the film, 9:16 master (no song: the music moment is its own carousel video) */}
      <Composition
        id="HeroReel"
        component={(p: ReelProps) => <Reel story={REEL} {...p} />}
        durationInFrames={Math.round(REEL.duration * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{} satisfies ReelProps}
      />
      {/* carousel slide 1: the opening (today's computer breaking into 2007), then the film recomposed for 4:5 */}
      <Composition
        id="BreakupCarousel"
        component={BreakupCarousel}
        durationInFrames={Math.round(INTRO.duration * FPS) + Math.round(REEL_CAROUSEL.duration * FPS)}
        fps={FPS}
        width={1080}
        height={1350}
        defaultProps={{} satisfies ReelProps}
      />
      {/* carousel slide 2: her Tumblr post, the teaser */}
      <Composition id="TumblrBreakup" component={TumblrBreakup} durationInFrames={Math.round(TUMBLR.duration * FPS)} fps={FPS} width={1080} height={1350} />
      {/* carousel slide 3: she plays the song (it starts on the Play frame) */}
      <Composition
        id="MusicPlayerBreakup"
        component={MusicPlayerBreakup}
        durationInFrames={Math.round(PLAYER.duration * FPS)}
        fps={FPS}
        width={1080}
        height={1350}
        defaultProps={{ song: true, uiSounds: true, cueTone: false, songVolume: 0.8 } satisfies MusicPlayerProps}
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
      {/* the first cut (commit 38f0d3a), unchanged: popup + song cue at 21.3 s, one nudge. For A/B and reproduction. */}
      <Composition
        id="HeroReelOriginal"
        component={(p: ReelProps) => <Reel story={REEL_ORIGINAL} {...p} />}
        durationInFrames={Math.round(REEL_ORIGINAL.duration * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ song: true, cueTone: false, songStartSeconds: 0, songVolume: 0.85 } satisfies ReelProps}
      />
      <Still id="Carousel" component={CarouselStill} width={1080} height={1350} defaultProps={{ slide: 0 }} />
      <Still id="SignIn" component={SignInStill} width={1080} height={1350} />
    </>
  );
}
