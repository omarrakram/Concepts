// Change 3 (his lines 5–10 % faster) without touching anything of hers.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIRST_CUT, state, stories } from './load.mjs';

const of = (s, type) => s.beats.filter((b) => b.type === type);
const open = (s) => s.beats.find((b) => b.type === 'open').at;

test('his five lines arrive 5–10 % faster (measured from the window opening), typing notices too', () => {
  const now = of(stories.REEL, 'him');
  const before = of(FIRST_CUT.REEL, 'him');
  now.forEach((b, i) => {
    const speedup = 1 - (b.at - open(stories.REEL)) / (before[i].at - open(FIRST_CUT.REEL));
    assert.ok(speedup >= 0.05 && speedup <= 0.1, `line ${i}: ${(speedup * 100).toFixed(1)} %`);
    const typing = 1 - b.typing / before[i].typing;
    assert.ok(typing >= 0.05 && typing <= 0.1, `typing ${i}: ${(typing * 100).toFixed(1)} %`);
    assert.equal(b.text, before[i].text);
  });
});

test('her lines keep their exact typing time, gaps and rhythm (all moved by the same SAVED)', () => {
  const now = of(stories.REEL, 'her');
  const before = of(FIRST_CUT.REEL, 'her');
  assert.equal(now.length, before.length);
  now.forEach((b, i) => {
    assert.ok(Math.abs(b.from - (before[i].from - stories.SAVED)) < 1e-9, `from ${b.text}`);
    assert.ok(Math.abs(b.at - (before[i].at - stories.SAVED)) < 1e-9, `at ${b.text}`);
    // same keystroke timings, relative to the line's start
    const k1 = state.keyTimes(b).map((k) => +(k - b.from).toFixed(9));
    const k0 = state.keyTimes(before[i]).map((k) => +(k - before[i].from).toFixed(9));
    assert.deepEqual(k1, k0, `rhythm of ${b.text}`);
  });
});

test('the silence after "bye x" is as long as in the first cut', () => {
  const gap = (s) => of(s, 'her')[0].from - of(s, 'him').at(-1).at;
  assert.ok(Math.abs(gap(stories.REEL) - gap(FIRST_CUT.REEL)) < 1e-9);
});

test('the film grows to 35 s for the two new nudges: nothing is cut or sped up on her side to make room', () => {
  assert.equal(stories.REEL.duration, 35);
  assert.equal(stories.REEL_CAROUSEL.duration, 35);
  const herNow = of(stories.REEL, 'her');
  const herBefore = of(FIRST_CUT.REEL, 'her');
  assert.equal(herNow.at(-1).at - herNow[0].from, herBefore.at(-1).at - herBefore[0].from);
});
