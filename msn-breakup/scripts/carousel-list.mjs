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
export const OUT_DIR = 'out/instagram-carousel-final-v2';
/** The 9:16 master has the same ending hold as slide 1, and the film's exact length. */
export const MASTER_HOLDS = [[33.5, 35.0]];
export const MASTER_FRAMES = frames(REEL.duration);

/**
 * Slide 2 is the approved clean music-player master (no song: it is added by hand),
 * delivered unchanged: copied byte for byte from the approved export, never re-rendered.
 * render:carousel copies the first of `from` whose SHA-256 matches; QA checks the hash.
 */
export const PLAYER_MASTER = {
  sha256: '25e234d95ce31c03baaf1a0f6c128a956244a56ae0934b912b4b511dc17ee768',
  from: ['out/instagram-carousel-final/02-music-player-final-clean.mp4', 'out/archive/approved-aabe785/02-music-player-final-clean.mp4'],
  cover: {
    sha256: '1f3351c1bfa8200e4906724cd8a789119e750465ab6581fda20a778fe7b9bcc6',
    from: ['out/instagram-carousel-final/covers/cover-02-music-player.png', 'out/archive/approved-aabe785/covers/cover-02-music-player.png'],
  },
};

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
    file: '02-music-player-final-clean.mp4',
    title: 'When You’re Gone, in Windows Media Player (clean: the song is added by hand, its first note at 0:02.6)',
    frames: frames(PLAYER.duration),
    cover: { file: 'cover-02-music-player.png', frame: 330 },
    keep: PLAYER_MASTER,
  },
  {
    slide: 3,
    id: 'TumblrBreakup',
    file: '03-tumblr-published-stay-tuned-final.mp4',
    title: 'Her Tumblr post, 8.11.2007: her sentence and STAY TUNED., published',
    frames: frames(TUMBLR.duration),
    // the last frame: her published post
    cover: { file: 'cover-03-tumblr-published.png', frame: frames(TUMBLR.duration) - 1 },
    // designed still moment (QA allows a frozen picture only here): the end of her sentence, her pause, the two Enters
    // and STAY TUNED. typed: only the caret and the small letters in the Post box change (too little for the freeze detector)
    holds: [[+(TUMBLR.body[0].at - 0.4).toFixed(2), +(TUMBLR.body.at(-1).at + 0.1).toFixed(2)]],
  },
];
