<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KurirSeeder extends Seeder
{
    /**
     * Jalankan seeder untuk tabel kurir.
     */
    public function run(): void
    {
        DB::table('kurirs')->insert([
            [
                'nama' => 'JNE',
                'harga' => 12000, // rata-rata Reguler
            ],
            [
                'nama' => 'TIKI',
                'harga' => 11000,
            ],
            [
                'nama' => 'Pos Indonesia',
                'harga' => 10000,
            ],
            [
                'nama' => 'SiCepat',
                'harga' => 13000,
            ],
            [
                'nama' => 'J&T Express',
                'harga' => 14000,
            ],
            [
                'nama' => 'AnterAja',
                'harga' => 12500,
            ],
            [
                'nama' => 'Ninja Xpress',
                'harga' => 13500,
            ],
            [
                'nama' => 'Wahana',
                'harga' => 9000,
            ],
            [
                'nama' => 'Lion Parcel',
                'harga' => 11500,
            ],
            [
                'nama' => 'Shopee Express',
                'harga' => 10000,
            ],
        ]);
    }
}
