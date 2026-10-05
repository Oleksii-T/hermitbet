import { test, expect, type Page } from '@playwright/test';

const user = {
    id: 999998,
    name: 'Low Funds Explorer',
    username: 'low-funds-explorer',
    email: 'low-funds@example.test',
    phone: '+420 777 123 456',
    birth_date: '1995-06-15',
    balance: 2000,
    email_verified_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
};
const snoozeKey = 'hermit.low-funds.snoozed-until';

async function lowFundsEvents(page: Page) {
    return page.evaluate(() =>
        (window.dataLayer ?? []).filter((entry) =>
            String(entry.event).startsWith('low_funds_'),
        ),
    );
}

function lowFunds(page: Page) {
    return page.getByRole('dialog', {
        name: "You're running out of funds.",
        exact: true,
    });
}

async function logInAndOpenGame(page: Page) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page.getByLabel('Email address', { exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('IslandPass123!');
    await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Log in', exact: true })
        .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page
        .getByRole('button', { name: 'Play Golden Pharaoh', exact: true })
        .click();
    await expect(page.locator('dialog.game-dialog')).toBeVisible();
}

async function completeSpin(page: Page) {
    await page.getByRole('button', { name: 'Spin', exact: true }).click();
    await expect(page.locator('dialog.game-dialog .spin-result')).toBeVisible();
    await expect(page.locator('dialog.game-dialog .spin-button')).toBeEnabled();
}

for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
]) {
    test.describe(`Low-funds prompt at ${viewport.width}px`, () => {
        test.use({ viewport });

        test.beforeEach(async ({ page }) => {
            // Mock account/spin replies so the experiment never changes demo accounts.
            await page.route('https://www.googletagmanager.com/**', (route) =>
                route.abort(),
            );
            await page.addInitScript(() => {
                window.dataLayer = [{ event: 'existing_event' }];
            });
            await page.route('**/login', (route) =>
                route.fulfill({ json: { user, message: 'Welcome back!' } }),
            );
        });

        test('compares the returned balance with the current bet after a completed spin', async ({
            page,
        }) => {
            let balance = 500;
            let fails = true;
            await page.route('**/games/*/spin', (route) =>
                route.fulfill(
                    fails
                        ? {
                              status: 422,
                              json: {
                                  message: 'Insufficient credits.',
                                  errors: { amount: ['Insufficient credits.'] },
                              },
                          }
                        : {
                              status: 201,
                              json: {
                                  user: { ...user, balance },
                                  bet: { id: 1, amount: 500 },
                                  win: { amount: 0, multiplier: 0 },
                              },
                          },
                ),
            );
            await logInAndOpenGame(page);
            await page.getByLabel('Bet amount').fill('5');
            await expect(lowFunds(page)).not.toBeVisible();
            await page
                .getByRole('button', { name: 'Spin', exact: true })
                .click();
            await expect(page.getByText('Insufficient credits.')).toBeVisible();
            await expect(lowFunds(page)).not.toBeVisible();
            expect(await lowFundsEvents(page)).toEqual([]);

            fails = false;
            await completeSpin(page);
            await expect(lowFunds(page)).not.toBeVisible();
            balance = 501;
            await completeSpin(page);
            await expect(lowFunds(page)).not.toBeVisible();
            expect(await lowFundsEvents(page)).toEqual([]);
            balance = 499;
            await completeSpin(page);
            await expect(lowFunds(page)).toBeVisible();
            expect(await lowFundsEvents(page)).toEqual([
                {
                    event: 'low_funds_shown',
                    game_id: expect.any(Number),
                    game_name: 'Golden Pharaoh',
                    demo_balance: 499,
                    bet_amount: 500,
                },
            ]);
            expect(await page.evaluate(() => window.dataLayer?.[0])).toEqual({
                event: 'existing_event',
            });
        });

        test('cancel preserves the game and snoozes across reloads for exactly 20 minutes', async ({
            page,
        }) => {
            await page.clock.install();
            await page.route('**/games/*/spin', (route) =>
                route.fulfill({
                    status: 201,
                    json: {
                        user: { ...user, balance: 49 },
                        bet: { id: 1, amount: 100 },
                        win: { amount: 0, multiplier: 0 },
                    },
                }),
            );
            await logInAndOpenGame(page);
            await completeSpin(page);
            await lowFunds(page)
                .getByRole('button', { name: 'Cancel' })
                .click();
            await expect(lowFunds(page)).not.toBeVisible();
            await expect(page.locator('dialog.game-dialog')).toBeVisible();
            await expect(page.getByLabel('Bet amount')).toHaveValue('1');
            await expect(page.getByText('No win this spin')).toBeVisible();
            const initialEvents = await lowFundsEvents(page);
            expect(initialEvents).toEqual([
                {
                    event: 'low_funds_shown',
                    game_id: expect.any(Number),
                    game_name: 'Golden Pharaoh',
                    demo_balance: 49,
                    bet_amount: 100,
                },
                {
                    event: 'low_funds_closed',
                    game_id: expect.any(Number),
                    game_name: 'Golden Pharaoh',
                    demo_balance: 49,
                    bet_amount: 100,
                    close_method: 'button',
                },
            ]);
            expect(
                await page.evaluate(() =>
                    window.dataLayer?.filter(
                        (entry) => entry.event === 'game_closed',
                    ),
                ),
            ).toEqual([]);
            const remaining = await page.evaluate(
                (key) => Number(sessionStorage.getItem(key)) - Date.now(),
                snoozeKey,
            );
            expect(remaining).toBeGreaterThan(19 * 60 * 1000);
            expect(remaining).toBeLessThanOrEqual(20 * 60 * 1000);

            await completeSpin(page);
            await expect(lowFunds(page)).not.toBeVisible();
            expect(await lowFundsEvents(page)).toEqual(initialEvents);
            await logInAndOpenGame(page);
            await page.clock.fastForward(19 * 60 * 1000);
            await completeSpin(page);
            await expect(lowFunds(page)).not.toBeVisible();
            expect(await lowFundsEvents(page)).toEqual([]);
            await page.clock.fastForward(60 * 1000);
            await completeSpin(page);
            await expect(lowFunds(page)).toBeVisible();
            expect(
                (await lowFundsEvents(page)).map((event) => event.event),
            ).toEqual(['low_funds_shown']);
        });

        test('deposit opens the demo cashier without setting a snooze', async ({
            page,
        }) => {
            await page.route('**/games/*/spin', (route) =>
                route.fulfill({
                    status: 201,
                    json: {
                        user: { ...user, balance: 0 },
                        bet: { id: 1, amount: 100 },
                        win: { amount: 0, multiplier: 0 },
                    },
                }),
            );
            await logInAndOpenGame(page);
            await completeSpin(page);
            await lowFunds(page)
                .getByRole('button', { name: 'Deposit', exact: true })
                .click();
            await expect(lowFunds(page)).not.toBeVisible();
            await expect(page.getByLabel('Deposit amount')).toBeVisible();
            const context = {
                game_id: expect.any(Number),
                game_name: 'Golden Pharaoh',
                demo_balance: 0,
                bet_amount: 100,
            };
            expect(await lowFundsEvents(page)).toEqual([
                { ...context, event: 'low_funds_shown' },
                { ...context, event: 'low_funds_deposit_clicked' },
                {
                    ...context,
                    event: 'low_funds_closed',
                    close_method: 'deposit',
                },
            ]);
            expect(
                await page.evaluate(
                    (key) => sessionStorage.getItem(key),
                    snoozeKey,
                ),
            ).toBeNull();
        });

        test('Escape and backdrop dismissal also snooze and keep the game open', async ({
            page,
        }) => {
            await page.route('**/games/*/spin', (route) =>
                route.fulfill({
                    status: 201,
                    json: {
                        user: { ...user, balance: 0 },
                        bet: { id: 1, amount: 100 },
                        win: { amount: 0, multiplier: 0 },
                    },
                }),
            );
            await logInAndOpenGame(page);
            for (const method of ['escape', 'backdrop']) {
                await completeSpin(page);
                await expect(lowFunds(page)).toBeVisible();
                if (method === 'escape') await page.keyboard.press('Escape');
                else await page.mouse.click(2, 2);
                await expect(lowFunds(page)).not.toBeVisible();
                await expect(page.locator('dialog.game-dialog')).toBeVisible();
                expect(await lowFundsEvents(page)).toEqual([
                    {
                        event: 'low_funds_shown',
                        game_id: expect.any(Number),
                        game_name: 'Golden Pharaoh',
                        demo_balance: 0,
                        bet_amount: 100,
                    },
                    {
                        event: 'low_funds_closed',
                        game_id: expect.any(Number),
                        game_name: 'Golden Pharaoh',
                        demo_balance: 0,
                        bet_amount: 100,
                        close_method: method,
                    },
                ]);
                expect(
                    await page.evaluate(
                        (key) =>
                            Number(sessionStorage.getItem(key)) > Date.now(),
                        snoozeKey,
                    ),
                ).toBe(true);
                await page.evaluate(
                    (key) => sessionStorage.removeItem(key),
                    snoozeKey,
                );
                await page.reload();
                await logInAndOpenGame(page);
            }
        });

        test('tracks native closure, modal replacement, and navigation once', async ({
            page,
        }) => {
            await page.route('**/games/*/spin', (route) =>
                route.fulfill({
                    status: 201,
                    json: {
                        user: { ...user, balance: 0 },
                        bet: { id: 1, amount: 100 },
                        win: { amount: 0, multiplier: 0 },
                    },
                }),
            );
            await logInAndOpenGame(page);
            for (const method of [
                'programmatic',
                'programmatic',
                'navigation',
            ]) {
                await completeSpin(page);
                await expect(lowFunds(page)).toBeVisible();
                if (method === 'navigation') {
                    await page
                        .locator('a[href="/games"]')
                        .first()
                        .evaluate((link) =>
                            (link as HTMLAnchorElement).click(),
                        );
                    await expect(page).toHaveURL(/\/games$/);
                } else if ((await lowFundsEvents(page)).length === 1) {
                    await lowFunds(page).evaluate((dialog) =>
                        (dialog as HTMLDialogElement).close(),
                    );
                } else {
                    // Closing the parent game also removes its low-funds prompt.
                    await page
                        .locator('dialog.game-dialog')
                        .evaluate((dialog) =>
                            (dialog as HTMLDialogElement).close(),
                        );
                }
                await expect(lowFunds(page)).not.toBeVisible();
                await expect
                    .poll(async () => (await lowFundsEvents(page)).at(-1))
                    .toEqual({
                        event: 'low_funds_closed',
                        game_id: expect.any(Number),
                        game_name: 'Golden Pharaoh',
                        demo_balance: 0,
                        bet_amount: 100,
                        close_method: method,
                    });
                if (method === 'navigation') break;
                if ((await lowFundsEvents(page)).length === 4) {
                    await page
                        .getByRole('button', {
                            name: 'Play Golden Pharaoh',
                            exact: true,
                        })
                        .click();
                }
            }
            expect(
                (await lowFundsEvents(page)).map((entry) => entry.event),
            ).toEqual([
                'low_funds_shown',
                'low_funds_closed',
                'low_funds_shown',
                'low_funds_closed',
                'low_funds_shown',
                'low_funds_closed',
            ]);
        });
    });
}
