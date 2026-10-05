import type { Page, Request, Response } from '@playwright/test';
import type { Options } from './core.js';
import type { SimulationWindow } from './types.js';

export type AnalyticsStats = {
    attempted: number;
    accepted: number;
    failed: number;
    unconfirmed: number;
    sdkLoaded: boolean;
};
export const isPostHog = (url: string) =>
    /(^|\.)posthog\.com$/.test(new URL(url).hostname);
export const isIngestion = (url: string) =>
    isPostHog(url) && /^\/(i\/v\d+\/e|e|batch)\/?$/.test(new URL(url).pathname);

export function observeAnalytics(
    page: Page,
    log: (event: string, data?: Record<string, unknown>) => void,
) {
    const stats: AnalyticsStats = {
        attempted: 0,
        accepted: 0,
        failed: 0,
        unconfirmed: 0,
        sdkLoaded: false,
    };
    let documentEpoch = 0;
    page.on('domcontentloaded', () => {
        documentEpoch++;
    });
    const pending = new Map<Request, number>();
    page.on('request', (request) => {
        if (isIngestion(request.url())) {
            stats.attempted++;
            pending.set(request, documentEpoch);
        }
    });
    page.on('response', (response: Response) => {
        if (!isIngestion(response.url())) return;
        pending.delete(response.request());
        if (response.ok()) stats.accepted++;
        else stats.failed++;
        log('analytics-delivery', {
            status: response.status(),
            accepted: response.ok(),
        });
    });
    page.on('requestfailed', (request) => {
        if (!isIngestion(request.url())) return;
        pending.delete(request);
        stats.failed++;
        log('analytics-delivery', {
            accepted: false,
            error: request.failure()?.errorText,
        });
    });
    return {
        stats,
        pending,
        get documentEpoch() {
            return documentEpoch;
        },
        log,
    };
}

export async function ready(
    page: Page,
    mode: Options['analytics'],
    stats: AnalyticsStats,
) {
    if (mode === 'off') return;
    try {
        await page.waitForFunction(
            () => Boolean((window as SimulationWindow).posthog?.__loaded),
            undefined,
            { timeout: mode === 'required' ? 12000 : 3000 },
        );
        stats.sdkLoaded = true;
    } catch {
        if (mode === 'required')
            throw new Error(
                'PostHog SDK did not load. Check network/project settings, or use --analytics off for offline verification.',
            );
    }
}

export async function capture(
    page: Page,
    mode: Options['analytics'],
    event: string,
    properties: Record<string, unknown>,
) {
    if (mode === 'off') return;
    if (mode === 'required')
        await page.waitForFunction(
            () => Boolean((window as SimulationWindow).posthog?.__loaded),
            undefined,
            { timeout: 12000 },
        );
    const captured = await page.evaluate(
        ({ event, properties }) => {
            const w = window as SimulationWindow;
            if (w.posthog?.__loaded)
                return Boolean(
                    w.posthog.capture(event, properties, {
                        send_instantly: true,
                        transport: 'XHR',
                    }),
                );
            return false;
        },
        { event, properties },
    );
    if (!captured && mode === 'required')
        throw new Error(
            `PostHog refused ${event}; check consent, bot filtering, or client rate limits.`,
        );
}

export async function drain(
    page: Page,
    mode: Options['analytics'],
    observer: ReturnType<typeof observeAnalytics>,
) {
    if (mode === 'off') return;
    const until = Date.now() + 15000;
    const currentPending = () =>
        [...observer.pending].filter(
            ([request, epoch]) =>
                epoch === observer.documentEpoch &&
                request.resourceType() !== 'ping',
        ).length;
    // Allow transport to start, then wait for pending ingestion acknowledgements.
    await page.waitForTimeout(300);
    while (
        (currentPending() || observer.stats.accepted === 0) &&
        Date.now() < until
    )
        await page.waitForTimeout(100);
    const unconfirmed = [...observer.pending].filter(
        ([request, epoch]) =>
            epoch < observer.documentEpoch || request.resourceType() === 'ping',
    );
    observer.stats.unconfirmed = unconfirmed.length;
    for (const [request, epoch] of observer.pending)
        observer.log('analytics-unconfirmed', {
            type: request.resourceType(),
            previousDocument: epoch < observer.documentEpoch,
        });
    if (
        mode === 'required' &&
        (!observer.stats.sdkLoaded ||
            observer.stats.accepted === 0 ||
            observer.stats.failed > 0 ||
            observer.pending.size > unconfirmed.length)
    ) {
        throw new Error(
            `PostHog delivery incomplete: ${JSON.stringify(observer.stats)}, pending=${observer.pending.size}`,
        );
    }
}
