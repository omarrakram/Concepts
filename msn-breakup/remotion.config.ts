/**
 * Remotion CLI config (npm run render:*, npm run dev).
 * Uses a locally installed Chromium headless shell when one exists (set
 * REMOTION_BROWSER to point at another), else Remotion's own download.
 */
import { Config } from '@remotion/cli/config';
import { existsSync, readdirSync } from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(94);
Config.setPixelFormat('yuv420p');
// limited-range BT.709, fully tagged: what phones and social apps expect (the default is untagged full range)
Config.setColorSpace('bt709');
Config.setOverwriteOutput(true);

const findShell = (): string | null => {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const root = '/opt/pw-browsers';
  if (!existsSync(root)) return null;
  const dir = readdirSync(root).find((d) => d.startsWith('chromium_headless_shell-'));
  const bin = dir ? `${root}/${dir}/chrome-linux/headless_shell` : null;
  return bin && existsSync(bin) ? bin : null;
};
const shell = findShell();
if (shell) Config.setBrowserExecutable(shell);
