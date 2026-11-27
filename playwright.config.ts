import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './qa',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'qa/reports/results.json' }],
    ['html', { outputFolder: 'qa/reports/html', open: 'never' }],
  ],
  use: {
    baseURL: process.env.QA_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],
});
