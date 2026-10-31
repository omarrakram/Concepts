// Slide 1's opening (voice note B, and the final note): her 2007 computer is on, glitches and crashes, and old Windows starts again; then the film, unchanged.
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
  assert.ok(INTRO.glitch >= 1.2, 'the first screen is up long enough to read');
  assert.equal(Math.round(INTRO.duration * FPS), 144);
  // the final note changed what the first screen shows, not the opening's timing: every beat as approved
  assert.deepEqual(INTRO, { duration: 4.8, on: 0.3, glitch: 1.45, crash: 2.35, black: 2.7, boot: 2.85, bootEnd: 3.6, welcome: 3.72, desktop: 4.45 });
});

test('the first screen is her 2007 desktop computer, not a phone: her XP desktop, the film’s first frame', () => {
  const code = source('Intro.tsx');
  // the first screen, the glitch and the crash all draw her XP desktop: Messenger's window, the desktop icons, the pointer
  assert.match(code, /function DesktopScreen[\s\S]*?<Scene story=\{REEL_CAROUSEL\} t=\{0\} view=\{CAROUSEL_VIEW\} frameSeed=\{frame\} \/>/);
  assert.match(code, /\{t < INTRO\.glitch && <DesktopScreen t=\{t\} frame=\{frame\} \/>\}/);
  assert.equal((code.match(/<DesktopScreen t=\{t\} frame=\{frame\} \/>/g) ?? []).length, 3, 'first screen, glitch, crash');
  // nothing of the phone-like lock screen is left: no lock screen, big clock, date, wi-fi or battery
  assert.doesNotMatch(code, /LockScreen|INTRO_TEXT\.(time|date)|battery|wi-?fi|fontSize: 250/i);
  // the film's first frame, as the slide's camera frames it: the top of her desktop, where Messenger and the icons are
  assert.deepEqual(stories.REEL_CAROUSEL.camera[0], { t: 0, x: 270, y: 338, z: 1 });
});

test('the glitch and the crash are the approved effects, unchanged', () => {
  const code = source('Intro.tsx');
  for (const line of [
    'const amt = Math.pow(k, 1.35) * 0.8 + spike * (0.25 + 0.5 * k);',
    'const split = 3 + 40 * amt;',
    'const SLICES = 9;',
    "c: ['#ffffff', '#ff2bd6', '#1ff7ff', '#8a8a8a', '#000000'][Math.floor(h(5) * 5)]!",
    'const sy = interpolate(u, [0, 0.45], [1, 0.004], { extrapolateRight: \'clamp\', easing: Easing.in(Easing.cubic) });',
    'const sx = interpolate(u, [0.45, 0.8], [1, 0.01], { extrapolateLeft: \'clamp\', extrapolateRight: \'clamp\', easing: Easing.in(Easing.quad) });',
  ]) {
    assert.ok(code.includes(line), line);
  }
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

test('the opening’s own words are INTRO_TEXT, "welcome"; its first screen shows the film’s own words', () => {
  assert.deepEqual(INTRO_TEXT, { welcome: 'welcome' });
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
