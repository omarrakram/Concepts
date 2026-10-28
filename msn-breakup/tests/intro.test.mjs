// Slide 1's opening (voice note B): today's computer turns on, glitches and crashes, and old Windows starts; then the film, unchanged.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';
import { FPS, intro, root, source, stories } from './load.mjs';

const { INTRO, INTRO_TEXT } = intro;

test('the opening runs in order: on, glitch, crash, black, old Windows, welcome, her desktop', () => {
  const seq = [0, INTRO.on, INTRO.glitch, INTRO.crash, INTRO.black, INTRO.boot, INTRO.bootEnd, INTRO.welcome, INTRO.desktop, INTRO.duration];
  seq.forEach((v, i) => i && assert.ok(v > seq[i - 1], `step ${i}`));
  // "a little introduction": short next to the 35 s film
  assert.ok(INTRO.duration <= 5);
  assert.ok(INTRO.glitch >= 1.2, 'the present-day screen is up long enough to read');
  assert.equal(Math.round(INTRO.duration * FPS), 144);
});

test('slide 1 is the opening, then the film exactly as before (same story, same camera, same length)', () => {
  const comp = source('BreakupCarousel.tsx');
  assert.match(comp, /<Series\.Sequence durationInFrames=\{INTRO_FRAMES\(fps\)\}[^>]*>\s*<Intro \/>/);
  assert.match(comp, /<Series\.Sequence durationInFrames=\{Math\.round\(REEL_CAROUSEL\.duration \* fps\)\}[^>]*>\s*<Reel story=\{REEL_CAROUSEL\} view=\{CAROUSEL_VIEW\} \{\.\.\.p\} \/>/);
  assert.match(source('Root.tsx'), /id="BreakupCarousel"\s+component=\{BreakupCarousel\}\s+durationInFrames=\{Math\.round\(INTRO\.duration \* FPS\) \+ Math\.round\(REEL_CAROUSEL\.duration \* FPS\)\}/);
  assert.equal(stories.REEL_CAROUSEL.duration, 35);
  // the opening ends on the film's own first frame
  assert.match(source('Intro.tsx'), /<Scene story=\{REEL_CAROUSEL\} t=\{0\} view=\{CAROUSEL_VIEW\}/);
});

test('the only words in the opening are INTRO_TEXT: the clock, the date, "welcome"', () => {
  assert.equal(INTRO_TEXT.time, '11:47'); // the film's minute (11:47 PM), 19 years on
  assert.equal(INTRO_TEXT.date, 'Wednesday, October 28');
  assert.equal(new Date(Date.UTC(2026, 9, 28)).getUTCDay(), 3); // 28 October 2026 is a Wednesday
  assert.equal(INTRO_TEXT.welcome, 'welcome');
  const file = ts.createSourceFile('Intro.tsx', source('Intro.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const literals = [];
  const visit = (n) => {
    if (ts.isJsxText(n) && n.text.trim()) literals.push(n.text.trim());
    if (ts.isJsxExpression(n) && n.expression && ts.isStringLiteral(n.expression)) literals.push(n.expression.text);
    ts.forEachChild(n, visit);
  };
  visit(file);
  assert.deepEqual(literals.filter((s) => /[\p{L}\p{N}]/u.test(s)), []);
});

test('everything in it is drawn in code: no pictures, logos or vendor names', () => {
  const code = source('Intro.tsx');
  assert.doesNotMatch(code, /<Img|<img|<Video|staticFile\(/);
  // nothing on screen names a vendor: no string in the file, and none of INTRO_TEXT
  const file = ts.createSourceFile('Intro.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const strings = [...Object.values(INTRO_TEXT)];
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isJsxText(n)) strings.push(n.text);
    ts.forEachChild(n, visit);
  };
  visit(file);
  const vendor = /Microsoft|Windows|\bXP\b|Apple|mac ?OS|Google|Android|Samsung|Dell|Lenovo|\bHP\b/i;
  assert.deepEqual(strings.filter((s) => vendor.test(s)), []);
});

test('its sounds are the four original ones, on the moments they belong to', () => {
  const sfx = source('../scripts/make-sfx.mjs');
  for (const name of ['screen-on', 'glitch', 'crash', 'degauss']) {
    assert.match(sfx, new RegExp(`wav\\('${name}'`));
    assert.ok(existsSync(resolve(root, `public/sfx/${name}.wav`)), `${name}.wav`);
  }
  const code = source('Intro.tsx');
  assert.match(code, /\{ at: 0\.02, src: sfx\('screen-on'\)/);
  assert.match(code, /\{ at: INTRO\.glitch, src: sfx\('glitch'\)/);
  assert.match(code, /\{ at: INTRO\.crash, src: sfx\('crash'\)/);
  assert.match(code, /\{ at: INTRO\.boot, src: sfx\('degauss'\)/);
  // no music, no startup jingle
  assert.doesNotMatch(code, /songFile|music\//);
});
