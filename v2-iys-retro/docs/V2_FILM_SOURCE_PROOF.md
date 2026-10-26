# V2 film: source proof (approval gate)

The first production checkpoint for the new 30-second film: prove the source,
show six fresh screenshots and a 5-second proof. **The full 30-second master
has not been rendered.** The previous film (desktop 864×1536) is archived in
`out/archive/prev-film-864x1536-local-664a8cb/` (gitignored) and is not reused.

## Source

| | |
| --- | --- |
| Repository | `omarrakram/Concepts`, project `v2-iys-retro/` |
| Source branch | `feature/iys-retro-conversion-upgrade` |
| Source SHA | `664a8cbbb00d42ce0aa8cc00377ecce9faacab49` ("Fix IYS Retro mobile layout and commerce QA issues"); branch head on the remote at build time, unchanged since |
| Checkout | detached worktree `film-source/v2-source-664a8cb` (outside this branch; contains no film tools) |
| Build | `scripts/showcase-30/source-build.mjs`: `npm ci && npm run build` with every `VITE_*` removed from the environment; Node v22.22.2, npm 10.9.7 |
| Build fingerprint | 275 files, manifest sha256 `e57d9743…d208b08` (`out/source/dist-manifest.sha256`), `index.html` md5 `0f42f84f…610d54e` |
| Served by | `vite preview` on `127.0.0.1:4317`, working directory the worktree (checked through `/proc/<pid>/cwd`); serves the same `index.html` |
| Film tools | branch `film/iys-internet-2006-30s` (this branch). Every take checks the served `index.html` against the source record before filming and writes the SHA into `take.json` |

The same commit built on the film branch is byte-identical (all 275 files),
so the previous film was shot from the right code. It looked wrong because of
how it was filmed: a portrait 864×1536 "desktop" (below 1100 px the site
maximizes IYS INTERNET and stacks the product page, hiding the wallpaper),
the site's own CRT overlay switched off, and the FW27 wallpaper in later takes.

### Build-time switches (read from `src/config/features.ts`, none set)

| Variable | Value | Effect |
| --- | --- | --- |
| `VITE_FEATURE_TOP_NAV` | unset → on | MENU · IYS 2006 / REAL IYS · MY BAG top strip |
| `VITE_FEATURE_BAG_INCENTIVES` | unset → on | free-shipping progress from the verified rule |
| `VITE_FEATURE_BAG_UPSELL` | unset → on | U MIGHT ALSO LIKE in MY BAG |
| `VITE_FEATURE_PRODUCT_RECS` | unset → on | MORE LIKE THIS on product pages |
| `VITE_FEATURE_HOME_SHELVES` | unset → on | extra home shelves |
| `VITE_FEATURE_GAME_REWARDS` | unset → on | kill switch only; rewards also need `VITE_GAME_REWARDS=1` (unset → no reward UI) |
| `VITE_FEATURE_MOBILE_PJOYS_NOTICE` | unset → on | MSG unread marker on IYS MOBILE |
| `VITE_FEATURE_ESCAPE_ROUTE` | unset → on | the "continue on the real IYS" offer |
| `VITE_COMMERCE_MODE`, `VITE_LIVE_CART` | unset | snapshot catalogue (2026-09-30), no live Shopify |
| `VITE_NEWSLETTER_ENDPOINT`, `VITE_ODOO_*` | unset | the site's honest placeholders |

### Hosted parity: not verifiable from this session

GitHub's deployment records tie the user's URL to this commit: the Vercel bot's
comment on PR #1 lists project `iys5retro` as Ready with Preview
`iys5retro-git-feature-iys-retro-conversion-upgrade-omaw.vercel.app`, and
deployment `7329709040` ("Preview – iys5retro", `664a8cb`) succeeded at
`iys5retro-1opm0bkeu-omaw.vercel.app`. The host itself is refused by this
session's network policy, so two things stay unverified: which folder that
Vercel project builds, and whether it sets any `VITE_*` variables. The film
therefore reproduces **the commit with the documented defaults above**. When
the host is reachable, `verify-site.mjs --local-dist=<worktree>/v2-iys-retro/dist`
compares the deployment's content-hashed JS/CSS and its 32 catalogue shards
with this build (identical names = identical client code, flags included).

## V2 identity checks (`scripts/showcase-30/verify-site.mjs`, 34/34 passed)

Fresh browser contexts, service workers blocked, nothing seeded (the site's
own defaults). Any failure stops the run before further capture.

* Served build = source build (asset hashes), 32/32 catalogue shards identical.
* Desktop at 1440×900, 1366×768 and 1920×1080: top strip MENU · IYS 2006 /
  REAL IYS · MY BAG; taskbar; the V2 icons (19, no DRESSUP); default hills
  wallpaper (`/iys/os/hills.svg`); the site's CRT overlay; Catchy; no service worker.
* IYS INTERNET home: JUST DROPPED ✧ FRESH 4 U and 5 extra shelves; the window fully on screen.
* Arabic search: هودي → "IYS understood: hoodie" (133 results).
* Product (Main Character Pjoys): title, 799 EGP, sizes S M L and XL (sold
  out) exactly as the snapshot, ADD TO BAG disabled until a size; MORE LIKE THIS.
* MY BAG after a real size M + ADD TO BAG: one line (variant 47353640583389,
  799 EGP), 10 recommendations, the verified shipping note, window fully on screen.
* IYS MOBILE 390×844: bar SHOP ALL · SEARCH · FAVS · STORES · MSG; top MENU ·
  IYS 2006 / REAL IYS · BAG; soft keys MENU / SHOP / BAG (BACK / PICK SIZE / BAG
  on a product); no old app grid; no desktop Catchy; no sideways overflow.
* Nothing forbidden requested: 0 blocked site calls, 0 outside requests.

## Screenshots (`out/site-verify/v2-source-664a8cb/`)

| File | Viewport | sha256 |
| --- | --- | --- |
| V2-01-desktop-1440x900.png | 1440×900 @2x | `d274d20c…0586947d` |
| V2-02-iys-internet-home-1440x900.png | 1440×900 @2x | `fae5155f…4e2f2225` |
| V2-03-product-main-character-pjoys-1440x900.png | 1440×900 @2x | `bac1be39…1f4d28c7` |
| V2-04-my-bag-1440x900.png | 1440×900 @2x | `363c7db8…fa0a1952` |
| V2-05-mobile-home-390x844.png | 390×844 @3x | `2a3011d4…f03c0baf` |
| V2-06-mobile-product-390x844.png | 390×844 @3x | `3c6dc80a…790f7a4a` |

Also: V2-00 (first visit, the welcome dialog), V2-x Arabic search, V2-x
desktop at 1366×768 and 1920×1080. Full hashes in `site-verification.json`.

## The 5-second proof (`IYS-RETRO-V2-PROOF-5S-1080x1920.mp4`)

* **Take** `takes-v2/proof.mjs`: desktop **1440×900 CSS at 3×** (4320×2700 px
  per frame), 314 frames, 0 outside requests, first visit with the site's
  defaults. Off camera, the boot and the welcome dialog answered "Cancel". On
  camera, every move is real input: the cursor rests on MY BAG, hovers IYS 2006 /
  REAL IYS, then clicks the IYS INTERNET icon on frame 120 (2.0 s). Then the
  site's loader, the homepage, a real scroll, and a hover on a product.
* **Edit** `edit-proof.mjs` (real speed, one continuous camera; `lib/wide.mjs`
  frames the wide desktop into 9:16 with no stretching):
  * 0.00–0.70: a plain monitor powers on in a dark room, the whole desktop in view.
  * 0.70–1.05: push in to MY BAG.
  * 1.05–2.00: ride the top strip (framed under the monitor's top edge, clear
    of social-app overlays) across the switch to MENU and the icon.
  * 2.00: the click.
  * 2.06–2.30: "Loading IYS INTERNET...".
  * 2.39–2.92: pull back as the homepage fades in.
  * 3.03–3.93: the scroll, then a clean 2×2 of JUST DROPPED products with names
    and EGP prices.
* **Sound** `audio-proof.mjs`: the first 5 s of the original score (the groove
  lands on the click), the site's own click and window-open sounds, CRT
  power-on, soft whooshes; -14.0 LUFS, -1.4 dBTP.
* **File**: 1080×1920, 60/1 fps, 300 frames, 5.000 s, H.264 High yuv420p
  BT.709 + AAC-LC 48 kHz stereo, 8,862,055 bytes, sha256
  `22c1e510d7824b482aba93505fe1847700bc4b1e151c4e084d7ead9d9f835741`. No black
  or frozen ranges (FFmpeg blackdetect / freezedetect).
* Rebuild: `npm run film-v2:source`, serve the worktree on 4317, `npm run film-v2:verify`, `npm run film-v2:proof`.

## Observations (website, not changed)

* The mobile **home** screen shows the site's own small Catchy ledge
  (`CatchyPet mode="mobile"` in `src/shells/mobile/screens.tsx`). The old film's
  notes said the mobile shell never shows Catchy; that was true of the screens
  it filmed, not of the home screen.
* At 1366×768 the bottom-right desktop icon (XCHANGE.EXE) overlaps the
  desktop's "IYS INTERNET 2006" signature text.
* At 1440×900 MY BAG opens fully on screen (the right-edge clipping noted in
  `SHOWCASE_30_FILMING_NOTES.md` was specific to the 864 px desktop).
