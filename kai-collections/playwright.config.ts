import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end suite. Runs against the production build (vite preview).
 * Most tests use reduced motion so the WebGL seascapes render a single still
 * frame (fast and deterministic in software-rendered CI browsers); the scroll-
 * driven Horizon is tested with motion on.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  // WebGL runs on SwiftShader (software) in headless Chromium: first frames and shader compiles take seconds
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:4173',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
      testMatch: /mobile\.spec/,
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
