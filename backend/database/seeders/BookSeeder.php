<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Book;
use App\Models\Category;

class BookSeeder extends Seeder
{
    public function run(): void
    {
        $categoryIds = Category::pluck('id')->toArray();

        $books = [
            [
                'category_id' => $categoryIds[array_rand($categoryIds)],
                'title' => 'Laskar Pelangi',
                'author' => 'Andrea Hirata',
                'publisher' => 'Bentang Pustaka',
                'publish_year' => 2005,
                'description' => 'Kisah inspiratif tentang perjuangan pendidikan anak-anak di Belitung.',
                'price' => 85000,
                'stock' => 120,
                'cover_image' => 'laskar-pelangi.jpg',
                'is_highlight' => true,
            ],
            [
                'category_id' => $categoryIds[array_rand($categoryIds)],
                'title' => 'Atomic Habits',
                'author' => 'James Clear',
                'publisher' => 'Penguin Random House',
                'publish_year' => 2018,
                'description' => 'Cara mengubah kebiasaan kecil menjadi hasil luar biasa.',
                'price' => 125000,
                'stock' => 75,
                'cover_image' => 'atomic-habits.jpg',
                'is_highlight' => false,
            ],
            [
                'category_id' => $categoryIds[array_rand($categoryIds)],
                'title' => 'Clean Code',
                'author' => 'Robert C. Martin',
                'publisher' => 'Prentice Hall',
                'publish_year' => 2008,
                'description' => 'Panduan praktik terbaik untuk menulis kode yang bersih dan mudah dibaca.',
                'price' => 230000,
                'stock' => 45,
                'cover_image' => 'clean-code.jpg',
                'is_highlight' => true,
            ],
        ];

        foreach ($books as $book) {
            Book::create($book);
        }
    }
}
