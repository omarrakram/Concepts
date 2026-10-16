# KAI COLLECTIONS — The Art of Escape

**Unofficial, speculative digital redesign concept by Omar Akram, 2026. Not affiliated with, endorsed by or connected to KAI Collections.** Nothing is sold here: the bag is local to your browser and every purchase link opens the piece on [kaicollections.com](https://kaicollections.com).

KAI is the Cairo swimwear and resort-wear label founded in 2018; *kai* is Hawaiian for ocean. This concept turns that meaning into the whole experience: KAI's own logo stands on a rendered horizon and is reflected in moving water, a single day on the water (morning → blue hour) organises the editorial chapters, and KAI's **complete SS26 assortment — 374 products, read directly from kaicollections.com, with KAI's own photography** — sits underneath, shoppable, filterable and honest about what it knows.

It comes with a deterministic 16-second vertical before/after film (`/showcase`, `npm run render`), delivered separately (see [Rights & media](#rights--media)).

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
| `/shop` · `/shop/men` · `/shop/women` · `/shop/kids` | The collection + departments |
| `/shop/swimwear` · `/shop/linen` · `/shop/resort` · `/shop/everyday` | Categories (Swim, Linen, Resort, Knit & Jersey) |
| `/shop/sets` · `/shop/new-arrivals` · `/shop/sale` | Matching sets and edits |
| `/product/:handle` | Product detail — KAI's handle (e.g. `/product/festival-del-mare-swim-shorts`) |
| `/lookbook` | The Coastal Journal + the season as KAI shot it |
| `/about` · `/stores` | Brand story (sourced) · store locator (from KAI's store list) |
| `/showcase` | The 16-second film (`?stage`, `?capture`, `?t=4.5`, `?loop`) — needs locally captured plates |

All routes load directly and survive a refresh (SPA fallback in `vercel.json`).

## The catalog — direct from KAI's storefront

`npm run sync` (`scripts/sync-catalog.mjs`) reads KAI's public Shopify endpoints — `/products.json` (all 1,051 published products) and `/collections/<handle>/products.json` for the SS26 collections KAI's own navigation links to — and writes `src/data/catalog.live.json`:

- **374 products** (Men 181 · Women 175 · Kids 18), 308 with at least one size available, 66 sold out — snapshot **2026-10-15**.
- Per product: KAI's title (apostrophes and casing made consistent), EGP price and compare-at price, every size with its availability, composition and construction lines from KAI's description, fit, care, model note, KAI's product type, collection membership, KAI's Best Sellers order (the Featured sort) and New Arrivals flag.
- **1,732 photographs**, stored as *references* to KAI's CDN (`cdn.shopify.com`), never as files. Every lead image is checked to resolve when syncing.
- KAI shoots most pieces 2:3 but its swim-short, sarong and scarf packshots square. The sync's last step (`npm run backdrops`, `scripts/photo-backdrops.mjs`) reads the top and bottom pixel rows of all 77 square photographs in Chromium — nothing is saved — and records the backdrop colour of the 70 that sit on a flat backdrop. Those are shown whole, letterboxed in their own colour, instead of being cropped to 2:3; the 7 square on-model crops (linen shorts) keep the crop.
- Matching sets are derived only from KAI: its Men/Women *Matching Sets* collections (grouped by colour and fabric line), bikini tops and bottoms sold in the same style, and adult/Mini swim shorts in the same print (KAI's "Like Father, Like Son" line).
- The earlier search-index snapshot (56 products, 2026-10-14) is kept as history in `research/search-index-snapshot.json` and reconciled in `research/catalog-reconciliation.json`: 30 are current SS26, 25 are still published but outside SS26, 1 is no longer listed. Only current SS26 products are presented as current.

Node's built-in `fetch` ignores `HTTPS_PROXY`; the sync script re-runs itself with `NODE_USE_ENV_PROXY=1` when a proxy is configured. Browser scripts hand Chromium the proxy explicitly (`scripts/lib/browser.mjs`).

## The homepage

| # | Chapter | What it does |
| --- | --- | --- |
| 00 | The Arrival | WebGL sea; **KAI's own logo letters** (loaded CORS-clean from KAI's CDN) rise out of the water, stand on the horizon in plaster-white relief and reflect in the waves. Pointer moves the sun's glint. |
| 01 | The KAI philosophy | Hawaiian *kai*, 2018, made in Cairo — sourced, with KAI's own homepage line. |
| 02 | **The Horizon** | Signature interaction. A sticky, scroll-driven day: sunlit water → warm sand → white walls (arches rise) → golden hour → blue hour. KAI's photographs of real, in-stock pieces stand on the waterline. |
| 03 | Choose your escape | Swim / Linen / Resort / Knit doors, each opened by one of KAI's homepage campaign photographs. |
| 04 | Three wardrobes | Men / Women (KAI campaign photographs) / Kids (Mini and grown-up Yellow Zebra, same print) — panels widen on hover. |
| 05 | The Resort Atlas | Pick a moment on the sun's arc; the shader's sun travels the arc, the light changes, the edit follows (moods are concept, products are KAI's). |
| 06 | The Material Edit | Seven cloths, each inspected through **KAI's own close-up photograph** of one product with a ×3 loupe on the full-resolution file, beside that same product's composition and details quoted from its KAI page. |
| 07 | The Collection Edit | New in / Swim / Linen / Last sizes (reduced, one or two sizes left), swapped in place, with quick view. |
| 08 | Build your escape | Rule-based outfit builder (department + garment rules, in-stock only, a "dress needs no bottom" rule) laid out on a towel in KAI's photographs — explicitly *not* AI. |
| 09 | The Coastal Journal | Editorial entries set in KAI's photographs, with verbatim quotes; a product is marked *Pictured* only when KAI uses that exact photograph on its product page. |
| 10 | The Final Horizon | "THE ART OF ESCAPE" on the water at dusk; KAI's logo; footer. |

## Shopping

Search with suggestions, photo thumbnails, highlighted live results and keyboard navigation · category (KAI's own sub-collections), department, size (KAI's many size spellings mapped to one key; only sizes KAI lists as available), sale and in-stock filters, all in the URL · Featured (KAI's Best Sellers order), newest, price, discount and name sorting · "Show more" paging · quick view with KAI's photos · product gallery of KAI's photographs with a full-resolution close-up and an optional, labelled **Sketch** view · square packshots shown whole on their own backdrop · care: the piece's own care note where KAI gives one, plus the general care block KAI's product pages show for every piece, quoted · size picker with KAI's sold-out sizes disabled · "N sizes left" scarcity from real availability · saved items · concept bag with quantities, removal, subtotal and an honest hand-off to KAI's own product pages · matching sets · related products · persistent state in `localStorage`.

## Rights & media

- **KAI's logo and photographs belong to KAI Collections.** The concept *references* them by URL from KAI's own CDN (the same files kaicollections.com serves; KAI's CDN sends `Access-Control-Allow-Origin: *`). **No KAI photograph, logo file, site capture or film is stored in this repository** — a unit test fails if one is added outside the git-ignored film folders.
- Showing them on a public URL needs KAI's permission. `VITE_KAI_MEDIA=off npm run build` produces a build that loads **no** KAI-hosted media: products fall back to the concept's labelled sketches and the logo to a typeset stand-in that says it is not KAI's logo.
- Media that *captures* KAI's photography is generated locally and delivered to the client separately, never committed: the live BEFORE captures (`npm run capture:before` → `public/film/before/`, `output/before/`), the film plates (`npm run capture:plates` → `public/film/plates/`), site screenshots (`npm run shots`), the contact sheet and the film MP4 itself. A text record of the BEFORE capture (URLs, time, viewports — no images) is committed in `research/before-capture.json`.
- On a clean checkout `/showcase` explains that the film is not part of the build instead of failing.
- The project is not deployed. It is ready for Vercel (below); deploy only with authorisation, and with `VITE_KAI_MEDIA=off` unless KAI has approved public use of its media.

## Deploy on Vercel (when authorised)

Import the `omarrakram/Concepts` repository, set **Root Directory = `kai-collections`**. Framework preset Vite is detected from `vercel.json` (`npm ci`, `npm run build`, output `dist`). Add `VITE_KAI_MEDIA=off` as an environment variable unless KAI has approved public use of its photography and logo. No services are required.

## The film

`output/kai-before-after-16s.mp4` (delivered separately) — 16.000 s, 1080 × 1920, 60 fps (960 frames), H.264 High / yuv420p, AAC 48 kHz, faststart. Storyboard: `output/video-storyboard.md`. Verification: `output/video-verification.json`.

- The stage is a **phone viewport** (432 × 768 CSS px at 2.5×), so every AFTER element is the real site's mobile layout. Live parts — the sea, KAI's logo on the horizon, The Horizon chapters with KAI's photographs — are the site's own components driven by `t`. UI states (scroll, collections, product page, gallery, size chosen, bag) are **plates photographed from the built site** by `npm run capture:plates`.
- **BEFORE** is a genuine capture of today's kaicollections.com on a phone (homepage, SS26 Mens Swimwear, Festival del Mare Swim Shorts), made by `npm run capture:before`. Without captures the film shows a clearly labelled text view of KAI's own copy instead — never a fabricated screenshot.
- **Soundtrack:** synthesised from scratch in `scripts/make-audio.mjs` (no samples).
- Every frame is a pure function of `t`; each seek waits until every photograph on screen has decoded. `npm run render` steps `t = f/60` for 960 frames through Playwright and encodes with FFmpeg; `npm run verify:video` checks duration, frame count, fps, size, codecs, faststart, black and frozen stretches, and writes the contact sheet.

```bash
npm run sync                   # refresh the catalog from kaicollections.com (ends with npm run backdrops)
npm run capture:before         # live BEFORE captures (git-ignored)
npm run render -- --plates     # build → plates → audio → 960 frames → MP4 → verify
node scripts/frames.mjs 3.1 7.9 15.5   # single frames for QC
```

Needs network access to kaicollections.com and its CDN, and ffmpeg with libx264 on PATH (or `FFMPEG=/path`). Playwright's Chromium renders WebGL through SwiftShader, so it works headless.

## Tests

```bash
npm run typecheck
npm test                 # Vitest: catalog contract, sync parser, shop logic, editorial references, rights hygiene
npm run test:e2e         # Playwright on desktop and touch-mobile (builds and serves the site itself)
```

E2E fixtures are picked from the committed catalog snapshot, so a re-sync can't silently break them. Image checks load KAI's photographs, so the E2E suite needs access to KAI's CDN.

## Tech

React 19, React Router 7, Vite 8, TypeScript. No animation or UI library: motion is CSS and plain math on time/scroll. One WebGL fragment shader (`src/gl/sea.ts`) renders sky, sun, sea, sand and the reflected logo; still vignettes share one offscreen context. Fonts: Fraunces Variable and Jost Variable (SIL OFL) via Fontsource.

```
src/data/        live catalog snapshot, media references (logo, campaign), materials, brand facts, stores
src/gl/          seascape shader
src/components/  chrome, panels (bag, saved, search, quick view), photo, cards, sketches
src/home/        homepage chapters 00–10
src/pages/       shop, product, sets, lookbook, about, stores, 404
src/showcase/    the film
scripts/         sync, capture (before / plates), audio, render, verify, manifests, shots
research/        brand, identity and site audits, manifests, reconciliation, sources
output/          storyboard, verification, report (media outputs are local only)
```
