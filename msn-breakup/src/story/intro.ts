/**
 * The opening of the carousel: a journey from NOW to THEN (the collaborator's
 * brief). It starts on a present-day computer: a clean, current Windows
 * desktop (a browser open on a new tab, the centred taskbar, the tray clock
 * at 11:47 PM on 8.11.2027, the mouse pointer). The pointer heads for the
 * search box and stops; the picture stutters; then a glitch (the picture jumps and freezes,
 * the colours split, bands tear sideways, blocks break up like a damaged
 * video) lets the old system show through the cracks, until the Windows XP
 * desktop of 2007 takes over: the old monitor's degauss, and her desktop
 * exactly as the film begins (Messenger open, the pointer where the new one
 * was). Prepended to carousel slide 1.
 *
 * The opening keeps its length (4.8 s, 144 frames), so the film still starts
 * on frame 144 of the slide, at the same time as before. Nothing in it is a
 * phone: no lock screen, no battery, no notch, no app grid. The present-day
 * screen draws no Microsoft logo or artwork: its icons are original drawings.
 */
export const INTRO = {
  duration: 4.8,
  /** the pointer reaches the browser's search box and stops there */
  hesitate: 1.45,
  /** the first sign that something is wrong: the pointer twitches, the picture stutters */
  distort: 1.75,
  /** the glitch (0.9 s, with its sound) */
  glitch: 2.2,
  /** the Windows XP desktop takes over, with the old monitor's degauss */
  xp: 3.1,
  /** the old monitor has settled: her XP desktop, still, as the film's first frame */
  settled: 3.75,
};

/** Every word on the present-day screen (the 2007 screen that follows is the film's own). */
export const INTRO_TEXT = {
  /** the taskbar's clock and date: the minute of her last message, twenty years to the day after that night (8.11.2007), written as the brief writes it */
  time: '11:47 PM',
  date: '8.11.2027',
  /** the taskbar's weather */
  temperature: '64°F',
  weather: 'Clear',
  search: 'Search',
  icons: ['Recycle Bin', 'Documents'],
  /** the browser, on a new tab */
  tab: 'New tab',
  address: 'Search or type a web address',
  searchBox: 'Search the web',
  shortcuts: ['Mail', 'Maps', 'Music', 'Photos', 'Docs', 'Weather'],
};
