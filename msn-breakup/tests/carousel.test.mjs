// The three carousel videos: 4:5, 30 fps, under Instagram's 60 s, in the final order; the original stills untouched.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { FIRST_CUT, root, slides, source, stories } from './load.mjs';
import { CAROUSEL, OUT_DIR } from '../scripts/carousel-list.mjs';

test('three slides, in the final order: the breakup, the song, her Tumblr post', () => {
  assert.deepEqual(
    CAROUSEL.map((c) => [c.slide, c.file, c.id]),
    [
      [1, '01-msn-breakup-final.mp4', 'BreakupCarousel'],
      [2, '02-music-player-final.mp4', 'MusicPlayerBreakup'],
      [3, '03-tumblr-statement-final.mp4', 'TumblrBreakup'],
    ],
  );
  // the covers and the clean export carry the numbers of the final order
  assert.deepEqual(
    CAROUSEL.map((c) => c.cover.file),
    ['cover-01-msn-breakup.png', 'cover-02-music-player.png', 'cover-03-tumblr-statement.png'],
  );
  assert.deepEqual(
    CAROUSEL.filter((c) => c.clean).map((c) => [c.id, c.clean.file]),
    [['MusicPlayerBreakup', '02-music-player-final-clean.mp4']],
  );
  // a folder of its own: the first version's out/instagram-carousel/ is never overwritten
  assert.equal(OUT_DIR, 'out/instagram-carousel-final');
});

test('the order is read from the list everywhere: no script picks a slide by its position', () => {
  for (const f of ['qa.mjs', 'manifest.mjs', 'contact-sheet.mjs', 'render-carousel.mjs', 'print-cues.mjs']) {
    assert.doesNotMatch(source(`../scripts/${f}`), /CAROUSEL\[\d\]|MOMENTS\[c\.slide\]/, f);
  }
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts['render:carousel:player'], 'node scripts/render-carousel.mjs --only=2');
  assert.equal(pkg.scripts['render:carousel:tumblr'], 'node scripts/render-carousel.mjs --only=3');
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
  // the post is longer to type (46 keys, not 10) and STAY TUNED. follows it: 8.9 s → 13.4 s
  assert.deepEqual(row('TumblrBreakup'), { fps: 30, w: 1080, h: 1350, frames: 402 });
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
