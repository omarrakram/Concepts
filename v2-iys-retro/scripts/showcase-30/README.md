# IYS INTERNET 2006: the 30-second showcase film

A second, separate showcase. The existing 19.2 s `/showcase` route and its
`record` / `frames` / `poster` scripts are untouched. This film is built only
from **real frames of the running site**, filmed by a script, then edited and
scored here. Nothing in `src/` was changed to make it.

```
npm run build && npm run preview      # the production build the film is shot from
npm run film30                         # shoot → audio → render → mux → qa (about 60–70 min on 4 cores)
```

or step by step:

| Step | Command | Writes (all in `out/showcase-30/`, gitignored) |
| --- | --- | --- |
| 1. Shoot | `npm run film30:shoot [-- --takes=desktop-a,mobile]` | `takes/<id>/f0000.jpg…` + `take.json` (marks, cursor, rects) |
| 2. Audio | `npm run film30:audio` | `iys-internet-2006-30s-audio.wav`, `audio-cues.json` |
| 3. Render | `npm run film30:render` (`-- --stills=1.2,11.5` for QA stills) | `iys-internet-2006-30s-video.mp4` (`stills/`) |
| 4. Mux | `npm run film30:mux` | `iys-internet-2006-30s-1080x1920.mp4` (the deliverable) |
| 5. QA | `npm run film30:qa` | `VALIDATION.md`, `validation.json`, `contact-sheet.jpg`, `scene-sheet.jpg`, cover / poster / thumbnail, first / last frame |

Shooting needs the CDN photo cache or network access to the official IYS
image CDN (`scripts/lib/cdn-route.mjs`). Rendering, audio and QA are offline.

## Source lock: check the deployed site first

```
NODE_USE_ENV_PROXY=1 node scripts/showcase-30/verify-site.mjs --local-dist=dist
```

Opens the deployed site (default: the `iys5retro` preview of
`feature/iys-retro-conversion-upgrade`) in fresh browser contexts with
service workers blocked. It checks that the URL answers, that it names the
same content-hashed JS/CSS as the local build, and that the 32 catalogue
shards are byte-identical. It then takes the reference screenshots:
- desktop 1440×900: first visit, desktop, IYS INTERNET, product, and MY BAG
  after a real ADD TO BAG
- IYS MOBILE 390×844: home and product

Only reads reach the site; mail, rewards and writes are aborted and listed
in `out/site-verify/<stamp>/site-verification.json`.

## How a take is filmed (`lib/stage.mjs`)

* Playwright's fake clock advances `Date`, timers, `requestAnimationFrame` and
  `performance` by exactly 1/60 s per frame. Every CSS animation and
  transition (`document.getAnimations()`) is paused and stepped by the same
  1/60 s, so the site's own motion design (window opening, the ADD TO BAG
  "Copying..." dialog, image loaders, the IYS TOWER game) plays at its real
  speed, frame-exact. Local requests finish before a frame is taken.
* Input is real: `page.mouse`, `page.touchscreen`, `page.keyboard`, real
  scrolling of real scrollers. `assertHit()` makes a take fail if a click
  would land on something other than what the script says.
* Determinism: the unfilmed pre-roll is always the same length on the film
  clock (so every timer the site sets fires at the same film time); each
  frame waits until React has committed (the DOM stops changing), local
  requests are done and visible photos are decoded. Shooting every take twice
  and comparing frame by frame is how the film is checked (see
  `docs/SHOWCASE_30_FILMING_NOTES.md`).
* Takes start from a **safe demo state** (`takes/seed.mjs`): a local bag of
  real catalogue items, session flags, and the site's own CRT overlay
  switched off (the film adds one even texture). The site's sound setting
  stays at its shipped default (off). `Math.random` is seeded so Catchy's
  idle choices repeat. No accounts, no emails, no Shopify, mail or reward
  requests; every non-local request except the official product photos is
  blocked and counted.
* Desktop takes: 864×1536 CSS px at 2× (a 9:16 screen, so the desktop shell
  fills the frame without squeezing). Mobile take: 405×720 at 1080/405
  (exactly 1080×1920). The morph take narrows the real viewport from
  864×1536 to 405×720; the site switches to IYS MOBILE itself at 700 px.

## Edit, picture and sound

* `edit.mjs` is the edit decision list: shot times, source frames, camera
  (centre + zoom in the take's CSS pixels), transitions. `planFrame` turns a
  frame number into drawing ops; `compositor/` draws them on a 1080×1920 canvas
  in Chromium (the site's own cursor SVGs, tap ripples, a plain unbranded
  phone body, an even CRT texture, the end card).
* `lib/score.mjs` is the original score (120 BPM). `lib/sfx.mjs` re-renders
  the site's own Web Audio UI sounds (`src/lib/sound.ts`) offline, plus film
  sounds (CRT power-on, whooshes, keys, taps). `audio.mjs` places a click at
  every real press, a tap at every real tap, and the site's own sounds
  where the site plays them. Mastered to about -14 LUFS, true peak under -1 dBTP.
* Encode: H.264 High, yuv420p, CRF 16, 60 fps, BT.709; AAC-LC 256 kb/s 48 kHz.

See `docs/SHOWCASE_30_TIMELINE.md` for the scene-by-scene timeline and
`docs/SHOWCASE_30_FILMING_NOTES.md` for what was staged and the website
issues noticed while filming.
