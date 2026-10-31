import { Series, useVideoConfig } from 'remotion';
import { Intro, INTRO_FRAMES } from './Intro';
import { Reel, type ReelProps } from './Reel';
import { CAROUSEL_VIEW, REEL_CAROUSEL } from './story/stories';

/** Carousel slide 1 (4:5): the opening (her 2007 computer glitches and restarts), then the film, reframed for 4:5. */
export function BreakupCarousel(p: ReelProps) {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence durationInFrames={INTRO_FRAMES(fps)} name="Opening: her 2007 computer restarts">
        <Intro />
      </Series.Sequence>
      <Series.Sequence durationInFrames={Math.round(REEL_CAROUSEL.duration * fps)} name="The film">
        <Reel story={REEL_CAROUSEL} view={CAROUSEL_VIEW} {...p} />
      </Series.Sequence>
    </Series>
  );
}
