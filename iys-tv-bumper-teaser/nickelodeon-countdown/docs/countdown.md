# The countdown

## What the viewer sees

Three two-digit groups and two colons, hours:minutes:seconds, starting at `22:22:22`, and nothing else:
- no labels on the countdown itself (no HOURS/MINUTES/SECONDS, no H/M/S). The IN YOUR SHOE logo comes just before it;
- no dates, no branding, no URL.

The renderer only ever draws the characters `0123456789:`. QA checks every frame's value against `^\d\d:\d\d:\d\d$`.

The look:
- Liberation Sans Bold (a Helvetica-like grotesque, as 2000s broadcast caption generators used), with tabular figures so the digits never shift;
- the colons centred on the digits' height;
- a cool CRT white on black with a soft phosphor glow and a faint snow of a weak broadcast;
- the same TV treatment as everything else on the set: the analog softness, the scanlines once the camera is close, the glass's reflection of the room over it.

The text spans 80 % of the signal's width, the title-safe area, as in the first delivery. With three groups instead of four, the digits are about 1.37 times taller there. With the push-in, the line ends at about 88 % of the vertical frame's width.

When a digit changes:
- only the changed digits move: the old one fades upward like phosphor afterglow over about 4 frames, while the new one settles in from just below with a short brightness swell;
- unchanged digits stay perfectly still;
- the colons give a barely perceptible pulse on each tick.

## The logic (`config/countdown.json`, the one source)

| | |
|---|---|
| Format | `HH:MM:SS` |
| Start | `22:22:22` |
| Total | 80,542 s (22 × 3600 + 22 × 60 + 22) |
| Frame rate | 30 fps |
| Clock origin | film frame 340 (`config/timeline.json` → `countdown.clockOriginFrame`) |

Shown value at film frame `f`:

```
elapsed_frames = max(0, f - 340)
left_frames    = 80542 * 30 - elapsed_frames
seconds        = ceil(left_frames / 30)          # integer arithmetic, never below 0
HH:MM:SS       = divmod chain of seconds (3600, 60)
```

`ceil` means a value stays on screen for the whole second that ends at it:
- `22:22:22` at the start;
- `22:22:21` exactly one second later.

## In the film

| Film frames | Time | Shown |
|---|---|---|
| 329–339 | 10.967–11.333 s | `22:22:22`, breaking through the glitch (the clock not yet running) |
| 340–369 | 11.333–12.333 s | `22:22:22` (the signal locks; the clock starts) |
| 370–399 | 12.333–13.333 s | `22:22:21` |
| 400–429 | 13.333–14.333 s | `22:22:20` |
| 430–459 | 14.333–15.333 s | `22:22:19` |
| 460–489 | 15.333–16.333 s | `22:22:18` |
| 490–504 | 16.333–16.833 s | `22:22:17`: the film cuts half a second after this tick, the countdown still running |

Only the seconds change in the film's five and a half seconds.

## A recording, not a live clock

The MP4 is a deterministic animation: it starts at `22:22:22` whenever it is watched.

To start from another value:
1. set `start` (`HH:MM:SS`) in `config/countdown.json`;
2. re-render: QA checks the new start and its first tick.

Nothing else changes.

The first delivery (commit 809ece1) counted down four groups, days:hours:minutes:seconds, from `03:00:00:00`.
