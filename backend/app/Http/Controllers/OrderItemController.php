<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use Illuminate\Http\Request;

class OrderItemController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'book_id' => 'required|exists:books,id',
            'quantity' => 'required|integer|min:1',
            'price' => 'required|numeric'
        ]);

        $item = OrderItem::create($data);
        return response()->json($item, 201);
    }

    public function update(Request $request, OrderItem $orderItem)
    {
        $data = $request->validate([
            'quantity' => 'sometimes|integer|min:1',
            'price' => 'sometimes|numeric',
            'is_review' => 'sometimes|boolean',
        ]);
        $orderItem->update($data);
        return response()->json($orderItem);
    }
}
