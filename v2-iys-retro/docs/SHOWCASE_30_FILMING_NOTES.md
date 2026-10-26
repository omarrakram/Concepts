# 30-second showcase: what was staged, and what filming found

## Staged (controlled, deterministic, disclosed)

* **Starting state** of each take (`scripts/showcase-30/takes/seed.mjs`):
  take A starts with an **empty** bag; takes B, C, morph and mobile start
  with the one line take A really added (Main Character Pjoys, M, 799 EGP,
  the same key and price the site's ADD TO BAG writes). Favorites start
  empty in B (B saves the hoodie); the later takes start with that hoodie.
  The morph and mobile takes start with the FW27 wallpaper take C applied.
  Session flags (boot seen, welcome seen, PJOYS already pinged) are set so
  each take begins where the previous one left off.
* **Clock**: 02:13 on 26 Oct 2026, Cairo time (the site's own PJOYS "2:13 AM"
  line). The taskbar and phone clocks show it.
* **Seeded `Math.random`** so Catchy's idle choices and the game repeat.
* **The site's CRT overlay is off** in the takes (its own Control Panel
  setting) because the film crops and zooms; the film lays one even CRT
  texture over every frame instead. The boot keeps its own strong CRT.
* **Sound**: the site's sound setting is left at its shipped default, OFF.
  The film's soundtrack is separate and original; its UI sounds are the
  site's own synthesized recipes, placed where the site would play them.
* **Cursor and taps**: headless screenshots carry no OS pointer, so the
  compositor draws the site's own cursor SVGs (`public/iys/os/cursor-*.svg`)
  at the real pointer position and type of every frame, and a ripple at every
  real tap. The phone body around IYS MOBILE is a plain, unbranded drawing.
* **Warm mobile code** (morph take only, before filming starts): the tab is
  phone-sized once and back, so the IYS MOBILE code is already loaded when the
  filmed resize crosses 700 px (otherwise the first switch shows a blank
  screen for about 0.3 s, see below).
* **Edit speed**: every shot plays at real speed (1.00×) except: Arabic search
  typing 1.33×, chat 1.36× and 1.85× (PJOYS' typing pauses), carrying Catchy
  1.43×, Control Panel 1.56×, the window coming back from DESKTOP 2.67×, and
  the resize 1.07×. The ADD TO BAG dialog, SIZE GUIDE, MY BAG, the game and
  every mobile screen are real speed. Shots are cut together from five separate
  takes.

## Reproducibility (measured, not assumed)

* **Edit, picture and sound from a given set of takes are fully
  deterministic**: the compositor draws from a plan computed in Node, and the
  score and effects are generated from code and seeds.
* **Shooting** was checked by filming all five takes twice, independently,
  and comparing every frame byte for byte. Two runs with the final capture
  code matched on **2,983 of 3,227 frames**; an earlier pair matched on
  3,181 of 3,227. In every pair, marks, cursor paths, element positions and
  outside requests (none) were identical. The frames that differ are either
  invisible raster noise (largest channel difference under 50, a few dozen
  pixels), or the same action landing one clock tick earlier or later. That
  happens when real input reaches the page while the machine is under heavy
  load: the window restoring from DESKTOP is a few pixels further along, and
  the exact bounces of the IYS TOWER run differ. What happens on screen
  never changes; only exact positions do. Fixes that went in for this: a
  fixed-length pre-roll, waiting for the DOM to settle and for visible photos
  to decode before each frame. (Re-sending the pointer each frame to pin
  hover styles was tried and reverted: Chromium dispatches pointer moves on
  real frames, which made Catchy and the game less repeatable.)

## Never shown as working when it isn't

No live Shopify cart, no checkout completion (CHECKOUT is hovered, never
pressed), no email sent (IYS MAIL is not in the film), no discount code, no
game reward, no free-shipping eligibility claim, no stock count. Prices,
sizes and availability are the catalogue snapshot (2026-09-30) as the site
shows them. Everything that left the machine during filming was an official
product photo from the IYS CDN (served through the local cache); every other
outside request was blocked (`take.json` → `external` is empty).

## Website issues noticed while filming (not fixed on the film branch)

1. **SIZE GUIDE covers the size picker on narrow desktops (701–900 px wide).**
   `openSizeGuide` (`src/apps/Browser/pages/Product.tsx`) places the guide over
   the photo gallery, the left part of the browser. Below 900 px the product
   page stacks (gallery above, properties below), so once the visitor has
   scrolled to the sizes, the guide opens on top of them: a click on "M" lands
   on the guide window and ADD TO BAG stays disabled. Repro: 864×1536
   viewport, open any sized product, scroll the sizes up to about 120 px below
   the toolbar, press SIZE GUIDE, then press a size. (The film scrolls the
   sizes lower, where the guide does not reach, which is the layout the code
   comment intends.) Suggested fix: when `.product__layout` is single-column,
   open the guide to the right or below the purchase controls.
2. **First switch to IYS MOBILE shows a blank screen.** Resizing a desktop tab
   below 700 px for the first time renders `.shell-loading` (empty) while the
   lazily loaded `MobileShell` chunk arrives: about 0.3 s on a local server,
   longer on a real network. Preloading that chunk on idle, or a non-blank
   fallback, would hide it.
3. **Catchy's reactions happen out of sight when IYS INTERNET is maximized**
   (the default below 1100 px). Catchy sits under windows by design
   (`catchy.css`: z-index 20 < windows 100), so his ADD TO BAG and IYS GAMES
   reactions are not visible on narrow desktops. Not a bug; noted because it
   shaped the film.
