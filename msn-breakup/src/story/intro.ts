/**
 * The opening of the carousel (the collaborator's brief, voice note B): "start
 * the post as if the computer is turning on normally, ... and then a glitch
 * happens, or it crashes, or whatever, and then it opens onto the old
 * Windows", a little introduction before the post. Her final note: the first
 * screen must be unmistakably a 2007 desktop computer (the first version's
 * present-day lock screen read as a phone).
 *
 * So: her 2007 computer is on (her XP desktop, Messenger open, the film's own
 * first frame), it glitches, collapses like an old monitor switching off, and
 * old Windows starts again: the old monitor comes on (its degauss), the XP
 * loading bar, black, the XP "welcome" screen, then her XP desktop fades in:
 * the film's first frame. Prepended to carousel slide 1. The XP screens leave
 * out Microsoft's logo, wordmark and startup sound.
 */
export const INTRO = {
  duration: 4.8,
  /** the screen is up: her desktop has brightened */
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

/** The opening's own words (its first screen is the film's first frame, with the film's words). */
export const INTRO_TEXT = {
  /** the old Windows logon screen */
  welcome: 'welcome',
};
