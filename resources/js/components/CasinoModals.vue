<script setup lang="ts">
import { useHttp } from '@inertiajs/vue3';
import { nextTick, ref, watch, onBeforeUnmount } from 'vue';
import {
    X,
    Shell,
    ArrowRight,
    Wallet,
    CreditCard,
    Landmark,
    Apple,
    Bitcoin,
    Gift,
    Check,
    RefreshCw,
    History,
    LogOut,
    ShieldCheck,
    Sparkles,
} from 'lucide-vue-next';
import { login, register, logout } from '@/routes';
import { update as updateProfile } from '@/routes/profile';
import { deposit, withdraw, index as walletIndex } from '@/routes/wallet';
import { store as redeemBonus } from '@/routes/bonuses';
import { store as spinGame } from '@/routes/spin';
import { artStyle, credits, type Game, type Transaction } from '@/types/casino';
import { trackGtmEvent, type GameCloseMethod } from '@/lib/gtm';
import type { User } from '@/types/auth';
const props = defineProps<{
    modal: string | null;
    user: User | null;
    game: Game | null;
}>();
const emit = defineEmits<{
    close: [];
    open: [modal: string];
    updated: [user: User | null];
    notify: [message: string];
}>();
type Reply = {
    user: User | null;
    message?: string;
    transactions?: Transaction[];
    bet?: { id: number; amount: number };
    win?: { amount: number; multiplier: number };
};
const dialog = ref<HTMLDialogElement>();
const tab = ref('deposit');
const message = ref('');
const networkError = ref('');
const transactions = ref<Transaction[]>([]);
const result = ref<Reply['win'] | null>(null);
const spinning = ref(false);
let activeGame: Pick<Game, 'id' | 'name'> | null = null;
let gameCloseMethod: GameCloseMethod = 'programmatic';
const auth = useHttp<
    {
        username: string;
        email: string;
        phone: string;
        birth_date: string;
        password: string;
        password_confirmation: string;
        remember: boolean;
    },
    Reply
>({
    username: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    password_confirmation: '',
    remember: false,
});
const profile = useHttp<{ name: string; email: string; phone: string }, Reply>({
    name: '',
    email: '',
    phone: '',
});
const cashier = useHttp<
    { amount: string; method: string; request_id: string },
    Reply
>({ amount: '100', method: 'card', request_id: '' });
const bonus = useHttp<{ code: string }, Reply>({ code: '' });
const spin = useHttp<{ amount: string; request_id: string }, Reply>({
    amount: '1',
    request_id: '',
});
const history = useHttp<Record<string, never>, Reply>({});
const signout = useHttp<Record<string, never>, Reply>({});
const paymentMethods = [
    {
        id: 'card',
        name: 'Bank card',
        detail: 'Visa / Mastercard',
        icon: CreditCard,
    },
    { id: 'bank', name: 'Bank transfer', detail: 'Local bank', icon: Landmark },
    { id: 'apple', name: 'Apple Pay', detail: 'Digital wallet', icon: Apple },
    { id: 'crypto', name: 'Crypto', detail: 'BTC / ETH', icon: Bitcoin },
];
function success(response: Reply, close = false) {
    emit('updated', response.user);
    message.value = response.message ?? '';
    if (close) {
        emit('notify', message.value);
        emit('close');
    }
}
function failure() {
    if (![auth, profile, cashier, bonus, spin].some((form) => form.hasErrors))
        networkError.value = 'Something went wrong. Please try again.';
}
async function submitAuth() {
    networkError.value = '';
    try {
        success(
            await auth.post(
                props.modal === 'register' ? register.url() : login.url(),
            ),
            true,
        );
        auth.reset('password', 'password_confirmation');
    } catch {
        failure();
    }
}
async function submitProfile() {
    networkError.value = '';
    try {
        success(await profile.patch(updateProfile.url()));
    } catch {
        failure();
    }
}
async function submitCashier() {
    networkError.value = '';
    message.value = '';
    if (!cashier.request_id) cashier.request_id = crypto.randomUUID();
    try {
        success(
            await cashier.post(
                tab.value === 'deposit' ? deposit.url() : withdraw.url(),
            ),
        );
        cashier.request_id = '';
    } catch {
        failure();
    }
}
async function submitBonus() {
    networkError.value = '';
    message.value = '';
    try {
        success(await bonus.post(redeemBonus.url()));
    } catch {
        failure();
    }
}
async function loadHistory() {
    try {
        const response = await history.get(walletIndex.url());
        transactions.value = response.transactions ?? [];
        emit('updated', response.user);
    } catch {
        networkError.value =
            'Could not load wallet activity. Please try again.';
    }
}
async function submitSpin() {
    if (!props.game || spinning.value) return;
    networkError.value = '';
    result.value = null;
    spinning.value = true;
    if (!spin.request_id) spin.request_id = crypto.randomUUID();
    try {
        const response = await spin.post(spinGame.url(props.game.id));
        await new Promise((resolve) => setTimeout(resolve, 650));
        result.value = response.win;
        emit('updated', response.user);
        spin.request_id = '';
    } catch {
        failure();
    } finally {
        spinning.value = false;
    }
}
async function logOut() {
    try {
        success(await signout.post(logout.url()), true);
    } catch {
        networkError.value = 'Could not log out. Please try again.';
    }
}
function closeModal(method: GameCloseMethod) {
    if (auth.processing || cashier.processing || spinning.value) return;

    gameCloseMethod = method;
    emit('close');
}
function trackGameClosed(method = gameCloseMethod) {
    if (!activeGame) return;

    const game = activeGame;
    activeGame = null;
    gameCloseMethod = 'programmatic';
    trackGtmEvent('game_closed', {
        game_id: game.id,
        game_name: game.name,
        close_method: method,
    });
}
function onDialogClosed() {
    // A queued native close event may arrive after the dialog has reopened.
    if (dialog.value?.open) return;
    trackGameClosed();
    if (props.modal) emit('close');
}
watch(
    () => props.modal,
    async (modal) => {
        message.value = '';
        networkError.value = '';
        result.value = null;
        auth.clearErrors();
        profile.clearErrors();
        cashier.clearErrors();
        bonus.clearErrors();
        spin.clearErrors();
        await nextTick();
        if (modal) {
            if (!dialog.value?.open) dialog.value?.showModal();
            document.body.style.overflow = 'hidden';
            if (modal === 'profile' && props.user) {
                profile.name = props.user.name;
                profile.email = props.user.email;
                profile.phone = props.user.phone;
            }
            if (modal === 'wallet') void loadHistory();
            if (modal === 'cashier') tab.value = 'deposit';
            if (modal === 'game') {
                spin.request_id = '';
                if (props.game) {
                    activeGame = { id: props.game.id, name: props.game.name };
                    gameCloseMethod = 'programmatic';
                }
            } else {
                // Switching to another modal also ends the game view.
                trackGameClosed();
            }
        } else {
            dialog.value?.close();
            trackGameClosed();
            document.body.style.overflow = '';
        }
    },
);
watch(
    () => [cashier.amount, cashier.method, tab.value],
    () => {
        cashier.request_id = '';
        cashier.clearErrors();
        message.value = '';
    },
);
watch(
    () => spin.amount,
    () => {
        spin.request_id = '';
        spin.clearErrors();
    },
);
onBeforeUnmount(() => {
    trackGameClosed('navigation');
    document.body.style.overflow = '';
});
</script>
<template>
    <dialog
        ref="dialog"
        class="casino-dialog"
        :class="{ 'game-dialog': modal === 'game' }"
        aria-labelledby="modal-title"
        @cancel.prevent="closeModal('escape')"
        @click="$event.target === dialog && closeModal('backdrop')"
        @close="onDialogClosed"
    >
        <div class="modal-inner">
            <button
                class="modal-close"
                aria-label="Close modal"
                @click="closeModal('button')"
            >
                <X :size="21" />
            </button>
            <template v-if="modal === 'login' || modal === 'register'">
                <div class="modal-brand">
                    <Shell :size="29" /><span
                        >HERMIT<span class="brand-dot">.</span></span
                    >
                </div>
                <span class="eyebrow">YOUR LITTLE ESCAPE</span>
                <h2 id="modal-title">
                    {{
                        modal === 'register'
                            ? 'Find your happy place.'
                            : 'Welcome back, explorer.'
                    }}
                </h2>
                <p class="modal-description">
                    {{
                        modal === 'register'
                            ? 'A fresh island adventure starts right here.'
                            : 'Your island is right where you left it.'
                    }}
                </p>
                <form class="modal-form" @submit.prevent="submitAuth">
                    <label v-if="modal === 'register'"
                        >Username<input
                            v-model="auth.username"
                            name="username"
                            autocomplete="username"
                            required
                            placeholder="Your island nickname"
                        /><span class="field-error">{{
                            auth.errors.username
                        }}</span></label
                    >
                    <label
                        >Email address<input
                            v-model="auth.email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            required
                            placeholder="you@example.com"
                        /><span class="field-error">{{
                            auth.errors.email
                        }}</span></label
                    >
                    <div v-if="modal === 'register'" class="form-columns">
                        <label
                            >Phone number<input
                                v-model="auth.phone"
                                name="phone"
                                type="tel"
                                autocomplete="tel"
                                required
                                placeholder="+420 777 123 456"
                            /><span class="field-error">{{
                                auth.errors.phone
                            }}</span></label
                        ><label
                            >Birth date<input
                                v-model="auth.birth_date"
                                name="birth_date"
                                type="date"
                                required
                            /><span class="field-error">{{
                                auth.errors.birth_date
                            }}</span></label
                        >
                    </div>
                    <label
                        >Password<input
                            v-model="auth.password"
                            name="password"
                            type="password"
                            :autocomplete="
                                modal === 'register'
                                    ? 'new-password'
                                    : 'current-password'
                            "
                            required
                            minlength="8"
                            placeholder="At least 8 characters"
                        /><span class="field-error">{{
                            auth.errors.password
                        }}</span></label
                    >
                    <label v-if="modal === 'register'"
                        >Confirm password<input
                            v-model="auth.password_confirmation"
                            name="password_confirmation"
                            type="password"
                            autocomplete="new-password"
                            required
                            minlength="8"
                            placeholder="One more time"
                    /></label>
                    <label v-else class="checkbox-label"
                        ><input v-model="auth.remember" type="checkbox" />
                        Remember me</label
                    >
                    <button
                        class="button-primary full"
                        :disabled="auth.processing"
                    >
                        {{
                            auth.processing
                                ? 'Just a moment…'
                                : modal === 'register'
                                  ? 'Create my account'
                                  : 'Log in'
                        }}<ArrowRight :size="18" />
                    </button>
                </form>
                <p class="auth-switch">
                    {{
                        modal === 'register'
                            ? 'Already found your island?'
                            : 'New around here?'
                    }}
                    <button
                        @click="
                            emit(
                                'open',
                                modal === 'register' ? 'login' : 'register',
                            )
                        "
                    >
                        {{
                            modal === 'register'
                                ? 'Log in'
                                : 'Create an account'
                        }}
                    </button>
                </p>
                <p class="modal-footnote">
                    <ShieldCheck :size="15" /> 18+ · Brand preview · Demo
                    credits only
                </p>
            </template>
            <template v-if="modal === 'profile'">
                <div class="modal-icon"><Shell :size="28" /></div>
                <span class="eyebrow">YOUR ISLAND IDENTITY</span>
                <h2 id="modal-title">Make yourself at home.</h2>
                <p class="modal-description">
                    A little update to your explorer profile.
                </p>
                <div class="profile-avatar">
                    {{ user?.name.slice(0, 1).toUpperCase() }}
                    <div>
                        <strong>{{ user?.username }}</strong
                        ><span>Island explorer · Preview member</span>
                    </div>
                </div>
                <form class="modal-form" @submit.prevent="submitProfile">
                    <label
                        >Display name<input
                            v-model="profile.name"
                            name="name"
                            autocomplete="name"
                            required
                        /><span class="field-error">{{
                            profile.errors.name
                        }}</span></label
                    ><label
                        >Email address<input
                            v-model="profile.email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            required
                        /><span class="field-error">{{
                            profile.errors.email
                        }}</span></label
                    ><label
                        >Phone number<input
                            v-model="profile.phone"
                            name="phone"
                            type="tel"
                            autocomplete="tel"
                            required
                        /><span class="field-error">{{
                            profile.errors.phone
                        }}</span></label
                    ><button
                        class="button-primary full"
                        :disabled="profile.processing"
                    >
                        {{ profile.processing ? 'Saving…' : 'Save changes'
                        }}<Check :size="18" />
                    </button>
                </form>
                <button
                    class="logout-button"
                    :disabled="signout.processing"
                    @click="logOut"
                >
                    <LogOut :size="16" /> Log out
                </button>
            </template>
            <template v-if="modal === 'cashier'">
                <div class="modal-icon"><Wallet :size="27" /></div>
                <span class="eyebrow">A LITTLE FUEL FOR YOUR FUN</span>
                <h2 id="modal-title">Your island cashier.</h2>
                <p class="modal-description">
                    All the excitement. Only demo credits.
                </p>
                <div class="cashier-balance">
                    <span>Available demo balance</span
                    ><strong
                        >{{ credits(user?.balance ?? 0) }}
                        <small>DC</small></strong
                    >
                </div>
                <div class="modal-tabs" role="tablist" aria-label="Cashier">
                    <button
                        role="tab"
                        :aria-selected="tab === 'deposit'"
                        :class="{ active: tab === 'deposit' }"
                        @click="tab = 'deposit'"
                    >
                        Deposit</button
                    ><button
                        role="tab"
                        :aria-selected="tab === 'withdraw'"
                        :class="{ active: tab === 'withdraw' }"
                        @click="tab = 'withdraw'"
                    >
                        Withdraw
                    </button>
                </div>
                <form class="modal-form" @submit.prevent="submitCashier">
                    <div v-if="tab === 'deposit'">
                        <span class="input-label">Choose a payment method</span>
                        <div class="payment-methods">
                            <button
                                v-for="method in paymentMethods"
                                :key="method.id"
                                type="button"
                                :class="{
                                    selected: cashier.method === method.id,
                                }"
                                :aria-pressed="cashier.method === method.id"
                                @click="cashier.method = method.id"
                            >
                                <component
                                    :is="method.icon"
                                    :size="24"
                                /><strong>{{ method.name }}</strong
                                ><span>{{ method.detail }}</span
                                ><Check
                                    v-if="cashier.method === method.id"
                                    :size="15"
                                    class="method-check"
                                />
                            </button>
                        </div>
                        <span class="field-error">{{
                            cashier.errors.method
                        }}</span>
                    </div>
                    <label
                        >{{
                            tab === 'deposit'
                                ? 'Deposit amount'
                                : 'Withdrawal amount'
                        }}
                        <div class="amount-input">
                            <input
                                v-model="cashier.amount"
                                :aria-label="
                                    tab === 'deposit'
                                        ? 'Deposit amount'
                                        : 'Withdrawal amount'
                                "
                                name="amount"
                                type="number"
                                min="1"
                                max="10000"
                                step="0.01"
                                required
                            /><span>DC</span>
                        </div>
                        <span class="field-error">{{
                            cashier.errors.amount
                        }}</span></label
                    >
                    <div v-if="tab === 'deposit'" class="amount-presets">
                        <button
                            v-for="amount in [25, 50, 100, 250]"
                            :key="amount"
                            type="button"
                            :class="{
                                selected: cashier.amount === String(amount),
                            }"
                            @click="cashier.amount = String(amount)"
                        >
                            {{ amount }} DC
                        </button>
                    </div>
                    <button
                        class="button-primary full"
                        :disabled="cashier.processing"
                    >
                        {{
                            cashier.processing
                                ? 'Processing…'
                                : tab === 'deposit'
                                  ? 'Add demo credits'
                                  : 'Withdraw demo credits'
                        }}<ArrowRight :size="18" />
                    </button>
                </form>
                <p class="modal-footnote">
                    <ShieldCheck :size="15" /> Simulated payment. No real money
                    is transferred.
                </p>
            </template>
            <template v-if="modal === 'bonus'">
                <div class="bonus-art">
                    <Gift :size="70" stroke-width="1.25" /><Sparkles
                        class="bonus-sparkle"
                        :size="28"
                    />
                </div>
                <span class="eyebrow">GOOD THINGS COME IN SHELLS</span>
                <h2 id="modal-title">A little extra magic.</h2>
                <p class="modal-description">
                    Got a bonus code? Unwrap your next adventure.
                </p>
                <form class="modal-form" @submit.prevent="submitBonus">
                    <label
                        >Bonus code<input
                            v-model="bonus.code"
                            name="code"
                            class="code-input"
                            required
                            placeholder="Enter your code"
                        /><span class="field-error">{{
                            bonus.errors.code
                        }}</span></label
                    ><button
                        class="button-primary full"
                        :disabled="bonus.processing"
                    >
                        {{ bonus.processing ? 'Unwrapping…' : 'Redeem bonus'
                        }}<Gift :size="18" />
                    </button>
                </form>
                <div class="bonus-hint">
                    <span>A welcome gift, on us</span><strong>SHELL100</strong>
                    <p>100 demo credits · One use per explorer</p>
                </div>
            </template>
            <template v-if="modal === 'wallet'">
                <div class="modal-icon"><Wallet :size="27" /></div>
                <span class="eyebrow">YOUR POCKET OF PARADISE</span>
                <h2 id="modal-title">Your demo wallet.</h2>
                <div class="cashier-balance">
                    <span>Available demo balance</span
                    ><strong
                        >{{ credits(user?.balance ?? 0) }}
                        <small>DC</small></strong
                    >
                </div>
                <div class="wallet-actions">
                    <button
                        class="button-primary"
                        @click="emit('open', 'cashier')"
                    >
                        Top up wallet<ArrowRight :size="17" /></button
                    ><button
                        class="button-outline"
                        @click="emit('open', 'bonus')"
                    >
                        <Gift :size="17" /> Bonus code
                    </button>
                </div>
                <h3 class="history-title">
                    <History :size="18" /> Recent activity
                </h3>
                <div
                    v-if="history.processing"
                    class="history-loading animate-pulse"
                >
                    Finding your island footprints…
                </div>
                <div v-else-if="!transactions.length" class="empty-activity">
                    A fresh start. Top up to begin your adventure.
                </div>
                <div v-else class="transaction-list">
                    <div
                        v-for="transaction in transactions"
                        :key="transaction.id"
                        class="transaction"
                    >
                        <div>
                            <strong>{{ transaction.description }}</strong
                            ><span>{{
                                new Date(transaction.created_at).toLocaleString(
                                    'en-GB',
                                )
                            }}</span>
                        </div>
                        <strong
                            :class="
                                transaction.amount >= 0
                                    ? 'credit-positive'
                                    : 'credit-negative'
                            "
                            >{{ transaction.amount >= 0 ? '+' : ''
                            }}{{ credits(transaction.amount) }}
                            <small>DC</small></strong
                        >
                    </div>
                </div>
            </template>
            <template v-if="modal === 'game' && game">
                <div class="game-modal-heading">
                    <div>
                        <span class="eyebrow"
                            >{{ game.provider.name }} ·
                            {{ game.category }}</span
                        >
                        <h2 id="modal-title">{{ game.name }}</h2>
                    </div>
                    <span class="demo-pill"><span></span> SIMULATED PLAY</span>
                </div>
                <div
                    class="game-stage"
                    :style="{
                        ...artStyle(game.image),
                        backgroundColor: game.color,
                    }"
                    :class="{ spinning }"
                >
                    <div class="stage-shade"></div>
                    <div class="stage-title">{{ game.name }}</div>
                    <div v-if="spinning" class="spin-animation">
                        <RefreshCw :size="48" />
                    </div>
                    <div v-else-if="result" class="spin-result" role="status">
                        <span>{{
                            result.amount > 0
                                ? 'A little island magic!'
                                : 'The adventure continues.'
                        }}</span
                        ><strong>{{
                            result.amount > 0
                                ? '+' + credits(result.amount) + ' DC'
                                : 'No win this spin'
                        }}</strong
                        ><small
                            >{{ result.multiplier }}× multiplier · Demo
                            result</small
                        >
                    </div>
                    <span class="stage-watermark">HERMIT ORIGINALS</span>
                </div>
                <form class="spin-controls" @submit.prevent="submitSpin">
                    <div class="spin-balance">
                        <span>YOUR DEMO BALANCE</span
                        ><strong
                            >{{ credits(user?.balance ?? 0) }}
                            <small>DC</small></strong
                        >
                    </div>
                    <label
                        >Bet amount
                        <div class="amount-input">
                            <input
                                v-model="spin.amount"
                                aria-label="Bet amount"
                                name="amount"
                                type="number"
                                min="0.1"
                                max="100"
                                step="0.01"
                                required
                                :disabled="spinning"
                            /><span>DC</span>
                        </div></label
                    ><button
                        class="button-primary spin-button"
                        :disabled="spinning"
                    >
                        <RefreshCw
                            :size="20"
                            :class="{ 'animate-spin': spinning }"
                        />{{ spinning ? 'Spinning…' : 'Spin' }}
                    </button>
                </form>
                <span class="field-error">{{ spin.errors.amount }}</span>
                <p class="modal-footnote">
                    Just a brand preview. Spins are simulated and credits have
                    no monetary value.
                </p>
            </template>
            <div v-if="message" class="success-message" role="status">
                <Check :size="18" />{{ message }}
            </div>
            <div v-if="networkError" class="field-error" role="alert">
                {{ networkError }}
            </div>
        </div>
    </dialog>
</template>
