# IN YOUR SHOE — The Cool Decision Club

**Unofficial speculative digital concept. Not affiliated with In Your Shoe.**
Design & development concept by Omar Akram, 2026.

What if IYS's store online felt less like a catalogue and more like a place:
someone's cool, slightly chaotic bedroom, their wardrobe, their friends and
their city. You shop it the same way.

The site opens on the brand's own line, _"You're about to make a cool
decision"_, printed across a pair of wardrobe doors. Say yes (or obviously)
and the doors open onto real IYS pieces on a rail. From there you pick a
mood instead of a category, and walk through the house one room at a time.

## Rooms

| #   | Room                                | What happens                                                                                                                    |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 00  | **The Cool Decision**               | The official line as a poster on wardrobe doors → a physical YES / OBVIOUSLY toggle → the doors swing open and the hangers swing. |
| 01  | **How are you feeling?**            | Moods printed on real objects: pillow label, sticky note, ticket stub, Cairo street sign, pitch tape, star sticker, receipt. Picking one repaints the whole house and re-sorts the same real products (hand-curated, see `src/data/moods.ts`). |
| 02  | **The Wardrobe**                    | A full-width closet rail. Scroll moves the rail and the hangers swing with the speed. Pull a piece down to open it in the Mirror. Kids hang on the "little rail". |
| 03  | **The Pjoy Room**                   | Pjoys pegged on a laundry line you can drag, each swinging with the pull. Tap one: the pegs open, it drops into a spotlight where the pattern is the hero. Below it is a duvet stitched together from the real patterns. |
| 04  | **Cairo Mode / The Balcony**        | Campaign photography behind a balcony rail, enamel street signs spelling the product name _Cairo Is A Mindset_, and a building intercom where each flat is a product. |
| 05  | **The Locker Room · IYS × ZED**     | One chapter, not the whole house: lockers with tape labels open onto the collab pieces, plus a team sheet. |
| 06  | **The Drawer**                      | Accessories in a dresser, a nod to the sock origins (est. 2018). Pull a drawer and the small stuff slides out, one tap from the bag. |
| 07  | **The Wall**                        | Official campaign, store and product photos pinned up. You can drag them around. No invented customers and no fake reviews. |
| 08  | **Meet us IRL**                     | Stores as postcards that flip over to show the address. |
| 09  | **End frame**                       | A newsletter note that folds itself up, the official line, and the credits. |

Commerce stays plain wherever it matters: search, filters, sort, sizes, quick
add, wishlist, bag and quantities all behave like a real store.

- **The Mirror** (product detail, `/product/:handle`): an arched mirror with a draggable edge to compare two real photos, sizes as woven labels (the one you pick gets a safety pin), add to bag, the verified description, and "wear it with".
- **Your Bag**: a paper IYS shopping bag slides in and items hang in it as tags. The counter reads "Cool decisions: 03". The checkout button is still called **Checkout**, and it explains that this is a concept and links to each real product.
- **Search**: "What are we looking for?" runs live over the real product names. Suggestions only appear when they return real results.
- **Collection** (`/shop/pjoys`, `/shop/all`, `/shop/new`, …): an asymmetric but structured grid, filters for type, size and in-stock, and sort. On mobile it becomes a two-column feed with a filter & sort bottom sheet.

### Motion language

Flip · pin · stick · hang · drop · slide · swing · peel · fold · open · stamp · snap.
Weight, overshoot and friction, never cartoon physics. `prefers-reduced-motion` switches all of it off.

### Visual system

- Warm paper and ink, with a ballpoint blue for every handwritten note. Each mood repaints the room: sleepy blue, staying-in pink, going-out tomato, Cairo apricot, match-day green, chaotic yellow.
- Type: **Anybody** (variable width display, stacked poster-style so short words get huge), **Instrument Sans** (commerce), **Caveat** (the friend's handwriting, used sparingly) and **DM Mono** (tags, receipts, labels).
- Objects are drawn in SVG/CSS: hangers, pegs, safety pins, tape, stickers, lockers, balcony rails and intercoms. Every photo is an official IYS image.

## Run

```bash
cd IYS
npm install
npm run fetch-assets   # downloads the real product data + imagery (needs access to inyourshoe.com)
npm run dev            # http://localhost:5173/  ·  http://localhost:5173/showcase
npm run build          # type-check + production build → dist/
```

## Routes

| Route                    | What                                                   |
| ------------------------ | ------------------------------------------------------ |
| `/`                      | The house                                              |
| `/showcase`              | The 17.2 s portrait film (1080 × 1920)                 |
| `/showcase?t=5.2`        | Freeze on an exact frame (QA, posters, thumbnails)     |
| `/showcase?autoplay=0`   | Wait for `window.__iysShowcase.play()`                 |
| `/shop/:collection`      | `all`, `new`, `pjoys`, `outwear`, `women`, `kids`, `accessories`, `sportswear`, `wishlist` |
| `/product/:handle`       | The Mirror                                             |

## Showcase film

- **1080 × 1920, 60 fps, 17.2 s.** It's one deterministic GSAP master timeline with no randomness and no input (`src/showcase/timeline.ts`).
- Scenes: The Cool Decision (0.0 s) → How are you feeling? → Sleepy (1.3) → The Pjoy Room (3.5) → Wardrobe flip / Look 01 (6.0) → Cairo Mode (8.2) → Match Day, IYS × ZED (10.2) → The Wall (12.1) → The Mirror and the bag drop (14.0) → Final lockup (15.8), ending on a hard cut.
- Real IYS imagery appears from the first frames (photos taped to the wardrobe doors).
- Designed for portrait. Critical text stays inside x 70–930 / y 180–1500.
- `window.__iysShowcase` exposes `play()`, `pause()`, `seek(t)`, `restart()`, `time()`, `duration` and `ready`. Keyboard: space plays/pauses, R restarts.

### Render the MP4

```bash
npm run dev                       # terminal 1
npm run record                    # terminal 2 → out/iys-concept.mp4 (H.264, 1080×1920, 60 fps)
npm run frames                    # QA stills → out/frames/ (0.4, 1.4, 2.8 … 16.5 s)
npm run frames -- 5.2 9.1         # specific times
```

Rendering is frame-exact. Each frame is `seek(n / 60)` followed by a screenshot piped into ffmpeg, so the result doesn't depend on machine speed.
ffmpeg is looked up in this order: `$FFMPEG`, then `ffmpeg` on PATH, then the binary shipped with `pip install imageio-ffmpeg`.
Set `CHROMIUM=/path/to/chrome` if Playwright's own browser isn't installed. The MP4 is not committed.

## Data & sources

- `src/data/catalogue.generated.json` is built by `npm run fetch-assets` from the storefront's public product JSON (`/products/<handle>.js`). It holds name, price (EGP), sale state, sizes with availability, colours, description, publish date and image URLs, each stamped with `verifiedAt`. Nothing commercial is typed by hand.
- `scripts/cast.json` is the curated product cast plus official campaign, store and collab images.
- `src/data/products.ts` holds the concept layer on top: room, moods, nickname and caption. Captions are marked as concept copy.
- `src/data/assets.ts` covers brand, campaign, stores and collabs. `src/data/stores.ts` comes from the public store-locations page.
- `src/data/copy.ts` keeps **official** verified IYS lines separate from **concept copy**, which is labelled _CONCEPT COPY — NOT OFFICIAL BRAND LANGUAGE_.
- `docs/SOURCES.md` lists every downloaded image with its source URL and retrieval date.

Only public website and public social/press material is used. There's no private company information.

## Deploy (Vercel)

Import the repo and set **Root Directory** to `IYS`. The framework preset is Vite, the build command is `npm run build`, and the output is `dist/`.
`vercel.json` rewrites every non-asset path to `index.html`, so `/`, `/showcase`, `/shop/*` and `/product/*` all open directly.

## Limitations

- It's a concept. There's no payment, checkout isn't connected, and the newsletter sends nothing. The UI says so wherever it matters.
- The catalogue is a hand-picked cast of real products, not the full IYS range, and the collection pages say so.
- Mood mappings are hand-curated, not a recommendation engine.
- Prices and stock are a snapshot from the `verifiedAt` date. Re-run `npm run fetch-assets` to refresh them.

---

Product names, photography and the IN YOUR SHOE logo belong to In Your Shoe and are used here for a non-commercial portfolio concept.
Unofficial speculative digital concept. Not affiliated with In Your Shoe. Design & development concept by Omar Akram, 2026.
