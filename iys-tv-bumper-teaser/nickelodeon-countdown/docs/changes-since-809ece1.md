# What changed since the first delivery (809ece1), and what did not

The request: replace the Nickelodeon clip with a "Single's Day Offer Ends In" card, start the countdown at 22:22:22, and keep everything else verbatim.

## Changed

| Film frames | Time | Before (809ece1) | Now |
|---|---|---|---|
| 226–321 | 7.533–10.733 s | the supplied Nickelodeon ident, its frames 0–95, with its own sound | the card: SINGLE’S DAY, then OFFER ENDS IN (from 244), with a synthesized sting, chime and held chord (`comp/card.py`, `audio/mix.py`) |
| 322–339 | 10.733–11.333 s | the glitch over the ident's frames 94–95 | the same glitch recipe (`comp/glitch.py` → `KEYS`, unchanged) over the card's frames 94–95; the stutter repeats the card's sound |
| 329–504 | 10.967–16.833 s | `03:00:00:00` (days:hours:minutes:seconds) ticking to `02:23:59:55` | `22:22:22` (hours:minutes:seconds) ticking to `22:22:17`. The same typeface, glow, width (80 % of the signal) and tick animation; with three groups the digits are taller. |

## Unchanged, and checked

**The cartoon's picture, frames 0–225.** The renderer composes them exactly as before.

`scripts/frame_hashes.py` hashed the composed frames (the 8-bit RGB the encoder receives) from a checkout of 809ece1 and from this version. They are identical, sha256 for sha256:
- 9:16: frames 176–225, 50 of 50;
- 4:5: frames 190–225, 36 of 36.

In the delivered files (`scripts/compare_delivery.py`, decoded):

| | Bit-identical to 809ece1 after decoding | Re-encoded only |
|---|---|---|
| 9:16 | frames 0–180 | frames 181–225, 40.4–46.1 dB PSNR |
| 4:5 | frames 0–196 | frames 197–225, 40.1–46.4 dB PSNR |

The last cartoon frames differ only because x264 looks up to 50 frames ahead (`rc_lookahead=50` at preset slow): it now sees the card coming instead of the ident, so it spends its bits slightly differently. The pictures it was given are the same.

**The sound.**
- The mix (`build/audio/mix.wav`, before the encode) is sample-identical to 809ece1's for the cartoon, 0–7.533 s. It is also identical for everything from the countdown's lock on, 11.333 s to the end.
- This holds because the master gain is now fixed at 809ece1's value, +3.267 dB (`MASTER_GAIN_DB`), instead of being re-measured.
- In the delivered AAC, the sound is identical up to 7.519 s. The last 15 ms before the cut share an AAC frame with the card's sting.

**Everything else**, untouched:
- the photo, its glass mapping and the room's light (`config/plate.json` values);
- the camera's push-in;
- the CRT treatment (`comp/crt.py`) and the sensor grain;
- the glitch recipe;
- the countdown's ticks, thump and drone;
- the frame count (505), the formats and the encode settings.

Loudness: −14.1 LUFS, true peak −1.3 dBTP (809ece1: −14.3 LUFS, −1.4 dBTP). All 31 QA checks pass: `docs/validation-report.md`.
