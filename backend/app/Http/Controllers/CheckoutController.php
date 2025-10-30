<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\PendingPayment;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Kurir;

class CheckoutController extends Controller
{
    /**
     * Create Midtrans Snap transaction (sandbox) and return snap token / redirect url.
     *
     * Expects payload:
     * {
     *   items: [{ book_id, title, price, quantity }, ...],
     *   total: 123000
     * }
     *
     * Protected by auth:sanctum
     */
    public function midtrans(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.book_id' => 'required|integer',
            'items.*.title' => 'required|string',
            'items.*.price' => 'required|numeric',
            'items.*.quantity' => 'required|integer|min:1',
            'total' => 'required|numeric|min:0',
            'address_id' => 'nullable|exists:addresses,id',
            'shipping_address' => 'nullable|array',
            'kurir_id' => 'nullable|exists:kurirs,id',
        ]);

        // Normalisasi address_id dari shipping_address jika dikirim sebagai objek
        $addressId = $data['address_id'] ?? null;
        if (!$addressId && !empty($data['shipping_address']) && is_array($data['shipping_address'])) {
            $addressId = $data['shipping_address']['id'] ?? null;
        }

        $orderId = 'ORDER-' . time() . '-' . $user->id . '-' . Str::random(6);

        // Build item_details for Midtrans
        $itemDetails = [];
        foreach ($data['items'] as $it) {
            $itemDetails[] = [
                'id' => (string)($it['book_id'] ?? ''),
                'price' => (float)$it['price'],
                'quantity' => (int)$it['quantity'],
                'name' => mb_substr($it['title'], 0, 250)
            ];
        }
        // Hitung ongkir dari kurir_id (jika ada) dan tambahkan sebagai item_details
        $shipping = 0.0;
        $kurirId = $request->input('kurir_id');
        $kurir = null;
        if ($kurirId) {
            $kurir = Kurir::find($kurirId);
            if ($kurir) {
                $shipping = (float) $kurir->harga;
                $itemDetails[] = [
                    'id' => 'SHIPPING-' . $kurir->id,
                    'price' => $shipping,
                    'quantity' => 1,
                    'name' => 'Ongkos Kirim - ' . $kurir->nama,
                ];
            }
        }
        $grossAmount = (float)$data['total'] + $shipping;

        $transaction = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $grossAmount,
            ],
            'item_details' => $itemDetails,
            // optional: customer_details can be added
            'customer_details' => [
                'first_name' => $user->name ?? '',
                'email' => $user->email ?? '',
            ],
        ];

        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (empty($serverKey)) {
            Log::error('Midtrans server key missing in .env', ['user_id' => $user->id]);
            return response()->json(['message' => 'Payment gateway not configured'], 500);
        }

        // Decide whether to verify SSL. For local development we disable verify to avoid cURL CA issues.
        // Production: ensure verify = true and proper CA bundle configured in php.ini (curl.cainfo).
        $verify = env('APP_ENV') === 'local' ? false : true;

        try {
            // call Midtrans Snap API using Laravel HTTP client (Guzzle)
            $resp = Http::withBasicAuth($serverKey, '')
                ->withHeaders(['Accept' => 'application/json'])
                ->withOptions(['verify' => $verify])
                ->post('https://app.sandbox.midtrans.com/snap/v1/transactions', $transaction);

            if (! $verify) {
                Log::warning('Midtrans request made with SSL verification disabled (local environment).', [
                    'order_id' => $orderId,
                    'user_id' => $user->id,
                ]);
            }

            if (! $resp->successful()) {
                // log details for debugging
                Log::error('Midtrans returned non-2xx', [
                    'status' => $resp->status(),
                    'body' => $resp->body(),
                    'order_id' => $orderId,
                    'user_id' => $user->id,
                ]);

                // return a sanitized error to client (include Midtrans message if present)
                $body = $resp->json() ?? [];
                $midtransMsg = $body['status_message'] ?? ($body['message'] ?? null);
                return response()->json([
                    'message' => 'Payment gateway error',
                    'detail' => $midtransMsg
                ], 500);
            }

            $body = $resp->json();

            // Persist a pending payment record so we can create order once Midtrans notifies us
            try {
                PendingPayment::create([
                    'midtrans_order_id' => $orderId,
                    'user_id' => $user->id,
                    // simpan items + address_id agar bisa dipakai saat notifikasi
                    'payload' => json_encode([
                        'items' => $data['items'],
                        'address_id' => $addressId,
                        'kurir_id' => $kurir?->id,
                    ]),
                    'total' => $grossAmount,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to persist pending payment', ['err' => $e->getMessage(), 'user_id' => $user->id, 'order_id' => $orderId]);
            }

            $snapToken = $body['token'] ?? $body['snap_token'] ?? null;
            $redirectUrl = $body['redirect_url'] ?? null;

            return response()->json([
                'snap_token' => $snapToken,
                'redirect_url' => $redirectUrl,
                'midtrans_response' => $body,
                'order_id' => $orderId // include for client if needed
            ], 200);

        } catch (\Throwable $e) {
            // log exception details
            Log::error('Exception when calling Midtrans', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'order_id' => $orderId,
                'user_id' => $user->id,
            ]);

            return response()->json(['message' => 'Failed to contact payment gateway'], 500);
        }
    }

    /**
     * Midtrans notification handler.
     *
     * This endpoint is called by Midtrans server-to-server to notify payment status.
     * It is not protected by auth, and should validate the request source.
     */
    public function notification(Request $request)
    {
        $payload = $request->all();
        Log::info('Midtrans notification received', ['payload' => $payload]);

        $midtransOrderId = data_get($payload, 'order_id') ?? data_get($payload, 'transaction_details.order_id') ?? null;
        $transactionStatus = data_get($payload, 'transaction_status') ?? data_get($payload, 'status') ?? null;
        $fraudStatus = data_get($payload, 'fraud_status') ?? null;

        if (! $midtransOrderId) {
            Log::warning('Midtrans notification missing order_id', ['payload' => $payload]);
            return response()->json(['message' => 'order_id missing'], 400);
        }

        // Only consider successful payments (settlement / capture)
        $successStates = ['capture', 'settlement', 'paid'];
        if (! in_array(strtolower($transactionStatus), $successStates)) {
            Log::info('Midtrans notification ignored (not successful status)', ['order_id' => $midtransOrderId, 'status' => $transactionStatus]);
            return response()->json(['message' => 'ignored'], 200);
        }

        // find pending payment
        $pending = PendingPayment::where('midtrans_order_id', $midtransOrderId)->first();
        if (! $pending) {
            Log::warning('PendingPayment not found for midtrans_order_id', ['order_id' => $midtransOrderId]);
            return response()->json(['message' => 'not found'], 404);
        }

        // create order, order_items and clear cart within a DB transaction
        DB::beginTransaction();
        try {
            // ambil items dan address_id dari payload pending payment
            $decoded = json_decode($pending->payload, true) ?: [];
            $items = $decoded['items'] ?? [];
            $addressId = $decoded['address_id'] ?? null;
            $kurirId = $decoded['kurir_id'] ?? null;

            // create order: status dibayar, address_id terisi, complete=0
            $order = Order::create([
                'user_id'     => $pending->user_id,
                'order_code'  => 'ORD-' . strtoupper(Str::random(8)),
                'discount_id' => null,
                'total_price' => $pending->total, // sudah termasuk ongkir dari midtrans()
                'status'      => 'dibayar',
                'address_id'  => $addressId,
                'kurir_id'    => $kurirId,
                'complete'    => 0,
            ]);

            foreach ($items as $it) {
                // $it expected shape: {book_id, price, quantity, ...}
                OrderItem::create([
                    'order_id' => $order->id,
                    'book_id' => $it['book_id'] ?? $it['id'] ?? null,
                    'quantity' => (int)($it['quantity'] ?? 1),
                    'price' => (float)($it['price'] ?? 0),
                    'is_review' => 0,
                ]);
            }

            // clear cart and delete pending
            $cart = Cart::where('user_id', $pending->user_id)->first();
            if ($cart) {
                CartItem::where('cart_id', $cart->id)->delete();
                $cart->total_qty = 0;
                $cart->total_price = 0;
                $cart->save();
            }

            // remove pending payment record
            $pending->delete();

            DB::commit();

            Log::info('Order created from Midtrans notification', ['order_id' => $order->id, 'user_id' => $order->user_id]);

            return response()->json(['message' => 'ok'], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Failed to create order from Midtrans notification', ['err' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'internal error'], 500);
        }
    }

    // NEW: complete order immediately (called by frontend after Midtrans onSuccess/onPending)
    public function complete(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.book_id' => 'required|integer|exists:books,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'total' => 'required|numeric|min:0',
            'address_id' => 'nullable|exists:addresses,id',
            'shipping_address' => 'nullable|array',
            'kurir_id' => 'nullable|exists:kurirs,id',
        ]);

        // Ambil address_id dari shipping_address.id jika ada
        $addressId = $data['address_id'] ?? null;
        if (!$addressId && !empty($data['shipping_address']) && is_array($data['shipping_address'])) {
            $addressId = $data['shipping_address']['id'] ?? null;
        }
        // Hitung ongkir dari kurir_id
        $shipping = 0.0;
        $kurirId = $data['kurir_id'] ?? null;
        if ($kurirId) {
            $kurir = Kurir::find($kurirId);
            if ($kurir) {
                $shipping = (float) $kurir->harga;
            }
        }
        $grandTotal = (float)$data['total'] + $shipping;

        $order = null;

        DB::transaction(function () use (&$order, $user, $data, $addressId, $grandTotal, $kurirId) {
            $order = Order::create([
                'user_id'     => $user->id,
                'order_code'  => 'ORD-' . strtoupper(Str::random(10)),
                'discount_id' => null,
                'total_price' => $grandTotal,
                'status'      => 'dibayar',
                'address_id'  => $addressId,
                'kurir_id'    => $kurirId,
                'complete'    => 0,
            ]);

            foreach ($data['items'] as $it) {
                OrderItem::create([
                    'order_id'  => $order->id,
                    'book_id'   => $it['book_id'],
                    'quantity'  => $it['quantity'],
                    'price'     => $it['price'],
                    'is_review' => 0,
                ]);
            }

            // Kosongkan keranjang user tanpa mengembalikan stok
            $cart = Cart::where('user_id', $user->id)->first();
            if ($cart) {
                CartItem::where('cart_id', $cart->id)->delete(); // HANYA hapus item, stok tidak diubah
                $cart->total_qty = 0;
                $cart->total_price = 0;
                $cart->save();
            }
        });

        return response()->json($order->load('items.book', 'address', 'kurir'), 201);
    }
}
