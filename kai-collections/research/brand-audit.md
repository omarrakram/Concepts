# KAI COLLECTIONS — brand audit

Part of an **unofficial, speculative redesign concept**. It has no affiliation with KAI Collections and KAI has not endorsed it.
Research date: **15 October 2026**. This version replaces the 14–15 October draft, which was written from search-engine snapshots before the build container could reach kaicollections.com.

## Provenance key

Every factual line below carries one of these labels.

| Label | Meaning |
| --- | --- |
| **Direct (live site, 2026-10-15)** | Read today from kaicollections.com (pages, `products.json`, `/products/<handle>.js`, `/collections/<handle>.json`) or from a press page that loaded today. "Computed" means a count or price statistic worked out from that live data, mostly from `src/data/catalog.live.json` (the concept's sync of 2026-10-15). |
| **Indexed (search engines, ≤2026-10-14)** | From the earlier draft, which used search-engine snapshots. These could **not** be re-checked today. They stay in only where they are still useful. |
| **Press (year)** | Third-party press. When the article loaded today, the label says "re-read directly 2026-10-15". |

Interpretation and concept copy are labelled **Interpretation**. They are not facts about KAI.

## How this was checked, and what could not be

- Pages were fetched with `curl` through the container's proxy. Working copies are in the session scratchpad (`/tmp/claude-0/-home-user/7d32d549-f4a7-5155-9428-e971ba5a40a6/scratchpad/research-agents/brand/`). None of them was saved into the repository.
- Pages read directly: `/`, `/pages/about-us`, `/pages/store-list`, `/pages/contact-us`, `/products/mini-pink-polar-swim-shorts` (HTML and `.js`), the `.js` endpoints for Tipsy Sardine, Butter Isla, Festival del Mare, Yellow Zebra and Mini Yellow Zebra, every page of `/products.json` (5 pages of up to 250 products), `/collections/{ss26-mens,ss26-womens,ss26-kids-swim}/products.json`, and `/collections/like-father-like-son(.json)`. Six spot-checked products (the five above plus Mini Pink Polar) matched `catalog.live.json` exactly on price and compare-at price.
- **Could not be reached from this container:**
  - `kaicollections.ae`: the proxy refused the connection (`403` to `CONNECT`, curl code `000`).
  - Facebook, TikTok and LinkedIn: refused the same way.
  - Press sites Egyptian Streets, Flair Magazine, Enterprise, Scoop Empire and Arab News: refused the same way. So was `jay-stores.com`.
  - `instagram.com/kaicollections.eg`: redirects (`302`) to `/accounts/login/`, so no posts, follower counts or captions could be read.
  - CairoScene **did** load and was re-read.
- Not to be confused with KAI Collective (London, kaicollective.com) or other Hawaiian "Kai" labels. Results for those were discarded (Indexed (search engines, ≤2026-10-14)).

---

## 1. Brand facts

### KAI's own words: the About Us page, verbatim

Direct (live site, 2026-10-15), https://kaicollections.com/pages/about-us:

> KAI - Hawaiian for:
> {noun} Ocean, sea, beach, seaside, seawater
>
> Kai Collections is a premium swimwear and resort wear brand founded in 2018. The brand is recognized for its modern, high-quality swimwear and apparel for men, women, and children—designed and locally produced in Cairo.
>
> Built on the core values of quality, integrity, and local empowerment, Kai Collections offers a versatile product range that includes swimwear, linen sets, relaxed knitwear and seasonal winterwear. Each collection blends comfort, style, and function, reflecting a modern coastal lifestyle.
>
> Over the years, Kai has established a strong presence both online and in leading retail destinations across Egypt and the UAE. These include flagship locations at Cairo Festival City Mall, Mall of Egypt, Mall of Arabia, City Centre Almaza, and District 5 in Cairo, as well as Galeries Lafayette Dubai and Jashanmal Dubai. The brand also operates seasonal stores in several locations in the North Coast of Egypt including Marassi & Mountain View.
>
> For more information, contact us at info@kaicollections.com

### Fact table

| Fact | Provenance |
| --- | --- |
| "KAI" glossed as Hawaiian for "Ocean, sea, beach, seaside, seawater" (noun) | Direct (live site, 2026-10-15), About Us |
| Founded in 2018 | Direct (live site, 2026-10-15), About Us |
| "premium swimwear and resort wear brand" | Direct (live site, 2026-10-15), About Us |
| Swimwear and apparel "for men, women, and children—designed and locally produced in Cairo" | Direct (live site, 2026-10-15), About Us |
| Core values: "quality, integrity, and local empowerment" | Direct (live site, 2026-10-15), About Us |
| Range: "swimwear, linen sets, relaxed knitwear and seasonal winterwear" | Direct (live site, 2026-10-15), About Us |
| Self-description: "reflecting a modern coastal lifestyle" | Direct (live site, 2026-10-15), About Us |
| Flagships named: Cairo Festival City Mall, Mall of Egypt, Mall of Arabia, City Centre Almaza, District 5 | Direct (live site, 2026-10-15), About Us |
| UAE retail named: Galeries Lafayette Dubai, Jashanmal Dubai | Direct (live site, 2026-10-15), About Us. These two **do not appear** on the store-list page (see §4) |
| Seasonal North Coast stores "including Marassi & Mountain View" | Direct (live site, 2026-10-15), About Us |
| Contact: info@kaicollections.com. The contact page also gives "DM us on Instagram: @kaicollections.eg" and "Message us on Facebook: @kaicollections.eg" | Direct (live site, 2026-10-15), About Us + /pages/contact-us |
| Site-wide description: "Premium swim & ready-to-wear in Egypt and UAE" (og:description and meta description); `<title>` "KAI Collections" | Direct (live site, 2026-10-15), homepage source |
| Store platform: Shopify, theme "Pipeline" 8.0.0 (theme_store_id 739), theme name "SS26 June drop", shop `kai-designs.myshopify.com`, currency EGP | Direct (live site, 2026-10-15), homepage source |
| Founder Karim Safadi, described in May 2018 as "the 20-year-old Egyptian founder of Kai Collections" | Press (2018), CairoScene, re-read directly 2026-10-15 |
| Origin: in Safadi's words, "The idea first came to me when the devaluation of the currency occurred, all the prices sky rocketed and Egypt really had to stop relying on imports and foreign products and start relying more on local production to help boost the economy, that's when I saw that market gap" | Press (2018), CairoScene, re-read directly 2026-10-15 |
| "His family's hands-on experience in Egypt's textile industry proved to be useful to bring his vision to life" | Press (2018), CairoScene, re-read directly 2026-10-15 |
| Launched as a **men's** swimwear brand ("Egypt's newest men's swimwear brand") | Press (2018), CairoScene, re-read directly 2026-10-15 |
| Founder started the label as a McGill University business student | Indexed (search engines, ≤2026-10-14), from Egyptian Streets (Apr 2018) / LinkedIn. Not re-verified |
| The name also abbreviates Cairo and carries the K of Karim | Indexed (search engines, ≤2026-10-14), from Flair Magazine (Aug 2018). Not re-verified; KAI's own About Us gives only the Hawaiian meaning |
| Facebook page tagline "Men's Premium Swimwear from Cairo, Egypt" | Indexed (search engines, ≤2026-10-14). Facebook unreachable today |
| LinkedIn: founded 2018, 2–10 employees | Indexed (search engines, ≤2026-10-14). LinkedIn unreachable today |

---

## 2. Product range today, measured from the live catalogue

### Size of the catalogue

| Measure | Value | Provenance |
| --- | --- | --- |
| Published products in `/products.json` | **1,051**. Recounted page by page today: 1,051 unique handles, all with vendor "Kai Collections" | Direct (live site, 2026-10-15) |
| …with at least one size available | 470 at the concept's sync, **467** at this recount later the same day (stock moves) | Direct (live site, 2026-10-15) |
| SS26 department collections (the targets of KAI's "Shop all" links) | Men `ss26-mens` **181** · Women `ss26-womens` **175** · Kids `ss26-kids-swim` **18** = **374**. Recounted today via each collection's `products.json`: identical | Direct (live site, 2026-10-15) |
| …the collections' own `products_count` field | 185 / 184 / 18. The difference from the public listing could not be explained from outside (possibly products not published to the online store). The concept uses the public listing | Direct (live site, 2026-10-15) |
| SS26 with at least one size available / sold out | **311** / **63** | Direct (live site, 2026-10-15), computed from catalog.live.json |
| SS26 photographs | **1,732**. All 374 lead images resolved on 2026-10-15 | Direct (live site, 2026-10-15), from catalog.live.json `imageCheck` |
| SS26 products also in KAI's "New Arrivals" collection | 270 of 374 | Direct (live site, 2026-10-15), computed |
| SS26 publication dates | Mostly March–August 2026 (343 of 374). The oldest items still in SS26 collections were published in 2022–2025 | Direct (live site, 2026-10-15), computed |
| Age of the wider catalogue | Still-published products were created from 2020-01-04 (e.g. "Egyptian Postcard", "Pool Party", "Soda Pop Funk", type "Swimwear") through 2026. Creation year: 2020 9 · 2021 50 · 2022 120 · 2023 146 · 2024 179 · 2025 231 · 2026 316 | Direct (live site, 2026-10-15), computed from products.json |
| Earlier search snapshot (56 products) | 30 now in SS26, 25 still published outside SS26, 1 no longer listed (`green-labyrinth-swim-shorts`, 404) | Direct (live site, 2026-10-15), see `catalog-reconciliation.json` |

### What the 374 SS26 products are

Direct (live site, 2026-10-15). Computed from catalog.live.json. "Kind" is the concept's normalised garment type, derived from KAI's titles.

| Department | Products | Composition |
| --- | --- | --- |
| Men | 181 | 40 tees · 34 swim shorts · 26 shirts · 24 pants · 20 Cuban shirts · 20 shorts · 13 polos · 4 linen overshirt jackets |
| Women | 175 | 35 one-pieces · 22 sarongs · 20 pants · 17 tops · 11 skirts · 11 shorts · 10 tanks · 10 shirts · 8 bikini tops · 8 bikini bottoms · 7 cover-ups · 6 head scarves · 5 dresses · 3 knit tops · 2 polos |
| Kids | 18 | 18 "Mini" swim shorts (the copy addresses "your little guy"). Nothing else is listed in SS26 kids |

By KAI's own sub-collections (a product can sit in several, so the rows overlap):

- Matching sets: 118
- Linen: 103
- Swimwear: 103 (men 34, women 51, kids 18)
- Bottoms: 79
- Tops: 46
- Cover ups: 41
- T-shirts: 40
- Shirts: 39
- Knitwear: 29
- Skirts & dresses: 16
- Accessories: 6

Swim is **28%** of SS26 (103 of 374). Linen collections hold another 103. Product titles name linen on 117 products, Tencel on 28, knit on 23, crochet on 15 and terry towel on 9. All of this is Direct (live site, 2026-10-15), computed.

KAI's own `product_type` field has **52 distinct values** across the 374 SS26 products and **95** across all 1,051 (11 are blank). Several differ only in spelling, for example "Oversized T-shirt" / "Oversized T-Shirt", "Linen Shorts" / "linen shorts", "Kids Swimwear" / "Kid's Swimwear" and "Women's Linen Shirt" / "womens linen shirt". 18 SS26 titles start with a lower-case letter. All of this is Direct (live site, 2026-10-15), computed.

### Prices by category (EGP)

Direct (live site, 2026-10-15). Computed from catalog.live.json; five products were re-checked live.
- **Selling** is the price on the site today.
- **Full** is the compare-at price where it is above the selling price, otherwise the selling price.
- Each price cell gives min–max with the median in brackets.

| Category (KAI sub-collections) | Products | Selling | Full | With a compare-at price | Sold out |
| --- | --- | --- | --- | --- | --- |
| **All SS26** | 374 | 175–2,299 (887) | 350–2,999 (1,689) | 313 (84%) | 63 |
| Men | 181 | 450–2,299 (999) | 750–2,999 (1,699) | 143 (79%) | 17 |
| Women | 175 | 175–1,679 (850) | 350–2,499 (1,299) | 152 (87%) | 43 |
| Kids | 18 | 450–630 (450) | 799–899 (899) | 18 (100%) | 3 |
| Swimwear | 103 | 450–1,699 (1,190) | 799–2,399 (1,699) | 99 (96%) | 5 |
| Linen | 103 | 600–2,299 (1,099) | 1,199–2,999 (2,250) | 101 (98%) | 16 |
| Shirts (men) | 39 | 650–1,750 (1,125) | 1,299–2,499 (2,250) | 37 (95%) | 3 |
| T-shirts (men) | 40 | 450–999 (799) | 750–1,999 (999) | 23 (57%) | 5 |
| Knitwear (men) | 29 | 680–850 (750) | 1,399–1,699 (1,699) | 29 (100%) | 5 |
| Bottoms | 79 | 450–2,299 (999) | 450–2,299 (1,599) | 56 (71%) | 10 |
| Tops (women) | 46 | 450–1,250 (720) | 599–2,499 (1,349) | 35 (76%) | 12 |
| Skirts & dresses | 16 | 650–1,299 (750) | 1,299–1,799 (1,499) | 15 (94%) | 4 |
| Cover ups | 41 | 250–1,299 (450) | 599–2,499 (599) | 33 (80%) | 20 |
| Accessories | 6 | 175 | 350 | 6 (100%) | 5 |
| Matching sets | 118 | 450–2,299 (999) | 450–2,999 (1,699) | 98 (83%) | 22 |

Key garments:

| Garment | Products | Selling | Full | With a compare-at price | Sold out |
| --- | --- | --- | --- | --- | --- |
| Men's swim shorts | 34 | 999–1,699 (1,190) | 1,699 for all 34 | 32 | 0 |
| Kids "Mini" swim shorts | 18 | 450–630 (450) | 799–899 | 18 | 3 |
| Women's one-pieces | 35 | 1,199–1,679 (1,679) | 1,440–2,399 (2,399) | 33 | 0 |
| Bikini tops / bottoms (sold separately) | 8 + 8 | 840–850 | 1,200 each | 16 | 2 tops |
| Sarongs | 22 | 250–599 (399) | 499–599 | 19 | 16 |
| Head scarves | 6 | 175 | 350 | 6 | 5 |
| Cuban shirts | 20 | 650–1,499 | 1,299–2,250 | 18 | 0 |
| Polos | 15 | 559–850 | 750–1,699 | 14 | 3 |
| Linen overshirt jackets | 4 | 2,250 | 2,999 | 4 | 1 |

### Share of products with a compare-at price, and markdown depth

Direct (live site, 2026-10-15), computed:

- **84% of SS26 products (313 of 374)** carry a compare-at price above the selling price. The implied discount runs from 25% to 76%, **median 50%**.
- Swimwear is marked down less (median 30%) than linen, knitwear and shirts (median 50%).
- Across the whole published catalogue the share is the same: **882 of 1,051 (84%)**. Lowest-variant prices across all 1,051 run from EGP 95 to 2,798 (median 840).
- 87 SS26 products have every size available. **104 in-stock products that come in more than two sizes have two or fewer sizes left.**
- Interpretation: the snapshot was taken in mid-October, after the Egyptian summer season, so the markdown level partly reflects timing. Indexed (search engines, ≤2026-10-14) snapshots from earlier in the season also showed frequent 30–60% markdowns.

### Prints and named styles

All Direct (live site, 2026-10-15), from catalog.live.json and KAI's titles, spelled as KAI spells them:

- **Men's swim shorts: 30 named prints and 4 solids.** The prints are:
  - Yellow Zebra, Seaside Scribbles, Coral Paisley, Tropic Noir, Sky Clams, Abstract Blues
  - Khaki Maze, Pink Polar, Pistachio Swirls, Pink Starfish, Espresso By The Beach, Pink Palm
  - Taupe Paisley, Pink Giraffes, Olive Camels, Mocha Haze, Sunset Reef, Blue Maze
  - Mallorca, Festival del Mare, Almalfi (KAI's spelling), Mosaic Seashells, Capri Spritz, Blue Graffiti
  - Navy Whales, Midnight Bloom, Blue Aquatica, Navy Stingrays, Teen Shouki, Tipsy Sardine

  The four solids are Sage Green, Dusty Grey, Dusty Cherry and Baby Blue, each "(4 Way Stretch)".
- **Kids: 18 "Mini" swim shorts.** 15 share their print with an SS26 adult swim short:
  - Seaside Scribbles, Sunset Reef, Olive Camels, Yellow Zebra, Mosaic Seashells
  - Capri Spritz, Pink Polar, Espresso By The Beach, Navy Stingrays, Pink Starfish
  - Navy Whales, Blue Aquatica, Teen Shouki, Sky Clams, Pink Giraffes

  Mini Blue Elephants, Mini Navy Lobster and Mini Pink Monkeys have no SS26 adult counterpart.
- **Women's one-pieces: 35 pieces in 13 style names**: Perla, Kaia, Sade, Cala, Ayla, Gigi, Glaze, Isla, Nahla, Rimal, Antibes, Alara, Talia.
  - Colourways: Mocha 10, Black 7, Stone 4, Matcha 3, Olive 3, Ivory 3, Rust 2, Teal 1, Pear 1, Butter 1.
  - 33 list "85% Recycled Polyester, 15% Spandex".
- **Bikinis: 4 style names sold as separates**: Zaria, Iris, Maya, Jouri, in Black, Teal, Mocha, Matcha and Butter.
- **Two names that the earlier draft could not find now exist:**
  - Tipsy Sardine Swim Shorts: EGP 999, compare-at 1,699.
  - Butter Isla One Piece: EGP 1,679, compare-at 2,399. KAI's raw title is "Butter  Isla One Piece", with a double space.

  Both were confirmed live through their `.js` endpoints.
- **Older prints are still published outside SS26:**
  - Available: Fruit Salad Swim Shorts, Purple Octopus Swim Shorts.
  - Sold out: Funky Fish, Blue Bandana and Sky Penguins swim shorts.
  - Funky Fish also appears as "Funky Fish Beaded Tank Top" in the homepage New Arrivals carousel.
- Interpretation: "Teen Shouki" reads as Egyptian Arabic for prickly pear. That is our reading; KAI does not explain it anywhere we found.

### Product copy

All Direct (live site, 2026-10-15):

- The copy is technical and specific. Festival del Mare Swim Shorts lists:
  - "100% Polyester fine mesh underwear lining"
  - "Custom Metal Engraved Drawcord (Nickel-Free)"
  - "Fabric is treated for protection against: Chlorine, Salt Water, and UV Rays"
  - "Mid-length slim fit cut"
  - "Made in Egypt"
  - "Model is 192 cm and 88 kg wearing size Medium"
- Men's swim sizes carry waist ranges, for example "XS (28-30)" to "3XL (40-42)" on Tipsy Sardine.
- The narrative copy repeats:
  - 28 of the 34 men's swim shorts open with the same paragraph ("Discover this seasons must-have swimwear for men with our premium mens swim shorts…").
  - All 18 kids' shorts share one paragraph.
- **"Made in Egypt" appears on all 34 men's swim shorts and on no other SS26 product.** No SS26 product description mentions Cairo.

### The "Like Father, Like Son" line, verbatim

Direct (live site, 2026-10-15), https://kaicollections.com/products/mini-pink-polar-swim-shorts (Mini Pink Polar Swim Shorts, EGP 450.00, compare-at EGP 899.00, type "Kid's Swimwear"):

> Get ready for a splash of excitement with our stylish kids swim shorts! Designed for your little adventurers, these shorts are part of our "Like Father, Like Son" matching line, making it easy for you and your little guy to twin on the beach or pool. With playful patterns, bright colors, and comfortable fits, these shorts are the ultimate summer accessory for your mini adventurer.

All 18 SS26 kids' products contain the same "Like Father, Like Son" paragraph. An older collection titled **"Kids Like Father Like Son - SS25"** (`/collections/like-father-like-son`, published 2022-04-17) is still live. It pairs earlier prints such as Shark Tank, Royal Crabs, Navy Lobster, Pink Monkeys, Funky Fish and Navy Jellyfish. All Direct (live site, 2026-10-15).

---

## 3. Positioning compared with what the site communicates

| KAI says | What the live site shows | Provenance |
| --- | --- | --- |
| Hawaiian *kai*, founded 2018, "designed and locally produced in Cairo" | The homepage's visible HTML text never mentions Cairo, Egypt, the Hawaiian meaning or 2018 (text inside images was not read). "About Us" is linked only from the footer; the header menu is Home · Men · Women · Kids · Sale · Stores. The story lives on one short page | Direct (live site, 2026-10-15) |
| "premium swimwear and resort wear" | og:description says "Premium swim & ready-to-wear". The SS26 range is **28% swim**. The rest is ready-to-wear (linen, Tencel, knit, crochet, terry) plus sarongs, cover-ups and scarves. The homepage NEW ARRIVALS carousel opens with women's linen and Tencel pieces, not swim | Direct (live site, 2026-10-15) |
| Premium positioning | 84% of SS26 products are shown against a higher compare-at price, with a median 50% off. "Sale" is a top-level menu item, and the homepage has "LAST CHANCE / Shop sale" and "FEW PIECES LEFT" modules. Mid-October timing is a factor (Interpretation) | Direct (live site, 2026-10-15) |
| "for men, women, and children" | SS26 kids is 18 Mini swim shorts only, and their copy addresses "you and your little guy". The menu's Kids item has two entries: Kids Swimwear and Sale | Direct (live site, 2026-10-15) |
| "local empowerment" / made in Cairo | Origin is stated only on men's swim shorts ("Made in Egypt") and not on linen, knitwear or women's pieces | Direct (live site, 2026-10-15) |
| "modern coastal lifestyle" | Homepage lines: "Effortless, elegant, worn all summer" (SWIMWEAR banner), "Lightweight, breathable, made for summer." (Linens banner), "Pass by a store to try on the latest arrivals in person." (VISIT US). The hero text "RETREAT / NEW ARRIVALS" is part of the banner image. The announcement bar reads "International Shipping Available" | Direct (live site, 2026-10-15) |
| Named prints with character | The personality lives only in the names. Descriptions are shared boilerplate, and no print has a story or a print-level page | Direct (live site, 2026-10-15) |
| — | Season codes and working names reach the shopper. Best sellers links to `/collections/ss26-mens-copy`, Sale to `/collections/black-friday-sale-ss25-copy`, Kids Sale to `/collections/kids-black-friday-sale-ss25`, and a collection is titled "Kids Like Father Like Son - SS25" | Direct (live site, 2026-10-15) |

Interpretation: KAI's real differentiators are all present on the site but scattered:
- local manufacture, the founding idea in 2018 press
- a named-print system with humour (Tipsy Sardine, Olive Camels, Espresso By The Beach)
- matching father-and-son prints
- dense physical retail across Cairo and the coast

Day to day, the site leads with product grids and markdowns.

---

## 4. Store network (from /pages/store-list)

Direct (live site, 2026-10-15), https://kaicollections.com/pages/store-list. Names follow KAI's wording. The page also publishes a mobile number for every own store except Matcha Caesar, whose "Mobile:" field is empty.

| Region (KAI's heading) | KAI stores |
| --- | --- |
| CAIRO, EGYPT | "(TEMPORARILY CLOSED) Cairo Festival City, New Cairo" · City Centre Almaza, Heliopolis, Cairo · Mall of Egypt, 6th of October, Giza · District 5 Mall, New Cairo, Cairo · Mall Of Arabia, Gate 3, 6th Of October, Giza |
| ALEXANDRIA, EGYPT | City Center Alex, Alexandria |
| NORTH COAST, EGYPT | Marassi The Hub · Mountain View Light House, Ras Hekma · Marassi, Beach Club House · Lakeyard, Hacienda Bay · Telal Beach, El Alamein · La Vista Bay East, El Dabaa · Kyma Beach, South Med, El Dabaa · Matcha Caesar, Sodic, Ras El Hekma |
| "READ SEA, EGYPT" (sic) | Habitat Destination, Soma Bay |
| STOCK LIST | Four Seasons Hotel - Sharm El Sheikh · Jay Store - Garden 8, New Cairo · Jay Store - Designa Mall, Alexandria · Jay Store - Diplo 3, North Coast · Surf Shop - Abu Tig Marina, El Gouna · Surf Shop - Senzo Mall, Hurghada · Wavy Swimwear - Soho Square, Sharm El Sheikh |

Totals: **15 KAI store entries** (5 Cairo, of which 1 is temporarily closed; 1 Alexandria; 8 North Coast; 1 Red Sea) and **7 stockist entries**. Direct (live site, 2026-10-15), counted.

The two KAI pages disagree in places. All Direct (live site, 2026-10-15):
- About Us lists Cairo Festival City Mall as a flagship. The store list marks it "(TEMPORARILY CLOSED)".
- About Us names **Galeries Lafayette Dubai and Jashanmal Dubai**. The store list has **no UAE section**.
- The UAE store page (`kaicollections.ae/pages/stores`) cited in the earlier draft is unreachable from here (Indexed (search engines, ≤2026-10-14)). UAE retail is therefore confirmed today only by KAI's own About Us wording.

The homepage closes with a VISIT US module: a store photograph, the line "Pass by a store to try on the latest arrivals in person." and a "Find a Store" link. Direct (live site, 2026-10-15).

---

## 5. Press history

| Date | Outlet and headline | What it says about KAI | Check today | Provenance |
| --- | --- | --- | --- | --- |
| 18 Apr 2018 | Egyptian Streets: "Meet Kai Collections: The Premium Mens Swimwear Brand Defying Stigma", https://egyptianstreets.com/2018/04/18/meet-kai-collections-the-premium-mens-swimwear-brand-defying-stigma/ | Founder profile (McGill business student, per indexed text) | Unreachable (proxy refused) | Press (2018). Content Indexed (search engines, ≤2026-10-14) |
| 15 May 2018 | CairoScene: "Egypt's Newest Men's Swimwear Brand is Here to Up Your Sahel Game", https://cairoscene.com/Styled/Kai-Collection-Swimwear | Standfirst: "Locally designed and produced, Kai Collections is here to challenge international brands' dominance over the Egyptian men fashion market." Founder quotes on the devaluation and local production (§1). Safadi: "Our products and materials are made from scratch locally here in Egypt…" | **Loaded (200)** | Press (2018), re-read directly 2026-10-15 |
| 5 Jul 2018 | CairoScene: "7 Best Men and Women's Egyptian Swimwear Brands of Summer 2018", https://cairoscene.com/Styled/Egyptian-Swimwear-Brand | Listed under MEN as "Kai Collection": "Locally produced and designed, Kai Swimwear boasts a large collection of cool patterns and slick material…"; "Prices: EGP 850/piece" | **Loaded (200)** | Press (2018), re-read directly 2026-10-15 |
| 9 Aug 2018 | Flair Magazine: "Swim in Style with Egypt's KAI Collections", https://flair-magazine.com/2018/08/09/swim-in-style-with-egypts-kai-collections/ | Name = Hawaiian ocean + Cairo + the K of Karim (indexed text) | Unreachable (proxy refused) | Press (2018). Content Indexed (search engines, ≤2026-10-14) |
| 7 May 2024 | Arab News, https://arab.news/mwr2k | Calls a KAI swim line "launching soon", which conflicts with 2018. Not used | Unreachable | Press (2024). Content Indexed (search engines, ≤2026-10-14) |
| 31 May 2024 | Enterprise: "Stressing over swimsuits? We got you", https://enterpriseam.com/egypt/2024/05/31/stressing-over-swimsuits-we-got-you/ | Swimwear round-up | Unreachable | Press (2024). Content Indexed (search engines, ≤2026-10-14) |
| 5 Jun 2026 | Enterprise: "Your ultimate beach kit guide", https://enterpriseam.com/egypt/2026/06/05/your-ultimate-beach-kit-guide/ | "Locally manufactured"; swim price band ≈ EGP 900–2,400. That band is close to today's live full prices of EGP 799–2,399 for swim (§2) | Unreachable | Press (2026). Content Indexed (search engines, ≤2026-10-14) |
| undated | Scoop Empire: "From Cairo to the coast: Egypt's trendiest swimwear brands", https://scoopempire.com/from-cairo-to-the-coast-discover-egypts-trendiest-swimwear-brands/ | Round-up mention | Unreachable | Press (year unknown). Content Indexed (search engines, ≤2026-10-14) |

Stockist co-brand: a "JAY X KAI Festival del Mare Swim Shorts" sold by Jay stores (https://jay-stores.com/products/ss26swm-213). Indexed (search engines, ≤2026-10-14). jay-stores.com was unreachable today, and no "JAY" product appears in KAI's own products.json (Direct (live site, 2026-10-15)).

---

## 6. Channels

| Channel | Status | Provenance |
| --- | --- | --- |
| kaicollections.com (Shopify, EGP) | Live. Announcement bar "International Shipping Available". Footer: "Join the community / Be the first to discover new drops and special offers" email sign-up; links About Us, Stores, Refund policy, Shipping, Size Guide, Contact Us, FAQ, Terms of Service; payment marks labelled "American express", "Apple pay", "Master", "Visa" | Direct (live site, 2026-10-15) |
| Online and in-store returns | Product pages state: "*International Orders Are Not Applicable for Exchange/Refund", "*Orders placed online can be exchanged in stores, however refunds can only be processed through our online sales channel by contacting our support team." and "*Orders purchased in stores can be exchanged online or in stores, but can only be refunded from any of our stores." | Direct (live site, 2026-10-15), Mini Pink Polar page |
| kaicollections.ae (UAE storefront) | **Unreachable from this container** (proxy refused, HTTP 000). Its existence and its `/pages/stores` page are known only from the earlier search snapshots | Indexed (search engines, ≤2026-10-14) |
| Instagram @kaicollections.eg | The footer and contact page link it. From here it **redirects (302) to Instagram's login wall**, so posts, followers and captions were not checked | Direct (live site, 2026-10-15) |
| TikTok @kaicollections.eg · Facebook @kaicollections.eg | Linked from the footer (TikTok, Facebook) and the contact page (Facebook). Both **unreachable** from here (proxy refused) | Direct (live site, 2026-10-15) for the links; content not checked |
| LinkedIn (company page) | Unreachable today | Indexed (search engines, ≤2026-10-14) |
| Email and form | info@kaicollections.com; contact form protected by hCaptcha | Direct (live site, 2026-10-15) |
| Physical retail | 15 KAI store entries + 7 stockists (§4); Dubai department stores named on About Us | Direct (live site, 2026-10-15) |

---

## 7. Implications for the concept

These are interpretation, but each one rests on the measured facts above.

1. **Bring the story forward and quote it exactly.** The live homepage's HTML text never says Cairo, 2018 or *kai* = ocean. The concept's chapter 01 should quote About Us verbatim ("KAI - Hawaiian for: {noun} Ocean, sea, beach, seaside, seawater"; "designed and locally produced in Cairo") with a link. Founder details (Karim Safadi, the devaluation origin) must be attributed to CairoScene 2018 and not presented as KAI's own words. The Cairo/K-of-Karim reading of the name stays labelled as Flair, unverified today.
2. **Keep "Made in Egypt" at the right level.** KAI makes the claim at brand level (About Us) and at product level only on its 34 men's swim shorts. Product pages in the concept should show "Made in Egypt" only where KAI's own page says it. Anywhere else, the brand claim should be attributed to About Us.
3. **Be truthful about departments.** SS26 kids means 18 Mini swim shorts, written for "your little guy". A "Three wardrobes" kids panel built on Mini/adult pairs (15 real SS26 pairs, e.g. Yellow Zebra) is accurate. Anything suggesting girls' swim or broader kidswear is not.
4. **Treat swim and linen as equals.** Swim and linen are each about 28% of SS26, and KAI itself says "swim & ready-to-wear". The Swim / Linen / Resort / Knit doors match the real assortment better than a swim-only story would.
5. **Use the naming systems KAI already has.**
   - 30 named men's prints, with Mini twins for the kids.
   - 13 one-piece style names and 4 bikini styles, in a consistent colour vocabulary (Mocha, Matcha, Butter, Stone, Ivory, Olive).

   The concept can give these names more presence (print-led browsing, style families). It must not invent print stories, because KAI publishes none.
6. **Present prices honestly.**
   - 84% of products are marked down, with a median of 50%, in an October snapshot.
   - Show compare-at prices exactly as KAI lists them, dated.
   - Let editorial chapters lead with product and material rather than "sale".
   - "N sizes left" is backed by data: 104 multi-size in-stock items have two or fewer sizes left.
7. **Store locator.** Use the store-list page as the source of truth: 15 KAI entries and 7 stockists, with Cairo Festival City shown as temporarily closed and Matcha Caesar without a phone number. Show the Dubai stockists only as "named on KAI's About Us". Do not claim more UAE stores while kaicollections.ae cannot be checked.
8. **Normalising the data is justified.** KAI uses 52 product-type spellings in SS26 and season-coded handles such as `ss26-mens-copy` and `black-friday-sale-ss25-copy`. Mapping these to clean categories is a real improvement. KAI's product handles should stay unchanged, so that every hand-off link opens the right page.
9. **Rights stay as stated in the README.** KAI's photographs and logo are referenced by URL from KAI's CDN and never stored in the repository. Public hosting needs KAI's permission; `VITE_KAI_MEDIA=off` builds without them.
10. **Gaps resolved by today's checks:**
    - "Tipsy Sardine" and "Butter Isla" exist (SS26).
    - The store list was re-read.
    - The live nav, homepage modules and catalogue were confirmed.

    **Gaps that remain:**
    - KAI's brand guidelines, logo source files and colours
    - UAE pricing and the UAE store list (kaicollections.ae unreachable)
    - Instagram content (login wall)
    - The McGill and name-etymology press claims (press sites unreachable)
    - Permission to use KAI's media
