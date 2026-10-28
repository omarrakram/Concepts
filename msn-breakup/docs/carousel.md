# The Instagram carousel

Three videos, posted together as one carousel. All three are 4:5 (1080 × 1350),
30 fps, H.264 + AAC. `npm run render:carousel` renders them into
`out/instagram-carousel/`, with a cover per slide, one contact sheet and the
ordered manifest (`MANIFEST.md`, `manifest.json`).

| # | File | Composition | Length | What happens |
| - | - | - | - | - |
| 1 | `01-msn-breakup-carousel.mp4` | `BreakupCarousel` | 35.0 s | The film: he dumps her on MSN, she spirals, three nudges. |
| 2 | `02-tumblr-breakup-post.mp4` | `TumblrBreakup` | 10.0 s | A minute later she posts about it on Tumblr. |
| 3 | `03-when-youre-gone-music-player.mp4` | `MusicPlayerBreakup` | 12.8 s | Then she puts on “When You’re Gone”. |

Also rendered: `03-…-clean.mp4` (slide 3 without the song, see
[the music README](../public/music/README.md)) and the 9:16 master of the film,
`out/msn-breakup-reel.mp4` (`HeroReel`, 1080 × 1920).

The first slide sets the carousel's shape. All three are 4:5, so none of them
is letterboxed or cropped by the app. Each video is under Instagram's 60 s
limit for a carousel video.

## What changed (and nothing else)

1. **Tumblr is its own video** (slide 2). Nothing was added to the film for it.
2. **The song is its own video** (slide 3). The film loses the “karim is
   listening to” popup at 21.3 s, the ♫ line that replaced his personal message
   in her contact list and the To: line, and the song cue. His personal message
   stays “busy w/ life” all film. The unrelated “karim has just signed in”
   toast is kept, and so is the whole notification system: the toast component
   still renders the first cut (`HeroReelOriginal`).
3. **His messages are 8 % faster.** His five lines arrive 8 % sooner after the
   window opens, and his “is typing a message.” notices are 8 % shorter. The
   words are identical. Everything after “bye x” moves 0.56 s earlier with
   him: the same silence, then all of her lines and the original nudge, each
   at exactly its first-cut spacing. Her keystroke rhythm and key sounds are
   identical too (each moved line keeps its first-cut seed, `orig`).
4. **Three nudges.** The original one stays at its place, between “HELLOOOOO”
   and “ugh whatever” (now 24.79 s, i.e. 25.35 s − 0.56 s). After her last
   line, “no actually” (30.12 s), she waits about a second, then nudges at
   31.30 s, waits again, and nudges at 32.65 s. Each nudge has its own click
   on the nudge button, its own shake (0.85 s), buzz (0.95 s) and “You have
   just sent a nudge.” line. The second nudge's shake ends 0.5 s, and its
   buzz 0.4 s, before the third click. The film grows from 33 s to 35 s, so the last nudge can
   land and be left unanswered. Nothing of hers is cut or sped up.

The 9:16 film is `HeroReel`. Slide 1 is the same story (`REEL_CAROUSEL`
reuses the beats and pointer path), filmed by a camera planned for a 540 × 675
window of the screen. It is not a stretch or a blind crop of the 9:16 render.
The camera opens on her contact list (with the *fluffy pjoys* message), drops
to his sign-in toast, then holds the whole conversation window. It frames the
status line lower at the end, so “Last message received at 11:47 PM on
8/23/2007.” stays in the shorter frame. `tests/framing.test.mjs` checks, on
every frame, that what matters is inside the frame: the line she is typing,
the newest message, the nudge button at each nudge, and the status line.

## Every new word on screen

The film's script is unchanged, word for word (`tests/script.test.mjs`). The
two new videos add only the text below. All of it is in code, in
`TUMBLR_TEXT`, `START_TEXT`, `PLAYER_TEXT` and `TRACK`.

### Slide 2: Tumblr

Her post is three of her own lines from the film, verbatim and in their
original order, typed at the rhythm she typed them in the film:

- Title: `did u seriously just dump me on msn??`
- Post: `i hate u` / `…` / `i miss u` (one per line)

Everything else is browser and Tumblr furniture:

| Where | Text |
| --- | --- |
| window title | `Tumblr - Microsoft Internet Explorer`, then `~*nOuR*~ - Microsoft Internet Explorer` (her Messenger name). While the first page loads, IE shows its address. |
| IE 6 chrome | menus `File Edit View Favorites Tools Help`, buttons `Back`, `Search`, `Favorites`, `Address`, `Go`, `Links »`, status `Opening page http://….`, `Done`, zone `Internet` |
| addresses | `http://www.tumblr.com/new/text`; her blog `http://nour-xoxo-89.tumblr.com/` (her Messenger address `nour_xoxo_89`; a host name cannot contain `_`) |
| Tumblr | wordmark `tumblr.`, links `Dashboard`, `Log out`, post types `Text Photo Quote Link Chat Video`, labels `Title (optional)`, `Post`, button `Create post` |
| her blog | title `~*nOuR*~`, date `August 23, 2007` (the film's date), footer `Powered by Tumblr` |
| taskbar | clock `11:48 PM` (a minute after the film) |

There are no other people, posts, notes, reblogs, likes or tags, and no music.

### Slide 3: Windows Media Player 11

| Where | Text |
| --- | --- |
| Start menu | her account `nour` (her name, from her Messenger address, with her display picture), `Internet` / `Internet Explorer`, `E-mail` / `Outlook Express`, `MSN Messenger 7.5`, `Windows Media Player`, `All Programs`, `My Documents`, `My Recent Documents`, `My Pictures`, `My Music`, `My Computer`, `Control Panel`, `Help and Support`, `Search`, `Run...`, `Log Off`, `Turn Off Computer` |
| player chrome | `Windows Media Player`, tabs `Now Playing Library Rip Burn Sync`, `Music ▸ Library ▸ Songs`, `Search`, `Playlists`, `Create Playlist`, `Library`, `Recently Added Artist Album Songs Genre Year Rating`, columns `Album # Title Length Rating`, status `Playing`, time `00:00`… |
| track metadata | `When You’re Gone` · `Avril Lavigne` · album `The Best Damn Thing` · `2007` · track `5` · length `3:54` (what plays: the supplied file from its first note to its end), unrated |
| taskbar | `Windows Media Player`; clock `11:49 PM` |

The album tile is the player's own generic “no album art” note. No cover art
is used.

## Period design: what is drawn, and how sure it is

Everything is drawn in code, like the Messenger windows. There are no
screenshots, logos or artwork from Microsoft or Tumblr, and all icons are
original.

- **Internet Explorer 6 on XP**, the default browser of a 2007 family PC: Luna
  frame, the menu bar with the flag “throbber” (it waves while a page loads),
  the Standard Buttons and Address bar, IE 6's always-visible vertical
  scrollbar, and the status bar with the green segmented progress bar. IE
  opens from the Quick Launch “Internet” icon that is already on her taskbar
  in the film.
- **Tumblr, 2007:** a simplified, plausible period design, not a reproduction.
  The slate-blue page, the post-type row, the plain Title/Post form and the
  “Create post” button follow how the service looked then, as far as it can be
  recalled. Archived pages could not be checked: archive.org and tumblr.com
  were not reachable from the build environment. So no detail here should be
  read as documented fact. The wordmark is set in a plain bold face, not the
  logo. After “Create post” the video cuts to her blog (the brief asks to see
  the post there). The real service may have returned to the dashboard first.
  Her blog uses a plain Georgia-style theme in her pink.
- **Windows Media Player 11 (late 2006, on XP):** one player, one generation.
  It has the black glass frame and tabs, Library ▸ Songs with the navigation
  pane and album grouping, the transport bar with the large round Play button
  (Pause while playing), the seek bar, time, volume and compact-mode button,
  and Now Playing with a bar visualisation and its list pane. The online-store
  tab of the time is left out. The bars come from the song's spectrum at each
  frame (`@remotion/media-utils`, using `when-youre-gone-analysis.wav`). They
  only read audio from the playback point onwards.
- **XP Start menu (Luna):** the blue header with picture and account name, the
  white programs column, the pale-blue places column and the Log Off / Turn
  Off bar. While WMP starts, the pointer shows the “working in background”
  hourglass.
- **Fonts:** Tahoma (Wine's metric-compatible build) for every Windows
  control, Arial-metric Arimo inside the Tumblr form, and Georgia-metric
  Gelasio for her blog. See `public/fonts/README.md`.

## Sound

- Slide 1: the film's own sounds only (chimes, keys, clicks, the three nudge
  buzzes). No song.
- Slide 2: clicks and her key clicks (the same samples per line as in the
  film). No music.
- Slide 3: clicks, then the song from the Play frame on. See
  `public/music/README.md` for the cue, the import and the rights note.
