# Technical validation

The master and its versions, checked by `npm run qa -- --set=final`
(`scripts/qa.mjs`, 2026-10-29T17:50:50.973Z): **34 pass, 0 fail**,
5 for information; then reviewed frame by frame and at speed.

## The files (ffprobe)

| File | Size | Rate | Frames | Video duration | Video | Audio | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `IYS-LOST-TV-BUMPER-TEASER-1080x1920.mp4` | 1080 × 1920 | 30/1 | 450 | 15.000 s | h264 High, yuv420p, bt709 | aac 2 ch 48000 Hz | 10.76 MB | `675a021a7fb2ab4a…` |
| `IYS-LOST-TV-BUMPER-TEASER-1080x1350.mp4` | 1080 × 1350 | 30/1 | 450 | 15.000 s | h264 High, yuv420p, bt709 | aac 2 ch 48000 Hz | 8.06 MB | `3a5b95b32699a975…` |
| `IYS-LOST-TV-BUMPER-TEASER-1080x1920-silent.mp4` | 1080 × 1920 | 30/1 | 450 | 15.000 s | h264 High, yuv420p, bt709 | none | 10.15 MB | `622ca8b5ab3da22f…` |

The full hashes are in the delivery's `SHA256SUMS.txt`. The rendered films are
not committed (`out/` is ignored); they are delivered as files.

## Automated checks (the master)

| Group | Check | Result | Value | Expected |
| --- | --- | --- | --- | --- |
| streams | video codec | PASS | h264 (High, level 5) | h264 |
| streams | pixel format | PASS | yuv420p | yuv420p |
| streams | resolution | PASS | 1080 × 1920 | 1080 × 1920 |
| streams | display aspect | PASS | SAR 1:1, DAR 9:16 | square pixels |
| streams | frame rate | PASS | r 30/1, avg 30/1 | 30/1 constant |
| streams | frames | PASS | 450 | 450 |
| streams | video duration | PASS | 15.000 s | 15.000 s |
| streams | colour | PASS | bt709/bt709/bt709, tv range | bt709 |
| streams | scan | PASS | progressive | progressive |
| streams | audio codec | PASS | aac (LC) | aac |
| streams | audio layout | PASS | 2 ch (stereo), 48000 Hz | stereo, 48000 Hz |
| streams | audio duration | PASS | 15.019 s | within a frame of 15.000 s |
| streams | file | INFO | 10.76 MB, 5.7 Mb/s overall, video 5.4 Mb/s, audio 317 kb/s |  |
| streams | faststart | PASS | ftyp → moov → free → mdat | moov before mdat |
| picture | black frames (ffmpeg blackdetect) | PASS | none | none |
| picture | frozen runs ≥ 0.25 s before the end card (ffmpeg freezedetect) | PASS | none | none before 13.80 s |
| picture | the end card holding still (freezedetect, from the bug landing) | PASS | 14.40–14.67 s, 14.67–15.00 s: 0.60 s | ≤ 1.0 s |
| picture | frames decoded | PASS | 450 | 450 |
| picture | darkest frame (mean luma, 0–255) | PASS | 80.5 at frame 380 | > 16 (no black or near-black frame) |
| picture | duplicated frames (mean change < 0.05) | PASS | none | none |
| picture | stillest frames (mean change vs previous) | INFO | f449 0.08, f447 0.08, f448 0.09 |  |
| picture | biggest frame-to-frame changes | INFO | f238 22.8, f225 19.0, f207 18.1, f148 16.9, f206 16.3 | the action (the lid, the spin, the landing), under 25 except the flash |
| picture | unplanned hard changes (> 25 mean luma) | PASS | none | none outside 96–97 |
| picture | highlight clipping (pixels ≥ 250) | PASS | max 0.00 % at frame 0 (the flash frame 96 excluded: 0.0 %) | < 1 % of the frame |
| picture | crushed dark frames (min 0 and mean < 40) | PASS | none | none |
| audio | integrated loudness | PASS | -14.1 LUFS | −14 ± 2 LUFS (social video) |
| audio | true peak | PASS | -1.4 dBTP | ≤ −1.0 dBTP |
| audio | loudness range | INFO | 6.3 LU |  |
| audio | clipped samples | PASS | 0 | 0 |
| audio | DC offset | PASS | 0.0895 % | ≈ 0 |
| audio | clean end (last 50 ms) | PASS | -120.0 dBFS RMS | < −50 dBFS |
| audio | room before the interruption (0–3.1 s) | INFO | -21.8 dBFS RMS |  |
| audio | the interruption (3.2–3.7 s) | PASS | -18.3 dBFS RMS | at least 3 dB above the room |
| copy | the on-screen line | PASS | "STAY TUNED." | "STAY TUNED." |
| copy | other text written into the picture | PASS | none (JSX text nodes and SVG text elements, all src/*.tsx) | none |
| copy | offers, prices, urgency or dates in the line | PASS | none | none |
| copy | the event's name anywhere in the project | PASS | none (26 files scanned) | none |
| placement | STAY TUNED. appears on cue (frame 430 vs 386) | PASS | bright pixels 0.0 % → 15.7 % | clearly more at 430 |
| placement | the corner bug appears on cue (frame 430 vs 398) | PASS | mean luma 59.8 → 89.6 | clearly brighter at 430 |

## The other versions

| Check | 4:5 feed (1080 × 1350) | Silent master |
| --- | --- | --- |
| Picture | rendered from the frames in its own composition (`Teaser4x5`), not cropped from the encoded master | the master's H.264 stream, bit-identical (stream MD5 `b4ce1520…`) |
| Black frames (blackdetect) | none | as the master |
| Frozen runs before the end card | none | as the master |
| The end card holding still | 14.57–15.00 s (0.43 s) | as the master |
| Sound | the master's AAC stream, bit-identical (stream MD5 `3c17d5fb…`): −14.1 LUFS, −1.4 dBTP | none (no audio track) |
| Index at the front | yes | yes |

## Review: what was looked at

- The decoded master at full size at 40 frames covering every beat (0, 64, 95–104,
  120, 136–152, 166, 198, 214–238, 250, 276, 292–358, 372, 392, 400, 420, 435,
  449) and the contact sheet (every 15th frame); the 4:5 version at 16 frames and
  at every frame of the hop out of the TV (132–161).
- Close-ups (3×) of every prop that could carry text or a number: the TV's bezel
  (three buttons and a light), the VCR (a slot and a blank green display), the
  console (a light), the remote (three coloured buttons). The posters are stripes
  and dots; the cartoon has no text.
- The end card at 1:1: the wordmark, **STAY TUNED.** and the corner bug are
  sharp and legible, in both formats.

## Problems found, and what was done

1. **The 4:5 version cut the top off the big hop.** With the centred crop,
   frames 142–146 lost up to 200 px of the stretched cube above the frame (the
   master keeps it in frame). The hop is taller than the feed frame (its apex at
   y 83 of the 9:16 frame, its landing at about y 1440 four frames later), so no
   fixed crop can hold it. Fixed in the 4:5 composition only: the window follows
   the hop up and back over frames 132–160, eased, under the push into the screen
   and the settle onto the face (`HOP_4X5` in `src/Teaser.tsx`). The re-render
   changed frames 133–159 of the 4:5 version and no others (per-frame PSNR
   against the previous render). The master is untouched.
2. **The freeze check was wrong in two ways.** It failed the end card's designed
   hold (14.40–14.67 s), and it ignored a freeze that runs to the end of the
   file (it counted only freezes that end), which is exactly what a stuck ending
   would look like. Fixed in `scripts/qa.mjs`: any freeze before the end card
   fails; the end card's stillness (from the bug landing, 13.80 s) is measured
   and must stay under a second. The master's is 0.60 s (14.40–15.00 s), the
   camera settling at the end of its drift: every frame still differs from the
   one before (0.08–0.21 mean luma), and no frame is a duplicate.
3. Nothing else needed fixing. There are no black, crushed, clipped or duplicated
   frames; the switch to the full-resolution reveal (330–336) shows no jump; the
   largest frame-to-frame changes are the action (the lid snapping shut at 238
   and opening at 225, the spin at 206–207, the flat landing at 148), all under
   the limit of 25.

## Content

- On screen, in order: an original cartoon (no text); the IN YOUR SHOE monogram
  and wordmark (the official artwork, unmodified); **STAY TUNED.** (13.07–15.00
  s); the monogram as the corner bug. Nothing else is written or said.
- No MBC or MBC3 name, mark, channel number, graphics, audio or footage; no
  event name, date, offer, price, discount, countdown or call to buy (checked by
  eye, and by `npm run qa`, which scans the copy, the code and the docs).

## Render record

The 3D passes, the TV pass and the master were rendered from commit `e425b43`
on 29 October 2026, 13:40–17:31 UTC, on 4 CPU cores:

| Pass | Frames | Size, samples | Time |
| --- | --- | --- | --- |
| bumper (Cycles) | 96–336 | 720 × 1280, 12 | 70.5 min |
| tv (Remotion) | 0–142 | 640 × 480 | under a minute |
| room (Cycles) | 0–142 | 720 × 1280, 12 | 57.8 min |
| reveal (Cycles) | 330–449 | 1080 × 1920, 16 | 95.3 min (about 47 s a frame) |
| master, stills, 4:5, silent | 0–449 | composite and encode | about 6 min |

The 4:5 version and its cover were then re-rendered from the same frames with
the reframe above (the master's stills re-rendered bit-identical).

## Final assessment

**Is it good enough for an official IYS social post?** Technically, yes: it meets
every delivery spec above and passes every check. As a piece of work, the idea
reads in one viewing (a cartoon interrupted, a CGI ident that turns into the box,
STAY TUNED.), the brand marks are the official ones, and nothing in it claims or
implies a broadcaster, a date or an offer. What the brand team should still weigh
before posting:

- The CGI is a deliberate 2000s-ident look, not contemporary high-end CGI.
- The room and the bumper before the reveal are rendered at 720 × 1280 and scaled
  up under the period TV texture; the reveal and the end card are native
  1080 × 1920.
- The soundtrack is original and synthesised: clean and at the right loudness for
  social, but simpler than a commissioned sound design.
- The bumper is an homage to the kind of ident MBC3 ran. It uses none of MBC3's
  marks, footage or audio, but the brand's legal review should confirm they are
  comfortable with the homage before an official post.

With that sign-off, it is ready to post.
