import { build } from 'esbuild';

/**
 * Import one of the project's TypeScript data modules (src/story/*.ts) from a
 * plain Node script, so the cue sheet and still list never drift from what
 * the compositions render. esbuild is the bundler Remotion itself ships with.
 */
export async function loadTs(entry) {
  const out = await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent' });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);
}
