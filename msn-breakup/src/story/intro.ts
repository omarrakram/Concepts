/**
 * The opening of the carousel (the collaborator's brief, voice note B): "start
 * the post as if the computer is turning on normally, in the time we're in
 * now, and then a glitch happens, or it crashes, or whatever, and then it
 * opens onto the old Windows", a little introduction before the post.
 *
 * So: a present-day lock screen comes up, glitches, collapses like an old
 * monitor switching off, and old Windows starts: the old monitor comes on
 * (its degauss), the XP loading bar, black, the XP "welcome" screen, then her
 * XP desktop fades in: the film's first frame. Prepended to carousel slide 1.
 * The present-day screen is generic (no vendor's logo or artwork), and the XP
 * screens leave out Microsoft's logo, wordmark and startup sound.
 */
export const INTRO = {
  duration: 4.8,
  /** the screen is up: the present-day lock screen has brightened */
  on: 0.3,
  /** the glitch starts, and builds */
  glitch: 1.45,
  /** the picture collapses (a monitor switching off) */
  crash: 2.35,
  /** nothing */
  black: 2.7,
  /** old Windows starts: the old monitor comes on (its degauss) with the loading bar */
  boot: 2.85,
  /** the loading bar goes: black again */
  bootEnd: 3.6,
  /** the "welcome" screen */
  welcome: 3.72,
  /** her XP desktop fades in over it (the film's first frame) */
  desktop: 4.45,
};

/** The only words in the opening. */
export const INTRO_TEXT = {
  /** the present-day lock screen's clock: the film's minute (her taskbar reads 11:47 PM), 19 years later */
  time: '11:47',
  /** its date: the day the opening was asked for (Wednesday 28 October 2026) */
  date: 'Wednesday, October 28',
  /** the old Windows logon screen */
  welcome: 'welcome',
};
