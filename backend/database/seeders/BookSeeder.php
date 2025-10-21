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
            ['title' => 'Belajar Laravel 10 untuk Pemula', 'author' => 'Andi Wijaya', 'publisher' => 'Gramedia', 'publish_year' => 2023, 'description' => 'Panduan lengkap belajar Laravel dari dasar hingga mahir.', 'price' => 150000, 'stock' => 50, 'cover_image' => 'https://www.duniailkom.com/wp-content/uploads/2022/07/Cover-Laravel-10-Uncover-banner.jpg'],
            ['title' => 'Misteri di Balik Kota Tua', 'author' => 'Dewi Anggraini', 'publisher' => 'Bentang Pustaka', 'publish_year' => 2022, 'description' => 'Sebuah kisah misteri penuh teka-teki di kota tua.', 'price' => 90000, 'stock' => 30, 'cover_image' => 'https://ebooks.gramedia.com/ebook-covers/4018/general_small_covers/ID_GPU2013MTH05WKTJ_S.jpg'],
            ['title' => 'Petualangan Si Komikus', 'author' => 'Budi Santoso', 'publisher' => 'Elex Media', 'publish_year' => 2021, 'description' => 'Komik lucu dan inspiratif untuk semua umur.', 'price' => 65000, 'stock' => 100, 'cover_image' => 'https://ebooks.gramedia.com/ebook-covers/54307/thumb_image_normal/BLK_IFKDAK2020904890.jpg'],
            ['title' => 'Strategi Bisnis di Era Digital', 'author' => 'Rina Hartono', 'publisher' => 'Penerbit Maju', 'publish_year' => 2024, 'description' => 'Cara membangun bisnis sukses di era digital.', 'price' => 120000, 'stock' => 40, 'cover_image' => 'https://ebooks.gramedia.com/ebook-covers/97163/thumb_image_normal/BLK_BD1731999788613.jpg'],
            ['title' => 'Sejarah Nusantara', 'author' => 'Dr. Hasan Abdullah', 'publisher' => 'Balai Pustaka', 'publish_year' => 2020, 'description' => 'Kumpulan kisah sejarah bangsa Indonesia.', 'price' => 110000, 'stock' => 20, 'cover_image' => 'https://ebooks.gramedia.com/ebook-covers/46298/thumb_image_normal/ID_PN2019MTH02PN.jpg'],
            ['title' => 'Pemrograman Web Modern', 'author' => 'Dedi Pratama', 'publisher' => 'Tekno Books', 'publish_year' => 2023, 'description' => 'Pelajari HTML, CSS, dan JavaScript dari nol.', 'price' => 130000, 'stock' => 60, 'cover_image' => 'https://ebooks.gramedia.com/ebook-covers/83457/thumb_image_normal/BLK_7MPWM1679641801044.jpg'],
            ['title' => 'Manajemen Waktu Efektif', 'author' => 'Agus Saputra', 'publisher' => 'Media Inspirasi', 'publish_year' => 2021, 'description' => 'Rahasia sukses mengatur waktu secara produktif.', 'price' => 75000, 'stock' => 80, 'cover_image' => 'https://ebooks.gramedia.com/ebook-covers/61036/thumb_image_normal/BLK_MWF2021406308.jpg'],
            ['title' => 'Jaringan Komputer Dasar', 'author' => 'Ir. Rahmat Hidayat', 'publisher' => 'IT Books', 'publish_year' => 2022, 'description' => 'Panduan dasar membangun jaringan komputer.', 'price' => 115000, 'stock' => 35, 'cover_image' => 'https://ebooks.gramedia.com/ebook-covers/97014/thumb_image_normal/BLK_JK1731484874520.jpg'],
            ['title' => 'Pemikiran Tokoh Dunia', 'author' => 'Siti Nurhaliza', 'publisher' => 'Literasi Dunia', 'publish_year' => 2020, 'description' => 'Kumpulan pemikiran tokoh-tokoh berpengaruh dunia.', 'price' => 95000, 'stock' => 25, 'cover_image' => 'https://ebooks.gramedia.com/ebook-covers/6196/general_small_covers/ID_EMK2013MTH07ETDU_S.jpg'],
            ['title' => 'Machine Learning untuk Semua', 'author' => 'Fajar Nugroho', 'publisher' => 'AI Press', 'publish_year' => 2024, 'description' => 'Belajar konsep machine learning dengan cara mudah.', 'price' => 160000, 'stock' => 30, 'cover_image' => 'https://ebooks.gramedia.com/ebook-covers/100826/thumb_image_normal/BLK_ML1742525493774.jpg'],
        ];

        foreach ($books as $book) {
            Book::create([
                ...$book,
                'category_id' => $categoryIds[array_rand($categoryIds)],
                'is_highlight' => true,
            ]);
        }
    }
}
