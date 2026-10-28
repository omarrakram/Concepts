// Cropping: on every frame, what matters at that moment is fully inside the camera's view.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FPS, player, state, stories, tumblr } from './load.mjs';

const view916 = { w: 540, h: 960 };
const view45 = stories.CAROUSEL_VIEW;
/** the part of the 540 × 960 screen a camera sees */
const seen = (cam, view) => ({ x: cam.x - view.w / cam.z / 2, y: cam.y - view.h / cam.z / 2, w: view.w / cam.z, h: view.h / cam.z });
const inside = (r, v) => r.x >= v.x - 1e-6 && r.y >= v.y - 1e-6 && r.x + r.w <= v.x + v.w + 1e-6 && r.y + r.h <= v.y + v.h + 1e-6;
const frames = (from, to) => Array.from({ length: Math.round((to - from) * FPS) + 1 }, (_, i) => from + i / FPS);
const expectInView = (label, camAt, view, rect, from, to) => {
  for (const t of frames(from, to)) assert.ok(inside(rect, seen(camAt(t), view)), `${label} cut off at ${t.toFixed(2)} s`);
};

// conversation window layout (src/ui/Conversation.tsx: CONVO, LEFT, HIST, INPUT): body starts at y 401
const TYPED = { x: 39, y: 741, w: 272, h: 22 }; // the line she is typing (input box text)
const NEWEST = { x: 33, y: 655, w: 300, h: 44 }; // the newest message in the history
const STATUS = { x: 35, y: 847, w: 250, h: 13 }; // "Last message received at 11:47 PM on 8/23/2007."
const NUDGE_BTN = { x: stories.SPOT.nudge.x - 12, y: stories.SPOT.nudge.y - 10, w: 24, h: 20 };

for (const [id, view] of [['REEL', view916], ['REEL_CAROUSEL', view45]]) {
  const s = stories[id];
  const cam = (t) => state.cameraAt(s.camera, t, view);
  const her = s.beats.filter((b) => b.type === 'her');
  test(`${id}: every line she types, and the newest message, stays in frame`, () => {
    for (const b of her) {
      expectInView(`typing "${b.text}"`, cam, view, TYPED, b.from, b.at);
      expectInView(`"${b.text}" landing`, cam, view, NEWEST, b.at + 0.15, b.at + 0.6);
    }
  });
  test(`${id}: the nudge button at each of the three nudges, the status line at the end`, () => {
    for (const n of s.beats.filter((b) => b.type === 'nudge')) expectInView('nudge button', cam, view, NUDGE_BTN, n.at - 0.3, n.at + 0.3);
    expectInView('status line', cam, view, STATUS, 32.5, s.duration);
  });
}

test('TumblrBreakup: the Text button, the field while she types, Create post, the post at the end', () => {
  const { TUMBLR, PAGE, FORM, pill, tumblrAt } = tumblr;
  const cam = (t) => tumblrAt(t, view45).camera;
  const r = (f) => ({ x: PAGE.x + f.x, y: PAGE.y + f.y, w: f.w, h: f.h });
  expectInView('Add a new... Text', cam, view45, r(pill(0)), TUMBLR.dashboard, TUMBLR.textClick + 0.2);
  expectInView('title field', cam, view45, r(FORM.title), TUMBLR.title.from, TUMBLR.title.at);
  if (TUMBLR.body.length) expectInView('post field', cam, view45, r(FORM.body), TUMBLR.body[0].from, TUMBLR.body.at(-1).at);
  expectInView('Create post', cam, view45, r(FORM.create), TUMBLR.create - 0.3, TUMBLR.create + 0.2);
  // her blog's title, the day block (THU AUG 23RD) and the post title, to the last frame
  expectInView('the published post', cam, view45, { x: PAGE.x + 10, y: PAGE.y + 44, w: 312, h: 128 }, TUMBLR.published, TUMBLR.duration);
});

test('MusicPlayerBreakup: the song row and Play until it plays, then the visualisation and the time', () => {
  const { PLAYER, WMP, WMP_WIN, playerAt } = player;
  const cam = (t) => playerAt(t, view45).camera;
  const at = (x, y, w, h) => ({ x: WMP_WIN.x + x, y: WMP_WIN.y + y, w, h });
  expectInView('song row', cam, view45, at(WMP.nav, WMP.row, WMP_WIN.w - WMP.nav, WMP.rowH), PLAYER.shown, PLAYER.nowPlaying);
  expectInView('Play button', cam, view45, at(WMP.play.x - WMP.play.r, WMP.play.y - WMP.play.r, 2 * WMP.play.r, 2 * WMP.play.r), PLAYER.shown, PLAYER.duration);
  expectInView('visualisation', cam, view45, at(15, WMP.title + WMP.tabs + 20, WMP.listPane - 30, 420), PLAYER.nowPlaying + 0.1, PLAYER.duration);
  expectInView('time + title', cam, view45, at(9, WMP_WIN.h - WMP.controls + 16, 106, 44), PLAYER.play, PLAYER.duration);
});
