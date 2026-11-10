# Changes between deliveries, and what stayed the same

Each delivery changed only what was asked. Everything else was checked against the previous one:
- the picture by `scripts/frame_hashes.py`, which hashes the 8-bit RGB the encoder receives, rendered from a checkout of each version;
- the decoded films by `scripts/compare_delivery.py`;
- the sound sample by sample, in the mix before the encode.

## adb67a0 → this version: the encode only

The problem: the downloaded film was reported as "unsupported".

The cause: the 9:16 film was H.264 High at **level 5.0**, at about 28 Mb/s.
- At 1080×1920, the encoder's 5 reference frames (preset slow) need level 5.0, and nothing capped the bitrate. The grain and the static are costly, so the peaks ran high.
- Many phones, galleries and apps accept H.264 only up to level 4.1 or 4.2 for 1080p, so they refuse it. Apple, for example, documents its iPhones' H.264 support as "High Profile level 4.2".
- The 4:5 film said level 4.0, but its bitrate ran over that level's limit.

The fix, in `comp/film.py`: High profile at level 4.1, at most 4 reference frames, the bitrate's peaks held to 40 Mb/s (a 50 Mb buffer). QA now checks this on every delivery.

Nothing else changed. The renderer was given the same frames and the same sound as in adb67a0; only their compression differs.

## 8092818 → adb67a0

The request: end the cartoon on its frame of the wands waving, without the extra frame after it; replace the SINGLE’S DAY card with the attached IN YOUR SHOE logo on a black screen; keep everything else verbatim.

### Changed

| Film frames | Time | Before (8092818) | adb67a0 |
|---|---|---|---|
| 223–225 | 7.433–7.533 s | the cartoon's last three frames: the next shot, a wide shot of Timmy with the fairies | the logo (the cartoon now ends on frame 222, its last frame of the wands waving) |
| 226–321 | 7.533–10.733 s | the card: SINGLE’S DAY, then OFFER ENDS IN, black on white | the IN YOUR SHOE logo (`brand/in-your-shoe-logo.png`, as supplied), white on black. It lands and pushes in exactly as the card's first line did. |
| 322–327 | 10.733–10.933 s | the glitch freezing and tearing the card | the same recipe freezing and tearing the logo (its last frame, and the one before) |

The sound:
- the cartoon's sound now ends at 7.433 s, with the same 2 ms fade;
- the card's sting (bell chord, chime 0.6 s later, held chord) starts at the new cut and runs 3.3 s, cut at the glitch as before;
- the stutter repeats the logo's last two frames of sound.

### Unchanged, and checked

**The picture.** These frames render pixel-identical to 8092818's (sha256 for sha256):

| | Cartoon | Glitch tail and countdown |
|---|---|---|
| 9:16 | frames 173–222: 50 of 50 | every frame, 328–504: 177 of 177 |
| 4:5 | frames 181–222: 42 of 42 | frames 328–345, 368–372 and 488–504: 40 of 40 |

In the delivered files, after decoding:

| | Bit-identical to 8092818 | Re-encoded only |
|---|---|---|
| 9:16 | frames 0–172 | frames 173–222, 40.0–45.1 dB PSNR |
| 4:5 | frames 0–180 | frames 181–222, 39.8–44.4 dB PSNR |

x264 looks up to 50 frames ahead (`rc_lookahead=50` at preset slow). It now sees the logo coming instead of the card, so it spends its bits on the last cartoon frames slightly differently. The pictures it was given are the same.

**The sound.** The mix is sample-identical to 8092818's everywhere except 7.431–10.867 s, which runs from the cartoon's new fade-out to the end of the stutter. That covers:
- every sample the cartoon keeps (its whole sound is still filtered and levelled as one piece, then cut);
- the glitch's static, buzz and pop;
- the countdown's thump, ticks and drone.

In the delivered AAC, the cartoon's sound is identical up to 7.403 s. The last 30 ms before the cut share AAC frames with the sting.

**Everything else, untouched:**
- the photo, its glass mapping and the room's light;
- the camera's push-in;
- the CRT treatment and the sensor grain;
- the glitch recipe;
- the countdown;
- the frame count (505), the formats and the encode settings.

Loudness is −14.1 LUFS with a true peak of −1.3 dBTP, as in 8092818. All 31 QA checks pass: `docs/validation-report.md`.

## 809ece1 → 8092818

The request: replace the Nickelodeon clip with a "Single's Day Offer Ends In" card, start the countdown at 22:22:22, and keep everything else verbatim.

### Changed

| Film frames | Time | Before (809ece1) | 8092818 |
|---|---|---|---|
| 226–321 | 7.533–10.733 s | the supplied Nickelodeon ident, its frames 0–95, with its own sound | the card: SINGLE’S DAY, then OFFER ENDS IN (from 244), with a synthesized sting, chime and held chord |
| 322–339 | 10.733–11.333 s | the glitch over the ident's frames 94–95 | the same glitch recipe over the card's last two frames; the stutter repeats the card's sound |
| 329–504 | 10.967–16.833 s | `03:00:00:00` (days:hours:minutes:seconds) ticking to `02:23:59:55` | `22:22:22` (hours:minutes:seconds) ticking to `22:22:17`. The same typeface, glow, width (80 % of the signal) and tick animation; with three groups the digits are taller. |

### Unchanged, and checked

**The picture.** The cartoon's frames 0–225 rendered pixel-identical to 809ece1's:
- 9:16: frames 176–225, 50 of 50;
- 4:5: frames 190–225, 36 of 36.

After decoding, the delivered files were bit-identical to 809ece1's:
- 9:16: frames 0–180; frames 181–225 differed only by re-encoding, at 40.4–46.1 dB;
- 4:5: frames 0–196; frames 197–225 differed only by re-encoding, at 40.1–46.4 dB.

**The sound.** The master gain was fixed at 809ece1's value, +3.267 dB (`MASTER_GAIN_DB`), instead of being re-measured. With that, the mix is sample-identical to 809ece1's:
- for the cartoon, 0–7.533 s;
- for everything from the countdown's lock on, 11.333 s to the end.

**Loudness:** −14.1 LUFS with a true peak of −1.3 dBTP (809ece1: −14.3 LUFS, −1.4 dBTP).
