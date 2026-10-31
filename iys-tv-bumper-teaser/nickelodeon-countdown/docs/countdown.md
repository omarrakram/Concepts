# The countdown

## What the viewer sees

Four two-digit groups and three colons, for example `03:00:00:00`, and nothing else:
- no labels (no DAYS/HOURS/MINUTES/SECONDS, no D/H/M/S);
- no dates, no words, no branding, no URL.

The renderer only ever draws the characters `0123456789:`. QA checks every frame's value against `^\d\d:\d\d:\d\d:\d\d$`.

The look:
- Liberation Sans Bold (a Helvetica-like grotesque, as 2000s broadcast caption generators used), with tabular figures so the digits never shift;
- the colons centred on the digits' height;
- a cool CRT white on black with a soft phosphor glow and a faint snow of a weak broadcast;
- the same TV treatment as everything else on the set: the analog softness, the scanlines once the camera is close, the glass's reflection of the room over it.

The text spans 80 % of the signal's width, the title-safe area. With the push-in it ends at about 88 % of the vertical frame's width.

When a digit changes:
- only the changed digits move: the old one fades upward like phosphor afterglow over about 4 frames, while the new one settles in from just below with a short brightness swell;
- unchanged digits stay perfectly still;
- the colons give a barely perceptible pulse on each tick.

## The hidden logic (`config/countdown.json`, the one source)

| | |
|---|---|
| Start (the moment the countdown's first locked frame stands for) | 2026-11-08 00:00:00, Africa/Cairo (= 2026-11-07 22:00:00 UTC) |
| Target | 2026-11-11 00:00:00, Africa/Cairo (= 2026-11-10 22:00:00 UTC) |
| Time zone | Africa/Cairo (EET, UTC+2 throughout: Egypt's summer time ended on 29 October 2026) |
| Total | 259,200 s = 3 days exactly |
| Frame rate | 30 fps |
| Clock origin | film frame 340 (`config/timeline.json` → `countdown.clockOriginFrame`) |

Shown value at film frame `f`:

```
elapsed_frames = max(0, f - 340)
left_frames    = 259200 * 30 - elapsed_frames
seconds        = ceil(left_frames / 30)          # integer arithmetic, never below 0
DD:HH:MM:SS    = divmod chain of seconds (86400, 3600, 60)
```

`ceil` means a value stays on screen for the whole second that ends at it:
- `03:00:00:00` at the start;
- `02:23:59:59` exactly one second later.

The times are converted to UTC before subtracting, so a daylight-saving change between start and target would still give the right total.

## In the film

| Film frames | Time | Shown |
|---|---|---|
| 329–339 | 10.967–11.333 s | `03:00:00:00`, breaking through the glitch (the clock not yet running) |
| 340–369 | 11.333–12.333 s | `03:00:00:00` (the signal locks; the clock starts) |
| 370–399 | 12.333–13.333 s | `02:23:59:59` (every group rolls over at once) |
| 400–429 | 13.333–14.333 s | `02:23:59:58` |
| 430–459 | 14.333–15.333 s | `02:23:59:57` |
| 460–489 | 15.333–16.333 s | `02:23:59:56` |
| 490–504 | 16.333–16.833 s | `02:23:59:55`: the film cuts half a second after this tick, the countdown still running |

## A recording, not a live clock

The MP4 is a deterministic animation. Its first locked countdown frame represents the moment `start`, whenever it is watched.

If the post goes live at another time on 8 November:
1. set `start` to that time;
2. re-render: the first value becomes the time actually left, for example `02:14:30:00` for 09:30;
3. QA re-checks the rollover.

Nothing else changes.
