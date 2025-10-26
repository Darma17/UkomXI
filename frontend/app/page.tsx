'use client'

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import api from './api/api' // add axios instance
import axios from 'axios'
import { useRouter } from 'next/navigation'

// Interface untuk tipe data
interface FeaturedProduct {
  id: number
  src: string
  alt: string
  title: string
  subtitle: string
  buttonText: string
  link: string
}

interface Category {
  id: number
  title: string
  image: string
}

interface Book {
  id: number
  title: string
  author: string
  price: number
  stock: number
  cover_image: string | null
}

export default function HomePage() {
  const featuredProducts: FeaturedProduct[] = [
    { id: 1, src: "/images/bannerBukuk.jpeg", alt: "BukuKu", title: "BukuKu", subtitle: "Beli Buku dengan Harga Terbaik", buttonText: "Jelajahi Sekarang", link: "/page/explore" },
    { id: 2, src: "/images/bannerAtomicHabits.jpg", alt: "Atomic Habits", title: "Atomic Habits", subtitle: "Ubah Hidup Anda dengan Perubahan Terkecil!", buttonText: "Pelajari Lebih Lanjut", link: "/page/about" },
    { id: 3, src: "/images/bannerPomo.jpeg", alt: "The Psychology of Money", title: "The Psychology of Money", subtitle: "The Psychology of Money: Timeless Lessons on Wealth, Greed, and Happiness", buttonText: "Pelajari Lebih Lanjut", link: "/page/explore" },
  ]

  const categories: Category[] = [
    { id: 1, title: "Komik & Novel", image: "/images/komik.avif" },
    { id: 2, title: "Agama", image: "/images/agama.png" },
    { id: 3, title: "Fiksi", image: "/images/fiksi.avif" },
    { id: 4, title: "Pendidikan", image: "/images/pendidikan.png" },
    { id: 5, title: "Pengembangan Diri", image: "/images/pengembangan.avif" },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [highlightBooks, setHighlightBooks] = useState<Book[]>([])
  const [hoveredBook, setHoveredBook] = useState<number | null>(null)
  const [cartClicked, setCartClicked] = useState<Record<number, boolean>>({})
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingBookId, setPendingBookId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredProducts.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [featuredProducts.length])

  useEffect(() => {
    fetch("http://localhost:8000/api/books/highlight")
      .then((res) => res.json())
      .then((data: Book[]) => setHighlightBooks(data))
      .catch((err) => console.error(err))
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPos, setScrollPos] = useState(0)

  const scrollAmount = 280

  const handleScroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    const newPos =
      dir === "left" 
        ? scrollRef.current.scrollLeft - scrollAmount 
        : scrollRef.current.scrollLeft + scrollAmount
    scrollRef.current.scrollTo({ left: newPos, behavior: "smooth" })
    setScrollPos(newPos)
  }

  const canScrollLeft = scrollPos > 0
  const canScrollRight = scrollRef.current
    ? scrollPos < (scrollRef.current.scrollWidth - scrollRef.current.clientWidth) - 10
    : true

  const handleCartClick = async (e: React.MouseEvent<HTMLButtonElement>, bookId: number) => {
    e.preventDefault()
    e.stopPropagation()

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) {
      setPendingBookId(bookId)
      setShowLoginModal(true)
      return
    }

    setAdding(true)
    try {
      await api.post('/cart/add-item', { book_id: bookId, quantity: 1 })
      setSuccessMsg('Berhasil ditambahkan ke keranjang')
      window.dispatchEvent(new Event('authChanged'))
      setTimeout(() => setSuccessMsg(''), 2000)
    } catch (err) {
      console.error(err)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setPendingBookId(bookId)
        setShowLoginModal(true)
      }
    } finally {
      setAdding(false)
      setCartClicked(prev => ({ ...prev, [bookId]: true }))
    }
  }

  return (
    <>
      <Navbar />
      <main className="bg-black text-white min-h-screen">
        {/* HERO SECTION */}
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
                <h1 className="text-5xl font-bold mb-2">{featuredProducts[currentIndex].title}</h1>
                <h2 className="text-2xl font-medium text-gray-300 mb-6">
                  {featuredProducts[currentIndex].subtitle}
                </h2>

                <p className="text-sm md:text-base mb-8">
                  Temukan dan baca lebih banyak buku yang Anda sukai, dan pantau buku-buku yang ingin Anda baca.
                </p>

                <div className="flex space-x-4">
                  <Link
                    href={featuredProducts[currentIndex].link}
                    className="inline-block border border-white text-white hover:bg-white hover:text-black font-medium px-6 py-3 rounded-md transition-all duration-300 text-sm md:text-base"
                  >
                    {featuredProducts[currentIndex].buttonText}
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Hero Pagination */}
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

        {/* CATEGORY SECTION */}
        <section className="bg-white text-black py-16 px-8 md:px-16">
          <h2 className="text-3xl font-bold mb-8 text-center after:block after:w-20 after:h-1 after:bg-gradient-to-r after:from-blue-600 after:to-blue-600 after:mx-auto after:mt-2">
            Kategori Terpopuler
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative group overflow-hidden rounded-xl shadow-md cursor-pointer"
              >
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

        {/* BUKU UNGGULAN SECTION */}
        <section className="bg-white text-black py-16 px-8 md:px-16">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-10 relative">
            <h2 className="text-3xl font-bold text-center w-full after:block after:w-20 after:h-1 after:bg-gradient-to-r after:from-blue-600 after:to-blue-600 after:mx-auto after:mt-2">
              Buku Unggulan
            </h2>

            {/* Tombol panah */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                className={`p-2 rounded-full border border-gray-300 transition ${
                  canScrollLeft
                    ? "hover:bg-gray-100"
                    : "opacity-40 cursor-not-allowed"
                }`}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                className={`p-2 rounded-full border border-gray-300 transition ${
                  canScrollRight
                    ? "hover:bg-gray-100"
                    : "opacity-40 cursor-not-allowed"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* SLIDER */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-4"
            onScroll={(e) => setScrollPos(e.currentTarget.scrollLeft)}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {highlightBooks.map((book) => (
              <Link
                key={book.id}
                href={`/page/detail-buku?id=${book.id}`}
                className="flex-none w-48 border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white relative group"
                onMouseEnter={() => setHoveredBook(book.id)}
                onMouseLeave={() => setHoveredBook(null)}
              >
                <div className="relative w-full h-56 overflow-hidden">
                  <Image
                    src={
                      book.cover_image
                        ? `http://localhost:8000/storage/${book.cover_image}`
                        : "/images/dummyImage.jpg"
                    }
                    alt={book.title}
                    fill
                    className={`object-contain px-2 pt-2 transition-opacity duration-300 ${
                      book.stock === 0 ? "opacity-50" : ""
                    }`}
                  />
                  
                  {/* Icon keranjang saat hover (hanya muncul jika stock > 0) */}
                  {book.stock > 0 && hoveredBook === book.id && (
                    <button
                      onClick={(e) => handleCartClick(e, book.id)}
                      className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10"
                    >
                      <ShoppingCart 
                        size={18} 
                        className={`${
                          cartClicked[book.id] 
                            ? 'fill-black text-black' 
                            : 'text-gray-700'
                        } transition-all`}
                      />
                    </button>
                  )}
                  
                  {/* Label stok habis */}
                  {book.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-200 text-red-700 font-bold px-4 py-1 text-sm rounded-md shadow-md opacity-90">
                        Stok Habis
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <h3 className="text-base font-semibold line-clamp-2 min-h-[3rem]">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 text-xs line-clamp-1 mt-1">
                    {book.author}
                  </p>
                  <p className="text-black font-bold mt-2">
                    Rp{" "}
                    {Number(book.price).toLocaleString("id-ID", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* VIEW ALL BUTTON */}
          <div className="text-center mt-12">
            <Link
              href="/page/explore"
              className="relative inline-block px-8 py-3 font-medium text-black border border-t border-r border-b border-black border-l-4 border-l-blue-600 overflow-hidden group transition-all duration-500"
            >
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                Lihat Semua
              </span>
              <span className="absolute inset-0 bg-blue-600 left-0 w-0 group-hover:w-full transition-all duration-500 ease-out"></span>
            </Link>
          </div>
        </section>

        {/* PRODUCT GALLERY SECTION */}
        <section className="bg-white py-16 px-8 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* PRODUK 1 */}
            <Link
              href="/page/detail-buku?id=22"
              className="relative overflow-hidden rounded-xl group shadow-lg"
            >
              <Image
                src="/images/badGoodHabits.jpg"
                alt="Atomic Habits"
                width={400}
                height={400}
                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
              />
            </Link>

            {/* PRODUK 2 */}
            <Link
              href="/page/detail-buku?id=21"
              className="relative overflow-hidden rounded-xl group shadow-lg"
            >
              <Image
                src="/images/atomicHabits.jpeg"
                alt="Kalung Elegan"
                width={400}
                height={400}
                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
              />
            </Link>

            {/* PRODUK 3 */}
            <Link
              href="/page/detail-buku?id=51"
              className="relative overflow-hidden rounded-xl group shadow-lg"
            >
              <Image
                src="/images/sejarahFilsufDunia.jpg"
                alt="Sepatu Berkelas"
                width={400}
                height={400}
                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
              />
            </Link>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="bg-gray-50 text-black py-16 px-8 md:px-16">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
            <div className="w-full md:w-1/2 relative rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/bannerBuku.jpeg"
                alt="Tentang BukuKu"
                width={600}
                height={400}
                className="object-cover w-full h-full"
              />
            </div>

            <div className="w-full md:w-1/2 space-y-6">
              <h2 className="text-3xl font-bold text-blue-600">
                Tentang <span className="text-black">BukuKu</span>
              </h2>
              <p className="text-gray-700 leading-relaxed text-justify">
                BukuKu adalah toko buku yang menjual berbagai macam buku dengan harga terbaik
                dan kualitas unggulan. Kami berkomitmen untuk menyediakan buku-buku yang tidak
                hanya menarik tetapi juga bermanfaat bagi setiap pembaca. Dari novel, buku
                pendidikan, hingga pengembangan diri — semua tersedia untuk memenuhi kebutuhan
                literasi Anda.
              </p>
              <p className="text-gray-700 leading-relaxed text-justify">
                Dengan pelayanan cepat dan koleksi yang terus diperbarui, BukuKu menjadi tempat
                terbaik bagi para pecinta buku untuk menemukan bacaan favorit mereka.
                Dapatkan pengalaman berbelanja buku yang nyaman dan terpercaya hanya di BukuKu.
              </p>
              <div className="text-center mt-12">
                <Link
                  href="/books"
                  className="relative inline-block px-8 py-3 font-medium text-black border border-t border-r border-b border-black border-l-4 border-l-blue-600 overflow-hidden group transition-all duration-500"
                >
                  <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                    Kunjungi
                  </span>
                  <span className="absolute inset-0 bg-blue-600 left-0 w-0 group-hover:w-full transition-all duration-500 ease-out"></span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowLoginModal(false)} />
            <div className="relative bg-white rounded-xl p-6 w-[90%] max-w-md z-60 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center text-xl font-bold mb-4">X</div>
              <p className="text-gray-800 mb-4">Untuk menambahkan ke keranjang, silakan login terlebih dahulu.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => { setShowLoginModal(false); router.push('/page/sigin') }} className="px-4 py-2 bg-black text-white rounded-md">OK</button>
                <button onClick={() => setShowLoginModal(false)} className="px-4 py-2 border rounded-md text-black">Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {successMsg && (
          <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
            <div className="bg-green-500 text-white text-sm font-semibold py-3 px-4 rounded-lg shadow-md">
              {successMsg}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}