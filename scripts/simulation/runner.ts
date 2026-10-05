import { chromium, devices, type Browser } from '@playwright/test';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Random, personas, pool, type Options } from './core.js';
import { candidates, graph, validateGraph, verificationPath } from './graph.js';
import { pause, refresh } from './actions.js';
import {
    capture,
    drain,
    isPostHog,
    observeAnalytics,
    ready,
    type AnalyticsStats,
} from './analytics.js';
import type { Session } from './types.js';

type Result = {
    iteration: number;
    worker: number;
    persona: string;
    mobile: boolean;
    status: 'completed' | 'failed' | 'interrupted';
    steps: number;
    analytics: AnalyticsStats;
    error?: string;
};
const message = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

export async function run(options: Options) {
    validateGraph();
    const startedAt = Number(process.env.SIMULATION_STARTED_AT ?? Date.now());
    const runId = `${new Date(startedAt).toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
    const dir = resolve(options.logDir, runId);
    mkdirSync(dir, { recursive: true });
    const logPath = resolve(dir, 'events.jsonl');
    const summaryPath = resolve(dir, 'summary.json');
    const results: Result[] = [];
    const counts: Record<string, number> = {};
    const outcomes: Record<string, number> = {};
    const coverage = new Set<string>();
    let stopReason: 'deadline' | 'SIGINT' | 'SIGTERM' | null = null;
    let browser: Browser | undefined;
    let started = 0;
    let fatal: string | undefined;
    let signalWatchdog: ReturnType<typeof setTimeout> | undefined;
    const total = options.verify ? 2 : options.iterations;
    const log = (event: string, data: Record<string, unknown> = {}) =>
        appendFileSync(
            logPath,
            JSON.stringify({
                time: new Date().toISOString(),
                runId,
                event,
                ...data,
            }) + '\n',
        );
    const summary = () => ({
        runId,
        seed: options.seed,
        baseURL: options.url,
        verify: options.verify,
        analyticsMode: options.analytics,
        startedAt: new Date(startedAt).toISOString(),
        durationSeconds: (Date.now() - startedAt) / 1000,
        requested: total,
        started,
        completed: results.filter((r) => r.status === 'completed').length,
        failed: results.filter((r) => r.status === 'failed').length,
        interrupted: results.filter((r) => r.status === 'interrupted').length,
        notStarted: total - started,
        inFlight: started - results.length,
        stopReason,
        fatal,
        actionCounts: counts,
        outcomes,
        coveredActions: [...coverage].sort(),
        uncoveredActions: Object.keys(graph).filter((id) => !coverage.has(id)),
        results,
    });
    const save = () =>
        writeFileSync(summaryPath, JSON.stringify(summary(), null, 2) + '\n');
    const stop = (reason: NonNullable<typeof stopReason>) => {
        if (stopReason) return;
        stopReason = reason;
        log('stop', { reason });
        save();
        void browser?.close({ reason }).catch(() => {});
        if (reason !== 'deadline')
            signalWatchdog = setTimeout(() => {
                save();
                process.exit(reason === 'SIGINT' ? 130 : 143);
            }, 2000);
    };
    const onInterrupt = () => stop('SIGINT');
    const onTerminate = () => stop('SIGTERM');
    process.on('SIGINT', onInterrupt);
    process.on('SIGTERM', onTerminate);
    const budgetRemaining = Math.max(
        1,
        startedAt + options.limit * 60000 - Date.now(),
    );
    // Reserve up to one second for context teardown; the second watchdog is a
    // hard process deadline even if Chromium launch/close becomes unresponsive.
    const deadline = setTimeout(
        () => stop('deadline'),
        Math.max(1, budgetRemaining - Math.min(1000, budgetRemaining / 5)),
    );
    const watchdog = setTimeout(() => {
        stop('deadline');
        save();
        console.error(`Time limit reached. Partial summary: ${summaryPath}`);
        process.exit(2);
    }, budgetRemaining);
    console.log(`Simulation ${runId}\nSeed: ${options.seed}\nLogs: ${dir}`);
    log('run-start', { options, total });
    try {
        browser = await chromium.launch({
            headless: !options.headed,
            timeout: Math.min(30000, budgetRemaining),
        });
        if (stopReason) return summary();
        await pool(
            total,
            options.workers,
            () => Boolean(stopReason),
            async (index, worker) => {
                if (stopReason) return;
                started++;
                const rng = new Random(`${options.seed}:${index}`);
                const persona = options.verify
                    ? 'explorer'
                    : rng.weighted(
                          personas.map((value) => ({
                              value,
                              weight:
                                  value === 'frustrated'
                                      ? 1
                                      : value === 'player'
                                        ? 4
                                        : 3,
                          })),
                      );
                const mobile = options.verify ? index === 1 : rng.next() < 0.3;
                const context = await browser!.newContext({
                    baseURL: options.url,
                    ...(mobile
                        ? devices['iPhone 13']
                        : {
                              viewport: rng.pick([
                                  { width: 1440, height: 1000 },
                                  { width: 1280, height: 900 },
                                  { width: 1920, height: 1080 },
                              ]),
                          }),
                    locale: rng.pick(['en-US', 'en-GB']),
                    timezoneId: 'Europe/Prague',
                });
                const sessionLog = (
                    event: string,
                    data: Record<string, unknown> = {},
                ) =>
                    log(event, {
                        iteration: index + 1,
                        worker: worker + 1,
                        ...data,
                    });
                const metadata = {
                    simulation: true,
                    simulation_run_id: runId,
                    simulation_iteration: index + 1,
                    simulation_persona: persona,
                    simulation_seed: options.seed,
                };
                await context.addInitScript((data) => {
                    (
                        window as Window & {
                            __hermitSimulation?: Record<string, unknown>;
                        }
                    ).__hermitSimulation = data;
                }, metadata);
                if (options.analytics === 'off')
                    await context.route(
                        (url) => isPostHog(url.toString()),
                        (route) => route.abort(),
                    );
                const page = await context.newPage();
                page.setDefaultTimeout(10000);
                page.setDefaultNavigationTimeout(15000);
                const runtimeErrors: string[] = [];
                page.on('pageerror', (error) => {
                    runtimeErrors.push(error.message);
                    sessionLog('page-error', { error: error.message });
                });
                page.on('response', (response) => {
                    if (
                        new URL(response.url()).origin ===
                            new URL(options.url).origin &&
                        response.status() >= 400
                    ) {
                        sessionLog('http-error', {
                            path: new URL(response.url()).pathname,
                            status: response.status(),
                        });
                    }
                });
                const observer = observeAnalytics(page, sessionLog);
                const username = `sim_${runId.slice(-8)}_${index + 1}`;
                const s: Session = {
                    page,
                    rng,
                    options,
                    persona,
                    mobile,
                    step: 0,
                    stopped: () => Boolean(stopReason),
                    log: sessionLog,
                    state: {
                        section: 'lobby',
                        modal: null,
                        tab: 'deposit',
                        userId: null,
                        balance: 0,
                        hasAccount: false,
                        username,
                        email: `${username}@example.test`,
                        password: `Island-${randomUUID()}!`,
                        redeemed: [],
                        loginFailures: 0,
                        loginAttempts: [],
                        blockedUntil: 0,
                        remember: false,
                        gameCount: 0,
                        canLoadMore: false,
                        joinable: 0,
                        carousel: 0,
                        toast: false,
                        hasSearch: false,
                    },
                };
                const result: Result = {
                    iteration: index + 1,
                    worker: worker + 1,
                    persona,
                    mobile,
                    status: 'completed',
                    steps: 0,
                    analytics: observer.stats,
                };
                sessionLog('session-start', {
                    persona,
                    mobile,
                    email: s.state.email,
                });
                await context.tracing.start({
                    screenshots: true,
                    snapshots: true,
                });
                let currentAction = 'arrival';
                try {
                    let id = 'arrival';
                    const path = options.verify ? [...verificationPath] : null;
                    // Header search is hidden on mobile; verify it on desktop only.
                    if (path && !mobile)
                        path.splice(
                            path.indexOf('search'),
                            0,
                            'search-header',
                            'reset-filters',
                        );
                    const maxSteps = path
                        ? path.length
                        : rng.int(options.minSteps, options.maxSteps);
                    while (!stopReason && s.step < maxSteps) {
                        if (path) id = path[s.step]!;
                        currentAction = id;
                        const node = graph[id]!;
                        if (!node.available(s) && id !== 'end')
                            throw new Error(
                                `Invalid transition to ${id}: ${JSON.stringify({ modal: s.state.modal, section: s.state.section, balance: s.state.balance })}`,
                            );
                        // Support/help can leave the mobile drawer open.
                        if (
                            mobile &&
                            (await page.locator('.sidebar.mobile-open').count())
                        )
                            await page
                                .getByRole('button', {
                                    name: 'Toggle menu',
                                    exact: true,
                                })
                                .click();
                        const amount = path ? 1 : rng.int(...node.amount);
                        for (
                            let repetition = 0;
                            repetition < amount && s.step < maxSteps;
                            repetition++
                        ) {
                            if (stopReason) break;
                            if (repetition && !node.available(s)) break;
                            s.step++;
                            const stepStarted = Date.now();
                            sessionLog('action-start', {
                                step: s.step,
                                action: id,
                                repetition: repetition + 1,
                            });
                            let completed = false;
                            for (
                                let attempt = 0;
                                attempt <= node.retries;
                                attempt++
                            ) {
                                try {
                                    const reply = await node.run(s);
                                    if (id === 'arrival') {
                                        await ready(
                                            page,
                                            options.analytics,
                                            observer.stats,
                                        );
                                        await capture(
                                            page,
                                            options.analytics,
                                            'simulation_session_started',
                                            { persona, mobile },
                                        );
                                    }
                                    await refresh(s);
                                    const outcome = reply?.outcome ?? 'success';
                                    counts[id] = (counts[id] ?? 0) + 1;
                                    outcomes[outcome] =
                                        (outcomes[outcome] ?? 0) + 1;
                                    coverage.add(id);
                                    const properties = {
                                        action: id,
                                        outcome,
                                        step: s.step,
                                        detail: reply?.detail,
                                        http_status: reply?.status,
                                        section: s.state.section,
                                        modal: s.state.modal,
                                        authenticated: Boolean(s.state.userId),
                                        balance: s.state.balance / 100,
                                        duration_ms: Date.now() - stepStarted,
                                    };
                                    sessionLog('action-end', properties);
                                    await capture(
                                        page,
                                        options.analytics,
                                        'simulation_action',
                                        properties,
                                    );
                                    completed = true;
                                    break;
                                } catch (error) {
                                    if (stopReason || attempt === node.retries)
                                        throw error;
                                    sessionLog('action-retry', {
                                        action: id,
                                        attempt: attempt + 1,
                                        error: message(error),
                                    });
                                    await pause(s, 500, 1000);
                                }
                            }
                            if (!completed)
                                throw new Error(
                                    `Action ${id} did not complete`,
                                );
                            if (runtimeErrors.length)
                                throw new Error(
                                    `Browser errors: ${runtimeErrors.join('; ')}`,
                                );
                            if (id !== 'end') await pause(s);
                        }
                        if (id === 'end') break;
                        if (!path) {
                            const edges = candidates(node, s);
                            if (!edges.length)
                                throw new Error(`No eligible edges from ${id}`);
                            const next = rng.weighted(edges);
                            sessionLog('transition', {
                                from: id,
                                to: next,
                                candidates: edges,
                            });
                            id = next;
                        }
                    }
                    if (stopReason) throw new Error('Simulation interrupted');
                    await capture(
                        page,
                        options.analytics,
                        'simulation_session_finished',
                        {
                            steps: s.step,
                            authenticated: Boolean(s.state.userId),
                        },
                    );
                    await drain(page, options.analytics, observer);
                } catch (error) {
                    result.status = stopReason ? 'interrupted' : 'failed';
                    result.error = message(error).replaceAll(
                        s.state.password,
                        '[REDACTED]',
                    );
                    sessionLog('session-error', {
                        action: currentAction,
                        error: result.error,
                        status: result.status,
                    });
                    if (!stopReason) {
                        outcomes['unexpected-error'] =
                            (outcomes['unexpected-error'] ?? 0) + 1;
                        await page
                            .screenshot({
                                path: resolve(
                                    dir,
                                    `session-${index + 1}-failure.png`,
                                ),
                                fullPage: true,
                                timeout: 3000,
                            })
                            .catch(() => {});
                        await context.tracing
                            .stop({
                                path: resolve(
                                    dir,
                                    `session-${index + 1}-trace.zip`,
                                ),
                            })
                            .catch(() => {});
                    }
                } finally {
                    result.steps = s.step;
                    results.push(result);
                    sessionLog('session-end', { ...result });
                    save();
                    console.log(
                        `Visit ${index + 1}/${total}: ${result.status}, ${s.step} actions, ${persona}, ${mobile ? 'mobile' : 'desktop'}, PostHog accepted=${observer.stats.accepted}`,
                    );
                    await context.tracing.stop().catch(() => {});
                    await context.close().catch(() => {});
                }
            },
        );
    } catch (error) {
        if (!stopReason) {
            fatal = message(error);
            log('run-error', { error: fatal });
        }
    } finally {
        await browser?.close().catch(() => {});
        clearTimeout(deadline);
        clearTimeout(watchdog);
        clearTimeout(signalWatchdog);
        process.off('SIGINT', onInterrupt);
        process.off('SIGTERM', onTerminate);
        save();
        log('run-end', summary());
        console.log(`Summary: ${summaryPath}`);
        process.exitCode =
            stopReason === 'deadline'
                ? 2
                : stopReason === 'SIGINT'
                  ? 130
                  : stopReason === 'SIGTERM'
                    ? 143
                    : fatal || results.some((r) => r.status === 'failed')
                      ? 1
                      : 0;
    }
    return summary();
}
