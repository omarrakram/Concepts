import { ieLayout } from '../ui/ie-geometry';
import { DATE, HER } from './cast';
import { cameraAt, cursorAt, keyTimes } from './state';
import type { Beat, CamKey, CursorKey } from './types';

/**
 * Carousel slide 2: a minute after the film she opens Internet Explorer on
 * her Tumblr dashboard, clicks Text, writes the post and publishes it, then
 * her blog shows it. The post is the carousel's teaser (TEASER_POST): the only
 * words she types. Every other word on screen is browser / Tumblr furniture,
 * all of it in TUMBLR_TEXT (and in docs/carousel.md).
 *
 * The pages follow archived 2007 Tumblr where it was archived (see
 * docs/sources.md): the dashboard frame and "Add a new..." buttons of April
 * 2007, the form style of the archived 2007 forms, and the default blog theme
 * of August 2007, in colours she chose (the theme let you pick them). The
 * logged-in text-post form itself was never archived: it is reconstructed
 * from those. Everything is fitted to the narrow browser window.
 */

type Line = Extract<Beat, { type: 'her' }>;

/**
 * The teaser she posts (the collaborator's voice note A: what she writes
 * should say "stay tuned", so the post works as a teaser). The words are the
 * collaborator's own; she will send the final wording, so it lives here and
 * only here: the timeline, the cues and the camera follow it.
 *
 * A title-only text post: Tumblr's 2007 API took a text ("regular") post with
 * "at least one: title, body". Body lines, if any, are typed one per line.
 */
export const TEASER_POST: { title: string; body: string[]; final: boolean } = {
  title: 'stay tuned',
  body: [],
  /** false until the collaborator's final wording is in */
  final: false,
};

const [MONTH, DAY, YEAR] = DATE.split('/').map(Number) as [number, number, number];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

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
  /** the theme prints the day of a post in a block, upper-cased: "THU", "AUG" / "23RD" (the film's date) */
  day: SHORT_DAYS[new Date(Date.UTC(YEAR, MONTH - 1, DAY)).getUTCDay()]!,
  dateBlock: [SHORT_MONTHS[MONTH - 1]!, ordinal(DAY)] as [string, string],
  rss: 'RSS',
  /** the Tumblr control at the top right of a blog, for its signed-in owner */
  control: 'Dashboard',
  footer: 'Powered by Tumblr',
  opening: (url: string) => `Opening page ${url}...`,
  done: 'Done',
  zone: 'Internet',
} as const;

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
  let from = (bodyClick ?? 0) + 0.2;
  for (const text of TEASER_POST.body) {
    const line = typedLine(text, from);
    body.push(line);
    from = line.at + 0.3;
  }
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
    /** click on "Create post" */
    create,
    /** her blog, with the post on top */
    published,
    /** the post stays on screen, the camera moving onto it */
    duration: Math.round((published + 3.4) * 10) / 10,
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
export const TUMBLR_CURSOR: CursorKey[] = [
  // where the film left it: on the nudge button
  { t: 0, x: 306, y: 720 },
  { t: 0.3, x: 306, y: 720 },
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
  { t: 0, x: 270, y: 622, z: 1 },
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
  // then slowly onto her post: her blog's title, the day block and the words
  { t: T.duration - 0.4, x: 176, y: 520, z: 1.54 },
  { t: T.duration, x: 176, y: 520, z: 1.545 },
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
  const body: string[] = [];
  T.body.forEach((b, i) => {
    const prev = T.body[i - 1];
    if (t >= b.from || (prev && t >= prev.at)) body.push(typed(b, t));
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
