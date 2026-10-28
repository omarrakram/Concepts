// QA helper: render chosen frames of a composition to PNG with one bundle and one browser.
//   node scripts/frames.mjs <CompositionId> <outDir> <frame|sec s>[,...] [--props='{"k":v}']
// e.g. node scripts/frames.mjs HeroReel out/qa/v2 0,57,31.3s
// Uses the same headless shell as remotion.config.ts (or REMOTION_BROWSER).
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const [id, outDir, list = '0', ...rest] = process.argv.slice(2);
const propsArg = rest.find((a) => a.startsWith('--props='));
const inputProps = propsArg ? JSON.parse(propsArg.slice('--props='.length)) : {};
if (!id || !outDir) {
  console.error('usage: node scripts/frames.mjs <CompositionId> <outDir> <frames,...> [--props=JSON]');
  process.exit(2);
}
const shell = () => {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const base = '/opt/pw-browsers';
  if (!existsSync(base)) return null;
  const dir = readdirSync(base).find((d) => d.startsWith('chromium_headless_shell-'));
  const bin = dir ? `${base}/${dir}/chrome-linux/headless_shell` : null;
  return bin && existsSync(bin) ? bin : null;
};
mkdirSync(resolve(root, outDir), { recursive: true });
const serveUrl = await bundle({ entryPoint: resolve(root, 'src/index.ts'), publicDir: resolve(root, 'public') });
const browserExecutable = shell();
const browser = await openBrowser('chrome', { browserExecutable });
const composition = await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser, browserExecutable });
for (const item of list.split(',')) {
  const frame = item.endsWith('s') ? Math.round(parseFloat(item) * composition.fps) : Number(item);
  const output = resolve(root, outDir, `${id}-f${String(frame).padStart(4, '0')}.png`);
  await renderStill({ composition, serveUrl, frame, output, inputProps, puppeteerInstance: browser, browserExecutable, imageFormat: 'png' });
  console.log(`${id} frame ${frame} (${(frame / composition.fps).toFixed(2)} s) → ${output}`);
}
await browser.close({ silent: true });
