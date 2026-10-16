# Current site audit — kaicollections.com

Unofficial research for a speculative redesign concept. Not affiliated with KAI Collections.

**What this is.** A direct audit of the live storefront at **kaicollections.com**, made on **2026-10-15** at desktop width (1440 × 900) and phone width (390 × 844, touch, 2× pixel ratio, iPhone user agent). Pages were opened in Playwright's Chromium (through the container's egress proxy), screenshotted and inspected; HTML and Shopify's public JSON endpoints (`/products.json`, `/products/<handle>.js`, `/cart.js`) were read with curl. Screenshots and downloaded pages were kept in local scratch space outside the repository and are **not** committed.

**Provenance labels used below.**
- **Direct (live site, 2026-10-15)**: seen or measured on the live site today. Unless a line says otherwise, every observation in sections 1–12 is Direct (live site, 2026-10-15).
- **Indexed (search engines, ≤2026-10-14)**: an earlier finding from search-engine snapshots, kept only in "Previously indexed findings" with its current status.
- **Concept (this repository's code)**: how the redesign responds. These lines describe the concept, not KAI.

**Limits.** No order was placed and no personal data was entered. Checkout was not opened. One item was added to a cart to see the cart drawer, and the cart was emptied again with `/cart/clear.js`. Timings are single lab runs from a datacenter through a proxy, not field data. Only one network location was available, so geolocation-dependent behaviour (for example currency by country) could not be tested.

---

## 1. Platform and catalogue — Direct (live site, 2026-10-15)

| Item | Observed |
| --- | --- |
| Platform / theme | Shopify, theme **Pipeline 8.0.0** (`theme_store_id` 739), published theme named "SS26 June drop"; shop domain `kai-designs.myshopify.com` |
| Currency / locale | `Shopify.currency` active **EGP**, `Shopify.country` "EG", `Shopify.locale` "en"; the only available language is `en` |
| Catalogue | `/products.json` lists **1,051** published products; **467** had at least one size available at a re-check later in the day (470 at the morning check) |
| SS26 departments (the concept's scope) | `ss26-mens` 181 · `ss26-womens` 175 · `ss26-kids-swim` 18 = **374** products; 308 with a size available at the re-check (311 at the morning sync) |
| Logo | `Untitled-2.png?v=1613517613`, rendered 90 × 52 in the header, alt "Kai Collections" |
| Fonts | Inter (served from KAI's own `/cdn/fonts/`) for the theme; Montserrat from Google Fonts, loaded by the homepage banner blocks |

---

## 2. Information architecture and navigation — Direct (live site, 2026-10-15)

**Header (desktop).** Black announcement bar, then logo left, six text links centred (**HOME · MEN · WOMEN · KIDS · SALE · STORES**, SALE in red), account, search and cart icons right. The header stays pinned when scrolling; the announcement bar scrolls away.

**Mega menus (desktop).** Hover or keyboard focus opens a text-only panel (no images) with two columns:

| Menu | Summer column | Winter column |
| --- | --- | --- |
| Men | Shop all `/collections/ss26-mens` · Best sellers `ss26-mens-copy` · Swimwear · Linen · Knitwear · T-Shirts · Shirts · Pants · Shorts · Matching sets · Sale `black-friday-sale-ss25-copy` | Shop all `winter-collection` · Coats & Jackets · Matching Sets · Knitwear · Tops · Pants · Sale `mens-black-friday-sale-ss25-copy` |
| Women | Shop all `ss26-womens` · Bestsellers `ss26-womens-copy` · Swimwear · Linens · Tops · Bottoms · Skirts & dresses · Cover ups · Matching Sets · Accessories · Sale `black-friday-sale-ss25-copy-1` | Shop all `womens-winter-collection-25-26` · Coats & Jackets · Matching Sets · Tops · Pants · Sale `womens-sale-2025-summer-copy` |
| Kids | Kids Swimwear `ss26-kids-swim` · Sale `kids-black-friday-sale-ss25` | — |
| Sale | `black-friday-sale-ss25`, with Men and Women children | — |
| Stores | `/pages/store-list` | — |

**Naming behind the menu.** The page `<title>`s of the sale collections read "2025 ALL SALE", "Mens sale - 2025 summer", "Womens sale - 2025 summer", "Mens sale - 2025 winter", "Womens sale - 2025 winter" and "Kids Black Friday Sale - SS25"; the men's winter "Shop all" is titled "Mens - FW25". Handles mix seasons and "copy" suffixes (the Women › Winter › Sale link points to a handle containing "summer"; Best sellers live at `ss26-mens-copy` / `ss26-womens-copy`). Collection titles are not printed on the collection pages themselves (section 4), so shoppers mostly see these names in browser tabs and search snippets.

**Collections that exist but are not linked** from the header menu or homepage: `/collections/new-arrivals` ("New Arrivals", 374 products, mixed seasons including 12 of type "Jackets"), `/collections/like-father-like-son` ("Kids Like Father Like Son - SS25", 30 products, 10 with a size available), `/collections/kids-collection-bs` and `/collections/kids-collection-na` (titles "Kids Collection BS" and "Kids Collection NA"). All return HTTP 200.

**Phone navigation.** The header shows only a menu button, the centred logo and the cart; search and My Account live inside the menu. The menu is a full-width drawer with sliding levels: HOME · MEN › · WOMEN › · KIDS › · SALE › · STORES. MEN opens SUMMER › / WINTER ›, which then open the category lists. Reaching men's swimwear takes four taps (menu, MEN, SUMMER, Swimwear).

---

## 3. Homepage — Direct (live site, 2026-10-15)

Module order is the same on desktop and phone. The phone layout stacks tiles 2 × 2, shows about 1.7 carousel cards at a time with a QUICK ADD button under each card, and collapses the footer's ABOUT list into an accordion.

| # | Module | What it shows / where it links |
| --- | --- | --- |
| 1 | Announcement bar | "International Shipping Available" (displayed in capitals), static, not a link |
| 2 | Hero | One link wrapping two images: a desktop image (RETREAT / NEW ARRIVALS) and a phone image (END OF SEASON SALE / UP TO 70% OFF / shop now). **All of this text is inside the pictures**, both of which have `alt=""`, and the block's text container is empty. Both images link to `/collections/ss26-copy` (titled "SS26 New arrivals"). Desktop and phone therefore carry different campaign messages. |
| 3 | NEW ARRIVALS carousel | 50 products, all from SS26 Women; at the re-check 11 of the 50 had no size available, 10 had one size left, and all 50 carry a compare-at price |
| 4 | TRENDING NOW | 4 photo tiles: Linen → men's linen, Sets → women's sets, Knitwear → men's knitwear, Cover ups → women's cover-ups |
| 5 | SWIMWEAR banner | "Effortless, elegant, worn all summer" + "shop now" → **women's** swimwear only |
| 6 | SHOP WOMEN | Bestsellers · Swimwear · Tops · Bottoms. The **Bestsellers tile links to `/collections/ss26-womens-linen`**, not to the women's bestsellers collection |
| 7 | SHOP MEN | Bestsellers · Swimwear · Tops · Bottoms. The **Bestsellers tile links to `/collections/ss26-mens` (shop all)**, not to `ss26-mens-copy`; Tops links to `mens-short-sleeve-shirts-ss25-copy` (titled "SS26 Mens Tops") |
| 8 | LINENS banner | "Lightweight, breathable, made for summer." + "shop now" → **men's** linen only |
| 9 | WE THINK YOU'LL LOVE | 50 products, all SS26 Men; 7 with no size available at the re-check |
| 10 | LAST CHANCE banner | "shop sale" → `/collections/black-friday-sale-ss25` ("2025 ALL SALE") |
| 11 | FEW PIECES LEFT | 50 products, 45 of them outside the three SS26 department collections (wool jackets, modal kimonos, sparkle swimwear and similar). At the re-check, **11 had no size available** and 10 had one size left |
| 12 | VISIT US | Store photo slideshow, "Pass by a store to try on the latest arrivals in person." and "Find a Store" → `/pages/store-list` |
| 13 | Footer | See section 8 |

Other observations:
- The page has 172 `<img>` elements and 150 product cards (three 50-item carousels).
- There is no brand-story module: nothing from About Us (the meaning of *kai*, founded 2018, made in Cairo) appears on the homepage. The only kids entry point is the menu.
- The hero, the three banners and the WE THINK YOU'LL LOVE carousel are custom blocks whose IDs or class names contain `ai_gen_block` / `aigenblock`. That naming suggests blocks generated with Shopify's AI block tool; this is an inference from the names only. Each banner block carries its own CSS, and each adds its own Google Fonts `<link>` for Montserrat (three identical links).
- No newsletter or discount popup appeared during a 15-second wait on desktop or on any page visited. The theme's popups section is empty.

---

## 4. Collection page (`/collections/ss26-mens`) — Direct (live site, 2026-10-15)

- **No visible title.** The collection name ("SS26 Mens") appears only in `<title>`. The page has no H1 and no intro text.
- **Sub-collection strip** at the top (another `aigenblock` block): photo cards for Mens best sellers, Matching sets, All swimwear, All linen, All knitwear, All T-shirts, All shirts, All pants, All shorts.
- **Desktop toolbar.** HIDE FILTERS / FEATURED (sort), and grid-density icons (three densities). The filter sidebar has collapsible groups:
  - **Availability:** In stock / Out of stock.
  - **Size:** the first 10 values show, then "SHOW MORE".
  - **Price:** a slider with "From / To" fields labelled with the symbol **ج.م**, while every price on the page reads "EGP …".
- **Size filter values: 31 distinct strings** on SS26 Mens alone. These include XS, S, Small, M, Medium, L, Large, XL, X-Large, 2XL, 2X-Large, "2X-Large (38)", "2XL (38-40)", "2XL(38-40)", "3XL (40- 42)", "3XL (40-42)", "M (32-34)", "M ( 32-34)", "Medium (30-32)", "Medium (32)", "Small (28-30)", "Small (30)" and "XL(36-38)". The same size therefore appears under several spellings.
- **Sort options (9):** Featured, Most relevant, Best selling, Alphabetically A–Z / Z–A, Price low–high / high–low, Date old–new / new–old.
- **Filters and sort are URL-based** (`filter.v.availability`, `filter.v.option.size`, `filter.v.price.gte/lte`). `?filter.v.availability=1` reduces SS26 Mens from 10 pages to 9.
- **Pagination:** numbered pages ("1 2 3 … 10"), 20 products per page, `?page=n`. There is no infinite scroll and no "load more". The product count is not shown.
- **Product card (desktop, 4 across).** The parts are:
  - Image with a **"SAVE nn%" badge** (seen: 41%, 49%, 50%, 59%) or **"SOLD OUT"** badge.
  - Name, then the sale price followed by the struck-through compare-at price.
  - An italic "Sold Out" line under the price on sold-out items.
  - On hover, the card auto-advances through the product's photos (progress bars at the top) and shows a QUICK VIEW button.
- **Quick view.** A right-hand drawer with name, price and compare-at, one photo, size buttons and ADD TO CART. Here **sold-out sizes are shown crossed out** (labelled "Variant sold out or unavailable"), unlike the product page (section 5).
- **Phone.** The sub-collection strip scrolls sideways; the toolbar reads FILTER / SORT plus a 1- or 2-column toggle. The filter opens as a full-height drawer from the left (Availability, Size, Price). Each card has a small quick-add cart button. The grid shows two columns.
- **Images.** Grid images are cropped server-side (`crop=center&width=350&height=525` on desktop, 332 × 498 on phone). Most are on-model photos; some swim shorts are packshots on grey, so the grid mixes two photo styles.

---

## 5. Product page (`/products/festival-del-mare-swim-shorts`, plus `black-cala-one-piece` and `ivory-azure-one-piece`) — Direct (live site, 2026-10-15)

- **Gallery.**
  - Desktop: a large image with zoom and previous/next, and a row of 8 thumbnails below.
  - Phone: a swipeable main image with a scrolling thumbnail strip.
  - Main images have alt text equal to the product name; 11 of 27 product-image elements on the desktop page have `alt=""`.
- **Title and price.** The H1 is the product name. The sale price is shown very large (EGP 1,189.00) with the compare-at price struck through below it at the same size (EGP 1,699.00). The PDP shows **no percentage saved**; that appears only on cards.
- **Size selector: sold-out sizes are hidden.**
  - Festival del Mare has 7 sizes in its data, XS (28-30) to 3XL (40-42). The page shows only the 4 available ones (S, L, XL, 3XL); XS, M and 2XL are not displayed at all.
  - The description says the model wears size Medium, and Medium is one of the hidden sizes.
  - Black Cala One Piece shows 2 of its 5 sizes (XS, L).
  - A fully sold-out product (Ivory Azure One Piece) lists all its sizes, and the add button reads "SOLD OUT • EGP 1,199.00"; a BUY IT NOW button is still rendered.
  - No notify-me / back-in-stock option was found.
- **Buttons.** "ADD TO CART • EGP 1,189.00" (outlined) and "BUY IT NOW" (black, Shopify accelerated checkout).
- **Description structure.** Three accordions: DESCRIPTION (open, clipped, with "Read more"), RETURN POLICY and CARE INSTRUCTION.
  - **Description.** Festival del Mare opens with a generic paragraph ("Discover this seasons must-have swimwear for men with our premium mens swim shorts. …"). Then come "Size tip: Sizes fit true to size (Check Size Guide)" (underlined but **not a link**) and a factual "Details" list: 100% polyester, mesh lining, "Custom Metal Engraved Drawcord (Nickel-Free)", pockets, treated against chlorine, salt water and UV, "Made in Egypt", and "Model is 192 cm and 88 kg wearing size Medium". The list ends with an **icon strip image** reading Quick Drying / UPF 40 Protection / Chlorine Resistant / Salt-Water Resistant, with `alt=""`. The "UPF 40" claim exists only inside that image.
  - **Boilerplate.** 32 of the 40 products in `ss26-mens-swimwear` open their description with that same paragraph; the other 8 share a second one ("Introducing our collection of 4-Way Stretch premium men's swim shorts…").
  - **Return policy** starts "You Can Exchange Or Return This Item Within 14 days of Receiving Your Order as Long as The Item is New/ Not Used/ Not Washed and With All Original Tags/Packaging" and states "*International Orders Are Not Applicable for Exchange/Refund".
  - **Care instruction** is identical on the swim shorts, a linen shirt (`brown-linen-crinkle-cuban-shirt`) and a one-piece. It reads "Rinse Immediately After Use", "Machine Wash Cold With Like Colors", "Do Not Tumble Dry", "Do Not Iron", "Do Not Bleach", "Do Not Use Fabric Softeners". It is a theme-level block, not product-specific.
- **Size guide.** There is no size-guide link or popup near the size selector. The guide is reachable from the footer (`/pages/size-guide-ss19`, titled "Size Guides"), where every chart is an **image**: some file names date from 2018–2019 ("SIZE-2019-final-final…", "Screen_Shot_2018-12-04…"), and most charts have empty or missing alt.
- **Reviews.** The Loox reviews app is embedded and the Product JSON-LD declares `aggregateRating` 5.0 from 4 ratings, but **no rating or review widget was visible** on the page at either width.
- **Related products.** "YOU MIGHT ALSO LIKE" carousel of similar items (for Festival del Mare: Navy Stingrays, Summers In Europe, Yellow Paisley, Tipsy Sardine and Seaside Scribbles swim shorts), with SAVE badges and quick view.
- **Not present.** Breadcrumbs, colour swatches or links to other colourways, a "complete the look" or matching-set link, and a sticky add-to-cart bar on phone (only the header stays pinned).

---

## 6. Cart — Direct (live site, 2026-10-15)

- **ADD TO CART** opens no drawer. The button turns into a check mark, and a strip replaces the header: "FESTIVAL DEL MARE SWIM SHORTS S (30-32) ADDED TO CART", with a thumbnail and "VIEW CART".
- **Cart drawer.** It opens from the right (450 px on desktop, full width on phone) over a blurred page. It contains:
  - Line item: thumbnail, name, size, struck compare-at and sale price, a − 1 + quantity stepper and a trash icon.
  - "Special instructions for seller" (collapsible notes field) and "Shipping & taxes calculated at checkout".
  - A black button reading "CHECK OUT • EGP 1,189.00 EGP". The currency appears twice.
- **Not present.** Free-shipping threshold or progress, delivery estimate, upsell, saved items.
- `/cart.js` reported `"currency":"EGP"`.

---

## 7. Search — Direct (live site, 2026-10-15)

- **Desktop.** The search icon opens a full-screen overlay. Typing "linen" shows:
  - "10 results: 7 suggestions, 3 products" (screen-reader text).
  - SUGGESTIONS: linen, linen pants, linen shirt, linen top.
  - PRODUCTS (3, with photo and prices).
  - COLLECTIONS: "SS26 Mens linen", "SS26 Womens linen", and "Striped Linen Shirt", a collection named like a product.
  - A "SEARCH FOR 'LINEN'" button.
- **Phone.** The search field sits at the top of the menu drawer with the same predictive panel. For "swim", **2 of the 3 suggested products were sold out** (Ivory Azure One Piece, Lyra Blossom One Piece).
- **Results page (`/search?q=linen`).**
  - The `<title>` reads "Search: 252 results found for "linen"", but the page itself shows no count and has no H1.
  - Results are listed one per row (thumbnail, name, prices), 11 pages.
  - The page has the same filter sidebar as collections, whose size list here repeats XS / X-SMALL, S / SMALL, M / MEDIUM and so on. No sort control was visible.
  - Results are not limited to SS26: 3 of the 24 products on page 1 are outside the three SS26 department collections.

---

## 8. Footer, announcement bar and popups — Direct (live site, 2026-10-15)

- **Footer (black).** It contains:
  - "JOIN THE COMMUNITY" / "Be the first to discover new drops and special offers" and an email field.
  - ABOUT: About Us, Stores, Refund policy, Shipping, Size Guide, Contact Us, FAQ, Terms of Service.
  - Payment icons: American Express, Apple Pay, Mastercard, Visa.
  - "© KAI COLLECTIONS 2026", "POWERED BY SHOPIFY" and Facebook, TikTok and Instagram icons (`kaicollections.eg`).
- **No locale switcher.** There is no country, currency or language selector anywhere in the footer or header.
- **Announcement bar.** One static message, "International Shipping Available", on every page.
- **Popups.** None observed (section 3).
- **Standard pages.** The Stores, Shipping and Size Guide pages all open with the same row of five store and product photos, a gallery that comes from the page template rather than from the page's content.
- **Stores page.**
  - Lists the Cairo, Alexandria, North Coast and Red Sea stores and the stockists. Cairo Festival City carries a "(TEMPORARILY CLOSED)" prefix.
  - The Red Sea heading is spelled "READ SEA, EGYPT".
  - Matcha Caesar's "Mobile:" has no number.
  - Store names link to Google Maps; phone numbers are plain text, not `tel:` links. No opening hours are given.
- **Shipping page.** Local fees "80 EGP Cairo/Giza", "90 EGP Alexandria", "100 EGP All Other Governorates", "120 EGP North Coast (SAHEL)"; international via DHL and Aramex; "Fixed 40$ (2000 EGP) Flat international shipping fee on all international orders".

---

## 9. Currency — Direct (live site, 2026-10-15)

- **EGP everywhere tested.** Prices read "EGP …" on the homepage, collections, search, product pages, quick view and cart. `og:price:currency` is EGP and `/cart.js` returns EGP.
- **No switching found.**
  - `?currency=USD` is ignored (`Shopify.currency` stays EGP).
  - `/en-us`, `/en-ae` and `/ar` return 404.
  - No currency selector is offered.
  - `localization.availableCountries` lists many countries (international shipping), but only one currency was ever served.
- **USD appears once:** the Shipping page's "Fixed 40$ (2000 EGP)" international fee.
- **One inconsistency:** the price filter uses the symbol ج.م instead of "EGP".
- **Not tested:** whether visitors in other countries are shown other currencies (one network location only).

---

## 10. Performance signals — Direct (live site, 2026-10-15), lab measurements

Measured with Chrome DevTools Protocol transfer sizes (`encodedDataLength`). The page was loaded, left for 4 s, then scrolled to the bottom so lazy images loaded. These are single runs through a proxy, so treat them as orders of magnitude, not benchmarks.

| Homepage | Desktop 1440 (2 runs) | Phone 390 |
| --- | --- | --- |
| Requests / transfer before scrolling | 119–133 / ≈4.5–4.7 MB | 132 / ≈5.3 MB |
| Requests / transfer after full scroll | 191–224 / ≈6.9–7.0 MB | 198 / ≈6.6 MB |
| Images | 49 requests, ≈5.2 MB (48 WebP, 1 PNG logo) | 46 requests, ≈4.9 MB (44 WebP, 1 AVIF, 1 PNG) |
| Scripts | 46 script requests ≈0.59 MB, **plus** 65–95 Shopify `checkout-web` JS chunks ≈0.72–0.81 MB fetched without any cart action (a `speculationrules` file is fetched alongside them) | 47 ≈0.60 MB plus 70 checkout chunks ≈0.74 MB |
| Fonts | 4 files ≈160 KB (Inter ×3 from KAI's CDN, Montserrat from Google Fonts) | same |
| First contentful paint / load event | 1.2–1.6 s / 2.6–4.8 s | 1.5 s / 3.5 s |
| DOM | 172 `<img>`, 91 `<script>` elements, 1 iframe (web-pixel sandbox); HTML ≈835 KB uncompressed | same markup |

Observations:
- **The CDN does format work well.** `kaicollections.com/cdn/shop/files/…` and `cdn.shopify.com` resize on `&width=` and serve WebP (one AVIF) for `.jpg`, `.png` and `.heic` originals. Carousel cards request 600-px files, homepage tiles 800 px and collection grids 350 × 525, and most images are `loading="lazy"`.
- **The banner blocks bypass responsive images.**
  - The three banners request a single `src` at `&width=2400` with **no `srcset`**, so a 390-px phone downloads the same files as a desktop: `IMG_2951.png` (≈655 KB as WebP), `IMG_3666.jpg` (≈571 KB) and `bdb7ea9a…jpg` (≈186 KB). These are the three largest image transfers on the phone.
  - The hero images (`&width=2000` desktop, `&width=1000` phone) are marked `loading="lazy"` even though the hero is the first, largest element on screen, which delays the likely Largest Contentful Paint image.
- **Weight comes from quantity.** Three 50-product carousels (150 cards) put 172 images in the markup. The page also prefetches checkout code before the visitor has added anything.

---

## 11. Accessibility quick checks — Direct (live site, 2026-10-15)

Positives:
- `lang="en"` is set, and a "Skip to content" link is the first Tab stop.
- Keyboard focus shows a visible outline (browser default, `outline: auto 5px`).
- Tabbing onto MEN opens its mega menu and walks through the links.
- The PDP has a single H1 (product name).

Issues:
- **Heading structure.**
  - Homepage: three H1s, which are the banner titles SWIMWEAR, LINENS and LAST CHANCE, and no H1 that names the page or brand. Section titles are H2, and each of the 150 product cards is an H3.
  - Collection and search pages: no H1 at all. On collections the first headings are the sub-collection cards (H3) and "Sort" (H2).
- **Alt text.**
  - The hero images have `alt=""`. Their campaign text exists only inside the images, and the hero link contains nothing else, so the link has no accessible name.
  - The three banner images also have `alt=""`, though their text is real HTML.
  - Homepage carousel images use the product name as alt.
  - Collection grid images: **40 of 40** product images have `alt=""` on desktop, 20 of 20 on phone. The card's text still names the product, but the photo itself is not described.
  - The PDP icon strip carrying "UPF 40 Protection" has `alt=""`.
  - Size charts are images without useful alt.
- **Contrast.** White banner subheads (for example "Lightweight, breathable, made for summer.") over bright photos looked faint in the phone screenshots. This is a visual observation; contrast ratios were not measured.
- **Inconsistency.** Sold-out sizes are invisible on the PDP but crossed out in quick view, so the same product presents two different size lists.
- **Stores.** Phone numbers are not tappable `tel:` links.

---

## 12. SEO basics — Direct (live site, 2026-10-15)

| Page | Observed |
| --- | --- |
| Homepage | `<title>` "KAI Collections"; meta description and `og:description` "Premium swim & ready-to-wear in Egypt and UAE"; `og:image` the RETREAT banner (2500 × 1666); canonical set; no `twitter:` tags; no hreflang. JSON-LD: `Organization` (logo, `sameAs` with Facebook and Instagram plus seven empty strings) and `WebSite` with a `SearchAction` |
| Collections | `<title>` "SS26 Mens – Kai Collections" (similarly for other collections); **no meta description tag**; no H1; JSON-LD `Organization` only |
| Product | `<title>` "Festival del Mare Swim Shorts – Kai Collections"; meta description = the start of the shared boilerplate paragraph (identical on the three other swim-shorts pages checked); `og:type` product with `og:price` 1,189.00 EGP. JSON-LD `Product` with one `Offer` per size (SKU, GTIN-13, `InStock`/`OutOfStock`, EGP price, `priceValidUntil` 2026-10-17) and `aggregateRating` 5.0 / 4, while no reviews are visible on the page |
| Site files | `robots.txt` points to `sitemap.xml`; the sitemap index lists products (2 files), pages, collections, blogs and a `sitemap_agentic_discovery.xml` |
| Naming | Season and promotion codes appear in public titles ("Mens - FW25", "Kids Black Friday Sale - SS25", "Womens sale - 2025 summer") and handles (`…-copy`, `…-copy-1`) |

---

## 13. Phone-specific behaviour (summary) — Direct (live site, 2026-10-15)

- **Hero.** It shows a different campaign from desktop (END OF SEASON SALE / UP TO 70% OFF, text inside the image), linking to the same New Arrivals collection.
- **Header and menu.** The header has menu, logo and cart only. Search and account are inside a sliding, multi-level drawer (four taps to men's swimwear).
- **Homepage.** Carousels scroll sideways with QUICK ADD buttons; tiles sit 2 × 2. Banner photos are the same 2400-px files used on desktop.
- **Collection page.** A FILTER drawer from the left, SORT, a 1- or 2-column toggle and a quick-add icon on each card.
- **PDP.** The gallery stacks above the info. There is no sticky add-to-cart bar, and the size buttons sit below a very large price block.
- **Cart.** The drawer is full width. The footer ABOUT list collapses into an accordion.
- **Layout.** No horizontal page scroll at 390 px: `scrollWidth` equals 390 on the homepage, SS26 Mens, the Festival del Mare PDP and the store list.

---

## What works (keep) — Direct (live site, 2026-10-15)

1. **Photography.** On-location campaign images (terracotta walls, beach, linen in daylight) and consistent on-model product shots. The hover photo slideshow on cards is a nice touch.
2. **Specific product facts where they exist.**
   - Festival del Mare: polyester shell, mesh lining, nickel-free engraved drawcord, pocket layout, chlorine/salt/UV treatment, "Made in Egypt", model height, weight and size.
   - Black Cala: "85% recycled polyester 15% Spandex", "Double Lined & Tested To Prevent Transparency".
   - Size labels carry waist ranges (for example "S (30-32)").
3. **Named prints with personality:** Festival del Mare, Tipsy Sardine, Navy Stingrays, Summers In Europe, Yellow Zebra, Funky Fish.
4. **A clear three-department range** (Men 181 · Women 175 · Kids 18 in SS26) and a simple six-link top menu that works with the keyboard.
5. **Solid commerce plumbing.**
   - Filters and sort live in the URL, with an in-stock filter and nine sort options.
   - Quick view, predictive search with suggestions and collections, and a simple cart drawer with order notes.
   - Clear "SAVE nn%" badges on cards.
6. **Physical retail up front.** STORES is in the main menu, the homepage closes with VISIT US / Find a Store, and the store list covers 15 locations plus stockists, with map links.
7. **Transparent shipping fees** by region, and a 14-day return window stated in an accordion on each of the four PDPs checked.
8. **Good structured data on PDPs** (offers per size with GTIN and availability), and a CDN that serves WebP/AVIF automatically.

---

## Opportunities

Observed problems are Direct (live site, 2026-10-15). Responses are Concept (this repository's code, read on 2026-10-15); "Not addressed" means the concept does not solve it.

| Area | Observed on kaicollections.com | Concept response |
| --- | --- | --- |
| Hero message | Campaign text exists only inside the hero images (`alt=""`, link without an accessible name, `loading="lazy"`). Desktop and phone show different campaigns (RETREAT vs END OF SEASON SALE) | One hero component for all widths, with a real text H1 (screen-reader text "KAI Collections —", then "Swim · Linen · Resort" and "The art of escape.") and text CTAs over the WebGL sea (`src/home/Hero.tsx`) |
| Brand story | Nothing from About Us (Hawaiian *kai*, 2018, made in Cairo) reaches the homepage | Chapter 00–01: the *kai* = ocean definition under the hero, then "The KAI philosophy" with sourced facts (`Hero.tsx`, `Philosophy.tsx`) |
| Tile and banner links | Women's "Bestsellers" → women's linen; Men's "Bestsellers" → shop all; Swimwear banner → women only; Linens banner → men only | Every entry point is a defined view whose contents come from a filter in `catalog.ts` (`SHOP_VIEWS`). "Featured" sort uses KAI's Best Sellers order. An E2E test checks that internal links resolve, though not that a label matches its contents |
| Season-coded IA | Summer/Winter split under each department; sale collections titled "2025 summer/winter" and "Black Friday… SS25"; `-copy` handles | One season (SS26) organised as Departments (Men/Women/Kids), Categories (Swim, Linen, Resort, Knit & Jersey, Matching sets) and Edits (New arrivals, Sale = everything below its compare-at price). **Scope gap:** the concept leaves out KAI's winter and older sale collections entirely |
| Phone menu depth | Four taps to men's swimwear; search hidden inside the drawer | Single-level phone sheet with Men, Women, Kids, Swim, Linen, Resort, Matching sets, New arrivals and Sale, with product counts; search button in the header (`Chrome.tsx`) |
| Size filter | 31 spellings of sizes on SS26 Mens (S/Small/"S (30-32)"/"Small (28-30)"…) | `sizeKey()` maps KAI's spellings to one key (XXS–3XL; kids sizes as nY); the size filter lists only sizes that are available (`Shop.tsx`) |
| Currency symbol | Prices "EGP" but price filter "ج.م" | EGP formatting everywhere (`formatEGP`); no price slider |
| Collection page | No visible title, H1, intro or count; numbered pages of 20 | `ShopHeader` with H1, intro and result count; 24 pieces then "Show more" (+48) with "Showing N of M" |
| Sold-out sizes | Hidden on PDP (Festival del Mare shows 4 of 7, including hiding the model's size), crossed out in quick view; no back-in-stock | `SizePicker` shows every size KAI lists, with sold-out sizes disabled and announced as ", sold out"; "N of M sizes available"; the Fit & sizing accordion lists the full run with "(sold out)" marks. No back-in-stock either (not addressed) |
| Sold-out items promoted | 11/50 New Arrivals and 11/50 Few Pieces Left with no size available; 2 of 3 predictive suggestions for "swim" sold out | Featured and Newest sorts put sold-out pieces last; search ranks them lower and labels them "Sold out"; "Hide sold out" toggle; related products exclude sold-out pairs and same-kind items; homepage "Last sizes" edit = reduced, in-stock pieces with only one or two of their sizes left |
| Price clarity | PDP shows two equally huge prices and no % saved; cart button "EGP 1,189.00 EGP" | `Price` shows the struck compare-at, the price and −% on cards, PDP, quick view and search, plus a dated "Price and availability as listed on KAI on …" line |
| Description quality | Shared boilerplate paragraph (32/40 men's swim shorts); same swim-care block on a linen shirt; "UPF 40" only in an image | Only factual lines are reused (composition, details, fit, model note); KAI's marketing paragraphs are not republished (`scripts/sync-catalog.mjs`). **Gap:** "UPF 40" is not captured. **Gap (wording):** for 312 of 374 pieces the concept says "KAI's product page gives no care instructions for this piece — check the label", but KAI's PDP does show a generic care block. The text should say that instead |
| Size guide | No link at the size selector; "(Check Size Guide)" is not a link; the footer guide is image-only charts, some from 2018–19 | **Not addressed:** the concept has no size guide. Fit & sizing shows KAI's fit line, model note and full size run |
| PDP navigation | No breadcrumbs, no matching or "complete the look" link, no sticky add bar on phone | Breadcrumbs; "Complete the set" from KAI's matching-set collections, same-style bikini tops and bottoms, and adult/Mini prints; related products; a sticky phone add bar (`Product.tsx`) |
| Reviews | Rating in JSON-LD (5.0 / 4) but nothing visible | Not addressed (no reviews in the concept) |
| Search | Predictive results surface sold-out items; the results page has no visible count, sort or H1 and mixes all seasons | Search overlay with suggestions, photo thumbnails, highlighted matches and arrow/Enter keys; sold-out labelled and ranked lower; "See all results" opens the collection view with sorts, filters and count (`Panels.tsx`, `catalog.ts`) |
| Cart | No delivery info or free-shipping cue; duplicated currency | Concept bag (quantities, remove, EGP subtotal) that ends in an honest hand-off to each piece's page on kaicollections.com. **Not comparable:** the concept has no checkout |
| Image weight | 2400-px banners without `srcset` on phones; lazy-loaded hero; 150 carousel cards on one page | `Photo` always emits `srcset` (360–1800 w) with `sizes` and intrinsic dimensions, lazy-loads by default and loads above-the-fold photos eagerly with `fetchpriority="high"`. Caveat: the concept ships its catalogue in a ≈770 KB (≈176 KB gzip) JS bundle plus a WebGL shader, so it is **not** automatically lighter overall |
| Accessibility | Three banner H1s on the homepage; no H1 on collections and search; collection images `alt=""` | One H1 per page (hero, shop header, PDP, stores, about, journal); product photos alt "{name} — KAI photograph i of n"; campaign photos carry written descriptions in `media.ts`; skip link, focus-trapped dialogs and reduced-motion paths |
| Stores page | Template photo row on every page; "READ SEA" typo; plain-text phones; one store without a number; no region filter | Region chips (Cairo, Alexandria, North Coast, Red Sea, UAE), "Directions" map links, `tel:` links, a "temporarily closed" note, and the Dubai stockists named on About Us (`Stores.tsx`, `stores.ts`) |
| Matching line | "Kids Like Father Like Son - SS25" exists but is linked from neither the menu nor the homepage | Matching sets page and PDP "Complete the set" (adult + Mini in the same print); the homepage Kids panel pairs Mini and grown-up Yellow Zebra |
| Hidden or internal collections | "Kids Collection BS/NA" and an all-season "New Arrivals" are publicly reachable | The concept reads only the three SS26 department collections linked from KAI's menu, plus their sub-collections |
| SEO | No meta descriptions on collections; boilerplate product meta; rating markup without visible reviews; promo and season codes in titles | Out of scope: the concept is unofficial and `noindex`. These are recommendations for KAI only |

---

## Previously indexed findings — status on 2026-10-15

Each claim below is from the earlier file and is labelled Indexed (search engines, ≤2026-10-14). Its status is Direct (live site, 2026-10-15) unless stated.

| Earlier claim (Indexed) | Status today |
| --- | --- |
| Shopify platform (`/products/`, `/collections/`, `/pages/` URLs) | **Confirmed**: Shopify, Pipeline 8.0.0 |
| A separate UAE storefront exists at `kaicollections.ae` | **Could not check.** The container's egress proxy refused the connection (HTTP 000), which says nothing about whether that site is up. kaicollections.com does not link to it from its homepage, About Us or product page; its `og:description` names "Egypt and UAE" |
| Homepage: Swimwear banner "Effortless, elegant, worn all summer"; New Arrivals row with Olive Kaia, Black Cala, Matcha Perla, Brown Ruffle Tencel Dress, linen tops and skirts, Festival del Mare sarong, Funky Fish beaded tank, Black Zaria bikini top; "last chance, few pieces left"; linens; "Pass by a store…" | **Confirmed**: every named product is in today's NEW ARRIVALS row. LAST CHANCE and FEW PIECES LEFT are present; the linens banner reads "Lightweight, breathable, made for summer." |
| Homepage included kids swimwear | **No longer true**: no kids module on the homepage today; kids are reachable from the menu only |
| Season-labelled collection handles and titles (SS24/SS25/SS26/FW25) | **Confirmed** for SS25, SS26 and FW25 (for example "Mens - FW25", "Kids Black Friday Sale - SS25", "SS26 Mens"). SS24 was not re-checked |
| Internal-looking names exposed ("Kids Collection BS", "Kids Collection NA") | **Confirmed**: both are still publicly reachable (HTTP 200) with those titles, though not linked from the menu or homepage |
| New Arrivals held a large fall/winter assortment (≈257 products) while the homepage promoted swim | **Changed**: the homepage hero now links to "SS26 New arrivals" (`ss26-copy`, 265 products). `/collections/new-arrivals` holds 374 products, mostly summer types plus 12 jackets, and is not linked from the menu or homepage |
| Product pages carry specific copy (fabric, liner, drawcord, waist range per size, fit advice, model height and size, care) | **Partly confirmed**: the details lists are specific, but most men's swim pages open with a shared boilerplate paragraph, and "care" is a generic theme block |
| Size selectors list all sizes with sold-out states | **Changed or misleading**: on the PDP only available sizes are displayed (the HTML still contains every size, which is probably what the index saw). Quick view shows sold-out sizes crossed out |
| Product pages in EGP; several collection pages in USD (for example linen shirts at $23.89) | **EGP confirmed; USD not reproduced.** Every page served EGP from this environment and `?currency=USD` is ignored; the only "$" is the Shipping page's "Fixed 40$ (2000 EGP)". Other countries could not be tested |
| "Like Father, Like Son" is a distinctive line | **Confirmed but buried**: "Kids Like Father Like Son - SS25" (30 products, 10 with a size available) is not linked from the menu or homepage |
| Physical retail promoted from the homepage | **Confirmed**: VISIT US module and STORES in the main menu |

---

## Could not check

- **kaicollections.ae**: the connection was refused by this environment's egress proxy.
- **Instagram (`instagram.com/kaicollections.eg`)**: it redirects (302) to a login wall, so no posts were read.
- **Checkout**: not opened, by design (no orders, no personal data). Shipping and tax calculation inside checkout were therefore not seen.
- **Geolocation**: currency or market behaviour for visitors outside this environment's single network location.
- **Field performance**: real-user Core Web Vitals. Only lab timings from one proxied datacenter run are reported above.
- **Contrast ratios**: not measured, only judged by eye from screenshots.
