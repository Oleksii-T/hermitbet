import { defineConfig, devices } from '@playwright/test';
const previewUrl = process.env.E2E_BASE_URL ?? 'http://localhost:8000';
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    timeout: 60000,
    expect: { timeout: 10000 },
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: previewUrl,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 1000 },
            },
        },
    ],
    webServer: {
        command:
            'php artisan serve --host=0.0.0.0 --port=8000 --no-interaction',
        url: previewUrl,
        reuseExistingServer: true,
        timeout: 30000,
    },
});
