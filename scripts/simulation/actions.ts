import { expect, type Locator, type Response } from '@playwright/test';
import type { Modal, Outcome, Session, SimulationWindow } from './types.js';

const button = (s: Session, name: string | RegExp) =>
    s.page.getByRole('button', { name, exact: typeof name === 'string' });
const dialog = (s: Session) => s.page.getByRole('dialog');
// Validation messages live inside <label>, so the accessible name can grow
// after a rejected submission. Keep the label prefix stable for correction.
const field = (s: Session, name: string) =>
    s.page.getByLabel(
        new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );
const money = (cents: number) =>
    `${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DC`;

export async function pause(s: Session, min = 250, max = 1500) {
    if (s.stopped()) throw new Error('Simulation stopped');
    const ms = Math.round(s.rng.int(min, max) * s.options.speed);
    if (ms) await s.page.waitForTimeout(ms);
}

async function type(s: Session, input: Locator, value: string) {
    await input.fill('');
    // Numeric/date controls do not support sequential key entry consistently.
    const inputType = await input.getAttribute('type');
    if (
        inputType === 'number' ||
        inputType === 'date' ||
        s.options.speed === 0
    ) {
        await input.fill(value);
    } else {
        await input.pressSequentially(value, {
            delay: s.rng.int(25, 85) * s.options.speed,
        });
    }
    await pause(s, 100, 450);
}

async function randomClick(s: Session, locator: Locator) {
    await expect(locator.first()).toBeVisible();
    const selected = locator.nth(s.rng.int(0, (await locator.count()) - 1));
    const name =
        (await selected.getAttribute('aria-label')) ??
        (await selected.innerText());
    await selected.hover();
    await pause(s, 100, 600);
    await selected.click();
    s.log('choice', { target: name });
}

async function menu(s: Session) {
    if (
        s.mobile &&
        !(await s.page
            .locator('.sidebar')
            .evaluate((el) => el.classList.contains('mobile-open')))
    ) {
        await button(s, 'Toggle menu').click();
    }
}

export async function refresh(s: Session) {
    const { page, state } = s;
    state.loginAttempts = state.loginAttempts.filter(
        (time) => time > Math.floor(Date.now() / 1000) * 1000 - 60000,
    );
    state.loginFailures = state.loginAttempts.length;
    if (state.modal === null) {
        state.toast = await page
            .getByRole('button', { name: 'Dismiss notification', exact: true })
            .isVisible();
        state.hasSearch = await page
            .getByRole('button', { name: 'Clear search', exact: true })
            .isVisible();
        state.gameCount = await page.locator('.game-card').count();
        state.canLoadMore = await button(s, 'Discover more games').isVisible();
        state.joinable = await button(s, 'Join the adventure').count();
    }
}

export async function visit(
    s: Session,
    section: Session['state']['section'],
    initial = false,
) {
    const path = section === 'lobby' ? '/' : `/${section}`;
    if (initial) {
        await s.page.goto(path, { waitUntil: 'domcontentloaded' });
    } else if (section === 'lobby') {
        await s.page
            .getByRole('link', { name: 'HERMIT home', exact: true })
            .click();
    } else {
        await menu(s);
        await s.page
            .getByRole('link', {
                name: section === 'games' ? 'All games 120' : 'Tournaments NEW',
                exact: true,
            })
            .click();
    }
    await expect(s.page).toHaveURL(
        new RegExp(`${path === '/' ? '/' : path}/?(?:\\?.*)?$`),
    );
    await expect(s.page.getByRole('heading', { level: 1 })).toContainText(
        section === 'lobby'
            ? 'Your daily dose of play'
            : section === 'games'
              ? 'A whole world of play'
              : 'A little friendly competition',
    );
    s.state.section = section;
    s.state.modal = null;
    s.state.carousel = 0;
    await refresh(s);
}

export async function open(s: Session, modal: Exclude<Modal, null>) {
    if (modal === 'login') await button(s, 'Log in').click();
    if (modal === 'register') await button(s, 'Join the island').click();
    if (modal === 'cashier') await button(s, 'Deposit').click();
    if (modal === 'wallet') {
        if (s.state.userId) {
            const response = s.page.waitForResponse(
                (r) =>
                    new URL(r.url()).pathname === '/wallet' &&
                    r.request().method() === 'GET',
            );
            const [, reply] = await Promise.all([
                button(s, 'Open wallet').click(),
                response,
            ]);
            expect(reply.status()).toBe(200);
            const data = (await reply.json()) as {
                user: { balance: number };
                transactions: { description: string }[];
            };
            expect(data.user.balance).toBe(s.state.balance);
            await expect(s.page.locator('.transaction')).toHaveCount(
                data.transactions.length,
            );
            if (!data.transactions.length)
                await expect(s.page.locator('.empty-activity')).toBeVisible();
        } else await button(s, 'Open wallet').click();
    }
    if (modal === 'profile') await button(s, 'Open profile').click();
    if (modal === 'bonus') {
        await menu(s);
        await button(s, 'Bonus codes').click();
    }
    if (modal === 'game')
        await randomClick(s, s.page.locator('.game-card .game-cover'));
    const actual =
        !s.state.userId && !['login', 'register'].includes(modal)
            ? 'login'
            : modal;
    await expect(dialog(s)).toBeVisible();
    await expect(dialog(s).getByRole('heading', { level: 2 })).toBeVisible();
    if (actual === 'login')
        await expect(dialog(s)).toContainText('Welcome back, explorer.');
    s.state.modal = actual;
    if (modal === 'cashier') s.state.tab = 'deposit';
    return actual !== modal
        ? { outcome: 'blocked' as const, detail: `guest-${modal}-login-gate` }
        : {};
}

export async function close(
    s: Session,
    mode: 'random' | 'escape' | 'button' = 'random',
): Promise<Outcome> {
    if (mode === 'escape' || (mode === 'random' && s.rng.next() < 0.35)) {
        await s.page.keyboard.press('Escape');
    } else {
        await button(s, 'Close modal').click();
    }
    await expect(dialog(s)).not.toBeVisible();
    s.state.modal = null;
    await refresh(s);
    return { outcome: 'abandoned', detail: 'modal-dismissed' };
}

async function submit(
    s: Session,
    endpoint: string | RegExp,
    method: string,
    name: string,
    status: number,
    error?: string,
): Promise<Outcome> {
    const responsePromise = s.page.waitForResponse((r) => {
        const path = new URL(r.url()).pathname;
        return (
            r.request().method() === method &&
            (typeof endpoint === 'string'
                ? path === endpoint
                : endpoint.test(path))
        );
    });
    // Handle the waiter too if the click fails (e.g. deadline closes the page).
    const [, response] = await Promise.all([
        dialog(s).getByRole('button', { name, exact: true }).click(),
        responsePromise,
    ]);
    expect(response.status(), `${method} ${endpoint}`).toBe(status);
    const data = (await response.json()) as {
        user?: { id: number; balance: number; email: string };
        message?: string;
        errors?: Record<string, string[]>;
    };
    if (error) {
        expect(
            Object.values(data.errors ?? {})
                .flat()
                .join(' '),
        ).toContain(error);
        await expect(dialog(s).getByText(error, { exact: true })).toBeVisible();
        await expect(s.page.getByTestId('header-balance')).toHaveText(
            money(s.state.balance),
        );
        await expect(
            dialog(s).getByRole('button', { name, exact: true }),
        ).toBeEnabled();
        return { outcome: 'expected-error', detail: error, status };
    }
    if (data.user) {
        s.state.userId = data.user.id;
        s.state.balance = data.user.balance;
        s.state.email = data.user.email;
    }
    if (endpoint === '/register' || endpoint === '/login') {
        s.state.hasAccount = true;
        s.state.loginFailures = 0;
        s.state.loginAttempts = [];
        s.state.blockedUntil = 0;
        s.state.modal = null;
        await expect(dialog(s)).not.toBeVisible();
        await expect(button(s, 'Open profile')).toBeVisible();
        await identify(s);
    } else if (endpoint === '/logout') {
        s.state.userId = null;
        s.state.balance = 0;
        s.state.modal = null;
        await expect(dialog(s)).not.toBeVisible();
        await s.page.evaluate(() => {
            const w = window as SimulationWindow;
            if (w.posthog?.__loaded) {
                w.posthog.reset();
                w.posthog.register(w.__hermitSimulation ?? {});
            }
            sessionStorage.removeItem('hermit-simulation-user');
        });
    } else if (method === 'POST' && endpoint instanceof RegExp) {
        await expect(
            dialog(s).getByText(/multiplier · Demo result/),
        ).toBeVisible();
        await expect(button(s, 'Spin')).toBeEnabled();
    } else if (data.message) {
        await expect(
            dialog(s).getByText(data.message, { exact: true }),
        ).toBeVisible();
        await expect(
            dialog(s).getByRole('button', { name, exact: true }),
        ).toBeEnabled();
    }
    await expect(s.page.getByTestId('header-balance')).toHaveText(
        money(s.state.balance),
    );
    return { status, detail: data.message };
}

async function identify(s: Session) {
    await s.page.evaluate(
        ({ id, email }) => {
            const w = window as SimulationWindow;
            sessionStorage.setItem(
                'hermit-simulation-user',
                JSON.stringify({ id, email }),
            );
            if (w.posthog?.__loaded)
                w.posthog.identify(`preview-user-${id}`, {
                    email,
                    simulation: true,
                });
        },
        { id: s.state.userId, email: s.state.email },
    );
}

const insufficient =
    'Not enough demo credits. Top up your wallet to keep exploring.';
const badLogin = 'These credentials do not match our records.';
const throttled =
    'Too many attempts. Please wait one minute before trying again.';

async function fillLogin(s: Session, valid: boolean) {
    await type(s, field(s, 'Email address'), s.state.email);
    await type(
        s,
        field(s, 'Password'),
        valid ? s.state.password : 'WrongIslandPass123!',
    );
}

async function invalidLogin(s: Session): Promise<Outcome> {
    await fillLogin(s, false);
    await refresh(s);
    const blocked =
        Date.now() < s.state.blockedUntil || s.state.loginFailures >= 5;
    const result = await submit(
        s,
        '/login',
        'POST',
        'Log in',
        422,
        blocked ? throttled : badLogin,
    );
    if (!blocked)
        s.state.loginAttempts.push(Math.floor(Date.now() / 1000) * 1000);
    s.state.loginFailures = s.state.loginAttempts.length;
    if (blocked) s.state.blockedUntil = Date.now() + 61_000;
    return result;
}

async function fillRegistration(s: Session) {
    await type(s, field(s, 'Username'), s.state.username);
    await type(s, field(s, 'Email address'), s.state.email);
    await type(s, field(s, 'Phone number'), '+420 777 123 456');
    await type(s, field(s, 'Birth date'), '1995-06-15');
    await type(s, field(s, 'Password'), s.state.password);
    await type(s, field(s, 'Confirm password'), s.state.password);
}

async function nativeInvalid(
    s: Session,
    input: Locator,
    name: string,
    value: string,
): Promise<Outcome> {
    await type(s, input, value);
    let requests = 0;
    const listener = (r: Response) => {
        if (
            ['POST', 'PATCH'].includes(r.request().method()) &&
            new URL(r.url()).origin === new URL(s.options.url).origin
        )
            requests++;
    };
    s.page.on('response', listener);
    try {
        await dialog(s).getByRole('button', { name, exact: true }).click();
        expect(
            await input.evaluate(
                (el) => (el as HTMLInputElement).validity.valid,
            ),
        ).toBe(false);
        await pause(s, 300, 600);
        expect(requests).toBe(0);
    } finally {
        s.page.off('response', listener);
    }
    return { outcome: 'blocked', detail: 'browser-form-validation' };
}

async function selectRandom(s: Session, name: string, includeAll = false) {
    const select = field(s, name);
    const choices = await select.locator('option').evaluateAll((els) =>
        els.map((el) => ({
            value: (el as HTMLOptionElement).value,
            label: el.textContent,
        })),
    );
    const eligible = includeAll ? choices : choices.slice(1);
    for (const selected of s.options.verify
        ? eligible
        : [s.rng.pick(eligible)]) {
        await select.selectOption(selected.value);
        await expect(select).toHaveValue(selected.value);
        s.log('choice', { field: name, selected });
        if (
            name === 'Sort games' &&
            ['name', 'name-desc'].includes(selected.value)
        ) {
            const names = await s.page
                .locator('.catalog-grid .game-info h3')
                .allTextContents();
            expect(names).toEqual(
                [...names].sort((a, b) =>
                    selected.value === 'name'
                        ? a.localeCompare(b)
                        : b.localeCompare(a),
                ),
            );
        }
    }
    await refresh(s);
}

export const actions: Record<string, (s: Session) => Promise<Outcome | void>> =
    {
        home: (s) => visit(s, 'lobby'),
        games: (s) => visit(s, 'games'),
        tournaments: (s) => visit(s, 'tournaments'),
        reload: async (s) => {
            await s.page.reload({ waitUntil: 'domcontentloaded' });
            await expect(
                s.page.getByRole('heading', { level: 1 }),
            ).toBeVisible();
            await expect(s.page.getByTestId('header-balance')).toHaveText(
                money(s.state.balance),
            );
            s.state.carousel = 0;
            await refresh(s);
        },
        category: async (s) => {
            const categories = s.page.locator('.catalog-categories button');
            if (s.options.verify) {
                for (const category of await categories.all()) {
                    await category.click();
                    await expect(
                        s.page.locator('.catalog-grid .game-card').first(),
                    ).toBeVisible();
                }
            } else await randomClick(s, categories);
            await refresh(s);
        },
        search: async (s) => {
            await button(s, 'Reset').click();
            const names = await s.page
                .locator('.game-info h3')
                .allTextContents();
            const query = s.rng.pick(names).split(' ')[0]!;
            await type(s, field(s, 'Search all games'), query);
            await expect(
                s.page.locator('.catalog-grid .game-card').first(),
            ).toBeVisible();
            await refresh(s);
        },
        'search-empty': async (s) => {
            await type(
                s,
                field(s, 'Search all games'),
                'no-island-matches-this-query',
            );
            await expect(
                s.page.getByRole('heading', { name: 'No islands in sight.' }),
            ).toBeVisible();
            await refresh(s);
            return {
                outcome: 'expected-error',
                detail: 'empty-search-results',
            };
        },
        'search-header': async (s) => {
            await type(s, field(s, 'Search games'), 'Golden');
            await expect(s.page).toHaveURL(/\/games$/);
            await expect(
                s.page.getByRole('heading', { level: 1 }),
            ).toContainText('A whole world of play');
            s.state.section = 'games';
            await refresh(s);
        },
        'clear-search': async (s) => {
            await button(s, 'Clear search').click();
            await refresh(s);
        },
        'provider-filter': (s) => selectRandom(s, 'Filter by provider'),
        'tag-filter': (s) => selectRandom(s, 'Filter by tag'),
        sort: (s) => selectRandom(s, 'Sort games', true),
        'reset-filters': async (s) => {
            await button(s, 'Reset').click();
            await expect(
                s.page.locator('.catalog-grid .game-card'),
            ).toHaveCount(24);
            await refresh(s);
        },
        'clear-filters': async (s) => {
            await button(s, 'Clear filters').click();
            await expect(
                s.page.locator('.catalog-grid .game-card'),
            ).toHaveCount(24);
            await refresh(s);
        },
        'load-more': async (s) => {
            const before = s.state.gameCount;
            await button(s, 'Discover more games').click();
            await refresh(s);
            expect(s.state.gameCount).toBeGreaterThan(before);
        },
        'provider-card': async (s) => {
            await randomClick(s, s.page.locator('.provider-card'));
            await expect(s.page).toHaveURL(/\/games$/);
            await expect(field(s, 'Filter by provider')).not.toHaveValue('all');
            s.state.section = 'games';
            await refresh(s);
        },
        'popular-next': async (s) => {
            await button(s, 'Next popular games').click();
            s.state.carousel = 6;
            await refresh(s);
        },
        'popular-previous': async (s) => {
            await button(s, 'Previous popular games').click();
            s.state.carousel = 0;
            await refresh(s);
        },
        favorite: async (s) => {
            const favorites = s.page.locator('.favorite-button');
            const target = favorites.nth(
                s.rng.int(0, (await favorites.count()) - 1),
            );
            const before = await target.getAttribute('aria-pressed');
            await target.click();
            await expect(target).toHaveAttribute(
                'aria-pressed',
                before === 'true' ? 'false' : 'true',
            );
        },
        scroll: async (s) => {
            await s.page.mouse.wheel(0, s.rng.int(-350, 1000));
            await pause(s, 600, 3000);
        },
        help: async (s) => {
            await menu(s);
            await button(s, 'How to play').click();
            await expect(s.page.locator('.toast-message')).toContainText(
                'Create an account',
            );
        },
        support: async (s) => {
            await menu(s);
            await button(s, 'Need a hand?').click();
            await expect(s.page.locator('.toast-message')).toContainText(
                'Need a hand?',
            );
        },
        social: async (s) => {
            await menu(s);
            await button(
                s,
                s.rng.pick([
                    'HERMIT community preview',
                    'HERMIT social preview',
                ]),
            ).click();
            await expect(s.page.locator('.toast-message')).toBeVisible();
        },
        'dismiss-notification': async (s) => {
            const dismiss = button(s, 'Dismiss notification');
            if (!(await dismiss.isVisible()))
                return {
                    outcome: 'abandoned',
                    detail: 'notification-auto-dismissed',
                };
            try {
                await dismiss.click({ timeout: 1000 });
            } catch (error) {
                if (await dismiss.isVisible()) throw error;
                return {
                    outcome: 'abandoned',
                    detail: 'notification-auto-dismissed',
                };
            }
            await expect(s.page.locator('.toast-message')).not.toBeVisible();
        },
        'open-login': (s) => open(s, 'login'),
        'open-register': (s) => open(s, 'register'),
        'switch-register': async (s) => {
            await button(s, 'Create an account').click();
            s.state.modal = 'register';
            await expect(dialog(s)).toContainText('Find your happy place.');
        },
        'switch-login': async (s) => {
            await dialog(s)
                .getByRole('button', { name: 'Log in', exact: true })
                .click();
            s.state.modal = 'login';
            await expect(dialog(s)).toContainText('Welcome back, explorer.');
        },
        remember: async (s) => {
            await field(s, 'Remember me').click();
            s.state.remember = await field(s, 'Remember me').isChecked();
        },
        'login-invalid': invalidLogin,
        'login-throttled': async (s) => {
            let result: Outcome = {};
            for (let i = s.state.loginFailures; i <= 5; i++)
                result = await invalidLogin(s);
            return result;
        },
        'login-browser-invalid': async (s) => {
            await fillLogin(s, false);
            return nativeInvalid(
                s,
                field(s, 'Email address'),
                'Log in',
                'not-an-email',
            );
        },
        login: async (s) => {
            await fillLogin(s, true);
            return submit(s, '/login', 'POST', 'Log in', 200);
        },
        register: async (s) => {
            await fillRegistration(s);
            return submit(s, '/register', 'POST', 'Create my account', 201);
        },
        'register-password-error': async (s) => {
            await fillRegistration(s);
            await type(
                s,
                field(s, 'Confirm password'),
                'DifferentPassword123!',
            );
            return submit(
                s,
                '/register',
                'POST',
                'Create my account',
                422,
                'The password field confirmation does not match.',
            );
        },
        'register-age-error': async (s) => {
            await fillRegistration(s);
            await type(
                s,
                field(s, 'Birth date'),
                `${new Date().getUTCFullYear() - 10}-01-01`,
            );
            return submit(
                s,
                '/register',
                'POST',
                'Create my account',
                422,
                'You must be at least 18 to create a preview account.',
            );
        },
        'register-phone-error': async (s) => {
            await fillRegistration(s);
            await type(s, field(s, 'Phone number'), 'telephone');
            return submit(
                s,
                '/register',
                'POST',
                'Create my account',
                422,
                'The phone field format is invalid.',
            );
        },
        'register-duplicate': async (s) => {
            await fillRegistration(s);
            return submit(
                s,
                '/register',
                'POST',
                'Create my account',
                422,
                'The email has already been taken.',
            );
        },
        'close-modal': (s) => close(s),
        'open-wallet': (s) => open(s, 'wallet'),
        'wallet-deposit': async (s) => {
            await button(s, 'Top up wallet').click();
            s.state.modal = 'cashier';
            s.state.tab = 'deposit';
            await expect(dialog(s)).toContainText('Your island cashier.');
        },
        'wallet-bonus': async (s) => {
            await button(s, 'Bonus code').click();
            s.state.modal = 'bonus';
            await expect(field(s, 'Bonus code')).toBeVisible();
        },
        'open-deposit': (s) => open(s, 'cashier'),
        'payment-method': async (s) => {
            const methods = s.page.locator('.payment-methods button');
            if (s.options.verify) {
                for (const method of await methods.all()) {
                    await method.click();
                    await expect(method).toHaveAttribute(
                        'aria-pressed',
                        'true',
                    );
                }
            } else await randomClick(s, methods);
            await expect(
                s.page.locator('.payment-methods button[aria-pressed="true"]'),
            ).toHaveCount(1);
        },
        'deposit-preset': async (s) => {
            const presets = s.page.locator('.amount-presets button');
            if (s.options.verify) {
                for (const preset of await presets.all()) {
                    const amount = (await preset.innerText())
                        .trim()
                        .split(' ')[0]!;
                    await preset.click();
                    await expect(field(s, 'Deposit amount')).toHaveValue(
                        amount,
                    );
                }
            } else await randomClick(s, presets);
        },
        deposit: async (s) => {
            const amount = s.rng.pick(['25', '50', '100', '250', '37.50']);
            await type(s, field(s, 'Deposit amount'), amount);
            const before = s.state.balance;
            const result = await submit(
                s,
                '/wallet/deposit',
                'POST',
                'Add demo credits',
                200,
            );
            expect(s.state.balance).toBe(
                before + Math.round(Number(amount) * 100),
            );
            return result;
        },
        'deposit-invalid': (s) =>
            nativeInvalid(
                s,
                field(s, 'Deposit amount'),
                'Add demo credits',
                s.rng.pick(['0', '10001', '1.001']),
            ),
        'withdraw-tab': async (s) => {
            await s.page
                .getByRole('tab', { name: 'Withdraw', exact: true })
                .click();
            s.state.tab = 'withdraw';
        },
        'deposit-tab': async (s) => {
            await s.page
                .getByRole('tab', { name: 'Deposit', exact: true })
                .click();
            s.state.tab = 'deposit';
        },
        withdraw: async (s) => {
            const cents = s.rng.int(100, Math.min(s.state.balance, 5000));
            await type(
                s,
                field(s, 'Withdrawal amount'),
                (cents / 100).toFixed(2),
            );
            const before = s.state.balance;
            const result = await submit(
                s,
                '/wallet/withdraw',
                'POST',
                'Withdraw demo credits',
                200,
            );
            expect(s.state.balance).toBe(before - cents);
            return result;
        },
        'withdraw-insufficient': async (s) => {
            await type(
                s,
                field(s, 'Withdrawal amount'),
                (s.state.balance / 100 + 1).toFixed(2),
            );
            return submit(
                s,
                '/wallet/withdraw',
                'POST',
                'Withdraw demo credits',
                422,
                insufficient,
            );
        },
        'withdraw-invalid': (s) =>
            nativeInvalid(
                s,
                field(s, 'Withdrawal amount'),
                'Withdraw demo credits',
                '0',
            ),
        'open-bonus': (s) => open(s, 'bonus'),
        'bonus-invalid': async (s) => {
            await type(s, field(s, 'Bonus code'), 'WRONGCODE');
            return submit(
                s,
                '/bonuses',
                'POST',
                'Redeem bonus',
                422,
                'That bonus code is invalid or expired. Try SHELL100.',
            );
        },
        bonus: async (s) => {
            const code = s.rng.pick(
                ['SHELL100', 'ISLAND50'].filter(
                    (code) => !s.state.redeemed.includes(code),
                ),
            );
            await type(s, field(s, 'Bonus code'), code);
            const before = s.state.balance;
            const result = await submit(
                s,
                '/bonuses',
                'POST',
                'Redeem bonus',
                200,
            );
            expect(s.state.balance).toBe(
                before + (code === 'SHELL100' ? 10000 : 5000),
            );
            s.state.redeemed.push(code);
            return result;
        },
        'bonus-duplicate': async (s) => {
            await type(s, field(s, 'Bonus code'), s.rng.pick(s.state.redeemed));
            return submit(
                s,
                '/bonuses',
                'POST',
                'Redeem bonus',
                422,
                'You have already redeemed this bonus code.',
            );
        },
        'open-game': (s) => open(s, 'game'),
        spin: async (s) => {
            const max = Math.min(s.state.balance, 10000);
            const amount = s.rng.pick(
                [10, 50, 100, 250, 500].filter((cents) => cents <= max),
            );
            await type(s, field(s, 'Bet amount'), (amount / 100).toFixed(2));
            return submit(s, /^\/games\/\d+\/spin$/, 'POST', 'Spin', 201);
        },
        'spin-insufficient': async (s) => {
            await type(
                s,
                field(s, 'Bet amount'),
                (Math.max(10, s.state.balance + 1) / 100).toFixed(2),
            );
            return submit(
                s,
                /^\/games\/\d+\/spin$/,
                'POST',
                'Spin',
                422,
                insufficient,
            );
        },
        'spin-invalid': (s) =>
            nativeInvalid(
                s,
                field(s, 'Bet amount'),
                'Spin',
                s.rng.pick(['0', '101', '0.001']),
            ),
        'open-profile': (s) => open(s, 'profile'),
        profile: async (s) => {
            await type(
                s,
                field(s, 'Display name'),
                s.rng.pick([
                    'Sunny Explorer',
                    'Island Wanderer',
                    'Lucky Shell',
                ]),
            );
            // Keep returning-login credentials synchronized after an email edit.
            const email = s.state.email.startsWith('updated-')
                ? s.state.email
                : `updated-${s.state.email}`;
            await type(s, field(s, 'Email address'), email);
            await type(s, field(s, 'Phone number'), '+420 777 444 555');
            const result = await submit(
                s,
                '/profile',
                'PATCH',
                'Save changes',
                200,
            );
            await identify(s);
            return result;
        },
        'profile-invalid': async (s) => {
            await type(s, field(s, 'Phone number'), 'telephone');
            return submit(
                s,
                '/profile',
                'PATCH',
                'Save changes',
                422,
                'The phone field format is invalid.',
            );
        },
        logout: (s) => submit(s, '/logout', 'POST', 'Log out', 200),
        'join-tournament': async (s) => {
            if (!s.state.userId) {
                await randomClick(s, button(s, 'Join the adventure'));
                await expect(dialog(s)).toContainText(
                    'Welcome back, explorer.',
                );
                s.state.modal = 'login';
                return {
                    outcome: 'blocked',
                    detail: 'guest-tournament-login-gate',
                };
            }
            const reply = s.page.waitForResponse(
                (r) =>
                    /\/tournaments\/\d+\/join$/.test(
                        new URL(r.url()).pathname,
                    ) && r.request().method() === 'POST',
            );
            await Promise.all([
                randomClick(s, button(s, 'Join the adventure')),
                reply.then((r) => expect(r.status()).toBe(302)),
            ]);
            await expect(
                button(s, 'You’re on the list').first(),
            ).toBeDisabled();
            await refresh(s);
        },
        end: async () => {},
    };
