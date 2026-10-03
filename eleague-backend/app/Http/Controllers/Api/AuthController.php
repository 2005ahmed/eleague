<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'nickname' => ['required', 'string', 'max:100'],
        ]);

        $result = DB::transaction(function () use ($validated) {

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'player',
            ]);

            $player = Player::create([
                'user_id' => $user->id,
                'nickname' => $validated['nickname'],
                'country' => 'MA',
            ]);

            $token = $user->createToken('eLeague')->plainTextToken;

            return [
                'user' => $user,
                'player' => $player,
                'token' => $token,
            ];
        });

        return response()->json([
            'message' => 'Compte créé avec succès',
            ...$result,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where(
            'email',
            $validated['email']
        )->first();

        if (
            !$user ||
            !Hash::check(
                $validated['password'],
                $user->password
            )
        ) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        $token = $user->createToken('eLeague')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'token' => $token,
            'user' => $user,
            'player' => $user->player,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
            'player' => $request->user()->player,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()
            ->currentAccessToken()
            ->delete();

        return response()->json([
            'message' => 'Déconnexion réussie',
        ]);
    }


    public function becomeOrganizer(Request $request)
{
    $user = $request->user();

    if ($user->role === 'admin') {
        return response()->json([
            'message' => 'Admin already has organizer permissions.',
            'user' => $user,
        ]);
    }

    if ($user->is_organizer) {
        return response()->json([
            'message' => 'Organizer mode is already enabled.',
            'user' => $user,
        ]);
    }

    $user->update([
        'is_organizer' => true,
    ]);

    return response()->json([
        'message' => 'Organizer mode activated successfully.',
        'user' => $user->fresh(),
    ]);
}
}
