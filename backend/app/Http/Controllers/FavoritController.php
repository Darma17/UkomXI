<?php

namespace App\Http\Controllers;

use App\Models\Favorit;
use Illuminate\Http\Request;

class FavoritController extends Controller
{
    // GET /api/favorits -> daftar favorit milik user login
    public function index(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $items = Favorit::with('book')->where('user_id', $user->id)->get();
        return response()->json($items);
    }

    // POST /api/favorits { book_id } -> tambah favorit untuk user login
    public function store(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $data = $request->validate([
            'book_id' => 'required|exists:books,id',
        ]);
        $fav = Favorit::firstOrCreate([
            'user_id' => $user->id,
            'book_id' => $data['book_id'],
        ]);
        return response()->json($fav->load('book'), 201);
    }

    // DELETE /api/favorits/{favorit} -> hapus favorit milik user login
    public function destroy(Request $request, Favorit $favorit)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        if ((int) $favorit->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $favorit->delete();
        return response()->json(['message' => 'Favorit deleted']);
    }

    // DELETE /api/favorits/by-book/{book_id}
    public function destroyByBook(Request $request, int $bookId)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $fav = Favorit::where('user_id', $user->id)->where('book_id', $bookId)->first();
        if (! $fav) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $fav->delete();
        return response()->json(['message' => 'Favorit deleted']);
    }
}
