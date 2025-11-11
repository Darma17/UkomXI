<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
        // hanya admin/operator yang boleh menambah produk
        $u = $request->user();
        if (!$u) return response()->json(['message' => 'Unauthorized'], 401);
        if (!in_array($u->role, ['admin','operator'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $data = $request->validate([
            'category_id'   => 'required|exists:categories,id',
            'title'         => 'required|string',
            'author'        => 'required|string',
            'publisher'     => 'required|string',
            'publish_year'  => 'required|digits:4|integer',
            'description'   => 'nullable|string',
            'price'         => 'required|numeric',
            'modal_price'   => 'nullable|numeric',
            'stock'         => 'required|integer',
            'is_highlight'  => 'sometimes|boolean',
            // jangan pakai image/mimes (butuh fileinfo). Pakai file saja lalu cek ekstensi manual.
            'cover_image'   => 'nullable|file|max:5120',
        ]);

        try {
            if ($request->hasFile('cover_image')) {
                $file = $request->file('cover_image');
                if (! $file->isValid()) {
                    return response()->json(['message' => 'File upload tidak valid'], 422);
                }
                $orig = (string) $file->getClientOriginalName();
                $ext  = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
                $allowed = ['jpg','jpeg','png','webp'];
                if (!in_array($ext, $allowed, true)) {
                    return response()->json(['message' => 'Ekstensi tidak didukung. Izinkan: jpg, jpeg, png, webp'], 422);
                }
                $dest = storage_path('app/public/covers');
                if (!is_dir($dest)) { @mkdir($dest, 0775, true); }
                $filename = 'b'.time().'_'.Str::random(6).'.'.$ext;
                $file->move($dest, $filename);
                $abs = $dest.DIRECTORY_SEPARATOR.$filename;
                if (!is_file($abs)) {
                    Log::error('Gagal menyimpan cover_image', ['path' => $abs]);
                    return response()->json(['message' => 'Gagal menyimpan file gambar'], 500);
                }
                $data['cover_image'] = 'covers/'.$filename; // simpan relatif untuk diakses lewat /storage/...
            }

            $book = Book::create($data);
            return response()->json($book, 201);
        } catch (\Throwable $e) {
            Log::error('Book store failed', ['err' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal menambah produk'], 500);
        }
    }

    public function update(Request $request, Book $book)
    {
        // admin bebas update; operator dibatasi
        $u = $request->user();
        if (!$u) return response()->json(['message' => 'Unauthorized'], 401);
        if ($u->role === 'operator') {
            // Operator tidak boleh edit detail produk; gunakan add-stock
            return response()->json(['message' => 'Operator hanya boleh menambah stok'], 403);
        }
        $data = $request->validate([
            'category_id'   => 'sometimes|exists:categories,id',
            'title'         => 'sometimes|string',
            'author'        => 'sometimes|string',
            'publisher'     => 'sometimes|string',
            'publish_year'  => 'sometimes|digits:4|integer',
            'description'   => 'sometimes|nullable|string',
            'price'         => 'sometimes|numeric',
            'modal_price'   => 'sometimes|nullable|numeric',
            'stock'         => 'sometimes|integer',
            'is_highlight'  => 'sometimes|boolean',
            'cover_image'   => 'nullable|file|max:5120',
        ]);

        try {
            // handle ganti gambar jika ada file
            if ($request->hasFile('cover_image')) {
                $file = $request->file('cover_image');
                if (! $file->isValid()) {
                    return response()->json(['message' => 'File upload tidak valid'], 422);
                }
                $orig = (string) $file->getClientOriginalName();
                $ext  = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
                $allowed = ['jpg','jpeg','png','webp'];
                if (!in_array($ext, $allowed, true)) {
                    return response()->json(['message' => 'Ekstensi tidak didukung. Izinkan: jpg, jpeg, png, webp'], 422);
                }
                $dest = storage_path('app/public/covers');
                if (!is_dir($dest)) { @mkdir($dest, 0775, true); }
                $filename = 'b'.time().'_'.Str::random(6).'.'.$ext;
                $file->move($dest, $filename);
                $abs = $dest.DIRECTORY_SEPARATOR.$filename;
                if (!is_file($abs)) {
                    Log::error('Gagal menyimpan cover_image (update)', ['path' => $abs]);
                    return response()->json(['message' => 'Gagal menyimpan file gambar'], 500);
                }
                // hapus file lama jika ada
                if (!empty($book->cover_image)) {
                    $old = storage_path('app/public/'.ltrim($book->cover_image, '/'));
                    if (is_file($old)) { @unlink($old); }
                }
                $data['cover_image'] = 'covers/'.$filename;
            }

            $book->update($data);
            return response()->json($book);
        } catch (\Throwable $e) {
            Log::error('Book update failed', ['book_id' => $book->id, 'err' => $e->getMessage()]);
            return response()->json(['message' => 'Gagal memperbarui produk'], 500);
        }
    }

    public function destroy(Book $book)
    {
        // hanya admin yang boleh hapus
        $u = request()->user();
        if (!$u) return response()->json(['message' => 'Unauthorized'], 401);
        if ($u->role !== 'admin') return response()->json(['message' => 'Forbidden'], 403);
        $book->delete();
        return response()->json(['message' => 'Book deleted']);
    }

    // Tambah stok buku: admin/operator
    public function addStock(Request $request, Book $book)
    {
        $u = $request->user();
        if (!$u) return response()->json(['message' => 'Unauthorized'], 401);
        if (!in_array($u->role, ['admin','operator'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $data = $request->validate([
            'amount' => 'required|integer|min:1',
        ]);
        $book->stock = (int)$book->stock + (int)$data['amount'];
        $book->save();
        return response()->json($book);
    }

    public function highlights()
    {
        $books = Book::where('is_highlight', true)->get();
        return response()->json($books);
    }

}
