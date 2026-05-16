import { defineConfig, devices } from '@playwright/test'

// Configurazione Playwright per test e2e di BlobParty.
// Avvia automaticamente il dev server di Vite e gira i test contro localhost.
// Solo Chromium per ora — i giochi non hanno bisogno di cross-browser.

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // alcuni test usano Supabase e creano stanze: meglio seriale
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5180',
    trace: 'on-first-retry',
    actionTimeout: 8000,
    navigationTimeout: 15000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx vite --port 5180',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
