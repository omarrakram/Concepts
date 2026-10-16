# KAI COLLECTIONS — The Art of Escape · implementation report

Unofficial speculative concept by Omar Akram. Not affiliated with KAI Collections.
Repository `omarrakram/Concepts` · branch **`KAI`** · folder `kai-collections/` · first build 14–15 Oct 2026 · **production completion 15–16 Oct 2026** (direct access to kaicollections.com).

---

## 1. What changed in the production pass

The first build ran without access to kaicollections.com and was honest about it (search-index data, illustrative flats, a typeset wordmark, a text-view BEFORE). With access granted, every one of those stand-ins was replaced by the real thing — or retired:

| Before (first build) | Now |
| --- | --- |
| 56 products from search-engine snapshots, dated 2026-10-14 | **KAI's full SS26 assortment, 374 products**, read directly from KAI's Shopify storefront on 2026-10-15 (`npm run sync`); old snapshot kept as history and reconciled |
| No photography; illustrative garment flats | **1,732 KAI photographs** on every product surface; flats survive only as an optional, labelled **Sketch** view and as the image-failure / media-off fallback |
| Rendered material studies | **KAI's own close-up photographs** of seven cloths, with a ×3 loupe on the full-resolution file and that product's own composition |
| Rendered light studies in the journal | **KAI's campaign and product photographs** (16 homepage images) in escape doors, departments, journal, lookbook, stores, mega menu |
| Typeset "KAI" wordmark | **KAI's official logo** (nav, menu, footer, finale, film) — and its KAI letters now stand on the WebGL horizon |
| Text-view BEFORE | **Genuine phone captures** of kaicollections.com (home, SS26 Mens Swimwear, Festival del Mare Swim Shorts) captured 2026-10-15 |
| `npm run sync` never exercised | Run, found broken, fixed (§3) |

## 2. Rights and the public repository

- KAI's logo and photographs are **referenced by URL** from KAI's own CDN — the files kaicollections.com itself serves (CORS `*`). None is stored in the repository; a unit test fails if a media file appears outside the git-ignored film folders.
- Anything that *captures* KAI's media is generated locally and **delivered separately**: BEFORE captures (`public/film/before/`, `output/before/`), film plates (`public/film/plates/`), site screenshots, the contact sheet and the MP4. The previously committed plates, screenshots, contact sheet and MP4 (from the first build) were removed from the tip of the branch, because the regenerated versions show KAI's photography. History was not rewritten.
- Committed text records instead: `research/before-capture.json` (URLs, time, viewports, titles, HTTP status), `output/video-verification.json`, manifests.
- `VITE_KAI_MEDIA=off npm run build` produces a build that requests nothing from KAI's CDN (verified: 0 requests across home, shop, product, lookbook, stores, sets; products show labelled sketches; the logo becomes a typeset stand-in that says it is not KAI's logo). Use it for any public hosting KAI has not approved.
- The concept stays labelled as unofficial everywhere (footer, film lockup, About). Not deployed.

## 3. `npm run sync` — run, verified, fixed

Bugs found by actually running it against the live store:

1. **It never reached the network.** Node's built-in `fetch` ignores `HTTPS_PROXY`; the script reported the site unreachable. It now re-runs itself with `NODE_USE_ENV_PROXY=1` when a proxy is configured. Browser scripts hand Chromium the proxy explicitly and keep loopback direct.
2. **Cents were guessed from magnitude** (`> 10000` ⇒ cents). Prices are now converted by payload shape (`.js` = integer cents, `products.json` = decimal strings).
3. **Composition regex swallowed prose** ("100% Washed Linen and a relaxed lounge f…", "100% Polyester fabric") and missed `70% Linen / 30% Cotton`. Rewritten with tests.
4. **Nested lists** (KAI wraps a whole list in one `<li>` on some pages) produced garbage lines — only innermost items are read now.
5. **A compare-at price lower than the price** (e.g. Black Tencel Pants 1,750 vs 1,599) was treated as a sale. Fixed.
6. It only refreshed the 56 curated handles (one 404). It now reads all published products and KAI's SS26 collection membership, checks every lead image resolves, tidies size-label whitespace, drops detail bullets that merely repeat fit/care, and reconciles the old snapshot.

A last step was added afterwards: it records the backdrop colour of square packshots (§4). It also runs alone as `npm run backdrops`, and was run that way on the 2026-10-15 snapshot without re-syncing, so prices and stock remain those of that date.

Result (2026-10-15): 1,051 published products → **374 SS26 products** (Men 181 · Women 175 · Kids 18), 308 with sizes available, 66 sold out, 1,732 photographs, 374/374 lead images resolving. Reconciliation of the old 56: 30 current SS26, 25 still published outside SS26 (not shown as current), 1 no longer listed.

## 4. Design pass around the photography

KAI shoots mostly 2:3 portraits — studio frames on light grey, and on-location frames full of terracotta and peach walls, pools, palms and sand. The concept's sea/sand/salt palette already sat in that light; the pass made the photographs the lead:

- Product stages follow KAI's 2:3 ratio (no cropped heads or hems); hover reveals KAI's second photograph; sold-out pieces desaturate; "New", "Sale" and "N sizes left" flags come from real data.
- KAI's square packshots (swim shorts, sarongs, scarves) are shown whole, letterboxed in their own backdrop colour, instead of having their sides cropped by the 2:3 stage. The colour comes from the photographs themselves: the sync reads the edge rows of all 77 square photos (70 flat — 62 of them KAI's #e3e3e3 studio grey; the 7 on-model linen-short crops keep the crop).
- Phone shop toolbar: the category row scrolls on its own line with size and the two toggles beneath it at full label width (they were squeezed into two- and three-line labels at 360–390 px), and the toolbar scrolls with the page on phones instead of pinning three rows of controls.
- Product page care: the piece's own care note where KAI gives one (62 products), plus the general "Care Instruction" block KAI's theme shows on every product page, quoted verbatim. (The first pass wrongly said KAI gives no care instructions for the other 312.)
- The WebGL hero now raises **KAI's own letterforms** out of the sea (CORS-clean texture from the logo PNG, rows 0–412 of 518); the film lockup completes the logo with the COLLECTIONS line cropped from KAI's own artwork rather than typesetting it.
- Escape doors and departments are opened by KAI's campaign photographs with a tide gradient for legibility; the kids panel pairs the Mini and grown-up Yellow Zebra photos.
- The Material Edit inspects KAI's own fabric close-ups; the builder lays KAI photos on the towel; the journal pairs KAI photographs with verbatim quotes and marks a product *Pictured* only when KAI uses that exact file on its page.
- Stores: KAI's store-front photograph beside the verified store list (store list re-read: 24 locations incl. stockists and two Dubai stockists named on About Us; Cairo Festival City shown as KAI lists it, temporarily closed).

## 5. Routes (all load directly and survive refresh)

`/` · `/shop` · `/shop/men` · `/shop/women` · `/shop/kids` · `/shop/swimwear` · `/shop/linen` · `/shop/resort` · `/shop/everyday` · `/shop/sets` · `/shop/new-arrivals` · `/shop/sale` · `/product/:handle` (374) · `/lookbook` · `/about` · `/stores` · `/showcase` (+ `?stage`, `?capture`, `?t=`, `?loop`) · 404.

## 6. Testing

{{TESTING}}

## 7. Film

{{FILM}}

## 8. Deployment readiness

`vercel.json` (Vite, `npm ci`, `npm run build`, `dist`, SPA rewrite excluding `/assets/` and `/film/`, immutable asset caching, `noindex`). No backend, no secrets, no localhost URLs in the bundle. Root Directory `kai-collections`; add `VITE_KAI_MEDIA=off` unless KAI approves public use of its media. `/showcase` on a clean checkout explains that the film is delivered separately. **Not deployed** (no authorisation).

Bundle: JS 765 KB (175 KB gzip) — of which the 374-product catalog is the largest part — CSS 61 KB (13 KB gzip); film code split into its own chunk.

## 9. Known limitations

- Prices and availability are a snapshot (2026-10-15), not live; the site says so on every product page. Re-run `npm run sync` to refresh (between two syncs five hours apart, 14 products changed price or stock).
- 95 products have no written composition on KAI's page; the concept shows the fabric named in the title and says the composition is not stated.
- Public hosting of KAI's photographs and logo needs KAI's permission (use `VITE_KAI_MEDIA=off` otherwise).
- kaicollections.ae could not be reached and Instagram redirects to a login wall from this environment; UAE storefront and social content are not audited directly.
- WebGL in headless/software renderers is slow; real GPUs render it in milliseconds. A CSS-gradient fallback covers browsers without WebGL.

## 10. Git delivery

{{GIT}}
