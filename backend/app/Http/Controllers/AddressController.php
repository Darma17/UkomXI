<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        return response()->json(Address::where('user_id', $userId)->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'receiver_name' => 'required|string',
            'phone' => 'required|string',
            'address_line' => 'required|string',
            'city' => 'required|string',
            'province' => 'required|string',
            'postal_code' => 'required|string'
        ]);

        $address = Address::create($data);
        return response()->json($address, 201);
    }

    public function update(Request $request, Address $address)
    {
        $address->update($request->all());
        return response()->json($address);
    }

    public function destroy(Address $address)
    {
        $address->delete();
        return response()->json(['message' => 'Address deleted']);
    }
}
