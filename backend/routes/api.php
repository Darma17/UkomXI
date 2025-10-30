<?php

use App\Http\Controllers\AddressController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CartItemController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\BookDiscountController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\FavoritController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Upload foto profil user yang sedang login
Route::post('user/profile-image', [UserController::class, 'uploadProfileImage'])->middleware('auth:sanctum');

// Alias tambahan agar tidak 405 ketika client salah path/method
Route::match(['POST', 'PUT'], 'users/profile-image', [UserController::class, 'uploadProfileImage'])->middleware('auth:sanctum');
// Alias untuk salah ketik "profil-image"
Route::match(['POST', 'PUT'], 'users/profil-image', [UserController::class, 'uploadProfileImage'])->middleware('auth:sanctum');

Route::get('books/highlight', [BookController::class, 'highlights']);

Route::apiResources([
    'users' => UserController::class,
    'categories' => CategoryController::class,
    'books' => BookController::class,
    'carts' => CartController::class,
    'cart-items' => CartItemController::class,
    'discounts' => DiscountController::class,
    'orders' => OrderController::class,
    'order-items' => OrderItemController::class,
    'reviews' => ReviewController::class,
    'wishlists' => WishlistController::class,
]);

// Favorit (auth required)
Route::apiResource('favorits', FavoritController::class)->only(['index','store','destroy'])->middleware('auth:sanctum');
// Hapus favorit berdasarkan book_id (lebih praktis di FE)
Route::delete('favorits/by-book/{book}', [FavoritController::class, 'destroyByBook'])->middleware('auth:sanctum');

Route::post('/contact', [UserController::class, 'contact']);

// Ambil semua alamat milik user yang sedang login
Route::get('addresses/me', [AddressController::class, 'me'])->middleware('auth:sanctum');

// Lindungi seluruh CRUD addresses (membutuhkan Bearer token)
Route::apiResource('addresses', AddressController::class)->middleware('auth:sanctum');


// Route utama CRUD Book Discount
Route::apiResource('book-discounts', BookDiscountController::class);

// Route tambahan (custom)
Route::get('books-with-discount', [BookDiscountController::class, 'booksWithDiscount']);
Route::delete('book-discounts/cleanup', [BookDiscountController::class, 'deactivateExpiredDiscounts']);


// Authentication routes (login by role -> send OTP; verify OTP -> issue Sanctum token; logout)
Route::post('login/customer', [UserController::class, 'loginCustomer']);
Route::post('login/admin', [UserController::class, 'loginAdmin']);
Route::post('verify-otp', [UserController::class, 'verifyOtp']);
Route::post('/google-login', [UserController::class, 'googleLogin']);

// NEW: forgot password / reset flow
Route::post('forgot-password', [UserController::class, 'sendResetOtp']);
Route::post('verify-reset-otp', [UserController::class, 'verifyResetOtp']);
Route::post('reset-password', [UserController::class, 'resetPassword']);

// NEW: register (request OTP -> verify OTP -> create account)
Route::post('register/request', [UserController::class, 'sendRegisterOtp']);
Route::post('register/verify', [UserController::class, 'verifyRegisterOtp']);

Route::post('logout', [UserController::class, 'logout'])->middleware('auth:sanctum');

// NEW: get current user's cart count (sum of quantities)
Route::get('cart/count', [\App\Http\Controllers\CartController::class, 'count'])->middleware('auth:sanctum');

// NEW: add item to user's cart (create cart if missing)
Route::post('cart/add-item', [CartController::class, 'addItem'])->middleware('auth:sanctum');

// NEW: checkout via Midtrans (sandbox)
Route::post('checkout/midtrans', [CheckoutController::class, 'midtrans'])->middleware('auth:sanctum');

// NEW: complete order after frontend-confirmed payment
Route::post('checkout/complete', [CheckoutController::class, 'complete'])->middleware('auth:sanctum');

// Midtrans notification (no auth) — Midtrans will POST here
Route::post('checkout/midtrans/notification', [CheckoutController::class, 'notification']);

