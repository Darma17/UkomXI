<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index()
    {
        return response()->json(Order::with('items.book', 'discount', 'address')->get());
    }

    public function show(Order $order)
    {
        return response()->json($order->load('items.book', 'discount', 'address'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'discount_id' => 'nullable|exists:discounts,id',
            'total_price' => 'required|numeric',
            'address_id' => 'nullable|exists:addresses,id',
        ]);

        $data['order_code'] = 'ORD-' . strtoupper(uniqid());
        $order = Order::create($data);

        return response()->json($order, 201);
    }

    public function update(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => 'sometimes|in:proses,dibayar,dikemas,diantar,selesai,cancelled',
            'complete' => 'sometimes|boolean',
            'address_id' => 'sometimes|nullable|exists:addresses,id',
        ]);
        $order->update($data);
        return response()->json($order->fresh('items.book', 'discount', 'address'));
    }
}
