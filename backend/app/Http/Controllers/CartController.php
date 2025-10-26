<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Book;
use App\Models\CartItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    public function index()
    {
        return response()->json(Cart::with('items.book')->get());
    }

    public function show(Cart $cart)
    {
        return response()->json($cart->load('items.book'));
    }

    public function store(Request $request)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);
        $cart = Cart::create(['user_id' => $request->user_id]);
        return response()->json($cart, 201);
    }

    public function destroy(Cart $cart)
    {
        $cart->delete();
        return response()->json(['message' => 'Cart deleted']);
    }

    public function count(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['count' => 0]);
        }

        $cart = Cart::with('items')->where('user_id', $user->id)->first();
        $total = 0;
        if ($cart && $cart->items) {
            foreach ($cart->items as $item) {
                $total += (int) $item->quantity;
            }
        }

        return response()->json(['count' => $total]);
    }

    // NEW: add one item (quantity +1) to current user's cart
    public function addItem(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
            'quantity' => 'sometimes|integer|min:1'
        ]);

        $qtyToAdd = $validated['quantity'] ?? 1;
        $book = Book::find($validated['book_id']);

        if (! $book) {
            return response()->json(['message' => 'Book not found'], 404);
        }

        // ensure cart exists
        $cart = Cart::firstOrCreate(['user_id' => $user->id], [
            'total_qty' => 0,
            'total_price' => 0,
        ]);

        DB::transaction(function () use ($cart, $book, $qtyToAdd, &$item) {
            // find existing item
            $item = CartItem::where('cart_id', $cart->id)
                ->where('book_id', $book->id)
                ->first();

            if ($item) {
                $item->quantity += $qtyToAdd;
                $item->price = $book->price; // keep latest price
                $item->save();
            } else {
                $item = CartItem::create([
                    'cart_id' => $cart->id,
                    'book_id' => $book->id,
                    'quantity' => $qtyToAdd,
                    'price' => $book->price,
                ]);
            }

            // recalc totals
            $totalQty = (int) DB::table('cart_items')->where('cart_id', $cart->id)->sum('quantity');
            $totalPrice = (float) DB::table('cart_items')->where('cart_id', $cart->id)->selectRaw('SUM(quantity * price) as total')->value('total');

            $cart->total_qty = $totalQty;
            $cart->total_price = $totalPrice;
            $cart->save();
        });

        return response()->json([
            'message' => 'Item added to cart',
            'cart' => $cart->load('items.book'),
            'item' => $item
        ], 201);
    }
}
