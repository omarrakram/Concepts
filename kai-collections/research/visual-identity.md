# Visual identity — what is KAI's, what is this concept's

Research for an **unofficial, speculative redesign concept**. Not affiliated with, endorsed by or connected to KAI Collections. The logo and photographs described here belong to KAI Collections.

This file replaces the earlier version, which was written from search-engine snapshots before the site could be reached and said that KAI's logo, colours, type and photography were "not seen". All of them have now been looked at directly.

## Provenance and method

| Tag | Meaning |
| --- | --- |
| **Direct (live site, 2026-10-15)** | Fetched or measured on kaicollections.com / KAI's Shopify CDN on 2026-10-15: HTML read with curl, computed styles read with Playwright Chromium (`getComputedStyle`, desktop 1440 × 900 and phone 390 × 844) on the homepage, `/collections/ss26-mens` and `/products/brown-linen-crinkle-cuban-shirt`, and images downloaded and looked at |
| **Direct (live site, 2026-10-16)** | Re-measured in a fact-check pass on 2026-10-16 with the same method. Sections marked "re-checked 2026-10-16" were confirmed that day; values that were corrected or first measured that day carry the 2026-10-16 label |
| **Indexed (search engines, ≤2026-10-14)** | Earlier search-index findings that could not be re-checked. None of the claims below rely on this tag; it is listed so the absence is explicit |
| **Press (year)** | Third-party press. Not used in this file (brand history is covered in `brand-audit.md`) |
| **Repo (concept source)** | What this concept's own code does, read from `src/` in this repository |
| *Inference* | My reading of the evidence, not something KAI states |

Image evidence went to a temporary scratch folder outside the repository. On 2026-10-15: the logo, 17 of the 18 campaign and tile images on the homepage, 84 product images from 31 products across all three departments (swim, linen, knit, sarongs), the product images with unusual file names discussed in 5.6, and a 120 px thumbnail of all 374 SS26 lead images. On 2026-10-16: the logo again, the 18th homepage tile, 200 px thumbnails of all 374 lead images (every one returned HTTP 200) and the individual frames cited below. None of it was saved into this repository.

---

## 1. At a glance

| Element | KAI, observed | Provenance | The concept's response (Repo) |
| --- | --- | --- | --- |
| Logo | Thin-stroke geometric **KAI** (the A has no crossbar), with **COLLECTIONS** tracked out to the full width of the mark underneath. Near-black PNG on a transparent ground | Direct (live site, 2026-10-15; re-checked 2026-10-16) | Uses KAI's own file from KAI's CDN in the header, footer and finale. The WebGL horizon draws KAI's own K-A-I letters as near-white relief standing on the water |
| Type | **Inter** everywhere in the theme. **Montserrat** only in three photo-banner blocks on the homepage | Direct (live site, 2026-10-15; re-checked 2026-10-16) | Fraunces Variable (display) + Jost Variable (UI). Neither appears on KAI's site |
| UI colour | Neutral greys and black: `#F6F6F6` ground, `#000000` text, black announcement bar and footer, `#FC0606` red only on "Sale" links, grey `#595959` sale badges | Direct (live site, 2026-10-15; re-checked 2026-10-16) | Warm proposal: salt `#F5F1E9`, sand `#D8CDBD`, Mediterranean blue `#285D74`, deep ocean `#173843` |
| Photography | Neutral-grey studio (most of the men's and all of the kids' range), square packshots for men's swim shorts, macro detail frames, and on-location frames (about a third of the women's leads, few of the men's) in front of terracotta and peach walls, pools, palms and beaches | Direct (live site, 2026-10-16) | Shows KAI's photographs unchanged, on a 2:3 stage that matches KAI's dominant ratio; square packshots on a flat backdrop are letterboxed whole in that backdrop colour. No stock or AI imagery is added |

---

## 2. The logo

### 2.1 The artwork — Direct (live site, 2026-10-15; re-checked 2026-10-16)

- **File:** `//kaicollections.com/cdn/shop/files/Untitled-2.png?v=1613517613`. The same file is at `https://cdn.shopify.com/s/files/1/1868/5457/files/Untitled-2.png?v=1613517613`, and both hosts send `Access-Control-Allow-Origin: *`.
- **Master size:** 1573 × 906 px, 8-bit RGBA PNG (42,521 bytes). The homepage's structured data (JSON-LD `"logo"`) references it as `Untitled-2_1573x.png`. With `&width=900` Shopify serves a **900 × 518** rendition, and the concept's numbers are taken from that rendition. Asking for `&width=1800` returns the 1573 px master (Shopify does not upscale). Both have the same proportions (≈ 1.74 : 1).
- **Version stamp:** `v=1613517613` is 16 Feb 2021 23:20 UTC read as a Unix timestamp. *Inference:* the file has not been replaced since around then.
- **Ink:** the KAI letters are solid `#231F20` and COLLECTIONS is `#2C2C2C`: two slightly different blacks on transparency. *Inference:* `#231F20` is the RGB value design software commonly gives to 100 % K black, which suggests the mark comes from print artwork. The two blacks suggest the two lines were set separately.

### 2.2 Measured geometry — Direct (live site, 2026-10-16)

Rows and columns counted on the alpha channel. "≥ 50 %" means pixels at least half opaque; the anti-aliased edge adds a few rows.

| Measure | 900 × 518 rendition | 1573 × 906 master |
| --- | --- | --- |
| "KAI" letters | rows **0–411** at ≥ 50 % alpha (0–414 counting faint anti-aliasing), ≈ 80 % of the height | rows 0–720 (721 rows = 79.6 %) |
| Gap | rows 412–477 at ≥ 50 % alpha | rows 721–834 (114 rows) |
| "COLLECTIONS" | rows 478–517 at ≥ 50 % alpha (475–517 counting anti-aliasing), ≈ 8 % | rows 835–905 (71 rows) |
| Width | "KAI" spans columns 5–895; COLLECTIONS spans 0–899, edge to edge | "KAI" spans 9–1565; COLLECTIONS spans 0–1572 |
| Vertical stroke of K and I | — | 30 px (1.9 % of the width, ≈ 4.2 % of the letter height) |
| Stroke of COLLECTIONS | — | 6 px, one fifth of the KAI stroke |
| KAI : COLLECTIONS height | ≈ 10 : 1 | ≈ 10 : 1 |

The concept's `kaiHeight: 413 / 518` (0.797) matches the master's 721 / 906 (0.796).

Letterforms, from looking at the master:

- **K**: a vertical stem plus a separate chevron. The two arms meet in a point about 24 px (master) to the right of the stem and never touch it.
- **A**: no crossbar, so it reads as an inverted V or a Greek Λ. The apex is cut flat (about 33 px wide in the top row).
- **I**: a single stem near the right edge (it ends 7 px short of it).
- **Spacing**: uneven. The gap between A and I (310 px) is much wider than the gap between K and A (about 190 px).
- **COLLECTIONS**: 11 light, monoline geometric capitals, tracked out so the first C starts at the left edge and the final S ends at the right edge. The C has angled terminals. I have not identified the typeface and do not name one.
- **Overall**: a thin, airy, architectural mark. It is drawn from straight strokes only, with no curves in "KAI".

### 2.3 Where KAI uses it — Direct (live site, 2026-10-15; re-checked 2026-10-16)

| Place | What is there |
| --- | --- |
| Header | `img.logo__img.logo__img--color`, alt "Kai Collections", rendered **90 × 52 CSS px** at both 1440 and 390 widths, srcset `width=90 / 180 / 270`. Left-aligned on desktop, centred between the menu and cart icons on the phone, on the `#F6F6F6` header |
| Footer | **No logo.** The black footer carries a newsletter block ("Join the community"), an "About" link list, social and payment icons and the line "© Kai Collections 2026" / "Powered by Shopify", which CSS sets in uppercase (Inter, tracked). No image of the mark |
| Mobile menu drawer | No logo (the homepage HTML has only the two header logo images, desktop and phone) |
| Favicon | None set: the page declares `<link rel="shortcut icon" href="data:;base64,iVBORw0KGgo=">` |
| Social preview | `og:image` is the RETREAT campaign banner, not the logo. `theme-color` is `#000000` |
| Store front | The homepage "Visit us" photograph (`Screenshot_2026-06-08_at_3.34.33_PM.png`, 1120 × 1306) shows the full KAI / COLLECTIONS lock-up twice: as a light, framed sign hung inside the glass entrance, and in black on a pale stone feature wall behind the counter. "FITTING ROOM" is set in spaced capitals over arched openings. The photo does not name the store |
| Product trims | **Swim-short back packshots** show a white woven label with a fine black border carrying the full lock-up, e.g. Abstract Blues (`KHK_5049_…jpg`). A **swimsuit close-up** shows a small engraved metal bar reading "KAI" with the crossbar-less A, stitched on through two eyelets (Rust Perla One Piece, `2.jpg_6.jpg`) |

**Takeaway (*Inference*):** online, the mark appears in one place only, the header, at 52 px high. Offline (signage, labels, hardware) it carries much more of the brand. The concept gives it the scale it has in the stores.

### 2.4 How the concept uses it — Repo (concept source)

- `src/data/media.ts`: `LOGO = { src: CDN + 'files/Untitled-2.png?v=1613517613', w: 900, h: 518, kaiHeight: 413 / 518, … }`, where CDN is `https://cdn.shopify.com/s/files/1/1868/5457/`. `kaiHeight` is the row measurement above.
- **Header:** `<Logo height={38} />`, centred between the link groups (30 px high at ≤ 760 px, 34 px in the mobile sheet).
- **Footer:** `<Logo height={84} tone="light" />` on deep ocean `#173843`; the stylesheet sizes it `clamp(64px, 7vw, 92px)`. The light tone is a CSS inversion (`filter: invert(1) brightness(1.04)`), so the black PNG shows as near-white.
- **Finale:** the same light logo at 92 px (64 px on phones).
- **WebGL horizon** (`src/gl/sea.ts`, `wordmarkCanvas`). The image is loaded with `crossOrigin = 'anonymous'` at `width=1800`, which returns the 1573 px master. Only the top `kaiHeight` of the artwork (the K-A-I letters, without COLLECTIONS) is drawn into the wordmark texture, with its baseline on the waterline. It is recoloured to white (`source-in`), lit as plaster relief from the sun's side using the alpha gradient, reflected in the waves and, while rising, refracted below the surface. The letter tint follows the light preset: `#FFFDF7` morning and noon, `#FFF6E6` golden, `#FBE7DA` dusk, `#E9EEEF` night.
- **Fallback:** if the logo fails to load, or the build sets `VITE_KAI_MEDIA=off`, the `Wordmark` component sets "KAI" in Fraunces 340 with 0.32em tracking. Its title is "Typeset stand-in — not KAI’s logo".
- The concept therefore **crops, recolours, inverts and relights** KAI's mark. Those are alterations of a trademark, and they are covered under Rights (§7).

---

## 3. Typography

### 3.1 What the site loads — Direct (live site, 2026-10-15; re-checked 2026-10-16)

- **Theme settings** (CSS custom properties in the homepage HTML): `--FONT-STACK-BODY`, `--FONT-STACK-HEADING`, `--FONT-STACK-ACCENT`, `--TYPE-STACK-NAV`, `--TYPE-STACK-BUTTON` and `--TYPE-STACK-KICKER` are all `Inter, sans-serif`. Weights are 400 and 500 (heading weight 400, bold 500). The theme variables set button, nav, accent and kicker type uppercase with 0.09em tracking (the rendered top nav overrides this with 0.2em, see 3.2), and the button radius is `0px`.
- **Inter** comes from Shopify's font library (`//kaicollections.com/cdn/fonts/inter/inter_n4…woff2`). Faces loaded in the browser: Inter 400, Inter 500, Inter 400 italic.
- **Montserrat** 400/500/700 comes from Google Fonts (`fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700`, linked three times). It is used by the three photo-banner blocks on the homepage (CSS classes starting `ai-fashion-hero__`), and nowhere else on the three page types sampled; no Montserrat face loads on the collection or product page.
- **Element counts.** On the desktop homepage, visible text elements use Inter 487 times and Montserrat 8 times (same result on both days). The collection and product pages use Inter only; their element counts depend on how much has lazy-loaded (173 and 89 in the 2026-10-15 pass, 270 and 116 after scrolling each page in full on 2026-10-16).
- **Weight 300.** The three carousel blocks (`ai-recommended-products__…`, stack `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) ask for weight 300 in their titles and prices, but no 300 face is loaded. *Inference:* the browser renders that text with the 400 face.

### 3.2 Computed styles — Direct (live site, 2026-10-15; re-checked 2026-10-16)

Desktop 1440 unless noted. "Case" means `text-transform`; "typed caps" means the source text is already uppercase.

| Role | Family / weight | Size | Tracking | Case | Colour |
| --- | --- | --- | --- | --- | --- |
| Announcement "INTERNATIONAL SHIPPING AVAILABLE" | Inter 400 | 14.5 px (13 px at 390) | 1.305 px (0.09em) | uppercase | `#FFFFFF` on `#000000` |
| Top nav HOME · MEN · WOMEN · KIDS · SALE · STORES | Inter 400 | 12 px | 2.4 px (0.2em) | uppercase | `#191008`; SALE `#FC0606` |
| Mega-menu heads (SUMMER, WINTER) | Inter 400 | 12 px | 2.4 px | uppercase | `#191008` |
| Mega-menu links | Inter 400 | 12 px | 2.4 px | as typed | `#5B554F`; "Sale" `#FC0606` |
| "NEW ARRIVALS" carousel title | Inter 300* | 18 px | −0.36 px | typed caps | `#000000` |
| "WE THINK YOU'LL LOVE", "FEW PIECES LEFT" | Inter 300* | 16 px | −0.32 px | typed caps | `#000000` |
| "TRENDING NOW" | Inter 400 | 20 px (16 px at 390) | 0.5 px | typed caps | `#000000` |
| "SHOP WOMEN", "SHOP MEN" | Inter 400 | 20 px (16 px at 390) | normal | typed caps | `#000000` |
| Tile captions under TRENDING NOW (LINEN · SETS · KNITWEAR · COVER UPS) and SHOP WOMEN (BESTSELLERS · SWIMWEAR · TOPS · BOTTOMS) | Inter 400 | 12 px (10.8 px at 390) | 1 px | uppercase | `#000000` |
| Tile captions under SHOP MEN (BESTSELLERS · SWIMWEAR · TOPS · BOTTOMS) | Inter 400 | 12 px (10.8 px at 390) | 2 px | uppercase | `#000000` |
| "VISIT US" | Inter 500 | 11 px | 2 px | uppercase | `#000000` |
| Banner titles SWIMWEAR, LAST CHANCE / LINENS | Montserrat 700 | 40 px / 50 px (24 / 30 px at 390) | 0.02em | uppercase | `#FFFFFF` on photo |
| Banner sublines | Montserrat 500 | 14 px (11.2 px at 390) | 0.08em | as typed | `#FFFFFF` |
| Banner links "shop now", "shop sale" | Montserrat 400 | 17 / 19 px | normal | **lowercase** (source text is "shop now", "SHop now" and "Shop sale") | `#FFFFFF` |
| Carousel product name | Inter 500 | 13 px | normal | as typed | `#000000` |
| Carousel price | Inter 300* | 13 px | normal | — | `#000000` |
| Collection grid name / price | Inter 500 / Inter 400 | 14.5 px / 13 px | normal | as typed | `#000000`; compare-at `#4A4A4A`, struck through |
| Sale badge "SAVE 49%" | Inter 500 | 11.5 px | 1.035 px | uppercase | `#FFFFFF` on `#595959` |
| Product page title | Inter 400 | 26 px (20 px at 390) | normal | as typed | `#000000` |
| Product page price | Inter 400 | **48 px** (32 px at 390) | 4.32 px (0.09em) | uppercase | `#000000`; compare-at `#4A4A4A`, struck through, same size |
| ADD TO CART · BUY IT NOW | Inter 500 | 13 px | 1.17 px (0.09em) | uppercase | outline 1 px `#000000` / solid `#000000` with white text; radius 0; 54 px high |
| Product accordions DESCRIPTION, RETURN POLICY… | Inter 500 | 13 px | 1.17 px | uppercase | `#000000` |
| "YOU MIGHT ALSO LIKE" | Inter 500 | 29 px | 2.61 px | uppercase | `#000000` |
| Body | Inter 400 | 14.5 px (13 px at 390) | normal | — | `#000000` |
| Footer heads / legal line | Inter 500 / 400 | 13 px | 1.17 px | uppercase | `rgba(255,255,255,0.9)` on `#000000` |

\* 300 requested, no 300 face loaded (see 3.1).

**Type set inside images (Direct).** The hero headlines are part of the image files and do not exist as text in the HTML: "RETREAT" does not occur anywhere in the homepage source (case-insensitive search, 2026-10-16).

- **Desktop hero** (`KAI_WEBSITE_HEADER_DESIGNS_…jpg`, 2500 × 1666): "RETREAT" in heavy, widely spaced italic capitals over "NEW ARRIVALS".
- **Phone hero** (`KAI_web_design__JPG.jpg`, 1125 × 1405): a *different* banner, reading "END OF SEASON SALE / UP TO 70% OFF / shop now →". So on the same day, desktop visitors are told "new arrivals" and phone visitors "end of season sale".
- Both hero images have `alt=""`. The homepage HTML has 19 `alt=""` attributes in all.
- I do not identify the typefaces inside these images.

**Observations (*Inference*):**

- KAI's site typography is the theme default, not a brand voice. One neutral sans covers almost everything.
- On the homepage alone there are seven different heading treatments: 18 px/300 typed caps, 16 px/300, 20 px/400 with +0.5 px tracking, 20 px/400, 11 px/500 tracked caps, Montserrat 700 at 40–50 px, and the type baked into the hero image.
- The logo's own type idea (thin strokes, all caps, very wide tracking) is echoed most closely by the 0.2em-tracked nav; the VISIT US kicker and the Shop men captions come near it (about 0.17–0.18em).

### 3.3 The concept's type — Repo (concept source)

- **Display: Fraunces Variable** (`@fontsource-variable/fraunces` 5.3.0, OFL-1.1, full axes plus italic). `.display` is weight 300 with `opsz 144, SOFT 60, WONK 0`, −0.025em tracking and 0.92 line-height. `.italic` uses `opsz 144, SOFT 100, WONK 1`, which gives "of escape." its swing. `.serif` text is weight 340 at `opsz 48, SOFT 50`.
- **UI and text: Jost Variable** (`@fontsource-variable/jost` 5.3.0, OFL-1.1). Labels are 11 px, weight 500, 0.22em tracking, uppercase; buttons are 12 px, 500, 0.2em, uppercase.
- **Rationale (concept, *not KAI's*):** KAI's site has no expressive voice. A soft high-contrast serif gives the editorial chapters one. Jost's geometric, wide-tracked capitals sit with the logo's tracked COLLECTIONS line and the 0.2em nav KAI already uses.
- KAI's own fonts (Inter, Montserrat) are not used in the concept.

---

## 4. Colour

### 4.1 UI colours actually rendered — Direct (live site, 2026-10-15; re-checked 2026-10-16)

| Role | Value | Where measured / theme variable |
| --- | --- | --- |
| Page and header ground | `#F6F6F6` | body sections and `header.theme__header`; `--COLOR-BG`, `--COLOR-NAV` |
| Image and card grounds | `#F9F9F9`, `#F4F4F4` | homepage carousel image wrappers (`#F9F9F9`) and category tiles (`#F4F4F4`) |
| Text | `#000000` | body; `--COLOR-TEXT` |
| Nav text | `#191008` | top nav; `--COLOR-NAV-TEXT` |
| Secondary nav text | `#5B554F` | mega-menu links; `--COLOR-NAV-TEXT-LIGHT` |
| Secondary text, compare-at price | `#4A4A4A` | struck-through prices; `--COLOR-TEXT-LIGHT` |
| Announcement bar | `#000000` / `#FFFFFF` | 38 px high on desktop |
| Footer | `#000000` / `rgba(255,255,255,0.9)` | `--COLOR-FOOTER-BG` |
| **Sale red** | **`#FC0606`** | **only** the SALE nav item and the "Sale" mega-menu links; `--COLOR-HIGHLIGHT-LINK`. Discounted prices themselves render black |
| Sale badge | `#595959` with white text | "SAVE 49%" etc.; `--COLOR-BADGE` |
| Primary buttons | `#000000` fill / white text; secondary: 1 px `#000000` outline | radius 0 |
| Size chip | selected `#292929` fill with white text; unselected `#6A6A6A` text on white with a `#CFCFCF` border | radius 2 px |
| Browser chrome | `#000000` | `<meta name="theme-color">` |
| Logo ink | `#231F20` / `#2C2C2C` | from the PNG (2.1) |

**Defined in the theme but not seen on the pages sampled.** Pipeline's alternative colour schemes are present as CSS variables: a "bright" scheme (`--BRIGHT-PRIMARY #EFBD1E` on `--BRIGHT-BG #FFF9D9`) and an "inverse" scheme (`--INVERSE-BG #333333` with peach `#FFE5DA` and pale blue `#DFF3FD` as primary and secondary). None of them rendered on the home, collection or product page.

**Sizes KAI hides (Direct, 2026-10-16).** On the sampled product page, KAI shows a chip only for the sizes in stock. For the Brown Linen Crinkle Cuban Shirt, KAI's product JSON lists S, M, L, XL and 2XL with M and XL unavailable, and the page showed chips for S, L and 2XL only.

### 4.2 Colour carried by the photography — Direct (live site, 2026-10-15), sampled; spot-checked 2026-10-16

*Inference:* the warmth in KAI's identity comes from its pictures, while the UI stays neutral. The values below are median colours of small regions in KAI images downloaded at 420–600 px wide. They are approximate: a re-sample on 2026-10-16 of different regions in the same images landed within a few steps of each value.

| Swatch | Approx. | Sampled from |
| --- | --- | --- |
| Terracotta wall | `#9D5839` | RETREAT hero, wall at left |
| Peach wall | `#C77750` | Women's White Linen Shirt lead (`DSC09247.jpg`) |
| Pink-peach stucco | `#D49D8C` | Women's Bestsellers tile (`DSC09379.jpg`) |
| Sand | `#CCAE99` | Swimwear banner (`IMG_2951.png`) |
| Shallow sea | `#99C4D3` | Brown Linen Crinkle Cuban Shirt lead (`DSC08365_…jpg`) |
| Sky | `#A4D0EF` | same image |
| Pool water | `#8AAEAC` | Mocha Perla One Piece lead (`DSC06883_1.jpg`) |
| Studio grey, model shots | `#C7C7C6`–`#D8D7D7` (≈ `#D4D4D2` mid-frame) | e.g. Teal Iris Bikini Bottom, Dusty Taupe linen |
| Studio grey, packshots | `#E3E3E3` (flat) | men's swim-short packshots |

### 4.3 The concept's palette against KAI's — Repo (concept source) vs Direct

| Concept token (`src/styles/base.css`) | Hex | Role | Nearest KAI evidence (Direct) |
| --- | --- | --- | --- |
| `--salt` | `#F5F1E9` | page ground | KAI UI `#F6F6F6`; the concept warms the neutral ground |
| `--ivory` | `#FFFDF7` | cards, buttons on dark, letter tint | — |
| `--sand` | `#D8CDBD` | toggle track (used once in the stylesheets); sand tones in the shader do the rest | photographed sand `#CCAE99` (the concept's is paler and greyer) |
| `--stone` | `#B8AA95` | defined, not used in the stylesheets | — |
| `--med` | `#285D74` | primary accent, tide hover | photographed sea `#99C4D3` and pool `#8AAEAC`; the concept takes the sea much deeper |
| `--deep` | `#173843` | dark chapters, footer | KAI's footer is pure `#000000` |
| `--gold` | `#E7BA78` | sun, focus on dark, selection | — |
| `--coral` / `--coral-ink` | `#D98770` / `#B0503A` | coral: saved-item heart, remove hover, size-error border. Coral-ink: bag badge, sale flag on cards, "few left" and "new" labels | peach wall `#C77750`, terracotta `#9D5839` |
| `.price__off` | `#96402D` | discount label | KAI uses black prices and a grey `#595959` badge |
| `--ink` / `--muted` | `#202827` / `#5C6866` | text | KAI `#000000` / `#4A4A4A` |
| `--studio` (`photo.css`) | `#E9E7E3` | ground behind KAI photographs | KAI packshot grey `#E3E3E3`; the concept's is slightly lighter and warmer. Square packshots are letterboxed in their own backdrop colour instead (the catalog's `bg`, `#E3E3E3` for most of them) |

- **Shader light presets** (`src/gl/sea.ts`). There are five, *morning, noon, golden, dusk* and *night*, and each sets sky, sea, sand, sun and letter colours. Example: noon sky `#5E9BBC`, sea `#123F55`–`#5B9AAE`, sand `#F1E6D2`–`#D6C3A2`.
- **What the concept changes (*Inference*):** it moves KAI from a grey-and-black storefront to a warm sand/salt ground with a deep-sea accent. The terracotta and peach walls that recur in KAI's location shoots become the concept's coral accents.
- **Shapes:** concept buttons are pills (`border-radius: 999px`) with a blue tide that fills from below on hover. KAI's are square (`0px`).
- **Sizes:** the concept's size picker (`src/components/SizePicker.tsx`) lists every size KAI lists and shows the ones KAI marks sold out as disabled (`aria-disabled`, announced as "sold out"), whereas KAI's own product page hides them (4.1).

---

## 5. Photography and art direction

### 5.1 The image set in numbers — Direct (live site, 2026-10-15; re-checked 2026-10-16)

- **Size of the set.** The 374 SS26 products (Men 181 · Women 175 · Kids 18) carry **1,732 images**.
  - Source: the catalog read from `/products.json` and `/collections/<handle>/products.json` on 2026-10-15 (`src/data/catalog.live.json`, `checkedAt 2026-10-15`, final sync).
  - Every lead image returned an image on 2026-10-15, and again on 2026-10-16.
- **Aspect ratios** (from the catalog's recorded pixel sizes):
  - 1,590 images (92 %) are **2:3 portraits** within 1 % (1,478 of them exactly 2:3); 1,187 are exactly 1200 × 1800.
  - **77 are square** within 1 % (52 exactly), and 45 of those are **lead** images: all 34 men's swim shorts, 6 men's linen shorts, 3 Sparkle Sarongs and 2 head scarves.
  - 15 of the 18 kids' lead images are 3712 × 4608 (4:5); 14 of those are `.webp` files.
  - The remaining 65 images have other ratios (21 of them 4:5).
- **Formats:** 1,670 jpg, 40 png, 17 webp, 5 heic. Shopify converts the heic files on delivery (WebP or PNG when a width is requested).
- **Lead-image grounds.** Counted by eye on 2026-10-16 from thumbnails of all 374 leads. Ranges show frames I could not class with confidence.

| Department | Studio (grey seamless, flat grey packshot or white ground) | Tinted studio ground | On location |
| --- | --- | --- | --- |
| Men (181) | ≈ 165–169 | — | ≈ 12–16 |
| Women (175) | ≈ 94–102 | ≈ 18 (printed sarongs worn on a pale pink-lilac ground) | ≈ 55–63 (the upper figure counts 6 frames against a plain peach wall) |
| Kids (18) | 18 (15 grey, 3 white) | — | 0 |

An automated edge-colour test on 2026-10-15 reported grey / white / other as men 143 / 16 / 22, women 76 / 10 / 89 and kids 15 / 3 / 0. Re-running a similar test on 2026-10-16 showed that the split depends heavily on thresholds (women's "other" ranged from 59 to 117 of 175), and its "other" class also catches tinted studio grounds and macro details, so it is not used as a location count.

**Pattern (*Inference*):**

- The **men's** range is sold through a grey studio and flat packshots; on-location leads are under one in ten.
- The **women's** range mixes studio and location: roughly a third of its leads are on location.
- The **kids'** range is studio only.

### 5.2 Studio — Direct (live site, 2026-10-15; re-checked 2026-10-16), from the images viewed

- **Set and light.** A neutral light-grey seamless (≈ `#D4D4D2`, lighter towards the centre) under soft, even, shadowless light.
- **Sequence.** Front, three-quarter and back views of the same look.
- **Models.** Barefoot or in flip-flops. Men in swimwear are usually shirtless and cropped from the waist or chest down.
- **Kids.** Framed from the head to mid-thigh, usually with hands on hips (one with arms crossed).
- **Second set.** A separate pure-white-ground set covers men's overshirts and linen trousers, several kids' shorts and the three Sparkle Sarong cut-outs.

### 5.3 Packshots and details — Direct (live site, 2026-10-15; re-checked 2026-10-16)

- **Men's swim shorts.** Square front and back packshots on a flat `#E3E3E3` ground, with no model, and the print fills the frame. Prints viewed include Yellow Zebra, Pink Giraffes, Pink Polar, Tipsy Sardine, Seaside Scribbles, Abstract Blues and Coral Paisley: illustrated, colourful and often humorous. The back view shows the woven KAI label (2.3).
- **Kids' second images.** Macro close-ups of the print with the grey drawcord and its metal tips (e.g. Mini Blue Aquatica, Mini Mosaic Seashells, Mini Pink Giraffes).
- **Garment details.** Collar and neckline close-ups (knit polos, linen shirts), linen texture with drawcord (Dark Mocha Linen Shorts), and the engraved metal KAI bar on a one-piece (Rust Perla).
- **Accessories.** The three Sparkle Sarongs are shot as flat cut-outs on white; the printed sarongs are worn by a model on a pale pink-lilac ground; most head scarves are tied into shape and laid on a pale ground.

### 5.4 On location — Direct (live site, 2026-10-15; re-checked 2026-10-16), from the images viewed

Settings seen in product and campaign frames:

- **Warm stucco** in terracotta, peach and pink, with stone staircases and handrails.
- **Architecture:** arched doorways, wooden shutters and louvres, courtyards with lanterns, woven, beaded and macramé curtains, white lattice walls.
- **Water:** pools edged with palms, parasols and loungers; sandy beaches with turquoise shallows; a wooden post at the shoreline.
- **Paths:** paved paths with bougainvillea; rocky gardens with white planters.
- **One urban set:** a bakery counter, a restaurant interior and a street.
- **Phone shots:** a few handheld, phone-style frames, e.g. the arm-out sunlit selfie that leads Butter Isla One Piece.
- **Light:** hard, clear sun with real shadows.
- **Models:** usually one per frame, looking away from the camera or straight into it, posed relaxed rather than editorial.

KAI does not name these locations on the pages sampled, and this file does not guess them.

### 5.5 Campaign images on the homepage — Direct (live site, 2026-10-15; re-checked 2026-10-16)

The homepage carries 18 campaign and tile image files.

| Slot | File | What it shows |
| --- | --- | --- |
| Hero, desktop | `KAI_WEBSITE_HEADER_DESIGNS_4acbd592-….jpg` (2500 × 1666) | A man in a white tee and dark-and-white swirl-print swim shorts beside a woman in a ruched brown one-piece and patterned headscarf, in front of a terracotta wall with a blue-grey door and white-cushioned wicker chairs. RETREAT / NEW ARRIVALS set into the image |
| Hero, phone | `KAI_web_design__JPG.jpg` (1125 × 1405) | A man in a blue linen shirt against a pale wall with stones on a ledge. END OF SEASON SALE / UP TO 70% OFF set into the image |
| Swimwear banner | `IMG_2951.png` | A woman in a black one-piece lying back on sand with a red bag; Montserrat overlay "SWIMWEAR / Effortless, elegant, worn all summer / shop now" |
| Linens banner | `IMG_3666.jpg` | A man in a white linen shirt in front of a woven curtain; overlay "LINENS / Lightweight, breathable, made for summer. / shop now" |
| Last chance banner | `bdb7ea9a7117416b444a429ed1e5c9a2.jpg` | A woman in a pale green one-piece on a bright beach with shade huts and umbrellas; overlay "LAST CHANCE / shop sale" |
| Tiles and Visit us | 13 further files: Trending now (4), Shop women (4), Shop men (4), Visit us (1) | All on location except the store photograph. `src/data/media.ts` lists 12 of them; the fourth Shop men tile (`IMG_3814.jpg`) is not in it, nor is the phone hero |

The banner copy quoted above is shown as rendered. In the homepage HTML the source text is "SWIMWEAR", "Effortless, elegant, worn all summer", "shop now"; "Linens", "Lightweight, breathable, made for summer.", "SHop now"; "LAST CHANCE", "Shop sale". The CSS sets the titles in uppercase and the links in lowercase.

### 5.6 Notes on the image set — Direct (live site, 2026-10-15; re-checked 2026-10-16 against the catalog)

- **Mixed sources.** File names show several origins:
  - `KHK_`/`KHE_`/`KHA_`/`KHF_` (1,209 images between them)
  - `IMG_`, `DSC`, `FullSizeRender`
  - `Screenshot…` (4 images, 3 distinct files)
  - `ChatGPTImage…` (17 images on 17 products, 9 of them lead images: e.g. the four Women's Ribbed Tank Tops, Olive Camels Swim Shorts, Women's Dusty Taupe Linen Top and Skirt)
  - `StudioShortsTry-On…` (3)
- **What the names do and don't show.** File names do not establish how a picture was made, and this was not checked further. Looked at, the `ChatGPTImage…` and `StudioShortsTry-On…` images sit inside the same grey-studio, packshot and close-up language as the rest. The `Screenshot…` product images are the bakery, restaurant and street frames (5.4).
- **For the concept.** It calls everything it shows "KAI's photographs". "KAI's product images" would be the safer wording wherever that cannot be vouched for (open item, §8).
- **Desktop and phone heroes disagree.** They carry different campaigns on the same day (5.5).

### 5.7 How the concept's art direction responds — Repo (concept source)

- **Photographs shown as published.** KAI's photographs are used unaltered, served by KAI's CDN at sizes chosen with `&width=` (`src/components/Photo.tsx`, `src/data/media.ts`). No stock, AI or retouched imagery is added. Where a photo is missing or media is off, a labelled illustrative sketch is shown.
- **Stage ratio.** The stage is **2:3** (`--photo-ratio: 2 / 3`), which matches 92 % of KAI's images. The ground behind photographs is `--studio #E9E7E3`.
  - **Square packshots.** Images that sit on a flat backdrop carry that colour as `bg` in the catalog (70 images, 39 of them leads: all 34 men's swim shorts, the 3 Sparkle Sarongs and 2 head scarves). Product cards and the product gallery show them whole in the 2:3 stage (`.stage--fit`, `object-fit: contain`), letterboxed in that colour.
  - **Open item:** the 6 square men's linen-short leads have no `bg`, so they are still `object-fit: cover`-cropped into the 2:3 stage, which trims a third of their width. They should be checked on screen.
- **Rendered sea and sand.** The WebGL sea and sand are the concept's own layer: rendered light, never a real place, labelled "rendered". They pick up the palette of KAI's location shoots (sun-bleached sand, shallow sea, terracotta dusk) without imitating any of its locations.
- **The Horizon chapter** places KAI's photographs of four pieces (all in stock at the 2026-10-15 sync) on that rendered waterline.
- **The Material Edit** inspects fabrics through KAI's own macro close-ups (5.3) with a loupe.
- **Avoided on purpose:** tropical clip-art, cartoon shells and palms, generic stock beach models, glassmorphism, dark "luxury" pastiche, and anything from BE-INDIE's photocopy/denim language.

---

## 6. Naming as part of the identity — Direct (live site, 2026-10-16)

Titles below are quoted as KAI's live `/products.json` gives them.

- **Colour-first, print-first names.** SS26 product names put colour and print first: "Yellow Zebra Swim Shorts", "Matcha Perla One Piece", "Rust Perla One Piece", "Butter  Isla One Piece" (with a double space), "Dusty Cherry Swim Shorts (4 Way Stretch)".
- **Italian and Spanish words and places.** Line names borrow them: Perla, Isla, Mare ("Festival del Mare Swim Shorts", "Festival del mare sarong"), Mallorca ("Mallorca Swim Shorts").
- **Lines outside SS26.** The full `/products.json` (1,051 published products) also lists swim lines that are not in the SS26 collections, mostly one-pieces: Playa (e.g. "Cobalt Blue Playa One Piece"), Isola ("Pear Isola One Piece"), Palma and Sorrento.
- **Concept use (Repo).** The concept uses KAI's product names with apostrophes, spacing and capitalisation made consistent by the catalog sync (`scripts/sync-catalog.mjs`), so some differ in form from KAI's titles (e.g. "Butter Isla One Piece", "Festival del Mare Sarong"). It never draws or recolours a print.

---

## 7. Rights

- **Ownership.** The KAI COLLECTIONS logo (`Untitled-2.png`), all product, campaign and store photographs, and the print artwork they show belong to **KAI Collections**. Nothing in this concept transfers or implies any licence.
- **Referenced, not stored (Repo).** The concept references these files by URL from KAI's own CDN (`cdn.shopify.com/s/files/1/1868/5457/…`, the store KAI's site serves; `Access-Control-Allow-Origin: *` checked on 2026-10-15 and 2026-10-16). It does not store them.
  - `git ls-files` (the staged index, re-checked 2026-10-16) lists no raster image or video file under `kai-collections/`. The only image file in it is the concept's own `public/favicon.svg` (a sun over water, no KAI artwork).
  - The last commit on the branch (`bc612d4`) still contains the earlier film, screenshots and plates, which are staged for deletion. They were made before KAI's media could be reached, and the implementation report in that commit says there was "No KAI or stock imagery anywhere". I did not re-check the files themselves.
  - The unit test "repository rights hygiene" (`tests/unit/catalog.test.ts`) fails if a raster image or video file (`jpg`, `png`, `webp`, `heic`, `avif`, `gif`, `mp4`) appears in `src/` or `public/` outside the git-ignored film folders. It does not scan other folders.
  - Locally generated captures (`public/film/before/`, `public/film/plates/`, `output/screenshots/`, `dist/`) are git-ignored and delivered separately.
- **Alterations.** The concept crops KAI's logo to its letters, recolours it white, inverts it on dark grounds and lights it as relief in WebGL (2.4). Any approval from KAI should cover those treatments, not only display of the file.
- **Public hosting needs KAI's permission.** Without it, build with `VITE_KAI_MEDIA=off`. With that flag set, `MEDIA_ON` is false and the build loads no KAI-hosted media:
  - logos fall back to the typeset Fraunces stand-in that says it is not KAI's logo;
  - the horizon uses the typeset letters;
  - products show the concept's labelled sketches.
  - The README's "Rights & media" and deploy sections say the same.
- **Fonts.**
  - The concept uses Fraunces and Jost under the SIL Open Font License 1.1 (Fontsource 5.3.0 packages).
  - KAI's Inter and Montserrat are not used by the concept.
- **Credit in the concept.** With media on, the footer states "Logo and photographs © KAI Collections, shown from KAI’s own servers for this proposal". "The art of escape" is labelled as concept copy, not a KAI slogan.

---

## 8. Could not verify, and open items

- **kaicollections.ae:** the connection fails (HTTP 000) from this environment (re-checked 2026-10-16), so the UAE storefront's logo, type and colour could not be compared.
- **Instagram** (`instagram.com/kaicollections.eg`): redirects (302) to a login wall (re-checked 2026-10-16). KAI's social art direction, grid, highlights and stories were not seen.
- **Brand guidelines.** No vector logo, colour specification, typeface for "COLLECTIONS", clear-space or minimum-size rule is published on the pages checked. Everything in §2 is measured from the PNG.
- **Packaging, swing tags, bags.** Not seen. The only physical brand items seen are the woven label, the metal bar and the store signage, and those only inside KAI's photographs.
- **Shoot locations, photographers, models.** Not named on the pages sampled, and not guessed here.
- **How some images were made.** File names such as `ChatGPTImage…` and `StudioShortsTry-On…` were observed (5.6); how those images were produced was not established.
- **Lead-image ground counts** (5.1) are by eye and given as ranges; an automated split proved threshold-sensitive.
- **Scope of the computed-style sample.** It covers three page types at two widths. Other templates (search, cart, account, blog, store list) were not sampled, and the homepage changes with campaigns: desktop and phone heroes already differ.
- **Open item (concept):** check how the 6 square men's linen-short leads, which have no recorded backdrop colour, crop in the 2:3 stage (5.7).
- **Open item (concept):** where an image's origin is not known, say "KAI's product images" rather than "photographs" (5.6).
