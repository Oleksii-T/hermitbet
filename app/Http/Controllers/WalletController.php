<?php

namespace App\Http\Controllers;

use App\Http\Requests\WalletRequest;
use App\Models\User;
use App\Models\WalletTransaction;
use App\WalletOperation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user(), 'transactions' => WalletTransaction::where('user_id', $request->user()->id)->latest('id')->limit(30)->get()]);
    }

    public function deposit(WalletRequest $request, WalletOperation $wallet): JsonResponse
    {
        return $this->transfer($request, $wallet, false);
    }

    public function withdraw(WalletRequest $request, WalletOperation $wallet): JsonResponse
    {
        return $this->transfer($request, $wallet, true);
    }

    private function transfer(WalletRequest $request, WalletOperation $wallet, bool $withdraw): JsonResponse
    {
        return DB::transaction(function () use ($request, $wallet, $withdraw): JsonResponse {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $requestId = $request->string('request_id')->toString();
            if (! WalletTransaction::where('user_id', $user->id)->where('request_id', $requestId)->exists()) {
                $amount = $wallet->cents($request->string('amount')->toString());
                $wallet->record($user, $withdraw ? -$amount : $amount, $withdraw ? 'withdrawal' : 'deposit', $withdraw ? 'Demo withdrawal' : 'Demo top-up · '.$request->string('method'), $requestId);
            }

            return response()->json(['user' => $user, 'message' => $withdraw ? 'Demo withdrawal complete. No real money was transferred.' : 'Your demo credits have landed!']);
        }, 3);
    }
}
