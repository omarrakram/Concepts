# KAI COLLECTIONS — The Art of Escape · implementation report

Unofficial speculative concept by Omar Akram. Not affiliated with KAI Collections.
Repository `omarrakram/Concepts` · branch **`KAI`** · folder `kai-collections/` · built 14–15 Oct 2026.

---

## 1. The constraint that shaped everything

The build environment's network policy **denied** `kaicollections.com`, `kaicollections.ae`, `kai-collections.myshopify.com`, Instagram's media CDN, LinkedIn, Facebook and all press sites (proxy `403` on `CONNECT`; `WebFetch` DNS failure). Allowed: npm, GitHub and `cdn.shopify.com` (useless without KAI's file paths).

Consequences, handled honestly rather than papered over:

| Brief asked for | What was possible | What was delivered |
| --- | --- | --- |
| Live research of KAI's site, catalogue, Instagram | Web-search tool quoting KAI's indexed pages and press | Full research from indexed KAI pages, every fact cited; nothing visual claimed |
| Authentic KAI photography | None reachable | **No KAI or stock imagery anywhere.** Illustrative flats (labelled), rendered light studies, rendered material studies. `npm run sync` fills every photo slot from KAI's CDN (hotlinked, not committed) once reachable |
| Official logo / colours | Not visible | Typeset wordmark, labelled "not KAI's logo"; proposed palette, labelled |
| Genuine BEFORE capture of kaicollections.com | Impossible | Film's BEFORE is a labelled **text view of KAI's own indexed copy and prices** — never a fabricated screenshot. `npm run capture:before && npm run render` produces the genuine version (pipeline built and exercised) |
| 30–40 verified products | Indexed product, collection and home pages | **56 real products**, each with source URLs and per-field verification |

## 2. Design direction

**The Art of Escape** (concept line, labelled): *kai* means ocean, so the site is built on one horizon. The KAI wordmark stands on a rendered sea in plaster-white relief and is reflected — and, while rising, refracted — in moving water. A single day on the water (morning → blue hour) organises the editorial chapters; the film starts at sunrise and ends at dusk.

Palette (proposal): Sea Salt `#F5F1E9`, Warm Ivory `#FFFDF7`, Sandstone `#D8CDBD`, Mediterranean Blue `#285D74`, Deep Ocean `#173843`, Sunwashed Gold `#E7BA78`, Soft Coral `#D98770` (+ `#B0503A` for AA text), Ink `#202827`. Type: Fraunces Variable (opsz 144, SOFT, WONK italics) + Jost Variable. Devices: the horizon line on every product stage, tide-fill hovers, material macro studies, technical flats. Avoided: clip-art, stock models, glassmorphism, dark luxury pastiche, any BE-INDIE language.

## 3. Brand research findings (see `research/`)

Founded 2018 in Cairo by Karim Safadi as a locally made alternative to imported men's swimwear; *kai* = Hawaiian for ocean, also "Cairo" and the K of Karim (Flair 2018). Premium swim and resort wear for men, women and children; linen sets, knitwear, seasonal winterwear; values quality, integrity, local empowerment. Five Cairo flagships, seasonal North Coast stores, Red Sea stockists, UAE storefront. Distinctive assets: named prints with humour, technical product copy, the **Like Father, Like Son** matching line, strong physical retail. Site observations (from indexed structure only): season-coded collections and internal names, EGP/USD inconsistency across pages, heavy markdowns and sold-out density, brand story buried on About.

Files: `brand-audit.md`, `visual-identity.md`, `current-site-audit.md`, `product-manifest.json` (56 products, per-field verification), `asset-manifest.json`, `source-links.md`.

## 4. Asset authenticity

| Asset | Origin | Status |
| --- | --- | --- |
| Product names, prices, sizes, materials, details, stock notes | KAI's own pages via search index, 2026-10-14 | real, dated, cited |
| Brand facts, quotes | KAI About Us / homepage; 2018 press | real, cited; verbatim quotes marked as such, reported facts not put in quotation marks |
| Store list | KAI store list + About Us | real (addresses beyond area and phone numbers not captured) |
| Garment flats (19 types) | original SVG | illustrative, labelled; colour only from product name; prints never drawn |
| Seascapes, sand, arches | original WebGL / SVG | abstract, labelled "rendered"; no real locations |
| Material studies | original procedural canvas | generic textile structure, labelled; facts beside them quoted from KAI |
| Fonts | Fraunces, Jost (SIL OFL) | licensed |
| Film plates | screenshots of this concept | project |
| Soundtrack | synthesised in code, no samples | project |
| KAI photography, logo, BEFORE captures | — | **missing**, fill paths documented |

## 5. Routes (all load directly and survive refresh)

`/` · `/shop` · `/shop/men` · `/shop/women` · `/shop/kids` · `/shop/swimwear` · `/shop/linen` · `/shop/resort` · `/shop/everyday` · `/shop/sets` · `/shop/new-arrivals` · `/shop/sale` · `/product/:slug` (56 products) · `/lookbook` · `/about` · `/stores` · `/showcase` (+ `?stage`, `?capture`, `?t=`, `?loop`) · 404 "Lost at sea".

## 6. Features

**Homepage chapters 00–10:** The Arrival (WebGL sea, rising wordmark, pointer-driven glint) · The KAI philosophy (sourced) · **The Horizon** (sticky scroll-driven day: water → sand → arches → golden → blue hour; real pieces on the waterline; ink tone follows the light) · Choose your escape (4 doors over material studies) · Three wardrobes (accordion panels) · **Resort Atlas** (sun travels a drawn arc; light and edit change; radiogroup keyboard support) · **Material Edit** (7 fabrics, ×3.2 loupe, KAI's own sentences) · Collection Edit (in-place tabs) · **Build your escape** (rule-based builder with live flat-lay, totals, shuffle, dress rule, save look — explicitly not AI) · Coastal Journal · Final Horizon.

**Commerce:** search overlay (suggestions, highlighted live results, arrow-key/Enter navigation, "see all"), category/department/size/sale/in-stock filters in the URL, five sorts, quick view, product galleries (flat → detail → material study → colour card; or KAI photos after sync), size picker with provenance notes and required-size validation, saved items, concept bag (quantities, remove, subtotal, persisted), honest hand-off to each piece's KAI page (exact URL when indexed, KAI's own search otherwise), matching sets, related products, mobile sticky add bar.

**Accessibility & performance:** reduced-motion path for every animation (static Horizon, still seascapes), keyboard support throughout, focus-trapped dialogs with focus return, skip link, labelled canvases, alt text everywhere, AA contrast on shopping pages, IntersectionObserver-paused WebGL, idle-time generation of procedural textures and stills, one shared offscreen context for still vignettes. JS 431 KB (129 KB gzip), CSS 55 KB, film code split into its own chunk.

## 7. Catalog data

56 products (men 26, women 24, kids 5, unisex 1): 43 with indexed product URLs, 52 with indexed EGP prices, 19 with size runs, 22 with materials, 0 photographs. Snapshot dated 2026-10-14, shown on every PDP and in the footer. Conflicting snapshots are recorded in `notes` (e.g. Beige Linen Pants EGP 1,150 vs 1,450 on two pages — product page used). Four pieces show "Price on kaicollections.com" because no price could be tied to them with certainty. "Tipsy Sardine" and "Butter Isla" (named in the brief) were not found in any indexed page and are not included.

## 8. Major components

`src/gl/sea.ts` (shader + still renderer) · `src/components/Seascape.tsx` · `src/components/GarmentFlat.tsx` · `src/gl/materials.ts` · `src/components/Chrome.tsx` (nav, mega menu, mobile sheet, footer) · `src/components/Panels.tsx` (bag, saved, search, quick view) · `src/home/*` (chapters) · `src/pages/*` · `src/showcase/*` (film) · `src/state/store.ts` (bag/saved, `useSyncExternalStore` + guarded `localStorage`).

## 9. Testing

| Check | Result |
| --- | --- |
| `npm run typecheck` (tsc, strict) | pass |
| `npm run build` | pass |
| `npm test` (Vitest) | **20 / 20 pass** — catalog contract, shop logic, editorial references, sync normaliser |
| `npx playwright test` | **72 / 72 pass, two consecutive full runs** (desktop 1440 + touch-mobile 390, Chromium with SwiftShader WebGL) — all 18 routes direct + refresh, 404s, titles, mega menu (click/keyboard), nav, skip link, search (suggestions, keyboard, results page, empty state), filters/sort/size/sale/in-stock/URL persistence/clear, quick view, gallery, size validation, bag (qty, subtotal, remove, persistence, hand-off links), saved, official links, related, sets, Horizon (motion on), Escape doors, wardrobes, Atlas (mouse + keyboard), Material Edit + loupe, Edit tabs, Builder (rules, shuffle, save), Journal, Finale, stores filter, axe (no serious/critical WCAG 2 A/AA issues on 7 pages), contrast on shopping pages, focus trap, alt text, internal-link crawl + external-link safety, film player + deterministic seek, overflow at 360/390/768/1024/1440 on all routes, mobile menu, touch gallery/size/sticky bar, mobile Atlas/Builder |
| Visual review | Desktop 1440 and phone 390/360 screenshots of every chapter and page reviewed; fixes made for ghosted letter shading, overflowing department words, invisible door labels, chapter-text contrast, duplicate suns, drawer-shadow bleed, mobile card overlap, mega-menu hover/click toggle, five live canvases in the reduced-motion Horizon (now stills from one shared context) |

## 10. Film

`output/kai-before-after-16s.mp4` — see `output/video-verification.json` for the measured values (duration 16.000 s, 960 frames, 60/1 fps, 1080 × 1920, H.264 High, yuv420p, AAC 48 kHz stereo 16.000 s, faststart, no black stretches, no freezes). Storyboard `output/video-storyboard.md`, contact sheet `output/showcase-contact-sheet.png`.

Engine: the stage is a phone viewport (432 × 768 CSS × 2.5); live parts are the site's own components driven by `t`; UI states are plates photographed from the built site (seamless scroll strips with the real nav and sticky bar drawn on top). CSS transitions are disabled inside the stage so each frame is a pure function of `t`. `npm run render` = build → plates → audio → 960 frames (3 parallel Chromium workers, SwiftShader WebGL) → x264 CRF 16 + AAC 192k → verification. Soundtrack synthesised from scratch and locked to the timeline.

## 11. Deployment readiness

`vercel.json` (Vite, `npm ci`, `npm run build`, `dist`, SPA rewrite that excludes `/assets/` and `/film/`, immutable asset caching, `noindex`). No env vars, no backend, no localhost URLs in the bundle, browser APIs guarded. **Vercel: import `omarrakram/Concepts`, Root Directory `kai-collections`.** Not deployed (no credentials/authorisation given).

## 12. Known limitations

- No KAI photography, logo or live BEFORE footage (network policy) — fill paths: `npm run sync`, logo swap in `Wordmark`, `npm run capture:before`.
- Prices are a dated snapshot; stock is not live; some sizes are range-derived (flagged in the UI and manifest).
- Visual parts of the current-site audit (layout, photography, mobile UX) could not be assessed.
- WebGL in headless/software renderers is slow (seconds per first frame); real GPUs render it in milliseconds. A CSS-gradient fallback covers browsers without WebGL.
- The BEFORE in the delivered MP4 is the labelled text view, not the live site.

## 13. Git delivery (verified)

| | |
| --- | --- |
| Repository | `omarrakram/Concepts` |
| Branch | `KAI` (created from `main` @ `b7a6039`; never force-pushed; not merged) |
| Delivery commit | `298ea3c44e6478b6c50a2a3276a47f93328bab76` — feat(kai): build The Art of Escape digital concept and showcase |
| Earlier commit on the branch | `5e44053` — site foundation |
| Push | `git push -u origin KAI` → `* [new branch] KAI -> KAI`; `git ls-remote` and the GitHub API both return `298ea3c` for `refs/heads/KAI` |
| Pushed tree | 118 files under `kai-collections/` incl. `output/kai-before-after-16s.mp4` (18,368,295 bytes) |
| Outside `kai-collections/` | only `README.md` (+8 lines: the KAI entry in the project index). No other project touched. |
| Not committed (by design) | `node_modules/`, `dist/`, `.cache/` (soundtrack WAV), `.frames/`, `test-results/`, `src/data/live/` (KAI storefront data), `public/film/before/*` (third-party UI captures) |
| Branch link | https://github.com/omarrakram/Concepts/tree/KAI |

This section was added in a follow-up commit on the same branch.

## 14. Run locally

```bash
git clone https://github.com/omarrakram/Concepts.git
cd Concepts && git checkout KAI && cd kai-collections
npm install
npm run dev                 # http://127.0.0.1:5173
npm run build && npm run preview   # production build at http://127.0.0.1:4173
npm test && npx playwright test    # tests
npm run render              # rebuild the film (needs ffmpeg)
```
