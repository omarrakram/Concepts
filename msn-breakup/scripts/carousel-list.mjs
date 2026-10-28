// The Instagram carousel, in order. Everything (render, covers, contact sheet,
// manifest, QA, tests) reads this one list.
import { fileURLToPath } from 'node:url';
import { loadTs } from './load-ts.mjs';

const ts = (p) => loadTs(fileURLToPath(new URL(`../src/${p}`, import.meta.url)));
const { FPS } = await ts('constants.ts');
const { INTRO } = await ts('story/intro.ts');
const { TUMBLR } = await ts('story/tumblr.ts');
const { PLAYER } = await ts('story/player.ts');
const { REEL, REEL_CAROUSEL } = await ts('story/stories.ts');
const frames = (s) => Math.round(s * FPS);
/** slide 1 opens with the intro, so the film's moments come INTRO.duration later */
const film = (s) => +(INTRO.duration + s).toFixed(3);

export const OUT_DIR = 'out/instagram-carousel';
/** The 9:16 master has the same ending hold as slide 1, and the film's exact length. */
export const MASTER_HOLDS = [[33.5, 35.0]];
export const MASTER_FRAMES = frames(REEL.duration);

export const CAROUSEL = [
  {
    slide: 1,
    id: 'BreakupCarousel',
    file: '01-msn-breakup-carousel.mp4',
    title: 'Today’s computer crashes into 2007, then the breakup',
    // the length of the composition, exactly: the opening, then the film
    frames: frames(INTRO.duration) + frames(REEL_CAROUSEL.duration),
    // "did u seriously just dump me on msn??" has just landed
    cover: { file: 'cover-01-msn-breakup.png', frame: Math.round(film(14.8) * 30) },
    // designed still moments (QA allows a frozen picture only here): no answer, after the last nudge
    holds: [[film(33.5), film(35.0)]],
    // designed dark moments (QA allows black only here): the crash, old Windows starting on a black screen
    dark: [[INTRO.crash, +(INTRO.welcome + 0.1).toFixed(2)]],
  },
  {
    slide: 2,
    id: 'TumblrBreakup',
    file: '02-tumblr-breakup-post.mp4',
    title: 'A minute later, her Tumblr post: the teaser',
    frames: frames(TUMBLR.duration),
    // the last frame: her blog, the post on top
    cover: { file: 'cover-02-tumblr-post.png', frame: Math.round(TUMBLR.duration * 30) - 1 },
  },
  {
    slide: 3,
    id: 'MusicPlayerBreakup',
    file: '03-when-youre-gone-music-player.mp4',
    title: 'When You’re Gone, in Windows Media Player',
    frames: frames(PLAYER.duration),
    cover: { file: 'cover-03-when-youre-gone.png', frame: 330 },
    // the same video without the song, for adding the licensed track in the app
    clean: { file: '03-when-youre-gone-music-player-clean.mp4', props: { song: false } },
  },
];
