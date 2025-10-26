<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Cart;
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

        $item = CartItem::create($data);

        // Recalculate cart totals
        $this->recalculateCartTotals($data['cart_id']);

        return response()->json($item, 201);
    }

    public function update(Request $request, CartItem $cartItem)
    {
        $cartItem->update($request->only(['quantity', 'price']));

        // Recalculate totals for this cart
        $this->recalculateCartTotals($cartItem->cart_id);

        return response()->json($cartItem);
    }

    public function destroy(CartItem $cartItem)
    {
        $cartId = $cartItem->cart_id;
        $cartItem->delete();

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
