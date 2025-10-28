<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Cart;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartItemController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'cart_id' => 'required|exists:carts,id',
            'book_id' => 'required|exists:books,id',
            'quantity' => 'required|integer|min:1',
            'price' => 'required|numeric'
        ]);

        $item = null;
        try {
            DB::transaction(function () use (&$item, $data) {
                $book = Book::where('id', $data['book_id'])->lockForUpdate()->first();
                if (! $book) {
                    throw new \Exception('BOOK_NOT_FOUND');
                }
                if ($book->stock < $data['quantity']) {
                    throw new \Exception('INSUFFICIENT_STOCK');
                }
                // reduce stock then create item
                $book->stock = $book->stock - $data['quantity'];
                $book->save();
                $item = CartItem::create($data);
            });
        } catch (\Exception $e) {
            if ($e->getMessage() === 'INSUFFICIENT_STOCK') {
                return response()->json(['message' => 'Stok buku tidak mencukupi'], 422);
            }
            if ($e->getMessage() === 'BOOK_NOT_FOUND') {
                return response()->json(['message' => 'Book not found'], 404);
            }
            throw $e;
        }

        // Recalculate cart totals
        $this->recalculateCartTotals($data['cart_id']);

        return response()->json($item, 201);
    }

    public function update(Request $request, CartItem $cartItem)
    {
        $data = $request->validate([
            'quantity' => 'sometimes|integer|min:1',
            'price' => 'sometimes|numeric',
        ]);

        try {
            DB::transaction(function () use ($cartItem, $data) {
                // lock current item row
                $item = CartItem::where('id', $cartItem->id)->lockForUpdate()->first();
                if (! $item) {
                    throw new \Exception('ITEM_NOT_FOUND');
                }
                // same book_id (controller only allows quantity/price)
                if (array_key_exists('quantity', $data)) {
                    $newQty = (int) $data['quantity'];
                    $delta = $newQty - (int) $item->quantity;
                    if ($delta !== 0) {
                        $book = Book::where('id', $item->book_id)->lockForUpdate()->first();
                        if (! $book) {
                            throw new \Exception('BOOK_NOT_FOUND');
                        }
                        if ($delta > 0) {
                            if ($book->stock < $delta) {
                                throw new \Exception('INSUFFICIENT_STOCK');
                            }
                            $book->stock = $book->stock - $delta;
                        } else {
                            // delta negative -> return stock
                            $book->stock = $book->stock + (0 - $delta);
                        }
                        $book->save();
                        $item->quantity = $newQty;
                    }
                }
                if (array_key_exists('price', $data)) {
                    $item->price = $data['price'];
                }
                $item->save();
            });
        } catch (\Exception $e) {
            if ($e->getMessage() === 'INSUFFICIENT_STOCK') {
                return response()->json(['message' => 'Stok buku tidak mencukupi'], 422);
            }
            if ($e->getMessage() === 'ITEM_NOT_FOUND') {
                return response()->json(['message' => 'Cart item not found'], 404);
            }
            if ($e->getMessage() === 'BOOK_NOT_FOUND') {
                return response()->json(['message' => 'Book not found'], 404);
            }
            throw $e;
        }

        // Recalculate totals for this cart
        $this->recalculateCartTotals($cartItem->cart_id);

        // return fresh item
        return response()->json(CartItem::with('book')->find($cartItem->id));
    }

    public function destroy(CartItem $cartItem)
    {
        $cartId = $cartItem->cart_id;
        try {
            DB::transaction(function () use (&$cartId, $cartItem) {
                // lock item then book, return stock, then delete item
                $item = CartItem::where('id', $cartItem->id)->lockForUpdate()->first();
                if (! $item) {
                    throw new \Exception('ITEM_NOT_FOUND');
                }
                $cartId = $item->cart_id;
                $book = Book::where('id', $item->book_id)->lockForUpdate()->first();
                if ($book) {
                    $book->stock = $book->stock + (int) $item->quantity;
                    $book->save();
                }
                $item->delete();
            });
        } catch (\Exception $e) {
            if ($e->getMessage() === 'ITEM_NOT_FOUND') {
                return response()->json(['message' => 'Cart item not found'], 404);
            }
            throw $e;
        }

        // Recalculate cart totals
        $this->recalculateCartTotals($cartId);

        return response()->json(['message' => 'Cart item removed']);
    }

    // helper: recalc totals and update cart row
    protected function recalculateCartTotals(int $cartId)
    {
        $totalQty = (int) DB::table('cart_items')->where('cart_id', $cartId)->sum('quantity');
        $totalPrice = (float) DB::table('cart_items')->where('cart_id', $cartId)->selectRaw('SUM(quantity * price) as total')->value('total') ?? 0;

        $cart = Cart::find($cartId);
        if ($cart) {
            $cart->total_qty = $totalQty;
            $cart->total_price = $totalPrice;
            $cart->save();
        }
    }
}
