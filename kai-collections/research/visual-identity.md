# Visual identity — what is KAI's, what is this concept's

## Could not be verified (no access to KAI's site, Instagram or CDN paths)

| Element | Status | What the concept does instead |
| --- | --- | --- |
| Official KAI logo / wordmark | **not seen** | "KAI" typeset in Fraunces, letter-spaced, everywhere. It is labelled as *not the official logo* in the footer, About page and README. Drop the official SVG into the `Wordmark` component to replace it. |
| Brand colours | **not seen** | A proposed palette (below), derived from the brand meaning (ocean) and the coastal retail calendar, not from KAI's files. |
| Site typography | **not seen** | Fraunces (variable: opsz, SOFT, WONK) + Jost. Both SIL Open Font License, self-hosted via Fontsource. |
| Campaign and product photography | **not seen** | No stock or AI imagery substitutes for KAI's. Photography slots are filled by `npm run sync` (hotlinked from KAI's CDN) when the site is reachable. Until then: rendered light studies, rendered material studies, illustrative flats. |
| Packaging, labels, swing tags | **not seen** | Not represented. |
| Print artwork (Yellow Zebra, Festival del Mare…) | **not seen** | Prints are **never drawn**. Flats use only the colour named in the product title; printed pieces whose names carry no colour are shown undyed, and every print flat says "print not shown". |

## What the indexed copy does tell us

- Product naming is colour-first and print-first ("Yellow Zebra", "Cobalt Blue Playa", "Matcha Perla", "Pear Isola"): colour is part of the identity.
- Line names borrow Mediterranean/Latin words — Playa, Palma, Isola, Perla, Mare, Sorrento, Mallorca — which supports a Mediterranean art direction without inventing places.
- Copy tone is warm, practical and lightly playful ("easy for you and your little guy to twin on the beach or pool").

## Concept palette (proposal — not KAI's verified colours)

| Token | Hex | Role |
| --- | --- | --- |
| Sea Salt | `#F5F1E9` | page ground |
| Warm Ivory | `#FFFDF7` | cards, buttons on dark |
| Sandstone | `#D8CDBD` | studio floor, dividers |
| Mediterranean Blue | `#285D74` | primary accent, hover tide |
| Deep Ocean | `#173843` | dark chapters, footer |
| Sunwashed Gold | `#E7BA78` | sun, focus on dark, rail marker |
| Soft Coral | `#D98770` | sale, badges (sparingly) |
| Ink | `#202827` | text |

The seascape shader carries five light presets (morning, noon, golden, dusk, night) whose sky/sea colours are tuned to sit between these tokens, so photography-free pages still feel like one palette.

## Typography

- **Display:** Fraunces Variable at optical size 144, weight 300, SOFT 60 — high-contrast but warm; the italic (WONK 1) gives "of escape." its swing.
- **Text and UI:** Jost Variable — geometric, Futura-like, a nod to mid-century resort posters; 11px uppercase labels at 0.22em tracking.
- **Wordmark (typeset):** Fraunces 340, tracking 0.32em.

## Signature devices

1. **The horizon line.** Product stages are a studio wall and floor divided by one hairline at 66%. The hero, The Horizon, the Atlas, the journal and the finale are all one rendered horizon.
2. **Letters on the water.** The wordmark stands on the horizon as plaster-white relief letters and is reflected — and, while it rises, refracted — in moving water (WebGL).
3. **The tide.** Hover states fill from below (buttons, collection doors); the film's transformation is a tide line that washes over the old site.
4. **Material studies.** Macro, procedurally drawn textiles (plain-weave linen, warp-knit swim tricot, cotton stockinette, French terry loops, mesh) paired only with fabric facts quoted from KAI's product pages.
5. **Illustrative flats.** Technical drawings per garment type with stitch lines, drawcords and nickel hardware — clearly captioned as illustrative.

## Avoided on purpose

Tropical clip-art, cartoon shells and palms, generic stock beach models, glassmorphism, dark "luxury" pastiche, and anything from BE-INDIE's photocopy/denim language.
