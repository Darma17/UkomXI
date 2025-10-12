<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookDiscount;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class BookDiscountController extends Controller
{
    /**
     * Tampilkan semua diskon buku.
     */
    public function index()
    {
        $discounts = BookDiscount::with('book')->latest()->get();
        return response()->json($discounts);
    }

    /**
     * Tambahkan diskon baru untuk buku.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
            'percentage' => 'required|numeric|min:1|max:100',
            'start_date' => 'required|date|before_or_equal:end_date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $discount = BookDiscount::create($validated);

        return response()->json([
            'message' => 'Diskon buku berhasil ditambahkan',
            'data' => $discount,
        ], 201);
    }

    /**
     * Tampilkan satu diskon.
     */
    public function show($id)
    {
        $discount = BookDiscount::with('book')->findOrFail($id);
        return response()->json($discount);
    }

    /**
     * Update data diskon.
     */
    public function update(Request $request, $id)
    {
        $discount = BookDiscount::findOrFail($id);

        $validated = $request->validate([
            'percentage' => 'sometimes|numeric|min:1|max:100',
            'start_date' => 'sometimes|date|before_or_equal:end_date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
        ]);

        $discount->update($validated);

        return response()->json([
            'message' => 'Diskon buku berhasil diperbarui',
            'data' => $discount,
        ]);
    }

    /**
     * Hapus diskon.
     */
    public function destroy($id)
    {
        $discount = BookDiscount::findOrFail($id);
        $discount->delete();

        return response()->json(['message' => 'Diskon buku berhasil dihapus']);
    }

    /**
     * Tampilkan daftar buku dengan harga setelah diskon aktif (jika ada).
     */
    public function booksWithDiscount()
    {
        $books = Book::with('bookDiscounts')->get()->map(function ($book) {
            $activeDiscount = $book->bookDiscounts()
                ->whereDate('start_date', '<=', now())
                ->whereDate('end_date', '>=', now())
                ->orderByDesc('percentage')
                ->first();

            return [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'price' => $book->price,
                'discount_percentage' => $activeDiscount ? $activeDiscount->percentage : 0,
                'discounted_price' => $activeDiscount
                    ? round($book->price - ($book->price * $activeDiscount->percentage / 100), 2)
                    : $book->price,
            ];
        });

        return response()->json($books);
    }

    /**
     * Nonaktifkan diskon otomatis yang sudah kadaluarsa.
     */
    public function deactivateExpiredDiscounts()
    {
        $today = Carbon::today();

        $expired = BookDiscount::whereDate('end_date', '<', $today)->get();

        foreach ($expired as $discount) {
            $discount->delete();
        }

        return response()->json([
            'message' => count($expired) . ' diskon kadaluarsa dihapus',
        ]);
    }
}
