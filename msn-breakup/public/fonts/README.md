# Fonts

All of these fonts can be redistributed. Each one is loaded through
`@remotion/fonts` in `src/fonts.ts`, so a render waits until they are ready.
Nothing falls back to whatever fonts the rendering machine happens to have.

| File | Used for | Source | Licence |
| --- | --- | --- | --- |
| `wine-tahoma.ttf`, `wine-tahoma-bold.ttf` | all Windows XP / MSN UI text (the XP system font was Tahoma) | Wine project's metric-compatible Tahoma (“Wine Tahoma”, © 2004 Larry Snyder, based on Bitstream Vera Sans), from Ubuntu package `fonts-wine` 9.0~repack-4build3 (`tahoma.ttf`, `tahomabd.ttf`) | LGPL-2.1-or-later, `LICENSE-LGPL-2.1.txt` |
| `comic-neue-400/700.woff2` | her messages (a 2007 teenager's MSN font was Comic Sans) | `@fontsource/comic-neue` 5.3.0 | SIL OFL 1.1, `LICENSE-OFL-comic-neue.txt` |
| `arimo-400/700.woff2` | his messages (Arial default) | `@fontsource/arimo` 5.3.0 | SIL OFL 1.1, `LICENSE-OFL-arimo.txt` |
| `fira-sans-600/700.woff2`, `fira-sans-700-italic.woff2` | Luna title bars (Trebuchet MS stand-in); the bold italic sets the XP-style “welcome” in the carousel's opening (a stand-in: the original face is not documented here) | `@fontsource/fira-sans` 5.3.0 | SIL OFL 1.1, `LICENSE-OFL-fira-sans.txt` |
| `gelasio-400.woff2`, `gelasio-400-italic.woff2`, `gelasio-700.woff2` | her 2007 Tumblr blog (Georgia metrics: the blog serif of the time) | `@fontsource/gelasio` 5.3.0 (latin subset) | SIL OFL 1.1, `LICENSE-OFL-gelasio.txt` |
| `archivo-black-400.woff2` | the title of her Tumblr blog: Tumblr's 2007 default theme sets it in Arial Black, which is not included | `@fontsource/archivo-black` 5.3.0 (latin subset) | SIL OFL 1.1, `LICENSE-OFL-archivo-black.txt` |

Microsoft's Tahoma, Trebuchet MS, Comic Sans MS, Georgia and Arial Black are not included
and are not needed.
