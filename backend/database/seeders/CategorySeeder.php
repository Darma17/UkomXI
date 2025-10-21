<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['id' => 1, 'name' => 'Komik & Novel', 'description' => 'Komik dan Novel'],
            ['id' => 2, 'name' => 'Agama', 'description' => 'Buku berbasis tentang agama'],
            ['id' => 3, 'name' => 'Fiksi', 'description' => 'Buku seputar cerita fiksi'],
            ['id' => 4, 'name' => 'Pendidikan', 'description' => 'Buku tentang pendidikan baik pelajaran sekolah maupun tidak'],
            ['id' => 5, 'name' => 'Pengembangan Diri', 'description' => 'Buku edukatif dan tips untuk mengembangkan diri'],
            ['id' => 6, 'name' => 'Komputer', 'description' => 'Buku edukatif dan tips seputar komputer'],
            ['id' => 7, 'name' => 'Alam', 'description' => 'Buku pengetahuan seputar alam'],
            ['id' => 8, 'name' => 'Arsitektur', 'description' => 'Buku perancangan dan pembangunan arsitektur'],
            ['id' => 9, 'name' => 'Medis', 'description' => 'Buku tentang medis'],
            ['id' => 10, 'name' => 'Berkebun', 'description' => 'Buku tentang bagaimana cara berkebun'],
            ['id' => 11, 'name' => 'Biografi & Autobiografi', 'description' => 'Buku Biografi & Autobiografi tentang suatu tokoh'],
            ['id' => 12, 'name' => 'Bisnis', 'description' => 'Buku edukatif dan tips untuk berbisnis'],
            ['id' => 13, 'name' => 'Musik', 'description' => 'Buku seputar musik'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
