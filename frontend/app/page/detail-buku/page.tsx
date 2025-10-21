'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export default function ProductDetail() {
  const [quantity, setQuantity] = useState(1)

  // === contoh data produk ===
  const product = {
    id: 1,
    title: "Buku Filosofi Teras - Henry Manampiring",
    description:
      "Buku ini membahas tentang bagaimana menerapkan filosofi Stoikisme untuk mengatasi emosi negatif, kecemasan, dan menghadapi hidup dengan lebih tenang. Cocok untuk kamu yang ingin hidup lebih rasional dan bahagia.",
    price: 120000,
    image: "/images/book1.jpg", // ganti sesuai aset kamu
  }

  const recommendations = [
    {
      id: 2,
      title: "Sebuah Seni untuk Bersikap Bodo Amat",
      price: 95000,
      image: "/images/book2.jpg",
    },
    {
      id: 3,
      title: "Atomic Habits",
      price: 110000,
      image: "/images/book3.jpg",
    },
    {
      id: 4,
      title: "Rich Dad Poor Dad",
      price: 100000,
      image: "/images/book4.jpg",
    },
  ]

  return (
    <>
        <Navbar />
        <div className="min-h-screen bg-white text-gray-900 mt-10">
        {/* === CONTAINER === */}
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* === IMAGE === */}
            <div className="relative w-full h-[600px] bg-gray-100 rounded-2xl overflow-hidden">
            <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover"
            />
            </div>

            {/* === DETAILS === */}
            <div className="flex flex-col justify-between">
            <div>
                <h1 className="text-3xl font-semibold mb-3">{product.title}</h1>
                <p className="text-gray-500 mb-6">by Henry Manampiring</p>

                <p className="text-2xl font-semibold mb-6">
                {product.price.toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                })}
                </p>

                <p className="text-gray-700 leading-relaxed mb-8">
                {product.description}
                </p>

                {/* === QTY CONTROL === */}
                <div className="flex items-center gap-3 mb-8">
                <span className="font-medium">Jumlah:</span>
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <button
                    onClick={() => setQuantity(Math.max(quantity - 1, 1))}
                    className="px-3 py-1 text-xl font-semibold hover:bg-gray-100"
                    >
                    −
                    </button>
                    <span className="px-4 py-1">{quantity}</span>
                    <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-xl font-semibold hover:bg-gray-100"
                    >
                    +
                    </button>
                </div>
                </div>

                {/* === BUTTONS === */}
                <div className="flex flex-col sm:flex-row gap-4">
                <button className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition">
                    Tambah ke Keranjang
                </button>
                <button className="w-full border border-gray-400 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
                    Beli Sekarang
                </button>
                </div>

                
            </div>
            </div>
        </div>

        {/* === RECOMMENDATIONS === */}
        <div className="max-w-6xl mx-auto px-6 mt-20 pb-20">
            <h2 className="text-2xl font-semibold mb-6">Kamu Mungkin Suka</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {recommendations.map((item) => (
                <div key={item.id} className="flex flex-col cursor-pointer">
                <div className="relative w-full h-80 bg-gray-100 rounded-xl overflow-hidden group">
                    <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
                <p className="mt-3 text-base font-semibold">{item.title}</p>
                <p className="text-gray-600 text-sm">
                    {item.price.toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    })}
                </p>
                </div>
            ))}
            </div>
        </div>
        </div>
        <Footer />
    </>
  )
}
