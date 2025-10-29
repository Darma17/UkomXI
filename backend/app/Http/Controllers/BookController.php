<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookController extends Controller
{
    public function index(Request $request)
    {
        // Support search suggestions and general search via ?q=... (&limit=5,&prefix=1)
        $q = $request->query('q');
        $limit = (int) $request->query('limit', 0); // 0 means no limit
        $prefix = $request->query('prefix', null); // if present -> prefix search

        $query = Book::with('category');
        if ($q !== null && $q !== '') {
            $q = trim($q);
            if ($prefix) {
                // suggestions: titles starting with q (case-insensitive)
                $query->where('title', 'like', $q . '%');
            } else {
                // general search: anywhere in title
                $query->where('title', 'like', '%' . $q . '%');
            }
        }

        if ($limit > 0) {
            $query->limit($limit);
        }

        return response()->json($query->get());
    }

    public function show(Book $book)
    {
        // Eager load user pada setiap review agar nama user tampil di FE
        $book->load('category', 'reviews.user');
        // Hitung total terjual (qty) dari order_items untuk buku ini pada orders yang complete = 1
        $sold = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('order_items.book_id', $book->id)
            ->where('orders.complete', 1)
            ->sum('order_items.quantity');
        $book->setAttribute('sold_count', (int) $sold);
        return response()->json($book);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string',
            'author' => 'required|string',
            'publisher' => 'required|string',
            'publish_year' => 'required|digits:4|integer',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048', // ubah ke file image
        ]);

        // Upload gambar jika ada
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('covers', 'public'); 
            // hasil path misal: covers/namafile.jpg
            $data['cover_image'] = $path;
        }

        $book = Book::create($data);

        // kembalikan full URL supaya bisa langsung diakses di React
        $book->cover_image = $book->cover_image ? asset('storage/' . $book->cover_image) : null;

        return response()->json($book, 201);
    }


    public function update(Request $request, Book $book)
    {
        $book->update($request->all());
        return response()->json($book);
    }

    public function destroy(Book $book)
    {
        $book->delete();
        return response()->json(['message' => 'Book deleted']);
    }

    public function highlights()
    {
        $books = Book::where('is_highlight', true)->get();
        return response()->json($books);
    }

}
