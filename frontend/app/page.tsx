'use client'

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

export default function HomePage() {
  const featuredProducts = [
    { id: 1, src: "/images/bannerBukuk.jpeg", alt: "BukuKu", title: "BukuKu", subtitle: "Beli Buku dengan Harga Terbaik" },
    { id: 2, src: "/images/bannerAtomicHabits.jpg", alt: "Atomic Habits", title: "Atomic Habits", subtitle: "Ubah Hidup Anda dengan Perubahan Terkecil!" },
    { id: 3, src: "/images/bannerPomo.jpeg", alt: "The Psychology of Money", title: "The Psychology of Money", subtitle: "The Psychology of Money: Timeless Lessons on Wealth, Greed, and Happiness" },
  ]

  const categories = [
    { id: 1, title: "Komik & Novel", image: "/images/komik.avif" },
    { id: 2, title: "Agama", image: "/images/agama.png" },
    { id: 3, title: "Fiksi", image: "/images/fiksi.avif" },
    { id: 4, title: "Pendidikan", image: "/images/pendidikan.png" },
    { id: 5, title: "Pengembangan Diri", image: "/images/pengembangan.avif" },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredProducts.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [featuredProducts.length])

  return (
    <main className="bg-black text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={product.src}
                alt={product.alt}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-16 max-w-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <h1 className="text-5xl font-bold mb-2">
                {featuredProducts[currentIndex].title}
              </h1>
              <h2 className="text-2xl font-medium text-gray-300 mb-6">
                {featuredProducts[currentIndex].subtitle}
              </h2>

              <p className="text-sm md:text-base mb-8">
                Temukan dan baca lebih banyak buku yang Anda sukai, dan pantau buku-buku yang ingin Anda baca.
              </p>

              <div className="flex space-x-4">
                <Link
                  href="/about"
                  className="inline-block border border-white text-white hover:bg-white hover:text-black font-medium px-6 py-3 rounded-md transition-all duration-300 text-sm md:text-base"
                >
                  Jelajahi Sekarang
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-8 left-8 flex space-x-4 z-20">
          {featuredProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-12 h-1 transition-all ${
                index === currentIndex ? "bg-blue-600" : "bg-white bg-opacity-30"
              }`}
            ></button>
          ))}
        </div>

        <div className="absolute bottom-8 right-8 text-sm font-medium z-20">
          <span className="text-blue-500">{currentIndex + 1}</span>
          <span className="text-gray-400">/{featuredProducts.length}</span>
        </div>
      </section>

      {/* Section Kategori Terlaris */}
      <section className="bg-white text-black py-16 px-8 md:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="relative group overflow-hidden rounded-xl shadow-md cursor-pointer"
            >
              {/* Gambar dengan efek zoom saat hover */}
              <div className="overflow-hidden">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  width={400}
                  height={250}
                  className="object-cover w-full h-48 md:h-56 transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
                <h3 className="text-white text-base md:text-lg font-semibold p-4">
                  {cat.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
