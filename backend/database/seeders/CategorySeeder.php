<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Fiksi', 'description' => 'Koleksi buku fiksi dari berbagai genre'],
            ['name' => 'Non-Fiksi', 'description' => 'Buku berbasis fakta dan pengetahuan'],
            ['name' => 'Teknologi', 'description' => 'Buku tentang teknologi dan komputer'],
            ['name' => 'Bisnis', 'description' => 'Buku strategi bisnis dan kewirausahaan'],
            ['name' => 'Pendidikan', 'description' => 'Buku pelajaran dan ilmu pengetahuan'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
