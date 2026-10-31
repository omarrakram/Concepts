// The three carousel videos: 4:5, 30 fps, under Instagram's 60 s, in the final order; the original stills untouched.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { FIRST_CUT, root, slides, source, stories } from './load.mjs';
import { CAROUSEL, OUT_DIR, PLAYER_MASTER } from '../scripts/carousel-list.mjs';

test('three slides, in the final order: the breakup, the song, her Tumblr post', () => {
  assert.deepEqual(
    CAROUSEL.map((c) => [c.slide, c.file, c.id]),
    [
      [1, '01-msn-breakup-present-to-2007-final.mp4', 'BreakupCarousel'],
      [2, '02-music-player-final-clean.mp4', 'MusicPlayerBreakup'],
      [3, '03-tumblr-published-stay-tuned-final.mp4', 'TumblrBreakup'],
    ],
  );
  // the covers carry the numbers of the final order; slide 3's is its last frame, her published post
  assert.deepEqual(
    CAROUSEL.map((c) => c.cover.file),
    ['cover-01-msn-breakup.png', 'cover-02-music-player.png', 'cover-03-tumblr-published.png'],
  );
  assert.equal(CAROUSEL[2].cover.frame, CAROUSEL[2].frames - 1);
  // a folder of its own: the earlier versions' folders are never overwritten
  assert.equal(OUT_DIR, 'out/instagram-carousel-final-v2');
});

test('slide 2 is the approved clean music-player master, copied unchanged (never re-rendered, no song added)', () => {
  const player = CAROUSEL.find((c) => c.id === 'MusicPlayerBreakup');
  assert.equal(player.keep, PLAYER_MASTER);
  assert.equal(PLAYER_MASTER.sha256, '25e234d95ce31c03baaf1a0f6c128a956244a56ae0934b912b4b511dc17ee768');
  assert.equal(player.frames, 384);
  const render = source('../scripts/render-carousel.mjs');
  assert.match(render, /if \(c\.keep\) \{[\s\S]*?keep\(`slide \$\{c\.slide\}`, c\.keep\.sha256, c\.keep\.from, `\$\{OUT_DIR\}\/\$\{c\.file\}`\);[\s\S]*?continue;/);
  // its composition is not touched by this change, and QA checks the copy's hash
  assert.match(source('../scripts/qa.mjs'), /the approved master, unchanged \(SHA-256\)/);
  // without a song file the song checks are skipped, never failed
  assert.match(source('../scripts/qa.mjs'), /if \(!songImported\) skip\(songCheck,/);
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
  // she now writes STAY TUNED. into the post (a pause, a blank line, 11 keys) and it ends on the post: 13.4 s → 15.8 s
  assert.deepEqual(row('TumblrBreakup'), { fps: 30, w: 1080, h: 1350, frames: 474 });
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
