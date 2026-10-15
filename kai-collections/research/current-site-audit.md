# Current site audit — kaicollections.com

**Limitation:** the live site could not be opened, screenshotted or inspected from the build environment (egress policy). This audit is built only from what search engines indexed from KAI's own pages in the weeks before 14 Oct 2026 (the homepage snapshot was dated ~59 days old by the search index). It does not judge visual design, layout, motion or mobile behaviour, because those were not seen. No screenshot of the current site is included or simulated.

`npm run capture:before` captures the real homepage, a collection and a product page at phone size for the film as soon as the site is reachable.

## What the indexed pages show

**Platform.** Shopify (`/products/…`, `/collections/…`, `/pages/…` URL structure; Shopify CDN). A separate UAE storefront exists at `kaicollections.ae`.

**Homepage modules (from indexed text, in order seen):** a Swimwear banner — "Effortless, elegant, worn all summer" / "shop now"; a **New Arrivals** row mixing swim and ready-to-wear (Olive Kaia and Black Cala one pieces, Matcha Perla, Brown Ruffle Tencel Dress, women's linen tops and skirts, Festival del Mare sarong, Funky Fish beaded tank top, Black Zaria bikini top); "last chance, few pieces left"; a "lightweight summer linens" section; kids swimwear; "Pass by a store to try on the latest arrivals in person."

**Collections:** season-labelled handles and titles (SS24/SS25/SS26/FW25: "Womens Swimwear - SS25", "SS26 Mens Swimwear", "Mens - FW25"), plus internal-looking collection names exposed publicly ("Kids Collection BS", "Kids Collection NA"). The New Arrivals collection held a large fall/winter assortment (≈257 products indexed) while the homepage promoted swim.

**Product pages:** strong, specific copy — fabric and treatment, liner, drawcord hardware, waist range per size, fit advice, model height and size, care. Size selectors list all sizes with sold-out states.

**Currency:** product pages indexed in **EGP**, several collection pages indexed in **USD** (e.g. linen shirts at $23.89), presumably market/geolocation switching.

## What works (keep)

1. Precise, trustworthy product information — better than most regional competitors.
2. Named prints with personality; the name is the product.
3. Like Father, Like Son — a genuinely distinctive merchandising idea.
4. Physical retail promoted from the homepage.
5. A real three-department range.

## Opportunities (based on indexed structure, not visual inspection)

| Area | Observation | Concept response |
| --- | --- | --- |
| Storytelling | The best brand facts (Hawaiian *kai*, made in Cairo since 2018, the founder's local-manufacture idea, the name's three meanings) sit on About Us. | Brand meaning becomes the hero (KAI on the water) and chapter 01. |
| Discovery | Navigation by season handle (SS24/SS25/SS26/FW25) and internal names makes the catalogue feel like an archive. | Shop by department, by use (Swim, Linen & Resort, Resort, Everyday), by moment (Resort Atlas) and by pairing (Matching sets). |
| Seasonality | Fall/winter New Arrivals while the homepage leads with swim. | Edits are explicit and labelled (New in, Swim, Linen, Last chance). |
| Price clarity | EGP vs USD across pages; deep markdowns. | EGP everywhere, original and sale price with % saved, a dated "price as captured" line. |
| Sold-out density | Many indexed pieces sold out in all sizes. | "Hide sold out" toggle; honest "sold out in snapshot" flags. |
| Matching line | Like Father, Like Son exists but is a collection, not a journey. | Matching sets page; "Complete the set" on product pages; journal entry. |
| Fabric story | Strong facts buried in descriptions. | The Material Edit pairs each fabric with KAI's own sentences. |
| Styling | No visible styling tool in indexed pages. | Build your escape (rule-based, labelled — no fake AI). |

## Not assessed (needs the live site)

Visual design, photography, logo usage, header/footer structure, filtering and search UI, cart and checkout flow, page speed, mobile layout, accessibility.
