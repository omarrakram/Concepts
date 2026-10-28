// Change 1: the Tumblr video (her lines verbatim, every other word listed, no music).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cast, FIRST_CUT, source, state, stories, tumblr } from './load.mjs';

const { TUMBLR, TUMBLR_TEXT, tumblrAt } = tumblr;
const HERS = stories.SCRIPT.HERS;

test('the post is her own lines, verbatim and in their original order', () => {
  assert.equal(TUMBLR.title.text, 'did u seriously just dump me on msn??');
  assert.deepEqual(
    TUMBLR.body.map((b) => b.text),
    ['i hate u', '…', 'i miss u'],
  );
  const idx = [TUMBLR.title, ...TUMBLR.body].map((b) => HERS.indexOf(b.text));
  assert.ok(idx.every((i, k) => i >= 0 && (k === 0 || i > idx[k - 1])));
});

test('she types them with the exact rhythm (and key sounds) she had in the film', () => {
  for (const b of [TUMBLR.title, ...TUMBLR.body]) {
    const film = FIRST_CUT.REEL.beats[b.orig.index];
    assert.equal(film.text, b.text);
    const rel = (x) => state.keyTimes(x).map((k) => +(k - x.from).toFixed(9));
    assert.deepEqual(rel(b), rel(film));
  }
});

test('timeline: launch → page → title → post → Create post → her blog, within ~10 s', () => {
  const T = TUMBLR;
  const seq = [T.launch, T.shown, T.loaded, T.titleClick, T.title.from, T.title.at, T.bodyClick, ...T.body.flatMap((b) => [b.from, b.at]), T.create, T.published, T.duration];
  seq.forEach((v, i) => i && assert.ok(v > seq[i - 1], `step ${i}`));
  assert.ok(T.duration >= 7 && T.duration <= 10);
});

test('what is on screen follows the timeline', () => {
  const T = TUMBLR;
  assert.equal(tumblrAt(0).ieShown, false);
  assert.equal(tumblrAt(T.shown + 0.01).page, 'blank');
  assert.equal(tumblrAt(T.loaded + 0.01).page, 'form');
  assert.equal(tumblrAt(T.title.at).title, T.title.text);
  assert.deepEqual(tumblrAt(T.create - 0.01).body, ['i hate u', '…', 'i miss u']);
  assert.equal(tumblrAt(T.create + 0.2).loading, true);
  assert.equal(tumblrAt(T.published).page, 'blog');
  assert.equal(tumblrAt(T.published).url, TUMBLR_TEXT.blogUrl);
});

test('no new names: the blog is her Messenger name and address; the date is the film’s', () => {
  assert.equal(TUMBLR_TEXT.blogTitle, cast.HER.name);
  assert.equal(TUMBLR_TEXT.blogUrl, `http://${cast.HER.email.split('@')[0].replaceAll('_', '-')}.tumblr.com/`);
  assert.equal(TUMBLR_TEXT.date, 'August 23, 2007');
  assert.equal(cast.DATE, '8/23/2007');
});

test('no music in the Tumblr video, and nothing is posted anywhere (it is all drawn)', () => {
  const comp = source('TumblrBreakup.tsx') + source('ui/Tumblr.tsx') + source('ui/Browser.tsx');
  assert.doesNotMatch(comp, /songFile|music\/|<Audio/);
  assert.doesNotMatch(comp, /fetch\(|https?:\/\/(?!www\.tumblr\.com\/new\/text|nour-xoxo-89\.tumblr\.com)/);
});
