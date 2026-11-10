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

After the wish, 6.4–7.4 s: Cosmo and Wanda raise their wands, and the wands' sparkle sounds from 7.05 s with a sharp click. The close-up of them waving runs from frame 208 to frame 222. The file's last three frames, 223–225 (7.433–7.533 s), cut to the next shot: a wide shot of Timmy standing with them.

**Cut:** the film uses **film frames 0–222 (0.000–7.433 s)**, picture and sound: the clip up to its last frame of the wands waving. The wish is complete at 6.38 s. The three frames of the next shot are left out, and the logo follows on the next frame, as a channel would cut to a promo.

The sound is cut at the end of frame 222 (7.433 s). The clip's whole sound is first put through the TV speaker and the room and levelled as one piece, as in the earlier deliveries, and only then cut, with the same 2 ms fade. So every sample the film keeps is the one delivered before.

The first two deliveries used the whole clip, frames 0–225, ending on those three frames of the wide shot. The delivered film's own sound is checked by speech recognition for the full sentence (`out/validation-report.md`).

## Video B: the Nickelodeon ident (no longer used)

The first delivery (commit 809ece1) played the supplied ident, `WhatsApp Video 2026-10-31 at 4.22.32 PM.mp4` (SHA-256 `ad3ebf8f4eb555207025adcf3957252eecbda51ebe036b88fe66f7b2851002b9`), in film frames 226–321. That was its source frames 0–95, up to "nickelode…", with its own sound.

This version plays the IN YOUR SHOE logo on black in that slot instead (`comp/card.py`, `config/timeline.json` → `card`). The slot is film frames 223–321, as the cartoon now ends three frames earlier, and the glitch interrupts the logo on its last frame, as it did the ident. Commit 8092818 had a SINGLE’S DAY / OFFER ENDS IN card there. The ident file is no longer read and is not needed to render. Its cut points and its watermark cleanup are in this file's history (commit 809ece1).

## The TV photo

| | |
|---|---|
| File | `plate/tv-room-vertical.webp`: the vertical photo supplied in the conversation (941×1672, about 9:16) |
| SHA-256 | `8bf1ef7d77abcdb74764553790330aa1c1e0ed0a5ef429aef8923def35810970` |
| Use | kept exactly as supplied. The picture (the cartoon, the card, the glitch, the countdown) is only added inside the screen glass, and the camera's push-in only enlarges the photo. |

The glass edge was measured along each side, at threshold crossings with outliers rejected, and fitted with quadratics:

| Edge | Fit residual |
|---|---|
| top | 0.24 px |
| bottom | 0.19 px |
| left | 0.65 px |
| right | 0.16 px |

The fitted corners are TL (195.1, 589.8), TR (751.6, 584.9), BR (756.5, 957.5) and BL (189.5, 956.7). The glass bows outward like a real tube: by about 18 px at the top, 9 px at the bottom and 8 px at each side.

The glass is about **1.47:1**, wider than the signal's 4:3. To keep the picture unstretched, the picture fills the glass's width with 1.5 % overscan at each side. The top and bottom of the picture (about 7 % each) run behind the bezel, as an overscanned CRT does.
