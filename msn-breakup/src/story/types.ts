/** A story is a list of timed beats (seconds); everything on screen is derived from them. */
export type Beat =
  /** His "has just signed in" toast + sign-in chime. */
  | { type: 'signin'; at: number }
  /** The conversation window opens (he started typing to her). */
  | { type: 'open'; at: number }
  /** His message arrives at `at`; "is typing a message." shows for `typing` seconds before. */
  | { type: 'him'; at: number; text: string; typing: number }
  /** She types `text` into the input box from `from`, and sends it (Enter) at `at`. */
  | { type: 'her'; from: number; at: number; text: string }
  /** She sends a nudge: the window shakes. */
  | { type: 'nudge'; at: number }
  /** The "is listening to" popup: the music cue starts on this exact frame. */
  | { type: 'listening'; at: number };

/** Camera key: the point of the virtual screen at the centre, and the zoom. */
export interface CamKey {
  t: number;
  x: number;
  y: number;
  z: number;
}
/** Mouse pointer key (virtual screen px); `click` plays a click and presses whatever is under it. */
export interface CursorKey {
  t: number;
  x: number;
  y: number;
  click?: boolean;
}

export interface Story {
  id: string;
  duration: number;
  beats: Beat[];
  camera: CamKey[];
  cursor: CursorKey[];
}
