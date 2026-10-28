// The three carousel videos: 4:5, 30 fps, under Instagram's 60 s, in order; the original stills untouched.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { FIRST_CUT, root, slides, source, stories } from './load.mjs';
import { CAROUSEL } from '../scripts/carousel-list.mjs';

test('three slides, in order, with the agreed file names', () => {
  assert.deepEqual(
    CAROUSEL.map((c) => [c.file, c.id]),
    [
      ['01-msn-breakup-carousel.mp4', 'BreakupCarousel'],
      ['02-tumblr-breakup-post.mp4', 'TumblrBreakup'],
      ['03-when-youre-gone-music-player.mp4', 'MusicPlayerBreakup'],
    ],
  );
});

test('every composition is registered at the right size, rate and length', () => {
  const out = execFileSync('npx', ['remotion', 'compositions', 'src/index.ts'], { cwd: root, encoding: 'utf8', timeout: 240000 });
  const row = (id) => {
    const m = out.match(new RegExp(`^${id}\\s+(\\d+)\\s+(\\d+)x(\\d+)\\s+(\\d+)`, 'm'));
    assert.ok(m, `${id} listed`);
    return { fps: +m[1], w: +m[2], h: +m[3], frames: +m[4] };
  };
  assert.deepEqual(row('HeroReel'), { fps: 30, w: 1080, h: 1920, frames: 1050 });
  // slide 1: the opening (4.8 s) and then the film (35 s)
  assert.deepEqual(row('BreakupCarousel'), { fps: 30, w: 1080, h: 1350, frames: 144 + 1050 });
  assert.deepEqual(row('TumblrBreakup'), { fps: 30, w: 1080, h: 1350, frames: 267 });
  assert.deepEqual(row('MusicPlayerBreakup'), { fps: 30, w: 1080, h: 1350, frames: 384 });
  assert.deepEqual(row('HeroReelOriginal'), { fps: 30, w: 1080, h: 1920, frames: 990 });
  assert.deepEqual(row('Teaser'), { fps: 30, w: 1080, h: 1920, frames: 210 });
  for (const id of ['Carousel', 'SignIn']) assert.match(out, new RegExp(`^${id}\\s+`, 'm'));
  for (const c of CAROUSEL) {
    assert.ok(row(c.id).frames / 30 <= 60);
    // the QA checks each rendered file against this number
    assert.equal(row(c.id).frames, c.frames, `${c.id} frames in carousel-list`);
  }
});

test('the 4:5 film is the same story as the 9:16 master, only reframed', () => {
  const { camera: _a, id: _b, ...a } = stories.REEL_CAROUSEL;
  const { camera: _c, id: _d, ...b } = stories.REEL;
  assert.deepEqual(a, b);
  assert.deepEqual(stories.CAROUSEL_VIEW, { w: 540, h: 675 });
});

test('the original carousel stills still render the first cut, at the same moments', () => {
  assert.deepEqual(slides.SLIDES, FIRST_CUT.SLIDES);
  assert.deepEqual(slides.BONUS, FIRST_CUT.BONUS);
  assert.match(source('Stills.tsx'), /const story = \{ \.\.\.REEL_ORIGINAL, camera: \[\{ t: 0, \.\.\.s\.cam \}\] \};/);
});
