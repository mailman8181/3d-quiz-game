import { defineConfig, devices } from '@playwright/test';

const port = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  // Tests are independent (own page, fixed ?seed=), so tests of one file may run on different
  // workers. Without this, challenge-types.spec.ts (37 tests) ran on one worker for 10–12 min
  // while the other worker sat idle after ~6 min.
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // timing-reporter: slowest tests, time per file and worker load (console, GitHub job
  // summary and test-results/e2e-timings.json).
  reporter: process.env.CI
    ? [['github'], ['./tests/e2e/timing-reporter.ts']]
    : [['list'], ['./tests/e2e/timing-reporter.ts']],
  use: {
    baseURL: `http://localhost:${port}/`,
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
