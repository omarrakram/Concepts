# Sources

The reference list for the whole concept: every external URL it uses or relies on, with the HTTP status that URL returned when it was requested for this file.

**How this was checked.** Each URL was requested with `curl -sS -o /dev/null -w '%{http_code}'` (through this container's pre-configured egress proxy, TLS verification on) on **2026-10-15, between 23:55 and 23:59 UTC**. Where a row says more than a status (page title, quote found, image type and pixel size), that came from the same fetch, saved outside the repository.

**Provenance labels**

- **Direct (fetched 2026-10-15)**: requested and read from the live URL in the check window above.
- **Indexed only (search engines, ≤2026-10-14)**: known only from search-engine snapshots taken before this container had network access. It could not be re-checked today. Kept only where still useful, and not to be treated as verified.
- **Press (year)**: a third-party article, by its own publication date. It also carries one of the two labels above.

An earlier version of this file was written entirely from search-engine snapshots. Everything below has been requested again. Rows that could not be reached say so.

## Rights

KAI's logo, campaign photographs, product photographs and product copy belong to **KAI Collections**. This is an unofficial concept, not affiliated with KAI. **The repository stores only URLs** to KAI's own pages and CDN. No KAI image, logo file, screenshot or HTML is committed. Browsers load the media straight from KAI's CDN, and a `VITE_KAI_MEDIA=off` build loads none of it. Showing KAI's media on any public URL needs KAI's permission.

---

## 1. KAI live site: pages

| Page | URL | Status | What was confirmed in the fetched page | Provenance |
| --- | --- | --- | --- | --- |
| Homepage | https://kaicollections.com/ | 200 | `<title>` "KAI Collections"; og:description "Premium swim & ready-to-wear in Egypt and UAE"; og:image is the `KAI_WEBSITE_HEADER_DESIGNS_4acbd592-…jpg` Retreat banner; `Shopify.theme` name "SS26 June drop", schema "Pipeline" 8.0.0, theme_store_id 739; `Shopify.shop` "kai-designs.myshopify.com"; `Shopify.currency` active "EGP". Verbatim lines present, each once: "Effortless, elegant, worn all summer" · "Lightweight, breathable, made for summer." · "Pass by a store to try on the latest arrivals in person." · "International Shipping Available". Header logo `<img>`: `//kaicollections.com/cdn/shop/files/Untitled-2.png?v=1613517613&width=90`, `width="90" height="52"`, alt "Kai Collections". | Direct (fetched 2026-10-15) |
| About Us | https://kaicollections.com/pages/about-us | 200 | Verbatim: "KAI - Hawaiian for: {noun} Ocean, sea, beach, seaside, seawater" and "Kai Collections is a premium swimwear and resort wear brand founded in 2018. The brand is recognized for its modern, high-quality swimwear and apparel for men, women, and children—designed and locally produced in Cairo." Also present: quality, integrity and local empowerment as core values; the range "swimwear, linen sets, relaxed knitwear and seasonal winterwear"; flagships Cairo Festival City Mall, Mall of Egypt, Mall of Arabia, City Centre Almaza, District 5; Galeries Lafayette Dubai and Jashanmal Dubai; seasonal North Coast stores "including Marassi & Mountain View"; info@kaicollections.com. | Direct (fetched 2026-10-15) |
| Store list | https://kaicollections.com/pages/store-list | 200 | Present in the page text: "TEMPORARILY CLOSED" (Cairo Festival City), City Centre Almaza, Mall of Egypt, District 5, Mall of Arabia, City Center Alex, Marassi, Hacienda, Telal, La Vista, Kyma, Soma Bay. Stock list: Four Seasons, Jay, Surf Shop, Wavy. The concept's `/stores` page is built from this page. | Direct (fetched 2026-10-15) |
| Contact | https://kaicollections.com/pages/contact-us | 200 | Linked from the concept's footer. Content not used. | Direct (fetched 2026-10-15) |

KAI's footer, on both the homepage and About Us, links to `https://facebook.com/kaicollections.eg`, `https://instagram.com/kaicollections.eg` and `https://www.tiktok.com/@kaicollections.eg`. Section 7 has what happened when each was requested.

## 2. Storefront endpoints read by `npm run sync`

`scripts/sync-catalog.mjs` reads `/products.json` (paged) and `/collections/<handle>/products.json` from `https://kaicollections.com`.

| Endpoint | Status | Result on 2026-10-15 | Provenance |
| --- | --- | --- | --- |
| https://kaicollections.com/products.json | 200 | Responds (default page) | Direct (fetched 2026-10-15) |
| https://kaicollections.com/products.json?limit=250&page=1 … `page=5` | 200 ×5 | 250 + 250 + 250 + 250 + 51 = **1,051 published products**. 467 have at least one variant with `available: true`. | Direct (fetched 2026-10-15) |

**Reconciliation with the concept's snapshot** (`src/data/catalog.live.json`, `checkedAt` 2026-10-15). All 374 concept handles are present in the products.json fetched above. The union of `ss26-mens`, `ss26-womens` and `ss26-kids-swim` is exactly those 374 handles. Availability had moved slightly by 23:56 UTC: **308** of the 374 had a size available and **66** were sold out. The concept snapshot says 311 and 63. Across all 1,051 published products, 467 had a size available, against 470 earlier the same day. Prices and availability in the concept are therefore a dated snapshot.

## 3. SS26 collections used by the concept

Handles come from `DEPARTMENTS`, `GROUPS`, `EDITS` and `RANKED` in `scripts/sync-catalog.mjs`. "Count" is the number of products in `/collections/<handle>/products.json`, paged when there were more than 250. "Linked on KAI homepage" is the number of `href="/collections/<handle>"` links in the homepage HTML fetched today, with their link text.

| Handle | Role in concept | Page | products.json | Count | Linked on KAI homepage |
| --- | --- | --- | --- | --- | --- |
| [ss26-mens](https://kaicollections.com/collections/ss26-mens) | Department · Men | 200 | 200 | 181 | 7 (Men, Summer, Shop all, BESTSELLERS) |
| [ss26-womens](https://kaicollections.com/collections/ss26-womens) | Department · Women | 200 | 200 | 175 | 6 (Women, Summer, Shop all) |
| [ss26-kids-swim](https://kaicollections.com/collections/ss26-kids-swim) | Department · Kids; group swimwear | 200 | 200 | 18 | 4 (Kids, Kids Swimwear) |
| [ss26-mens-swimwear](https://kaicollections.com/collections/ss26-mens-swimwear) | Group · swimwear | 200 | 200 | 40 | 3 |
| [ss26-womens-swimwear](https://kaicollections.com/collections/ss26-womens-swimwear) | Group · swimwear | 200 | 200 | 64 | 4 |
| [ss26-mens-linen](https://kaicollections.com/collections/ss26-mens-linen) | Group · linen | 200 | 200 | 75 | 4 |
| [ss26-womens-linen](https://kaicollections.com/collections/ss26-womens-linen) | Group · linen | 200 | 200 | 39 | 3 |
| [ss26-mens-knitwear](https://kaicollections.com/collections/ss26-mens-knitwear) | Group · knitwear | 200 | 200 | 29 | 3 |
| [ss26-mens-shirts](https://kaicollections.com/collections/ss26-mens-shirts) | Group · shirts | 200 | 200 | 50 | 2 |
| [mens-t-shirts-ss26](https://kaicollections.com/collections/mens-t-shirts-ss26) | Group · tees | 200 | 200 | 40 | 2 |
| [ss26-mens-linen-pants](https://kaicollections.com/collections/ss26-mens-linen-pants) | Group · bottoms | 200 | 200 | 27 | 2 |
| [ss26-mens-linen-shorts](https://kaicollections.com/collections/ss26-mens-linen-shorts) | Group · bottoms | 200 | 200 | 20 | 2 |
| [ss26-womens-pants](https://kaicollections.com/collections/ss26-womens-pants) | Group · bottoms | 200 | 200 | 36 | 3 |
| [ss26-womens-tops](https://kaicollections.com/collections/ss26-womens-tops) | Group · tops | 200 | 200 | 47 | 3 |
| [skirts-dresses](https://kaicollections.com/collections/skirts-dresses) | Group · skirts & dresses | 200 | 200 | 17 | 2 |
| [ss26-womens-cover-ups](https://kaicollections.com/collections/ss26-womens-cover-ups) | Group · cover-ups | 200 | 200 | 44 | 3 |
| [ss26-womens-accessories](https://kaicollections.com/collections/ss26-womens-accessories) | Group · accessories | 200 | 200 | 6 | 2 |
| [ss26-mens-sets](https://kaicollections.com/collections/ss26-mens-sets) | Group · sets | 200 | 200 | 53 | 2 |
| [ss26-womens-sets](https://kaicollections.com/collections/ss26-womens-sets) | Group · sets | 200 | 200 | 66 | 3 |
| [ss26-new-arrivals](https://kaicollections.com/collections/ss26-new-arrivals) | Edit · New arrivals | 200 | 200 | 272 | **0**: not linked from the homepage HTML; reached by handle |
| [ss26-mens-copy](https://kaicollections.com/collections/ss26-mens-copy) | Ranked · Men's Best sellers (Featured sort) | 200 | 200 | 181 | 2 (Best sellers) |
| [ss26-womens-copy](https://kaicollections.com/collections/ss26-womens-copy) | Ranked · Women's Bestsellers (Featured sort) | 200 | 200 | 146 | 2 (Bestsellers) |
| [ss26-copy](https://kaicollections.com/collections/ss26-copy) | Not read by sync; the target of KAI's homepage hero (Retreat / New Arrivals) | 200 | 200 | 265 | 1 (hero image link) |

Provenance for every row: **Direct (fetched 2026-10-15)**.

## 4. Product pages linked from the concept

Every product in the concept links to `https://kaicollections.com/products/<handle>` (`officialUrl` in `src/data/catalog.ts`). All 374 handles appear in the products.json fetched today (section 2). The pages below were also requested one by one. These are the pages the concept quotes or features by name.

| Handle | Page | `.js` | Page `<title>` today | Where the concept uses it | Provenance |
| --- | --- | --- | --- | --- | --- |
| [black-kaia-one-piece](https://kaicollections.com/products/black-kaia-one-piece) | 200 | 200 | Black Kaia One Piece – Kai Collections | Material Edit (recycled swim jersey); Lookbook | Direct (fetched 2026-10-15) |
| [festival-del-mare-swim-shorts](https://kaicollections.com/products/festival-del-mare-swim-shorts) | 200 | 200 | Festival del Mare Swim Shorts – Kai Collections | Material Edit (swim polyester); Journal; film. `SOURCES.festivalShorts`. The quote "Fabric is treated for protection against: Chlorine, Salt Water, and UV Rays" was found verbatim in the page (3 occurrences). | Direct (fetched 2026-10-15) |
| [mini-pink-polar-swim-shorts](https://kaicollections.com/products/mini-pink-polar-swim-shorts) | 200 | 200 | Mini Pink Polar Swim Shorts – Kai Collections | Journal; Atlas. `SOURCES.miniPinkPolar`. The quote "making it easy for you and your little guy to twin on the beach or pool" was found verbatim in the page (5 occurrences). | Direct (fetched 2026-10-15) |
| [white-short-sleeve-linen-shirt](https://kaicollections.com/products/white-short-sleeve-linen-shirt) | 200 | 200 | **White Cuban Linen Shirt** – Kai Collections. KAI's current title differs from the handle. | Material Edit (washed linen); Horizon; Journal; Atlas; Edit | Direct (fetched 2026-10-15) |
| [pink-polar-swim-shorts](https://kaicollections.com/products/pink-polar-swim-shorts) | 200 | 200 | Pink Polar Swim Shorts – Kai Collections | Journal; Atlas; Edit | Direct (fetched 2026-10-15) |
| [olive-kaia-one-piece](https://kaicollections.com/products/olive-kaia-one-piece) | 200 | 200 | Olive Kaia One Piece – Kai Collections | Material Edit; Lookbook | Direct (fetched 2026-10-15) |
| [women-s-white-linen-v-neck-top](https://kaicollections.com/products/women-s-white-linen-v-neck-top) | 200 | 200 | Women\`s White Linen V-Neck Top – Kai Collections | Material Edit; Journal; Atlas | Direct (fetched 2026-10-15) |
| [yellow-zebra-swim-shorts](https://kaicollections.com/products/yellow-zebra-swim-shorts) | 200 | 200 | Yellow Zebra Swim Shorts – Kai Collections | Material Edit; Three wardrobes (Kids) | Direct (fetched 2026-10-15) |
| [green-labyrinth-swim-shorts](https://kaicollections.com/products/green-labyrinth-swim-shorts) | **404** | 404 | 404 Not Found – Kai Collections | Not presented as current. It appears only in the history files (`research/search-index-snapshot.json`, `research/catalog-reconciliation.json`) as "no longer listed". | Direct (fetched 2026-10-15) |

## 5. KAI CDN assets referenced by the concept

Each URL is the `cdn` field of `src/data/catalog.live.json` (`https://cdn.shopify.com/s/files/1/1868/5457/`) plus the `src` in `src/data/media.ts`. Every one was downloaded to a scratch folder outside the repository and inspected. Every one returned **200** with an `image/*` content type and `access-control-allow-origin: *`. Every one also returned **200 `image/webp`** when requested with `&width=720` and a WebP `Accept` header, which is how the concept loads them.

| id | Used by KAI on | URL | Type | Pixels (file) | `media.ts` w×h |
| --- | --- | --- | --- | --- | --- |
| logo | Header logo | https://cdn.shopify.com/s/files/1/1868/5457/files/Untitled-2.png?v=1613517613 | image/png | **1573×906** | 900×518, see note |
| swim | Homepage · Swimwear banner | https://cdn.shopify.com/s/files/1/1868/5457/files/IMG_2951.png?v=1776630115 | image/png | 1800×3000 | 1800×3000 |
| linen | Homepage · Linens banner | https://cdn.shopify.com/s/files/1/1868/5457/files/IMG_3666.jpg?v=1780610849 | image/jpeg | 3119×4679 | 3119×4679 |
| last-chance | Homepage · Last Chance banner | https://cdn.shopify.com/s/files/1/1868/5457/files/bdb7ea9a7117416b444a429ed1e5c9a2.jpg?v=1767456789 | image/jpeg | 1448×1920 | 1448×1920 |
| retreat | Homepage · hero (Retreat / New Arrivals) | https://cdn.shopify.com/s/files/1/1868/5457/files/KAI_WEBSITE_HEADER_DESIGNS_4acbd592-d175-4821-9ec6-6e1e294cee5b.jpg?v=1775677968 | image/jpeg | 2500×1666 | 2500×1666 |
| men-linen | Trending now · Linen | https://cdn.shopify.com/s/files/1/1868/5457/files/DSC09277.jpg?v=1773890709 | image/jpeg | 1200×1800 | 1200×1800 |
| women-sets | Trending now · Sets | https://cdn.shopify.com/s/files/1/1868/5457/files/DSC09085_b255652d-27f9-4e17-99d4-4d89911c9da9.jpg?v=1775760470 | image/jpeg | 1200×1800 | 1200×1800 |
| men-knit | Trending now · Knitwear | https://cdn.shopify.com/s/files/1/1868/5457/files/IMG_3505.jpg?v=1780608631 | image/jpeg | 3120×4680 | 3120×4680 |
| cover-ups | Trending now · Cover ups | https://cdn.shopify.com/s/files/1/1868/5457/files/DSC08488_22e6f6cf-db2f-446d-bead-90976faa9c49.jpg?v=1773865801 | image/jpeg | 1200×1800 | 1200×1800 |
| women-linen | Shop women · Bestsellers | https://cdn.shopify.com/s/files/1/1868/5457/files/DSC09379.jpg?v=1773886949 | image/jpeg | 1079×1619 | 1079×1619 |
| women-swim | Shop women · Swimwear | https://cdn.shopify.com/s/files/1/1868/5457/files/IMG_0552.jpg?v=1773868290 | image/jpeg | 1200×1800 | 1200×1800 |
| women-tops | Shop women · Tops | https://cdn.shopify.com/s/files/1/1868/5457/files/DSC09533.jpg?v=1773884372 | image/jpeg | 1200×1800 | 1200×1800 |
| women-bottoms | Shop women · Bottoms | https://cdn.shopify.com/s/files/1/1868/5457/files/DSC08753.jpg?v=1773866346 | image/jpeg | 1200×1800 | 1200×1800 |
| men | Shop men | https://cdn.shopify.com/s/files/1/1868/5457/files/IMG_3731_82dc6b8d-7e40-4802-8358-027ee8c35b67.jpg?v=1780608894 | image/jpeg | 3648×5472 | 3648×5472 |
| men-swim | Shop men · Swimwear | https://cdn.shopify.com/s/files/1/1868/5457/files/DSC07568.jpg?v=1781470994 | image/jpeg | 643×965 | 643×965 |
| men-tops | Shop men · Shirts | https://cdn.shopify.com/s/files/1/1868/5457/files/IMG_3521.jpg?v=1780609662 | image/jpeg | 2997×4495 | 2997×4495 |
| store | Homepage · Visit us | https://cdn.shopify.com/s/files/1/1868/5457/files/Screenshot_2026-06-08_at_3.34.33_PM.png?v=1780922080 | image/png | 1120×1306 | 1120×1306 |

Provenance for every row: **Direct (fetched 2026-10-15)**.

**Logo note.** The original `Untitled-2.png` is **1573×906** px, an RGBA PNG of 42,521 bytes. An identical file (same SHA-256) is served at KAI's own path https://kaicollections.com/cdn/shop/files/Untitled-2.png?v=1613517613 (200, `image/png`, `access-control-allow-origin: *`). **900×518** is what that file returns when requested with `&width=900`. That is the size recorded in `media.ts` and in earlier notes. The aspect ratio is the same (1.736 against 1.737), so the concept's proportions still hold. But 900×518 is a resized rendition, not the file's natural size. On the homepage, KAI renders the logo at `width=90` (90×52), with 2× and 3× srcset entries at `width=180` and `width=270`.

Product photography (1,732 image references in `catalog.live.json`) is on the same CDN. The sync's own check on 2026-10-15 found that all 374 lead images resolved (`imageCheck`: 374 checked, 374 ok). They were not requested again one by one for this file.

## 6. Press and other third-party sources

| Source | Title | Date | URL | Status today | Provenance | Used in the concept for |
| --- | --- | --- | --- | --- | --- | --- |
| CairoScene | "Egypt's Newest Men's Swimwear Brand is Here to Up Your Sahel Game" (byline: Staff Writer) | May 15, 2018, as shown on the page | https://cairoscene.com/Styled/Kai-Collection-Swimwear | 200 | **Press (2018) · Direct (fetched 2026-10-15)** | `FACTS.origin` / Journal (paraphrase, marked not verbatim). Verbatim in the page: "explains Karim Safadi, the 20-year-old Egyptian founder of Kai Collections"; og:description "Locally designed and produced, Kai Collections is here to challenge international brands' dominance over the Egyptian men fashion market." |
| CairoScene | "7 Best Men and Women's Egyptian Swimwear Brands of Summer 2018" (byline: Staff Writer) | Jul 05, 2018, as shown on the page | https://cairoscene.com/Styled/Egyptian-Swimwear-Brand | 200 | **Press (2018) · Direct (fetched 2026-10-15)** | Background only. Lists "Kai Collection" with "Prices: EGP 850/piece". |
| Egyptian Streets | "Meet Kai Collections: The Premium Mens Swimwear Brand Defying Stigma" | 18 Apr 2018 (from URL and index) | https://egyptianstreets.com/2018/04/18/meet-kai-collections-the-premium-mens-swimwear-brand-defying-stigma/ | **000**, blocked (proxy 403 on CONNECT) | Press (2018) · **Indexed only** | `/about` timeline, "KAI is founded". The founder's name and local production are separately confirmed Direct by CairoScene above. |
| Flair Magazine | "Swim in Style with Egypt's KAI Collections" | 9 Aug 2018 (from URL and index) | https://flair-magazine.com/2018/08/09/swim-in-style-with-egypts-kai-collections/ | **000**, blocked (proxy 403 on CONNECT) | Press (2018) · **Indexed only** | `FACTS.name` (homepage Philosophy and `/about` timeline): the name as ocean + Cairo + the founder's K. **Only the Hawaiian meaning is confirmed Direct** (About Us). The Cairo and K parts rest on an indexed-only source. |
| Enterprise | "Your ultimate beach kit guide" | 5 Jun 2026 (from URL and index) | https://enterpriseam.com/egypt/2026/06/05/your-ultimate-beach-kit-guide/ | **000**, blocked (proxy 403 on CONNECT) | Press (2026) · **Indexed only** | Listed in `SOURCES`. No fact in the concept cites it. |
| Enterprise | "Stressing over swimsuits? We got you" | 31 May 2024 (from URL and index) | https://enterpriseam.com/egypt/2024/05/31/stressing-over-swimsuits-we-got-you/ | **000**, blocked (proxy 403 on CONNECT) | Press (2024) · **Indexed only** | Not used. |
| Scoop Empire | "From Cairo to the coast: Egypt's trendiest swimwear brands" (from index) | Not known | https://scoopempire.com/from-cairo-to-the-coast-discover-egypts-trendiest-swimwear-brands/ | **000**, blocked (proxy 403 on CONNECT) | Press · **Indexed only** | Not used. |
| Arab News (short link) | Not known; the index showed a conflicting launch reference | 7 May 2024 (from index) | https://arab.news/mwr2k | **000**, blocked (proxy 403 on CONNECT) | Press (2024) · **Indexed only** | Not used, because it conflicts with KAI's own "founded in 2018". |
| Jay Stores (stockist) | JAY X KAI Festival del Mare Swim Shorts (from index) | Not known | https://jay-stores.com/products/ss26swm-213 | **000**, blocked (proxy 403 on CONNECT) | **Indexed only** | Not used. KAI's own store list names "Jay" stores in its stock list (Direct). |

## 7. Unreachable or blocked from this container

These were requested in the same window. None of their content could be read, so nothing in the concept may rest on them as verified.

| Source | URL | Result | What that means |
| --- | --- | --- | --- |
| KAI UAE storefront | https://kaicollections.ae/ | **000**. The proxy answered 403 to CONNECT. | **Not checked.** The proxy reports this as "policy denial or upstream failure", and the container cannot tell which. |
| KAI UAE stores page (`SOURCES.storesAE`) | https://kaicollections.ae/pages/stores | **000**, same as above | **Not checked.** KAI's UAE presence in the concept should rest on About Us (Galeries Lafayette Dubai, Jashanmal Dubai; "Egypt and the UAE"), which is Direct. About Us does not mention a separate UAE online storefront. |
| Instagram (`SOURCES.instagram`) | https://www.instagram.com/kaicollections.eg/ | **302** to `https://www.instagram.com/accounts/login/?next=…` | **Login wall.** Profile and posts not checked. KAI's footer link `https://instagram.com/kaicollections.eg` answers 301 to the `www` address above. |
| Facebook | https://facebook.com/kaicollections.eg · https://www.facebook.com/kaicollections.eg/ | **000** for both (proxy 403 on CONNECT) | **Not checked.** The URL is confirmed only as a link in KAI's footer (Direct). The indexed description "Men's Premium Swimwear from Cairo, Egypt" is **Indexed only**. |
| TikTok | https://www.tiktok.com/@kaicollections.eg | **000** (proxy 403 on CONNECT) | **Not checked.** The URL is confirmed only as a link in KAI's footer (Direct). |
| LinkedIn (`SOURCES.linkedin`) | https://www.linkedin.com/company/kai-collections | **000** (proxy 403 on CONNECT) | **Not checked.** The indexed details ("founded 2018, 2–10 employees") are **Indexed only**. |
| Shopify shop domain | https://kai-designs.myshopify.com/ | **000** (proxy 403 on CONNECT) | Not needed. The domain name itself is confirmed Direct from `Shopify.shop` in KAI's homepage HTML. |

## 8. Earlier indexed KAI URLs, re-checked (history)

These collections were listed in the earlier, index-only version of this file. All still resolve, but they are previous-season (SS25 / FW25) or general collections, and **the concept does not use them**. Titles are KAI's page `<title>` today. "Count" is the first page of `products.json` (250 means 250 or more).

| URL | Status | Title today | Count |
| --- | --- | --- | --- |
| https://kaicollections.com/collections/all | 200 | Products | 250 |
| https://kaicollections.com/collections/new-arrivals | 200 | New Arrivals | 250 |
| https://kaicollections.com/collections/ss24-womens-swimwear | 200 | Womens Swimwear - SS25 | 51 |
| https://kaicollections.com/collections/bikinis | 200 | Bikinis | 33 |
| https://kaicollections.com/collections/linen-collection | 200 | Mens Linen - SS25 | 57 |
| https://kaicollections.com/collections/linen-pants | 200 | Mens Linen Pants - SS25 | 8 |
| https://kaicollections.com/collections/linen-shirts | 200 | Mens linen shirts - SS25 | 38 |
| https://kaicollections.com/collections/linen-overshirts | 200 | Mens Linen Overshirts - SS25 | 4 |
| https://kaicollections.com/collections/womens-linen-collection | 200 | Womens Linen - SS25 | 22 |
| https://kaicollections.com/collections/womens-linen-shirts | 200 | Womens Linen Shirts | 13 |
| https://kaicollections.com/collections/womens-linen-shorts | 200 | Womens Linen Shorts | 5 |
| https://kaicollections.com/collections/winter-collection | 200 | Mens - FW25 | 55 |
| https://kaicollections.com/collections/kids-swimwear | 200 | Kids swimwear - SS25 | 43 |
| https://kaicollections.com/collections/like-father-like-son | 200 | Kids Like Father Like Son - SS25 | 30 |
| https://kaicollections.com/collections/kids-collection-bs | 200 | Kids Collection BS | 13 |
| https://kaicollections.com/collections/summer-sale | 200 | SALE - SS25 | 59 |
| https://kaicollections.com/collections/end-of-season-sale | 200 | End Of Season Sale | 250 |

Provenance for every row: **Direct (fetched 2026-10-15)**. Each title ends in " – Kai Collections", which is left out above.

The earlier search-index product snapshot (56 products) is kept as history in `research/search-index-snapshot.json` and reconciled against the live store in `research/catalog-reconciliation.json`.

## Not to be confused with

Search results for other "Kai" labels were discarded: KAI Collective, a London label; David Shepard Hawaiʻi's "Kai Collection"; and other Hawaiian "Kai" brands. **Indexed only (search engines, ≤2026-10-14).** No URL for them is used anywhere in the concept.
