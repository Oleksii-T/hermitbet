<?php

use App\Models\Bet;
use App\Models\BonusCode;
use App\Models\Game;
use App\Models\Tournament;
use App\Models\User;
use App\Models\WalletTransaction;
use App\SpinOutcome;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Mockery\MockInterface;

function explorerWithCredits(int $balance = 10000): User
{
    $user = User::factory()->unverified()->create();
    $user->forceFill(['balance' => $balance])->save();

    return $user;
}

function registrationDetails(array $overrides = []): array
{
    return array_replace(['username' => 'newexplorer', 'email' => 'explorer@example.test', 'phone' => '+420 777 111 222', 'birth_date' => '1995-06-15', 'password' => 'IslandPass123!', 'password_confirmation' => 'IslandPass123!'], $overrides);
}

test('renders lobby, catalog and tournaments with 120 fictional games and six providers', function (string $routeName, string $section) {
    $this->seed(DatabaseSeeder::class);

    $this->get(route($routeName))->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Casino')->where('section', $section)->has('games', 120)->has('providers', 6)->has('tournaments', 3)->where('auth.user', null));
})->with(['lobby' => ['home', 'lobby'], 'games' => ['games', 'games'], 'tournaments' => ['tournaments', 'tournaments']]);

test('seeding twice preserves the catalog and existing wallet balance', function () {
    $this->seed(DatabaseSeeder::class);
    $user = User::where('email', 'demo@hermit.test')->firstOrFail();
    $user->forceFill(['balance' => 34000])->save();

    $this->seed(DatabaseSeeder::class);

    $this->assertDatabaseCount('games', 120);
    $this->assertDatabaseCount('game_providers', 6);
    $this->assertDatabaseCount('wallet_transactions', 1);
    expect($user->fresh()->balance)->toBe(34000);
});

test('registers and logs in an adult without sending verification or accepting a client balance', function () {
    Mail::fake();
    Notification::fake();

    $response = $this->postJson(route('register'), registrationDetails(['balance' => 9999999, 'email_verified_at' => now()]));

    $response->assertCreated()->assertJsonPath('user.username', 'newexplorer')->assertJsonPath('user.balance', 0)->assertJsonMissingPath('user.password')->assertJsonPath('user.email_verified_at', null);
    $user = User::where('email', 'explorer@example.test')->firstOrFail();
    $this->assertAuthenticatedAs($user);
    expect(Hash::check('IslandPass123!', $user->password))->toBeTrue();
    Mail::assertNothingSent();
    Notification::assertNothingSent();
});

test('returns 422 for invalid registration without creating an account', function (array $override, string $field) {
    $this->freezeTime();

    $this->postJson(route('register'), registrationDetails($override))->assertUnprocessable()->assertJsonValidationErrors($field);

    $this->assertDatabaseCount('users', 0);
    $this->assertGuest();
})->with([
    'missing username' => [['username' => ''], 'username'],
    'short username' => [['username' => 'ab'], 'username'],
    'unsafe username' => [['username' => '<script>'], 'username'],
    'invalid email' => [['email' => 'not-an-email'], 'email'],
    'invalid phone' => [['phone' => 'abc'], 'phone'],
    'minor' => [['birth_date' => '2015-01-01'], 'birth_date'],
    'invalid date' => [['birth_date' => 'yesterday'], 'birth_date'],
    'weak password' => [['password' => 'abc', 'password_confirmation' => 'abc'], 'password'],
    'mismatched passwords' => [['password_confirmation' => 'different-password'], 'password'],
]);

test('returns 422 for duplicate email and username', function () {
    User::factory()->create(['username' => 'newexplorer', 'email' => 'explorer@example.test']);

    $this->postJson(route('register'), registrationDetails())->assertUnprocessable()->assertJsonValidationErrors(['email', 'username']);

    $this->assertDatabaseCount('users', 1);
});

test('logs in an unverified account and logs out', function () {
    $user = User::factory()->unverified()->create();

    $this->postJson(route('login'), ['email' => $user->email, 'password' => 'password'])->assertOk()->assertJsonPath('user.id', $user->id);
    $this->assertAuthenticatedAs($user);
    $this->postJson(route('logout'))->assertOk()->assertJsonPath('user', null);
    $this->assertGuest();
});

test('returns 422 for incorrect credentials and limits repeated login attempts without cache', function () {
    $user = User::factory()->create();
    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->postJson(route('login'), ['email' => $user->email, 'password' => 'wrong'])->assertUnprocessable()->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
    }

    $this->postJson(route('login'), ['email' => $user->email, 'password' => 'password'])->assertUnprocessable()->assertJsonPath('errors.email.0', 'Too many attempts. Please wait one minute before trying again.');

    $this->assertGuest();
});

test('returns 401 for unauthenticated wallet and account mutations', function (string $method, string $routeName) {
    $game = Game::factory()->create();
    $parameters = $routeName === 'spin.store' ? ['game' => $game->id] : [];

    $this->{$method}(route($routeName, $parameters), [])->assertUnauthorized();

    $this->assertDatabaseCount('wallet_transactions', 0);
    $this->assertDatabaseCount('bets', 0);
})->with([
    ['postJson', 'wallet.deposit'], ['postJson', 'wallet.withdraw'], ['postJson', 'bonuses.store'], ['postJson', 'spin.store'], ['patchJson', 'profile.update'], ['getJson', 'wallet.index'],
]);

test('updates only the signed-in profile without changing the balance or another user', function () {
    $user = explorerWithCredits();
    $other = User::factory()->create();

    $this->actingAs($user)->patchJson(route('profile.update'), ['name' => 'New Explorer', 'email' => 'new@example.test', 'phone' => '+420 777 333 222', 'id' => $other->id, 'balance' => 900000])->assertOk()->assertJsonPath('user.name', 'New Explorer');

    $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'New Explorer', 'email' => 'new@example.test', 'phone' => '+420 777 333 222', 'balance' => 10000]);
    expect($other->fresh()->name)->toBe($other->name);
});

test('returns 422 when a profile email belongs to another account', function () {
    $user = explorerWithCredits();
    $other = User::factory()->create();

    $this->actingAs($user)->patchJson(route('profile.update'), ['name' => 'Changed', 'email' => $other->email, 'phone' => '+420 777 333 222'])->assertUnprocessable()->assertJsonValidationErrors('email');

    expect($user->fresh()->name)->toBe($user->name);
});

test('deposits exact demo credits using all four simulated payment methods', function (string $method) {
    $user = explorerWithCredits(0);

    $this->actingAs($user)->postJson(route('wallet.deposit'), ['amount' => '25.37', 'method' => $method, 'request_id' => (string) Str::uuid()])->assertOk()->assertJsonPath('user.balance', 2537);

    $this->assertDatabaseHas('wallet_transactions', ['user_id' => $user->id, 'amount' => 2537, 'balance_after' => 2537, 'type' => 'deposit']);
})->with(['card', 'bank', 'apple', 'crypto']);

test('does not double credit a retried deposit', function () {
    $user = explorerWithCredits(0);
    $data = ['amount' => '50', 'method' => 'card', 'request_id' => (string) Str::uuid()];
    $this->actingAs($user)->postJson(route('wallet.deposit'), $data)->assertOk();

    $this->postJson(route('wallet.deposit'), $data)->assertOk()->assertJsonPath('user.balance', 5000);

    $this->assertDatabaseCount('wallet_transactions', 1);
});

test('returns 422 for invalid cashier inputs without changing credits', function (array $override, string $field) {
    $user = explorerWithCredits();
    $data = array_replace(['amount' => '20', 'method' => 'card', 'request_id' => (string) Str::uuid()], $override);

    $this->actingAs($user)->postJson(route('wallet.deposit'), $data)->assertUnprocessable()->assertJsonValidationErrors($field);

    expect($user->fresh()->balance)->toBe(10000);
    $this->assertDatabaseCount('wallet_transactions', 0);
})->with([
    'negative' => [['amount' => '-5'], 'amount'], 'zero' => [['amount' => '0'], 'amount'],
    'too large' => [['amount' => '10001'], 'amount'], 'fractional cent' => [['amount' => '1.001'], 'amount'],
    'invalid method' => [['method' => 'real-bank'], 'method'], 'missing method' => [['method' => null], 'method'],
    'invalid request key' => [['request_id' => 'bad'], 'request_id'],
]);

test('withdraws demo credits and prevents a retried withdrawal from deducting twice', function () {
    $user = explorerWithCredits();
    $data = ['amount' => '25.37', 'request_id' => (string) Str::uuid()];
    $this->actingAs($user)->postJson(route('wallet.withdraw'), $data)->assertOk()->assertJsonPath('user.balance', 7463);

    $this->postJson(route('wallet.withdraw'), $data)->assertOk()->assertJsonPath('user.balance', 7463);

    $this->assertDatabaseCount('wallet_transactions', 1);
    $this->assertDatabaseHas('wallet_transactions', ['user_id' => $user->id, 'type' => 'withdrawal', 'amount' => -2537, 'balance_after' => 7463]);
});

test('returns 422 when a withdrawal exceeds the demo balance', function () {
    $user = explorerWithCredits(1000);

    $this->actingAs($user)->postJson(route('wallet.withdraw'), ['amount' => '11', 'request_id' => (string) Str::uuid()])->assertUnprocessable()->assertJsonPath('errors.amount.0', 'Not enough demo credits. Top up your wallet to keep exploring.');

    expect($user->fresh()->balance)->toBe(1000);
    $this->assertDatabaseCount('wallet_transactions', 0);
});

test('redeems a case-insensitive bonus once per user and rejects reuse with 422', function () {
    $user = explorerWithCredits(0);
    BonusCode::create(['code' => 'SHELL100', 'amount' => 10000, 'is_active' => true]);
    $this->actingAs($user)->postJson(route('bonuses.store'), ['code' => ' shell100 '])->assertOk()->assertJsonPath('user.balance', 10000);

    $this->postJson(route('bonuses.store'), ['code' => 'SHELL100'])->assertUnprocessable()->assertJsonPath('errors.code.0', 'You have already redeemed this bonus code.');

    $this->assertDatabaseCount('bonus_redemptions', 1);
    $this->assertDatabaseHas('wallet_transactions', ['user_id' => $user->id, 'type' => 'bonus', 'amount' => 10000]);
    expect($user->fresh()->balance)->toBe(10000);
});

test('returns 422 for an invalid inactive or expired bonus', function (string $state) {
    $user = explorerWithCredits(0);
    $this->freezeTime();
    if ($state !== 'missing') {
        BonusCode::create(['code' => 'INVALID', 'amount' => 10000, 'is_active' => $state !== 'inactive', 'expires_at' => $state === 'expired' ? now()->subDay() : null]);
    }

    $this->actingAs($user)->postJson(route('bonuses.store'), ['code' => 'INVALID'])->assertUnprocessable()->assertJsonValidationErrors('code');

    $this->assertDatabaseCount('bonus_redemptions', 0);
    $this->assertDatabaseCount('wallet_transactions', 0);
    expect($user->fresh()->balance)->toBe(0);
})->with(['missing', 'inactive', 'expired']);

test('creates one bet and one win and updates credits for each simulated outcome', function (int $multiplier, int $win, int $balance) {
    $user = explorerWithCredits();
    $game = Game::factory()->create();
    $this->mock(SpinOutcome::class, function (MockInterface $mock) use ($multiplier) {
        $mock->shouldReceive('multiplier')->once()->andReturn($multiplier);
    });

    $this->actingAs($user)->postJson(route('spin.store', $game), ['amount' => '2.50', 'request_id' => (string) Str::uuid()])->assertCreated()->assertJsonPath('user.balance', $balance)->assertJsonPath('win.amount', $win)->assertJsonPath('win.multiplier', $multiplier);

    $this->assertDatabaseHas('bets', ['user_id' => $user->id, 'game_id' => $game->id, 'amount' => 250]);
    $this->assertDatabaseHas('wins', ['bet_id' => Bet::firstOrFail()->id, 'amount' => $win]);
    $this->assertDatabaseCount('wallet_transactions', 2);
    expect($user->fresh()->balance)->toBe($balance);
})->with(['loss' => [0, 0, 9750], 'break even' => [1, 250, 10000], 'double' => [2, 500, 10250], 'five times' => [5, 1250, 11000]]);

test('does not replay a spin with the same request key', function () {
    $user = explorerWithCredits();
    $game = Game::factory()->create();
    $this->mock(SpinOutcome::class, fn (MockInterface $mock) => $mock->shouldReceive('multiplier')->once()->andReturn(2));
    $data = ['amount' => '1', 'request_id' => (string) Str::uuid()];
    $this->actingAs($user)->postJson(route('spin.store', $game), $data)->assertCreated();

    $this->postJson(route('spin.store', $game), [...$data, 'win_amount' => '0'])->assertOk()->assertJsonPath('user.balance', 10100)->assertJsonPath('win.amount', 200);

    $this->assertDatabaseCount('bets', 1);
    $this->assertDatabaseCount('wins', 1);
    $this->assertDatabaseCount('wallet_transactions', 2);
});

test('rolls the dice when the manual payout is omitted null or empty', function (array $override) {
    $user = explorerWithCredits();
    $game = Game::factory()->create();
    $this->mock(SpinOutcome::class, fn (MockInterface $mock) => $mock->shouldReceive('multiplier')->once()->andReturn(2));

    $this->actingAs($user)->postJson(route('spin.store', $game), [
        'amount' => '2.50', 'request_id' => (string) Str::uuid(), ...$override,
    ])->assertCreated()->assertJsonPath('win.amount', 500)->assertJsonPath('win.multiplier', 2)->assertJsonPath('user.balance', 10250);
})->with([
    'omitted' => [[]],
    'null' => [['win_amount' => null]],
    'empty' => [['win_amount' => '']],
]);

test('pays the exact manual amount without rolling the dice', function (string|int $winAmount, int $payout) {
    $user = explorerWithCredits();
    $game = Game::factory()->create();
    $this->mock(SpinOutcome::class, fn (MockInterface $mock) => $mock->shouldNotReceive('multiplier'));

    $this->actingAs($user)->postJson(route('spin.store', $game), [
        'amount' => '2.50', 'win_amount' => $winAmount, 'request_id' => (string) Str::uuid(),
    ])->assertCreated()->assertJsonPath('win.amount', $payout)->assertJsonPath('win.multiplier', null)->assertJsonPath('user.balance', 9750 + $payout);

    $bet = Bet::firstOrFail();
    $this->assertDatabaseHas('bets', ['id' => $bet->id, 'amount' => 250]);
    $this->assertDatabaseHas('wins', ['bet_id' => $bet->id, 'amount' => $payout, 'multiplier' => null]);
    $this->assertDatabaseHas('wallet_transactions', ['user_id' => $user->id, 'type' => 'win', 'amount' => $payout, 'balance_after' => 9750 + $payout]);
    $this->assertDatabaseCount('wallet_transactions', 2);
    expect($user->fresh()->balance)->toBe(9750 + $payout);
})->with([
    'numeric zero' => [0, 0],
    'string zero' => ['0', 0],
    'decimal zero' => ['0.00', 0],
    'fractional payout' => ['1.37', 137],
    'larger than stake' => ['7.31', 731],
    'numeric positive' => [5, 500],
    'maximum stored payout' => ['42949672.95', 4294967295],
]);

test('preserves a manual outcome when its request key is retried with a different override', function () {
    $user = explorerWithCredits();
    $game = Game::factory()->create();
    $this->mock(SpinOutcome::class, fn (MockInterface $mock) => $mock->shouldNotReceive('multiplier'));
    $data = ['amount' => '1', 'win_amount' => '0', 'request_id' => (string) Str::uuid()];
    $this->actingAs($user)->postJson(route('spin.store', $game), $data)->assertCreated();

    $this->postJson(route('spin.store', $game), [...$data, 'win_amount' => '7.31'])->assertOk()->assertJsonPath('user.balance', 9900)->assertJsonPath('win.amount', 0)->assertJsonPath('win.multiplier', null);
    $this->postJson(route('spin.store', $game), [...$data, 'win_amount' => ''])->assertOk()->assertJsonPath('user.balance', 9900)->assertJsonPath('win.amount', 0);

    $this->assertDatabaseCount('bets', 1);
    $this->assertDatabaseCount('wins', 1);
    $this->assertDatabaseCount('wallet_transactions', 2);
});

test('rejects invalid manual payouts without changing credits or rolling the dice', function (mixed $winAmount) {
    $user = explorerWithCredits();
    $game = Game::factory()->create();
    $this->mock(SpinOutcome::class, fn (MockInterface $mock) => $mock->shouldNotReceive('multiplier'));

    $this->actingAs($user)->postJson(route('spin.store', $game), [
        'amount' => '1', 'win_amount' => $winAmount, 'request_id' => (string) Str::uuid(),
    ])->assertUnprocessable()->assertJsonValidationErrors('win_amount');

    $this->assertDatabaseCount('bets', 0);
    $this->assertDatabaseCount('wins', 0);
    $this->assertDatabaseCount('wallet_transactions', 0);
    expect($user->fresh()->balance)->toBe(10000);
})->with(['-0.01', '1.001', 'not-a-number', '42949672.96', true, [['unexpected']]]);

test('returns 422 for a spin with insufficient funds and leaves no partial bet or win', function () {
    $user = explorerWithCredits(50);
    $game = Game::factory()->create();

    $this->actingAs($user)->postJson(route('spin.store', $game), ['amount' => '1', 'win_amount' => '100', 'request_id' => (string) Str::uuid()])->assertUnprocessable()->assertJsonValidationErrors('amount');

    $this->assertDatabaseCount('bets', 0);
    $this->assertDatabaseCount('wins', 0);
    $this->assertDatabaseCount('wallet_transactions', 0);
    expect($user->fresh()->balance)->toBe(50);
});

test('returns 422 for an invalid spin amount', function (string $amount) {
    $user = explorerWithCredits();
    $game = Game::factory()->create();

    $this->actingAs($user)->postJson(route('spin.store', $game), ['amount' => $amount, 'request_id' => (string) Str::uuid()])->assertUnprocessable()->assertJsonValidationErrors('amount');

    $this->assertDatabaseCount('bets', 0);
    expect($user->fresh()->balance)->toBe(10000);
})->with(['-1', '0', '0.09', '100.01', '1.001', 'not-a-number']);

test('returns 404 for spinning an unknown game', function () {
    $user = explorerWithCredits();

    $this->actingAs($user)->postJson(route('spin.store', ['game' => 99999]), ['amount' => '1', 'request_id' => (string) Str::uuid()])->assertNotFound();

    $this->assertDatabaseCount('bets', 0);
});

test('returns only the signed-in users wallet history', function () {
    $user = explorerWithCredits();
    $other = explorerWithCredits();
    WalletTransaction::create(['user_id' => $user->id, 'type' => 'deposit', 'amount' => 10000, 'balance_after' => 10000, 'description' => 'My top-up']);
    WalletTransaction::create(['user_id' => $other->id, 'type' => 'deposit', 'amount' => 20000, 'balance_after' => 20000, 'description' => 'Other top-up']);

    $this->actingAs($user)->getJson(route('wallet.index'))->assertOk()->assertJsonCount(1, 'transactions')->assertJsonPath('transactions.0.description', 'My top-up')->assertJsonPath('user.id', $user->id);
});

test('saves tournament membership once for a signed-in explorer', function () {
    $this->seed(DatabaseSeeder::class);
    $user = explorerWithCredits();
    $tournament = Tournament::firstOrFail();
    $this->actingAs($user)->from(route('tournaments'))->post(route('tournaments.join', $tournament))->assertRedirect(route('tournaments'));

    $this->from(route('tournaments'))->post(route('tournaments.join', $tournament))->assertRedirect(route('tournaments'));

    $this->assertDatabaseCount('tournament_user', 1);
    $this->assertDatabaseHas('tournament_user', ['user_id' => $user->id, 'tournament_id' => $tournament->id]);
    expect($user->fresh()->balance)->toBe(10000);
});

test('returns 422 when attempting to join an ended tournament', function () {
    $this->seed(DatabaseSeeder::class);
    $user = explorerWithCredits();
    $tournament = Tournament::firstOrFail();
    $tournament->update(['ends_at' => now()->subDay()]);

    $this->actingAs($user)->postJson(route('tournaments.join', $tournament))->assertUnprocessable();

    $this->assertDatabaseCount('tournament_user', 0);
});
