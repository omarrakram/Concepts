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

/** The final carousel (its own folder: the first version's out/instagram-carousel/ is left as it was). */
export const OUT_DIR = 'out/instagram-carousel-final';
/** The 9:16 master has the same ending hold as slide 1, and the film's exact length. */
export const MASTER_HOLDS = [[33.5, 35.0]];
export const MASTER_FRAMES = frames(REEL.duration);

/** The order (final): the breakup, then the song, then her Tumblr post and STAY TUNED. */
export const CAROUSEL = [
  {
    slide: 1,
    id: 'BreakupCarousel',
    file: '01-msn-breakup-final.mp4',
    title: 'Her 2007 computer glitches and restarts, then the breakup on MSN',
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
    id: 'MusicPlayerBreakup',
    file: '02-music-player-final.mp4',
    title: 'When You’re Gone, in Windows Media Player',
    frames: frames(PLAYER.duration),
    cover: { file: 'cover-02-music-player.png', frame: 330 },
    // the same video without the song, for adding the licensed track in the app
    clean: { file: '02-music-player-final-clean.mp4', props: { song: false } },
  },
  {
    slide: 3,
    id: 'TumblrBreakup',
    file: '03-tumblr-statement-final.mp4',
    title: 'Her Tumblr post (8.11.2007), then STAY TUNED.',
    frames: frames(TUMBLR.duration),
    // her blog, the post on top, on the last frame before STAY TUNED.
    cover: { file: 'cover-03-tumblr-statement.png', frame: frames(TUMBLR.stayTuned) - 1 },
    // designed still moment (QA allows a frozen picture only here): STAY TUNED. holds to the end
    holds: [[TUMBLR.stayTuned, TUMBLR.duration]],
  },
];
