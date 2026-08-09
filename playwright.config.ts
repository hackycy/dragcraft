import process from 'node:process'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './playground/tests/browser',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 1200 },
  },
  webServer: [
    {
      command: 'pnpm --dir playground dev --host 127.0.0.1 --port 4173',
      reuseExistingServer: !process.env.CI,
      url: 'http://127.0.0.1:4173',
    },
    {
      command: 'pnpm --dir examples/guide-project dev --host 127.0.0.1 --port 4174',
      reuseExistingServer: !process.env.CI,
      url: 'http://127.0.0.1:4174',
    },
  ],
})
