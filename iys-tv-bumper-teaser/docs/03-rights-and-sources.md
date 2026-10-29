# Rights and sources

What is in the film, where each part comes from, and what the supplied
references were (and were not) used for.

## Made for this teaser (original)

Everything that is seen or heard, apart from the IN YOUR SHOE artwork and the
typeface below, is made by the code in this folder:

| Element | Made with | Where |
| --- | --- | --- |
| The room, the TV, the props, the light | Blender 4.2 LTS, modelled and lit by script (no downloaded models, textures or HDRIs) | `blender/room.py` |
| The bumper: the studio, the chrome cube character, its face, the ball, the shoebox | Blender, modelled, rigged and animated by script | `blender/bumper.py` |
| The cartoon on the TV (the pink creature, the hills, the sun) | Remotion (SVG) | `src/Cartoon.tsx` |
| The interruption wipe, the TV's picture, the period texture (scanlines, colour split, bloom, grain), the line of copy | Remotion | `src/TVScreen.tsx`, `src/Teaser.tsx` |
| The whole soundtrack: the cartoon's tune, the room tone, every effect, the music | synthesised from oscillators, noise and filters (no samples, no recordings, no loops, no library music) | `audio/synth.mjs` |

The character is deliberately not MBC3's: it is a silver chrome cube (not the
green “Cubee”), it has its own face, it plays with an orange ball and it turns
into a shoebox. The bumper borrows the grammar of the era's CGI idents
(squash and stretch, a centred camera, a radial studio, a logo lock), not any
one ident's design.

## IN YOUR SHOE artwork (official, unmodified)

The wordmark and the monogram are the official files from IN YOUR SHOE's own
storefront CDN, with their URLs and SHA-256 hashes in
[`assets/brand/PROVENANCE.md`](../assets/brand/PROVENANCE.md). They are used
at their own proportions: the wordmark as an image texture on the box's front,
the monogram's SVG outlines extruded on the lid and as the corner bug. No logo
was drawn, traced, retyped or redesigned, and no new mascot was made for the
brand (the cube is the bumper's character, and it becomes the IYS shoebox).

## Typeface

The one line of copy is set in **Montserrat** (ExtraBold), © The Montserrat
Project Authors, under the SIL Open Font License 1.1
([`public/fonts/LICENSE-OFL-montserrat.txt`](../public/fonts/LICENSE-OFL-montserrat.txt)),
from `@fontsource/montserrat`. It is chosen to sit with the wordmark's heavy
geometric capitals. It is not presented as IN YOUR SHOE's brand typeface: if
the brand has one, swap it in `src/fonts.ts`.

## Tools

- **Blender 4.2.23 LTS** (GPL). The software's licence does not extend to what
  it renders: the renders belong to whoever made them.
- **Remotion 4.0.534**. Free, including commercial use, for individuals, for
  for-profit organisations with up to 3 employees and for non-profits; larger
  for-profit organisations need a Remotion Company License
  (`node_modules/remotion/LICENSE.md`, <https://remotion.dev/license>). **Check
  this before the teaser is used commercially by a company larger than that.**
- ffmpeg (encoding and QA).

## The supplied references: study only

| Reference | Used for | Not used |
| --- | --- | --- |
| The four room images (the ZIP) | mood: the 2000s room, the golden light, the CRT, the low camera | No pixel of them. They contain third-party characters and brands (on the TV screens, posters, magazines, a cereal box), which are not reproduced. |
| The MBC3 ident video (a fan re-upload: an “HD” bug and a “Made With Cute CUT” watermark) | the motion grammar and the sound structure, studied frame by frame (`01-reference-breakdown.md`) | No frame, no audio, no logo, no mascot, no jingle. |

None of the reference files, frames taken from them or analyses that show them
are in this repository. Nothing was downloaded from broadcasters, fan wikis or
video sites for use in the film.

## MBC3

IN YOUR SHOE's teaser is not affiliated with, sponsored by, broadcast by or
endorsed by MBC3 or the MBC Group, and the film does not suggest it is:

- no MBC or MBC3 name, logo, mascot, jingle, footage or audio anywhere in it;
- no network slate, broadcaster credit, approval, sponsorship line or airtime
  stamp: the only logo in the corner is IN YOUR SHOE's own;
- the “TV” in the film is a generic 2000s set showing an original cartoon and
  an original bumper.

“MBC3-era” is this project's internal description of the look (the 2000s
satellite kids' TV that the audience grew up with). It should not appear in
public captions or descriptions: describe the film as a lost 2000s TV bumper,
if at all.

## Historical sources

- [Wikipedia, “MBC 3”](https://en.wikipedia.org/wiki/MBC_3), read 28 October
  2026: the channel's 2004 launch, the first identity by Turquoise, the 2005
  “Cubee” cube identity by LIGA 01 Computerfilm.
- Not available: mbc3-idents.fandom.com (a bot check, which was not bypassed)
  and the Wayback Machine (unreachable from the build environment). See
  `01-reference-breakdown.md`.

## The November campaign

The film teases without naming. It contains no event name, no date, no
countdown, no offer, no discount, no price, no product claim and no shop-now
button. The optional `11:11` clue from the brief is **not** used: the campaign
plan supplied does not confirm it. `npm run qa` scans the copy, the code and
the docs for the event's name and for offer language, and fails if it finds
any (`scripts/qa.mjs`).
