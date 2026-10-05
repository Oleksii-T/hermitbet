import type { Page } from '@playwright/test';
import type { Options, Persona, Random } from './core.js';

export type Modal =
    | 'login'
    | 'register'
    | 'cashier'
    | 'wallet'
    | 'bonus'
    | 'game'
    | 'profile'
    | null;
export type State = {
    section: 'lobby' | 'games' | 'tournaments';
    modal: Modal;
    tab: 'deposit' | 'withdraw';
    userId: number | null;
    balance: number;
    hasAccount: boolean;
    email: string;
    username: string;
    password: string;
    redeemed: string[];
    loginFailures: number;
    loginAttempts: number[];
    blockedUntil: number;
    remember: boolean;
    gameCount: number;
    canLoadMore: boolean;
    joinable: number;
    carousel: number;
    toast: boolean;
    hasSearch: boolean;
};
export type Outcome = {
    outcome?: 'success' | 'expected-error' | 'blocked' | 'abandoned';
    detail?: string;
    status?: number;
};
export type Session = {
    page: Page;
    rng: Random;
    state: State;
    options: Options;
    persona: Persona;
    mobile: boolean;
    step: number;
    stopped: () => boolean;
    log: (event: string, data?: Record<string, unknown>) => void;
};
export type Edge = {
    to: string;
    weight: number;
    personas?: Partial<Record<Persona, number>>;
};
export type Node = {
    id: string;
    available: (session: Session) => boolean;
    run: (session: Session) => Promise<Outcome | void>;
    edges: Edge[];
    retries: number;
    amount: readonly [number, number];
};

export type BrowserAnalytics = {
    __loaded?: boolean;
    register: (properties: Record<string, unknown>) => void;
    identify: (id: string, properties: Record<string, unknown>) => void;
    reset: () => void;
    capture: (
        event: string,
        properties: Record<string, unknown>,
        options?: Record<string, unknown>,
    ) => { uuid: string } | undefined;
};
export type SimulationWindow = Window & {
    posthog?: BrowserAnalytics;
    __hermitSimulation?: Record<string, unknown>;
};
