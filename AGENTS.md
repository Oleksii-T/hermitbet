# HERMIT project guide

## Purpose and scope

HERMIT is a fictional casino playground for testing ideas, UI flows, and experiments. It has basic features and extensive mock/simulated behavior. **No real money, real payment or game-provider integrations, or production deployment.** Keep changes appropriate to this experimental scope; do not assume production casino requirements or introduce real financial services.

## Architecture and entry points

- Laravel 13 / PHP 8.3+ backend, MySQL, and a Vue 3 + TypeScript frontend using Inertia 3, Tailwind CSS 4, and Vite Plus. Local Sail and CI use PHP 8.4; CI uses Node 22.
- `routes/web.php` defines the app's routes. There is no separate `routes/api.php`: JSON endpoints use the web session/authentication and CSRF middleware.
- `CatalogController@index` renders `resources/js/pages/Casino.vue` for `/` (lobby), `/games` (catalog), and `/tournaments`. Each receives the full catalog, providers, tournaments, and the current user's joined tournament IDs.
- `app/Http/Middleware/HandleInertiaRequests.php` shares `auth.user`. `Casino.vue` also holds local user state updated by JSON replies from modals.
- `resources/js/components/CasinoModals.vue` contains account, profile, cashier, wallet, bonus, and simulated game dialogs. It uses Inertia `useHttp` for JSON requests; page navigation and tournament joining use the Inertia router.
- `resources/js/components/GameCard.vue` renders game cards. `resources/js/types/casino.ts` and `types/auth.ts` define frontend data shapes.
- `resources/css/app.css` contains the casino styling. `public/images/hermit-island.png` is the hero; `game-atlas.png` supplies 12 game-art tiles via `artStyle()`.
- Wayfinder generates typed route helpers imported from `@/routes`. Change Laravel routes and regenerate helpers rather than editing generated files.

## Main features and limitations

- **Catalog:** seeders create 120 fictional games, six fictional providers, and three tournaments. Search, category/provider/tag filters, sorting, and loading more cards happen in Vue against the already-loaded catalog (24 cards per batch).
- **Accounts:** registration, login/logout, remember-me, and profile editing persist locally. Registration validates age 18+, phone, unique username/email, and password confirmation. Email verification is not required and no verification messages are sent. New accounts start with zero credits.
- **Wallet:** deposits and withdrawals update demo credits and record activity. Card, bank, Apple Pay, and crypto are mock method labels. There are no payment gateways or real transfers. History returns the latest 30 transactions for the signed-in user.
- **Bonuses:** `SHELL100` adds 100 demo credits and `ISLAND50` adds 50. Redemption is case-insensitive, once per user per code, and rejects inactive/expired codes.
- **Gameplay:** every catalog game uses the same simulated spin logic in `app/SpinOutcome.php`: 0x (55%), 1x (25%), 2x (15%), or 5x (5%). Spins save a bet and win, debit the stake, and credit the payout. There are no actual provider games or category-specific engines.
- **Tournaments:** joining saves account membership and rejects ended events. Prize pools are fictional; there is no scoring, leaderboard, or prize distribution.
- **UI-only extras:** favorites are component-local and do not persist. Help, support, and social buttons show preview notifications.

## Backend endpoints

All endpoints below return JSON except tournament joining, which redirects back. Only register/login allow guests; the others require a signed-in user.

| Method | Path                                  | Purpose                   |
| ------ | ------------------------------------- | ------------------------- |
| POST   | `/register`, `/login`, `/logout`      | Account/session actions   |
| PATCH  | `/profile`                            | Update name, email, phone |
| GET    | `/wallet`                             | User and recent activity  |
| POST   | `/wallet/deposit`, `/wallet/withdraw` | Simulated credit transfer |
| POST   | `/bonuses`                            | Redeem `code`             |
| POST   | `/games/{game}/spin`                  | Simulated bet/result      |
| POST   | `/tournaments/{tournament}/join`      | Save membership           |

Balances, transaction amounts, bets, wins, bonus amounts, and prize pools are stored in **integer hundredths of a demo credit** (100 = 1.00 DC). Transfer/spin requests send decimal `amount` and a UUID `request_id`; deposits also send `method`. Wallet amounts accept 1–10,000 DC, spins 0.10–100 DC, with at most two decimals.

`app/WalletOperation.php` converts amounts and records balance changes, rejecting insufficient credits. Transfer, bonus, and spin controllers use database transactions and user row locks. Transfers and spins deduplicate requests by user/request UUID. Preserve these behaviors when experimenting with balances or retries.

## Local development and checks

- User simulation: `npm run simulate -- --url http://localhost:8001 --workers 4 --iterations 100 --limit 15` runs isolated weighted Playwright visits. `scripts/simulation/graph.ts` defines guarded actions/weights; `actions.ts` implements UI interactions. `--verify --speed 0 --analytics off` checks every supported feature/error path on desktop/mobile. `npm run simulate:test` checks the engine and `npm run simulate:check` checks its TypeScript. See `docs/user-simulation.md` for options, PostHog tagging, logs, deadlines, and exit codes. Simulation accounts and demo activity persist in the selected database.

- First-time setup: `composer setup` installs dependencies, creates `.env` if absent, generates the key, starts MySQL with Docker Compose, migrates/seeds, and builds the frontend. Check `.env.example` for local settings.
- Run `composer dev` for Laravel and Vite. Its Laravel server defaults to port **8000**; `.env.example` uses `APP_URL`/Sail port **8001**. Use the actual running URL. Sail is available via `vendor/bin/sail`.
- Seeded local/testing login: `demo@hermit.test` / `IslandDemo123!`, initially 1,250 DC. `php artisan db:seed` preserves an existing demo account's balance but refreshes tournament dates.
- Frontend: `npm run check`, `npm run types:check`, `npm run build`. Backend: `composer test` runs Pint checks, PHPStan/Larastan, and Pest. `composer ci:check` adds frontend checks.
- `tests/Feature/CasinoPreviewTest.php` covers catalog, auth, validation, balances, retries, bonuses, spins, history isolation, and joining. Feature tests use `RefreshDatabase` and the MySQL `testing` database configured by `phpunit.xml`; use a dedicated test database.
- `npm run test:e2e` runs Playwright Chromium flows for desktop/mobile. Prepare the seeded database and frontend assets first; `E2E_BASE_URL` overrides the default `http://localhost:8000`. These tests create accounts and demo activity in the selected app database.

At the start of a session, inspect `git status` and the relevant files; preserve existing work. Prefer small experiments, keep simulated behavior clear in the UI, and update this guide when the architecture or main capabilities change.
