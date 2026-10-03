<script setup lang="ts">
import { Head, Link, router, usePage } from '@inertiajs/vue3';
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import {
    Shell,
    Search,
    LayoutGrid,
    Flame,
    Sparkles,
    Trophy,
    Gift,
    Wallet,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowRight,
    Headphones,
    CircleHelp,
    ShieldCheck,
    Waves,
    Gamepad2,
    Diamond,
    Zap,
    SlidersHorizontal,
    X,
    Menu,
    Check,
    Instagram,
} from 'lucide-vue-next';
import {
    home,
    games as gamesRoute,
    tournaments as tournamentsRoute,
} from '@/routes';
import { join } from '@/routes/tournaments';
import CasinoModals from '@/components/CasinoModals.vue';
import GameCard from '@/components/GameCard.vue';
import {
    artStyle,
    credits,
    type Game,
    type Provider,
    type Tournament,
} from '@/types/casino';
import type { User } from '@/types/auth';
const props = defineProps<{
    section: string;
    games: Game[];
    providers: Provider[];
    tournaments: Tournament[];
    joinedTournaments: number[];
}>();
const page = usePage();
const user = ref<User | null>(page.props.auth.user);
watch(
    () => page.props.auth.user,
    (value) => {
        user.value = value;
    },
);
const modal = ref<string | null>(null);
const selectedGame = ref<Game | null>(null);
const toast = ref('');
const search = ref('');
const headerSearch = ref<HTMLInputElement>();
function searchShortcut(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        headerSearch.value?.focus();
    }
}
onMounted(() => window.addEventListener('keydown', searchShortcut));
onBeforeUnmount(() => window.removeEventListener('keydown', searchShortcut));
const category = ref('All games');
const provider = ref('all');
const tag = ref('all');
const order = ref('popular');
const visibleCount = ref(24);
const mobileMenu = ref(false);
const popularOffset = ref(0);
const categories = [
    { name: 'All games', icon: LayoutGrid },
    { name: 'Slots', icon: Shell },
    { name: 'Table games', icon: Diamond },
    { name: 'Arcade', icon: Gamepad2 },
    { name: 'Instant win', icon: Zap },
];
const popularGames = computed(() =>
    props.games
        .filter((game) => game.is_popular)
        .slice(popularOffset.value, popularOffset.value + 6),
);
const featuredGames = computed(() =>
    props.games.filter((game) => game.is_featured).slice(6, 12),
);
const availableTags = computed(() =>
    [...new Set(props.games.flatMap((game) => game.tags))].sort(),
);
const filteredGames = computed(() => {
    const list = props.games.filter(
        (game) =>
            (category.value === 'All games' ||
                game.category === category.value) &&
            (provider.value === 'all' ||
                String(game.provider.id) === provider.value) &&
            (tag.value === 'all' || game.tags.includes(tag.value)) &&
            `${game.name} ${game.provider.name}`
                .toLowerCase()
                .includes(search.value.toLowerCase()),
    );
    return list.sort((a, b) =>
        order.value === 'name'
            ? a.name.localeCompare(b.name)
            : order.value === 'newest'
              ? b.id - a.id
              : order.value === 'name-desc'
                ? b.name.localeCompare(a.name)
                : b.popularity - a.popularity,
    );
});
watch([search, category, provider, tag, order], () => {
    visibleCount.value = 24;
});
function openModal(name: string) {
    modal.value =
        user.value || ['login', 'register'].includes(name) ? name : 'login';
    mobileMenu.value = false;
}
function play(game: Game) {
    selectedGame.value = game;
    openModal('game');
}
function notify(message: string) {
    toast.value = message;
    setTimeout(() => {
        toast.value = '';
    }, 4500);
}
function selectProvider(id: number) {
    provider.value = String(id);
    router.visit(gamesRoute.url(), {
        preserveState: true,
        preserveScroll: false,
    });
}
function browseCategory(name: string) {
    category.value = name;
    if (props.section !== 'games')
        router.visit(gamesRoute.url(), { preserveState: true });
}
function resetFilters() {
    search.value = '';
    category.value = 'All games';
    provider.value = 'all';
    tag.value = 'all';
    order.value = 'popular';
}
function joinTournament(tournament: Tournament) {
    if (!user.value) {
        openModal('login');
        return;
    }
    router.post(
        join.url(tournament.id),
        {},
        {
            preserveScroll: true,
            onSuccess: () =>
                notify(
                    'You’re in! Explore games to enjoy the tournament preview.',
                ),
            onError: () => notify('This tournament is no longer available.'),
        },
    );
}
function daysLeft(date: string) {
    return Math.max(
        0,
        Math.ceil((new Date(date).getTime() - Date.now()) / 86400000),
    );
}
</script>
<template>
    <div class="casino-app">
        <Head
            :title="
                section === 'games'
                    ? 'All games'
                    : section === 'tournaments'
                      ? 'Tournaments'
                      : 'Your little escape'
            "
            ><meta
                name="description"
                content="Welcome to HERMIT, your little island escape. Explore 120 original games, playful adventures, and a tropical world of demo play."
        /></Head>
        <header class="site-header">
            <Link :href="home()" class="brand" aria-label="HERMIT home"
                ><span class="brand-icon"
                    ><Shell :size="32" stroke-width="2.2" /></span
                ><span>HERMIT<span class="brand-dot">.</span></span></Link
            >
            <button
                class="mobile-menu-toggle icon-button"
                aria-label="Toggle menu"
                @click="mobileMenu = !mobileMenu"
            >
                <Menu :size="23" />
            </button>
            <div class="header-search">
                <Search :size="18" /><input
                    v-model="search"
                    ref="headerSearch"
                    aria-label="Search games"
                    placeholder="Find your next favorite game"
                    @input="
                        section !== 'games' &&
                        router.visit(gamesRoute.url(), { preserveState: true })
                    "
                /><kbd>⌘ K</kbd>
            </div>
            <div class="header-actions">
                <span class="preview-label"><span></span> BRAND PREVIEW</span
                ><button
                    class="header-wallet"
                    aria-label="Open wallet"
                    @click="openModal('wallet')"
                >
                    <Wallet :size="18" /><span
                        ><small>DEMO BALANCE</small
                        ><strong data-testid="header-balance"
                            >{{ credits(user?.balance ?? 0) }}
                            <em>DC</em></strong
                        ></span
                    ><ChevronDown :size="13" /></button
                ><template v-if="user"
                    ><button
                        class="button-primary header-deposit"
                        aria-label="Deposit"
                        @click="openModal('cashier')"
                    >
                        <span>+</span> Deposit</button
                    ><button
                        class="user-avatar"
                        aria-label="Open profile"
                        @click="openModal('profile')"
                    >
                        {{ user.name.slice(0, 1).toUpperCase() }}
                    </button></template
                ><template v-else
                    ><button class="login-button" @click="openModal('login')">
                        Log in</button
                    ><button
                        class="button-primary header-deposit"
                        @click="openModal('register')"
                    >
                        Join the island<ArrowUpRight :size="16" /></button
                ></template>
            </div>
        </header>
        <aside class="sidebar" :class="{ 'mobile-open': mobileMenu }">
            <div class="sidebar-top">
                <span class="nav-label">YOUR PLAYGROUND</span>
                <nav aria-label="Main navigation">
                    <Link
                        :href="home()"
                        class="nav-item"
                        :class="{ active: section === 'lobby' }"
                        @click="mobileMenu = false"
                        ><LayoutGrid :size="19" /> Lobby<span
                            v-if="section === 'lobby'"
                            class="active-dot"
                        ></span></Link
                    ><Link
                        :href="gamesRoute()"
                        class="nav-item"
                        :class="{ active: section === 'games' }"
                        @click="mobileMenu = false"
                        ><Gamepad2 :size="19" /> All games<span
                            class="nav-count"
                            >120</span
                        ></Link
                    ><Link
                        :href="tournamentsRoute()"
                        class="nav-item"
                        :class="{ active: section === 'tournaments' }"
                        @click="mobileMenu = false"
                        ><Trophy :size="19" /> Tournaments<span class="nav-new"
                            >NEW</span
                        ></Link
                    >
                </nav>
                <div class="nav-divider"></div>
                <span class="nav-label">GOOD VIBES & EXTRAS</span
                ><button class="nav-item" @click="openModal('bonus')">
                    <Gift :size="19" /> Bonus codes<span
                        class="gift-dot"
                    ></span></button
                ><button class="nav-item" @click="openModal('wallet')">
                    <Wallet :size="19" /> My wallet
                </button>
                <div class="sidebar-promo">
                    <span class="promo-shell"><Shell :size="38" /></span
                    ><span class="eyebrow">A WARM WELCOME</span>
                    <h3>Good vibes.<br />Extra credits.</h3>
                    <p>Your first 100 demo credits<br />are on the house.</p>
                    <button @click="openModal('bonus')">
                        Unlock your bonus<ArrowUpRight :size="15" />
                    </button>
                </div>
            </div>
            <div class="sidebar-bottom">
                <button
                    class="nav-item"
                    @click="
                        notify(
                            'Welcome to HERMIT! Create an account, add demo credits, then open any game and Spin. All activity is simulated.',
                        )
                    "
                >
                    <CircleHelp :size="18" /> How to play</button
                ><button
                    class="nav-item"
                    @click="
                        notify(
                            'Need a hand? This is a brand preview. Explore the cashier, bonuses, and games using demo credits.',
                        )
                    "
                >
                    <Headphones :size="18" /> Need a hand?<span
                        class="support-dot"
                    ></span>
                </button>
                <div class="sidebar-bottom-rule"></div>
                <div class="social-links">
                    <button
                        aria-label="HERMIT community preview"
                        @click="
                            notify(
                                'The HERMIT community is part of the brand preview. Stay tuned!',
                            )
                        "
                    >
                        <Instagram :size="17" /></button
                    ><button
                        aria-label="HERMIT social preview"
                        @click="notify('Our island socials are coming soon.')"
                    >
                        𝕏</button
                    ><span>Made for your downtime.</span>
                </div>
                <p class="sidebar-disclaimer">
                    18+ · No real money. Just good fun.
                </p>
            </div>
        </aside>
        <main class="main-content">
            <template v-if="section === 'lobby'">
                <div class="page-intro">
                    <div>
                        <span class="eyebrow"
                            >A LITTLE ESCAPE. A LOT OF POSSIBILITIES.</span
                        >
                        <h1>
                            Your daily dose of play<span class="brand-dot"
                                >.</span
                            >
                        </h1>
                    </div>
                    <span class="island-status"
                        ><span></span> Life’s better on the island</span
                    >
                </div>
                <div class="hero-grid">
                    <section class="island-hero">
                        <img
                            src="/images/hermit-island.png"
                            alt="HERMIT's friendly orange crab relaxing on a tropical island with sunglasses and golden coins"
                            fetchpriority="high"
                        />
                        <div class="hero-copy">
                            <span class="hero-tag"
                                ><Sparkles :size="13" /> WELCOME TO YOUR HAPPY
                                PLACE</span
                            >
                            <h2>Big on fun.<br />Easy on life.</h2>
                            <p>
                                Leave the everyday behind.<br />Your little
                                island escape is waiting.
                            </p>
                            <button
                                class="button-dark"
                                @click="
                                    user
                                        ? browseCategory('All games')
                                        : openModal('register')
                                "
                            >
                                {{
                                    user
                                        ? 'Explore the games'
                                        : 'Find your escape'
                                }}<ArrowUpRight :size="19" />
                            </button>
                            <div class="hero-pagination">
                                <span class="current"></span><span></span
                                ><span></span>
                            </div>
                        </div>
                        <div class="hero-stamp">
                            100%<br /><small>GOOD VIBES</small
                            ><Waves :size="21" />
                        </div>
                    </section>
                    <section class="welcome-card">
                        <span class="welcome-pill">YOUR FIRST LITTLE PERK</span>
                        <div class="welcome-gift">
                            <Gift :size="65" stroke-width="1.3" /><Sparkles
                                :size="22"
                            />
                        </div>
                        <h2>
                            Hello, sunshine.<br />Hello,
                            <span>100 credits.</span>
                        </h2>
                        <p>
                            A little something to get<br />your island adventure
                            started.
                        </p>
                        <button @click="openModal('bonus')">
                            Claim your welcome bonus<ArrowUpRight
                                :size="17"
                            /></button
                        ><small
                            >Use code <strong>SHELL100</strong> · Demo credits
                            only</small
                        >
                    </section>
                </div>
                <div class="category-bar">
                    <button
                        v-for="item in categories"
                        :key="item.name"
                        :class="{ active: category === item.name }"
                        @click="browseCategory(item.name)"
                    >
                        <component :is="item.icon" :size="18" />{{
                            item.name
                        }}</button
                    ><Link
                        :href="tournamentsRoute()"
                        class="category-tournaments"
                        ><Trophy :size="18" /> Tournaments<ArrowUpRight
                            :size="15"
                    /></Link>
                </div>
                <section class="game-section" aria-labelledby="popular-title">
                    <div class="section-heading">
                        <div>
                            <span class="section-icon hot"
                                ><Flame :size="22"
                            /></span>
                            <h2 id="popular-title">Island favorites</h2>
                            <span class="section-subtitle"
                                >Popular for a reason</span
                            >
                        </div>
                        <div>
                            <Link :href="gamesRoute()" class="view-all"
                                >View all<ArrowUpRight :size="15" /></Link
                            ><button
                                class="carousel-button"
                                aria-label="Previous popular games"
                                :disabled="popularOffset === 0"
                                @click="popularOffset = 0"
                            >
                                <ChevronLeft :size="17" /></button
                            ><button
                                class="carousel-button"
                                aria-label="Next popular games"
                                :disabled="popularOffset === 6"
                                @click="popularOffset = 6"
                            >
                                <ChevronRight :size="17" />
                            </button>
                        </div>
                    </div>
                    <div class="games-grid">
                        <GameCard
                            v-for="game in popularGames"
                            :key="game.id"
                            :game="game"
                            @play="play"
                        />
                    </div>
                </section>
                <section class="game-section" aria-labelledby="featured-title">
                    <div class="section-heading">
                        <div>
                            <span class="section-icon featured"
                                ><Sparkles :size="21"
                            /></span>
                            <h2 id="featured-title">Fresh finds</h2>
                            <span class="section-subtitle"
                                >Your next obsession, perhaps?</span
                            >
                        </div>
                        <Link :href="gamesRoute()" class="view-all"
                            >Explore more<ArrowUpRight :size="15"
                        /></Link>
                    </div>
                    <div class="games-grid">
                        <GameCard
                            v-for="game in featuredGames"
                            :key="game.id"
                            :game="game"
                            @play="play"
                        />
                    </div>
                </section>
                <section class="tournament-banner">
                    <span class="trophy-illustration"
                        ><Trophy :size="67" stroke-width="1.3"
                    /></span>
                    <div>
                        <span class="eyebrow"
                            >A LITTLE FRIENDLY COMPETITION</span
                        >
                        <h2>Good company. Great adventures.</h2>
                        <p>
                            Meet the island’s tournaments. Play for the fun of
                            it.
                        </p>
                    </div>
                    <Link :href="tournamentsRoute()" class="button-lime"
                        >Explore tournaments<ArrowUpRight :size="18" /></Link
                    ><span class="banner-decoration">✦</span>
                </section>
            </template>
            <template v-if="section === 'games'">
                <div class="page-intro">
                    <div>
                        <span class="eyebrow"
                            >YOUR NEXT FAVORITE IS IN HERE</span
                        >
                        <h1>
                            A whole world of play<span class="brand-dot"
                                >.</span
                            >
                        </h1>
                        <p class="page-description">
                            120 original adventures. One happy little island.
                        </p>
                    </div>
                    <span class="collection-count"
                        ><Gamepad2 :size="21" /> 120 games to explore</span
                    >
                </div>
                <div class="catalog-search">
                    <Search :size="21" /><input
                        v-model="search"
                        aria-label="Search all games"
                        placeholder="Search games or providers…"
                    /><button
                        v-if="search"
                        aria-label="Clear search"
                        @click="search = ''"
                    >
                        <X :size="18" />
                    </button>
                </div>
                <div class="category-bar catalog-categories">
                    <button
                        v-for="item in categories"
                        :key="item.name"
                        :class="{ active: category === item.name }"
                        @click="category = item.name"
                    >
                        <component :is="item.icon" :size="18" />{{ item.name
                        }}<span>{{
                            item.name === 'All games'
                                ? games.length
                                : games.filter(
                                      (game) => game.category === item.name,
                                  ).length
                        }}</span>
                    </button>
                </div>
                <div class="filters-row">
                    <span><SlidersHorizontal :size="17" /> Find your vibe</span
                    ><label
                        >Provider<select
                            v-model="provider"
                            aria-label="Filter by provider"
                        >
                            <option value="all">All providers</option>
                            <option
                                v-for="item in providers"
                                :key="item.id"
                                :value="String(item.id)"
                            >
                                {{ item.name }}
                            </option>
                        </select></label
                    ><label
                        >Tag<select v-model="tag" aria-label="Filter by tag">
                            <option value="all">All themes</option>
                            <option v-for="item in availableTags" :key="item">
                                {{ item }}
                            </option>
                        </select></label
                    ><label class="order-filter"
                        >Sort by<select v-model="order" aria-label="Sort games">
                            <option value="popular">Most popular</option>
                            <option value="newest">Newest first</option>
                            <option value="name">Name: A–Z</option>
                            <option value="name-desc">Name: Z–A</option>
                        </select></label
                    ><button class="reset-filters" @click="resetFilters">
                        Reset
                    </button>
                </div>
                <div class="catalog-result-label">
                    <span
                        ><strong>{{ filteredGames.length }}</strong> games
                        found</span
                    ><span>Fictional games. Real good vibes.</span>
                </div>
                <div
                    v-if="filteredGames.length"
                    class="games-grid catalog-grid"
                >
                    <GameCard
                        v-for="game in filteredGames.slice(0, visibleCount)"
                        :key="game.id"
                        :game="game"
                        @play="play"
                    />
                </div>
                <div v-else class="no-games">
                    <Search :size="40" />
                    <h2>No islands in sight.</h2>
                    <p>Try another search or clear your filters.</p>
                    <button class="button-primary" @click="resetFilters">
                        Clear filters
                    </button>
                </div>
                <div
                    v-if="visibleCount < filteredGames.length"
                    class="load-more"
                >
                    <button class="button-outline" @click="visibleCount += 24">
                        Discover more games<ChevronDown :size="18" /></button
                    ><span
                        >Showing
                        {{ Math.min(visibleCount, filteredGames.length) }} of
                        {{ filteredGames.length }}</span
                    >
                </div>
            </template>
            <template v-if="section === 'tournaments'">
                <div class="page-intro">
                    <div>
                        <span class="eyebrow"
                            >GOOD TIMES ARE BETTER TOGETHER</span
                        >
                        <h1>
                            A little friendly competition<span class="brand-dot"
                                >.</span
                            >
                        </h1>
                        <p class="page-description">
                            Discover the island’s events. Join in, explore, and
                            enjoy the ride.
                        </p>
                    </div>
                </div>
                <div class="tournament-feature">
                    <Trophy :size="83" stroke-width="1.2" />
                    <div>
                        <span class="eyebrow"
                            >THE ISLAND IS YOUR PLAYGROUND</span
                        >
                        <h2>Big adventures.<br />Brighter company.</h2>
                        <p>
                            All tournaments are simulated. Prize pools are
                            fictional demo credits.
                        </p>
                    </div>
                    <Shell
                        class="tournament-shell"
                        :size="180"
                        stroke-width="0.7"
                    />
                </div>
                <div class="tournament-section-heading">
                    <h2>On the island right now</h2>
                    <span class="demo-pill"
                        ><span></span> 3 PREVIEW EVENTS</span
                    >
                </div>
                <div class="tournament-grid">
                    <article
                        v-for="tournament in tournaments"
                        :key="tournament.id"
                        class="tournament-card"
                    >
                        <div
                            class="tournament-cover"
                            :style="artStyle(tournament.image)"
                        >
                            <span class="tournament-live"
                                ><span></span
                                >{{
                                    daysLeft(tournament.ends_at) > 0
                                        ? 'LIVE PREVIEW'
                                        : 'ENDED'
                                }}</span
                            ><Trophy :size="46" />
                            <h3>{{ tournament.name }}</h3>
                        </div>
                        <div class="tournament-card-body">
                            <p>{{ tournament.description }}</p>
                            <div class="tournament-stats">
                                <div>
                                    <span>DEMO PRIZE POOL</span
                                    ><strong
                                        >{{ credits(tournament.prize_pool) }}
                                        <small>DC</small></strong
                                    >
                                </div>
                                <div>
                                    <span>ENDS IN</span
                                    ><strong
                                        >{{ daysLeft(tournament.ends_at) }}
                                        <small>days</small></strong
                                    >
                                </div>
                            </div>
                            <button
                                class="button-primary full"
                                :disabled="
                                    joinedTournaments.includes(tournament.id) ||
                                    daysLeft(tournament.ends_at) === 0
                                "
                                @click="joinTournament(tournament)"
                            >
                                <template
                                    v-if="
                                        joinedTournaments.includes(
                                            tournament.id,
                                        )
                                    "
                                    ><Check :size="18" /> You’re on the
                                    list</template
                                ><template v-else
                                    >Join the adventure<ArrowUpRight :size="18"
                                /></template></button
                            ><small class="tournament-note"
                                >Free entry · Simulated event · No cash
                                prizes</small
                            >
                        </div>
                    </article>
                </div>
                <div class="tournament-info">
                    <ShieldCheck :size="24" />
                    <p>
                        <strong>Here for the fun of it.</strong> Tournament
                        membership is saved to your account. All event prizes
                        and gameplay are for this brand preview.
                    </p>
                </div>
            </template>
            <section class="provider-section" aria-labelledby="providers-title">
                <div class="section-heading">
                    <div>
                        <span class="section-icon"><Diamond :size="21" /></span>
                        <h2 id="providers-title">The makers of the magic</h2>
                        <span class="section-subtitle">Our game providers</span>
                    </div>
                    <span class="provider-note"
                        >Small studios. Big imagination.</span
                    >
                </div>
                <div class="provider-grid">
                    <button
                        v-for="item in providers"
                        :key="item.id"
                        class="provider-card"
                        @click="selectProvider(item.id)"
                    >
                        <span>{{ item.symbol }}</span
                        ><strong>{{ item.name }}</strong
                        ><small>{{ item.games_count }} games</small>
                    </button>
                </div>
            </section>
            <footer class="site-footer">
                <div class="footer-top">
                    <Link :href="home()" class="brand footer-brand"
                        ><Shell :size="27" />HERMIT<span class="brand-dot"
                            >.</span
                        ></Link
                    >
                    <p>Your little escape. Wherever you are.</p>
                    <span
                        ><ShieldCheck :size="16" /> Playful by nature. Preview
                        by design.</span
                    >
                </div>
                <div class="footer-bottom">
                    <p>
                        © {{ new Date().getFullYear() }} HERMIT. A fictional
                        casino brand concept.
                    </p>
                    <span>18+</span>
                    <p>
                        Demo credits have no monetary value. No real games,
                        payments, or prizes.
                    </p>
                </div>
            </footer>
        </main>
        <CasinoModals
            :modal="modal"
            :user="user"
            :game="selectedGame"
            @close="modal = null"
            @open="openModal"
            @updated="user = $event"
            @notify="notify"
        />
        <Transition name="toast"
            ><div v-if="toast" class="toast-message" role="status">
                <Check :size="19" />{{ toast
                }}<button aria-label="Dismiss notification" @click="toast = ''">
                    <X :size="17" />
                </button></div
        ></Transition>
    </div>
</template>
