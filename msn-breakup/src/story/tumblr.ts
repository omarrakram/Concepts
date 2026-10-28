import { ieLayout } from '../ui/ie-geometry';
import { DATE, HER } from './cast';
import { cameraAt, cursorAt, keyTimes } from './state';
import { REEL_ORIGINAL, SCRIPT } from './stories';
import type { Beat, CamKey, CursorKey } from './types';

/**
 * Carousel slide 2: a minute after the film she opens Internet Explorer,
 * writes a Tumblr text post and publishes it, then her blog shows it.
 * Everything she types is her own lines from the film, verbatim; every
 * other word on screen is browser / Tumblr furniture, all of it listed in
 * TUMBLR_TEXT (and in docs/carousel.md). The 2007 Tumblr pages are a
 * simplified, plausible period design, not a reproduction.
 */

type Line = Extract<Beat, { type: 'her' }>;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "8/23/2007" → "August 23, 2007" (how a blog theme prints the day). */
const longDate = (d: string) => {
  const [m, day, y] = d.split('/').map(Number) as [number, number, number];
  return `${MONTHS[m - 1]} ${day}, ${y}`;
};

/** Her line SCRIPT.HERS[i], typed again from `from` with the exact rhythm it had in the film (same length, same seed). */
export function retyped(i: number, from: number): Line {
  const index = REEL_ORIGINAL.beats.findIndex((b) => b.type === 'her' && b.text === SCRIPT.HERS[i]);
  const b = REEL_ORIGINAL.beats[index] as Line;
  return { type: 'her', text: b.text, from, at: +(from + b.at - b.from).toFixed(3), orig: { from: b.from, index } };
}

/** Every new word in this video that is not one of her lines. */
export const TUMBLR_TEXT = {
  windowSuffix: ' - Microsoft Internet Explorer',
  formTitle: 'Tumblr',
  formUrl: 'http://www.tumblr.com/new/text',
  wordmark: 'tumblr.',
  nav: ['Dashboard', 'Log out'],
  postTypes: ['Text', 'Photo', 'Quote', 'Link', 'Chat', 'Video'],
  titleLabel: 'Title (optional)',
  bodyLabel: 'Post',
  create: 'Create post',
  /** her blog: her MSN name and address, as a Tumblr blog (underscores are not allowed in a host name) */
  blogTitle: HER.name,
  blogUrl: 'http://nour-xoxo-89.tumblr.com/',
  /** the day of the film (cast.DATE) */
  date: longDate(DATE),
  footer: 'Powered by Tumblr',
  opening: (url: string) => `Opening page ${url}...`,
  done: 'Done',
  zone: 'Internet',
} as const;

export const TUMBLR = {
  duration: 10,
  /** a minute after the last nudge */
  clock: '11:48 PM',
  /** click on Quick Launch → Internet */
  launch: 1.0,
  /** the window is up (blank page, "Opening page…") */
  shown: 1.2,
  /** the text-post form is painted */
  loaded: 1.65,
  titleClick: 2.25,
  /** the post's title: "did u seriously just dump me on msn??" */
  title: retyped(5, 2.45),
  bodyClick: 4.0,
  /** the post: "i hate u" / "…" / "i miss u", one per line (Enter after the first two) */
  body: [retyped(12, 4.2), retyped(13, 4.85), retyped(14, 5.55)],
  /** click on "Create post" */
  create: 6.75,
  /** her blog, with the new post on top */
  published: 7.4,
};

/** Where things are (virtual screen px). The IE window sits over the conversation, which peeks out on the right. */
export const IE_WIN = { x: 6, y: 250, w: 452, h: 672 };
export const PAGE = ieLayout(IE_WIN);
/** The post form, relative to the page. */
export const FORM = {
  header: 50,
  panel: { x: 12, y: 56, w: 405, h: 356 },
  titleLabel: 128,
  title: { x: 28, y: 144, w: 373, h: 30 },
  bodyLabel: 186,
  body: { x: 28, y: 202, w: 373, h: 146 },
  create: { x: 28, y: 364, w: 116, h: 32 },
};
const abs = (r: { x: number; y: number; w: number; h: number }, dx: number, dy: number) => ({ x: PAGE.x + r.x + dx, y: PAGE.y + r.y + dy });
export const TSPOT = {
  /** Quick Launch → Internet, on the taskbar (see Taskbar) */
  quickLaunch: { x: 109, y: 944 },
  title: abs(FORM.title, 55, 16),
  body: abs(FORM.body, 73, 25),
  create: abs(FORM.create, 55, 17),
};

export const TUMBLR_CURSOR: CursorKey[] = [
  // where the film left it: on the nudge button
  { t: 0, x: 306, y: 720 },
  { t: 0.3, x: 306, y: 720 },
  { t: 0.95, ...TSPOT.quickLaunch },
  { t: TUMBLR.launch, ...TSPOT.quickLaunch, click: true },
  { t: 1.7, x: 150, y: 760 },
  { t: 2.2, ...TSPOT.title },
  { t: TUMBLR.titleClick, ...TSPOT.title, click: true },
  // out of the way of the words
  { t: 2.6, x: 300, y: 550 },
  { t: 3.7, x: 300, y: 550 },
  { t: 3.95, ...TSPOT.body },
  { t: TUMBLR.bodyClick, ...TSPOT.body, click: true },
  { t: 4.4, x: 330, y: 690 },
  { t: 6.2, x: 330, y: 690 },
  { t: 6.7, ...TSPOT.create },
  { t: TUMBLR.create, ...TSPOT.create, click: true },
  { t: 7.7, x: 336, y: 792 },
  { t: TUMBLR.duration, x: 336, y: 792 },
];

/** The 4:5 camera (540 × 675 of the screen at z 1). */
export const TUMBLR_CAMERA: CamKey[] = [
  { t: 0, x: 270, y: 622, z: 1 },
  { t: 1.05, x: 270, y: 622, z: 1 },
  // the browser is up: its title bar to its status bar
  { t: 1.6, x: 270, y: 586, z: 1 },
  { t: 2.0, x: 270, y: 586, z: 1 },
  // in on the form while she types (the whole width of the page)
  { t: 2.6, x: 216, y: 600, z: 1.28 },
  { t: 6.25, x: 216, y: 600, z: 1.28 },
  // the whole browser again for "Create post" and the page change
  { t: 6.75, x: 270, y: 586, z: 1 },
  { t: 7.7, x: 270, y: 586, z: 1 },
  // then slowly onto her post, past the browser's chrome
  { t: 9.7, x: 224, y: 600, z: 1.44 },
  { t: TUMBLR.duration, x: 224, y: 600, z: 1.45 },
];

const typed = (b: Line, t: number) => (t >= b.at ? b.text : t >= b.from ? [...b.text].slice(0, keyTimes(b).filter((k) => k <= t).length).join('') : '');
const within = (p: { x: number; y: number }, r: { x: number; y: number }, w: number, h: number) => p.x >= r.x && p.x <= r.x + w && p.y >= r.y && p.y <= r.y + h;

export type TumblrPage = 'blank' | 'form' | 'blog';
export interface TumblrState {
  t: number;
  ieShown: boolean;
  /** seconds since the IE window appeared */
  ieAge: number;
  page: TumblrPage;
  loading: boolean;
  progress: number;
  status: string;
  url: string;
  /** the page's <title> (IE shows the address until a page has one) */
  pageTitle: string;
  title: string;
  /** the post's lines so far (an empty last line after an Enter) */
  body: string[];
  focus: 'title' | 'body' | null;
  caretOn: boolean;
  createPressed: boolean;
  camera: { x: number; y: number; z: number };
  cursor: { x: number; y: number; pressed: boolean };
}

export function tumblrAt(t: number, view?: { w: number; h: number }): TumblrState {
  const T = TUMBLR;
  const page: TumblrPage = t < T.loaded ? 'blank' : t < T.published ? 'form' : 'blog';
  const firstLoad = t >= T.shown && t < T.loaded;
  const navigating = t >= T.create + 0.1 && t < T.published;
  const loading = firstLoad || navigating;
  const progress = firstLoad ? (t - T.shown) / (T.loaded - T.shown) : navigating ? (t - T.create - 0.1) / (T.published - T.create - 0.1) : 0;
  const url = page === 'blog' ? TUMBLR_TEXT.blogUrl : TUMBLR_TEXT.formUrl;
  const target = navigating ? TUMBLR_TEXT.blogUrl : url;
  const body: string[] = [];
  T.body.forEach((b, i) => {
    const prev = T.body[i - 1];
    if (t >= b.from || (prev && t >= prev.at)) body.push(typed(b, t));
  });
  const typing = [T.title, ...T.body].some((b) => t >= b.from && t < b.at);
  const focus = page !== 'form' || t >= T.create ? null : t >= T.bodyClick ? 'body' : t >= T.titleClick ? 'title' : null;
  const cursor = cursorAt(TUMBLR_CURSOR, t);
  return {
    t,
    ieShown: t >= T.shown,
    ieAge: t - T.shown,
    page,
    loading,
    progress,
    status: loading ? TUMBLR_TEXT.opening(target) : TUMBLR_TEXT.done,
    url,
    pageTitle: page === 'blank' ? url : page === 'form' ? TUMBLR_TEXT.formTitle : TUMBLR_TEXT.blogTitle,
    title: typed(T.title, t),
    body,
    focus,
    // solid while typing, blinking (530 ms) otherwise, as in the Messenger input
    caretOn: focus !== null && (typing || Math.floor(t / 0.53) % 2 === 0),
    createPressed: cursor.pressed && within(cursor, { x: PAGE.x + FORM.create.x, y: PAGE.y + FORM.create.y }, FORM.create.w, FORM.create.h),
    camera: cameraAt(TUMBLR_CAMERA, t, view),
    cursor,
  };
}
