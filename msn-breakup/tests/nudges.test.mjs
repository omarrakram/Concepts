// Change 4: exactly three nudges: the original in the middle, two new ones strictly after "no actually".
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { FIRST_CUT, root, state, stories } from './load.mjs';

/** Length of a PCM WAV (seconds), from its header. */
const wavSeconds = (file) => {
  const b = readFileSync(file);
  const rate = b.readUInt32LE(28); // byte rate
  let i = 12;
  while (b.toString('ascii', i, i + 4) !== 'data') i += 8 + b.readUInt32LE(i + 4);
  return b.readUInt32LE(i + 4) / rate;
};
const SOUND_LEN = wavSeconds(`${root}/public/sfx/nudge.wav`);
const herAt = (s, text) => s.beats.find((b) => b.type === 'her' && b.text === text);

for (const id of ['REEL', 'REEL_CAROUSEL']) {
  const s = stories[id];
  const nudges = s.beats.filter((b) => b.type === 'nudge').map((b) => b.at);

  test(`${id}: exactly three nudges`, () => assert.equal(nudges.length, 3));

  test(`${id}: nudge 1 is the original, between "HELLOOOOO" and "ugh whatever", at its first-cut moment`, () => {
    assert.ok(nudges[0] > herAt(s, 'HELLOOOOO').at && nudges[0] < herAt(s, 'ugh whatever').from);
    const original = FIRST_CUT.REEL.beats.find((b) => b.type === 'nudge').at;
    assert.ok(Math.abs(nudges[0] - (original - stories.SAVED)) < 1e-9);
  });

  test(`${id}: nudges 2 and 3 come strictly after "no actually", separately, and before the end`, () => {
    const last = herAt(s, 'no actually').at;
    assert.ok(nudges[1] > last && nudges[2] > nudges[1]);
    // no overlap: the first shake and its buzz are over before the next click
    assert.ok(nudges[1] + state.NUDGE_LEN < nudges[2] && nudges[1] + SOUND_LEN <= nudges[2]);
    assert.ok(nudges[2] + SOUND_LEN < s.duration);
    // a still moment between the two shakes
    assert.deepEqual(state.stateAt(s, (nudges[1] + state.NUDGE_LEN + nudges[2]) / 2).shake, { x: 0, y: 0 });
  });

  test(`${id}: each nudge has its own click on the nudge button, shake and history entry`, () => {
    const clicks = s.cursor.filter((c) => c.click && c.x === stories.SPOT.nudge.x && c.y === stories.SPOT.nudge.y).map((c) => c.t);
    assert.deepEqual(clicks, nudges);
    for (const at of nudges) {
      const shaking = state.stateAt(s, at + 0.1).shake;
      assert.ok(Math.hypot(shaking.x, shaking.y) > 0, `shake at ${at}`);
      assert.equal(state.stateAt(s, at - 0.05).shake.x, 0);
    }
    const end = state.stateAt(s, s.duration).entries;
    const kinds = end.map((e) => (e.kind === 'nudge' ? 'NUDGE' : e.text));
    assert.equal(kinds.filter((k) => k === 'NUDGE').length, 3);
    assert.equal(kinds[kinds.indexOf('HELLOOOOO') + 1], 'NUDGE');
    assert.deepEqual(kinds.slice(-3), ['no actually', 'NUDGE', 'NUDGE']);
  });
}

test('the first cut keeps its single nudge', () => {
  assert.equal(stories.REEL_ORIGINAL.beats.filter((b) => b.type === 'nudge').length, 1);
});
