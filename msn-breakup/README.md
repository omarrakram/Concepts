# MSN breakup: a 2007 nostalgia reel and Instagram carousel

It's 11:47 PM on 23 August 2007, on a Windows XP desktop with MSN Messenger
7.5 open. karim dumps ~\*nOuR\*~ in five lines, then goes quiet. She spirals,
nudges him, says “no actually”, and nudges him twice more. Nothing. A minute
later she posts about it on Tumblr. Then she opens Windows Media Player and
plays “When You’re Gone” by Avril Lavigne.

This is a standalone Remotion project. Every pixel is code: the Luna window
chrome, the Messenger windows, Internet Explorer, the Tumblr pages, the Start
menu, Windows Media Player, the emoticons, the Bliss-style hills, the taskbar.
There are no screenshots, no Microsoft or Tumblr image assets and no Microsoft
sounds. Each frame is a pure function of time, so renders are deterministic.

## Deliverables

| Output | Size | Length | Command |
| --- | --- | --- | --- |
| `out/instagram-carousel/01-msn-breakup-carousel.mp4` (slide 1: the film, 4:5) | 1080 × 1350, 30 fps, H.264 + AAC | 35.0 s | `npm run render:carousel:film` |
| `out/instagram-carousel/02-tumblr-breakup-post.mp4` (slide 2: her Tumblr post) | 1080 × 1350, 30 fps | 10.0 s | `npm run render:carousel:tumblr` |
| `out/instagram-carousel/03-when-youre-gone-music-player.mp4` (slide 3: the song) | 1080 × 1350, 30 fps | 12.8 s | `npm run render:carousel:player` |
| `out/instagram-carousel/03-…-clean.mp4` (slide 3 without the song) | 1080 × 1350, 30 fps | 12.8 s | (same) |
| `out/instagram-carousel/covers/`, `contact-sheet.png`, `MANIFEST.md`, `manifest.json` | | | `npm run render:carousel` (all of the above) |
| `out/msn-breakup-reel.mp4` (the film, 9:16 master) | 1080 × 1920, 30 fps | 35.0 s | `npm run render:reel` |
| `out/msn-breakup-teaser.mp4` (teaser, unchanged) | 1080 × 1920, 30 fps | 7.0 s | `npm run render:teaser` |
| `out/stills/01…05-*.png`, `06-bonus-sign-in.png` (stills, unchanged) | 1080 × 1350 | 6 stills | `npm run render:stills` |
| `out/msn-breakup-reel-first-cut.mp4` (the film as first released, for A/B) | 1080 × 1920 | 33.0 s | `npm run render:reel:first-cut` |

`out/` is gitignored. Rendering recreates it. A render never silently replaces
an earlier file: if the output exists and no copy is archived yet,
`scripts/render.mjs` first copies it to `out/archive/previous/`. The first
release's renders and their SHA-256 sums are kept in
`out/archive/original-38f0d3a/`.

How the carousel fits together (order, every new word on screen, the period
design notes): [`docs/carousel.md`](docs/carousel.md).

## Run it

Requires Node 20 or newer, and ffmpeg/ffprobe for the song import and QA.

```bash
cd msn-breakup
npm install
npm run import:song -- <your file>   # the song, into the gitignored public/music/ (see below)
npm run dev                  # Remotion Studio: scrub, preview, tweak props
npm run render:reel          # → out/msn-breakup-reel.mp4               (9:16 master)
npm run render:carousel      # → out/instagram-carousel/ (3 videos + clean export, covers, sheet, manifest)
npm run render:carousel:film | :tumblr | :player   # one slide
npm run render:teaser        # → out/msn-breakup-teaser.mp4
npm run render:stills        # → out/stills/*.png
npm run render:all           # all of the above
npm run cues                 # cue sheet: every beat of every video as time, frame and SMPTE
npm test                     # script, timing, nudges, music, Tumblr, player, carousel, framing
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
slide 3, from the frame on which Play turns to Pause (**frame 78 =
00:00:02.600**). The film has no music. The cue, the clean export for adding
the track from Instagram's licensed library, and the rights note are in
[`public/music/README.md`](public/music/README.md).

## Story

### The film (HeroReel 9:16 · BreakupCarousel 4:5, 35 s)

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

### Slide 2: her Tumblr post (TumblrBreakup, 10 s)

She clicks the Quick Launch “Internet” icon. Internet Explorer opens on the
Tumblr text-post form. She types the title *did u seriously just dump me on
msn??* and the post *i hate u / … / i miss u*: her own lines, typed at the
rhythm she typed them in the film. She clicks **Create post**, and her blog
shows it.

### Slide 3: When You’re Gone (MusicPlayerBreakup, 12.8 s)

Start → Windows Media Player. In Library ▸ Songs she selects “When You’re
Gone” by Avril Lavigne and presses Play. On that frame the button turns to
Pause, the time reads 00:00 and the song begins on its first note. She
switches to Now Playing. The bars move with the music, through the first sung
line.

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
│  ├─ TumblrBreakup.tsx        slide 2
│  ├─ MusicPlayerBreakup.tsx   slide 3: the song from PLAY_FRAME, the spectrum bars
│  ├─ Scene.tsx                the film's frame; Screen: the 540×960 virtual XP screen, camera, grain, vignette
│  ├─ Stills.tsx               carousel stills + bonus sign-in still
│  ├─ sound.tsx, music.ts      sound cues; where the imported song lives
│  ├─ fonts.ts, constants.ts
│  ├─ story/
│  │  ├─ cast.ts               names, personal messages, song, clock, contacts
│  │  ├─ stories.ts            the script + beat timings + camera + pointer (REEL, REEL_CAROUSEL, REEL_ORIGINAL, TEASER)
│  │  ├─ tumblr.ts             slide 2: timeline, every new word (TUMBLR_TEXT), geometry, tumblrAt(t)
│  │  ├─ player.ts             slide 3: PLAY_FRAME, the song's in-point, metadata, geometry, playerAt(t)
│  │  ├─ slides.ts             which moments become carousel stills
│  │  ├─ state.ts              stateAt(story, t): typing, scroll, toasts, nudge shake…
│  │  └─ types.ts
│  └─ ui/                      XP Luna chrome, MSN contact list + conversation, toast, sign-in, desktop,
│                              Internet Explorer 6, Tumblr, Start menu, Windows Media Player 11, original SVG icons
├─ public/
│  ├─ fonts/                   redistributable fonts + licences (see its README)
│  ├─ sfx/                     original synthesized sounds (scripts/make-sfx.mjs)
│  └─ music/                   the song slot (gitignored; README only)
├─ scripts/                    render, render-carousel, contact-sheet, manifest, qa, regression,
│                              import-song, print-cues, render-stills, frames (QA stills), make-sfx
├─ tests/                      node --test suites + the first cut's data (fixtures/first-cut-38f0d3a.json)
└─ docs/carousel.md
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
- **Slides 2 and 3:** their timelines, words and layout are in
  `src/story/tumblr.ts` and `src/story/player.ts`.
- **Carousel stills:** edit `src/story/slides.ts`.

## Tests and QA

- `npm test` (Node's test runner):
  - the script is the brief, character for character, in order;
  - the first cut and teaser are unchanged against `tests/fixtures/`;
  - his lines are 5–10 % faster and her rhythm is identical;
  - there are exactly three nudges, in the right places, not overlapping;
  - the film has no popup, ♫ status or song;
  - the Tumblr post is verbatim, with no music;
  - Play and the song share PLAY_FRAME, and the press comes 3 frames before;
  - every composition is registered at the right size and length;
  - the framing keeps what matters in shot on every frame.
- `npm run qa` checks the rendered MP4s:
  - format: size, rate, frame count, codecs;
  - a full decode with no error;
  - no black frames and no frozen stretches;
  - audio that is present and not clipped, plus its loudness;
  - **sync:** a song-only render's first sample is frame 78's first sample;
    the delivered slide 3 has its first note at the Play frame; its pixels
    show ▶ on frame 77 and ❚❚ on frame 78;
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
  Player 11: see [`docs/carousel.md`](docs/carousel.md), including which
  details are approximations.
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

- **Fonts:** Wine Tahoma (LGPL-2.1+), Comic Neue, Arimo, Fira Sans and Gelasio
  (SIL OFL). Details are in [`public/fonts/README.md`](public/fonts/README.md).
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
  reached the build session, so the pacing comes from the written brief and
  the five reference images. If the voice notes change the timing, adjust the
  beats in `src/story/stories.ts`.
