// Slide 3, the last: her Tumblr post, dated 8.11.2007: her sentence, a blank line, STAY TUNED., written and published
// by her, and the video ends on that post (no separate end card); it picks up where slide 2 ends, the song carrying on;
// every other word listed.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import { cast, player, source, state, stories, tumblr } from './load.mjs';

const { STATEMENT, STAY_TUNED, TEASER_POST, TUMBLR, TUMBLR_TEXT, tumblrAt } = tumblr;
const FPS = 30;

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

test('the post is exactly her sentence, a blank line and STAY TUNED., character for character', () => {
  assert.equal(STATEMENT, 'i guess some people are just passing through.');
  assert.equal(STAY_TUNED, 'STAY TUNED.');
  // one text post, written in its Post box: no title, three lines, the middle one blank
  assert.equal(TEASER_POST.title, '');
  assert.deepEqual(TEASER_POST.body, ['i guess some people are just passing through.', '', 'STAY TUNED.']);
  assert.equal(TEASER_POST.final, true);
  // lower case and a full stop; capitals and a full stop; no hashtag, emoji, quotes or third sentence
  for (const line of [STATEMENT, STAY_TUNED]) {
    assert.doesNotMatch(line, /["“”'#]|\p{Extended_Pictographic}/u);
    assert.equal(line.split('.').length, 2);
  }
  assert.ok(STATEMENT.startsWith('i guess ') && STATEMENT === STATEMENT.toLowerCase());
  assert.equal(STAY_TUNED, STAY_TUNED.toUpperCase());
  assert.equal(TEASER_POST.body.filter(Boolean).length, 2);
  // what she types is exactly the post, nothing else
  assert.equal(TUMBLR.title, null);
  assert.deepEqual(
    TUMBLR.body.map((b) => b.text),
    TEASER_POST.body,
  );
  // a body-only text post is a valid 2007 post (the API: "regular: requires at least one: title, body")
  assert.ok(TEASER_POST.title || TEASER_POST.body.length);
});

test('the post lives in one place, only the Tumblr video shows it', () => {
  for (const f of ['TumblrBreakup.tsx', 'MusicPlayerBreakup.tsx', 'ui/Tumblr.tsx', 'Intro.tsx', 'ui/present.tsx']) {
    assert.deepEqual(literalsIn(f).filter((s) => /passing through|stay tuned/i.test(s)), [], f);
  }
  assert.match(source('TumblrBreakup.tsx'), /<TumblrBlog title=\{TEASER_POST\.title\} body=\{TEASER_POST\.body\} \/>/);
  // slide 2 (the music player) comes before her post: no Tumblr window, blog or post behind the player
  assert.doesNotMatch(source('MusicPlayerBreakup.tsx'), /TumblrBlog|IEWindow|TEASER_POST|TUMBLR_TEXT/);
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
  // the film's conversation is dated the same night: its status line reads "… on 8.11.2007."
  assert.equal(stories.REEL.date, TUMBLR_TEXT.postDate);
  // the first release keeps its own date
  assert.equal(cast.DATE, '8/23/2007');
});

test('STAY TUNED. is inside her published post: no end card, no overlay; the video ends on the post', () => {
  const T = TUMBLR;
  // from the moment it is published to the last frame, the picture is her blog with the post on it
  for (let t = T.published; t < T.duration; t += 1 / FPS) assert.equal(tumblrAt(t).page, 'blog', t.toFixed(3));
  assert.equal(tumblrAt(T.duration - 1 / FPS).page, 'blog');
  // no separate STAY TUNED. card anywhere: no end-card component, camera or branch
  assert.equal('stayTuned' in T, false);
  for (const f of ['TumblrBreakup.tsx', 'ui/Tumblr.tsx', 'story/tumblr.ts']) assert.doesNotMatch(source(f), /TumblrStayTuned|END_CAMERA|stayTuned/, f);
  // the blog shows the post's lines one under the other, the blank line kept, in her post type (bold, her pink)
  const blog = source('ui/Tumblr.tsx');
  assert.match(blog, /\{body\.map\(\(line, i\) => \(\s*<div key=\{i\}>\{line \|\| '\\u00a0'\}<\/div>/);
  assert.match(blog, /const postWords: CSSProperties = \{ \.\.\.postTitle, lineHeight: '21px' \};/);
  assert.match(blog, /<div style=\{title \? \{[^}]*\} : postWords\}>/);
});

test('she writes it as one post: her sentence, a pause, Enter twice (the blank line), STAY TUNED.; both lines in the editor', () => {
  const T = TUMBLR;
  const [sentence, blank, stay] = T.body;
  assert.equal(tumblrAt(sentence.at).body.join('|'), STATEMENT);
  // the pause: nothing typed between her sentence and the first Enter, the caret blinking at its end
  assert.ok(T.enters[0] - sentence.at >= 0.6, 'she pauses');
  assert.deepEqual(tumblrAt(T.enters[0] - 0.01).body, [STATEMENT]);
  // Enter, Enter: a blank line, then STAY TUNED.
  assert.deepEqual(tumblrAt(T.enters[0]).body, [STATEMENT, '']);
  assert.deepEqual(tumblrAt(T.enters[1]).body, [STATEMENT, '', '']);
  assert.ok(stay.from > T.enters[1] && blank.text === '');
  assert.deepEqual(tumblrAt(stay.at).body, [STATEMENT, '', STAY_TUNED]);
  // both lines together in the editor until the page changes, the focus in the Post box
  for (const t of [stay.at, T.create - 0.01, T.published - 0.01]) assert.deepEqual(tumblrAt(t).body, [STATEMENT, '', STAY_TUNED]);
  assert.equal(tumblrAt(stay.at).focus, 'body');
  assert.equal(tumblrAt(T.create).createPressed, true);
  // a key sound for each key, and the two Enters
  const cues = source('TumblrBreakup.tsx');
  assert.match(cues, /\.\.\.TUMBLR\.body\.flatMap\(\(b, i\) => typingCues\(b, `body\$\{i\}`, false\)\)/);
  assert.match(cues, /\.\.\.TUMBLR\.enters\.map\(\(at, i\) => \(\{ at: at - 0\.03, src: sfx\('key1'\), volume: 0\.42, key: `body\$\{i\}-enter` \}\)\)/);
});

test('she types key by key, steadily, as before (her sentence keeps its exact rhythm)', () => {
  for (const b of TUMBLR.body.filter((b) => b.text)) {
    const keys = state.keyTimes(b);
    assert.equal(keys.length, [...b.text].length);
    keys.forEach((k, i) => assert.ok(k > (keys[i - 1] ?? b.from) - 1e-9 && k < b.at));
    const perKey = (b.at - b.from) / keys.length;
    assert.ok(perKey > 0.06 && perKey < 0.12, `${perKey.toFixed(3)} s a key`);
  }
  // her sentence is typed from 3.4 s to 7.295 s, key for key as in the approved version (where it was the title)
  assert.deepEqual([TUMBLR.body[0].from, TUMBLR.body[0].at], [3.4, 7.295]);
});

test('timeline: launch → dashboard → Text → form → her post → Create post → her blog → on the post to the end', () => {
  const T = TUMBLR;
  const seq = [T.launch, T.shown, T.dashboard, T.textClick, T.loaded, T.bodyClick, T.body[0].from, T.body[0].at, T.enters[0], T.enters[1], T.body[2].from, T.body[2].at, T.create, T.published, T.onPost, T.duration];
  seq.forEach((v, i) => i && assert.ok(v > seq[i - 1], `step ${i}`));
  assert.equal(T.titleClick, null);
  // everything up to her first key is timed as in the approved version (she clicks the Post box where she clicked the Title)
  assert.deepEqual([T.launch, T.shown, T.dashboard, T.textClick, T.loaded, T.bodyClick, T.body[0].from], [1.0, 1.2, 1.65, 2.3, 2.8, 3.2, 3.4]);
  // the publishing beat as before: 0.6 s to Create post, 0.6 s to her blog
  assert.equal(+(T.create - T.body[2].at).toFixed(3), 0.6);
  assert.equal(+(T.published - T.create).toFixed(3), 0.6);
  // the published post stays on screen 4.9 s, as long as the post and the old end card did together; the camera is on it after 3 s
  assert.ok(Math.abs(T.duration - T.published - 4.9) < 0.06);
  assert.equal(+(T.onPost - T.published).toFixed(3), 3);
  // longer than before only by what she now types (the pause, the blank line, STAY TUNED.)
  assert.equal(T.duration, 15.8);
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
  assert.equal(tumblrAt(T.body[0].from - 0.01).body.join(''), '');
  assert.equal(tumblrAt(T.body[0].from - 0.01).focus, 'body');
  assert.equal(tumblrAt(T.body[0].at).title, '');
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

test('slide 3 picks up where slide 2 ends: the player open on Now Playing, the song carrying on', () => {
  const { PLAYER, PLAYER_CAMERA, PLAYER_CURSOR, PLAY_FRAME, SONG_SOURCE } = player;
  const { TUMBLR_CAMERA, TUMBLR_CURSOR, TUMBLR_SONG } = tumblr;
  // the pointer and the camera start exactly where slide 2 leaves them
  assert.deepEqual({ x: TUMBLR_CURSOR[0].x, y: TUMBLR_CURSOR[0].y }, { x: PLAYER_CURSOR.at(-1).x, y: PLAYER_CURSOR.at(-1).y });
  assert.deepEqual({ x: TUMBLR_CAMERA[0].x, y: TUMBLR_CAMERA[0].y, z: TUMBLR_CAMERA[0].z }, { x: PLAYER_CAMERA.at(-1).x, y: PLAYER_CAMERA.at(-1).y, z: PLAYER_CAMERA.at(-1).z });
  // the song: slide 3's first frame plays the file frame slide 2 would play next (file 15.1 s)
  assert.equal(TUMBLR_SONG.from, SONG_SOURCE.inFrames + Math.round(PLAYER.duration * 30) - PLAY_FRAME);
  assert.equal(TUMBLR_SONG.from, 453);
  assert.equal(+(TUMBLR_SONG.from / 30).toFixed(3), 15.1);
  const comp = source('TumblrBreakup.tsx');
  assert.match(comp, /trimBefore=\{TUMBLR_SONG\.from\}/);
  // the player, still playing: its clock and its bars run on from slide 2's
  assert.match(comp, /const wmp = playerAt\(PLAYER\.duration \+ t, view\);/);
  assert.match(comp, /songMeter\(audioData, fps, TUMBLR_SONG\.from \+ frame\)/);
  assert.match(comp, /<MediaPlayer view=\{wmp\.view\}[^>]*playing=\{wmp\.playing\} elapsed=\{wmp\.elapsed\}/);
  assert.equal(player.playerAt(PLAYER.duration).view, 'nowPlaying');
  assert.equal(player.playerAt(PLAYER.duration).playing, true);
  // the timing of the Tumblr part is unchanged: Quick Launch at 1.0 s, the browser up at 1.2 s
  assert.deepEqual([TUMBLR.launch, TUMBLR.shown], [1.0, 1.2]);
});

test('nothing is posted anywhere: the Tumblr pages are drawn', () => {
  const comp = source('TumblrBreakup.tsx') + source('ui/Tumblr.tsx') + source('ui/Browser.tsx') + source('story/tumblr.ts');
  assert.doesNotMatch(comp, /fetch\(|XMLHttpRequest|https?:\/\/(?!www\.tumblr\.com\/(?:new\/text|dashboard)\b|nour-xoxo-89\.tumblr\.com\/)/);
});
