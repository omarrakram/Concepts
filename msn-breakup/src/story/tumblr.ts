import { ieLayout } from '../ui/ie-geometry';
import { HER } from './cast';
import { FPS } from '../constants';
import { PLAY_FRAME, PLAYER, PLAYER_CAMERA, PLAYER_CURSOR, SONG_SOURCE } from './player';
import { cameraAt, cursorAt, keyTimes } from './state';
import type { Beat, CamKey, CursorKey } from './types';

/**
 * Carousel slide 3, the last, picks up where slide 2 ends: Windows Media
 * Player open on Now Playing, the song still playing (it carries on from the
 * point slide 2 stops), her pointer and the camera where slide 2 left them.
 * She opens Internet Explorer over the player, on her Tumblr dashboard, clicks Text, writes the post (her sentence, a pause, a blank
 * line, STAY TUNED.) and publishes it, then her blog shows it, dated
 * 8.11.2007, and the carousel ends on that published post. The post
 * (TEASER_POST) is the only thing she types. Every other word on screen is
 * browser / Tumblr furniture, all of it in TUMBLR_TEXT (and in docs/carousel.md).
 *
 * The pages follow archived 2007 Tumblr where it was archived (see
 * docs/sources.md): the dashboard frame and "Add a new..." buttons of April
 * 2007, the form style of the archived 2007 forms, and the default blog theme
 * of August 2007, in colours she chose (the theme let you pick them). The
 * logged-in text-post form itself was never archived: it is reconstructed
 * from those. Everything is fitted to the narrow browser window.
 */

type Line = Extract<Beat, { type: 'her' }>;

/** Her sentence: the collaborator's final wording, exactly as written: lower case, a full stop. */
export const STATEMENT = 'i guess some people are just passing through.';
/** The campaign's line, which she writes into the same post after a blank line: capitals, a full stop. */
export const STAY_TUNED = 'STAY TUNED.';

/**
 * What she posts, and the only place it lives: the timeline, the cues and the
 * camera follow it. One text post, written in its Post box: her sentence, a
 * blank line, STAY TUNED. No title (Tumblr's 2007 API took a text ("regular")
 * post with "at least one: title, body"). Body lines are typed one per line.
 */
export const TEASER_POST: { title: string; body: string[]; final: boolean } = {
  title: '',
  body: [STATEMENT, '', STAY_TUNED],
  /** the collaborator's final wording */
  final: true,
};

/** The post's date (the collaborator's brief): 8 November 2007, printed exactly as "8.11.2007". */
const POST_DATE = { day: 8, month: 11, year: 2007 };
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Every new word in this video that she does not type. */
export const TUMBLR_TEXT = {
  windowSuffix: ' - Microsoft Internet Explorer',
  /** the dashboard's and the form's page title */
  pageTitle: 'Tumblr',
  dashboardUrl: 'http://www.tumblr.com/dashboard',
  formUrl: 'http://www.tumblr.com/new/text',
  /** set in a plain bold face: not Tumblr's logo */
  wordmark: 'tumblr.',
  /** top right, as archived in April 2007: her blog, Log out, Help (each followed by «) */
  links: ['nour-xoxo-89.tumblr.com', 'Log out', 'Help'],
  tabs: ['Dashboard', 'Feeds', 'Settings', 'Goodies'],
  addNew: 'Add a new...',
  postTypes: ['Text', 'Photo', 'Quote', 'Link', 'Chat', 'Video'],
  /** the dashboard's side column: her Tumblr name and the photo link */
  sideName: 'nour-xoxo-89',
  sidePhoto: 'Change my photo',
  /** the form (reconstructed: see docs/sources.md) */
  formHeading: 'Add a Text Post',
  titleLabel: 'Title',
  optional: '(optional)',
  bodyLabel: 'Post',
  formatting: ['Bold', 'Italic', 'Link'],
  create: 'Create post',
  cancel: 'Cancel',
  /** her blog: her MSN name and address, as a Tumblr blog (underscores are not allowed in a host name) */
  blogTitle: HER.name,
  blogUrl: 'http://nour-xoxo-89.tumblr.com/',
  /** the theme prints the day of a post next to it: the weekday, upper-cased ("THU"), and the date in its block */
  day: SHORT_DAYS[new Date(Date.UTC(POST_DATE.year, POST_DATE.month - 1, POST_DATE.day)).getUTCDay()]!,
  postDate: `${POST_DATE.day}.${POST_DATE.month}.${POST_DATE.year}`,
  rss: 'RSS',
  /** the Tumblr control at the top right of a blog, for its signed-in owner */
  control: 'Dashboard',
  footer: 'Powered by Tumblr',
  opening: (url: string) => `Opening page ${url}...`,
  done: 'Done',
  zone: 'Internet',
} as const;

/**
 * The song carries on from slide 2: slide 3's first frame plays the file frame slide 2 would play
 * next (slide 2 plays it from SONG_SOURCE.inFrames, on PLAY_FRAME, to its end: file 15.1 s). A
 * 0.1 s fade in (slide 2 fades out over its last 0.3 s), and out over slide 3's last second.
 */
export const TUMBLR_SONG = {
  /** the file frame (at the video's rate) slide 3 starts on */
  from: SONG_SOURCE.inFrames + Math.round(PLAYER.duration * FPS) - PLAY_FRAME,
  fadeIn: 0.1,
  fadeOut: 1.0,
};

/** Her blog's colours: the theme's defaults, with her pink where the theme let her choose. */
export const BLOG_COLORS = {
  background: '#fff',
  title: '#e0108a',
  postTitle: '#e0108a',
  text: '#444',
  date: '#f2b8d6',
  dateBlock: '#e0108a',
  dateBlockText: '#ffd3ea',
};

/** Her typing here: unhurried (a post, not a reply), ~0.085 s a key. */
const KEY = 0.085;
/** After her sentence she stops (the caret blinks) before Enter. */
const PAUSE = 0.8;
/** Enter to Enter (the blank line), and the last Enter to the next key. */
const RETURN = 0.28;
const typedLine = (text: string, from: number): Line => ({ type: 'her', text, from: +from.toFixed(3), at: +(from + [...text].length * KEY + 0.07).toFixed(3) });

function timeline() {
  const launch = 1.0;
  const shown = 1.2;
  const dashboard = 1.65;
  const textClick = 2.3;
  const loaded = 2.8;
  const firstClick = 3.2;
  const title = TEASER_POST.title ? typedLine(TEASER_POST.title, firstClick + 0.2) : null;
  const bodyClick = TEASER_POST.body.length ? +(title ? title.at + 0.45 : firstClick).toFixed(3) : null;
  const body: Line[] = [];
  const enters: number[] = [];
  let from = (bodyClick ?? 0) + 0.2;
  TEASER_POST.body.forEach((text, i) => {
    const line = typedLine(text, from);
    body.push(line);
    if (i === TEASER_POST.body.length - 1) return;
    // a written line: a pause, then Enter; an empty line: Enter again (the blank line)
    const enter = +(text ? line.at + PAUSE : line.from + RETURN).toFixed(3);
    enters.push(enter);
    from = TEASER_POST.body[i + 1] ? enter + RETURN : enter;
  });
  const typed = (body.at(-1) ?? title)!.at;
  const create = +(typed + 0.6).toFixed(3);
  const published = +(create + 0.6).toFixed(3);
  return {
    /** a minute after the last nudge */
    clock: '11:48 PM',
    /** click on Quick Launch → Internet */
    launch,
    /** the window is up (blank page, "Opening page…") */
    shown,
    /** her dashboard is painted */
    dashboard,
    /** click on "Text" */
    textClick,
    /** the text-post form is painted */
    loaded,
    /** click on the Title field (null if the post has no title) */
    titleClick: title ? firstClick : null,
    title,
    /** click on the Post field (null if the post has no body) */
    bodyClick,
    body,
    /** the Enter that ends each body line but the last: the next line starts there */
    enters,
    /** click on "Create post" */
    create,
    /** her blog, with the post on top */
    published,
    /** the camera has moved onto her post (as before, 3 s after it appears) */
    onPost: +(published + 3).toFixed(3),
    /** the video ends on her published post, 4.9 s after it appears (the time the post and the old end card had) */
    duration: Math.round((published + 4.9) * 10) / 10,
  };
}
export const TUMBLR = timeline();

/** Where things are (virtual screen px). The IE window sits over the conversation, which peeks out on the right. */
export const IE_WIN = { x: 6, y: 250, w: 452, h: 672 };
export const PAGE = ieLayout(IE_WIN);
/** The dashboard frame, shared by the dashboard and the form (relative to the page). */
export const FRAME = {
  tabs: { y: 60, h: 22, x: [14, 98, 164, 238], w: [80, 62, 70, 68] },
  panel: { x: 14, y: 82, w: 401, h: PAGE.h - 82 },
};
/** The dashboard (relative to the page). */
export const DASH = {
  addNew: { x: 28, y: 92 },
  /** the six "Add a new..." buttons */
  pills: { x: 24, y: 114, w: 60, h: 28, gap: 4 },
  side: { x: 288, y: 162, w: 117 },
};
/** The text-post form (relative to the page). */
export const FORM = {
  heading: { x: 28, y: 92 },
  titleLabel: 130,
  title: { x: 30, y: 146, w: 369, h: 26 },
  bodyLabel: 184,
  formatting: 201,
  body: { x: 30, y: 222, w: 369, h: 150 },
  create: { x: 30, y: 388, w: 88, h: 22 },
};
/** Her blog (relative to the page): the theme's layout, in a narrower page. */
export const BLOG = {
  /** the title, its rule and the RSS badge */
  title: { x: 16, w: PAGE.w - 32, top: 46, line: 44, rule: 106 },
  rss: { w: 43, h: 23 },
  /** the post column; the day block sits to its left, 30 px off */
  post: { x: 156, y: 146, w: PAGE.w - 156 - 20 },
};
const abs = (r: { x: number; y: number; w: number; h: number }, dx = r.w / 2, dy = r.h / 2) => ({ x: Math.round(PAGE.x + r.x + dx), y: Math.round(PAGE.y + r.y + dy) });
export const pill = (i: number) => ({ x: DASH.pills.x + i * (DASH.pills.w + DASH.pills.gap), y: DASH.pills.y, w: DASH.pills.w, h: DASH.pills.h });
export const TSPOT = {
  /** Quick Launch → Internet, on the taskbar (see Taskbar) */
  quickLaunch: { x: 109, y: 944 },
  text: abs(pill(0), 30, 15),
  title: abs(FORM.title, 70, 14),
  body: abs(FORM.body, 73, 25),
  create: abs(FORM.create, 47, 12),
};

const T = TUMBLR;
const field = T.title ? TSPOT.title : TSPOT.body;
const fieldClick = (T.titleClick ?? T.bodyClick)!;
/** Where slide 2 leaves her pointer, and its camera. */
const FROM_PLAYER = { cursor: PLAYER_CURSOR.at(-1)!, camera: PLAYER_CAMERA.at(-1)! };
export const TUMBLR_CURSOR: CursorKey[] = [
  // where slide 2 left it: resting on the player's list pane
  { t: 0, x: FROM_PLAYER.cursor.x, y: FROM_PLAYER.cursor.y },
  { t: 0.3, x: FROM_PLAYER.cursor.x, y: FROM_PLAYER.cursor.y },
  { t: T.launch - 0.05, ...TSPOT.quickLaunch },
  { t: T.launch, ...TSPOT.quickLaunch, click: true },
  { t: T.dashboard + 0.1, x: 150, y: 640 },
  { t: T.textClick - 0.05, ...TSPOT.text },
  { t: T.textClick, ...TSPOT.text, click: true },
  { t: T.loaded, x: 210, y: 660 },
  { t: fieldClick - 0.05, ...field },
  { t: fieldClick, ...field, click: true },
  // out of the way of the words
  { t: fieldClick + 0.35, x: 300, y: 660 },
  ...(T.title && T.bodyClick !== null
    ? [
        { t: T.bodyClick - 0.3, x: 300, y: 660 },
        { t: T.bodyClick - 0.05, ...TSPOT.body },
        { t: T.bodyClick, ...TSPOT.body, click: true },
        { t: T.bodyClick + 0.35, x: 330, y: 690 },
      ]
    : []),
  { t: T.create - 0.5, x: 300, y: 690 },
  { t: T.create - 0.05, ...TSPOT.create },
  { t: T.create, ...TSPOT.create, click: true },
  { t: T.published + 0.4, x: 428, y: 828 },
  { t: T.duration, x: 428, y: 828 },
];

/** The 4:5 camera (540 × 675 of the screen at z 1). */
export const TUMBLR_CAMERA: CamKey[] = [
  // as slide 2 ends (leaning in on the player), then back out to the whole screen, the taskbar in shot, for Quick Launch
  { t: 0, x: FROM_PLAYER.camera.x, y: FROM_PLAYER.camera.y, z: FROM_PLAYER.camera.z },
  { t: 0.3, x: FROM_PLAYER.camera.x, y: FROM_PLAYER.camera.y, z: FROM_PLAYER.camera.z },
  { t: T.launch - 0.1, x: 270, y: 622, z: 1 },
  { t: T.launch + 0.05, x: 270, y: 622, z: 1 },
  // the browser is up: its title bar to its status bar
  { t: T.dashboard - 0.05, x: 270, y: 586, z: 1 },
  { t: T.textClick + 0.1, x: 270, y: 586, z: 1 },
  // in on the form while she types
  { t: fieldClick + 0.1, x: 222, y: 588, z: 1.3 },
  { t: T.create - 0.55, x: 222, y: 588, z: 1.3 },
  // the whole browser again for "Create post" and the page change
  { t: T.create - 0.1, x: 270, y: 586, z: 1 },
  { t: T.published + 0.25, x: 270, y: 586, z: 1 },
  // then slowly onto her post: her blog's title, the day block and all her words, and it stays on them to the end
  { t: T.onPost, x: 204, y: 520, z: 1.345 },
  { t: T.duration, x: 204, y: 520, z: 1.36 },
];

const typed = (b: Line | null, t: number) => (!b ? '' : t >= b.at ? b.text : t >= b.from ? [...b.text].slice(0, keyTimes(b).filter((k) => k <= t).length).join('') : '');
const within = (p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) => p.x >= PAGE.x + r.x && p.x <= PAGE.x + r.x + r.w && p.y >= PAGE.y + r.y && p.y <= PAGE.y + r.y + r.h;

export type TumblrPage = 'blank' | 'dashboard' | 'form' | 'blog';
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
  textPressed: boolean;
  createPressed: boolean;
  camera: { x: number; y: number; z: number };
  cursor: { x: number; y: number; pressed: boolean };
}

export function tumblrAt(t: number, view?: { w: number; h: number }): TumblrState {
  const page: TumblrPage = t < T.dashboard ? 'blank' : t < T.loaded ? 'dashboard' : t < T.published ? 'form' : 'blog';
  const firstLoad = t >= T.shown && t < T.dashboard;
  const toForm = t >= T.textClick + 0.1 && t < T.loaded;
  const toBlog = t >= T.create + 0.1 && t < T.published;
  const loading = firstLoad || toForm || toBlog;
  const span = (a: number, b: number) => (t - a) / (b - a);
  const progress = firstLoad ? span(T.shown, T.dashboard) : toForm ? span(T.textClick + 0.1, T.loaded) : toBlog ? span(T.create + 0.1, T.published) : 0;
  // the address changes when the new page arrives; the status bar names where it is going
  const url = page === 'blog' ? TUMBLR_TEXT.blogUrl : page === 'form' ? TUMBLR_TEXT.formUrl : TUMBLR_TEXT.dashboardUrl;
  const target = toForm ? TUMBLR_TEXT.formUrl : toBlog ? TUMBLR_TEXT.blogUrl : url;
  // each line after the first starts at the Enter that ends the line before it
  const body: string[] = [];
  T.body.forEach((b, i) => {
    if (i === 0 ? t >= b.from : t >= T.enters[i - 1]!) body.push(typed(b, t));
  });
  const typing = [T.title, ...T.body].some((b) => b && t >= b.from && t < b.at);
  const focus = page !== 'form' || t >= T.create ? null : T.bodyClick !== null && t >= T.bodyClick ? 'body' : T.titleClick !== null && t >= T.titleClick ? 'title' : null;
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
    pageTitle: page === 'blank' ? url : page === 'blog' ? TUMBLR_TEXT.blogTitle : TUMBLR_TEXT.pageTitle,
    title: typed(T.title, t),
    body,
    focus,
    // solid while typing, blinking (530 ms) otherwise, as in the Messenger input
    caretOn: focus !== null && (typing || Math.floor(t / 0.53) % 2 === 0),
    textPressed: page === 'dashboard' && cursor.pressed && within(cursor, pill(0)),
    createPressed: page === 'form' && cursor.pressed && within(cursor, FORM.create),
    camera: cameraAt(TUMBLR_CAMERA, t, view),
    cursor,
  };
}
