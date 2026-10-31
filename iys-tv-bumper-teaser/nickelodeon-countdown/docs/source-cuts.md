# Source cuts

Every cut point below was read off the supplied files themselves: ffprobe, a decode of every frame, frame-by-frame contact sheets, and word timestamps from speech recognition (faster-whisper `small.en`, run locally). Nothing comes from memory or from the brief's approximate timings.

## Video A: the cartoon

| | |
|---|---|
| File | `Fairly Odd Parents.mp4` (the supplied attachment, unchanged) |
| SHA-256 | `b00fa989cbf38c90f1b3964267904d28881059038dbfa3959d7c758ad22178c9` |
| Picture | 1920×1080 H.264 Main, 30/1 fps, **226 frames, 7.533 s**, no colour tags (read as BT.709, limited range) |
| Sound | AAC-LC 48 kHz stereo, 7.515 s |
| The picture inside the file | a 4:3 picture over a blurred pillarbox, black edge lines at x 273–275 and 1644–1646 |
| Crop used | x 280–1640, y 30–1050 → 1360×1020, exactly 4:3, square pixels: **no stretch** |

The dialogue, with its measured word times:

| Line | From | To |
|---|---|---|
| "Move it." | 0.00 s | 0.68 s |
| "You could say please." | 0.68 s | 2.34 s |
| "Fine, please move it." | 2.34 s | 3.90 s |
| **"I wish I had clothes like the popular kids."** | **3.90 s** ("I") | **6.38 s** ("kids") |

After the wish, 6.4–7.5 s: Cosmo and Wanda raise their wands, and the wands' sparkle sounds at 7.05–7.5 s.

**Cut:** the film uses **the whole clip, film frames 0–225 (0.000–7.533 s)**, picture and sound. The wish is complete at 6.38 s. The wands rising after it is the scene's own ending, and the ident follows on the next frame, as a channel would cut to its bumper. The delivered film's own sound is checked by speech recognition for the full sentence (`out/validation-report.md`).

## Video B: the Nickelodeon ident

| | |
|---|---|
| File | `WhatsApp Video 2026-10-31 at 4.22.32 PM.mp4` (the supplied attachment, unchanged) |
| SHA-256 | `ad3ebf8f4eb555207025adcf3957252eecbda51ebe036b88fe66f7b2851002b9` |
| Picture | 464×352 H.264 Baseline, tagged BT.709 limited range; 164 frames in 5.467 s (average 30 fps; the stream's nominal rate says 29.97) |
| Sound | AAC-LC 44.1 kHz stereo, 5.450 s (music and impacts, no speech) |
| Crop used | 2 px off the top and bottom → 464×348, exactly 4:3, square pixels |

**What the file actually shows** (frame by frame; it differs from the brief's description):
- a white/light-grey studio backdrop, not a blue/purple background;
- orange, dimensional, lowercase letters that drop and assemble one by one into the word "nickelodeon";
- no white lettering.

It is the supplied file (name, length, size and frame rate all match the brief), so it is used exactly as supplied. Nothing was recoloured or substituted.

How the wordmark forms:

| Source frame | Time | On screen |
|---|---|---|
| 4 | 0.133 s | the first letter falls in |
| 40 | 1.333 s | "nick" |
| 60 | 2.000 s | "nicke." |
| 93 | 3.100 s | "nickeloo" (the "d" still a bowl without its stem), pieces arriving |
| 94 | 3.133 s | "nickeloo" with an "e" forming |
| **95** | **3.167 s** | **"nickelode", with the next letters still in pieces: the interruption frame** |
| 96 | 3.200 s | "nickelode" plus a half-formed "o" |
| 103 | 3.433 s | "nickelodeon" complete (never reached in the film) |

**Cut:** source frames **0–95**, one film frame each (film frames 226–321, 7.533–10.733 s). Frame 95 is the last new picture: the glitch begins by freezing on it and stuttering back to 94 (film frames 322–323). The ident never reaches its complete wordmark.

The ident's sound runs from its start to the interruption, 0.000–3.200 s. During the glitch's freeze and stutter, its own last two frames of sound repeat in step with the picture.

### Cleanup applied to the ident (and only this)

- **TikTok watermark removed.** The recording carries a TikTok logo and an uploader's username over the plain backdrop, at bottom left (x 2–72, y 209–251). Around frame 148 they move to the bottom right. The watermark is not part of the ident, and on a 2000s broadcast it would be an anachronism.
  - That region, and only that region, is replaced with the same backdrop taken from the clip's own frames 150–163, where the watermark has moved away. Each frame's backdrop brightness is matched, with a 4 px feathered edge.
  - The letters, their shadows and the animation are untouched. See `build/content/check-sources.png`.
- **Mild compression cleanup.** Light non-local-means denoising (strength 2.5), then a Lanczos upscale to the 1440×1080 signal. No AI upscaling, no invented frames, no change to the lettering.

## The TV photo

| | |
|---|---|
| File | `plate/tv-room-vertical.webp`: the vertical photo supplied in the conversation (941×1672, about 9:16) |
| SHA-256 | `8bf1ef7d77abcdb74764553790330aa1c1e0ed0a5ef429aef8923def35810970` |
| Use | kept exactly as supplied. The clips are only added inside the screen glass, and the camera's push-in only enlarges the photo. |

The glass edge was measured along each side, at threshold crossings with outliers rejected, and fitted with quadratics:

| Edge | Fit residual |
|---|---|
| top | 0.24 px |
| bottom | 0.19 px |
| left | 0.65 px |
| right | 0.16 px |

The fitted corners are TL (195.1, 589.8), TR (751.6, 584.9), BR (756.5, 957.5) and BL (189.5, 956.7). The glass bows outward like a real tube: by about 18 px at the top, 9 px at the bottom and 8 px at each side.

The glass is about **1.47:1**, wider than the clips' 4:3. To keep the clips unstretched, the picture fills the glass's width with 1.5 % overscan at each side. The top and bottom of the picture (about 7 % each) run behind the bezel, as an overscanned CRT does.
