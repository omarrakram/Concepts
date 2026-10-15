# KAI COLLECTIONS — The Art of Escape

**Unofficial, speculative digital redesign concept by Omar Akram, 2026. Not affiliated with, endorsed by or connected to KAI Collections.** Nothing is sold here: the bag is local to your browser and every purchase link opens the piece on [kaicollections.com](https://kaicollections.com).

KAI is the Cairo swimwear and resort-wear label founded in 2018; *kai* is Hawaiian for ocean. This concept turns that meaning into the whole experience: the KAI wordmark stands on a rendered horizon and is reflected in moving water, a single day on the water (morning → blue hour) organises the editorial chapters, and a real catalogue of 56 KAI products sits underneath — shoppable, filterable and honest about what it knows.

It ships with a deterministic 16-second vertical before/after film (`/showcase`, `npm run render`).

## Run it

```bash
cd kai-collections
npm install
npm run dev            # http://127.0.0.1:5173
```

Production build: `npm run build && npm run preview` → http://127.0.0.1:4173

| Route | |
| --- | --- |
| `/` | Editorial homepage — chapters 00–10 |
| `/shop` · `/shop/men` · `/shop/women` · `/shop/kids` | Collection + departments |
| `/shop/swimwear` · `/shop/linen` · `/shop/resort` · `/shop/everyday` | Categories |
| `/shop/sets` · `/shop/new-arrivals` · `/shop/sale` | Matching sets and edits |
| `/product/:slug` | Product detail (e.g. `/product/festival-del-mare-swim-shorts`) |
| `/lookbook` | The Coastal Journal |
| `/about` · `/stores` | Brand story (sourced) · store locator |
| `/showcase` | The 16-second film (`?stage`, `?capture`, `?t=4.5`, `?loop`) |

All routes load directly and survive a refresh (SPA fallback in `vercel.json`).

## Deploy on Vercel

Import the `omarrakram/Concepts` repository, set **Root Directory = `kai-collections`**. Framework preset Vite is detected from `vercel.json` (`npm ci`, `npm run build`, output `dist`). No environment variables or services are required.

## The homepage

| # | Chapter | What it does |
| --- | --- | --- |
| 00 | The Arrival | WebGL sea; the KAI letters rise out of the water, stand on the horizon in plaster-white relief and reflect in the waves. Pointer moves the sun's glint. |
| 01 | The KAI philosophy | Hawaiian *kai*, 2018, made in Cairo — sourced, with KAI's own homepage line. |
| 02 | **The Horizon** | Signature interaction. A sticky, scroll-driven day: sunlit water → warm sand → white walls (arches rise from the horizon) → golden hour → blue hour. Real KAI pieces stand on the waterline; ink switches tone with the light. |
| 03 | Choose your escape | Swim / Linen / Resort / Everyday doors over material studies; hover fills like a tide and swaps the pieces. |
| 04 | Three wardrobes | Men / Women / Kids panels that widen on hover; stacked on phones. |
| 05 | The Resort Atlas | Pick a moment on the sun's arc (07:10 → 21:00); the shader's sun travels the arc, the light changes, the edit follows. Styling themes, not KAI campaigns. |
| 06 | The Material Edit | Linen, swim polyester, mesh lining, nylon–elastane, knit, jersey, French terry — rendered macro studies with a ×3.2 loupe, beside facts quoted from KAI product pages. |
| 07 | The Collection Edit | New in / Swim / Linen / Last chance, swapped in place, with quick view. |
| 08 | Build your escape | Rule-based outfit builder (department + garment rules, a "dress needs no bottom" rule) with a live flat-lay, total, shuffle and save — explicitly *not* AI. |
| 09 | The Coastal Journal | Editorial entries with sourced quotes. |
| 10 | The Final Horizon | "THE ART OF ESCAPE" on the water at dusk; lockup and footer. |

## Shopping

Search with suggestions, highlighted live results and keyboard navigation · category, department, size, sale and in-stock filters (all in the URL) · price/name/discount sorting · quick view · product galleries (flat, detail, material study, colour card — or KAI's photographs once synced) · size picker with provenance notes · saved items · concept bag with quantities, removal, subtotal and an honest hand-off to KAI's own product pages · matching sets · related products · persistent state in `localStorage`.

## What is real, what is not — read this

**Real (from KAI's own pages, as indexed):** product names, URLs, EGP prices and compare-at prices, sizes, materials, details, fit notes and stock states for 56 products; brand facts; store list. Snapshot date and per-field verification are in `research/product-manifest.json`.

**The network limit.** The build environment's egress policy blocked `kaicollections.com`, its UAE site, Instagram's CDN and press sites. Everything above was therefore read through search-engine snapshots, not live. Consequences:

- **No KAI photography and no KAI logo are in this repository.** Nothing was substituted from stock libraries or generated as fake garments.
- Garments appear as **illustrative flats** (technical drawings of the garment type, coloured only from the colour in the product name; prints are never drawn — every printed piece says "print not shown").
- Atmosphere comes from **rendered light studies** (the WebGL sea) and **rendered material studies** — abstract water, light and textile structure, labelled as such.
- Prices are **dated** (snapshot 2026-10-14), stock is **not live**, and a few pieces show "Price on kaicollections.com" where the snapshot did not tie a price to them with certainty.
- "THE ART OF ESCAPE", chapter names, Atlas moods and journal text are **concept copy**, labelled on screen.

**With access to kaicollections.com:**

```bash
npm run sync              # direct storefront snapshot + KAI's photography (hotlinked from KAI's CDN, never committed)
npm run capture:before    # live BEFORE captures for the film (git-ignored)
npm run render            # re-render the film with them
```

`src/data/live/` and `public/film/before/` are git-ignored: they contain KAI's data and UI and should only be published with KAI's permission.

## The film

`output/kai-before-after-16s.mp4` — 16.000 s, 1080 × 1920, 60 fps (960 frames), H.264 High / yuv420p, AAC 48 kHz, faststart. Storyboard: `output/video-storyboard.md`. Contact sheet: `output/showcase-contact-sheet.png`. Verification: `output/video-verification.json`.

- The stage is a **phone viewport** (432 × 768 CSS px at 2.5×), so every AFTER element is the real site's mobile layout. Live parts — the sea, the KAI wordmark, The Horizon — are the site's own components driven by `t`. UI states (scroll, product page, gallery, size chosen, bag) are **plates photographed from the built site** by `npm run capture:plates`.
- **BEFORE:** with live captures present, the film scrolls the real kaicollections.com. Without them (as in this build) it shows a clearly labelled **text view** of KAI's own indexed copy and prices — never a fabricated screenshot.
- **Soundtrack:** synthesised from scratch in `scripts/make-audio.mjs` (no samples): room tone, a rising tide that breaks on the reveal, ocean ambience, a warm pad following the scenes, light percussion, UI taps and a bell lockup.
- Every frame is a pure function of `t` (CSS transitions are disabled inside the stage); `npm run render` steps `t = f/60` for 960 frames through Playwright and encodes with FFmpeg, then `npm run verify:video` checks duration, frame count, fps, size, codecs, faststart, black and frozen stretches, and writes the contact sheet.

```bash
npm run render                 # build → plates (if missing) → audio → 960 frames → MP4 → verify
npm run render -- --plates     # re-photograph the plates first
node scripts/frames.mjs 3.1 7.9 15.5   # single frames for QC
```

Needs ffmpeg with libx264 on PATH (or `FFMPEG=/path`). Playwright's Chromium renders WebGL through SwiftShader, so it works headless.

## Tests

```bash
npm run typecheck
npm test                 # Vitest: catalog contract, shop logic, editorial references, sync normaliser
npx playwright test      # E2E on desktop and touch-mobile (builds and serves the site itself)
```

## Tech

React 19, React Router 7, Vite 8, TypeScript. No animation or UI library: motion is CSS and plain math on time/scroll. One WebGL fragment shader (`src/gl/sea.ts`) renders sky, sun, sea, sand and the reflected wordmark; still vignettes share one offscreen context. Fonts: Fraunces Variable and Jost Variable (SIL OFL) via Fontsource.

```
src/data/        catalog snapshot (products.json), brand facts, stores
src/gl/          seascape shader, material studies
src/components/  chrome, panels (bag, saved, search, quick view), flats, cards
src/home/        homepage chapters 00–10
src/pages/       shop, product, sets, lookbook, about, stores, 404
src/showcase/    the film
scripts/         sync, capture (plates / before), audio, render, verify, manifests, shots
research/        brand, identity and site audits, manifests, sources
output/          film, storyboard, contact sheet, screenshots, report
```
