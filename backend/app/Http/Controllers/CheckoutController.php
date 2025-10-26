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
            'total' => 'required|numeric|min:0'
        ]);

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

        $transaction = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (float)$data['total'],
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
                    'payload' => json_encode($data['items']),
                    'total' => $data['total'],
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
            // create order
            $order = Order::create([
                'user_id' => $pending->user_id,
                'order_code' => 'ORD-' . strtoupper(Str::random(8)),
                'discount_id' => null,
                'total_price' => $pending->total,
                // set initial status to 'proses' as requested
                'status' => 'proses',
            ]);

            $items = json_decode($pending->payload, true) ?: [];

            foreach ($items as $it) {
                // $it expected shape: {id, price, quantity, name...}
                OrderItem::create([
                    'order_id' => $order->id,
                    'book_id' => $it['book_id'] ?? $it['id'] ?? null,
                    'quantity' => (int)($it['quantity'] ?? 1),
                    // store single-unit price (do not multiply)
                    'price' => (float)($it['price'] ?? 0),
                ]);
            }

            // clear user's cart and cart_items
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

        $payload = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.book_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric', // single-unit price
            'total' => 'required|numeric|min:0',
            'midtrans_result' => 'nullable|array',
            'midtrans_order_id' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // create order
            $order = Order::create([
                'user_id' => $user->id,
                'order_code' => 'ORD-' . strtoupper(Str::random(8)),
                'discount_id' => null,
                'total_price' => $payload['total'],
                'status' => 'proses',
            ]);

            foreach ($payload['items'] as $it) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'book_id' => $it['book_id'],
                    'quantity' => (int)$it['quantity'],
                    'price' => (float)$it['price'], // single unit price
                ]);
            }

            // clear user's cart and cart items
            $cart = Cart::where('user_id', $user->id)->first();
            if ($cart) {
                CartItem::where('cart_id', $cart->id)->delete();
                $cart->total_qty = 0;
                $cart->total_price = 0;
                $cart->save();
            }

            // If there is a pending payment record for this midtrans_order_id, delete it (optional)
            if (!empty($payload['midtrans_order_id'])) {
                try {
                    PendingPayment::where('midtrans_order_id', $payload['midtrans_order_id'])->delete();
                } catch (\Throwable $e) {
                    // ignore if model/migration doesn't exist
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Order created',
                'order' => $order->load('items')
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Failed to create order via complete endpoint', [
                'err' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
            ]);
            return response()->json(['message' => 'Failed to create order'], 500);
        }
    }
}
