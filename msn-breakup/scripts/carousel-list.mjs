// The Instagram carousel, in order. Everything (render, covers, contact sheet,
// manifest, QA, tests) reads this one list.
export const OUT_DIR = 'out/instagram-carousel';
/** The 9:16 master has the same ending hold as slide 1. */
export const MASTER_HOLDS = [[33.5, 35.0]];

export const CAROUSEL = [
  {
    slide: 1,
    id: 'BreakupCarousel',
    file: '01-msn-breakup-carousel.mp4',
    title: 'The breakup: the film, recomposed for 4:5',
    // "did u seriously just dump me on msn??" has just landed
    cover: { file: 'cover-01-msn-breakup.png', frame: 444 },
    // designed still moments (QA allows a frozen picture only here): no answer, after the last nudge
    holds: [[33.5, 35.0]],
  },
  {
    slide: 2,
    id: 'TumblrBreakup',
    file: '02-tumblr-breakup-post.mp4',
    title: 'Her Tumblr post, a minute later',
    cover: { file: 'cover-02-tumblr-post.png', frame: 299 },
  },
  {
    slide: 3,
    id: 'MusicPlayerBreakup',
    file: '03-when-youre-gone-music-player.mp4',
    title: 'When You’re Gone, in Windows Media Player',
    cover: { file: 'cover-03-when-youre-gone.png', frame: 330 },
    // the same video without the song, for adding the licensed track in the app
    clean: { file: '03-when-youre-gone-music-player-clean.mp4', props: { song: false } },
  },
];
