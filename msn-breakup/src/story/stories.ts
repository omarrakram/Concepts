import type { Beat, CamKey, CursorKey, Story } from './types';

/**
 * The breakup, word for word. His lines arrive deliberately (typing notice,
 * then the chime); a silence; then she types, faster and faster, in bursts,
 * until "…". The popup lands, the song starts, and she unravels slower:
 * "i miss u", a nudge, and the last three lines get room to land.
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

export const REEL: Story = {
  id: 'reel',
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
