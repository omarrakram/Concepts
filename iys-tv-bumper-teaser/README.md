# IN YOUR SHOE: the lost TV bumper

A 15-second vertical teaser (1080 × 1920, 30 fps) for IN YOUR SHOE's
November campaign. Someone is watching cartoons on an old TV in a 2000s
room; a CGI channel bumper of the kind that ran between kids' programmes cuts
in; its chrome cube character swallows a glowing orange ball and turns into an
IN YOUR SHOE shoebox. The lid lifts, light spills out: **STAY TUNED.**

It teases a moment without naming it: no event name, date, offer, price or
product anywhere in it.

| | |
| --- | --- |
| Master | `out/final/IYS-LOST-TV-BUMPER-TEASER-1080x1920.mp4` (rendered, not committed) |
| 3D | Blender 4.2 LTS, Cycles: the room, the TV, the bumper's studio, character and box, all built by script |
| 2D and compositing | Remotion 4: the cartoon on the TV, the interruption, the period TV texture, the line |
| Sound | original, synthesised by `audio/synth.mjs` (no samples, no library music) |
| Brand | the official IN YOUR SHOE wordmark and monogram, unmodified (`assets/brand`) |

## Documents

1. [Reference breakdown](docs/01-reference-breakdown.md): what was supplied and what the teaser takes from it
2. [Storyboard](docs/02-storyboard.md) and its picture board, [`docs/storyboard.jpg`](docs/storyboard.jpg)
3. [Rights and sources](docs/03-rights-and-sources.md)
4. [Production and export commands](docs/04-production-and-export.md)
5. [Technical validation](docs/05-technical-validation.md)
6. [Public copy](docs/06-public-copy.md): the line, the cover, caption drafts
7. [Style frames and stills](docs/stills/)

## Quick start

```sh
npm ci
BLENDER=/path/to/blender npm run render -- --animatic          # the animatic, about 35 min
BLENDER=/path/to/blender npm run render -- --set=final --resume # the master, about 4 h on 4 cores
npm run qa -- --set=final
```

## Layout

```
assets/brand/      official IYS artwork + provenance
audio/synth.mjs    the soundtrack
blender/           the 3D: lib.py (helpers), bumper.py, room.py, render.py (CLI)
src/               Remotion: Teaser (the master), TVScreen, Cartoon, timeline
scripts/           render-all (the pipeline), qa (validation), contact-sheet (sheets, storyboard)
docs/              the documents above, the storyboard board, the stills
public/            fonts (OFL), a link to the brand files; renders/ and audio/ are generated
```
