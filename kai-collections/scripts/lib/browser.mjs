// Shared Chromium launcher. Prefers Playwright's managed browser; falls back to a preinstalled one.
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const { chromium } = require('@playwright/test');

/**
 * Chromium does not read HTTPS_PROXY by itself. When the machine routes egress through a proxy,
 * hand it over explicitly (local preview servers bypass it) so KAI's storefront and CDN load.
 */
export const proxy = () => {
  const server = process.env.HTTPS_PROXY || process.env.https_proxy;
  // Playwright otherwise forces loopback through the proxy too; the local preview server must stay direct
  if (server) process.env.PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK = '1';
  return server ? { server, bypass: '127.0.0.1,localhost,::1' } : undefined;
};

export async function launch() {
  const pre = '/opt/pw-browsers/chromium';
  const executablePath = process.env.CHROMIUM_PATH || undefined;
  return chromium.launch({
    proxy: proxy(),
    executablePath: executablePath && existsSync(executablePath) ? executablePath : undefined,
    // WebGL must work headless: SwiftShader is the portable software path.
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', '--force-color-profile=srgb'],
  }).catch(() => chromium.launch({ proxy: proxy(), executablePath: pre, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'] }));
}

/** CSS injected into captures of the finished site: disables reveal choreography so every element is in its final state. */
export const SETTLE_CSS = `
  .rv{opacity:1!important;transform:none!important;transition:none!important}
  .mask-up>span{transform:none!important;transition:none!important}
  *,*::before,*::after{animation-delay:0s!important;animation-duration:0s!important;caret-color:transparent!important}
  .hero__scroll-line::after{display:none!important}
`;
export const HIDE_NAV_CSS = `.nav{display:none!important}`;
