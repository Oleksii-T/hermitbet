import { test, expect, type Page } from '@playwright/test';

const user = {
    id: 999999,
    name: 'GTM Explorer',
    username: 'gtm-explorer',
    email: 'gtm@example.test',
    phone: '+420 777 123 456',
    birth_date: '1995-06-15',
    balance: 10000,
    email_verified_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
};

async function modalEvents(page: Page, event: string) {
    return page.evaluate(
        (name) =>
            (
                window as Window & {
                    dataLayer?: Record<string, unknown>[];
                }
            ).dataLayer?.filter((entry) => entry.event === name),
        event,
    );
}

const gameEvents = (page: Page) => modalEvents(page, 'game_closed');
const cashierEvents = (page: Page) => modalEvents(page, 'cashier_closed');

async function openGame(page: Page) {
    await page
        .getByRole('button', { name: 'Play Golden Pharaoh', exact: true })
        .click();
    await expect(page.locator('dialog.game-dialog')).toBeVisible();
}

for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
]) {
    test.describe(`GTM modal closure at ${viewport.width}px`, () => {
        test.use({ viewport });

        test.beforeEach(async ({ page }) => {
            // Test the app's event contract without sending analytics or changing accounts.
            await page.route('https://www.googletagmanager.com/**', (route) =>
                route.abort(),
            );
            await page.addInitScript(() => {
                (
                    window as Window & {
                        dataLayer?: Record<string, unknown>[];
                    }
                ).dataLayer = [{ event: 'existing_event' }];
            });
            await page.route('**/login', (route) =>
                route.fulfill({ json: { user, message: 'Welcome back!' } }),
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
            expect(await gameEvents(page)).toEqual([]);
        });

        test('tracks each actual closure once and preserves the existing queue', async ({
            page,
        }) => {
            const methods = [
                'button',
                'escape',
                'backdrop',
                'programmatic',
                'button',
            ];
            for (const [index, method] of methods.entries()) {
                await openGame(page);
                if (method === 'button') {
                    await page
                        .getByRole('button', {
                            name: 'Close modal',
                            exact: true,
                        })
                        .click();
                } else if (method === 'escape') {
                    await page.keyboard.press('Escape');
                } else if (method === 'backdrop') {
                    await page.mouse.click(2, 2);
                } else {
                    await page
                        .getByRole('dialog')
                        .evaluate((dialog) =>
                            (dialog as HTMLDialogElement).close(),
                        );
                }
                await expect(page.getByRole('dialog')).not.toBeVisible();
                await expect
                    .poll(async () => (await gameEvents(page))?.length)
                    .toBe(index + 1);
                expect((await gameEvents(page))?.[index]).toEqual({
                    event: 'game_closed',
                    game_id: expect.any(Number),
                    game_name: 'Golden Pharaoh',
                    close_method: method,
                });
            }
            await page
                .getByRole('button', { name: 'Deposit', exact: true })
                .click();
            await page
                .getByRole('button', { name: 'Close modal', exact: true })
                .click();
            await expect(page.getByRole('dialog')).not.toBeVisible();
            expect((await gameEvents(page))?.length).toBe(methods.length);
            expect(
                await page.evaluate(
                    () =>
                        (
                            window as Window & {
                                dataLayer?: Record<string, unknown>[];
                            }
                        ).dataLayer?.[0],
                ),
            ).toEqual({ event: 'existing_event' });

            await openGame(page);
            // Navigation can remove an open dialog without a dismissal click.
            await page
                .locator('a[href="/games"]')
                .first()
                .evaluate((link) => (link as HTMLAnchorElement).click());
            await expect(page).toHaveURL(/\/games$/);
            await expect(page.getByRole('dialog')).not.toBeVisible();
            await expect
                .poll(async () => (await gameEvents(page))?.length)
                .toBe(methods.length + 1);
            expect((await gameEvents(page))?.at(-1)?.close_method).toBe(
                'navigation',
            );
        });

        test('does not track close attempts blocked by a pending spin', async ({
            page,
        }) => {
            let releaseSpin!: () => void;
            const pendingSpin = new Promise<void>((resolve) => {
                releaseSpin = resolve;
            });
            await page.route('**/games/*/spin', async (route) => {
                await pendingSpin;
                await route.fulfill({
                    status: 201,
                    json: {
                        user,
                        bet: { id: 1, amount: 100 },
                        win: { amount: 0, multiplier: 0 },
                    },
                });
            });
            await openGame(page);
            await page
                .getByRole('button', { name: 'Spin', exact: true })
                .click();
            await expect(
                page.getByRole('button', { name: 'Spinning…', exact: true }),
            ).toBeDisabled();
            try {
                await page
                    .getByRole('button', { name: 'Close modal', exact: true })
                    .click();
                await page.keyboard.press('Escape');
                await page.mouse.click(2, 2);
                await expect(page.getByRole('dialog')).toBeVisible();
                expect(await gameEvents(page)).toEqual([]);
            } finally {
                releaseSpin();
            }
            await expect(
                page.getByRole('button', { name: 'Spin', exact: true }),
            ).toBeEnabled();
            await page.keyboard.press('Escape');
            await expect(page.getByRole('dialog')).not.toBeVisible();
            await expect
                .poll(async () => (await gameEvents(page))?.length)
                .toBe(1);
            expect((await gameEvents(page))?.[0]?.close_method).toBe('escape');
        });

        test('tracks cashier closures with the selected tab and payment method', async ({
            page,
        }) => {
            const methods = [
                'button',
                'escape',
                'backdrop',
                'programmatic',
                'button',
            ];
            for (const [index, method] of methods.entries()) {
                await page
                    .getByRole('button', { name: 'Deposit', exact: true })
                    .click();
                await page.locator('.gtm-deposit-bank').click();
                await expect(page.locator('.gtm-deposit-bank')).toHaveAttribute(
                    'aria-pressed',
                    'true',
                );
                if (index === 1) {
                    await page
                        .getByRole('tab', { name: 'Withdraw', exact: true })
                        .click();
                }
                if (method === 'button') {
                    await page
                        .getByRole('button', {
                            name: 'Close modal',
                            exact: true,
                        })
                        .click();
                } else if (method === 'escape') {
                    await page.keyboard.press('Escape');
                } else if (method === 'backdrop') {
                    await page.mouse.click(2, 2);
                } else {
                    await page
                        .getByRole('dialog')
                        .evaluate((dialog) =>
                            (dialog as HTMLDialogElement).close(),
                        );
                }
                await expect(page.getByRole('dialog')).not.toBeVisible();
                await expect
                    .poll(async () => (await cashierEvents(page))?.length)
                    .toBe(index + 1);
                expect((await cashierEvents(page))?.[index]).toEqual({
                    event: 'cashier_closed',
                    cashier_tab: index === 1 ? 'withdraw' : 'deposit',
                    payment_method: 'bank',
                    close_method: method,
                });
            }
            expect(await gameEvents(page)).toEqual([]);
            await openGame(page);
            await page.keyboard.press('Escape');
            await expect(page.getByRole('dialog')).not.toBeVisible();
            expect((await cashierEvents(page))?.length).toBe(methods.length);

            await page
                .getByRole('button', { name: 'Deposit', exact: true })
                .click();
            await page.locator('.gtm-deposit-crypto').click();
            await page
                .locator('a[href="/games"]')
                .first()
                .evaluate((link) => (link as HTMLAnchorElement).click());
            await expect(page).toHaveURL(/\/games$/);
            await expect
                .poll(async () => (await cashierEvents(page))?.length)
                .toBe(methods.length + 1);
            expect((await cashierEvents(page))?.at(-1)).toEqual({
                event: 'cashier_closed',
                cashier_tab: 'deposit',
                payment_method: 'crypto',
                close_method: 'navigation',
            });
        });

        test('does not track cashier close attempts during a pending transfer', async ({
            page,
        }) => {
            let releaseTransfer!: () => void;
            const pendingTransfer = new Promise<void>((resolve) => {
                releaseTransfer = resolve;
            });
            await page.route('**/wallet/deposit', async (route) => {
                await pendingTransfer;
                await route.fulfill({
                    status: 201,
                    json: { user, message: 'Your demo credits have landed!' },
                });
            });
            await page
                .getByRole('button', { name: 'Deposit', exact: true })
                .click();
            await page
                .getByRole('button', { name: 'Add demo credits', exact: true })
                .click();
            await expect(
                page.getByRole('button', { name: 'Processing…', exact: true }),
            ).toBeDisabled();
            try {
                await page
                    .getByRole('button', { name: 'Close modal', exact: true })
                    .click();
                await page.keyboard.press('Escape');
                await page.mouse.click(2, 2);
                await expect(page.getByRole('dialog')).toBeVisible();
                expect(await cashierEvents(page)).toEqual([]);
            } finally {
                releaseTransfer();
            }
            await expect(
                page.getByRole('button', {
                    name: 'Add demo credits',
                    exact: true,
                }),
            ).toBeEnabled();
            await page.mouse.click(2, 2);
            await expect(page.getByRole('dialog')).not.toBeVisible();
            await expect
                .poll(async () => (await cashierEvents(page))?.length)
                .toBe(1);
            expect((await cashierEvents(page))?.[0]?.close_method).toBe(
                'backdrop',
            );
        });
    });
}
