import { VH, VW } from '../constants';
import type { Beat, CamKey, CursorKey, Story } from './types';

export interface Entry {
  key: string;
  kind: 'msg' | 'nudge';
  who: 'him' | 'her';
  text: string;
  at: number;
}
export interface ToastState {
  kind: 'signin' | 'listening';
  age: number;
  life: number;
}
export interface StoryState {
  t: number;
  /** Seconds since the conversation window opened (null: not open yet). */
  convoAge: number | null;
  entries: Entry[];
  himTyping: boolean;
  /** Last message from him has arrived (the status line then shows "Last message received…"). */
  received: boolean;
  input: string;
  inputFocused: boolean;
  caretOn: boolean;
  shake: { x: number; y: number };
  toasts: ToastState[];
  listening: boolean;
  /** Story time the music cue starts (null if the story has none). */
  musicAt: number | null;
  camera: { x: number; y: number; z: number };
  cursor: { x: number; y: number; pressed: boolean };
}

const TOAST_LIFE = { signin: 3.4, listening: 3.4 };
export const NUDGE_LEN = 0.85;

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

/** When each character of a typed line lands (uneven, like a real person typing). */
export function keyTimes(b: Extract<Beat, { type: 'her' }>): number[] {
  const n = [...b.text].length;
  const end = b.at - 0.07;
  const w = Array.from({ length: n }, (_, i) => 0.55 + 0.9 * hash(i + b.from * 31 + n));
  const total = w.reduce((s, v) => s + v, 0);
  let acc = 0;
  return w.map((v) => {
    acc += v;
    return b.from + ((end - b.from) * acc) / total;
  });
}

function interp<K extends { t: number }>(keys: K[], t: number, pick: (k: K) => number[], ease = easeInOut): number[] {
  if (t <= keys[0]!.t) return pick(keys[0]!);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]!, b = keys[i + 1]!;
    if (t <= b.t) {
      const u = ease((t - a.t) / Math.max(1e-6, b.t - a.t));
      const pa = pick(a), pb = pick(b);
      return pa.map((v, k) => v + (pb[k]! - v) * u);
    }
  }
  return pick(keys.at(-1)!);
}

/** The camera, kept inside the screen. */
export function cameraAt(keys: CamKey[], t: number, view = { w: VW, h: VH }) {
  const [x, y, z] = interp(keys, t, (k) => [k.x, k.y, k.z]) as [number, number, number];
  const hw = view.w / z / 2, hh = view.h / z / 2;
  return { x: Math.min(VW - hw, Math.max(hw, x)), y: Math.min(VH - hh, Math.max(hh, y)), z };
}

export function cursorAt(keys: CursorKey[], t: number) {
  const [x, y] = interp(keys, t, (k) => [k.x, k.y], (u) => 1 - Math.pow(1 - u, 3)) as [number, number];
  const pressed = keys.some((k) => k.click && t >= k.t && t < k.t + 0.1);
  return { x, y, pressed };
}

export function stateAt(story: Story, t: number, view?: { w: number; h: number }): StoryState {
  const open = story.beats.find((b) => b.type === 'open')?.at ?? 0;
  const entries: Entry[] = [];
  let himTyping = false;
  let received = false;
  let input = '';
  let typing = false;
  const toasts: ToastState[] = [];
  let shake = { x: 0, y: 0 };
  let listening = false;
  let musicAt: number | null = null;
  story.beats.forEach((b, i) => {
    if (b.type === 'him') {
      if (t >= b.at) {
        entries.push({ key: `m${i}`, kind: 'msg', who: 'him', text: b.text, at: b.at });
        received = true;
      } else if (t >= b.at - b.typing) himTyping = true;
    } else if (b.type === 'her') {
      if (t >= b.at) entries.push({ key: `m${i}`, kind: 'msg', who: 'her', text: b.text, at: b.at });
      else if (t >= b.from) {
        const n = keyTimes(b).filter((k) => k <= t).length;
        input = [...b.text].slice(0, n).join('');
        typing = true;
      }
    } else if (b.type === 'nudge') {
      if (t >= b.at) entries.push({ key: `n${i}`, kind: 'nudge', who: 'her', text: 'You have just sent a nudge.', at: b.at });
      const u = t - b.at;
      if (u >= 0 && u < NUDGE_LEN) {
        // Messenger's shake is jerky: the window jumps to a new offset every frame
        const step = Math.floor(u * 30);
        const amp = 7 * Math.pow(1 - u / NUDGE_LEN, 0.6);
        shake = { x: (hash(step * 3.1 + 1) * 2 - 1) * amp, y: (hash(step * 7.7 + 2) * 2 - 1) * amp * 0.75 };
      }
    } else if (b.type === 'signin' || b.type === 'listening') {
      const age = t - b.at;
      const life = TOAST_LIFE[b.type];
      if (age >= 0 && age < life) toasts.push({ kind: b.type, age, life });
      if (b.type === 'listening') {
        musicAt = b.at;
        if (t >= b.at) listening = true;
      }
    }
  });
  const clicks = story.cursor.filter((k) => k.click).map((k) => k.t);
  const inputFocused = clicks.some((c) => c <= t) || typing;
  // the caret is solid while typing, and blinks (530 ms) otherwise
  const caretOn = inputFocused && (typing || Math.floor(t / 0.53) % 2 === 0);
  return {
    t,
    convoAge: t >= open ? t - open : null,
    entries,
    himTyping,
    received,
    input,
    inputFocused,
    caretOn,
    shake,
    toasts,
    listening,
    musicAt,
    camera: cameraAt(story.camera, t, view),
    cursor: cursorAt(story.cursor, t),
  };
}
