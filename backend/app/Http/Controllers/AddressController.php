<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $auth = $request->user();
        $q = Address::query();
        if ($auth) {
            // default: alamat milik user login
            $q->where('user_id', $auth->id);
        } else {
            // fallback: pakai query user_id (misal untuk admin/non-auth use case)
            $userId = $request->query('user_id');
            if ($userId) $q->where('user_id', $userId);
        }
        return response()->json($q->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            // user_id akan diisi dari user login jika ada
            'user_id'        => 'sometimes|exists:users,id',
             'nama_alamat'    => 'required|string',
             'nama_penerima'  => 'required|string',
             'no_telp'        => 'required|string|max:20',
             'alamat_lengkap' => 'required|string',
             'provinsi'       => 'required|string',
             'kabupaten'      => 'required|string',
             'kecamatan'      => 'required|string',
         ]);
        // pakai user login jika tersedia
        $auth = $request->user();
        $data['user_id'] = $auth?->id ?? ($data['user_id'] ?? null);
        if (empty($data['user_id'])) {
            return response()->json(['message' => 'user_id tidak tersedia'], 422);
        }

        $address = Address::create($data);
        return response()->json($address, 201);
    }

    public function update(Request $request, Address $address)
    {
        // hanya pemilik yang boleh update
        if ($request->user() && $request->user()->id !== $address->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
         $data = $request->validate([
             'nama_alamat'    => 'sometimes|string',
             'nama_penerima'  => 'sometimes|string',
             'no_telp'        => 'sometimes|string|max:20',
             'alamat_lengkap' => 'sometimes|string',
             'provinsi'       => 'sometimes|string',
             'kabupaten'      => 'sometimes|string',
             'kecamatan'      => 'sometimes|string',
         ]);
         $address->update($data);
         return response()->json($address);
    }

    public function destroy(Address $address)
    {
        // hanya pemilik yang boleh hapus
        if (request()->user() && request()->user()->id !== $address->user_id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $address->delete();
        return response()->json(['message' => 'Address deleted']);
    }

    // Ambil semua alamat milik user yang sedang login
    public function me(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        return response()->json($user->addresses()->get());
    }
}
