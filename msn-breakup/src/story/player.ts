import { FPS } from '../constants';
import { SONG } from './cast';
import { cameraAt, cursorAt } from './state';
import type { CamKey, CursorKey } from './types';

/**
 * Carousel slide 3: she opens Windows Media Player 11 from the Start menu,
 * selects "When You’re Gone" by Avril Lavigne and presses Play. The song
 * starts on PLAY_FRAME, the first frame on which the button shows Pause:
 * the mouse goes down 3 frames earlier (the click) and the Play action
 * takes effect on release, as in Windows. Nothing plays before that.
 */

/** The supplied file (the official video's audio track; never committed, see public/music/README.md). */
export const SONG_SOURCE = {
  /** seconds, as ffprobe reports the audio stream */
  duration: 239.258,
  /** the file opens with 1.9 s of digital silence and a soft swell; the first note lands at 4.903 s */
  firstNote: 4.903,
  /** playback starts here (frame 147 at 30 fps = 4.900 s): the note sounds 3 ms into PLAY_FRAME */
  inFrames: 147,
};

/** The frame the Play action takes effect: Pause shows, "Playing", 00:00, and the song begins. */
export const PLAY_FRAME = 78;
const PLAY = PLAY_FRAME / FPS;

export const PLAYER = {
  /** ends on the bar line after the first sung line (file 15.1 s) */
  duration: 12.8,
  /** a minute after the Tumblr post */
  clock: '11:49 PM',
  /** click on Start; the menu opens */
  start: 0.72,
  menuShown: 0.76,
  /** click on "Windows Media Player"; the menu closes and the app starts (hourglass) */
  launch: 1.2,
  /** the player is up, in Library ▸ Songs */
  shown: 1.6,
  /** click on the song: the row is selected */
  select: 2.0,
  /** mouse down on Play (the click sound), 3 frames before it takes effect */
  press: (PLAY_FRAME - 3) / FPS,
  play: PLAY,
  /** click on the Now Playing tab: the visualisation */
  nowPlaying: 3.2,
  /** the song fades over the last 0.3 s, into the bar line */
  fadeOut: 0.3,
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** The track as the player lists it. Length: what actually plays (the file from the playback point). */
export const TRACK = {
  title: SONG.title,
  artist: SONG.artist,
  album: 'The Best Damn Thing',
  year: '2007',
  number: '5',
  seconds: SONG_SOURCE.duration - SONG_SOURCE.inFrames / FPS,
  length: mmss(SONG_SOURCE.duration - SONG_SOURCE.inFrames / FPS),
};

/** Every word of Windows chrome in this video (the Start menu and the player's own controls). */
export const START_TEXT = {
  /** her Windows account (her name, from her Messenger address) */
  account: 'nour',
  pinned: [
    ['Internet', 'Internet Explorer'],
    ['E-mail', 'Outlook Express'],
  ],
  recent: ['MSN Messenger 7.5', 'Windows Media Player'],
  allPrograms: 'All Programs',
  places: ['My Documents', 'My Recent Documents', 'My Pictures', 'My Music', 'My Computer', 'Control Panel', 'Help and Support', 'Search', 'Run...'],
  logOff: 'Log Off',
  turnOff: 'Turn Off Computer',
} as const;
export const PLAYER_TEXT = {
  window: 'Windows Media Player',
  tabs: ['Now Playing', 'Library', 'Rip', 'Burn', 'Sync'],
  breadcrumb: ['Music', 'Library', 'Songs'],
  search: 'Search',
  playlists: 'Playlists',
  createPlaylist: 'Create Playlist',
  library: 'Library',
  libraryViews: ['Recently Added', 'Artist', 'Album', 'Songs', 'Genre', 'Year', 'Rating'],
  columns: ['Album', '#', 'Title', 'Length', 'Rating'],
  playing: 'Playing',
} as const;

/** Where things are (virtual screen px). */
export const START_MENU = { x: 0, y: 510, w: 330, h: 420 };
export const WMP_WIN = { x: 12, y: 296, w: 516, h: 626 };
/** Inside the player (relative to its window). */
export const WMP = {
  title: 20,
  tabs: 38,
  toolbar: 28,
  nav: 130,
  controls: 70,
  tab: [62, 148, 210, 252, 298, 344] as const, // left edges, then the end of the last
  header: 86,
  group: 112,
  row: 134,
  rowH: 19,
  /** columns, relative to the song list */
  col: { num: 104, title: 124, length: 270, rating: 316 },
  /** the Play button: centre (relative to the window) and radius */
  play: { x: 258, y: 596, r: 20 },
  /** where the visualisation ends and the list pane begins (Now Playing) */
  listPane: 340,
};
const at = (x: number, y: number) => ({ x: WMP_WIN.x + x, y: WMP_WIN.y + y });
export const PSPOT = {
  start: { x: 40, y: 945 },
  /** "Windows Media Player" in the Start menu's left column */
  menuItem: { x: 92, y: START_MENU.y + 185 },
  song: at(WMP.nav + WMP.col.title + 44, WMP.row + 9),
  /** low and right on the button, so the pointer never hides the ▶ / ❚❚ */
  play: at(WMP.play.x + 9, WMP.play.y + 9),
  nowPlayingTab: at((WMP.tab[0] + WMP.tab[1]) / 2, WMP.title + 19),
};
/** The rows that react to the pointer. */
const MENU_ITEM = { x: START_MENU.x + 3, y: START_MENU.y + 170, w: 174, h: 30 };
const SONG_ROW = { ...at(WMP.nav, WMP.row), w: WMP_WIN.w - WMP.nav, h: WMP.rowH };
const NOW_TAB = { ...at(WMP.tab[0], WMP.title), w: WMP.tab[1] - WMP.tab[0], h: WMP.tabs };

export const PLAYER_CURSOR: CursorKey[] = [
  // where the Tumblr video left it
  { t: 0, x: 336, y: 792 },
  { t: 0.3, x: 336, y: 792 },
  { t: 0.68, ...PSPOT.start },
  { t: PLAYER.start, ...PSPOT.start, click: true },
  { t: 0.84, ...PSPOT.start },
  { t: 1.15, ...PSPOT.menuItem },
  { t: PLAYER.launch, ...PSPOT.menuItem, click: true },
  { t: 1.6, x: PSPOT.menuItem.x + 6, y: PSPOT.menuItem.y - 4 },
  { t: 1.95, ...PSPOT.song },
  { t: PLAYER.select, ...PSPOT.song, click: true },
  { t: 2.08, ...PSPOT.song },
  { t: 2.42, ...PSPOT.play },
  { t: PLAYER.press, ...PSPOT.play, click: true },
  { t: 2.72, ...PSPOT.play },
  { t: 3.15, ...PSPOT.nowPlayingTab },
  { t: PLAYER.nowPlaying, ...PSPOT.nowPlayingTab, click: true },
  // then she lets go of the mouse: off to the empty end of the list pane
  { t: 3.5, ...PSPOT.nowPlayingTab },
  { t: 4.3, x: 470, y: 760 },
  { t: PLAYER.duration, x: 470, y: 760 },
];

/** 4:5. Still through the Play click (nothing moves but her pointer), then a slow lean in. */
export const PLAYER_CAMERA: CamKey[] = [
  { t: 0, x: 270, y: 622, z: 1 },
  { t: 3.3, x: 270, y: 622, z: 1 },
  { t: PLAYER.duration, x: 270, y: 610, z: 1.06 },
];

const inside = (p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export interface PlayerState {
  t: number;
  menuOpen: boolean;
  menuHover: 'player' | null;
  /** the "app starting" pointer (arrow + hourglass) */
  busy: boolean;
  wmpShown: boolean;
  wmpAge: number;
  view: 'library' | 'nowPlaying';
  selected: boolean;
  rowHover: boolean;
  playing: boolean;
  /** seconds since PLAY_FRAME (0 before) */
  elapsed: number;
  playHover: boolean;
  playPressed: boolean;
  tabHover: boolean;
  camera: { x: number; y: number; z: number };
  cursor: { x: number; y: number; pressed: boolean };
}

export function playerAt(t: number, view?: { w: number; h: number }): PlayerState {
  const P = PLAYER;
  const cursor = cursorAt(PLAYER_CURSOR, t);
  const menuOpen = t >= P.menuShown && t < P.launch + 0.05;
  const playing = t >= P.play;
  const centre = at(WMP.play.x, WMP.play.y);
  const overPlay = Math.hypot(cursor.x - centre.x, cursor.y - centre.y) <= WMP.play.r;
  return {
    t,
    menuOpen,
    menuHover: menuOpen && inside(cursor, MENU_ITEM) ? 'player' : null,
    busy: t >= P.launch + 0.05 && t < P.shown + 0.15,
    wmpShown: t >= P.shown,
    wmpAge: t - P.shown,
    view: t >= P.nowPlaying + 0.05 ? 'nowPlaying' : 'library',
    selected: t >= P.select,
    rowHover: t >= P.shown && inside(cursor, SONG_ROW),
    playing,
    elapsed: playing ? t - P.play : 0,
    playHover: t >= P.shown && overPlay,
    playPressed: cursor.pressed && overPlay,
    tabHover: t >= P.shown && inside(cursor, NOW_TAB),
    camera: cameraAt(PLAYER_CAMERA, t, view),
    cursor,
  };
}
