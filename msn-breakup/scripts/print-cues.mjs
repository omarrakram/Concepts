// npm run cues: the exact music cue and every beat of the reel and teaser,
// read straight from src/story/stories.ts (so it is always what renders).
import { fileURLToPath } from 'node:url';
import { loadTs } from './load-ts.mjs';

const src = (p) => fileURLToPath(new URL(`../src/${p}`, import.meta.url));
const { FPS } = await loadTs(src('constants.ts'));
const { REEL, TEASER } = await loadTs(src('story/stories.ts'));
const { SONG, HIM, HER } = await loadTs(src('story/cast.ts'));

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

function sheet(id, story) {
  console.log(`\n${id}  ${story.duration.toFixed(3)} s · ${frame(story.duration)} frames @ ${FPS} fps · 1080×1920`);
  const cue = story.beats.find((b) => b.type === 'listening');
  if (cue) {
    console.log(`\n  ♫ MUSIC CUE  “${SONG.title}” by ${SONG.artist}`);
    console.log(`    starts at ${clock(cue.at)}  ·  frame ${frame(cue.at)}  ·  SMPTE ${smpte(cue.at)}`);
    console.log(`    = the frame the “${HIM.name} is listening to” popup starts sliding in.`);
    console.log(`    Drop a licensed file at public/music/when-youre-gone.(mp3|m4a|wav|aac|ogg) and re-render.`);
  } else {
    console.log('\n  (no music cue: the teaser ends before the popup)');
  }
  const rows = [];
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
    if (b.type === 'nudge') rows.push([b.at, 'NUDGE (window shakes, buzz)']);
    if (b.type === 'listening') rows.push([b.at, `POPUP  ${HIM.name} is listening to “${SONG.title}”  ♫ song starts`]);
  }
  rows.push([story.duration, 'end']);
  rows.sort((a, b) => a[0] - b[0]);
  console.log('\n  time       frame  event');
  for (const [t, what] of rows) console.log(`  ${clock(t)}  ${String(frame(t)).padStart(5)}  ${what}`);
}

console.log('MSN breakup: cue sheet');
sheet('HeroReel', REEL);
sheet('Teaser', TEASER);
