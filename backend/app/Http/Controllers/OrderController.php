<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index()
    {
        return response()->json(Order::with('items.book', 'discount')->get());
    }

    public function show(Order $order)
    {
        return response()->json($order->load('items.book', 'discount'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'discount_id' => 'nullable|exists:discounts,id',
            'total_price' => 'required|numeric',
        ]);

        $data['order_code'] = 'ORD-' . strtoupper(uniqid());
        $order = Order::create($data);

        return response()->json($order, 201);
    }

    public function update(Request $request, Order $order)
    {
        $order->update($request->only(['status']));
        return response()->json($order);
    }
}
