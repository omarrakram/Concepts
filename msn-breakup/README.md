# MSN breakup: a 2007 nostalgia reel and Instagram carousel

A present-day Windows desktop, 11:47 PM. The pointer stops; the picture
glitches; through the cracks the old system shows, and the Windows XP desktop
of 2007 takes over. It's 11:47 PM on 8.11.2007, with MSN Messenger 7.5
open. karim dumps ~\*nOuR\*~ in five lines, then goes quiet. She spirals,
nudges him, says “no actually”, and nudges him twice more. Nothing. She opens
Windows Media Player and plays “When You’re Gone” by Avril Lavigne. Then, on
Tumblr, she writes and publishes one post, dated 8.11.2007: *i guess some
people are just passing through.*, a blank line, **STAY TUNED.**

This is a standalone Remotion project. Every pixel is code: the Luna window
chrome, the Messenger windows, Internet Explorer, the Tumblr pages, the Start
menu, Windows Media Player, the emoticons, the Bliss-style hills, the taskbar.
There are no screenshots, no Microsoft or Tumblr image assets and no Microsoft
sounds. Each frame is a pure function of time, so renders are deterministic.

## Deliverables

| Output | Size | Length | Command |
| --- | --- | --- | --- |
| `out/instagram-carousel-final-v3/01-msn-breakup-present-to-2007-final.mp4` (slide 1: the present-day opening, then the film, 4:5) | 1080 × 1350, 30 fps, H.264 + AAC | 39.8 s | `npm run render:carousel:film` |
| `out/instagram-carousel-final-v3/02-music-player-final.mp4` (slide 2: the music player, with the song) | 1080 × 1350, 30 fps | 12.8 s | `npm run render:carousel:player` (needs the song imported) |
| `out/instagram-carousel-final-v3/02-music-player-final-clean.mp4` (slide 2 without the song) | 1080 × 1350, 30 fps | 12.8 s | (same) |
| `out/instagram-carousel-final-v3/03-tumblr-published-stay-tuned-final.mp4` (slide 3: her Tumblr post, STAY TUNED. in it) | 1080 × 1350, 30 fps | 15.8 s | `npm run render:carousel:tumblr` |
| `out/instagram-carousel-final-v3/covers/`, `contact-sheet.png`, `MANIFEST.md`, `manifest.json`, `CUES.txt` | | | `npm run render:carousel` (all of the above) |
| `out/msn-breakup-reel.mp4` (the film, 9:16 master) | 1080 × 1920, 30 fps | 35.0 s | `npm run render:reel` |
| `out/msn-breakup-teaser.mp4` (teaser, unchanged) | 1080 × 1920, 30 fps | 7.0 s | `npm run render:teaser` |
| `out/stills/01…05-*.png`, `06-bonus-sign-in.png` (stills, unchanged) | 1080 × 1350 | 6 stills | `npm run render:stills` |
| `out/msn-breakup-reel-first-cut.mp4` (the film as first released, for A/B) | 1080 × 1920 | 33.0 s | `npm run render:reel:first-cut` |

`out/` is gitignored. Rendering recreates it. A render never silently replaces
an earlier file: if the output exists and no copy is archived yet,
`scripts/render.mjs` first copies it to `out/archive/previous/`. The first
release's renders and their SHA-256 sums are kept in
`out/archive/original-38f0d3a/`, the approved carousel before the final
corrections in `out/archive/approved-ad78f3f/`, the approved set before the
present-day opening in `out/archive/approved-aabe785/`, the set delivered
before the dates and the song in `out/archive/delivered-41262e8/` (each with
its `NOTE.md`), and the final carousel goes to its own folder,
`out/instagram-carousel-final-v3/` (the earlier ones are left as they were).

How the carousel fits together (the voice-note brief, order, every new word
on screen, the period design notes): [`docs/carousel.md`](docs/carousel.md).
What the 2007 screens are based on, archived or reconstructed:
[`docs/sources.md`](docs/sources.md).

## Run it

Requires Node 20 or newer, and ffmpeg/ffprobe for the song import and QA.

```bash
cd msn-breakup
npm install
npm run import:song -- <your file>   # the song, into the gitignored public/music/ (see below)
npm run dev                  # Remotion Studio: scrub, preview, tweak props
npm run render:reel          # → out/msn-breakup-reel.mp4               (9:16 master)
npm run render:carousel      # → out/instagram-carousel-final-v3/ (3 videos + slide 2's clean export, covers, sheet, manifest)
npm run render:carousel:film | :player | :tumblr   # one slide (1, 2, 3)
npm run render:teaser        # → out/msn-breakup-teaser.mp4
npm run render:stills        # → out/stills/*.png
npm run render:all           # all of the above
npm run cues                 # cue sheet: every beat of every video as time, frame and SMPTE
npm test                     # script, timing, nudges, music, opening, Tumblr, player, carousel, framing
npm run qa                   # typecheck + tests + checks of the rendered files (sync, black/frozen frames, audio…)
npm run qa:regression        # re-renders the teaser, the first cut and the stills; byte-compares with the archive
npm run sfx                  # (re)generate the original sound effects (already committed)
```

Remotion renders with Chrome Headless Shell. If
`/opt/pw-browsers/chromium_headless_shell-*` exists, `remotion.config.ts` uses
it. `REMOTION_BROWSER=/path/to/chrome` overrides that. Otherwise Remotion
downloads its own on the first render. Video settings: JPEG frames at quality
94 and limited-range yuv420p in BT.709 (in the config), plus CRF 17 (passed by
`scripts/render.mjs`). Social platforms re-encode anyway, so this masters
high. Audio is AAC-LC, 48 kHz stereo.

## The song

“When You’re Gone” is **not** in this repo, and no file pretends to be it.
`npm run import:song -- <file>` copies the audio of the file you supply,
untouched, into the gitignored `public/music/`. It plays in one place only:
slide 2, from the frame on which Play turns to Pause (**frame 78 =
00:00:02.600**). The film has no music. Slide 2 is rendered with the song
(`render:carousel` stops if it is not imported); its clean export has no song.
Without a song file, `npm run qa` skips the song checks; it does not fail
them. The cue, the clean export and the rights note are in
[`public/music/README.md`](public/music/README.md).

## Story

### Slide 1's opening (BreakupCarousel, 0–4.8 s)

| Time | Beat |
| --- | --- |
| 0.0–1.45 | **NOW.** A present-day Windows desktop: a browser open on a new tab, the centred taskbar, the tray clock at 11:47 PM on 8.11.2027, the desktop icons. The pointer crosses to the search box (it stalls once on the way) and stops. |
| 1.75–2.2 | The first signs: the pointer twitches, bands of the picture slip sideways, the colours fringe. |
| 2.2–3.1 | **The glitch** (its sound): the picture jumps, freezes for four frames, the colours split, bands tear, blocks break up like a damaged video. Through the cracks the 2007 screen shows, band by band, until it is all that is left. |
| 3.1–3.75 | **THEN.** The Windows XP desktop takes over: the old monitor degausses (its thunk and hum), the picture wobbles and settles. |
| 3.75–4.8 | Her XP desktop, still: the film's first frame, the old pointer where the new one stopped. The film begins on frame 144, as before. |

### The film (HeroReel 9:16 · BreakupCarousel 4:5, 35 s; in slide 1 it starts at 4.8 s)

| Time | Beat |
| --- | --- |
| 0.0–1.8 | Her XP desktop, 11:47 PM. Toast: *karim has just signed in.* The conversation window opens. |
| 1.1–7.5 | **The breakup.** *karim is typing a message.* comes before each line. His five lines arrive, each with a chime. |
| 7.5–9.3 | **Silence.** Her pointer drifts to the input box and clicks. |
| 9.3–20.1 | **Her spiral.** 14 lines typed live, key by key, in bursts that speed up and then collapse into “…”. The camera pushes in and the history auto-scrolls. |
| 20.1–24.4 | The camera pulls back. “i miss u”, “can we talk”, “HELLOOOOO”… |
| 24.8 | …and she **nudges** him. The window shakes and the buzz plays. |
| 26.0–30.1 | “ugh whatever”, “brb crying”, “jk”, “no actually”. |
| 31.3 · 32.7 | A beat, then **nudge**. Another beat, the camera leans in, **nudge**. |
| 32.7–35.0 | No answer. |

### Slide 2: When You’re Gone (MusicPlayerBreakup, 12.8 s)

Her conversation with him is still on screen. Start → Windows Media Player.
In Library ▸ Songs she selects “When You’re Gone” by Avril Lavigne and
presses Play. On that frame the button turns to Pause, the time reads 00:00
and the song begins on its first note. She switches to Now Playing. The bars
move with the music, through the first sung line.

### Slide 3: her Tumblr post (TumblrBreakup, 15.8 s)

She clicks the Quick Launch “Internet” icon. Internet Explorer opens on her
Tumblr dashboard. She clicks **Text**, clicks the Post box and types *i guess
some people are just passing through.*, stops for a moment, presses Enter
twice and types **STAY TUNED.** (the post, `TEASER_POST` in
`src/story/tumblr.ts`). Both lines sit in the editor; she clicks **Create
post**. Her blog shows the one post, dated `THU` `8.11.2007`: her sentence, a
blank line, STAY TUNED., in her pink. The camera moves in on it and the video
ends on that post. There is no separate end card.

The teaser (7 s, unchanged) is the hook: the sign-in, “hey… sry but i think
we shud break up :(”, “bye x”, “did u seriously just dump me on msn??”,
“HELLOOOOO” and a nudge.

The lines are word for word from the brief. The timings, camera and pointer
paths are data in `src/story/`. Run `npm run cues` for the full sheet.

## Structure

```
msn-breakup/
├─ src/
│  ├─ index.ts, Root.tsx       compositions: HeroReel, BreakupCarousel, TumblrBreakup, MusicPlayerBreakup,
│  │                           Teaser, HeroReelOriginal, Carousel (stills), SignIn
│  ├─ Reel.tsx                 the film: picture + every sound event (+ the first cut's song slot)
│  ├─ BreakupCarousel.tsx      slide 1: the opening, then the film (4:5)
│  ├─ Intro.tsx                slide 1's opening: the present-day desktop, the glitch, XP taking over
│  ├─ MusicPlayerBreakup.tsx   slide 2: the song from PLAY_FRAME, the spectrum bars
│  ├─ TumblrBreakup.tsx        slide 3: she writes and publishes her post (STAY TUNED. in it)
│  ├─ Scene.tsx                the film's frame; Screen: the 540×960 virtual XP screen, camera, grain, vignette
│  ├─ Stills.tsx               carousel stills + bonus sign-in still
│  ├─ sound.tsx, music.ts      sound cues; where the imported song lives
│  ├─ fonts.ts, constants.ts
│  ├─ story/
│  │  ├─ cast.ts               names, personal messages, song, clock, contacts
│  │  ├─ stories.ts            the script + beat timings + camera + pointer (REEL, REEL_CAROUSEL, REEL_ORIGINAL, TEASER)
│  │  ├─ intro.ts              slide 1's opening: its timings and its words (INTRO, INTRO_TEXT)
│  │  ├─ player.ts             slide 2: PLAY_FRAME, the song's in-point, metadata, geometry, playerAt(t)
│  │  ├─ tumblr.ts             slide 3: the post (TEASER_POST: STATEMENT, STAY_TUNED), its date, timeline, every new word (TUMBLR_TEXT), geometry, tumblrAt(t)
│  │  ├─ slides.ts             which moments become carousel stills
│  │  ├─ state.ts              stateAt(story, t): typing, scroll, toasts, nudge shake…
│  │  └─ types.ts
│  └─ ui/                      XP Luna chrome, MSN contact list + conversation, toast, sign-in, desktop,
│                              Internet Explorer 6, Tumblr, Start menu, Windows Media Player 11, original SVG icons,
│                              present.tsx: the present-day desktop of the opening
├─ public/
│  ├─ fonts/                   redistributable fonts + licences (see its README)
│  ├─ sfx/                     original synthesized sounds (scripts/make-sfx.mjs)
│  └─ music/                   the song slot (gitignored; README only)
├─ scripts/                    render, render-carousel, contact-sheet, manifest, qa, regression,
│                              import-song, print-cues, render-stills, frames (QA stills), make-sfx
├─ tests/                      node --test suites + the first cut's data (fixtures/first-cut-38f0d3a.json)
└─ docs/carousel.md, docs/sources.md
```

## Customize

- **Script and pacing:** edit `src/story/stories.ts`. `him` beats have
  `typing` (how long the notice shows) and `at` (when the line arrives). `her`
  beats have `from` (when she starts typing) and `at` (Enter). Keystrokes,
  sounds, scrolling and the Send button all follow from those values.
- **Names, personal messages, clock, contacts:** edit `src/story/cast.ts`.
- **Camera:** the `camera` keys `{t, x, y, z}` set the point of the 540×960
  virtual screen at the centre and the zoom. The camera eases between keys and
  never leaves the screen. Slide 1 has its own keys (`REEL_CAROUSEL`) for the
  4:5 frame.
- **Slide 1's opening:** its timings and words are in `src/story/intro.ts`;
  the present-day desktop is drawn in `src/ui/present.tsx`.
- **The Tumblr post:** `TEASER_POST` in `src/story/tumblr.ts` (built from
  `STATEMENT` and `STAY_TUNED`; its date is there too). The typing, the pause,
  the Enters, the cues and the camera follow it.
- **The carousel's order, files and covers:** `scripts/carousel-list.mjs`.
- **Slides 2 and 3:** their timelines, words and layout are in
  `src/story/player.ts` and `src/story/tumblr.ts`.
- **Carousel stills:** edit `src/story/slides.ts`.

## Tests and QA

- `npm test` (Node's test runner):
  - the script is the brief, character for character, in order;
  - the first cut and teaser are unchanged against `tests/fixtures/`;
  - his lines are 5–10 % faster and her rhythm is identical;
  - there are exactly three nudges, in the right places, not overlapping;
  - the film has no popup, ♫ status or song;
  - the carousel is in the final order (the breakup, the song, Tumblr), with
    its file names, and no script picks a slide by its position;
  - slide 1's opening runs NOW → glitch → THEN in the same 4.8 s (the film
    still starts on frame 144); its first screen is a present-day desktop
    computer (taskbar, window chrome, pointer, this year's date; nothing of a
    phone); the glitch has its jumps, freeze, split, tears, interference and
    blocks, each part turning old once; XP takes over and settles on the
    film's first frame; only its listed words; no vendor names or pictures;
  - the Tumblr post is exactly her sentence, a blank line and STAY TUNED.,
    from one constant, typed key by key with the pause and the two Enters,
    both lines in the editor, published in one post dated exactly
    `8.11.2007`; the video ends on that post and no end card exists; every
    word of the pages listed; no music;
  - the dates: 8.11.2027 on the present-day desktop, 8.11.2007 in the film's
    status line (the night of her post); the first release keeps 8/23/2007;
  - slide 2 is never rendered without the song; its clean export comes with it;
  - Play and the song share PLAY_FRAME, and the press comes 3 frames before;
  - every composition is registered at the right size and length;
  - the framing keeps what matters in shot on every frame.
- `npm run qa` checks the rendered MP4s:
  - format: size, rate, frame count, codecs;
  - a full decode with no error;
  - no black frames and no frozen stretches outside the designed ones (the
    silence after the last nudge);
  - slide 1's opening under the general-flash limit (WCAG 2.3.1);
  - audio that is present and not clipped, plus its loudness;
  - **sync:** a song-only render's first sample is frame 78's first sample;
    the delivered slide 2 has its first note at the Play frame; its pixels
    show ▶ on frame 77 and ❚❚ on frame 78 (without a song file the two song
    checks are skipped, not failed);
  - git tracks nothing in `public/music` but its README.
- `npm run qa:regression` proves that the untouched pieces are untouched.
  The teaser, the first cut and the six stills re-render byte-identical to
  the first release.
- `node scripts/frames.mjs <Composition> <dir> <frames>` renders single
  frames as PNG, for looking at.

## Authenticity notes

The reference is MSN Messenger 7.5 on Windows XP SP2 with the Luna Blue theme.
What it models:

- Luna title bars and caption buttons, the 3 px #0831d9 frame, and inactive
  windows fading.
- The XP scrollbars, Tahoma 8 pt UI text, and menus with underlined access
  keys.
- The 7.5 conversation window:
  - the big Invite / Send Files / Video / Voice / Activities / Games toolbar
  - the To: line with the contact's personal message
  - display pictures in their rounded frames
  - the formatting row: font, emoticons, Voice Clip, winks, backgrounds, gifts, nudge
  - Send greyed out while the box is empty, and Search
  - the status line: “karim is typing a message.” or “Last message received at…”
  - the sponsored-tip footer
- “*name* says:” headers. Each sender keeps their own font and colour: her
  pink bold Comic-style font, his plain black Arial.
- `:(` and `(L)` become emoticons, as Messenger did.
- Nudges: the window shakes in jerky steps, not a smooth wobble, and the note
  reads “You have just sent a nudge.”
- Toasts rise out of the tray, under the taskbar. There is a sign-in toast.
  The first cut also has the “is listening to” toast, which swaps the personal
  message for the ♫ line.
- The contact list has the Customer Experience Improvement Program bar,
  Online / Offline groups with Away, Busy and Blocked states, and the banner
  area.
- Internet Explorer 6, Tumblr (2007), the XP Start menu and Windows Media
  Player 11: see [`docs/carousel.md`](docs/carousel.md), and
  [`docs/sources.md`](docs/sources.md) for which details are documented by
  archived pages and which are reconstructions.
- The sound is original synthesis, not the Microsoft samples: message chime,
  sign-in chime, toast pop, nudge buzz, three keyboard clicks and a mouse
  click.
- Light film grain, a vignette and a slight blur evoke a 2007 LCD, without
  smearing the text.

## IYS easter eggs (deliberately subtle)

1. Her personal message: *in my fluffy pjoys rn* ❤
2. The conversation's sponsored-tip footer: *Click for new Emoticons and Theme
   Packs from IYS*

## Notes and licences

- **Fonts:** Wine Tahoma (LGPL-2.1+), Comic Neue, Arimo, Fira Sans, Gelasio,
  Archivo Black and Inter (SIL OFL). Details are in [`public/fonts/README.md`](public/fonts/README.md).
- **Remotion** is source-available. It is free for individuals and companies
  with up to 3 employees. Bigger companies need a company licence (see
  remotion.dev/license).
- **Trademarks:** MSN, Windows, Messenger, Internet Explorer and Windows Media
  Player are trademarks of Microsoft. Tumblr is a trademark of its owner. This
  is an unofficial, non-commercial nostalgia piece recreated in original code.
  It contains no Microsoft or Tumblr artwork, fonts or sounds, and implies no
  endorsement. Nothing is posted anywhere: the Tumblr pages are drawn, and no
  account or API is used.
- **The song:** “When You’re Gone” (Avril Lavigne) is © its owners and is not
  included. Supplying a file for the production does not establish the right
  to publish it. See [`public/music/README.md`](public/music/README.md).
- **Voice notes:** the three voice notes mentioned in the first brief never
  reached the build session, so the film's pacing comes from the written brief
  and the five reference images. This version's brief came as two voice notes
  from the collaborator (the opening; the teaser post). They were transcribed
  locally and are summarised in [`docs/carousel.md`](docs/carousel.md); the
  recordings and transcripts are private and are not in the repository.
