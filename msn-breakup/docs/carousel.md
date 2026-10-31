# The Instagram carousel

Three videos, posted together as one carousel. All three are 4:5 (1080 × 1350),
30 fps, H.264 + AAC. `npm run render:carousel` puts them in
`out/instagram-carousel-final-v2/`, with a cover per slide, one contact sheet,
the cue sheet and the ordered manifest (`MANIFEST.md`, `manifest.json`).
Slides 1 and 3 are rendered; slide 2 is the approved clean master, copied
byte for byte (its SHA-256 is checked). The earlier folders,
`out/instagram-carousel/` and `out/instagram-carousel-final/`, are never
written to by this version.

| # | File | Composition | Length | What happens |
| - | - | - | - | - |
| 1 | `01-msn-breakup-present-to-2007-final.mp4` | `BreakupCarousel` | 39.8 s | A present-day Windows desktop glitches, and the Windows XP desktop of 2007 takes over (4.8 s). Then the film: he dumps her on MSN, she spirals, three nudges. |
| 2 | `02-music-player-final-clean.mp4` | `MusicPlayerBreakup` | 12.8 s | She opens Windows Media Player and puts on “When You’re Gone” (clean: the song is added by hand, its first note at 0:02.6). |
| 3 | `03-tumblr-published-stay-tuned-final.mp4` | `TumblrBreakup` | 15.8 s | On 2007 Tumblr she writes one post, *i guess some people are just passing through.*, a blank line, **STAY TUNED.**, and publishes it, dated 8.11.2007. It ends on the published post. |

Also rendered: the 9:16 master of the film, `out/msn-breakup-reel.mp4`
(`HeroReel`, 1080 × 1920, without the opening).

All three are 4:5, so the app neither letterboxes nor crops them, and each is
under Instagram's 60 s limit for a carousel video.

## The final surgical corrections (31 October 2026)

The collaborator reviewed the three exported videos and asked for exactly
three changes. Nothing else was redesigned.

1. **Slide 1 opens in the present, and a glitch takes it back to 2007.** The
   opening (still 4.8 s, so the film starts on frame 144 as before) is now:
   - **NOW (0–1.75 s):** a clean Windows desktop of 2026: a browser open on a
     new tab, the centred taskbar (start, search, files, the browser in use,
     mail), the weather, the tray and the clock at 11:47 PM 8/23/2026 (the
     minute of her last message, nineteen years later), two desktop icons,
     the mouse pointer. Desktop proportions and furniture: overlapping
     layers, window controls, a taskbar; nothing of a phone. The pointer
     crosses to the search box, stalls once on the way, and stops exactly
     where the film's pointer is on its first frame.
   - **The first signs (1.75–2.2 s):** the pointer twitches, bands of the
     picture slip sideways, the colours begin to fringe.
   - **The glitch (2.2–3.1 s, with the glitch sound):** the picture jumps
     (frame displacement), freezes for four frames (where the sound drops
     out), the colours split, bands tear sideways, blocks break up like a
     damaged video (some in big square pixels), thin lines and a band of
     noise race across. Through the cracks the old system shows: the 2007
     screen in the holes, then band by band, until it is all that is left.
     The same family as the approved glitch (its split, torn bands, noise
     colours and scanlines). Intense, never a strobe: each part of the picture
     turns old once, the big shapes change ten times a second, one brightness
     pop; `npm run qa` measures it against the general-flash limit (WCAG 2.3.1).
   - **THEN (3.1–4.8 s, with the degauss sound):** the Windows XP desktop takes
     over: the old monitor degausses (the picture wobbles, its colours swim)
     and settles on the film's first frame, with the old pointer where the new
     one stopped. The film follows on frame 144, unchanged.

   Gone from the opening: its previous first screen (her XP desktop, glitching
   on itself), the crash to black, the XP loading bar and the “welcome” screen
   (and, from the first version, the lock screen that read as a phone).
2. **The music player is not touched.** Slide 2 is the approved clean master
   (`02-music-player-final-clean.mp4`, SHA-256
   `25e234d95ce31c03baaf1a0f6c128a956244a56ae0934b912b4b511dc17ee768`), copied
   byte for byte; its composition was not changed. No song was added: the
   collaborator adds “When You’re Gone” by hand, its first note on 0:02.6,
   the frame Play turns to Pause. Without a song file, QA skips the song
   checks instead of failing them.
3. **STAY TUNED. is inside her Tumblr post.** She clicks the Post box (where she
   clicked the Title box before; everything up to her first key is as
   approved) and types *i guess some people are just passing through.* with
   the same rhythm, key for key. She stops (0.8 s, the caret blinking),
   presses Enter twice (a blank line, two key sounds) and types **STAY
   TUNED.** Both lines sit together in the editor; she clicks Create post as
   before. Her blog shows the one post, dated `THU` `8.11.2007`: her sentence
   on two lines, a blank line, STAY TUNED., all in her post type (bold, her
   pink: the type her post has always had here). The camera moves in on it as
   before and stays on it to the last frame. The separate STAY TUNED. card is
   gone: no overlay, no floating text, no second post.

Slide 3 grows from 13.4 s to 15.8 s, only by what she now types (the pause,
the blank line, 11 keys); the published post stays on screen 4.9 s, as long
as the post and the old card did together.

**The Tumblr video never had a glitch.** Its old ending was a hard cut to the
STAY TUNED. card, with no effect and no sound; that card is removed, and no
new effect was added to the Tumblr video.

Unchanged: the script, word for word (`tests/script.test.mjs`); the three
nudges; the film after the opening; the music player; the 9:16 master; the
IYS easter eggs.

## The earlier corrections (31 October 2026, commit `aabe785`)

The order became the breakup, the song, then Tumblr (one list,
`scripts/carousel-list.mjs`, read by every script); behind the player is her
conversation with him and the clock reads 11:48 PM; her post became the final
statement, dated 8.11.2007 (`THU` in the day block, the date on one line).

## Points to note

- **Two dates.** The film's conversation is dated 23 August 2007 (its status
  line reads “Last message received at 11:47 PM on 8/23/2007.”, visible at the
  end of slide 1, at the start of slide 2 and at the start of slide 3, before
  the browser opens). Her post is now dated 8.11.2007, eleven weeks later. As
  asked, only the post's date was changed; the conversation's date and the
  slides' 11:47–11:48 PM clocks are as they were. If the post should read as
  the same night, the conversation's date (`DATE` in `src/story/cast.ts`) is
  the one place to change.

## The version of 28 October: the collaborator's two voice notes

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
  Windows: a small introduction at the beginning (the opening above is this,
  as the final brief describes it).

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
`TEASER_POST` (`STATEMENT`, `STAY_TUNED`), `TUMBLR_TEXT`, `START_TEXT`,
`PLAYER_TEXT` and `TRACK`.

### Slide 1: the opening

| Where | Text |
| --- | --- |
| the present-day desktop | icons `Recycle Bin`, `Documents` |
| the browser | tab `New tab`, address bar `Search or type a web address`, search box `Search the web`, shortcuts `Mail Maps Music Photos Docs Weather` |
| the taskbar | weather `64°F` `Clear`, `Search`, clock `11:47 PM` `8/23/2026` |
| her XP desktop (the film's first frame) | the film's own words: the Messenger window, her name and personal message, her contacts, the desktop icons |

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

What she types, in the Post box (the post has no title):
`i guess some people are just passing through.`, Enter, Enter, `STAY TUNED.`

| Where | Text |
| --- | --- |
| window title | the address while the first page loads, then `Tumblr - Microsoft Internet Explorer`, then `~*nOuR*~ - Microsoft Internet Explorer` (her Messenger name) |
| IE 6 chrome | menus `File Edit View Favorites Tools Help`, buttons `Back`, `Search`, `Favorites`, `Address`, `Go`, `Links »`, status `Opening page http://….`, `Done`, zone `Internet` |
| addresses | `http://www.tumblr.com/dashboard`, `http://www.tumblr.com/new/text`, her blog `http://nour-xoxo-89.tumblr.com/` (her Messenger address `nour_xoxo_89`; a host name cannot contain `_`) |
| dashboard | wordmark `tumblr.`, links `nour-xoxo-89.tumblr.com «`, `Log out «`, `Help «`, tabs `Dashboard Feeds Settings Goodies`, `Add a new...`, `Text Photo Quote Link Chat Video`, side column `nour-xoxo-89`, `Change my photo` |
| the form | `Add a Text Post`, `Title (optional)`, `Post`, `Bold Italic Link`, `Create post`, `Cancel` |
| her blog | control `Dashboard`, title `~*nOuR*~`, badge `RSS`, day block `THU` `8.11.2007` (8 November 2007, a Thursday), footer `Powered by Tumblr` |
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
- **The opening:** the present-day desktop is an original drawing in today's
  Windows style (rounded windows, the centred taskbar, the tray clock), with
  no Microsoft logo or artwork; her XP desktop is the film's own.
- **Fonts:** Tahoma (Wine's metric-compatible build) for every Windows
  control, Arial-metric Arimo on the Tumblr pages, Georgia-metric Gelasio for
  their Georgia headings, Archivo Black for the theme's Arial Black title, and
  Inter for the present-day desktop (standing in for today's Segoe UI). See
  `public/fonts/README.md`.

## Sound

- Slide 1: the opening's two original sounds (the glitch, 0.9 s, exactly as
  long as the glitch; the old monitor's degauss as XP takes over), then the
  film's own sounds (chimes, keys, clicks, the three nudge buzzes). No song.
- Slide 2 (unchanged, clean): clicks. The song is added by hand from the Play
  frame on; see `public/music/README.md` for the cue and the rights note.
- Slide 3: clicks, her key clicks and her two Enters. No music.
