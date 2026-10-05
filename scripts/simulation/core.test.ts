import { test } from 'node:test';
import assert from 'node:assert/strict';
import { options, pool, Random } from './core.js';
import { candidates, graph, validateGraph, verificationPath } from './graph.js';
import { isIngestion, isPostHog } from './analytics.js';
import type { Session } from './types.js';

void test('seeded choices reproduce and weighted sampling follows probabilities', () => {
    const a = new Random('same-seed');
    const b = new Random('same-seed');
    assert.deepEqual(
        Array.from({ length: 100 }, () => a.next()),
        Array.from({ length: 100 }, () => b.next()),
    );
    assert.notEqual(new Random('one').next(), new Random('two').next());
    const rng = new Random('distribution');
    let heavy = 0;
    for (let i = 0; i < 10000; i++) {
        if (
            rng.weighted([
                { value: 'light', weight: 1 },
                { value: 'heavy', weight: 3 },
            ]) === 'heavy'
        )
            heavy++;
        const amount = rng.int(1, 4);
        assert.ok(amount >= 1 && amount <= 4);
    }
    assert.ok(heavy > 7200 && heavy < 7800, `Heavy selection count ${heavy}`);
    assert.throws(() => rng.weighted([{ value: 'bad', weight: 0 }]));
    assert.throws(() => rng.weighted([]));
});

void test('CLI rejects invalid limits, ranges, URLs and unknown arguments', () => {
    for (const args of [
        ['--workers', '0'],
        ['--iterations', '1.2'],
        ['--limit', '-1'],
        ['--limit', 'NaN'],
        ['--speed', '-1'],
        ['--min-steps', '61'],
        ['--url', 'file:///tmp'],
        ['--analytics', 'mock'],
        ['--workes', '2'],
    ])
        assert.throws(() => options(args));
    const result = options([
        '--workers=3',
        '--iterations',
        '8',
        '--limit',
        '0.1',
        '--speed',
        '0',
    ]);
    assert.equal(result.workers, 3);
    assert.equal(result.iterations, 8);
    assert.equal(result.limit, 0.1);
    assert.equal(result.speed, 0);
});

void test('pool honors global iterations, concurrency and cancellation', async () => {
    let active = 0;
    let peak = 0;
    const visited: number[] = [];
    await pool(
        17,
        3,
        () => false,
        async (index) => {
            active++;
            peak = Math.max(peak, active);
            visited.push(index);
            await new Promise((resolve) => setTimeout(resolve, 2));
            active--;
        },
    );
    assert.equal(peak, 3);
    assert.deepEqual(
        visited.sort((a, b) => a - b),
        Array.from({ length: 17 }, (_, i) => i),
    );
    let stopped = false;
    let jobs = 0;
    await pool(
        100,
        1,
        () => stopped,
        async () => {
            jobs++;
            stopped = true;
        },
    );
    assert.equal(jobs, 1);
});

void test('graph rejects broken links and unsafe execution bounds', () => {
    validateGraph();
    assert.throws(
        () => validateGraph({ broken: { ...graph.home!, id: 'broken' } }),
        /Unknown edge/,
    );
    assert.throws(
        () =>
            validateGraph({ ...graph, home: { ...graph.home!, retries: -1 } }),
        /Invalid execution/,
    );
    assert.throws(
        () =>
            validateGraph({
                ...graph,
                home: { ...graph.home!, edges: [{ to: 'end', weight: -1 }] },
            }),
        /Invalid weight/,
    );
    assert.ok(
        Object.keys(graph).every(
            (id) => verificationPath.includes(id) || id === 'search-header',
        ),
    );
});

void test('state guards allow recovery without impossible actions or funds', () => {
    const s: Session = {
        state: {
            modal: null,
            section: 'lobby',
            userId: null,
            balance: 0,
            hasAccount: false,
            gameCount: 12,
            carousel: 0,
            redeemed: [],
            loginFailures: 0,
            loginAttempts: [],
            blockedUntil: 0,
            tab: 'deposit',
            email: 'test@example.test',
            username: 'test',
            password: 'test-password',
            remember: false,
            canLoadMore: false,
            joinable: 0,
            toast: false,
            hasSearch: false,
        },
        options: options([]),
        persona: 'explorer',
        mobile: false,
        step: 0,
        page: {} as Session['page'],
        rng: new Random('guards'),
        stopped: () => false,
        log: () => {},
    };
    const next = () => candidates(graph.arrival!, s).map((edge) => edge.value);
    assert.ok(next().includes('open-game'));
    assert.ok(!next().includes('spin'));
    assert.ok(!next().includes('open-deposit'));
    assert.ok(!next().includes('end'));
    s.state.modal = 'login';
    assert.ok(next().includes('login-invalid'));
    assert.ok(!next().includes('login'));
    s.state.hasAccount = true;
    assert.ok(next().includes('login'));
    s.state.loginFailures = 5;
    assert.ok(!next().includes('login'));
    s.state.modal = 'game';
    s.state.userId = 1;
    assert.ok(next().includes('spin-insufficient'));
    assert.ok(!next().includes('spin'));
    s.state.balance = 10000;
    assert.ok(next().includes('spin'));
    assert.ok(!next().includes('spin-insufficient'));
    s.state.modal = 'cashier';
    s.state.tab = 'withdraw';
    s.state.balance = 0;
    assert.ok(next().includes('withdraw-insufficient'));
    assert.ok(!next().includes('withdraw'));
    assert.ok(next().includes('deposit-tab'));
    s.step = 20;
    assert.ok(next().includes('end'));
});

void test('analytics counts ingestion rather than SDK or flag downloads', () => {
    assert.ok(isIngestion('https://us.i.posthog.com/i/v0/e/?ip=1'));
    assert.ok(isIngestion('https://eu.i.posthog.com/e/'));
    assert.ok(isPostHog('https://us-assets.i.posthog.com/static/array.js'));
    assert.ok(!isIngestion('https://us-assets.i.posthog.com/static/array.js'));
    assert.ok(!isIngestion('https://us.i.posthog.com/flags/'));
    assert.ok(!isIngestion('https://posthog.com.example.test/e/'));
});
