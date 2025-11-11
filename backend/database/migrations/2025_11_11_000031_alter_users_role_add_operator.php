<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // MySQL/MariaDB: ubah definisi ENUM role, tambahkan 'operator'
        DB::statement("ALTER TABLE users MODIFY role ENUM('customer','admin','operator') NOT NULL DEFAULT 'customer'");
    }

    public function down(): void
    {
        // Kembalikan ke definisi awal jika rollback
        DB::statement("ALTER TABLE users MODIFY role ENUM('customer','admin') NOT NULL DEFAULT 'customer'");
    }
};
