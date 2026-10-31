import type { Beat, CamKey, CursorKey, Story } from './types';

/**
 * The breakup, word for word. His lines arrive deliberately (typing notice,
 * then the chime); a silence; then she types, faster and faster, in bursts,
 * until "…". She unravels slower: "i miss u", a nudge, the last four lines,
 * and then two more nudges into the silence. He never answers.
 */
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

/** Where things are on the virtual screen (see Conversation layout). */
export const SPOT = {
  input: { x: 196, y: 772 },
  restNearInput: { x: 288, y: 806 },
  nudge: { x: 306, y: 720 },
};

const her = (i: number, from: number, at: number): Beat => ({ type: 'her', from, at, text: HERS[i]! });

/**
 * The 2007-10-21 film exactly as first released (commit 38f0d3a): the "is
 * listening to" popup + song cue at 21.3 s and one nudge. Frozen: the
 * carousel stills are moments of this cut, and `HeroReelOriginal` re-renders
 * it for A/B checks. The current film is `REEL` below.
 */
export const REEL_ORIGINAL: Story = {
  id: 'reel-original',
  duration: 33,
  beats: [
    { type: 'signin', at: 0.3 },
    { type: 'open', at: 1.0 },
    // HIM: cold, deliberate
    { type: 'him', at: 1.9, typing: 0.8, text: HIS[0]! },
    { type: 'him', at: 3.85, typing: 1.0, text: HIS[1]! },
    { type: 'him', at: 5.35, typing: 0.9, text: HIS[2]! },
    { type: 'him', at: 6.75, typing: 0.85, text: HIS[3]! },
    { type: 'him', at: 8.05, typing: 0.8, text: HIS[4]! },
    // (silence)
    // HER: the spiral
    her(0, 9.9, 10.25),
    her(1, 10.75, 11.18),
    her(2, 11.6, 12.0),
    her(3, 12.35, 13.08),
    her(4, 13.4, 13.62),
    her(5, 13.85, 15.02),
    her(6, 15.3, 15.62),
    her(7, 15.82, 16.04),
    her(8, 16.3, 16.78),
    her(9, 17.0, 17.82),
    her(10, 18.3, 18.48),
    her(11, 18.75, 19.0),
    her(12, 19.2, 19.48),
    her(13, 20.4, 20.62),
    // the popup + the song
    { type: 'listening', at: 21.3 },
    her(14, 22.4, 22.88),
    her(15, 23.55, 24.08),
    her(16, 24.5, 24.95),
    { type: 'nudge', at: 25.35 },
    her(17, 26.55, 27.02),
    her(18, 27.75, 28.18),
    her(19, 29.08, 29.2),
    her(20, 30.2, 30.68),
  ],
  camera: [
    { t: 0, x: 270, y: 480, z: 1 },
    { t: 1.1, x: 270, y: 480, z: 1 },
    { t: 2.3, x: 272, y: 594, z: 1.06 },
    { t: 8.2, x: 272, y: 594, z: 1.06 },
    { t: 9.9, x: 232, y: 566, z: 1.22 },
    { t: 20.7, x: 232, y: 566, z: 1.26 },
    { t: 21.45, x: 270, y: 480, z: 1 },
    { t: 24.4, x: 270, y: 480, z: 1 },
    { t: 25.2, x: 262, y: 590, z: 1.12 },
    { t: 26.4, x: 262, y: 590, z: 1.12 },
    { t: 33, x: 236, y: 600, z: 1.3 },
  ] satisfies CamKey[],
  cursor: [
    { t: 0, x: 448, y: 214 },
    { t: 8.9, x: 452, y: 208 },
    { t: 9.65, x: SPOT.input.x, y: SPOT.input.y },
    { t: 9.72, x: SPOT.input.x, y: SPOT.input.y, click: true },
    { t: 10.2, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
    { t: 24.98, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
    { t: 25.3, x: SPOT.nudge.x, y: SPOT.nudge.y },
    { t: 25.35, x: SPOT.nudge.x, y: SPOT.nudge.y, click: true },
    { t: 26.2, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
  ] satisfies CursorKey[],
};

/**
 * The film (2026-10-28 cut). Three timing changes from REEL_ORIGINAL, nothing else:
 *  1. His five lines are 8 % quicker: every interval from the window opening
 *     (1.0 s) to his last line, typing notices included, is scaled by 0.92.
 *  2. The "is listening to" popup and its song cue are gone (the song has its
 *     own carousel video now), so his personal message never changes.
 *  3. After "no actually" she nudges him twice more (three nudges in all).
 * Everything after "bye x" (the silence, her spiral, the original nudge) is
 * the original timing moved 0.56 s earlier (= the time his lines saved), so
 * her side of the conversation keeps its exact rhythm.
 */
export const SAVED = 0.56; // 8.05 s (his last line in the first cut) - 7.49 s (now)
/** Her line `i` exactly as in the first cut, moved SAVED seconds earlier (same typing rhythm, same key sounds). */
const moved = (i: number): Beat => {
  const index = REEL_ORIGINAL.beats.findIndex((b) => b.type === 'her' && b.text === HERS[i]);
  const b = REEL_ORIGINAL.beats[index] as Extract<Beat, { type: 'her' }>;
  return { type: 'her', text: b.text, from: +(b.from - SAVED).toFixed(2), at: +(b.at - SAVED).toFixed(2), orig: { from: b.from, index } };
};
export const NUDGE_SPOTS = { first: 24.79, rage1: 31.3, rage2: 32.65 };

export const REEL: Story = {
  id: 'reel',
  duration: 35,
  /** the night of the breakup: the same night as her Tumblr post, 8.11.2007 (written as the brief writes it) */
  date: '8.11.2007',
  beats: [
    { type: 'signin', at: 0.3 },
    { type: 'open', at: 1.0 },
    // HIM: cold, deliberate (and 8 % quicker than the first cut)
    { type: 'him', at: 1.83, typing: 0.74, text: HIS[0]! },
    { type: 'him', at: 3.62, typing: 0.92, text: HIS[1]! },
    { type: 'him', at: 5.0, typing: 0.83, text: HIS[2]! },
    { type: 'him', at: 6.29, typing: 0.78, text: HIS[3]! },
    { type: 'him', at: 7.49, typing: 0.74, text: HIS[4]! },
    // (silence: the same 1.85 s as the first cut)
    // HER: the spiral
    moved(0),
    moved(1),
    moved(2),
    moved(3),
    moved(4),
    moved(5),
    moved(6),
    moved(7),
    moved(8),
    moved(9),
    moved(10),
    moved(11),
    moved(12),
    moved(13),
    moved(14),
    moved(15),
    moved(16),
    // the original nudge, at its place between "HELLOOOOO" and "ugh whatever"
    { type: 'nudge', at: NUDGE_SPOTS.first },
    moved(17),
    moved(18),
    moved(19),
    moved(20),
    // "no actually" lands at 30.12; she reads it back, then: nudge, a beat, NUDGE.
    { type: 'nudge', at: NUDGE_SPOTS.rage1 },
    { type: 'nudge', at: NUDGE_SPOTS.rage2 },
    // ...and he still doesn't answer.
  ],
  camera: [
    { t: 0, x: 270, y: 480, z: 1 },
    { t: 1.09, x: 270, y: 480, z: 1 },
    { t: 2.2, x: 272, y: 594, z: 1.06 },
    { t: 7.64, x: 272, y: 594, z: 1.06 },
    { t: 9.34, x: 232, y: 566, z: 1.22 },
    { t: 20.14, x: 232, y: 566, z: 1.26 },
    { t: 20.89, x: 270, y: 480, z: 1 },
    { t: 23.84, x: 270, y: 480, z: 1 },
    { t: 24.64, x: 262, y: 590, z: 1.12 },
    { t: 25.84, x: 262, y: 590, z: 1.12 },
    { t: 31.2, x: 236, y: 600, z: 1.3 },
    // the second rage nudge: the camera leans in a notch (the window does the shaking),
    // drifting left with it so the status line's first letter stays in frame
    { t: 32.5, x: 226, y: 604, z: 1.36 },
    { t: 35, x: 226, y: 604, z: 1.36 },
  ] satisfies CamKey[],
  cursor: [
    { t: 0, x: 448, y: 214 },
    { t: 8.34, x: 452, y: 208 },
    { t: 9.09, x: SPOT.input.x, y: SPOT.input.y },
    { t: 9.16, x: SPOT.input.x, y: SPOT.input.y, click: true },
    { t: 9.64, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
    { t: 24.42, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
    { t: 24.74, x: SPOT.nudge.x, y: SPOT.nudge.y },
    { t: NUDGE_SPOTS.first, x: SPOT.nudge.x, y: SPOT.nudge.y, click: true },
    { t: 25.64, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
    // rage nudge #1: straight back to the button
    { t: 30.98, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
    { t: 31.25, x: SPOT.nudge.x, y: SPOT.nudge.y },
    { t: NUDGE_SPOTS.rage1, x: SPOT.nudge.x, y: SPOT.nudge.y, click: true },
    // she never lets go of it: a twitch, and click again
    { t: 32.05, x: SPOT.nudge.x + 3, y: SPOT.nudge.y + 2 },
    { t: 32.6, x: SPOT.nudge.x, y: SPOT.nudge.y },
    { t: NUDGE_SPOTS.rage2, x: SPOT.nudge.x, y: SPOT.nudge.y, click: true },
  ] satisfies CursorKey[],
};

/**
 * The same film recomposed for a 4:5 (1080 × 1350) Instagram carousel: same
 * beats, same pointer, its own camera over the 540 × 675 part of the screen
 * that shows. It opens on her contact list (her personal message), drops to
 * the sign-in toast as the window opens, then keeps the whole conversation
 * window in frame and pushes in exactly where the 9:16 cut does.
 */
export const CAROUSEL_VIEW = { w: 540, h: 675 };
export const REEL_CAROUSEL: Story = {
  ...REEL,
  id: 'reel-carousel',
  camera: [
    { t: 0, x: 270, y: 338, z: 1 },
    { t: 0.35, x: 270, y: 338, z: 1 },
    { t: 1.05, x: 270, y: 622, z: 1 },
    { t: 2.2, x: 272, y: 594, z: 1.06 },
    { t: 7.64, x: 272, y: 594, z: 1.06 },
    { t: 9.34, x: 232, y: 566, z: 1.22 },
    { t: 20.14, x: 232, y: 566, z: 1.26 },
    { t: 20.89, x: 270, y: 594, z: 1 },
    { t: 23.84, x: 270, y: 594, z: 1 },
    { t: 24.64, x: 262, y: 590, z: 1.12 },
    { t: 25.84, x: 262, y: 590, z: 1.12 },
    // (a little lower than the 9:16 cut, so "Last message received…" stays in the shorter frame)
    { t: 31.2, x: 236, y: 606, z: 1.3 },
    { t: 32.5, x: 226, y: 616, z: 1.36 },
    { t: 35, x: 226, y: 616, z: 1.36 },
  ],
};

/** 7 seconds: the sign-in, the dump, her disbelief, a nudge. */
export const TEASER: Story = {
  id: 'teaser',
  duration: 7,
  beats: [
    { type: 'signin', at: 0.15 },
    { type: 'open', at: 0.75 },
    { type: 'him', at: 1.45, typing: 0.65, text: HIS[0]! },
    { type: 'him', at: 2.45, typing: 0.6, text: HIS[4]! },
    { type: 'her', from: 3.05, at: 4.15, text: HERS[5]! },
    { type: 'her', from: 4.45, at: 4.8, text: HERS[16]! },
    { type: 'nudge', at: 5.2 },
  ],
  camera: [
    { t: 0, x: 270, y: 480, z: 1 },
    { t: 0.9, x: 270, y: 480, z: 1 },
    { t: 1.6, x: 272, y: 594, z: 1.06 },
    { t: 5.1, x: 250, y: 590, z: 1.16 },
    { t: 7, x: 244, y: 594, z: 1.2 },
  ],
  cursor: [
    { t: 0, x: 448, y: 214 },
    { t: 2.5, x: 448, y: 214 },
    { t: 2.95, x: SPOT.input.x, y: SPOT.input.y },
    { t: 3.0, x: SPOT.input.x, y: SPOT.input.y, click: true },
    { t: 3.4, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
    { t: 4.9, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
    { t: 5.15, x: SPOT.nudge.x, y: SPOT.nudge.y },
    { t: 5.2, x: SPOT.nudge.x, y: SPOT.nudge.y, click: true },
    { t: 6.0, x: SPOT.restNearInput.x, y: SPOT.restNearInput.y },
  ],
};

export const SCRIPT = { HIS, HERS };
