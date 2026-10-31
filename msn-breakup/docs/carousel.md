# The Instagram carousel

Three videos, posted together as one carousel. All three are 4:5 (1080 × 1350),
30 fps, H.264 + AAC. `npm run render:carousel` renders them into
`out/instagram-carousel-final/`, with a cover per slide, one contact sheet and
the ordered manifest (`MANIFEST.md`, `manifest.json`). The first version's
folder, `out/instagram-carousel/`, is never written to by this version.

| # | File | Composition | Length | What happens |
| - | - | - | - | - |
| 1 | `01-msn-breakup-final.mp4` | `BreakupCarousel` | 39.8 s | Her 2007 computer, on her XP desktop, glitches, crashes and starts up again (4.8 s). Then the film: he dumps her on MSN, she spirals, three nudges. |
| 2 | `02-music-player-final.mp4` | `MusicPlayerBreakup` | 12.8 s | She opens Windows Media Player and puts on “When You’re Gone”. |
| 3 | `03-tumblr-statement-final.mp4` | `TumblrBreakup` | 13.4 s | On 2007 Tumblr she writes and posts *i guess some people are just passing through.*, dated 8.11.2007. Then **STAY TUNED.** |

Also rendered: `02-music-player-final-clean.mp4` (slide 2 without the song, see
[the music README](../public/music/README.md)) and the 9:16 master of the film,
`out/msn-breakup-reel.mp4` (`HeroReel`, 1080 × 1920, without the opening).

All three are 4:5, so the app neither letterboxes nor crops them, and each is
under Instagram's 60 s limit for a carousel video.

## The final corrections (31 October 2026)

The collaborator approved the carousel and asked for exactly three changes.
Nothing else was redesigned.

1. **The first screen is a 2007 desktop computer, not a phone.** The first
   version opened on a present-day lock screen (a big clock and the date,
   wi-fi and battery icons, filling the portrait frame), which read as a
   phone. The opening now starts on her Windows XP desktop: the film's own
   first frame (the Messenger window and its title bar, the desktop icons, the
   pointer, the Bliss-style hills), coming up from half-lit as a monitor does.
   Everything after it is as approved: the same glitch, crash, black, degauss,
   loading bar, “welcome” and desktop, on the same frames, with the same
   sounds; the opening is still 4.8 s. (`DesktopScreen` in `src/Intro.tsx`.)
2. **The order is the breakup, the song, then Tumblr.** One list,
   `scripts/carousel-list.mjs`, sets the order; the render, covers, contact
   sheet, manifest, QA and cue sheet all read it. The three videos are the
   approved compositions. The reorder needed one change inside slide 2: the
   music-player video used to show her Tumblr blog, with her post, behind the
   player (it came after the post). It now comes before the post, so behind
   the player is her conversation with him, as the film leaves it, and the
   taskbar clock reads 11:48 PM (a minute after the film) instead of 11:49 PM.
   The player, the song, its cue and her pointer path are unchanged.
3. **The Tumblr post is the final statement, dated 8.11.2007, then STAY
   TUNED.** She types *i guess some people are just passing through.* exactly
   (lower-case, one sentence, a full stop) in the same title field, key by
   key at the same speed, and posts it. Her blog's day block reads `THU`
   `8.11.2007` (8 November 2007 was a Thursday), on one line: the block is a
   little tighter than the theme's month-and-day block so the weekday keeps
   its place. The post holds for 3.4 s while the camera moves in on it (as
   the first version's did; the move ends a little wider, so both lines of the
   statement stay in frame), then **STAY TUNED.** fills the screen on its own
   for 1.5 s, in her post title's type and pink on her blog's white: the look
   *stay tuned* had at the end of the first version.

Slide 3 grows from 8.9 s to 13.4 s: about 3.1 s for typing the longer
statement at her usual speed, and 1.5 s for STAY TUNED.

**There was no separate STAY TUNED. end card, glitch or ending sound before.**
In the first version, *stay tuned* was the post itself, and the slide ended on
the camera's move onto it; the carousel's only glitch is slide 1's opening.
STAY TUNED. is therefore a cut to its own frame after the post, with no new
transition or effect and no sound, set in the type and colours that *stay
tuned* had on the first version's last frame. The opening's glitch is
untouched.

Unchanged: the script, word for word (`tests/script.test.mjs`); the three
nudges; the song, its file and its cue (it starts on frame 78 of slide 2, when
Play turns to Pause); the 9:16 master; the IYS easter eggs.

## Points to note

- **Two dates.** The film's conversation is dated 23 August 2007 (its status
  line reads “Last message received at 11:47 PM on 8/23/2007.”, visible at the
  end of slide 1, at the start of slide 2 and at the start of slide 3, before
  the browser opens). Her post is now dated 8.11.2007, eleven weeks later. As
  asked, only the post's date was changed; the conversation's date and the
  slides' 11:47–11:48 PM clocks are as they were. If the post should read as
  the same night, the conversation's date (`DATE` in `src/story/cast.ts`) is
  the one place to change.

## The previous version (28 October): the collaborator's two voice notes

Two WhatsApp voice notes, in Egyptian Arabic with English words, were
transcribed locally (Whisper large-v3, four independent decodes that agree).
The recordings and transcripts are private and are not in this repository. In
short:

- **Note A (Tumblr):** what she writes in the Tumblr slide should say “stay
  tuned”, or something meaning that, so the post works as a teaser. The
  collaborator would think of the exact words and send them (now done: see
  above).
- **Note B (the opening):** start the post as if the computer turns on
  normally, today, then a glitch or a crash, then it opens onto the old
  Windows: a small introduction at the beginning.

What that version changed: slide 1 gained the opening; the Tumblr video was
redrawn on archived 2007 Tumblr (her dashboard of April 2007, Text, the form,
her blog in Tumblr's default theme of August 2007, in her pink); the player's
controls followed Microsoft's own WMP11 design page.

## The film inside slide 1

The 9:16 film is `HeroReel`. Slide 1 plays the same story (`REEL_CAROUSEL`
reuses the beats and pointer path), filmed by a camera planned for a 540 × 675
window of the screen. It is not a stretch or a blind crop of the 9:16 render.
The camera opens on her contact list (with the *fluffy pjoys* message), drops
to his sign-in toast, then holds the whole conversation window. It frames the
status line lower at the end, so “Last message received at 11:47 PM on
8/23/2007.” stays in the shorter frame. `tests/framing.test.mjs` checks, on
every frame, that what matters is inside the frame.

From the previous versions, still true: his messages are 8 % faster than in the
first cut (her rhythm is identical), the song and the “is listening to” popup
are out of the film, and there are three nudges: the original one between
“HELLOOOOO” and “ugh whatever”, and two after “no actually”, each with its own
click, shake, buzz and “You have just sent a nudge.” line.

## Every new word on screen

The film's script is unchanged. All other words are in code: `INTRO_TEXT`,
`TEASER_POST`, `STAY_TUNED`, `TUMBLR_TEXT`, `START_TEXT`, `PLAYER_TEXT` and
`TRACK`.

### Slide 1: the opening

| Where | Text |
| --- | --- |
| her XP desktop (the film's first frame) | the film's own words: the Messenger window, her name and personal message, her contacts, the desktop icons |
| the XP start-up | `welcome` |

### Slide 2: Windows Media Player 11

| Where | Text |
| --- | --- |
| behind the player | her conversation with him, as the film leaves it |
| Start menu | her account `nour` (her name, from her Messenger address, with her display picture), `Internet` / `Internet Explorer`, `E-mail` / `Outlook Express`, `MSN Messenger 7.5`, `Windows Media Player`, `All Programs`, `My Documents`, `My Recent Documents`, `My Pictures`, `My Music`, `My Computer`, `Control Panel`, `Help and Support`, `Search`, `Run...`, `Log Off`, `Turn Off Computer` |
| player chrome | `Windows Media Player`, tabs `Now Playing Library Rip Burn Sync`, `Music ▸ Library ▸ Songs`, `Search`, `Playlists`, `Create Playlist`, `Library`, `Recently Added Artist Album Songs Genre Year Rating`, columns `Album # Title Length Rating`, the time `00:00`… |
| track metadata | `When You’re Gone` · `Avril Lavigne` · album `The Best Damn Thing` · `2007` · track `5` · length `3:54` (what plays: the supplied file from its first note to its end), unrated |
| taskbar | `Windows Media Player`; clock `11:48 PM` |

The album tile is the player's own generic “no album art” note. No cover art
is used.

### Slide 3: Tumblr

What she types: `i guess some people are just passing through.` (the title;
the post has no body).

| Where | Text |
| --- | --- |
| window title | the address while the first page loads, then `Tumblr - Microsoft Internet Explorer`, then `~*nOuR*~ - Microsoft Internet Explorer` (her Messenger name) |
| IE 6 chrome | menus `File Edit View Favorites Tools Help`, buttons `Back`, `Search`, `Favorites`, `Address`, `Go`, `Links »`, status `Opening page http://….`, `Done`, zone `Internet` |
| addresses | `http://www.tumblr.com/dashboard`, `http://www.tumblr.com/new/text`, her blog `http://nour-xoxo-89.tumblr.com/` (her Messenger address `nour_xoxo_89`; a host name cannot contain `_`) |
| dashboard | wordmark `tumblr.`, links `nour-xoxo-89.tumblr.com «`, `Log out «`, `Help «`, tabs `Dashboard Feeds Settings Goodies`, `Add a new...`, `Text Photo Quote Link Chat Video`, side column `nour-xoxo-89`, `Change my photo` |
| the form | `Add a Text Post`, `Title (optional)`, `Post`, `Bold Italic Link`, `Create post`, `Cancel` |
| her blog | control `Dashboard`, title `~*nOuR*~`, badge `RSS`, day block `THU` `8.11.2007` (8 November 2007, a Thursday), footer `Powered by Tumblr` |
| the ending | `STAY TUNED.` |
| taskbar | clock `11:48 PM` |

There are no other people, posts, notes, reblogs, likes or tags, and no music.

## Period design

Everything is drawn in code, like the Messenger windows: no screenshots, logos
or artwork from Microsoft or Tumblr, and every icon is original. Which details
are documented by archived pages and which are reconstructions is set out,
item by item, in [`sources.md`](sources.md). In short:

- **Tumblr, 2007:** the dashboard frame, its links and tabs, “Add a new...”
  and the post types, and her blog's theme are documented (archived pages and
  screenshots of April–August 2007). The text-post form was never archived:
  it is reconstructed from the archived forms of the time. Pages are fitted to
  the narrow browser window.
- **Internet Explorer 6 on XP**, the default browser of a 2007 family PC:
  Luna frame, the menu bar with the flag “throbber” (it waves while a page
  loads), the Standard Buttons and Address bar, IE 6's always-visible vertical
  scrollbar, and the status bar with the green segmented progress bar. IE
  opens from the Quick Launch “Internet” icon already on her taskbar.
- **Windows Media Player 11 (late 2006, on XP):** the transport and status
  area follow Microsoft's design page; the rest is in its look: the black glass
  frame and tabs, Library ▸ Songs, Now Playing with bars computed from the
  song's own spectrum at each frame (`@remotion/media-utils`, using
  `when-youre-gone-analysis.wav`, only from the playback point onwards). The
  online-store tab of the time is left out.
- **XP Start menu (Luna):** the blue header with picture and account name, the
  white programs column, the pale-blue places column and the Log Off / Turn
  Off bar. While WMP starts, the pointer shows the “working in background”
  hourglass.
- **The opening:** her XP desktop is the film's own; the XP loading bar and
  “welcome” screen are reconstructions from memory, without Microsoft's logo.
- **Fonts:** Tahoma (Wine's metric-compatible build) for every Windows
  control, Arial-metric Arimo on the Tumblr pages (and STAY TUNED.),
  Georgia-metric Gelasio for their Georgia headings, Archivo Black for the
  theme's Arial Black title, and Fira Sans for the “welcome”. See
  `public/fonts/README.md`.

## Sound

- Slide 1: the opening's four original sounds (a soft swell as the screen
  lights, the glitch, the crash, the old monitor's degauss), then the film's
  own sounds (chimes, keys, clicks, the three nudge buzzes). No song.
- Slide 2: clicks, then the song from the Play frame on. See
  `public/music/README.md` for the cue, the import and the rights note.
- Slide 3: clicks and her key clicks; STAY TUNED. is silent. No music.
