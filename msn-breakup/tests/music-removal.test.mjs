// Change 2 (main film side): no "Now Listening" popup, no ♫ status, no song.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { source, state, stories } from './load.mjs';

for (const id of ['REEL', 'REEL_CAROUSEL']) {
  const s = stories[id];
  test(`${id}: no listening beat, toast, status change or music cue anywhere in the film`, () => {
    assert.equal(s.beats.some((b) => b.type === 'listening'), false);
    for (let t = 0; t <= s.duration; t += 1 / 30) {
      const st = state.stateAt(s, t);
      assert.equal(st.listening, false);
      assert.equal(st.musicAt, null);
      assert.ok(st.toasts.every((x) => x.kind === 'signin'));
    }
  });
  test(`${id}: the original sign-in notification is still there`, () => {
    assert.equal(s.beats.filter((b) => b.type === 'signin').length, 1);
    assert.ok(state.stateAt(s, 1).toasts.some((x) => x.kind === 'signin'));
  });
}

test('the reel only plays a song for a story with a listening beat (so never for the film)', () => {
  const reel = source('Reel.tsx');
  assert.match(reel, /const cue = story\.beats\.find\(\(b\) => b\.type === 'listening'\)\?\.at;/);
  assert.match(reel, /\{cue !== undefined && song && file && \(/);
});

test('the first cut (kept for A/B) still has its popup + cue at 21.3 s', () => {
  assert.equal(stories.REEL_ORIGINAL.beats.find((b) => b.type === 'listening').at, 21.3);
});
