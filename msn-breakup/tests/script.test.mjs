// Script integrity: every line is word for word, in order, nothing added, nothing removed.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cast, FIRST_CUT, lines, stories } from './load.mjs';

// typed out from the brief, character for character
const HIS = ['hey… sry but i think we shud break up :(', 'u mean alot 2 me tho', 'its not u its me', 'dont txt me ok', 'bye x'];
const HERS = [
  'hey',
  'hello??',
  'u there',
  'y arent u answering',
  'omg',
  'did u seriously just dump me on msn??',
  'answer me',
  'plssss',
  'i know ur online',
  'ur status literally says “online”',
  'wow',
  'ok fine',
  'i hate u',
  '…',
  'i miss u',
  'can we talk',
  'HELLOOOOO',
  'ugh whatever',
  'brb crying',
  'jk',
  'no actually',
];

test('the script is exactly the brief', () => {
  assert.deepEqual(stories.SCRIPT.HIS, HIS);
  assert.deepEqual(stories.SCRIPT.HERS, HERS);
  assert.deepEqual(FIRST_CUT.SCRIPT, { HIS, HERS });
});

for (const id of ['REEL', 'REEL_CAROUSEL']) {
  test(`${id}: his and her lines are the script, in order, nothing added or removed`, () => {
    assert.deepEqual(lines(stories[id], 'him'), HIS);
    assert.deepEqual(lines(stories[id], 'her'), HERS);
  });
}

test('the line-for-line order of the conversation (who speaks when) is unchanged', () => {
  const order = (s) => s.beats.filter((b) => b.type === 'him' || b.type === 'her').map((b) => `${b.type}:${b.text}`);
  assert.deepEqual(order(stories.REEL), order(FIRST_CUT.REEL));
});

test('the first cut is kept verbatim as REEL_ORIGINAL (and the teaser untouched)', () => {
  assert.deepEqual({ ...stories.REEL_ORIGINAL, id: 'reel' }, FIRST_CUT.REEL);
  assert.deepEqual(stories.TEASER, FIRST_CUT.TEASER);
});

test('names, addresses, personal messages and both IYS easter eggs are unchanged', () => {
  assert.deepEqual(cast.HIM, FIRST_CUT.cast.HIM);
  assert.deepEqual(cast.HER, FIRST_CUT.cast.HER);
  assert.deepEqual(cast.CONTACTS, FIRST_CUT.cast.CONTACTS);
  assert.equal(cast.CLOCK, FIRST_CUT.cast.CLOCK);
  assert.equal(cast.DATE, FIRST_CUT.cast.DATE);
  assert.equal(cast.HER.psm, 'in my fluffy pjoys rn (L)');
  assert.equal(cast.TIP, 'Click for new Emoticons and Theme Packs from IYS');
  assert.deepEqual(cast.SONG, { title: 'When You’re Gone', artist: 'Avril Lavigne' });
});
