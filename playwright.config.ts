import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:5189/', launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run build && npx vite preview --port 5189 --strictPort', url: 'http://127.0.0.1:5189/', reuseExistingServer: false, timeout: 120_000 },
});
