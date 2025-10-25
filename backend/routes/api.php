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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

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
    'addresses' => AddressController::class,
]);


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

