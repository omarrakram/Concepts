// Slide 3, the last: her Tumblr post (the collaborator's final statement, dated 8.11.2007), then STAY TUNED.; every other word listed, no music.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import { cast, source, state, tumblr } from './load.mjs';

const { STAY_TUNED, TEASER_POST, TUMBLR, TUMBLR_TEXT, tumblrAt } = tumblr;

/** every string literal and JSX text in a source file (TypeScript's own parser) */
const literalsIn = (f) => {
  const file = ts.createSourceFile(f, source(f), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out = [];
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isJsxText(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) out.push(n.text);
    ts.forEachChild(n, visit);
  };
  visit(file);
  return out;
};

test('the post is exactly the collaborator’s final statement, character for character', () => {
  assert.equal(TEASER_POST.title, 'i guess some people are just passing through.');
  assert.deepEqual(TEASER_POST.body, []);
  assert.equal(TEASER_POST.final, true);
  // lower-case "i", one sentence, a full stop: no capital, quotes, emoji, hashtag or second sentence
  assert.ok(TEASER_POST.title.startsWith('i guess '));
  assert.ok(TEASER_POST.title.endsWith('passing through.'));
  assert.equal(TEASER_POST.title.split('.').length, 2);
  assert.doesNotMatch(TEASER_POST.title, /["“”'#]|\p{Extended_Pictographic}/u);
  // what she types is exactly the statement, nothing else
  assert.equal(TUMBLR.title.text, TEASER_POST.title);
  assert.deepEqual(
    TUMBLR.body.map((b) => b.text),
    TEASER_POST.body,
  );
  // a title-only text post is a valid 2007 post (the API: "regular: requires at least one: title, body")
  assert.ok(TEASER_POST.title || TEASER_POST.body.length);
});

test('the post lives in one place, only the Tumblr video shows it, and the first version’s post is gone', () => {
  for (const f of ['TumblrBreakup.tsx', 'MusicPlayerBreakup.tsx', 'ui/Tumblr.tsx', 'Intro.tsx']) {
    assert.deepEqual(literalsIn(f).filter((s) => /passing through|stay tuned/i.test(s)), [], f);
  }
  assert.match(source('TumblrBreakup.tsx'), /<TumblrBlog title=\{TEASER_POST\.title\} body=\{TEASER_POST\.body\} \/>/);
  // slide 2 (the music player) now comes before her post: no Tumblr window, blog or post behind the player
  assert.doesNotMatch(source('MusicPlayerBreakup.tsx'), /TumblrBlog|IEWindow|TEASER_POST|TUMBLR_TEXT/);
  // "stay tuned" (the first version's post) survives only as the ending's STAY TUNED.
  assert.doesNotMatch(TEASER_POST.title, /stay tuned/i);
});

test('the post is dated exactly 8.11.2007, a Thursday, and no other date is on the Tumblr pages', () => {
  assert.equal(TUMBLR_TEXT.postDate, '8.11.2007');
  assert.equal(new Date(Date.UTC(2007, 10, 8)).getUTCDay(), 4); // 8 November 2007 was a Thursday: the theme prints "THU"
  assert.equal(TUMBLR_TEXT.day, 'Thu');
  // the first version's "AUG" / "23RD" block is gone, and none of the forms the brief rules out is anywhere
  assert.equal('dateBlock' in TUMBLR_TEXT, false);
  const words = JSON.stringify(TUMBLR_TEXT);
  for (const bad of ['8/11/07', '08/11/2007', 'November 8', 'Nov 8', '11/11', '11.11.2007', '23rd', 'Aug', '2026']) assert.ok(!words.includes(bad), bad);
  // the day block prints the date on one line, from TUMBLR_TEXT
  const blog = source('ui/Tumblr.tsx');
  assert.match(blog, />\{T\.postDate\}<\/div>/);
  assert.doesNotMatch(blog, /dateBlock\[/);
  // the film's own date (the MSN conversation) is not touched
  assert.equal(cast.DATE, '8/23/2007');
});

test('the ending, in order: she types the statement, publishes it, it holds, then STAY TUNED. on its own', () => {
  const T = TUMBLR;
  assert.equal(STAY_TUNED, 'STAY TUNED.');
  // typed and readable, published, on her blog until STAY TUNED.
  assert.equal(tumblrAt(T.title.at).title, TEASER_POST.title);
  assert.equal(tumblrAt(T.published).page, 'blog');
  assert.equal(tumblrAt(T.stayTuned - 0.01).page, 'blog');
  assert.ok(T.published < T.stayTuned && T.stayTuned < T.duration);
  // STAY TUNED. replaces the picture from T.stayTuned to the end, alone: no blog or post under it
  const code = source('TumblrBreakup.tsx');
  const card = code.slice(code.indexOf('if (t >= TUMBLR.stayTuned)'), code.indexOf('const s = tumblrAt'));
  assert.match(card, /<TumblrStayTuned text=\{STAY_TUNED\}/);
  assert.doesNotMatch(card, /TumblrBlog|TEASER_POST|IEWindow/);
  // in her post title's type and pink, on her blog's white (the first version's "stay tuned" look)
  assert.match(source('ui/Tumblr.tsx'), /export function TumblrStayTuned[\s\S]*?background: BLOG_COLORS\.background[\s\S]*?\.\.\.postTitle/);
});

test('she types it key by key, steadily, one key sound per letter', () => {
  const b = TUMBLR.title;
  const keys = state.keyTimes(b);
  assert.equal(keys.length, [...b.text].length);
  keys.forEach((k, i) => assert.ok(k > (keys[i - 1] ?? b.from) - 1e-9 && k < b.at));
  const perKey = (b.at - b.from) / keys.length;
  assert.ok(perKey > 0.06 && perKey < 0.12, `${perKey.toFixed(3)} s a key`);
});

test('timeline: launch → dashboard → Text → form → title → Create post → her blog → STAY TUNED., within ~14 s', () => {
  const T = TUMBLR;
  const seq = [T.launch, T.shown, T.dashboard, T.textClick, T.loaded, T.titleClick, T.title.from, T.title.at, T.create, T.published, T.stayTuned, T.duration];
  seq.forEach((v, i) => i && assert.ok(v > seq[i - 1], `step ${i}`));
  assert.equal(T.bodyClick, null);
  // everything up to her first key is timed as in the first version
  assert.deepEqual([T.launch, T.shown, T.dashboard, T.textClick, T.loaded, T.titleClick, T.title.from], [1.0, 1.2, 1.65, 2.3, 2.8, 3.2, 3.4]);
  // the published statement stays on screen 3.4 s (as the first version's post did), then STAY TUNED. for 1.5 s
  assert.ok(Math.abs(T.stayTuned - T.published - 3.4) < 0.06);
  assert.equal(+(T.duration - T.stayTuned).toFixed(3), 1.5);
  assert.ok(T.duration <= 14);
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

test('no new names: the blog is her Messenger name and address', () => {
  assert.equal(TUMBLR_TEXT.blogTitle, cast.HER.name);
  const host = cast.HER.email.split('@')[0].replaceAll('_', '-');
  assert.equal(TUMBLR_TEXT.blogUrl, `http://${host}.tumblr.com/`);
  assert.equal(TUMBLR_TEXT.links[0], `${host}.tumblr.com`);
  assert.equal(TUMBLR_TEXT.sideName, host);
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
