import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const screenshotDir = 'storage/app/preview-screenshots';
const money = (amount: number) =>
    `${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DC`;
async function screenshot(page: Page, name: string, fullPage = false) {
    await mkdir(screenshotDir, { recursive: true });
    await page.screenshot({
        path: `${screenshotDir}/${name}.png`,
        fullPage,
        animations: 'disabled',
    });
}
async function closeModal(page: Page) {
    await page
        .getByRole('button', { name: 'Close modal', exact: true })
        .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
}

test('complete account, cashier, bonus, gameplay and wallet flow with screenshots', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const id = Date.now();
    const email = `explorer-${id}@example.test`;
    await page.goto('/');
    await expect(
        page.getByRole('heading', { name: 'Your daily dose of play.' }),
    ).toBeVisible();
    await expect(page.getByTestId('header-balance')).toHaveText('0.00 DC');
    await screenshot(page, '01-lobby-desktop', true);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await screenshot(page, '02-login-modal');
    await page
        .getByRole('button', { name: 'Create an account', exact: true })
        .click();
    await page.getByLabel('Username', { exact: true }).fill(`explorer${id}`);
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page
        .getByLabel('Phone number', { exact: true })
        .fill('+420 777 123 456');
    await page.getByLabel('Birth date', { exact: true }).fill('1995-06-15');
    await page.getByLabel('Password', { exact: true }).fill('IslandPass123!');
    await page
        .getByLabel('Confirm password', { exact: true })
        .fill('IslandPass123!');
    await screenshot(page, '03-register-modal');
    await page
        .getByRole('button', { name: 'Create my account', exact: true })
        .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Open profile', exact: true }),
    ).toBeVisible();
    await page
        .getByRole('button', { name: 'Open profile', exact: true })
        .click();
    await page
        .getByLabel('Display name', { exact: true })
        .fill('Sunny Explorer');
    await page
        .getByLabel('Email address', { exact: true })
        .fill(`sunny-${id}@example.test`);
    await page
        .getByLabel('Phone number', { exact: true })
        .fill('+420 777 444 555');
    await page
        .getByRole('button', { name: 'Save changes', exact: true })
        .click();
    await expect(
        page.getByText('Your profile has been updated.', { exact: true }),
    ).toBeVisible();
    await screenshot(page, '04-profile-modal');
    await closeModal(page);
    await page.getByRole('button', { name: 'Deposit', exact: true }).click();
    await expect(page.getByRole('button', { name: /Bank card/ })).toBeVisible();
    await expect(
        page.getByRole('button', { name: /Bank transfer/ }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Apple Pay/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Crypto/ })).toBeVisible();
    await page.getByRole('button', { name: '100 DC', exact: true }).click();
    await screenshot(page, '05-cashier-deposit');
    await page
        .getByRole('button', { name: 'Add demo credits', exact: true })
        .click();
    await expect(page.getByTestId('header-balance')).toHaveText('100.00 DC');
    await expect(
        page.getByText('Your demo credits have landed!', { exact: true }),
    ).toBeVisible();
    await screenshot(page, '06-deposit-success');
    await page.getByRole('tab', { name: 'Withdraw', exact: true }).click();
    await page.getByLabel('Withdrawal amount', { exact: true }).fill('25');
    await screenshot(page, '07-cashier-withdraw');
    await page
        .getByRole('button', { name: 'Withdraw demo credits', exact: true })
        .click();
    await expect(page.getByTestId('header-balance')).toHaveText('75.00 DC');
    await screenshot(page, '08-withdraw-success');
    await closeModal(page);
    await page
        .getByRole('button', { name: 'Bonus codes', exact: true })
        .click();
    await page.getByLabel('Bonus code', { exact: true }).fill('SHELL100');
    await screenshot(page, '09-bonus-code-modal');
    await page
        .getByRole('button', { name: 'Redeem bonus', exact: true })
        .click();
    await expect(page.getByTestId('header-balance')).toHaveText('175.00 DC');
    await expect(
        page.getByText('Bonus unlocked! 100.00 demo credits added.', {
            exact: true,
        }),
    ).toBeVisible();
    await screenshot(page, '10-bonus-success');
    await page
        .getByRole('button', { name: 'Redeem bonus', exact: true })
        .click();
    await expect(
        page.getByText('You have already redeemed this bonus code.', {
            exact: true,
        }),
    ).toBeVisible();
    await expect(page.getByTestId('header-balance')).toHaveText('175.00 DC');
    await closeModal(page);
    await page
        .getByRole('button', { name: 'Play Golden Pharaoh', exact: true })
        .click();
    await expect(
        page
            .getByRole('dialog')
            .getByRole('heading', { name: 'Golden Pharaoh', exact: true }),
    ).toBeVisible();
    await page.getByLabel('Bet amount', { exact: true }).fill('2.50');
    await screenshot(page, '11-simulated-game-modal');
    const spinReply = page.waitForResponse(
        (response) =>
            response.url().endsWith('/spin') &&
            response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Spin', exact: true }).click();
    const response = await spinReply;
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.bet.amount).toBe(250);
    expect(data.win.amount).toBeGreaterThanOrEqual(0);
    await expect(page.getByTestId('header-balance')).toHaveText(
        money(data.user.balance),
    );
    await expect(page.getByText(/multiplier · Demo result/)).toBeVisible();
    await screenshot(page, '12-spin-result');
    await closeModal(page);
    await page
        .getByRole('button', { name: 'Open wallet', exact: true })
        .click();
    await expect(
        page.getByText('Spin · Golden Pharaoh', { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByText('Result · Golden Pharaoh', { exact: true }),
    ).toBeVisible();
    await expect(
        page.getByText('Bonus · SHELL100', { exact: true }),
    ).toBeVisible();
    await screenshot(page, '13-wallet-history');
    await closeModal(page);
    await page.reload();
    await expect(page.getByTestId('header-balance')).toHaveText(
        money(data.user.balance),
    );
    await page
        .getByRole('button', { name: 'Open profile', exact: true })
        .click();
    await expect(page.getByLabel('Display name')).toHaveValue('Sunny Explorer');
    await expect(page.getByLabel('Phone number')).toHaveValue(
        '+420 777 444 555',
    );
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page.getByTestId('header-balance')).toHaveText('0.00 DC');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page
        .getByLabel('Email address', { exact: true })
        .fill(`sunny-${id}@example.test`);
    await page.getByLabel('Password', { exact: true }).fill('IslandPass123!');
    await page
        .getByRole('button', { name: 'Log in', exact: true })
        .last()
        .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByTestId('header-balance')).toHaveText(
        money(data.user.balance),
    );
    await page
        .getByRole('link', { name: 'Tournaments NEW', exact: true })
        .click();
    await expect(
        page.getByRole('heading', { name: 'A little friendly competition.' }),
    ).toBeVisible();
    await screenshot(page, '14-tournaments-desktop', true);
    await page
        .getByRole('button', { name: 'Join the adventure', exact: true })
        .first()
        .click();
    await expect(
        page.getByRole('button', { name: 'You’re on the list', exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
        page.getByRole('button', { name: 'You’re on the list', exact: true }),
    ).toBeDisabled();
    await screenshot(page, '15-tournament-joined');
    expect(errors).toEqual([]);
});

test('catalog search, category, provider, tag, order, pagination and provider navigation', async ({
    page,
}) => {
    await page.goto('/games');
    await expect(
        page.getByText('120 games found', { exact: true }),
    ).toBeVisible();
    await expect(page.locator('.catalog-grid .game-card')).toHaveCount(24);
    await screenshot(page, '16-all-games-desktop', true);
    await page
        .getByRole('button', { name: 'Discover more games', exact: true })
        .click();
    await expect(page.locator('.catalog-grid .game-card')).toHaveCount(48);
    await page.getByRole('button', { name: 'Arcade 36', exact: true }).click();
    await expect(
        page.getByText('36 games found', { exact: true }),
    ).toBeVisible();
    await page
        .getByLabel('Filter by provider', { exact: true })
        .selectOption({ label: 'Shell Studio' });
    await expect(
        page.getByText('6 games found', { exact: true }),
    ).toBeVisible();
    await page
        .getByLabel('Filter by tag', { exact: true })
        .selectOption('Adventure');
    await expect(
        page.getByText('3 games found', { exact: true }),
    ).toBeVisible();
    await page.getByLabel('Sort games', { exact: true }).selectOption('name');
    const names = await page
        .locator('.catalog-grid .game-info h3')
        .allTextContents();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    await screenshot(page, '17-games-filtered-and-sorted');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page
        .getByLabel('Search all games', { exact: true })
        .fill('Golden Pharaoh');
    await expect(
        page.getByText('10 games found', { exact: true }),
    ).toBeVisible();
    await screenshot(page, '18-games-search');
    await page
        .getByLabel('Search all games', { exact: true })
        .fill('no game exists');
    await expect(
        page.getByRole('heading', { name: 'No islands in sight.' }),
    ).toBeVisible();
    await screenshot(page, '19-games-empty-state');
    await page
        .getByRole('button', { name: 'Clear filters', exact: true })
        .click();
    await page.getByRole('button', { name: /Palm Play 20 games/ }).click();
    await expect(
        page.getByLabel('Filter by provider', { exact: true }),
    ).not.toHaveValue('all');
    await expect(
        page.getByText('20 games found', { exact: true }),
    ).toBeVisible();
    await screenshot(page, '20-provider-filter');
});

test('mobile lobby, navigation, modals and tournament layouts remain accessible', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(
        page.getByRole('heading', { name: 'Your daily dose of play.' }),
    ).toBeVisible();
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await screenshot(page, '21-lobby-mobile', true);
    await page
        .getByRole('button', { name: 'Join the island', exact: true })
        .click();
    await expect(
        page.getByRole('heading', { name: 'Find your happy place.' }),
    ).toBeVisible();
    await screenshot(page, '22-register-mobile');
    await closeModal(page);
    await page
        .getByRole('button', { name: 'Toggle menu', exact: true })
        .click();
    await page
        .getByRole('link', { name: 'All games 120', exact: true })
        .click();
    await expect(
        page.getByRole('heading', { name: 'A whole world of play.' }),
    ).toBeVisible();
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await screenshot(page, '23-all-games-mobile', true);
    await page
        .getByRole('button', { name: 'Toggle menu', exact: true })
        .click();
    await page
        .getByRole('link', { name: 'Tournaments NEW', exact: true })
        .click();
    await screenshot(page, '24-tournaments-mobile', true);
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
});

test('invalid login, guest game gate and keyboard dismissal', async ({
    page,
}) => {
    await page.goto('/');
    await page
        .getByRole('button', { name: 'Play Golden Pharaoh', exact: true })
        .click();
    await expect(
        page.getByRole('heading', { name: 'Welcome back, explorer.' }),
    ).toBeVisible();
    await page
        .getByLabel('Email address', { exact: true })
        .fill('nobody@example.test');
    await page.getByLabel('Password', { exact: true }).fill('WrongPass123!');
    await page
        .getByRole('button', { name: 'Log in', exact: true })
        .last()
        .click();
    await expect(
        page.getByText('These credentials do not match our records.', {
            exact: true,
        }),
    ).toBeVisible();
    await screenshot(page, '25-login-validation');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByTestId('header-balance')).toHaveText('0.00 DC');
});

test('mobile account, wallet, cashier and gameplay modals', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await page
        .getByLabel('Email address', { exact: true })
        .fill('demo@hermit.test');
    await page.getByLabel('Password', { exact: true }).fill('IslandDemo123!');
    await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Log in', exact: true })
        .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page
        .getByRole('button', { name: 'Open profile', exact: true })
        .click();
    await expect(page.getByLabel('Display name')).toHaveValue(
        'Island Explorer',
    );
    await screenshot(page, '26-profile-mobile');
    await closeModal(page);
    await page.getByRole('button', { name: 'Deposit', exact: true }).click();
    await expect(
        page.getByRole('tab', { name: 'Deposit', exact: true }),
    ).toBeVisible();
    await screenshot(page, '27-cashier-mobile');
    await closeModal(page);
    await page
        .getByRole('button', { name: 'Open wallet', exact: true })
        .click();
    await expect(
        page.getByText('Welcome demo credits', { exact: true }),
    ).toBeVisible();
    await screenshot(page, '28-wallet-mobile');
    await closeModal(page);
    await page
        .getByRole('button', { name: 'Play Golden Pharaoh', exact: true })
        .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Spin', exact: true }),
    ).toBeVisible();
    await screenshot(page, '29-game-mobile');
    await page.getByLabel('Bet amount', { exact: true }).fill('1');
    await page.getByRole('button', { name: 'Spin', exact: true }).click();
    await expect(page.getByText(/multiplier · Demo result/)).toBeVisible();
    await screenshot(page, '30-spin-result-mobile');
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
});
