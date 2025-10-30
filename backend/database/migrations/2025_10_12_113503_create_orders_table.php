<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            // alamat tujuan pengiriman (opsional) — tanpa FK untuk menghindari error urutan migration
            $table->foreignId('address_id')->nullable()->index();
            // kurir pengiriman (opsional) — gunakan index saja untuk menghindari FK error jika kurirs belum ada
            $table->foreignId('kurir_id')->nullable()->index();

            $table->string('order_code')->unique();
            $table->foreignId('discount_id')->nullable()->constrained('discounts')->nullOnDelete();
            $table->decimal('total_price', 10, 2);
            // allowed statuses: proses, diantar, selesai
            $table->enum('status', ['proses', 'dibayar', 'dikemas', 'diantar', 'selesai', 'cancelled'])->default('proses');
            // NEW: complete flag (0/1), default 0
            $table->boolean('complete')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
