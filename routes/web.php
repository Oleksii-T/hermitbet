<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BonusController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SpinController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CatalogController::class, 'index'])->name('home');
Route::get('/games', [CatalogController::class, 'index'])->name('games');
Route::get('/tournaments', [CatalogController::class, 'index'])->name('tournaments');
Route::middleware('guest')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});
Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::get('/wallet', [WalletController::class, 'index'])->name('wallet.index');
    Route::post('/wallet/deposit', [WalletController::class, 'deposit'])->name('wallet.deposit');
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw'])->name('wallet.withdraw');
    Route::post('/bonuses', [BonusController::class, 'store'])->name('bonuses.store');
    Route::post('/games/{game}/spin', [SpinController::class, 'store'])->name('spin.store');
    Route::post('/tournaments/{tournament}/join', [CatalogController::class, 'join'])->name('tournaments.join');
});
