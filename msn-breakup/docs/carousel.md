# The Instagram carousel

Three videos, posted together as one carousel. All three are 4:5 (1080 × 1350),
30 fps, H.264 + AAC. `npm run render:carousel` renders them into
`out/instagram-carousel/`, with a cover per slide, one contact sheet and the
ordered manifest (`MANIFEST.md`, `manifest.json`).

| # | File | Composition | Length | What happens |
| - | - | - | - | - |
| 1 | `01-msn-breakup-carousel.mp4` | `BreakupCarousel` | 39.8 s | Today's computer glitches, crashes and starts up as old Windows (4.8 s). Then the film: he dumps her on MSN, she spirals, three nudges. |
| 2 | `02-tumblr-breakup-post.mp4` | `TumblrBreakup` | 8.9 s | A minute later, on 2007 Tumblr, she posts the teaser: *stay tuned*. |
| 3 | `03-when-youre-gone-music-player.mp4` | `MusicPlayerBreakup` | 12.8 s | Then she puts on “When You’re Gone”. |

Also rendered: `03-…-clean.mp4` (slide 3 without the song, see
[the music README](../public/music/README.md)) and the 9:16 master of the film,
`out/msn-breakup-reel.mp4` (`HeroReel`, 1080 × 1920, without the opening).

All three are 4:5, so the app neither letterboxes nor crops them, and each is
under Instagram's 60 s limit for a carousel video.

## This version's brief: the collaborator's two voice notes

Two WhatsApp voice notes, in Egyptian Arabic with English words, were
transcribed locally (Whisper large-v3, four independent decodes that agree).
The recordings and transcripts are private and are not in this repository. In
short:

- **Note A (Tumblr):** what she writes in the Tumblr slide should say “stay
  tuned”, or something meaning that, so the post works as a teaser. The
  collaborator will think of the exact words and send them.
- **Note B (the opening):** start the post as if the computer turns on
  normally, today, then a glitch or a crash, then it opens onto the old
  Windows: a small introduction at the beginning.

## What changed (and nothing else)

1. **Slide 1 opens with the introduction** (note B, 4.8 s, `src/Intro.tsx`,
   timings in `src/story/intro.ts`). A present-day lock screen comes up (the
   clock reads 11:47, the film's minute, nineteen years later). It glitches,
   harder and harder, and crashes: the picture squeezes to a line and a dot,
   like an old monitor switching off. Black. The old monitor comes on (a
   degauss thunk), the XP loading bar runs, black again, the XP “welcome”
   screen, and her XP desktop fades in: the film's first frame. The film then
   plays exactly as before, 4.8 s later. The opening is generic: no vendor's
   logo or wallpaper, no Microsoft logo or start-up sound.
2. **Slide 2's post is the teaser** (note A). She types *stay tuned*, the
   collaborator's own words, as a title-only text post (Tumblr's 2007 API
   took a text post with a title, a body or both). The post's words live in
   one place, `TEASER_POST` in `src/story/tumblr.ts`: when the final wording
   arrives, change it there and the typing, the cues, the camera and both
   slides that show her blog follow.
3. **Slide 2 is redrawn on archived 2007 Tumblr.** She now opens on her
   dashboard (the dashboard of April 2007: navy frame, tabs, “Add a new...”
   and the six post types), clicks Text, writes the post, and her blog shows
   it in Tumblr's default theme of August 2007, in her pink.
4. **Slide 3's controls follow Microsoft's own WMP11 design page:** plain
   shuffle, repeat and stop, previous and next in one capsule around Play, and
   the status area on one line (thumbnail, title, time). Play is where it
   was, so the sync checks are unchanged.

Unchanged: the script, word for word (`tests/script.test.mjs`); the three
nudges; the song, its file and its cue (it starts on frame 78 of slide 3,
when Play turns to Pause); the order of the slides; the 9:16 master.

## Open points

- **The final Tumblr wording.** The collaborator said she would send it.
  Until then the post reads *stay tuned* (her words in the voice note), and
  `TEASER_POST.final` is `false`.
- **The teaser is slide 2 of 3.** If the teaser should be the last thing
  people see, slides 2 and 3 could swap. This was not asked for, so the order
  is unchanged.

## The film inside slide 1

The 9:16 film is `HeroReel`. Slide 1 plays the same story (`REEL_CAROUSEL`
reuses the beats and pointer path), filmed by a camera planned for a 540 × 675
window of the screen. It is not a stretch or a blind crop of the 9:16 render.
The camera opens on her contact list (with the *fluffy pjoys* message), drops
to his sign-in toast, then holds the whole conversation window. It frames the
status line lower at the end, so “Last message received at 11:47 PM on
8/23/2007.” stays in the shorter frame. `tests/framing.test.mjs` checks, on
every frame, that what matters is inside the frame.

From the previous version, still true: his messages are 8 % faster than in the
first cut (her rhythm is identical), the song and the “is listening to” popup
are out of the film, and there are three nudges: the original one between
“HELLOOOOO” and “ugh whatever”, and two after “no actually”, each with its own
click, shake, buzz and “You have just sent a nudge.” line.

## Every new word on screen

The film's script is unchanged. All other words are in code: `INTRO_TEXT`,
`TEASER_POST`, `TUMBLR_TEXT`, `START_TEXT`, `PLAYER_TEXT` and `TRACK`.

### Slide 1: the opening

| Where | Text |
| --- | --- |
| today's lock screen | `11:47`, `Wednesday, October 28` (the day the opening was asked for) |
| the XP start-up | `welcome` |

### Slide 2: Tumblr

What she types: `stay tuned` (the title; the post has no body).

| Where | Text |
| --- | --- |
| window title | the address while the first page loads, then `Tumblr - Microsoft Internet Explorer`, then `~*nOuR*~ - Microsoft Internet Explorer` (her Messenger name) |
| IE 6 chrome | menus `File Edit View Favorites Tools Help`, buttons `Back`, `Search`, `Favorites`, `Address`, `Go`, `Links »`, status `Opening page http://….`, `Done`, zone `Internet` |
| addresses | `http://www.tumblr.com/dashboard`, `http://www.tumblr.com/new/text`, her blog `http://nour-xoxo-89.tumblr.com/` (her Messenger address `nour_xoxo_89`; a host name cannot contain `_`) |
| dashboard | wordmark `tumblr.`, links `nour-xoxo-89.tumblr.com «`, `Log out «`, `Help «`, tabs `Dashboard Feeds Settings Goodies`, `Add a new...`, `Text Photo Quote Link Chat Video`, side column `nour-xoxo-89`, `Change my photo` |
| the form | `Add a Text Post`, `Title (optional)`, `Post`, `Bold Italic Link`, `Create post`, `Cancel` |
| her blog | control `Dashboard`, title `~*nOuR*~`, badge `RSS`, day block `THU` `AUG` `23RD` (the film's date, a Thursday), footer `Powered by Tumblr` |
| taskbar | clock `11:48 PM` (a minute after the film) |

There are no other people, posts, notes, reblogs, likes or tags, and no music.

### Slide 3: Windows Media Player 11

| Where | Text |
| --- | --- |
| Start menu | her account `nour` (her name, from her Messenger address, with her display picture), `Internet` / `Internet Explorer`, `E-mail` / `Outlook Express`, `MSN Messenger 7.5`, `Windows Media Player`, `All Programs`, `My Documents`, `My Recent Documents`, `My Pictures`, `My Music`, `My Computer`, `Control Panel`, `Help and Support`, `Search`, `Run...`, `Log Off`, `Turn Off Computer` |
| player chrome | `Windows Media Player`, tabs `Now Playing Library Rip Burn Sync`, `Music ▸ Library ▸ Songs`, `Search`, `Playlists`, `Create Playlist`, `Library`, `Recently Added Artist Album Songs Genre Year Rating`, columns `Album # Title Length Rating`, the time `00:00`… |
| track metadata | `When You’re Gone` · `Avril Lavigne` · album `The Best Damn Thing` · `2007` · track `5` · length `3:54` (what plays: the supplied file from its first note to its end), unrated |
| taskbar | `Windows Media Player`; clock `11:49 PM` |

The album tile is the player's own generic “no album art” note. No cover art
is used.

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
- **The opening:** today's screen is generic; the XP loading bar and
  “welcome” screen are reconstructions from memory, without Microsoft's logo.
- **Fonts:** Tahoma (Wine's metric-compatible build) for every Windows
  control, Arial-metric Arimo on the Tumblr pages, Georgia-metric Gelasio for
  their Georgia headings, Archivo Black for the theme's Arial Black title, and
  Fira Sans for today's clock and the “welcome”. See `public/fonts/README.md`.

## Sound

- Slide 1: the opening's four original sounds (a soft swell as the screen
  lights, the glitch, the crash, the old monitor's degauss), then the film's
  own sounds (chimes, keys, clicks, the three nudge buzzes). No song.
- Slide 2: clicks and her key clicks. No music.
- Slide 3: clicks, then the song from the Play frame on. See
  `public/music/README.md` for the cue, the import and the rights note.
