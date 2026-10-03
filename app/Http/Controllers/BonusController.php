<?php

namespace App\Http\Controllers;

use App\Models\BonusCode;
use App\Models\BonusRedemption;
use App\Models\User;
use App\WalletOperation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BonusController extends Controller
{
    public function store(Request $request, WalletOperation $wallet): JsonResponse
    {
        $request->validate(['code' => ['required', 'string', 'max:40']]);

        return DB::transaction(function () use ($request, $wallet): JsonResponse {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);
            $bonus = BonusCode::where('code', $request->string('code')->trim()->upper()->toString())->where('is_active', true)->first();
            if ($bonus === null || ($bonus->expires_at !== null && $bonus->expires_at->isPast())) {
                throw ValidationException::withMessages(['code' => 'That bonus code is invalid or expired. Try SHELL100.']);
            }
            if (BonusRedemption::where('user_id', $user->id)->where('bonus_code_id', $bonus->id)->exists()) {
                throw ValidationException::withMessages(['code' => 'You have already redeemed this bonus code.']);
            }
            BonusRedemption::create(['user_id' => $user->id, 'bonus_code_id' => $bonus->id]);
            $wallet->record($user, $bonus->amount, 'bonus', 'Bonus · '.$bonus->code);

            return response()->json(['user' => $user, 'message' => 'Bonus unlocked! '.number_format($bonus->amount / 100, 2).' demo credits added.']);
        }, 3);
    }
}
