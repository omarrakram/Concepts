# IYS Retro V2 film: filming notes, staging and reproduction

Companion to `V2_FILM_TIMELINE.md` (what is on screen, second by second) and
`V2_FILM_SOURCE_PROOF.md` (which code was filmed and how that was checked).

## What was filmed

The film is cut from five scripted takes of the source build
(`feature/iys-retro-conversion-upgrade` @ `664a8cb`, built with no `VITE_*`
variables, served by `vite preview` from a detached worktree). Before any frame
is taken, `lib/stage.mjs` fetches the served `index.html` and refuses to film
unless its md5 equals the source record (`out/source/source-build.json`); each
`take.json` stores the SHA, branch and build directory it was filmed from.
Nothing in `src/` was changed for the film, and the site was not modified to
make filming easier.

Input is real: Playwright mouse, keyboard, touch and scrolling, with a check
that every click lands on what the script names. The site's own animations
(window opening, loaders, the ADD TO BAG "Copying..." dialog, IYS TOWER) are
filmed frame-exact on a fake clock at 60 fps.

## Staging, disclosed

1. **One visit, five browser sessions.** w-shop starts empty. w-explore,
   w-play, w-morph and w-mobile each start from the browser storage the earlier
   takes' real clicks wrote (`iys2006.bag`, `iys2006.favorites`, recorded in the
   earlier `take.json`), so the bag (Dropout Oversized Hoodie, M) and the saved
   favorite are results of filmed input, carried over between sessions.
2. **Off camera in w-shop:** the boot and the first-visit welcome dialog
   (answered "Cancel"). PJOYS' "u awake?" ping is marked as already seen for this
   first session so its balloon does not cover MY BAG during shopping; the ping
   is filmed in w-explore, fired by the site's own 9-second timer.
3. **SIZE GUIDE is closed with its own × before size M.** With the guide, the
   browser and MY BAG all open, the site stacks MY BAG partly off the right edge
   at 1440 px; closing the guide first keeps MY BAG fully on screen.
4. **CONTROL PANEL:** IYS FW27 is selected so its preview monitor shows the
   campaign wallpaper, but it is not applied; the desktop keeps the default
   hills wallpaper for the transformation and the poster.
5. **Catchy** is carried by a real drag to the middle of the desktop, then
   poked; the reaction ("hiii") is the site's own. Catchy is not redrawn.
6. **IYS TOWER** is played with the arrow keys; the compositor hides the
   mouse pointer during the keyboard-play shots. The score bar is the real one
   from this play; no score is presented as anyone's record, and this build has
   no rewards.
7. **IYS MESSENGER** is the site's single-window PJOYS flow (scripted lines and
   file cards). Nothing is sent and no second person is involved.
8. **Commerce:** CHECKOUT is hovered, never pressed. No Shopify, mail,
   newsletter or reward request is made; the catalogue is the site's
   2026-09-30 snapshot with official product photography. No accounts and no
   customer data.
9. **Timing:** shots play the site at real speed except where
   `V2_FILM_TIMELINE.md` says otherwise (the cursor's trip along the top strip
   at 1.9×, the SIZE GUIDE at 1.4×, the montage cuts, the slow opening while
   the cursor rests).
10. **IYS MOBILE** has its own small Catchy ledge on the home screen (site
    default); it is visible in the mobile shots but not featured.
11. **Drawn by the film, not the site:** the room, the plain monitor and phone
    bodies, the desk reflection, camera moves with motion blur (90° shutter,
    capped at 18 px), white flashes on cuts, the opening title and the end card.
    Their copy comes from the site: the concept thesis in `src/data/copy.ts` and
    the end card of the site's own `/showcase` (`src/showcase/Showcase.tsx`).
    The CRT lines in the screen are the site's own overlay (on by default).

## Limitations

* **Hosted parity is not verified.** The Vercel preview host is refused by this
  session's network policy. The film reproduces the commit with its documented
  defaults; it is not claimed to be pixel-identical to the deployment.
  `verify-site.mjs --local-dist=<worktree>/v2-iys-retro/dist` compares them when
  the host is reachable.
* The film was checked frame by frame from the encoded file and measured
  (loudness, peaks, silence), but nobody watched or listened to it in real time
  on a phone from this session.

## Reproduce

```
# 1. the source build (detached worktree at 664a8cb, no VITE_* variables)
node scripts/showcase-30/source-build.mjs
cd <worktree>/v2-iys-retro && node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4317 --strictPort
# 2. back on this branch: check the served site, then film, score, render, mux, check
npm run film-v2:verify
NODE_USE_ENV_PROXY=1 npm run film-v2:shoot     # w-shop → w-explore → w-play → w-morph → w-mobile (order matters)
npm run film-v2:audio
npm run film-v2:render                          # add -- --stills=5.2,29.3 for QA stills only
npm run film-v2:mux
npm run film-v2:qa
```

Everything is written to `out/v2-film/` (gitignored): `takes/<id>/` (frames +
`take.json`), `final/IYS-RETRO-V2-FINAL-30S-1080x1920.mp4`, the audio and cue
list, `VALIDATION.md` / `validation.json`, contact and scene sheets, cover,
poster, thumbnail and first/last frames. Shooting takes about 1.2 frames per
second at 3× on 4 cores (≈45 min for all takes); the render about 25 minutes.
`NODE_USE_ENV_PROXY=1` lets the shooter fetch official product photos through
the session proxy (the site's own CDN requests are routed through Node).
