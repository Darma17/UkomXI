"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Headphones } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-14 px-8 md:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">

        {/* === KOLOM 1: LOGO & HUBUNGI === */}
        <div className="flex flex-col items-start">
          {/* LOGO */}
          <Image
            src="/images/logoPutih.png" // ganti dengan path logo kamu
            alt="BukuKu Logo"
            width={110}
            height={110}
            className="rounded-md mb-6 ml-7"
          />

          {/* TOMBOL HUBUNGI (PUTIH, TEKS HITAM) */}
          <Link
            href="https://wa.me/6285336942943"
            className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-2 rounded-full shadow-sm hover:bg-gray-100 transition-all duration-300"
          >
            <Headphones size={20} />
            Chat di sini
          </Link>

          {/* SOSIAL MEDIA ICONS */}
          <div className="flex gap-4 mt-6 ml-3.5">
            <a href="https://www.facebook.com" aria-label="Facebook" className="hover:text-blue-500 transition">
              <Facebook size={20} />
            </a>
            <a href="https://www.instagram.com/damore_vel" aria-label="Instagram" className="hover:text-pink-500 transition">
              <Instagram size={20} />
            </a>
            <a href="https://x.com/" aria-label="Twitter" className="hover:text-sky-400 transition">
              <Twitter size={20} />
            </a>
            <a href="mailto:darma1748darma@gmail.com" aria-label="Email" className="hover:text-green-400 transition">
              <Mail size={20} />
            </a>
          </div>
        </div>

        {/* === KOLOM 2: NAVIGASI === */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Navigasi</h3>
          <ul className="space-y-3 text-gray-300">
            <li><Link href="/" className="hover:text-white transition">Beranda</Link></li>
            <li><Link href="/page/explore" className="hover:text-white transition">Jelajahi</Link></li>
            <li><Link href="/page/about" className="hover:text-white transition">Tentang Kami</Link></li>
            <li><Link href="/page/hubungi-kami" className="hover:text-white transition">Hubungi Kami</Link></li>
          </ul>
        </div>

        {/* === KOLOM 3: KATEGORI === */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Kategori</h3>
          <ul className="space-y-3 text-gray-300">
            <li><Link href="/page/category/1" className="hover:text-white transition">Komik & Novel</Link></li>
            <li><Link href="/page/category/2" className="hover:text-white transition">Agama</Link></li>
            <li><Link href="/page/category/3" className="hover:text-white transition">Fiksi</Link></li>
            <li><Link href="/page/category/4" className="hover:text-white transition">Pendidikan</Link></li>
            <li><Link href="/page/category/5" className="hover:text-white transition">Pengembangan Diri</Link></li>
          </ul>
        </div>
      </div>

      {/* === COPYRIGHT === */}
      <div className="border-t border-gray-700 mt-12 pt-6 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} BukuKu. Semua Hak Dilindungi.
      </div>
    </footer>
  );
}
