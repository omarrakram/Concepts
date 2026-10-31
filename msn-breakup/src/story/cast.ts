/**
 * Who is who. The video is HER screen: she is signed in, he is her contact.
 * Names are fictional; change them here and every window, toast and line
 * follows. The two IYS easter eggs live here too: her personal message
 * (fluffy pjoys) and the conversation window's emoticon-pack tip line.
 */
export const HIM = {
  name: 'karim',
  email: 'karim_86@hotmail.com',
  psm: 'busy w/ life',
};

export const HER = {
  name: '~*nOuR*~',
  email: 'nour_xoxo_89@hotmail.com',
  /** (L) renders as the red heart emoticon, like Messenger did. */
  psm: 'in my fluffy pjoys rn (L)',
};

/** What the popup says he is listening to (the music cue starts with it). */
export const SONG = { title: 'When You’re Gone', artist: 'Avril Lavigne' };

/** The conversation footer's sponsored tip (easter egg #2, where the theme-pack ad used to be). */
export const TIP = 'Click for new Emoticons and Theme Packs from IYS';

/** Clock + date shown on screen (2007: the song came out that summer). */
export const CLOCK = '11:47 PM';
/** the first release's date in the status line (the teaser, the first cut, the stills); the film now shows REEL.date, 8.11.2007 */
export const DATE = '8/23/2007';

/** Her other contacts, for an authentic, slightly chaotic list. */
export const CONTACTS: { name: string; status: 'online' | 'away' | 'busy' | 'offline' | 'blocked'; psm?: string }[] = [
  { name: 'Yasmine <3', status: 'away', psm: 'cAiRo GiRl' },
  { name: '~*~ m0 ~*~', status: 'busy', psm: 'exams kill meeee' },
  { name: 'sherif', status: 'online', psm: 'ahly 4 life' },
  { name: 'Hana :P', status: 'online' },
  { name: 'ziad (dont ask)', status: 'blocked' },
  { name: 'dina', status: 'offline' },
  { name: 'tamer_88@hotmail.com', status: 'offline' },
  { name: 'laila.m', status: 'offline' },
  { name: 'seif', status: 'offline' },
  { name: 'mariam ~*', status: 'offline' },
];
