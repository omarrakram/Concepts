# KAI — The Art of Escape · 16-second film storyboard

**Format:** 1080 × 1920 (9:16), 60 fps, 960 frames, 16.000 s, H.264 + AAC. Source: `/showcase` (`src/showcase/Showcase.tsx`). Essential text stays inside the Reels/TikTok safe area (y 170–1500 px, x 60–1020 px).

**Emotional arc:** familiar → anticipation → transformation → beauty → discovery → interaction → desire → brand impact. One continuous rendered ocean runs under every AFTER scene: the film begins at morning and ends at dusk.

| Time | Scene | Picture | Sound |
| --- | --- | --- | --- |
| 0.00–1.10 | **BEFORE — Homepage** | With live captures: the real kaicollections.com homepage at phone size, scrolling. **This build:** a labelled *text view* of KAI's own indexed homepage copy and prices ("Effortless, elegant, worn all summer", New Arrivals with EGP prices). Chip: "Before · kaicollections.com". | Quiet room tone; soft click on load. |
| 1.10–2.20 | **BEFORE — Collection** | Live: SS26 Men's Swimwear. Text view: the SS26 Men's Swimwear list (Yellow Zebra, Blue Maze, Pink Starfish, Tropic Noir — EGP 1,699.00). | Click on page change. |
| 2.20–2.80 | **BEFORE — Product** | Live: Festival del Mare Swim Shorts page. Text view: its price, size run XS (28-30) … 3XL (40-42), 100% polyester, made in Egypt. | Click; the tide begins to rise underneath (2.40). |
| 2.80–3.45 | **THE TRANSFORMATION — the tide** | A glowing tide line rises from the bottom; below it the live sea, above it the old page drifting up and blurring until the water covers the frame. | Band-passed noise sweeping up, breaking at 3.45. |
| 3.45–5.50 | **AFTER — Brand impact** | The tide recedes to the horizon; **KAI** rises out of the water — refracted while submerged, then standing in plaster-white relief, reflected in the waves, the sun above the A. "The art *of escape.*" masks in; nav and "Explore the collection" arrive. Chip: "After · KAI — The Art of Escape · concept". | Sub boom + three-bell chord on the reveal; ocean ambience and a D major 9 pad bloom. |
| 5.50–7.00 | **AFTER — Homepage** | The real mobile homepage scrolls: hero away, "Kai is the Hawaiian word for *ocean.*", the sourced facts — then The Horizon slides up from below as the same ocean. | 120 bpm soft kick and shaker start. |
| 7.00–9.00 | **AFTER — The Horizon** | The site's own Horizon component, live: 06:40 Sunlit water → 11:20 Warm sand (sea becomes dunes) → 15:10 White walls (arches rise) → 18:30 Golden hour → 19:40 Blue hour, real KAI pieces standing on the waterline. | Pad moves to B minor 9; one bell pluck per chapter. |
| 9.00–10.80 | **AFTER — Collections** | Scrolling on into the three wardrobes (Men → Women), a tap on Women, a tide wipe into the real Women shop (header, filters, cards) and on down the grid; a tap on Black Playa One Piece. | Whoosh into the wardrobes; water swish on the wipe; taps. |
| 10.80–12.30 | **AFTER — Commerce** | The product page pushes in. Tap › : flat → detail → **material study** (82% nylon, 18% elastane). Scroll to sizes, tap **M (38)**, tap **Add to bag** — the real concept bag slides in with the line and subtotal EGP 1,099. | Softer beat; UI taps; two-note chime as the piece lands. |
| 12.30–13.90 | **AFTER — Mobile** | The bag screen shrinks into a phone floating over the sunset sea; two more phones swing in (Build your escape, The Coastal Journal); the centre phone becomes the Resort Atlas. "Made for *the hand.*" | Reverse swell into the shrink; A sus pad. |
| 13.90–16.00 | **FINAL LOCKUP** | The phones sink; the light turns to dusk; KAI rises again on the evening horizon. COLLECTIONS · *The art of escape.* · "Digital concept — Omar Akram · 2026" · "Unofficial concept · not affiliated with KAI Collections". | Low swell and a slow bell arpeggio resolving on D; fades to silence at 16.00. |

## Honesty notes

- Every AFTER frame is the finished concept: live components rendered at `t`, or screenshots of the built site (`npm run capture:plates`). No mock-ups.
- The BEFORE in this render is the text-view fallback because kaicollections.com could not be reached from the build environment. Run `npm run capture:before && npm run render` with access to get the genuine BEFORE footage; the timeline and transition are already built for it.
- "The art of escape" and "Made for the hand" are concept copy.
