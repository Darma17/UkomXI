<?php

namespace App\Http\Controllers;

use App\Models\Kurir;
use Illuminate\Http\Request;

class KurirController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Ambil semua kurir
        return response()->json(Kurir::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => 'required|string',
            'harga' => 'required|numeric|min:0',
        ]);
        $kurir = Kurir::create($data);
        return response()->json($kurir, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Kurir $kurir)
    {
        return response()->json($kurir);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Kurir $kurir)
    {
        $data = $request->validate([
            'nama' => 'sometimes|string',
            'harga' => 'sometimes|numeric|min:0',
        ]);
        $kurir->update($data);
        return response()->json($kurir);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kurir $kurir)
    {
        $kurir->delete();
        return response()->json(['message' => 'Kurir deleted']);
    }
}
