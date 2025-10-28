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
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('nama_alamat');        // contoh: "Rumah", "Kantor"
            $table->string('nama_penerima');      // nama penerima paket
            $table->string('no_telp', 20);        // nomor telepon
            $table->text('alamat_lengkap');       // alamat lengkap
            $table->string('provinsi');
            $table->string('kabupaten');
            $table->string('kecamatan');

            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
