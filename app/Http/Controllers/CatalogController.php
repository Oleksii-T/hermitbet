<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\GameProvider;
use App\Models\Tournament;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Casino', [
            'section' => $request->routeIs('games') ? 'games' : ($request->routeIs('tournaments') ? 'tournaments' : 'lobby'),
            'games' => Game::with('provider')->orderByDesc('popularity')->orderBy('id')->get(),
            'providers' => GameProvider::withCount('games')->orderBy('id')->get(),
            'tournaments' => Tournament::orderBy('starts_at')->get(),
            'joinedTournaments' => $request->user()?->tournaments()->pluck('tournaments.id') ?? [],
        ]);
    }

    public function join(Request $request, Tournament $tournament): RedirectResponse
    {
        abort_if($tournament->ends_at->isPast(), 422, 'This tournament has ended.');
        $request->user()->tournaments()->syncWithoutDetaching([$tournament->id]);

        return back();
    }
}
