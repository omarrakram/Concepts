# MSN breakup: a 2007 nostalgia reel

It's 11:47 PM on 23 August 2007, on a Windows XP desktop with MSN Messenger
7.5 open. karim dumps ~\*nOuR\*~ in five lines, then goes quiet. She spirals.
Then the little popup slides up in the corner: *karim is listening to “When
You’re Gone” by Avril Lavigne*.

This is a standalone Remotion project. Every pixel is code: the Luna window
chrome, the Messenger windows, the emoticons, the Bliss-style hills, the
taskbar. There are no screenshots, no Microsoft image assets and no Microsoft
sounds. Each frame is a pure function of time, so renders are deterministic.

## Deliverables

| Output | Size | Length | Command |
| --- | --- | --- | --- |
| `out/msn-breakup-reel.mp4` (hero reel) | 1080 × 1920, 30 fps, H.264 + AAC | 33.0 s | `npm run render:reel` |
| `out/msn-breakup-teaser.mp4` (teaser) | 1080 × 1920, 30 fps, H.264 + AAC | 7.0 s | `npm run render:teaser` |
| `out/stills/01…05-*.png` (carousel) | 1080 × 1350 (4:5) | 5 slides | `npm run render:stills` |
| `out/stills/06-bonus-sign-in.png` (bonus) | 1080 × 1350 | still | (same) |

`out/` is gitignored. Rendering recreates it.

## Run it

Requires Node 20 or newer.

```bash
cd msn-breakup
npm install
npm run sfx              # (re)generate the original sound effects (already committed)
npm run dev              # Remotion Studio: scrub, preview, tweak props
npm run render:teaser    # → out/msn-breakup-teaser.mp4
npm run render:reel      # → out/msn-breakup-reel.mp4   (4–5 min on 4 cores)
npm run render:stills    # → out/stills/*.png
npm run render:all       # all of the above
npm run cues             # cue sheet: every beat as time, frame and SMPTE
npm run typecheck
```

Remotion renders with Chrome Headless Shell. If
`/opt/pw-browsers/chromium_headless_shell-*` exists, `remotion.config.ts` uses
it. `REMOTION_BROWSER=/path/to/chrome` overrides that. Otherwise Remotion
downloads its own on the first render. Video settings: JPEG frames at quality
94 and limited-range yuv420p in BT.709 (in the config), plus CRF 17 (passed by
the `render:*` scripts, so audio-only exports such as `--codec=wav` still work).
Social platforms re-encode anyway, so this masters high.

## The music cue

The song is **not** in this repo, and no file pretends to be it. See
[`public/music/README.md`](public/music/README.md).

- **Cue: HeroReel frame 639 = 00:00:21.300 = SMPTE 00:00:21:09 (30 fps).**
  This is the frame the “karim is listening to” popup starts sliding in. On
  that same frame, the ♫ line replaces his personal message in her contact
  list and in the conversation's To: line.
- **Swap slot:** drop a licensed copy at
  `public/music/when-youre-gone.(mp3|m4a|wav|aac|ogg)` and run `npm run
  render:reel`. The reel finds the file and starts it exactly on the cue. The
  props `songStartSeconds` and `songVolume` adjust it.
- **Sync QA:** `--props='{"cueTone":true}'` puts a 1 kHz blip on the cue frame.
- **No file:** upload the silent-cue reel and add the track from Instagram's
  or TikTok's licensed library, starting it at 0:21.3.

## Story (HeroReel, 33 s)

| Time | Beat |
| --- | --- |
| 0.0–1.9 | Her XP desktop, 11:47 PM. Toast: *karim has just signed in.* The conversation window opens. |
| 1.1–8.1 | **The breakup.** *karim is typing a message.* comes before each line. His five lines arrive slowly, each with a chime. |
| 8.1–9.9 | **Silence.** Her pointer drifts to the input box and clicks. |
| 9.9–20.6 | **Her spiral.** 13 lines typed live, key by key, in bursts that speed up and then collapse into “…”. The camera pushes in and the history auto-scrolls. |
| 21.3 | **The popup.** *karim is listening to “When You’re Gone” by Avril Lavigne* slides up from the tray. The camera pulls back to show it. **The song starts here.** |
| 22.4–25.4 | “i miss u”, “can we talk”, “HELLOOOOO”, then she **nudges** him. The window shakes and the buzz plays. |
| 26.5–33.0 | The ending: “ugh whatever”, “brb crying”, “jk”, “no actually”. A slow push-in, and the last line is left to hang. |

The teaser (7 s) is the hook: the sign-in, “hey… sry but i think we shud
break up :(”, “bye x”, “did u seriously just dump me on msn??”, “HELLOOOOO”
and a nudge.

The lines are word for word from the brief. The timings, camera and pointer
paths are data in `src/story/stories.ts`. Run `npm run cues` for the full
sheet.

## Structure

```
msn-breakup/
├─ src/
│  ├─ index.ts, Root.tsx       compositions: HeroReel, Teaser, Carousel, SignIn
│  ├─ Reel.tsx                 picture + every sound event + the song slot
│  ├─ Scene.tsx                the 540×960 virtual XP screen, camera, grain, vignette
│  ├─ Stills.tsx               carousel slides + bonus sign-in still
│  ├─ fonts.ts, constants.ts
│  ├─ story/
│  │  ├─ cast.ts               names, personal messages, song, clock, contacts
│  │  ├─ stories.ts            the script + beat timings + camera + pointer
│  │  ├─ slides.ts             which moments become carousel slides
│  │  ├─ state.ts              stateAt(story, t): typing, scroll, toasts, nudge shake…
│  │  └─ types.ts
│  └─ ui/                      XP Luna chrome, MSN contact list, conversation,
│                              toast, sign-in window, desktop, original SVG icons
├─ public/
│  ├─ fonts/                   redistributable fonts + licences (see its README)
│  ├─ sfx/                     original synthesized sounds (scripts/make-sfx.mjs)
│  └─ music/                   licensed-song slot (gitignored; README only)
└─ scripts/                    make-sfx, render-stills, print-cues
```

## Customize

- **Script and pacing:** edit `src/story/stories.ts`. `him` beats have
  `typing` (how long the notice shows) and `at` (when the line arrives). `her`
  beats have `from` (when she starts typing) and `at` (Enter). Keystrokes,
  sounds, scrolling and the Send button all follow from those values.
- **Names, personal messages, clock, contacts:** edit `src/story/cast.ts`.
- **Camera:** the `camera` keys `{t, x, y, z}` set the point of the 540×960
  virtual screen at the centre and the zoom. The camera eases between keys and
  never leaves the screen.
- **Carousel moments and framing:** edit `src/story/slides.ts`.

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
- Toasts rise out of the tray, under the taskbar. There is a sign-in toast,
  and later the “is listening to” toast, which also swaps the personal message
  for the ♫ line.
- The contact list has the Customer Experience Improvement Program bar,
  Online / Offline groups with Away, Busy and Blocked states, and the banner
  area.
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

- **Fonts:** Wine Tahoma (LGPL-2.1+), Comic Neue, Arimo and Fira Sans (SIL
  OFL). Details are in [`public/fonts/README.md`](public/fonts/README.md).
- **Remotion** is source-available. It is free for individuals and companies
  with up to 3 employees. Bigger companies need a company licence (see
  remotion.dev/license).
- **Trademarks:** MSN, Windows and Messenger are trademarks of Microsoft. This
  is an unofficial, non-commercial nostalgia piece recreated in original code.
  It contains no Microsoft artwork, fonts or sounds, and implies no
  endorsement. “When You’re Gone” is © its owners and is not included.
- **Voice notes:** the three voice notes mentioned in the brief never reached
  the build session, so the pacing comes from the written brief and the five
  reference images. If the voice notes change the timing, adjust the beats in
  `src/story/stories.ts`.
