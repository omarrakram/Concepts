# Song slot: “When You’re Gone” by Avril Lavigne

No song file is in this repository. The track is copyrighted, so it is not
sourced, bundled or faked here. Everything in this folder except this README is
gitignored.

## How to add it

1. Get a copy you have the rights to use for this purpose (e.g. a sync/master
   licence, or a platform's licensed music library: see "Instagram / TikTok"
   below).
2. Save it as **one** of these files:

   ```
   public/music/when-youre-gone.mp3
   public/music/when-youre-gone.m4a
   public/music/when-youre-gone.wav
   public/music/when-youre-gone.aac
   public/music/when-youre-gone.ogg
   ```

3. Re-render: `npm run render:reel`.

The reel finds the file on its own. The song starts on **frame 639
(00:00:21.300, SMPTE 00:00:21:09 at 30 fps)**, the exact frame where the
“karim is listening to” popup starts sliding in. It is audible on that frame (softened over 2 frames),
stays at 85 % under the effects and fades out over the last second. Without a
file, the cue stays silent and the rest of the reel is unchanged.

## Options (render props)

```
npx remotion render src/index.ts HeroReel out/msn-breakup-reel.mp4 \
  --props='{"songStartSeconds": 0, "songVolume": 0.85}'
```

- `songStartSeconds`: where to start inside the file (e.g. jump to the chorus).
- `songVolume`: 0 to 1.
- `cueTone: true`: QA only. Puts a 1 kHz blip exactly on the cue frame, so you
  can check sync with any waveform viewer.

## Instagram / TikTok (no file needed)

Render the reel without a song, upload it, and add “When You’re Gone” from the
app's own music library. Then set the track to start at **0:21.3** in the
editor, or trim it so the first note lands as the popup appears. `npm run cues`
prints every timecode.
