import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5179',
    trace: 'off',
    // Software WebGL, so the 3D board renders in headless Chromium.
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'fold-outer', use: { viewport: { width: 412, height: 860 } } },
    { name: 'fold-inner', use: { viewport: { width: 790, height: 760 } } },
  ],
  webServer: { command: 'npx vite --port 5179 --strictPort', url: 'http://localhost:5179', reuseExistingServer: true },
});
