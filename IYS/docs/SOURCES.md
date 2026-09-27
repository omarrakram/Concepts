# Sources

Every external asset and fact in this concept comes from In Your Shoe’s **public** website. No private, internal or unpublished material is used. Retrieved **2026-09-27**.

Product data and imagery are pulled by `npm run fetch-assets` from the storefront’s public product JSON (`/products/<handle>.js`, Egypt market, EGP); images are resized locally to WebP (never upscaled). Re-running the script refreshes prices and stock and rewrites the image table in `.qa/SOURCES.generated.md`.

## Pages researched

- https://inyourshoe.com/ — homepage — navigation, marquee (“You’re about to make a Cool Decision!”), footer, logo, brand kit colours, campaign banners
- https://inyourshoe.com/pages/about-us — brand origin (April 2018, socks), 250,000+ customers, campaign photo
- https://inyourshoe.com/pages/iysxzed — IYS × ZED FC collaboration — verified live; headline, licensing line, products, campaign photos
- https://inyourshoe.com/pages/store-locations — 10 stores — names, address lines, Google Maps links, store photos
- https://inyourshoe.com/pages/faqs — delivery times, same-day delivery, “outfit check” line
- https://inyourshoe.com/pages/shipping-policy — delivery durations, free shipping over 2,499 EGP
- https://inyourshoe.com/pages/exchange-refund-policy — 14-day exchange/refund conditions
- https://inyourshoe.com/collections/pjoys — live Pjoys (30 at retrieval)
- https://inyourshoe.com/collections/fluffy-pjoys — live Fluffy Pjoys; the “Pjoys are our terminology…” definition (product descriptions)
- https://inyourshoe.com/collections/hoodies · /t-shirts · /long-sleeves-and-polos · /jeans · /women · /all-kids-products · /all-socks · /hats-caps · /bandanas · /all-bags · /best-sellers · /newest — which products are currently live, prices, availability, imagery (public `products.json` of each collection)

## Official copy used

| line | where it appears |
| --- | --- |
| You’re about to make a Cool Decision! | inyourshoe.com — scrolling marquee (footer: “You’re about to make a cool decision”) |
| The Coolest Apparel In Town! | inyourshoe.com — page title (brand kit slogan: “The coolest apparel in town.”) |
| What started with two friends competing over who rocked better socks ended with the creation of In Your Shoe in April 2018, with the goal of blowing everyone’s socks off! | /pages/about-us |
| more than 250,000 happy customers | /pages/about-us |
| Not fan merch. A uniform for the next generation. | /pages/iysxzed |
| Officially licensed IYS × ZED FC collab. | /pages/iysxzed |
| Pjoys are our terminology for pyjama pants that are super joyful, just like you reading this. | Pjoys product descriptions, e.g. /products/beanie-pjoys |
| the fluffy winter edition | Fluffy Pjoys product descriptions |
| If still unsure, visit any of our stores for that “outfit check”. | /pages/faqs |
| Product captions (e.g. “Relax, it’s just about breakfast (probably).”) | verbatim excerpts of each product’s own description on its product page (listed below) |

Everything else on screen (room names, mood labels, notes, toasts, button jokes) is concept copy, registered in `src/data/copy.ts` / `src/data/moods.ts` and marked *CONCEPT COPY — NOT OFFICIAL BRAND LANGUAGE*.

Brand colours `#FF6060` (primary), `#06478E` (text) and `#4B87C8` (secondary) are the storefront’s public brand-kit values. The logo files are the current storefront header logo, footer white wordmark and IYS monogram.

## Products (19)

| product | price (EGP) | sizes (✗ = sold out at retrieval) | product page | data |
| --- | --- | --- | --- | --- |
| Cereal Killer Pjoys | 799 | S M L XL | https://inyourshoe.com/products/cereal-killer-pjoys | [.js](https://inyourshoe.com/products/cereal-killer-pjoys.js) |
| Doggies Pjoys | 799 | S M L XL | https://inyourshoe.com/products/doggies-pjoys | [.js](https://inyourshoe.com/products/doggies-pjoys.js) |
| Love You So Matcha Pjoys | 799 | S M L XL | https://inyourshoe.com/products/love-you-so-matcha-pjoys | [.js](https://inyourshoe.com/products/love-you-so-matcha-pjoys.js) |
| Sunset Pjoys | 799 | S M L XL | https://inyourshoe.com/products/sunset-pjoys | [.js](https://inyourshoe.com/products/sunset-pjoys.js) |
| Main Character Pjoys | 799 | S M L XL✗ | https://inyourshoe.com/products/main-character-pjoys | [.js](https://inyourshoe.com/products/main-character-pjoys.js) |
| Mood Swings Fluffy Pjoys | 999 | XS S M L XL | https://inyourshoe.com/products/mood-swings-fluffy-pjoys | [.js](https://inyourshoe.com/products/mood-swings-fluffy-pjoys.js) |
| Just Sleepy Fluffy Pjoys | 999 | XS S M L XL | https://inyourshoe.com/products/just-sleepy-fluffy-pjoys | [.js](https://inyourshoe.com/products/just-sleepy-fluffy-pjoys.js) |
| Cairo Is A Mindset Oversized Hoodie | 1799 | S M L XL | https://inyourshoe.com/products/cairo-is-a-mindset-oversized-hoodie | [.js](https://inyourshoe.com/products/cairo-is-a-mindset-oversized-hoodie.js) |
| Cereal Crimes Oversized Tee | 1099 | S M L XL | https://inyourshoe.com/products/cereal-crimes-oversized-tee | [.js](https://inyourshoe.com/products/cereal-crimes-oversized-tee.js) |
| Egyptian Culture Oversized Long Sleeves | 1199 | S M L XL | https://inyourshoe.com/products/egyptian-culture-oversized-long-sleeves | [.js](https://inyourshoe.com/products/egyptian-culture-oversized-long-sleeves.js) |
| Orange Cairo Jersey | 1099 | S✗ M L XL | https://inyourshoe.com/products/orange-cairo-jersey | [.js](https://inyourshoe.com/products/orange-cairo-jersey.js) |
| Female Denim Blue Washed Wide Leg Jeans | 1399 | 34 36 38 40 42 | https://inyourshoe.com/products/female-denim-blue-washed-wide-leg-jeans | [.js](https://inyourshoe.com/products/female-denim-blue-washed-wide-leg-jeans.js) |
| Female Red Striped Regular Shirt | 799 (was 1299) | S M L XL✗ | https://inyourshoe.com/products/female-red-striped-regular-shirt | [.js](https://inyourshoe.com/products/female-red-striped-regular-shirt.js) |
| ZED Stars Jersey | 1099 | S M L XL | https://inyourshoe.com/products/zed-stars-jersey | [.js](https://inyourshoe.com/products/zed-stars-jersey.js) |
| Striped Youth Dept Jersey | 1099 | S M L XL | https://inyourshoe.com/products/striped-youth-dept-jersey | [.js](https://inyourshoe.com/products/striped-youth-dept-jersey.js) |
| DNA Is Football Oversized Tee | 1099 | S M L✗ XL✗ | https://inyourshoe.com/products/dna-is-football-oversized-tee | [.js](https://inyourshoe.com/products/dna-is-football-oversized-tee.js) |
| I Love Cairo Neck Socks | 159 | one size | https://inyourshoe.com/products/i-love-cairo-neck-socks | [.js](https://inyourshoe.com/products/i-love-cairo-neck-socks.js) |
| Masr Washed Cap | 749 | one size | https://inyourshoe.com/products/masr-washed-cap | [.js](https://inyourshoe.com/products/masr-washed-cap.js) |
| Blue Cairo Kids Jersey | 799 | 2-3✗ 4-5✗ 6-7✗ 8-9 10-11 12-13✗ | https://inyourshoe.com/products/blue-cairo-kids-jersey | [.js](https://inyourshoe.com/products/blue-cairo-kids-jersey.js) |

## Images

### Brand, campaign, collab and store imagery

| file | what | source file | found on | retrieved |
| --- | --- | --- | --- | --- |
| `public/iys/brand/logo.webp` | IN YOUR SHOE | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/Name_PNG_aa2488c8-8e3c-4a35-bd7f-8e36f9e671ea.png | https://inyourshoe.com/ | 2026-09-27 |
| `public/iys/brand/logo-white.webp` | IN YOUR SHOE | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/INYOURSHOE-LOGO-WHITE.png | https://inyourshoe.com/ | 2026-09-27 |
| `public/iys/brand/mark.webp` | IYS | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/IYS_LOGO_ce45456e-9db1-4ed7-8da4-cec07fa2b235.png | https://inyourshoe.com/ | 2026-09-27 |
| `public/iys/campaign/campaign-couch.webp` | Four friends lying on a couch in IYS Pjoys | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/slider_new_web_5.jpg | https://inyourshoe.com/pages/about-us | 2026-09-27 |
| `public/iys/campaign/campaign-fw27-room.webp` | Two people in brown IYS hoodies in a room with a retro TV | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/FW27-MOBILE-01_jpg.jpg | https://inyourshoe.com/ | 2026-09-27 |
| `public/iys/campaign/campaign-fw27-stack.webp` | A stack of folded IYS pieces on a wooden floor | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/FW27-MOBILE-02_jpg.jpg | https://inyourshoe.com/ | 2026-09-27 |
| `public/iys/collabs/zed-lockers.webp` | IYS × ZED campaign — photos and stickers on green lockers | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/MOBILE-SLIDER-UPDATED-ZED_jpg.jpg | https://inyourshoe.com/ | 2026-09-27 |
| `public/iys/collabs/zed-court.webp` | IYS × ZED campaign on a basketball court | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/IMG_5585.jpg | https://inyourshoe.com/pages/iysxzed | 2026-09-27 |
| `public/iys/collabs/zed-pitch.webp` | IYS × ZED campaign on a football pitch | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/IMG_5588.jpg | https://inyourshoe.com/pages/iysxzed | 2026-09-27 |
| `public/iys/collabs/zed-pitch-2.webp` | IYS × ZED campaign in the stands | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/IMG_5589.jpg | https://inyourshoe.com/pages/iysxzed | 2026-09-27 |
| `public/iys/stores/store-city-stars.webp` | IN YOUR SHOE store front, City Stars | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/WhatsApp_Image_2025-12-23_at_22.20.50.jpg | https://inyourshoe.com/pages/store-locations | 2026-09-27 |
| `public/iys/stores/store-u-venues.webp` | IN YOUR SHOE store, U Venues | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/Screenshot_from_2025-11-30_12-53-03.png | https://inyourshoe.com/pages/store-locations | 2026-09-27 |
| `public/iys/stores/store-almaza.webp` | IN YOUR SHOE store, City Centre Almaza | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/PHOTO-2023-12-07-15-25-34_85844759-b2a6-4aa5-b36e-9afd3d87f760.jpg | https://inyourshoe.com/pages/store-locations | 2026-09-27 |
| `public/iys/stores/store-district-5.webp` | IN YOUR SHOE store front, District 5 | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/WhatsApp_Image_2025-09-21_at_06.24.15.jpg | https://inyourshoe.com/pages/store-locations | 2026-09-27 |
| `public/iys/stores/store-open-air-mall.webp` | IN YOUR SHOE store front at night, Open Air Mall | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/1000141396.jpg | https://inyourshoe.com/pages/store-locations | 2026-09-27 |
| `public/iys/stores/store-mall-of-egypt.webp` | IN YOUR SHOE store, Mall of Egypt | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/IMG_6789.heic | https://inyourshoe.com/pages/store-locations | 2026-09-27 |
| `public/iys/stores/store-the-yard.webp` | IN YOUR SHOE store front, The Yard Mall | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/yard_1.jpg | https://inyourshoe.com/pages/store-locations | 2026-09-27 |
| `public/iys/stores/store-alexandria.webp` | IN YOUR SHOE store front, City Centre Alexandria | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/CITY_ALEX_bc620aad-7802-402b-8e74-1db44ecdc1d2.jpg | https://inyourshoe.com/pages/store-locations | 2026-09-27 |
| `public/iys/stores/store-el-gouna.webp` | IN YOUR SHOE store, El Gouna | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/98dcb071-e53a-49a1-b01f-59570bad4639_7287938e-67c1-4381-afdf-9d616098c153.jpg | https://inyourshoe.com/pages/store-locations | 2026-09-27 |
| `public/iys/stores/store-the-wing.webp` | IN YOUR SHOE store, The Wing Outlet | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/PHOTO-2024-03-07-17-14-21_a9f54e37-4cf0-48f2-bb83-3eef0465bd17.jpg | https://inyourshoe.com/pages/store-locations | 2026-09-27 |

### Product imagery

| file | source file | retrieved |
| --- | --- | --- |
| `public/iys/products/cereal-killer-pjoys-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cereal-killer-pjoys-pjoys-in-your-shoe-901214.jpg | 2026-09-27 |
| `public/iys/products/cereal-killer-pjoys-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cereal-killer-pjoys-pjoys-in-your-shoe-201261.jpg | 2026-09-27 |
| `public/iys/products/cereal-killer-pjoys-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cereal-killer-pjoys-pjoys-in-your-shoe-683352.jpg | 2026-09-27 |
| `public/iys/products/cereal-killer-pjoys-4.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cereal-killer-pjoys-pjoys-in-your-shoe-712347.jpg | 2026-09-27 |
| `public/iys/products/doggies-pjoys-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/doggies-pjoys-pjoys-in-your-shoe-503334.jpg | 2026-09-27 |
| `public/iys/products/doggies-pjoys-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/doggies-pjoys-pjoys-in-your-shoe-266676.jpg | 2026-09-27 |
| `public/iys/products/doggies-pjoys-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/doggies-pjoys-pjoys-in-your-shoe-363135.jpg | 2026-09-27 |
| `public/iys/products/love-you-so-matcha-pjoys-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/love-you-so-matcha-pjoys-pjoys-in-your-shoe-148812.jpg | 2026-09-27 |
| `public/iys/products/love-you-so-matcha-pjoys-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/love-you-so-matcha-pjoys-pjoys-in-your-shoe-325392.jpg | 2026-09-27 |
| `public/iys/products/love-you-so-matcha-pjoys-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/love-you-so-matcha-pjoys-pjoys-in-your-shoe-845552.jpg | 2026-09-27 |
| `public/iys/products/sunset-pjoys-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/sunset-pjoys-pjoys-in-your-shoe-230621.jpg | 2026-09-27 |
| `public/iys/products/sunset-pjoys-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/sunset-pjoys-pjoys-in-your-shoe-933918.jpg | 2026-09-27 |
| `public/iys/products/sunset-pjoys-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/sunset-pjoys-pjoys-in-your-shoe-428536.jpg | 2026-09-27 |
| `public/iys/products/main-character-pjoys-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/main-character-pjoys-pjoys-in-your-shoe-765906.jpg | 2026-09-27 |
| `public/iys/products/main-character-pjoys-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/main-character-pjoys-pjoys-in-your-shoe-470856.jpg | 2026-09-27 |
| `public/iys/products/main-character-pjoys-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/main-character-pjoys-pjoys-in-your-shoe-925694.jpg | 2026-09-27 |
| `public/iys/products/mood-swings-fluffy-pjoys-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/mood-swings-fluffy-pjoys-fluffy-pjoys-in-your-shoe-377819.jpg | 2026-09-27 |
| `public/iys/products/mood-swings-fluffy-pjoys-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/mood-swings-fluffy-pjoys-fluffy-pjoys-in-your-shoe-649335.jpg | 2026-09-27 |
| `public/iys/products/mood-swings-fluffy-pjoys-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/mood-swings-fluffy-pjoys-fluffy-pjoys-in-your-shoe-558641.jpg | 2026-09-27 |
| `public/iys/products/just-sleepy-fluffy-pjoys-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/just-sleepy-fluffy-pjoys-fluffy-pjoys-in-your-shoe-548089.jpg | 2026-09-27 |
| `public/iys/products/just-sleepy-fluffy-pjoys-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/just-sleepy-fluffy-pjoys-fluffy-pjoys-in-your-shoe-668495.jpg | 2026-09-27 |
| `public/iys/products/just-sleepy-fluffy-pjoys-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/just-sleepy-fluffy-pjoys-fluffy-pjoys-in-your-shoe-593877.jpg | 2026-09-27 |
| `public/iys/products/cairo-is-a-mindset-oversized-hoodie-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cairo-is-a-mindset-oversized-hoodie-printed-hoodies-in-your-shoe-667690.jpg | 2026-09-27 |
| `public/iys/products/cairo-is-a-mindset-oversized-hoodie-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cairo-is-a-mindset-oversized-hoodie-printed-hoodies-in-your-shoe-697430.jpg | 2026-09-27 |
| `public/iys/products/cairo-is-a-mindset-oversized-hoodie-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cairo-is-a-mindset-oversized-hoodie-printed-hoodies-in-your-shoe-798730.jpg | 2026-09-27 |
| `public/iys/products/cairo-is-a-mindset-oversized-hoodie-4.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cairo-is-a-mindset-oversized-hoodie-printed-hoodies-in-your-shoe-959651.jpg | 2026-09-27 |
| `public/iys/products/cereal-crimes-oversized-tee-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cereal-crimes-oversized-tee-printed-oversized-tees-in-your-shoe-106103.jpg | 2026-09-27 |
| `public/iys/products/cereal-crimes-oversized-tee-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cereal-crimes-oversized-tee-printed-oversized-tees-in-your-shoe-641209.jpg | 2026-09-27 |
| `public/iys/products/cereal-crimes-oversized-tee-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/cereal-crimes-oversized-tee-printed-oversized-tees-in-your-shoe-766785.jpg | 2026-09-27 |
| `public/iys/products/egyptian-culture-oversized-long-sleeves-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/egyptian-culture-oversized-long-sleeves-long-sleeves-in-your-shoe-282745.jpg | 2026-09-27 |
| `public/iys/products/egyptian-culture-oversized-long-sleeves-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/egyptian-culture-oversized-long-sleeves-long-sleeves-in-your-shoe-716968.jpg | 2026-09-27 |
| `public/iys/products/egyptian-culture-oversized-long-sleeves-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/egyptian-culture-oversized-long-sleeves-long-sleeves-in-your-shoe-278377.jpg | 2026-09-27 |
| `public/iys/products/orange-cairo-jersey-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/orange-cairo-jersey-jersey-in-your-shoe-110829.jpg | 2026-09-27 |
| `public/iys/products/orange-cairo-jersey-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/orange-cairo-jersey-jersey-in-your-shoe-398913.jpg | 2026-09-27 |
| `public/iys/products/orange-cairo-jersey-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/orange-cairo-jersey-jersey-in-your-shoe-573200.jpg | 2026-09-27 |
| `public/iys/products/female-denim-blue-washed-wide-leg-jeans-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/female-denim-blue-washed-wide-leg-jeans-jeans-in-your-shoe-430045.jpg | 2026-09-27 |
| `public/iys/products/female-denim-blue-washed-wide-leg-jeans-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/female-denim-blue-washed-wide-leg-jeans-jeans-in-your-shoe-101686.jpg | 2026-09-27 |
| `public/iys/products/female-red-striped-regular-shirt-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/female-red-striped-regular-shirt-regular-shirts-in-your-shoe-249213.jpg | 2026-09-27 |
| `public/iys/products/female-red-striped-regular-shirt-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/female-red-striped-regular-shirt-regular-shirts-in-your-shoe-465861.jpg | 2026-09-27 |
| `public/iys/products/female-red-striped-regular-shirt-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/female-red-striped-regular-shirt-regular-shirts-in-your-shoe-771710.jpg | 2026-09-27 |
| `public/iys/products/zed-stars-jersey-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/zed-stars-jersey-jersey-iys-x-zed-433067.jpg | 2026-09-27 |
| `public/iys/products/zed-stars-jersey-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/zed-stars-jersey-jersey-iys-x-zed-777846.jpg | 2026-09-27 |
| `public/iys/products/zed-stars-jersey-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/zed-stars-jersey-jersey-iys-x-zed-676263.jpg | 2026-09-27 |
| `public/iys/products/striped-youth-dept-jersey-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/striped-youth-dept-jersey-jersey-iys-x-zed-189654.jpg | 2026-09-27 |
| `public/iys/products/striped-youth-dept-jersey-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/striped-youth-dept-jersey-jersey-iys-x-zed-630420.jpg | 2026-09-27 |
| `public/iys/products/striped-youth-dept-jersey-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/striped-youth-dept-jersey-jersey-iys-x-zed-707564.jpg | 2026-09-27 |
| `public/iys/products/dna-is-football-oversized-tee-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/dna-is-football-oversized-tee-printed-oversized-tees-iys-x-zed-749989.jpg | 2026-09-27 |
| `public/iys/products/dna-is-football-oversized-tee-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/dna-is-football-oversized-tee-printed-oversized-tees-iys-x-zed-475579.jpg | 2026-09-27 |
| `public/iys/products/dna-is-football-oversized-tee-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/dna-is-football-oversized-tee-printed-oversized-tees-iys-x-zed-755814.jpg | 2026-09-27 |
| `public/iys/products/i-love-cairo-neck-socks-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/i-love-cairo-neck-socks-neck-socks-in-your-shoe-316817.jpg | 2026-09-27 |
| `public/iys/products/i-love-cairo-neck-socks-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/i-love-cairo-neck-socks-neck-socks-in-your-shoe-974684.jpg | 2026-09-27 |
| `public/iys/products/masr-washed-cap-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/masr-washed-cap-washed-cap-in-your-shoe-699948.jpg | 2026-09-27 |
| `public/iys/products/masr-washed-cap-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/masr-washed-cap-washed-cap-in-your-shoe-870100.jpg | 2026-09-27 |
| `public/iys/products/blue-cairo-kids-jersey-1.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/blue-cairo-kids-jersey-kids-jersey-in-your-shoe-766203.jpg | 2026-09-27 |
| `public/iys/products/blue-cairo-kids-jersey-2.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/blue-cairo-kids-jersey-kids-jersey-in-your-shoe-533622.jpg | 2026-09-27 |
| `public/iys/products/blue-cairo-kids-jersey-3.webp` | https://cdn.shopify.com/s/files/1/0050/2729/9397/files/blue-cairo-kids-jersey-kids-jersey-in-your-shoe-694285.jpg | 2026-09-27 |

All photography, product names and the IN YOUR SHOE logo belong to In Your Shoe and are used here only for an unofficial, non-commercial portfolio concept.

