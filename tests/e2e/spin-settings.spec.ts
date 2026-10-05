import { test, expect } from '@playwright/test';

const user = {
    id: 999997,
    name: 'Spin Settings Explorer',
    username: 'spin-settings-explorer',
    email: 'spin-settings@example.test',
    phone: '+420 777 123 456',
    birth_date: '1995-06-15',
    balance: 10000,
    email_verified_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
};

for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
]) {
    test.describe(`Advanced spin settings at ${viewport.width}px`, () => {
        test.use({ viewport });

        test('sends empty, zero, and exact positive payouts and resets the override', async ({
            page,
        }) => {
            // Exercise the form without modifying demo accounts or sending analytics.
            await page.route('https://www.googletagmanager.com/**', (route) =>
                route.abort(),
            );
            await page.route('**/login', (route) =>
                route.fulfill({ json: { user, message: 'Welcome back!' } }),
            );
            const requestIds: string[] = [];
            await page.route('**/games/*/spin', async (route) => {
                const data = route.request().postDataJSON();
                const manual = data.win_amount !== '';
                const payout = manual
                    ? Math.round(Number(data.win_amount) * 100)
                    : 500;
                await route.fulfill({
                    status: 201,
                    json: {
                        user: { ...user, balance: 9750 + payout },
                        bet: { id: 1, amount: 250 },
                        win: { amount: payout, multiplier: manual ? null : 2 },
                    },
                });
            });
            await page.goto('/');
            await page
                .getByRole('button', { name: 'Log in', exact: true })
                .click();
            await page
                .getByLabel('Email address', { exact: true })
                .fill(user.email);
            await page
                .getByLabel('Password', { exact: true })
                .fill('IslandPass123!');
            await page
                .getByRole('dialog')
                .getByRole('button', { name: 'Log in', exact: true })
                .click();
            await expect(page.getByRole('dialog')).not.toBeVisible();
            await page
                .getByRole('button', {
                    name: 'Play Golden Pharaoh',
                    exact: true,
                })
                .click();
            await page.getByLabel('Bet amount').fill('2.50');
            const settings = page.getByRole('button', {
                name: 'Advanced spin settings',
            });
            await expect(settings).toHaveAttribute('aria-expanded', 'false');
            await expect(page.getByLabel('Win amount')).not.toBeVisible();

            for (const amount of ['', '0', '1.37', '']) {
                if (amount !== '' || requestIds.length > 0) {
                    if (
                        (await settings.getAttribute('aria-expanded')) ===
                        'false'
                    ) {
                        await settings.click();
                    }
                    await page.getByLabel('Win amount').fill(amount);
                }
                const requestPromise = page.waitForRequest('**/games/*/spin');
                await page
                    .getByRole('button', { name: 'Spin', exact: true })
                    .click();
                const request = await requestPromise;
                const data = request.postDataJSON();
                expect(Number(data.amount)).toBe(2.5);
                expect(String(data.win_amount)).toBe(amount);
                expect(requestIds).not.toContain(data.request_id);
                requestIds.push(data.request_id);
                await expect(
                    page.getByRole('button', { name: 'Spin', exact: true }),
                ).toBeEnabled();
                await expect(
                    page.getByText(
                        amount === ''
                            ? '2× multiplier · Demo result'
                            : 'Manual payout · Demo result',
                    ),
                ).toBeVisible();
                await expect(page.locator('.spin-result strong')).toHaveText(
                    amount === ''
                        ? '+5.00 DC'
                        : amount === '0'
                          ? 'No win this spin'
                          : '+1.37 DC',
                );
            }
            await expect(page.getByLabel('Win amount')).toHaveValue('');
            const fits = await page
                .locator('dialog.game-dialog')
                .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth);
            expect(fits).toBe(true);
        });

        test('changing the manual payout uses a new request ID after a failed request', async ({
            page,
        }) => {
            await page.route('https://www.googletagmanager.com/**', (route) =>
                route.abort(),
            );
            await page.route('**/login', (route) =>
                route.fulfill({ json: { user } }),
            );
            await page.route('**/games/*/spin', (route) =>
                route.fulfill({ status: 503, json: { message: 'Try again.' } }),
            );
            await page.goto('/');
            await page
                .getByRole('button', { name: 'Log in', exact: true })
                .click();
            await page
                .getByLabel('Email address', { exact: true })
                .fill(user.email);
            await page
                .getByLabel('Password', { exact: true })
                .fill('IslandPass123!');
            await page
                .getByRole('dialog')
                .getByRole('button', { name: 'Log in', exact: true })
                .click();
            await expect(page.getByRole('dialog')).not.toBeVisible();
            await page
                .getByRole('button', {
                    name: 'Play Golden Pharaoh',
                    exact: true,
                })
                .click();
            await page
                .getByRole('button', { name: 'Advanced spin settings' })
                .click();
            const requestIds: string[] = [];
            for (const amount of ['0', '0', '1.37']) {
                await page.getByLabel('Win amount').fill(amount);
                const requestPromise = page.waitForRequest('**/games/*/spin');
                await page
                    .getByRole('button', { name: 'Spin', exact: true })
                    .click();
                requestIds.push(
                    (await requestPromise).postDataJSON().request_id,
                );
                await expect(
                    page.getByText('Something went wrong. Please try again.'),
                ).toBeVisible();
            }
            expect(requestIds[0]).toBe(requestIds[1]);
            expect(requestIds[2]).not.toBe(requestIds[1]);
        });
    });
}
