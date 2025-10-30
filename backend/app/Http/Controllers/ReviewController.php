<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'book_id' => 'required|exists:books,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string'
        ]);

        $review = Review::create($data);
        // Sertakan user pada response agar FE bisa menampilkan nama
        return response()->json($review->load('user'), 201);
    }

    // Ambil review; dukung filter ?user_id=&book_id= untuk ambil satu review user pada buku
    public function index(Request $request)
    {
        $query = Review::with('user');
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }
        if ($request->filled('book_id')) {
            $query->where('book_id', $request->input('book_id'));
        }
        // Jika kedua filter ada, kembalikan satu (pertama) agar FE mudah konsumsi
        if ($request->filled('user_id') && $request->filled('book_id')) {
            $rev = $query->first();
            if (! $rev) {
                return response()->json(['message' => 'Not found'], 404);
            }
            return response()->json($rev);
        }
        return response()->json($query->get());
    }

    // Edit review (rating/comment)
    public function update(Request $request, Review $review)
    {
        $data = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string'
        ]);
        // Opsional: batasi hanya pemilik yang boleh edit
        if ($request->user() && (int)$request->user()->id !== (int)$review->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $review->update($data);
        return response()->json($review->load('user'));
    }
}
