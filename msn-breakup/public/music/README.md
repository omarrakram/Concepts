# Song slot: “When You’re Gone” by Avril Lavigne

No song file is in this repository, and none ever will be: everything in this
folder except this README is gitignored, and `npm run qa` fails if git tracks
anything else here. The track is copyrighted. It is not downloaded, bundled,
replaced by a sound-alike or faked.

The song plays in exactly one place: **carousel slide 2, `MusicPlayerBreakup`**
(she opens Windows Media Player, selects the song and presses Play). The film
itself (`HeroReel`, `BreakupCarousel`) has no music at all.

## Import the file you were given

```bash
npm run import:song -- "/path/to/Avril Lavigne - When You're Gone (Official Video).mp4"
```

This writes, here (gitignored):

| File | What it is |
| --- | --- |
| `when-youre-gone.m4a` | the audio stream of your file, **copied untouched** (no re-encode, no pitch or tempo change). An MP3 source becomes `.mp3`; anything else is decoded to lossless `.wav`. |
| `when-youre-gone-analysis.wav` | the same audio, mono 22.05 kHz PCM. Only the player's visualisation reads it (its spectrum moves the bars). It is never played. |

It then checks the length against the file the cue points were measured on
(the official video's audio, 239.258 s). A different file stops the import:
re-measure its first note and update `SONG_SOURCE` in `src/story/player.ts`.

## The cue

- **The song begins on frame 78 (00:00:02.600, SMPTE 00:00:02:18 at 30 fps):**
  the first frame on which the Play button shows Pause. The mouse goes down on
  frame 75 (the click). Nothing of the song plays before frame 78.
- It plays the file from **4.900 s** (frame 147 of the file). The file opens
  with 1.9 s of digital silence and a soft swell. Its first note, at 4.903 s,
  sounds 3 ms into frame 78.
- Full level from that frame. It fades over the last 0.3 s, into the bar line
  at file 15.1 s, after the first sung line. The clip ends at 12.8 s.
- `npm run qa` checks it. In the delivered (clean) slide 2's pixels, the
  button is ▶ on frame 77 and ❚❚ on frame 78. Once a song file is imported,
  it also renders a song-only WAV and checks that the first non-silent sample
  is the first sample of frame 78; without one, that check is skipped, not
  failed.

Render props (`MusicPlayerBreakup`): `song` (false = the clean export),
`uiSounds` (false = song only, for checks), `cueTone` (a 1 kHz QA blip on
frame 78), `songVolume` (0 to 1, default 0.8).

## Rights: read this before posting

**Having the file is not the right to publish it.** Supplying a file for this
production does not establish public distribution rights. This repository
makes no claim that the track is licensed, royalty-free or cleared.

- The carousel delivers slide 2 **clean**:
  `out/instagram-carousel-final-v2/02-music-player-final-clean.mp4`, the
  approved master copied unchanged (the clicks, **no song**). The song is
  added by hand: from Instagram's own licensed music, when it is available to
  your account and region, or in an editor where you hold the rights. Place
  the song's first note (the first piano chord after the intro swell) at
  **0:02.6** of this clip, the moment Play turns to Pause. App editors are not
  frame-accurate. Without the song file the visualisation's bars stay flat
  (they are driven by the song's own spectrum).
- With a song file imported here, `node scripts/render.mjs MusicPlayerBreakup
  <out.mp4>` renders slide 2 with the song on its cue, for review. That is
  never part of `npm run render:carousel`.

## The first cut

`HeroReelOriginal` (the film as first released, kept for A/B) still has its
own cue: the song starts on frame 639 (00:00:21.300) with the “karim is
listening to” popup. It uses the same file and the props `songStartSeconds`,
`songVolume` and `cueTone`. `npm run cues` prints every timecode.
