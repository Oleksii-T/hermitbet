# Casino user simulation

Run the seeded Laravel preview and Vite (or build the frontend), then:

```sh
npm run simulate -- --url http://localhost:8001 --workers 4 --iterations 100 --limit 15
```

The simulator uses the existing Playwright and TypeScript dependencies. If Chromium is missing, run `npx playwright install chromium`. It connects to a running preview; it does not start servers, migrate, or seed your database.

| Parameter                    | Meaning                                                                                          | Default                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| `--workers`                  | Maximum concurrent isolated browser visits                                                       | `2`                       |
| `--iterations`               | Total visits across all workers                                                                  | `10`                      |
| `--limit`                    | Whole command budget in minutes, including compilation; accepts fractions                        | `10`                      |
| `--url`                      | Preview URL; also accepts `SIMULATION_BASE_URL` or `E2E_BASE_URL`                                | `http://localhost:8000`   |
| `--seed`                     | Seed for action choices, personas, delays, amounts, and devices                                  | Current timestamp         |
| `--min-steps`, `--max-steps` | Visit length bounds; random departures become possible after the minimum                         | `20`, `60`                |
| `--speed`                    | Human delay multiplier; `0` runs quickly                                                         | `1`                       |
| `--headed`                   | Show Chromium                                                                                    | Off                       |
| `--analytics`                | `required`, `optional`, or `off`                                                                 | `required`                |
| `--verify`                   | Fixed comprehensive desktop and mobile paths; always two visits, overrides iteration/step counts | Off                       |
| `--log-dir`                  | Output directory                                                                                 | `storage/app/simulations` |

`--help` prints the options. Workers share one browser process but each visit has its own context, cookies, local storage, analytics identity, and generated credentials. New accounts use unique `@example.test` emails. Accounts, memberships, bonuses, bets, wins, and wallet activity remain in the target database. No shared demo account is used.

## Behavior and graph

The graph lives in `scripts/simulation/graph.ts`; browser actions live in `actions.ts`. Each node has an ID, availability guard, `retries`, an `amount` range, and outgoing weighted edges. The runner removes edges whose destination is unavailable, applies persona multipliers, and rolls a weighted choice. Preferred continuations make correction and recovery more likely after errors. Loops represent repeated browsing or spinning; navigation follows actual links/buttons rather than skipping directly into authenticated state.

An action can contain a short sequence such as filling and submitting a login form. Every individual click, input, and form submission still occurs in the browser. State guards prevent submitting a spin without a game modal or withdrawing successfully without funds. Error nodes deliberately test the application's rejection behavior. Retry counts mean additional attempts, and only navigation/reload nodes retry automatically; financial and account mutations are not blindly replayed.

Visitors have explorer, player, bonus-hunter, cautious, or frustrated personas, with varied desktop viewports and about 30% mobile visits. They type with delays, pause, scroll, change filters, favorite games, abandon modals, inspect help/social placeholders, and sometimes leave before converting. Spins repeat one to four times with affordable bets; zero-balance players can hit a rejection and return to the cashier or bonus flow. Caps and a global deadline prevent infinite walks.

The seed reproduces decisions under the same state and timing. Server spin outcomes, generated credentials, account IDs, and timing-dependent UI state are not seeded, so complete visits are not byte-for-byte deterministic.

Built frontend assets are best for sustained simulations. Vite can reload open pages when files or HTML test reports change, interrupting a modal flow. If using SQLite for local verification, use one PHP server worker (`PHP_CLI_SERVER_WORKERS=1`) to avoid simultaneous transaction-upgrade locks; browser workers can still run concurrently. The normal MySQL preview uses row locks.

## Features and errors covered

| UI feature                | Actual route or behavior                                  | Simulation paths                                                                                                                    |
| ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Lobby, games, tournaments | `GET /`, `/games`, `/tournaments` through Inertia         | Navigation, reload, wandering                                                                                                       |
| Catalog                   | Vue search, category, provider, tag, ordering, pagination | Matching/empty search, filter reset, provider cards, favorites, carousel                                                            |
| Registration              | `POST /register`                                          | Successful signup, duplicate account, password mismatch, invalid phone, underage rejection                                          |
| Login                     | `POST /login`                                             | Remember-me toggle, returning login, wrong password, native email validation, six-attempt throttle                                  |
| Guest gates               | UI opens login instead of protected actions               | Game, wallet, bonus, tournament gates                                                                                               |
| Cashier                   | `POST /wallet/deposit`, `/wallet/withdraw`                | Payment method/preset selection, custom amounts, deposits, withdrawals, insufficient balance, native amount validation, abandonment |
| Bonus codes               | `POST /bonuses`                                           | Both seeded codes, invalid code, duplicate redemption                                                                               |
| Games                     | `POST /games/{game}/spin`                                 | Repeated successful spins, no-funds rejection, invalid bet, result/balance checks                                                   |
| Wallet                    | `GET /wallet`                                             | History inspection and links to cashier/bonus                                                                                       |
| Profile/logout            | `PATCH /profile`, `POST /logout`                          | Edit name/email/phone, invalid phone, persistence, logout and re-login with updated email                                           |
| Tournaments               | `POST /tournaments/{tournament}/join`                     | Guest gate, membership, disabled joined button after reload                                                                         |
| Help/support/socials      | Toasts only                                               | Click and inspect/dismiss                                                                                                           |

Deposits and spins are demo operations. Favorites are component-local; search/filtering is client-side. There is no real payment failure, real game launch, password reset, or external support service to simulate. Seeded tournaments must still be open; unexpected server or UI errors are reported as failures, not disguised as expected outcomes.

## PostHog

Real browser actions trigger the existing PostHog automatic events. The simulator additionally captures `simulation_session_started`, `simulation_action`, and `simulation_session_finished`. Action properties include the node, outcome (`success`, `expected-error`, `blocked`, `abandoned`), step, page/modal, duration, balance, and HTTP status where applicable. Passwords are not included in event properties or JSONL logs.

All emitted events have `simulation=true`, `simulation_run_id`, `simulation_iteration`, `simulation_persona`, and `simulation_seed`. Filter on these properties in PostHog to inspect a run or exclude synthetic traffic from normal dashboards. Unregistered visitors keep anonymous distinct IDs until a successful UI signup/login; the simulator then identifies the account as `preview-user-{id}`, preserves identity on full reload, and resets it on logout. Profile creation follows the site's existing `person_profiles` setting, currently `always`. See [PostHog identification documentation](https://posthog.com/docs/data/anonymous-vs-identified-events).

The Blade initialization reads simulation metadata injected before page scripts execute. For these visitors it disables batching and opts out of the SDK's user-agent bot filter; otherwise headless browser captures are silently dropped. Normal visits retain bot filtering. This is an explicit simulation setting, not browser fingerprint spoofing. See [PostHog's capture implementation](https://github.com/PostHog/posthog-js/blob/main/packages/browser/src/posthog-core.ts).

`required` checks SDK loading and actual HTTP acknowledgements from ingestion endpoints. `optional` records analytics status without failing the visit for analytics delivery. `off` blocks PostHog network requests for offline verification. Successful HTTP ingestion confirms transport acceptance; the script does not query the PostHog project to verify downstream dashboard visibility. Requests from previous full-page documents and unload beacons can lose observable acknowledgements; these are reported separately as unconfirmed, never counted as accepted. Current-document pending requests and delivery failures fail required mode.

## Verification and logs

```sh
# Type checking and meaningful engine/guard/concurrency tests (no server needed)
npm run simulate:check
npm run simulate:test

# Exercise every supported action and error on desktop + mobile without sending analytics
npm run simulate -- --verify --workers 2 --speed 0 --analytics off --url http://localhost:8001

# Verify the same paths with live PostHog ingestion
npm run simulate -- --verify --workers 2 --speed 0 --url http://localhost:8001

# Reproducible random visits
npm run simulate -- --seed island-42 --workers 4 --iterations 20 --limit 5 --url http://localhost:8001
```

Each run prints its directory and writes:

- `events.jsonl`: timestamped action starts/outcomes, choices, transition candidates/weights, HTTP errors, retries, delivery acknowledgements, and session results.
- `summary.json`: seed, requested/started/completed/failed/interrupted visits, outcomes, per-action counts, coverage, and per-visit analytics counts.
- `session-N-failure.png` and `session-N-trace.zip`: unexpected failure artifacts. Inspect a trace with `npx playwright show-trace PATH`.

Logs and compiled scripts are ignored by Git. Synthetic credentials appear in browser traces because the forms are exercised; traces are local diagnostics.

Exit codes: `0` completed successfully, `1` unexpected error, `2` deadline, `130` SIGINT, `143` SIGTERM. A deadline or signal stops scheduling visits and closes active contexts; partial results remain available. The budget may leave requested visits unfinished, which the summary reports.
