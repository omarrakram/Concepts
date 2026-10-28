import { getStaticFiles } from 'remotion';

/**
 * “When You’re Gone” by Avril Lavigne is never in this repo: everything in
 * public/music except its README is gitignored. `npm run import:song --
 * <file>` copies the audio of a file you supply to
 * public/music/when-youre-gone.<ext> (stream copy, untouched). Without a
 * file, every music cue stays silent and `npm run cues` prints the exact
 * timecodes for adding the track in an editor or app.
 */
export function songFile(): string | null {
  const f = getStaticFiles().find((x) => /^music\/when-youre-gone\.(mp3|m4a|wav|aac|ogg)$/i.test(x.name));
  return f ? f.name : null;
}

/**
 * The same song as plain mono PCM (also written by `import:song`): the
 * player's visualisation reads its spectrum, so the bars move with the
 * music actually playing. Never played itself.
 */
export function songAnalysisFile(): string | null {
  const f = getStaticFiles().find((x) => x.name === 'music/when-youre-gone-analysis.wav');
  return f ? f.name : null;
}
