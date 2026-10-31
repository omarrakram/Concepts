// npm run cues: every beat of every video as time, frame and SMPTE, read straight
// from the story data (src/story/*.ts), so it is always what renders. Includes the
// song's placement cue for the music-player video (and its clean export).
import { fileURLToPath } from 'node:url';
import { CAROUSEL } from './carousel-list.mjs';
import { loadTs } from './load-ts.mjs';

const src = (p) => fileURLToPath(new URL(`../src/${p}`, import.meta.url));
const { FPS } = await loadTs(src('constants.ts'));
const { REEL, REEL_CAROUSEL, REEL_ORIGINAL, TEASER } = await loadTs(src('story/stories.ts'));
const { SONG, HIM, HER } = await loadTs(src('story/cast.ts'));
const { STAY_TUNED, TUMBLR, TUMBLR_TEXT, TEASER_POST } = await loadTs(src('story/tumblr.ts'));
const slideOf = (id) => CAROUSEL.find((c) => c.id === id).slide;
const { INTRO, INTRO_TEXT } = await loadTs(src('story/intro.ts'));
const { PLAYER, PLAY_FRAME, SONG_SOURCE, TRACK } = await loadTs(src('story/player.ts'));

const frame = (s) => Math.round(s * FPS);
const clock = (s) => {
  const ms = Math.round(s * 1000);
  const m = Math.floor(ms / 60000);
  return `${String(m).padStart(2, '0')}:${((ms % 60000) / 1000).toFixed(3).padStart(6, '0')}`;
};
const smpte = (s) => {
  const f = frame(s);
  const sec = Math.floor(f / FPS);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(sec / 3600))}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}:${pad(f % FPS)}`;
};
const table = (rows, end) => {
  rows.push([end, 'end']);
  rows.sort((a, b) => a[0] - b[0]);
  console.log('\n  time       frame  event');
  for (const [t, what] of rows) console.log(`  ${clock(t)}  ${String(frame(t)).padStart(5)}  ${what}`);
};

function film(id, story, size) {
  console.log(`\n${id}  ${story.duration.toFixed(3)} s · ${frame(story.duration)} frames @ ${FPS} fps · ${size}`);
  const cue = story.beats.find((b) => b.type === 'listening');
  if (cue) {
    console.log(`\n  ♫ MUSIC CUE  “${SONG.title}” by ${SONG.artist}`);
    console.log(`    starts at ${clock(cue.at)}  ·  frame ${frame(cue.at)}  ·  SMPTE ${smpte(cue.at)}`);
    console.log(`    = the frame the “${HIM.name} is listening to” popup starts sliding in.`);
  } else {
    console.log(`\n  (no music in this video: the song is its own carousel video, MusicPlayerBreakup)`);
  }
  const rows = [];
  let nudge = 0;
  for (const b of story.beats) {
    if (b.type === 'signin') rows.push([b.at, `${HIM.name} signs in (toast + online chime)`]);
    if (b.type === 'open') rows.push([b.at, 'conversation window opens']);
    if (b.type === 'him') {
      rows.push([b.at - b.typing, `  ${HIM.name} is typing a message.`]);
      rows.push([b.at, `HIM  ${b.text}`]);
    }
    if (b.type === 'her') {
      rows.push([b.from, `  ${HER.name} starts typing`]);
      rows.push([b.at, `HER  ${b.text}`]);
    }
    if (b.type === 'nudge') {
      const click = story.cursor.some((c) => c.click && Math.abs(c.t - b.at) < 1e-6) ? 'click, ' : '';
      rows.push([b.at, `NUDGE ${++nudge} (${click}window shakes, buzz, "You have just sent a nudge.")`]);
    }
    if (b.type === 'listening') rows.push([b.at, `POPUP  ${HIM.name} is listening to “${SONG.title}”  ♫ song starts`]);
  }
  table(rows, story.duration);
}

console.log('MSN breakup: cue sheet');
film('HeroReel (the film, 9:16 master)', REEL, '1080×1920');
const slide1 = INTRO.duration + REEL_CAROUSEL.duration;
console.log(`\nBreakupCarousel (carousel slide ${slideOf('BreakupCarousel')})  ${slide1.toFixed(3)} s · ${frame(INTRO.duration) + frame(REEL_CAROUSEL.duration)} frames @ ${FPS} fps · 1080×1350`);
console.log(`  the opening (${INTRO.duration} s, frames 0–${frame(INTRO.duration) - 1}), then the same beats as HeroReel, reframed for 4:5, each ${INTRO.duration} s later`);
table(
  [
    [0, 'her 2007 XP desktop comes on: Messenger open, the pointer (the film’s first frame; screen-on sound)'],
    [INTRO.glitch, 'it glitches, more and more (glitch sound)'],
    [INTRO.crash, 'it crashes: the picture collapses to a line, then a dot (crash sound)'],
    [INTRO.black, 'black'],
    [INTRO.boot, 'old Windows starts: the old monitor comes on (degauss), the XP loading bar'],
    [INTRO.bootEnd, 'black'],
    [INTRO.welcome, `the XP “${INTRO_TEXT.welcome}” screen`],
    [INTRO.desktop, 'her XP desktop fades in over it: the film’s first frame'],
    [INTRO.duration, 'the film (HeroReel’s beats, reframed)'],
  ],
  slide1,
);

const P = PLAYER;
const inAt = SONG_SOURCE.inFrames / FPS;
console.log(`\nMusicPlayerBreakup (carousel slide ${slideOf('MusicPlayerBreakup')})  ${P.duration.toFixed(3)} s · ${frame(P.duration)} frames @ ${FPS} fps · 1080×1350`);
console.log(`\n  ♫ SONG CUE  “${SONG.title}” by ${SONG.artist} (the supplied file, public/music/)`);
console.log(`    starts at ${clock(P.play)}  ·  frame ${PLAY_FRAME}  ·  SMPTE ${smpte(P.play)}  = the frame Play turns to Pause`);
console.log(`    plays the file from ${inAt.toFixed(3)} s (its first note, ${SONG_SOURCE.firstNote} s, sounds ${((SONG_SOURCE.firstNote - inAt) * 1000).toFixed(0)} ms into frame ${PLAY_FRAME})`);
console.log(`    fades over the last ${P.fadeOut} s and ends at ${clock(P.duration)} = file ${(inAt + P.duration - P.play).toFixed(3)} s`);
console.log(`    the player shows 00:00 on frame ${PLAY_FRAME} and a length of ${TRACK.length}`);
console.log(`    clean export (no song): add the licensed track so its first note lands at ${clock(P.play)} into the clip.`);
table(
  [
    [P.start, 'click: Start (the Start menu opens)'],
    [P.launch, 'click: Windows Media Player (hourglass while it starts)'],
    [P.shown, 'Windows Media Player 11 opens: Library ▸ Songs'],
    [P.select, `click: “${TRACK.title}”, ${TRACK.artist} (selected)`],
    [P.press, 'mouse down on Play (click)'],
    [P.play, `PLAY takes effect: Pause, “Playing”, 00:00  ♫ the song begins`],
    [P.nowPlaying, 'click: Now Playing (the visualisation)'],
  ],
  P.duration,
);

const T = TUMBLR;
console.log(`\nTumblrBreakup (carousel slide ${slideOf('TumblrBreakup')}, the last)  ${T.duration.toFixed(3)} s · ${frame(T.duration)} frames @ ${FPS} fps · 1080×1350  (no music)`);
console.log(`  the post: TEASER_POST in src/story/tumblr.ts (${TEASER_POST.final ? 'final wording' : 'PENDING the collaborator’s final wording'})`);
table(
  [
    [T.launch, 'click: Quick Launch → Internet'],
    [T.shown, `Internet Explorer opens: “Opening page ${TUMBLR_TEXT.dashboardUrl}…”`],
    [T.dashboard, `her Tumblr dashboard: “${TUMBLR_TEXT.addNew}” ${TUMBLR_TEXT.postTypes.join(' ')}`],
    [T.textClick, 'click: Text'],
    [T.loaded, `the text-post form is painted (${TUMBLR_TEXT.formUrl})`],
    ...(T.title
      ? [
          [T.titleClick, 'click: Title field'],
          [T.title.from, '  she starts typing the title'],
          [T.title.at, `TITLE  ${T.title.text}`],
        ]
      : []),
    ...(T.bodyClick !== null ? [[T.bodyClick, 'click: Post field']] : []),
    ...T.body.flatMap((b, i) => [
      [b.from, '  she starts typing'],
      [b.at, `POST   ${b.text}${i < T.body.length - 1 ? '  (Enter)' : ''}`],
    ]),
    [T.create, 'click: Create post'],
    [T.published, `her blog ${TUMBLR_TEXT.blogUrl} with the post on top, dated ${TUMBLR_TEXT.postDate}`],
    [T.stayTuned, `${STAY_TUNED} (to the end)`],
  ],
  T.duration,
);

film('Teaser (unchanged)', TEASER, '1080×1920');
film('HeroReelOriginal (the first cut, kept for A/B)', REEL_ORIGINAL, '1080×1920');
