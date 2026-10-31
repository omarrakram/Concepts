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

/** The final carousel (its own folder: the earlier versions' folders are left as they were). */
export const OUT_DIR = 'out/instagram-carousel-final-v3';
/** The 9:16 master has the same ending hold as slide 1, and the film's exact length. */
export const MASTER_HOLDS = [[33.5, 35.0]];
export const MASTER_FRAMES = frames(REEL.duration);

/** The order (final): the breakup, then the song, then her Tumblr post with STAY TUNED. in it. */
export const CAROUSEL = [
  {
    slide: 1,
    id: 'BreakupCarousel',
    file: '01-msn-breakup-present-to-2007-final.mp4',
    title: 'A present-day desktop glitches back to 2007, then the breakup on MSN',
    // the length of the composition, exactly: the opening, then the film
    frames: frames(INTRO.duration) + frames(REEL_CAROUSEL.duration),
    // "did u seriously just dump me on msn??" has just landed
    cover: { file: 'cover-01-msn-breakup.png', frame: Math.round(film(14.8) * 30) },
    // designed still moments (QA allows a frozen picture only here): NOW, the present-day desktop, crisp and
    // still but for the pointer crossing it (too small a change for the freeze detector); no answer, after the last nudge
    holds: [
      [0, INTRO.distort],
      [film(33.5), film(35.0)],
    ],
    // the opening, checked against the general-flash limit in QA
    opening: [0, INTRO.duration],
  },
  {
    slide: 2,
    id: 'MusicPlayerBreakup',
    file: '02-music-player-final.mp4',
    title: 'When You’re Gone, in Windows Media Player: the song from the frame Play turns to Pause (0:02.6)',
    frames: frames(PLAYER.duration),
    cover: { file: 'cover-02-music-player.png', frame: 330 },
    // it carries the supplied song (public/music/, gitignored): render:carousel stops if the song is not imported
    song: true,
    // also: the same video without the song (the bars still follow it), for adding a licensed track in the app instead
    clean: { file: '02-music-player-final-clean.mp4', props: { song: false } },
  },
  {
    slide: 3,
    id: 'TumblrBreakup',
    file: '03-tumblr-published-stay-tuned-final.mp4',
    title: 'Slide 2 carries on: the song still playing, she opens Tumblr and publishes her post, 8.11.2007: her sentence and STAY TUNED.',
    frames: frames(TUMBLR.duration),
    // the song carries on from where slide 2 stops (file 15.1 s): render:carousel stops if it is not imported
    song: true,
    // also: the same video without the song (the bars still follow it)
    clean: { file: '03-tumblr-published-stay-tuned-final-clean.mp4', props: { song: false } },
    // the last frame: her published post
    cover: { file: 'cover-03-tumblr-published.png', frame: frames(TUMBLR.duration) - 1 },
    // designed still moment (QA allows a frozen picture only here): the end of her sentence, her pause, the two Enters
    // and STAY TUNED. typed: only the caret and the small letters in the Post box change (too little for the freeze detector)
    holds: [[+(TUMBLR.body[0].at - 0.4).toFixed(2), +(TUMBLR.body.at(-1).at + 0.1).toFixed(2)]],
  },
];
