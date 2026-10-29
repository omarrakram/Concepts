# Production and export

How the film is built, and the exact commands that render, encode and check it.

## Pipeline

```
audio/synth.mjs ──────────────────────────────────────────────► public/audio/mix.wav
blender/bumper.py (Blender, Cycles) ──► renders/<set>/bumper/####.png ──┐
                                        renders/final/bumper-hd/####.png ┤
src/TVScreen.tsx (Remotion) ◄── the bumper's 4:3 centre, 96–142          │
   └──► renders/<set>/tv/####.png ──► blender/room.py (the CRT's screen) │
                                        renders/<set>/room/####.png ─────┤
src/Teaser.tsx (Remotion): room → dissolve → bumper → HD reveal,         │
   period texture, the line, the bug, the mix ◄──────────────────────────┘
   └──► out/<set>/IYS-LOST-TV-BUMPER-…-1080x1920.mp4
```

(`renders/` above is `public/renders/`.) Two sets share one pipeline:

| Set | Use | 3D | Time on 4 CPU cores |
| --- | --- | --- | --- |
| `animatic` | Phase D: timing, rhythm, readability | 360 × 640, 6 samples, no motion blur | about 35 min |
| `final` | the master | the room and the bumper up to the reveal at 720 × 1280, 12 samples, motion blur; the reveal (frames 330–449) at 1080 × 1920, 16 samples, motion blur | about 3½ h (the reveal is about 40 s a frame) |

In the final, the room and the bumper's first part are rendered at 720 × 1280
and scaled to 1080 × 1920 in the composite, while the picture still carries the
TV's texture (softness, colour split, scanlines). From frame 330 the reveal
renders natively at 1080 × 1920 and cross-fades in over 330–336, as the texture
clears, so the box, the wordmark and the monogram are full resolution.

Everything is real 3D (Blender's Cycles path tracer: geometry, lights,
materials, a moving camera, motion blur): no element of the 3D is a still
image being zoomed or panned. The 2D parts are the cartoon on the TV, the
wipe, the period texture, the line and the corner bug.

## Requirements

- Node.js 22 (tested with 22.22) and npm.
- Blender 4.2 LTS (tested with 4.2.23, from download.blender.org). Put it on
  `PATH` or set `BLENDER=/path/to/blender`.
- ffmpeg 6 or later (encoding the faststart index, QA, contact sheets).
- A Chromium headless shell for Remotion: found automatically in
  `/opt/pw-browsers`, set with `REMOTION_BROWSER`, or downloaded by Remotion.

```sh
cd iys-tv-bumper-teaser
npm ci
```

## Render

```sh
# Phase D: the animatic
BLENDER=/path/to/blender npm run render -- --animatic
#   → out/animatic/IYS-LOST-TV-BUMPER-ANIMATIC-1080x1920.mp4

# Phase E/F: the master (all steps, in order; --resume skips 3D frames already on disk)
BLENDER=/path/to/blender npm run render -- --set=final --resume
#   → out/final/IYS-LOST-TV-BUMPER-TEASER-1080x1920.mp4
#   → out/final/stills/ (cover, first, last, four style frames)

# one step at a time, in this order: audio | bumper | tv | room | bumper-hd | teaser | stills
npm run render -- --set=final teaser stills
```

The 3D steps run Blender like this (from `scripts/render-all.mjs`):

```sh
blender -b --factory-startup -noaudio --python blender/render.py -- \
  --scene bumper --frames 96-336 --res 720x1280 --samples 12 --out public/renders/final/bumper
IYS_SET=final blender -b --factory-startup -noaudio --python blender/render.py -- \
  --scene room --frames 0-142 --res 720x1280 --samples 12 --out public/renders/final/room
blender -b --factory-startup -noaudio --python blender/render.py -- \
  --scene bumper --frames 330-449 --res 1080x1920 --samples 16 --out public/renders/final/bumper-hd
```

Add `--save scene.blend` to any of them to keep the built scene and open it in
Blender's UI, or build the scenes without rendering:

```sh
blender -b --factory-startup -noaudio --python blender/render.py -- --scene bumper --save out/source/bumper.blend --save-only
IYS_SET=final blender -b --factory-startup -noaudio --python blender/render.py -- --scene room --save out/source/room.blend --save-only
```

The scripts are the source; the `.blend` files are built from them (every
keyframe baked, texture paths relative to the project) and are not committed.

## Encoding (the master)

Remotion renders PNG frames and encodes them with its bundled ffmpeg:

| Setting | Value |
| --- | --- |
| Container | MP4, index at the front (`-movflags +faststart`, applied after the render) |
| Video | H.264 (libx264) High profile, CRF 16, preset `slow`, yuv420p, BT.709, 1080 × 1920, 30 fps constant |
| Audio | AAC-LC, 320 kb/s, 48 kHz stereo, from the 16-bit mix |
| Mix | −14 LUFS integrated, ≤ −1 dBTP (measured and limited in `audio/synth.mjs`) |

## Check

```sh
npm run qa -- --set=final          # → out/final/qa/validation.{md,json}; exits 1 on any failure
npm run sheet -- out/final/IYS-LOST-TV-BUMPER-TEASER-1080x1920.mp4 out/final/contact-sheet.jpg
npm run sheet -- --storyboard out/animatic/IYS-LOST-TV-BUMPER-ANIMATIC-1080x1920.mp4 docs/storyboard.jpg
```

## Optional versions

```sh
npm run render -- --set=final feed silent
```

- **4:5 feed** (`…-1080x1350.mp4`): the `Teaser4x5` composition. The same picture
  from 285 px down (so the TV, the character and the box stay in frame), the
  line in its place, the corner bug moved into the feed frame's own corner. It
  is rendered from the frames, not cropped from the encoded master, so there is
  no second generation of compression.
- **Without sound** (`…-silent.mp4`): the master's video stream, copied.
- **16:9** is not a crop of the 9:16 film: it needs its own camera framing in
  the bumper scene (`blender/bumper.py`, the camera keys) and is not made here.
