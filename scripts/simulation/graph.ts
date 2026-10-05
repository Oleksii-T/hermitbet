import { actions, visit } from './actions.js';
import type { Edge, Node, Session } from './types.js';

const outside = (s: Session) => s.state.modal === null;
const catalog = (s: Session) => outside(s) && s.state.section === 'games';
const lobby = (s: Session) => outside(s) && s.state.section === 'lobby';
const modal = (name: string) => (s: Session) => s.state.modal === name;
const cashier = (tab: string) => (s: Session) =>
    s.state.modal === 'cashier' && s.state.tab === tab;
const guest = (s: Session) => outside(s) && !s.state.userId;

// Default incoming weights and guards. Nodes link to eligible actions; the
// preferred continuations and persona multipliers below vary the journeys.
const definitions: [string, number, (s: Session) => boolean][] = [
    ['home', 3, (s) => outside(s) && s.state.section !== 'lobby'],
    ['games', 10, (s) => outside(s) && s.state.section !== 'games'],
    ['tournaments', 4, (s) => outside(s) && s.state.section !== 'tournaments'],
    ['reload', 1, outside],
    ['category', 5, catalog],
    ['search', 6, catalog],
    ['search-empty', 1, catalog],
    ['search-header', 3, (s) => outside(s) && !s.mobile],
    ['clear-search', 3, (s) => catalog(s) && s.state.hasSearch],
    ['provider-filter', 4, catalog],
    ['tag-filter', 3, catalog],
    ['sort', 3, catalog],
    ['reset-filters', 4, catalog],
    ['clear-filters', 6, (s) => catalog(s) && s.state.gameCount === 0],
    ['load-more', 5, (s) => catalog(s) && s.state.canLoadMore],
    ['provider-card', 3, outside],
    ['popular-next', 4, (s) => lobby(s) && s.state.carousel === 0],
    ['popular-previous', 2, (s) => lobby(s) && s.state.carousel === 6],
    ['favorite', 3, (s) => outside(s) && s.state.gameCount > 0],
    ['scroll', 7, outside],
    ['help', 2, outside],
    ['support', 1, outside],
    ['social', 1, outside],
    ['dismiss-notification', 2, (s) => outside(s) && s.state.toast],
    ['open-login', 6, guest],
    ['open-register', 7, guest],
    ['switch-register', 6, modal('login')],
    ['switch-login', 3, modal('register')],
    ['remember', 2, modal('login')],
    ['login-invalid', 3, modal('login')],
    [
        'login-throttled',
        0.3,
        (s) => modal('login')(s) && s.state.loginFailures < 6,
    ],
    ['login-browser-invalid', 1, modal('login')],
    [
        'login',
        14,
        (s) =>
            modal('login')(s) &&
            s.state.hasAccount &&
            s.state.loginFailures < 5 &&
            Date.now() >= s.state.blockedUntil,
    ],
    ['register', 15, (s) => modal('register')(s) && !s.state.hasAccount],
    [
        'register-password-error',
        2,
        (s) => modal('register')(s) && !s.state.hasAccount,
    ],
    [
        'register-age-error',
        0.5,
        (s) => modal('register')(s) && !s.state.hasAccount,
    ],
    [
        'register-phone-error',
        1,
        (s) => modal('register')(s) && !s.state.hasAccount,
    ],
    [
        'register-duplicate',
        1,
        (s) => modal('register')(s) && s.state.hasAccount,
    ],
    ['close-modal', 6, (s) => s.state.modal !== null],
    ['open-wallet', 4, outside],
    ['wallet-deposit', 10, modal('wallet')],
    ['wallet-bonus', 6, modal('wallet')],
    ['open-deposit', 7, (s) => outside(s) && !!s.state.userId],
    ['payment-method', 5, cashier('deposit')],
    ['deposit-preset', 4, cashier('deposit')],
    ['deposit', 10, cashier('deposit')],
    ['deposit-invalid', 1, cashier('deposit')],
    ['withdraw-tab', 3, cashier('deposit')],
    ['deposit-tab', 4, cashier('withdraw')],
    ['withdraw', 7, (s) => cashier('withdraw')(s) && s.state.balance >= 100],
    [
        'withdraw-insufficient',
        2,
        (s) => cashier('withdraw')(s) && s.state.balance <= 999900,
    ],
    ['withdraw-invalid', 1, cashier('withdraw')],
    ['open-bonus', 5, outside],
    ['bonus-invalid', 2, modal('bonus')],
    ['bonus', 12, (s) => modal('bonus')(s) && s.state.redeemed.length < 2],
    [
        'bonus-duplicate',
        2,
        (s) => modal('bonus')(s) && s.state.redeemed.length > 0,
    ],
    ['open-game', 12, (s) => outside(s) && s.state.gameCount > 0],
    ['spin', 18, (s) => modal('game')(s) && s.state.balance >= 10],
    [
        'spin-insufficient',
        8,
        (s) => modal('game')(s) && s.state.balance < 10000,
    ],
    ['spin-invalid', 1, modal('game')],
    ['open-profile', 3, (s) => outside(s) && !!s.state.userId],
    ['profile', 5, modal('profile')],
    ['profile-invalid', 1, modal('profile')],
    ['logout', 3, modal('profile')],
    [
        'join-tournament',
        9,
        (s) =>
            outside(s) &&
            s.state.section === 'tournaments' &&
            s.state.joinable > 0,
    ],
    ['end', 4, (s) => s.step >= s.options.minSteps],
];

const personaWeights: Record<string, Edge['personas']> = {
    games: { explorer: 2 },
    category: { explorer: 2 },
    search: { explorer: 2 },
    'provider-filter': { explorer: 2 },
    'tag-filter': { explorer: 2 },
    scroll: { explorer: 2, cautious: 2 },
    'open-game': { player: 3 },
    spin: { player: 3 },
    'open-deposit': { player: 2 },
    deposit: { player: 2, cautious: 0.3 },
    'open-bonus': { 'bonus-hunter': 4 },
    bonus: { 'bonus-hunter': 3 },
    'wallet-bonus': { 'bonus-hunter': 3 },
    help: { cautious: 4 },
    'open-wallet': { cautious: 2 },
    'close-modal': { cautious: 2 },
    'login-invalid': { frustrated: 4 },
    'login-throttled': { frustrated: 8 },
    'search-empty': { frustrated: 3 },
    'bonus-invalid': { frustrated: 4 },
    'withdraw-insufficient': { frustrated: 3 },
    'register-password-error': { frustrated: 3 },
    'spin-insufficient': { frustrated: 3 },
};

const preferred: Record<string, string[]> = {
    'search-empty': ['clear-filters', 'search'],
    'login-invalid': ['login', 'switch-register', 'close-modal'],
    'login-throttled': ['close-modal'],
    'register-password-error': ['register'],
    'register-age-error': ['register'],
    'register-phone-error': ['register'],
    register: ['open-game', 'open-bonus', 'open-deposit'],
    login: ['open-game', 'open-wallet'],
    'payment-method': ['deposit-preset', 'deposit'],
    'deposit-preset': ['deposit'],
    deposit: ['close-modal'],
    'spin-insufficient': ['close-modal'],
    spin: ['spin', 'close-modal'],
    bonus: ['close-modal', 'bonus-duplicate'],
    'bonus-invalid': ['bonus', 'close-modal'],
    'withdraw-insufficient': ['deposit-tab', 'close-modal'],
    logout: ['open-login', 'end'],
};

export const graph: Record<string, Node> = Object.fromEntries(
    definitions.map(([id, , available]) => [
        id,
        {
            id,
            available,
            run: actions[id]!,
            // Never replay an ambiguous financial/auth mutation.
            retries: ['home', 'games', 'tournaments', 'reload'].includes(id)
                ? 1
                : 0,
            amount: id === 'scroll' ? [1, 3] : id === 'spin' ? [1, 4] : [1, 1],
            edges: definitions.map(([to, weight]) => ({
                to,
                weight: weight * (preferred[id]?.includes(to) ? 3 : 1),
                personas: personaWeights[to],
            })),
        } satisfies Node,
    ]),
);

graph.arrival = {
    id: 'arrival',
    available: () => true,
    run: (s) => visit(s, 'lobby', true),
    retries: 1,
    amount: [1, 1],
    edges: graph.home!.edges,
};

export function candidates(
    node: Node,
    s: Session,
): { value: string; weight: number }[] {
    return node.edges
        .filter((edge) => graph[edge.to]!.available(s))
        .map((edge) => ({
            value: edge.to,
            weight: edge.weight * (edge.personas?.[s.persona] ?? 1),
        }));
}

export function validateGraph(nodes: Record<string, Node> = graph) {
    for (const [id, node] of Object.entries(nodes)) {
        if (id !== node.id || typeof node.run !== 'function')
            throw new Error(`Invalid node ${id}`);
        if (
            !Number.isInteger(node.retries) ||
            node.retries < 0 ||
            node.amount.some((n) => !Number.isInteger(n) || n < 1) ||
            node.amount[0] > node.amount[1]
        )
            throw new Error(`Invalid execution limits for ${id}`);
        for (const edge of node.edges) {
            if (!nodes[edge.to])
                throw new Error(`Unknown edge ${id} -> ${edge.to}`);
            if (
                !Number.isFinite(edge.weight) ||
                edge.weight <= 0 ||
                Object.values(edge.personas ?? {}).some(
                    (w) => !Number.isFinite(w) || w! <= 0,
                )
            )
                throw new Error(`Invalid weight ${id} -> ${edge.to}`);
        }
    }
}

// Fixed paths use the same actions/selectors as the random simulation.
export const verificationPath = [
    'arrival',
    'scroll',
    'help',
    'dismiss-notification',
    'support',
    'social',
    'popular-next',
    'popular-previous',
    'favorite',
    'open-wallet',
    'login-browser-invalid',
    'remember',
    'login-invalid',
    'close-modal',
    'open-login',
    'close-modal',
    'open-bonus',
    'switch-register',
    'switch-login',
    'switch-register',
    'register-password-error',
    'register-age-error',
    'register-phone-error',
    'register',
    'open-game',
    'spin-insufficient',
    'spin-invalid',
    'close-modal',
    'open-wallet',
    'wallet-deposit',
    'payment-method',
    'deposit-preset',
    'deposit-invalid',
    'deposit',
    'withdraw-tab',
    'withdraw-invalid',
    'withdraw-insufficient',
    'withdraw',
    'deposit-tab',
    'close-modal',
    'open-deposit',
    'close-modal',
    'open-wallet',
    'wallet-bonus',
    'bonus-invalid',
    'bonus',
    'bonus-duplicate',
    'bonus',
    'close-modal',
    'open-bonus',
    'close-modal',
    'open-game',
    'spin',
    'spin',
    'close-modal',
    'open-wallet',
    'close-modal',
    'open-profile',
    'profile-invalid',
    'profile',
    'close-modal',
    'reload',
    'open-profile',
    'logout',
    'open-register',
    'register-duplicate',
    'switch-login',
    'login',
    'tournaments',
    'join-tournament',
    'reload',
    'games',
    'load-more',
    'category',
    'provider-filter',
    'tag-filter',
    'reset-filters',
    'sort',
    'reset-filters',
    'search',
    'clear-search',
    'search-empty',
    'clear-filters',
    'provider-card',
    'reset-filters',
    'favorite',
    'home',
    'open-profile',
    'logout',
    'tournaments',
    'join-tournament',
    'close-modal',
    'home',
    'open-game',
    'login-throttled',
    'close-modal',
    'end',
];
