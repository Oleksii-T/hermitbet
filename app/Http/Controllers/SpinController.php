<?php

namespace App\Http\Controllers;

use App\Models\Bet;
use App\Models\Game;
use App\Models\User;
use App\Models\Win;
use App\SpinOutcome;
use App\WalletOperation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SpinController extends Controller
{
    public function store(Request $request, Game $game, WalletOperation $wallet, SpinOutcome $outcome): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'numeric', 'decimal:0,2', 'min:0.1', 'max:100'],
            'win_amount' => ['nullable', 'numeric', 'decimal:0,2', 'min:0', 'max:42949672.95'],
            'request_id' => ['required', 'uuid'],
        ]);

        return DB::transaction(function () use ($request, $game, $wallet, $outcome): JsonResponse {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $requestId = $request->string('request_id')->toString();
            $bet = Bet::with('win')->where('user_id', $user->id)->where('request_id', $requestId)->first();
            if ($bet !== null) {
                return response()->json(['user' => $user, 'bet' => $bet, 'win' => $bet->win]);
            }
            $amount = $wallet->cents($request->string('amount')->toString());
            $wallet->record($user, -$amount, 'bet', 'Spin · '.$game->name);
            $bet = Bet::create(['user_id' => $user->id, 'game_id' => $game->id, 'amount' => $amount, 'request_id' => $requestId]);
            if ($request->filled('win_amount')) {
                $winAmount = $wallet->cents($request->string('win_amount')->toString());
                $multiplier = null;
            } else {
                $multiplier = $outcome->multiplier();
                $winAmount = $amount * $multiplier;
            }
            $win = Win::create(['bet_id' => $bet->id, 'amount' => $winAmount, 'multiplier' => $multiplier]);
            $wallet->record($user, $win->amount, 'win', 'Result · '.$game->name);

            return response()->json(['user' => $user, 'bet' => $bet, 'win' => $win], 201);
        }, 3);
    }
}
