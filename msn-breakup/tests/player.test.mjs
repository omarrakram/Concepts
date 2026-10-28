// Change 2 (its own video): Play takes effect on PLAY_FRAME and the song begins on that frame.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cast, FPS, player, source } from './load.mjs';

const { PLAY_FRAME, PLAYER, playerAt, SONG_SOURCE, TRACK, PLAYER_CURSOR, PSPOT } = player;
const at = (f) => playerAt(f / FPS);

test('it is the right song: “When You’re Gone” by Avril Lavigne (not Adam Levine), the supplied file', () => {
  assert.equal(TRACK.title, cast.SONG.title);
  assert.equal(TRACK.artist, 'Avril Lavigne');
  assert.equal(TRACK.album, 'The Best Damn Thing');
  assert.equal(SONG_SOURCE.duration, 239.258);
});

test('nothing plays and Pause never shows before PLAY_FRAME; both on PLAY_FRAME', () => {
  for (let f = 0; f < PLAY_FRAME; f++) {
    assert.equal(at(f).playing, false, `frame ${f}`);
    assert.equal(at(f).elapsed, 0);
  }
  assert.equal(at(PLAY_FRAME).playing, true);
  assert.equal(at(PLAY_FRAME).elapsed, 0);
  assert.ok(Math.abs(at(PLAY_FRAME + 30).elapsed - 1) < 1e-9);
});

test('the mouse goes down on Play 3 frames before (the click) and the action takes effect on release', () => {
  const press = PLAYER_CURSOR.find((c) => c.click && c.x === PSPOT.play.x && c.y === PSPOT.play.y);
  assert.equal(Math.round(press.t * FPS), PLAY_FRAME - 3);
  for (const f of [PLAY_FRAME - 3, PLAY_FRAME - 2, PLAY_FRAME - 1]) assert.equal(at(f).playPressed, true, `frame ${f}`);
  assert.equal(at(PLAY_FRAME).playPressed, false);
  assert.equal(at(PLAY_FRAME - 4).playPressed, false);
});

test('the song is cut in on its first note, which sounds inside PLAY_FRAME', () => {
  const start = SONG_SOURCE.inFrames / FPS;
  assert.ok(start <= SONG_SOURCE.firstNote && SONG_SOURCE.firstNote < start + 1 / FPS);
  assert.equal(TRACK.length, '3:54');
});

test('the composition starts the song with a Sequence on PLAY_FRAME, trimmed to the first note', () => {
  const comp = source('MusicPlayerBreakup.tsx');
  assert.match(comp, /<Sequence from=\{PLAY_FRAME\} layout="none" name="SONG \(supplied file\)">/);
  assert.match(comp, /trimBefore=\{SONG_SOURCE\.inFrames\}/);
  // the visualisation never reads audio from before the playback point
  assert.match(comp, /f >= PLAY_FRAME \? spectrumBars\(audioData, fps, f - PLAY_FRAME \+ SONG_SOURCE\.inFrames\)/);
});

test('opens the player, selects the song, presses Play, in that order, within ~7–13 s', () => {
  const P = PLAYER;
  const seq = [P.start, P.launch, P.shown, P.select, P.press, P.play, P.nowPlaying, P.duration];
  seq.forEach((v, i) => i && assert.ok(v > seq[i - 1], `step ${i}`));
  assert.equal(at(Math.round((P.launch - 0.1) * FPS)).menuHover, 'player');
  assert.equal(playerAt(P.select + 0.01).selected, true);
  assert.ok(P.duration >= 7 && P.duration <= 13);
});

test('one player, one generation: only Windows Media Player 11 chrome', () => {
  const ui = source('ui/MediaPlayer.tsx') + source('story/player.ts');
  assert.doesNotMatch(ui, /Spotify|iTunes|Apple Music|YouTube|Winamp|Media Player Classic/i);
  assert.deepEqual(player.PLAYER_TEXT.tabs, ['Now Playing', 'Library', 'Rip', 'Burn', 'Sync']);
});
