# IN YOUR SHOE: the Nickelodeon countdown teaser

An **internal creative concept / pitch** for IN YOUR SHOE (IYS).

An old CRT television in a 2000s living room is playing The Fairly OddParents. Timmy wishes he had clothes like the popular kids. The channel cuts to a card: **SINGLE’S DAY**, then **OFFER ENDS IN**. The broadcast is hijacked: the picture tears and rolls into static, and a countdown locks in at `22:22:22` and ticks down. The film ends on the ticking countdown: no logo, no explanation.

> **Rights.** The cartoon is recognisable third-party material (Nickelodeon), used here only as an internal concept reference in the working environment. Nothing here is cleared for publication, implies any broadcaster's involvement or support, or grants any usage right. A public campaign would need a licence for the clip, or a replacement, settled separately. The supplied clip, the supplied TV photo and every rendered film stay out of git (`.gitignore`).

This folder is self-contained, beside the earlier TV-bumper teaser in `iys-tv-bumper-teaser/`, which it does not touch.

## The film (16.833 s, 505 frames at 30 fps)

| Film frames | Time | |
|---|---|---|
| 0–225 | 0.000–7.533 s | **The cartoon**: the whole supplied clip, its own dialogue. The wish runs 3.90–6.38 s; the wands rise after it. The camera watches the set, creeping in a little. |
| 226–321 | 7.533–10.733 s | **The card**, in the slot the Nickelodeon ident used to play in: SINGLE’S DAY lands with a sting on the cut, OFFER ENDS IN 0.6 s later (frame 244) with a chime. Both hold, pushing in slowly, until the glitch interrupts. The camera moves in. |
| 322–339 | 10.733–11.333 s | **The glitch**, 0.6 s: freeze, stutter, tearing, static, signal loss, the new signal rolling in. The screen now dominates the frame. ([keyframes](docs/glitch-keyframes.md)) |
| 340–504 | 11.333–16.833 s | **The countdown** (hours:minutes:seconds): `22:22:22` locks, then ticks `22:22:21`, `…20`, `…19`, `…18`, `…17`. The numbers fill the frame's width and the bezel slides out of shot. The film cuts half a second after the last tick, the countdown still running. ([logic](docs/countdown.md)) |

## How it is made

### The room and the television

They are the supplied vertical photo (`plate/`), **kept exactly as supplied**.

- **Screen mapping.**
  - The glass's four edges were measured and fitted (`config/plate.json`), and the signal is mapped onto that curved glass.
  - The picture bows with the glass, fills it edge to edge with a little overscan, and is never stretched: the clips are 4:3, the glass about 1.47:1, so the picture's top and bottom run behind the bezel.
  - The glass's own reflection of the room stays on top of the picture, at half strength.
- **The TV's light.**
  - The picture's light glows in the glass (halation) and blooms slightly into the lens.
  - It lights the bezel's black lip.
  - It falls, in the left and right halves' colours, on the chest's top, the things beside the set, the plant and the armchair in the foreground. It never reaches the wall behind the set.
- **The camera.** One continuous push-in on the photo, monotone and smooth (`config/plate.json` → `camera`). The photo is only enlarged, with Lanczos, never altered. A fine sensor grain lies over the whole frame.

### The television's signal

All in linear light (`comp/`).

- **The cartoon** (`comp/sources.py`): cut out of its pillarbox.
- **The card** (`comp/card.py`): drawn natively at the signal's size, its words from `config/timeline.json` → `card.lines`.
  - Liberation Sans Bold, the countdown's typeface, near-black on white. The white is the ident's own backdrop level (sRGB 239), so the set lights the room as it did.
  - SINGLE’S DAY spans the same width as the countdown that follows. OFFER ENDS IN sits under it, smaller and letter-spaced.
  - Each line lands in five frames, settling from slightly larger. Both then push in slowly (3.5 % over the card).
- **The CRT** (`comp/crt.py`):
  - analog softness, softer across than down;
  - composite colour bleed;
  - a faint analog noise;
  - scanlines and phosphor stripes that appear only when the camera is close enough to resolve them (band-limited, no moiré);
  - darker corners.
- **The glitch** (`comp/glitch.py`): a fixed, seeded 18-frame recipe.
- **The countdown** (`comp/countdown.py`): rendered natively from `config/countdown.json`, from integer arithmetic.

### The sound

`audio/mix.py`, 48 kHz:
- **Cartoon:** the supplied audio through a small TV speaker into the room. The wish stays clear and is never covered.
- **Card:** a synthesized sting through the same speaker and room: a bright bell chord over a soft low hit as SINGLE’S DAY lands, a lighter chime for OFFER ENDS IN, a warm chord held under the card until the glitch cuts it.
- **Glitch:**
  - the card's own last frames of sound stutter with the picture;
  - static follows the static on screen frame by frame;
  - a sync buzz and a pop at the signal loss.
- **Countdown:**
  - a low lock-in thump;
  - a tick on each frame the digits change;
  - a restrained low drone, still sounding at the cut.
- **Master:** about −14 LUFS, true peak under −1 dBTP. The master gain is the previous delivery's, fixed, so the cartoon's sound is sample for sample what was delivered. Cues: [docs/audio-cues.md](docs/audio-cues.md).

## Render

1. Put the cartoon clip in `sources/` and the photo in `plate/`: see their READMEs. The hashes are checked, and nothing is ever substituted.
2. Set up the environment and run the pipeline:

```
python3 -m venv .venv && .venv/bin/pip install -r comp/requirements.txt
PY=.venv/bin/python scripts/render.sh            # ~25 min on 4 CPU cores
# optional: ASR_PY=<python with faster-whisper> also checks the wish is heard in the delivered film
```

Every step is deterministic: fixed seeds, frame-accurate timing, no network access during the render.

Outputs, in `out/` (not in git):

| | |
|---|---|
| `IYS-NICKELODEON-COUNTDOWN-TEASER-1080x1920.mp4` | the film, 9:16 |
| `IYS-NICKELODEON-COUNTDOWN-TEASER-1080x1350.mp4` | its 4:5 version, composed for the feed (its own framing and push-in, not a squeezed 9:16) |
| `stills/<format>/` | first frame, cover, the wish, the card, the interruption frame, the final countdown frame, the glitch keyframes |
| `contact-sheet-<format>.png` | a frame every half second |
| `validation-report.md`, `validation.json` | the QA of the delivered files |
| `frame-log-<format>.json` | every frame's segment, countdown value and camera window |

## Notes

- **This version replaces the Nickelodeon ident with the card**, as requested. The first delivery (commit 809ece1) played the supplied ident in this slot, frames 0–95, "nickelode…". Its countdown counted down from `03:00:00:00` (days:hours:minutes:seconds). Everything else is unchanged, and checked frame by frame in [docs/changes-since-809ece1.md](docs/changes-since-809ece1.md):
  - the photo, the camera and the cartoon;
  - the CRT and the glitch recipe;
  - the countdown's look and its ticks.
- **The card's copy is spelt as requested: "SINGLE’S DAY".** The 11.11 shopping day is more often written "Singles' Day" or "Singles Day". The words are one line in `config/timeline.json`.
- **The supplied photo shows text the brief keeps off screen.** The TV's bezel reads "IYS", and VHS spines in the cabinet include "Toy Story 2". Both are part of the photo, which was to be kept verbatim, so neither was altered.
