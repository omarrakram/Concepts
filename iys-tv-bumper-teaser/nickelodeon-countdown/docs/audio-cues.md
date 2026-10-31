# Audio cue sheet

The sound is 48 kHz stereo and sample-accurate to the picture: 1,600 samples per 30 fps frame. `audio/mix.py` builds it; each run also writes `build/audio/cues.json`. The supplied audio is used as is: filtered like a TV speaker in a room, never replaced or covered.

| Time | Film frame | Cue |
|---|---|---|
| 0.000 s | 0 | **Cartoon:** the supplied clip's own sound, 0.000–7.515 s (the file's full audio). "Move it." / "You could say please." / "Fine, please move it." / **"I wish I had clothes like the popular kids."** (3.90–6.38 s), then the wands' sparkle (7.05–7.5 s). No music or effect sits under the wish. |
| 7.533 s | 226 | **Ident:** the supplied ident's own sound, 0.000–3.200 s, cut at the interruption |
| 10.733 s | 322 | Glitch, freeze: the ident's frame-95 sound (33 ms) repeats |
| 10.767 s | 323 | Glitch, stutter: the frame-94 sound, as the picture jumps back to it |
| 10.800 s | 324 | the frame-95 sound again, fading under static that rises with the static on screen, frame by frame |
| 10.833 s | 325 | a 50 Hz sync buzz, with the bright sync bar on screen |
| 10.933 s | 328 | a low pop: the signal-loss frame |
| 11.033 s | 331 | a sync buzz again, as the new signal rolls in |
| 11.333 s | 340 | **Countdown locks:** a low thump; a restrained drone fades in over 0.45 s and sounds to the last sample |
| 12.333 s | 370 | tick: `03:00:00:00` → `02:23:59:59` |
| 13.333 s | 400 | tock: → `02:23:59:58` |
| 14.333 s | 430 | tick: → `02:23:59:57` |
| 15.333 s | 460 | tock: → `02:23:59:56` |
| 16.333 s | 490 | tick: → `02:23:59:55` |
| 16.833 s | (end) | the film cuts: the drone is still sounding (an 8 ms ramp only, so the cut does not click) |

## The chain

**Cartoon and ident: a small TV speaker in a room.**
- High-pass at 150 Hz, low-pass at 8 kHz, a little presence at 2.6 kHz, near-mono.
- A short room reverb: early reflections, RT60 about 0.4 s, 10 % wet.

**Glitch static.**
- Band-limited noise (250 Hz–9 kHz) with sparse crackle, through the same speaker.
- Its envelope is the `static` column of `comp/glitch.py`, held per frame and smoothed over 4 ms, so sound and picture break up together.
- A soft ceiling at −6 dBFS keeps crackle from poking out.

**Ticks.**
- A dry click, a short metallic ring (2.35 kHz tick, 2.05 kHz tock) and a little body, saturated so they are dense rather than spiky.
- They play through the TV speaker: the countdown is the broadcast's sound.

**Drone.**
- Two low partials beating slowly (55 / 55.35 Hz, with 82.4 and 110 Hz), a breath of filtered air, and a faint high shimmer that grows a little.
- No melody, no horror stings, no trailer hits.

## Levels

Integrated loudness, ITU-R BS.1770, set per element before mastering:

| Element | Level |
|---|---|
| Cartoon | −16 LUFS |
| Ident | −17 LUFS |
| Glitch | −19.5 LUFS |
| Countdown ticks and thump | −19 LUFS |
| Drone | −26 LUFS |

The whole film is mastered to **−14 LUFS**. A limiter holds the true peak under **−1 dBTP**, and AAC-LC 256 kb/s carries it. QA measures the delivered files and checks every tick's onset against its frame.
