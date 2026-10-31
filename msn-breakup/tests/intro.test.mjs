// Slide 1's opening (the final brief): NOW, a present-day desktop computer; a glitch; THEN, the Windows XP
// desktop of 2007 takes over and the film starts, unchanged, on the same frame as before.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';
import { FPS, intro, root, source, state, stories } from './load.mjs';

const { INTRO, INTRO_TEXT } = intro;

/** the literal words in a file's JSX (TypeScript's own parser) */
const jsxWords = (f) => {
  const file = ts.createSourceFile(f, source(f), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = [];
  const visit = (n) => {
    if (ts.isJsxText(n) && n.text.trim()) out.push(n.text.trim());
    if (ts.isJsxExpression(n) && n.expression && ts.isStringLiteral(n.expression)) out.push(n.expression.text);
    ts.forEachChild(n, visit);
  };
  visit(file);
  return out.filter((s) => /[\p{L}\p{N}]/u.test(s));
};

test('the opening runs NOW → the pointer stops → the first signs → the glitch → THEN, in the same 4.8 s', () => {
  const seq = [0, INTRO.hesitate, INTRO.distort, INTRO.glitch, INTRO.xp, INTRO.settled, INTRO.duration];
  seq.forEach((v, i) => i && assert.ok(v > seq[i - 1], `step ${i}`));
  // the brief's targets: the modern desktop for 1–2 s (then the first signs), a glitch of 0.5–1 s, then 2007
  assert.ok(INTRO.distort >= 1 && INTRO.distort <= 2, 'the modern desktop, undisturbed');
  assert.ok(INTRO.xp - INTRO.glitch >= 0.5 && INTRO.xp - INTRO.glitch <= 1, 'the glitch');
  // the length is unchanged, so the film starts on frame 144 as before (the story is not shifted or cut)
  assert.equal(INTRO.duration, 4.8);
  assert.equal(Math.round(INTRO.duration * FPS), 144);
});

test('NOW: unmistakably a present-day desktop computer, not a phone', () => {
  const code = source('Intro.tsx');
  const now = source('ui/present.tsx');
  // the first thing on screen is the present-day desktop, crisp (no old-monitor grain)
  assert.match(code, /\{frame < glitchFrom && <Unsteady t=\{t\} frame=\{frame\} \/>\}/);
  assert.match(code, /function Now[\s\S]*?<PresentDesktop pointer=\{p\} hover=\{[^}]+\} \/>/);
  // a desktop: wallpaper, desktop icons, a browser window with its tab, address bar and window controls, the taskbar, the mouse pointer
  for (const part of ['<Wallpaper />', '<Icons />', '<Browser hover={hover} />', '<Taskbar />', '<Pointer size={15} />', '<StartMark />']) assert.ok(now.includes(part), part);
  assert.match(now, /'M1 5h8', 'M1\.5 1\.5h7v7h-7z', 'M1\.5 1\.5l7 7M8\.5 1\.5l-7 7'/, 'minimise, maximise, close');
  // today's taskbar: the clock and the date, with this year
  assert.equal(INTRO_TEXT.time, '11:47 PM');
  assert.match(INTRO_TEXT.date, /^\d{1,2}\/\d{1,2}\/2026$/);
  // nothing of a phone: no lock screen, battery, notch, signal bars, app grid or home screen
  assert.doesNotMatch(code + now, /LockScreen|battery|notch|signal|homeScreen|app ?grid|swipe/i);
});

test('the pointer stops where the film’s pointer is on its first frame, so the old one appears in its place', () => {
  const code = source('Intro.tsx');
  assert.match(code, /const FILM_START = stateAt\(REEL_CAROUSEL, 0, V\);/);
  assert.match(code, /POINTER_STOP = \{ x: FILM_START\.cursor\.x - FILM_START\.camera\.x \+ V\.w \/ 2, y: FILM_START\.cursor\.y - FILM_START\.camera\.y \+ V\.h \/ 2 \}/);
  const s = state.stateAt(stories.REEL_CAROUSEL, 0, stories.CAROUSEL_VIEW);
  assert.deepEqual(s.cursor, { x: 448, y: 214, pressed: false });
  // it hesitates on the way (it stalls), stops, then twitches before the glitch
  assert.match(code, /const stall = \[29, 30, 31\];/);
  assert.match(code, /const twitch: Record<number, \[number, number\]> = \{ 54: /);
});

test('the glitch: jumps, a freeze, split colours, torn bands, interference, damaged-video blocks, and 2007 through the cracks', () => {
  const code = source('Intro.tsx');
  // brief frame displacement and a short freeze
  assert.match(code, /const JUMPS: Record<number, number> = \{ 1: -54, 11: 36, 16: -24 \};/);
  assert.match(code, /const FREEZE = \[19, 20, 21\];/);
  // RGB channel separation (one channel each, screened back together) and torn bands
  assert.match(code, /filter: `url\(#intro-\$\{c\}\)`, mixBlendMode: 'screen'/);
  assert.match(code, /clipPath: `inset\(\$\{b\.top\}px 0 \$\{OUT\.h - b\.bottom\}px 0\)`, transform: `translateX\(\$\{b\.dx\}px\)`/);
  // fast horizontal interference: thin lines and a band of streaky noise
  assert.match(code, /<filter id="intro-streaks"/);
  // period compression artifacts: blocks on a grid, half of them in big square pixels
  assert.match(code, /<filter id="intro-blocky"/);
  assert.match(code, /filter: 'url\(#intro-blocky\)'/);
  // the old system shows through: the 2007 screen inside the holes and the turned bands
  assert.match(code, /const layer = \(isThen: boolean\) => \(isThen \? <Then frame=\{slow\} \/> : <Now t=\{INTRO\.hesitate\} frame=\{0\} \/>\);/);
  assert.match(code, /clipPath: `path\('\$\{crisp\}'\)`/);
  // the first opening's glitch vocabulary is kept: its noise colours and its scanlines
  assert.ok(code.includes("'#ff2bd6', '#1ff7ff', '#000000'"));
  assert.ok(code.includes('repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0px, rgba(0,0,0,.35) 2px, transparent 2px, transparent 5px)'));
});

test('the glitch is intense, never a strobe: each part turns old once, one pop, slow big shapes', () => {
  const code = source('Intro.tsx');
  // bands turn from NOW to THEN once each, evenly through the glitch, and never back
  assert.match(code, /turns: 0\.15 \+ \(0\.7 \* order\.indexOf\(i\)\) \/ \(n - 1\)/);
  assert.match(code, /isThen: k >= b\.turns/);
  // holes open once and stay open
  assert.match(code, /const open = HOLES\.filter\(\(o\) => k >= o\.opens\);/);
  // one brightness pop; the tears move 10 times a second
  assert.match(code, /const POP = 7;/);
  assert.match(code, /const slow = 1000 \+ Math\.floor\(fg \/ 3\);/);
  // and QA measures the rendered opening against the general-flash limit
  assert.match(source('../scripts/qa.mjs'), /the opening is under the general-flash limit \(WCAG 2\.3\.1\)/);
});

test('THEN: the Windows XP desktop takes over (the old monitor degausses) and settles on the film’s first frame', () => {
  const code = source('Intro.tsx');
  assert.match(code, /\{frame >= xpFrom && <XpTakesOver t=\{t\} frame=\{frame\} \/>\}/);
  assert.match(code, /function Then\(\{ frame \}: \{ frame: number \}\) \{\s*return <Scene story=\{REEL_CAROUSEL\} t=\{0\} view=\{V\} frameSeed=\{frame\} \/>;/);
  assert.match(code, /if \(t >= INTRO\.settled\) return <Then frame=\{frame\} \/>;/);
  // the degauss fades to nothing by INTRO.settled (no jump into the film)
  assert.match(code, /const d = \(1 - p\) \* \(1 - p\);/);
  // the film's first frame, as the slide's camera frames it: the top of her desktop, where Messenger and the icons are
  assert.deepEqual(stories.REEL_CAROUSEL.camera[0], { t: 0, x: 270, y: 338, z: 1 });
});

test('slide 1 is the opening, then the film exactly as before (same story, same camera, same length)', () => {
  const comp = source('BreakupCarousel.tsx');
  assert.match(comp, /<Series\.Sequence durationInFrames=\{INTRO_FRAMES\(fps\)\}[^>]*>\s*<Intro \/>/);
  assert.match(comp, /<Series\.Sequence durationInFrames=\{Math\.round\(REEL_CAROUSEL\.duration \* fps\)\}[^>]*>\s*<Reel story=\{REEL_CAROUSEL\} view=\{CAROUSEL_VIEW\} \{\.\.\.p\} \/>/);
  assert.match(source('Root.tsx'), /id="BreakupCarousel"\s+component=\{BreakupCarousel\}\s+durationInFrames=\{Math\.round\(INTRO\.duration \* FPS\) \+ Math\.round\(REEL_CAROUSEL\.duration \* FPS\)\}/);
  assert.equal(stories.REEL_CAROUSEL.duration, 35);
});

test('the opening’s words are all in INTRO_TEXT; none is written into the drawing', () => {
  assert.deepEqual(INTRO_TEXT, {
    time: '11:47 PM',
    date: '8/23/2026',
    temperature: '64°F',
    weather: 'Clear',
    search: 'Search',
    icons: ['Recycle Bin', 'Documents'],
    tab: 'New tab',
    address: 'Search or type a web address',
    searchBox: 'Search the web',
    shortcuts: ['Mail', 'Maps', 'Music', 'Photos', 'Docs', 'Weather'],
  });
  assert.deepEqual(jsxWords('Intro.tsx'), []);
  assert.deepEqual(jsxWords('ui/present.tsx'), []);
});

test('everything in it is drawn in code: no pictures, logos or vendor names', () => {
  const vendor = /Microsoft|Windows|\bXP\b|Edge|Chrome|Firefox|Google|Bing|Apple|mac ?OS|Android|Samsung|Dell|Lenovo|\bHP\b/i;
  for (const f of ['Intro.tsx', 'ui/present.tsx']) {
    assert.doesNotMatch(source(f), /<Img|<img|<Video|staticFile\(/, f);
    const file = ts.createSourceFile(f, source(f), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const strings = [];
    const visit = (n) => {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isJsxText(n)) strings.push(n.text);
      ts.forEachChild(n, visit);
    };
    visit(file);
    assert.deepEqual(strings.filter((s) => vendor.test(s)), [], f);
  }
  assert.doesNotMatch(JSON.stringify(INTRO_TEXT), vendor);
});

test('its sounds: the glitch on the glitch, the degauss when XP takes over; no music', () => {
  const sfx = source('../scripts/make-sfx.mjs');
  for (const name of ['glitch', 'degauss']) {
    assert.match(sfx, new RegExp(`wav\\('${name}', 0\\.9`));
    assert.ok(existsSync(resolve(root, `public/sfx/${name}.wav`)), `${name}.wav`);
  }
  const code = source('Intro.tsx');
  assert.match(code, /\{ at: INTRO\.glitch, src: sfx\('glitch'\), volume: 0\.5, key: 'intro-glitch' \}/);
  assert.match(code, /\{ at: INTRO\.xp, src: sfx\('degauss'\), volume: 0\.5, key: 'intro-degauss' \}/);
  // the glitch sound (0.9 s) lasts exactly as long as the glitch
  assert.equal(+(INTRO.xp - INTRO.glitch).toFixed(3), 0.9);
  assert.doesNotMatch(code, /songFile|music\//);
});

test('the present-day face is bundled (Inter, OFL), so no frame renders in a fallback font', () => {
  const fonts = source('fonts.ts');
  assert.match(fonts, /\['Inter', 'fonts\/inter-400\.woff2', '400'\]/);
  assert.match(fonts, /\['Inter', 'fonts\/inter-600\.woff2', '600'\]/);
  for (const f of ['inter-400.woff2', 'inter-600.woff2', 'LICENSE-OFL-inter.txt']) assert.ok(existsSync(resolve(root, `public/fonts/${f}`)), f);
  // the drawing asks only for those two weights
  assert.doesNotMatch(source('ui/present.tsx'), /fontWeight: (?!400|600)\d+|text\(\d+(?:\.\d+)?, (?!400|600)\d+/);
});
