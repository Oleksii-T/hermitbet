<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([...$request->safe()->except('password_confirmation'), 'name' => $request->string('username')->toString()]);
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $user->fresh(), 'message' => 'Welcome to the island! Your preview account is ready.'], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $attempts = array_filter($request->session()->get('login_attempts', []), fn (int $time): bool => $time > time() - 60);
        if (count($attempts) >= 5) {
            throw ValidationException::withMessages(['email' => 'Too many attempts. Please wait one minute before trying again.']);
        }
        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->put('login_attempts', [...$attempts, time()]);
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }
        $request->session()->forget('login_attempts');
        $request->session()->regenerate();

        return response()->json(['user' => $request->user(), 'message' => 'Welcome back to your little escape.']);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['user' => null, 'message' => 'You have been logged out.']);
    }
}
