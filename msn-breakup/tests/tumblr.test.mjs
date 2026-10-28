// Slide 2, the Tumblr video: the teaser she posts (voice note A), every other word listed, no music.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import { cast, source, state, tumblr } from './load.mjs';

const { TEASER_POST, TUMBLR, TUMBLR_TEXT, tumblrAt } = tumblr;

test('the post is the teaser, in the collaborator’s words: “stay tuned” (final wording still to come)', () => {
  assert.equal(TEASER_POST.title, 'stay tuned');
  assert.deepEqual(TEASER_POST.body, []);
  assert.equal(TEASER_POST.final, false);
  // what she types is exactly the teaser, nothing else
  assert.equal(TUMBLR.title.text, TEASER_POST.title);
  assert.deepEqual(
    TUMBLR.body.map((b) => b.text),
    TEASER_POST.body,
  );
  // a title-only text post is a valid 2007 post (the API: "regular: requires at least one: title, body")
  assert.ok(TEASER_POST.title || TEASER_POST.body.length);
});

test('the teaser lives in one place: the slide 2 and slide 3 code take it from TEASER_POST', () => {
  for (const f of ['TumblrBreakup.tsx', 'MusicPlayerBreakup.tsx', 'ui/Tumblr.tsx']) assert.doesNotMatch(source(f), /stay tuned/);
  assert.match(source('TumblrBreakup.tsx'), /<TumblrBlog title=\{TEASER_POST\.title\} body=\{TEASER_POST\.body\} \/>/);
  assert.match(source('MusicPlayerBreakup.tsx'), /<TumblrBlog title=\{TEASER_POST\.title\} body=\{TEASER_POST\.body\} \/>/);
});

test('she types it key by key, steadily, one key sound per letter', () => {
  const b = TUMBLR.title;
  const keys = state.keyTimes(b);
  assert.equal(keys.length, [...b.text].length);
  keys.forEach((k, i) => assert.ok(k > (keys[i - 1] ?? b.from) - 1e-9 && k < b.at));
  const perKey = (b.at - b.from) / keys.length;
  assert.ok(perKey > 0.06 && perKey < 0.12, `${perKey.toFixed(3)} s a key`);
});

test('timeline: launch → dashboard → Text → form → title → Create post → her blog, within ~9 s', () => {
  const T = TUMBLR;
  const seq = [T.launch, T.shown, T.dashboard, T.textClick, T.loaded, T.titleClick, T.title.from, T.title.at, T.create, T.published, T.duration];
  seq.forEach((v, i) => i && assert.ok(v > seq[i - 1], `step ${i}`));
  assert.equal(T.bodyClick, null);
  assert.ok(T.duration >= 7 && T.duration <= 10);
  // the post stays on screen for the last 3.4 s
  assert.ok(T.duration - T.published >= 3.3);
});

test('what is on screen follows the timeline', () => {
  const T = TUMBLR;
  assert.equal(tumblrAt(0).ieShown, false);
  assert.equal(tumblrAt(T.shown + 0.01).page, 'blank');
  assert.equal(tumblrAt(T.shown + 0.01).status, TUMBLR_TEXT.opening(TUMBLR_TEXT.dashboardUrl));
  assert.equal(tumblrAt(T.dashboard + 0.01).page, 'dashboard');
  assert.equal(tumblrAt(T.textClick).textPressed, true);
  assert.equal(tumblrAt(T.textClick + 0.2).status, TUMBLR_TEXT.opening(TUMBLR_TEXT.formUrl));
  assert.equal(tumblrAt(T.loaded + 0.01).page, 'form');
  assert.equal(tumblrAt(T.loaded + 0.01).url, TUMBLR_TEXT.formUrl);
  assert.equal(tumblrAt(T.title.from - 0.01).title, '');
  assert.equal(tumblrAt(T.title.at).title, TEASER_POST.title);
  assert.equal(tumblrAt(T.title.at).focus, 'title');
  assert.equal(tumblrAt(T.create).createPressed, true);
  assert.equal(tumblrAt(T.create + 0.2).loading, true);
  assert.equal(tumblrAt(T.published).page, 'blog');
  assert.equal(tumblrAt(T.published).url, TUMBLR_TEXT.blogUrl);
  assert.equal(tumblrAt(T.published).pageTitle, TUMBLR_TEXT.blogTitle);
});

test('no new names: the blog is her Messenger name and address; the day block is the film’s date', () => {
  assert.equal(TUMBLR_TEXT.blogTitle, cast.HER.name);
  const host = cast.HER.email.split('@')[0].replaceAll('_', '-');
  assert.equal(TUMBLR_TEXT.blogUrl, `http://${host}.tumblr.com/`);
  assert.equal(TUMBLR_TEXT.links[0], `${host}.tumblr.com`);
  assert.equal(TUMBLR_TEXT.sideName, host);
  assert.equal(cast.DATE, '8/23/2007');
  // 23 August 2007 was a Thursday; the theme prints "THU" and "AUG" / "23RD"
  assert.equal(new Date(Date.UTC(2007, 7, 23)).getUTCDay(), 4);
  assert.equal(TUMBLR_TEXT.day, 'Thu');
  assert.deepEqual(TUMBLR_TEXT.dateBlock, ['Aug', '23rd']);
});

test('every word on the Tumblr pages comes from TUMBLR_TEXT or TEASER_POST (no stray copy in the drawing)', () => {
  // the literal text in the JSX of ui/Tumblr.tsx (TypeScript's own parser): only punctuation may be written inline
  const file = ts.createSourceFile('Tumblr.tsx', source('ui/Tumblr.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const literals = [];
  const visit = (n) => {
    if (ts.isJsxText(n) && n.text.trim()) literals.push(n.text.trim());
    if (ts.isJsxExpression(n) && n.expression && ts.isStringLiteral(n.expression)) literals.push(n.expression.text);
    ts.forEachChild(n, visit);
  };
  visit(file);
  assert.ok(literals.length > 0, 'the parser saw the JSX');
  assert.deepEqual(literals.filter((s) => /[\p{L}\p{N}]/u.test(s)), []);
});

test('no music in the Tumblr video, and nothing is posted anywhere (it is all drawn)', () => {
  const comp = source('TumblrBreakup.tsx') + source('ui/Tumblr.tsx') + source('ui/Browser.tsx') + source('story/tumblr.ts');
  assert.doesNotMatch(comp, /songFile|music\/|<Audio/);
  assert.doesNotMatch(comp, /fetch\(|XMLHttpRequest|https?:\/\/(?!www\.tumblr\.com\/(?:new\/text|dashboard)\b|nour-xoxo-89\.tumblr\.com\/)/);
});
