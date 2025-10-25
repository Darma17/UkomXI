<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use Illuminate\Http\Request;

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
}
