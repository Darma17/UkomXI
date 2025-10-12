<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use Illuminate\Http\Request;

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
        return response()->json($item, 201);
    }

    public function update(Request $request, CartItem $cartItem)
    {
        $cartItem->update($request->only(['quantity', 'price']));
        return response()->json($cartItem);
    }

    public function destroy(CartItem $cartItem)
    {
        $cartItem->delete();
        return response()->json(['message' => 'Cart item removed']);
    }
}
