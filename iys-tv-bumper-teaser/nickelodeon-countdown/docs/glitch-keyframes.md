# The glitch: 18 frames, 0.6 s (film frames 322–339, 10.733–11.333 s)

The recipe for every frame is in `comp/glitch.py`, in the `KEYS` table. It is seeded, so it renders identically every time.

It uses no new imagery: only the card's own last frames, TV static, and the countdown's signal breaking through. The images are the delivered film's own frames: `out/stills/<format>/glitch-keyframes.png` shows frames 321 to 340.

The recipe is unchanged from the first delivery, where it interrupted the Nickelodeon ident in the same slot. It now freezes and tears the IN YOUR SHOE logo on black instead. On black, the torn bands that fall below the logo are black on black, so the freeze reads as a still logo with a slight colour split until the static rises.

| Brief | Film frame | Glitch frame | On the screen | Sound |
|---|---|---|---|---|
| A: the logo | 223–321 | | the IN YOUR SHOE logo on black, holding to its last frame (card frame 98) | the sting, chime and held chord |
| B: freeze / tear | 322 | g0 | frozen on the logo's last frame; one band tears sideways (+4.5 %); 3 px RGB split | the last frame's sound again |
| | 323 | g1 | stutters back to the frame before; two tears; the picture slips 1 % | that frame's sound |
| C: strong but controlled interference | 324 | g2 | the last frame again; three tears, scanline displacement wave, 7 px RGB split, static 22 % | the last frame's sound, static rising |
| | 325 | g3 | tears up to 20 % of the width, a bright sync bar, 11 px RGB split, static 42 % | static, sync buzz |
| | 326–327 | g4–g5 | the picture loses vertical hold (rolls 21 %, then 43 %, with the dark blanking bar) and dissolves into static (70 %, 88 %) | static peak |
| (brief signal loss) | 328 | g6 | no signal: near-black, faint snow, one thin bright sync line | a low pop |
| D: horizontal distortion and RGB displacement | 329–332 | g7–g10 | the new signal, the countdown, rolls in from above: torn, waving, 16 → 7 px RGB split, static 62 → 20 % | static falling, a sync buzz at 331 |
| E: resolves into the countdown | 333–339 | g11–g17 | the roll stops, the last small tears and a 2 % hold slip die away; RGB split 5 → 0.3 px; static settles to the countdown's faint snow | static fading |
| | 340 | | the countdown's clock starts: `22:22:22` | a low lock-in thump; the drone begins |

## No white flash, no flash hazard

- The static averages a linear brightness of 0.26, far below full white (about 0.86). From the black logo it lifts the screen to a grey snow, then dies away to the countdown's black.
- The brightest single element is a thin sync line.
- QA counts the flashes in the delivered films, as opposing swings of 10 % or more in relative luminance, over the whole frame and its middle. It requires no more than three in any second (WCAG 2.3.1).
