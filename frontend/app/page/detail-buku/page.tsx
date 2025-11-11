'use client'
import React, { useEffect, useState, useRef, Suspense } from 'react'
import Image from 'next/image'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import api from '../../api/api'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, ChevronDown, Heart } from 'lucide-react'
import axios from 'axios'

interface Book {
  id: number
  title: string
  author: string
  description?: string
  price: number
  stock?: number
  cover_image?: string | null
  created_at?: string | null
  publisher?: string
  publish_year?: number | string
  category?: { id: number; name: string } | null
  reviews?: Review[] // may be present from API
  sold_count?: number
}

interface Review {
  id: number
  rating: number
  comment?: string | null
  user?: { name?: string } | null
  created_at?: string | null
}

function ProductDetailInner() {
  const searchParams = useSearchParams()
  const id = searchParams?.get('id') || ''

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recommendations, setRecommendations] = useState<Book[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  const [addedMsg, setAddedMsg] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [stockErr, setStockErr] = useState<string | null>(null)

  // Favorite state (untuk buku saat ini)
  const [isFav, setIsFav] = useState(false)
  const [favBusy, setFavBusy] = useState(false)

  // NEW: zoom state + ref for image container
  const [isZoom, setIsZoom] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const imgContainerRef = useRef<HTMLDivElement | null>(null)

  // NEW: reviews UI state
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reviewsCount, setReviewsCount] = useState(0)
  const [avgRating, setAvgRating] = useState<number | null>(null)

  const router = useRouter()

  const handleAddToCart = async () => {
    if (!book) return
    if (quantity > (book.stock ?? 0)) {
      setStockErr('Jumlah melebihi stok tersedia')
      setTimeout(() => setStockErr(null), 2500)
      return
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) {
      setShowLoginModal(true)
      return
    }

    setAdding(true)
    try {
      await api.post('/cart/add-item', { book_id: book.id, quantity })
      setAddedMsg('Berhasil ditambahkan ke keranjang')
      window.dispatchEvent(new Event('authChanged'))
      setTimeout(() => setAddedMsg(null), 2000)
    } catch (err) {
      console.error(err)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setShowLoginModal(true)
      }
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setStockErr(err.response.data?.message || 'Stok tidak mencukupi')
        setTimeout(() => setStockErr(null), 2500)
      }
    } finally {
      setAdding(false)
    }
  }

  // NEW: Buy Now -> add to cart then go to cart page
  const handleBuyNow = async () => {
    if (!book) return
    if (quantity > (book.stock ?? 0)) {
      setStockErr('Jumlah melebihi stok tersedia')
      setTimeout(() => setStockErr(null), 2500)
      return
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) {
      setShowLoginModal(true)
      return
    }

    setAdding(true)
    try {
      await api.post('/cart/add-item', { book_id: book.id, quantity })
      // refresh navbar cart badge
      window.dispatchEvent(new Event('authChanged'))
      // go to cart page
      router.push('/page/cart')
    } catch (err) {
      console.error(err)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setShowLoginModal(true)
      }
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setStockErr(err.response.data?.message || 'Stok tidak mencukupi')
        setTimeout(() => setStockErr(null), 2500)
      }
    } finally {
      setAdding(false)
    }
  }

  // Muat status favorit untuk buku ini
  useEffect(() => {
    const loadFav = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!book || !token) { setIsFav(false); return }
      try {
        const res = await api.get('/favorits')
        const list = Array.isArray(res.data) ? res.data : []
        const found = list.some((f: any) => Number(f.book_id ?? f.book?.id) === Number(book.id))
        setIsFav(found)
      } catch {
        setIsFav(false)
      }
    }
    loadFav()
    const onAuthChanged = () => loadFav()
    window.addEventListener('authChanged', onAuthChanged)
    return () => window.removeEventListener('authChanged', onAuthChanged)
  }, [book])

  // Toggle favorite current book
  const toggleFavorite = async () => {
    if (!book) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) { setShowLoginModal(true); return }
    if (favBusy) return
    setFavBusy(true)
    try {
      if (isFav) {
        await api.delete(`/favorits/by-book/${book.id}`)
        setIsFav(false)
      } else {
        await api.post('/favorits', { book_id: book.id })
        setIsFav(true)
      }
    } catch {
      // ignore
    } finally {
      setFavBusy(false)
    }
  }

  useEffect(() => {
    if (!id) {
      setError('Buku tidak ditemukan')
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)

    // fetch single book
    api.get(`/books/${id}`)
      .then(res => {
        if (!mounted) return
        setBook(res.data)
      })
      .catch(err => {
        console.error(err)
        if (mounted) setError('Gagal memuat detail buku')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    // fetch recommendations (all books) and pick random 3 excluding current
    api.get('/books')
      .then(res => {
        if (!mounted) return
        const all: Book[] = res.data || []
        const others = all.filter(b => String(b.id) !== String(id))
        // shuffle and take 3
        for (let i = others.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[others[i], others[j]] = [others[j], others[i]]
        }
        setRecommendations(others.slice(0, 3))
      })
      .catch(err => {
        console.error('Failed to load recommendations', err)
      })

    return () => { mounted = false }
  }, [id])

  // NEW: mouse handlers
  function handleMouseMove(e: React.MouseEvent) {
    const el = imgContainerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const xPercent = Math.round((x / rect.width) * 100)
    const yPercent = Math.round((y / rect.height) * 100)
    setOrigin(`${xPercent}% ${yPercent}%`)
  }

  useEffect(() => {
    // after book loaded, compute reviews stats if available
    if (book && book.reviews && Array.isArray(book.reviews)) {
      const revs: Review[] = book.reviews
      setReviewsCount(revs.length)
      if (revs.length > 0) {
        const sum = revs.reduce((s, r) => s + (Number(r.rating) || 0), 0)
        setAvgRating(Number((sum / revs.length).toFixed(1)))
      } else {
        setAvgRating(null)
      }
    } else {
      setReviewsCount(0)
      setAvgRating(null)
    }
  }, [book])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">Memuat...</div>
        <Footer />
      </>
    )
  }

  if (error || !book) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center text-red-600">
          {error || 'Buku tidak ditemukan'}
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
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

      {/* FEEDBACK */}
      {addedMsg && 
        <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
          <div className="bg-green-500 text-white text-sm font-semibold py-3 px-4 rounded-lg shadow-md">
            {addedMsg}
          </div>
        </div>
      }
     {stockErr && (
       <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
         <div className="bg-red-600 text-white text-sm font-semibold py-3 px-4 rounded-lg shadow-md">
           {stockErr}
         </div>
       </div>
     )}

      <div className="min-h-screen bg-white text-gray-900 mt-15">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* IMAGE */}
          <div
            ref={imgContainerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoom(true)}
            onMouseLeave={() => setIsZoom(false)}
            className="relative w-full h-[600px] bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center"
          >
            <Image
              src={book.cover_image ? `http://localhost:8000/storage/${book.cover_image}` : '/images/dummyImage.jpg'}
              alt={book.title}
              fill
              className="object-contain p-6"
              style={{
                transform: isZoom ? 'scale(2)' : 'scale(1)',
                transformOrigin: origin,
                transition: 'transform 220ms ease-out',
              }}
            />
          </div>

          {/* DETAILS */}
          <div className="flex flex-col justify-start">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h1 className="text-3xl font-semibold">{book.title}</h1>
                <button
                  onClick={toggleFavorite}
                  disabled={favBusy}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  title={isFav ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                >
                  <Heart size={22} className={isFav ? 'text-red-500 fill-red-500' : 'text-gray-500'} />
                </button>
              </div>
              <p className="text-gray-500 mb-6">by {book.author}</p>

              <div className="flex items-center gap-3 mb-6">
                <p className="text-2xl font-semibold">
                  Rp{" "}
                  {Number(book.price).toLocaleString("id-ID", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <span className="text-sm text-gray-700 bg-gray-100 px-4 py-1 rounded-full shadow-sm">
                  Terjual: {Number(book.sold_count ?? 0).toLocaleString('id-ID')}
                </span>
                <span className="text-sm text-gray-700 bg-gray-100 px-4 py-1 rounded-full shadow-sm">
                  Stock: {Number(book.stock ?? 0).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Meta info: Publisher, Publish Year, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700 mb-4">
                <div>
                  <span className="text-gray-500">Publisher: </span>
                  <span className="text-black">{book.publisher || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tahun Publish: </span>
                  <span className="text-black">{book.publish_year || '-'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Kategori: </span>
                  <span className="text-black">{book.category?.name || '-'}</span>
                </div>
              </div>

              <div className="text-gray-700 leading-relaxed mb-8 whitespace-pre-line">
                {book.description || 'Tidak ada deskripsi.'}
              </div>

              {/* QUANTITY CONTROL */}
              <div className="flex items-center gap-3 mb-6">
                <span className="font-medium">Jumlah:</span>
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-1 text-xl font-semibold hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="px-4 py-1 min-w-[48px] text-center">{quantity}</span>
                  <button
                    onClick={() => {
                      if (!book) return
                      const max = book.stock ?? 0
                      setStockErr(null)
                      if (quantity + 1 > max) {
                        setStockErr('Jumlah melebihi stok tersedia')
                        setTimeout(() => setStockErr(null), 2500)
                        return
                      }
                      setQuantity(q => q + 1)
                    }}
                    className="px-3 py-1 text-xl font-semibold hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleAddToCart}
                  className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
                >
                  Tambah ke Keranjang
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={adding}
                  className="border border-gray-400 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition disabled:opacity-60"
                >
                  {adding ? 'Memproses...' : 'Beli Sekarang'}
                </button>
              </div>

              {/* === Modern Reviews Section === */}
              <div className="mt-8">
                <button
                  onClick={() => setReviewsOpen(r => !r)}
                  className="w-full flex items-center justify-between pb-4 border-b border-gray-300 hover:border-gray-400 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium text-black">Reviews</span>
                    <span className="text-sm text-gray-500">({reviewsCount})</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {avgRating !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span 
                              key={i} 
                              className={`text-xl ${i < Math.round(avgRating) ? 'text-yellow-500' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="text-xl text-gray-300">★</span>
                        ))}
                      </div>
                    )}
                    <ChevronDown 
                      className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${reviewsOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {reviewsOpen && (
                  <>
                    {(() => {
                      const hasScrollable = (book?.reviews?.length || 0) > 5
                      return (
                        <div
                          className={`mt-6 space-y-4 ${hasScrollable ? 'max-h-[420px] overflow-y-auto pr-2' : ''}`}
                          style={{ scrollbarWidth: 'thin' }}
                        >
                          {book?.reviews && book.reviews.length > 0 ? (
                            book.reviews.map((r: Review) => (
                              <div key={r.id} className="pb-4 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="text-sm font-medium text-gray-900">{r.user?.name || 'Anonymous'}</div>
                                  <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <span key={i} className={`text-base ${i < (r.rating || 0) ? 'text-yellow-500' : 'text-gray-200'}`}>★</span>
                                    ))}
                                  </div>
                                </div>
                                {r.comment && <div className="text-sm text-gray-600 leading-relaxed">{r.comment}</div>}
                                {r.created_at && (
                                  <div className="text-xs text-gray-400 mt-2">
                                    {new Date(r.created_at).toLocaleDateString('id-ID', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500 py-4">Belum ada review untuk buku ini.</div>
                          )}
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* RECOMMENDATIONS */}
        <div className="max-w-6xl mx-auto px-6 mt-20 pb-20">
          <h2 className="text-2xl font-semibold mb-6">Kamu Mungkin Suka</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {recommendations.map((item) => (
              <Link key={item.id} href={`/page/detail-buku?id=${item.id}`} className="flex flex-col cursor-pointer group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative w-full h-56 bg-gray-100">
                  <Image
                    src={item.cover_image ? `http://localhost:8000/storage/${item.cover_image}` : '/images/dummyImage.jpg'}
                    alt={item.title}
                    fill
                    className="object-contain p-4"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold line-clamp-2 min-h-[2.4rem] text-black">{item.title}</h3>
                  <p className="text-gray-600 text-xs line-clamp-1 mt-1">{item.author}</p>
                  <p className="text-black font-bold mt-3">
                    Rp{" "}
                    {Number(item.price).toLocaleString("id-ID", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

// Wrapper dengan Suspense
export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <ProductDetailInner />
    </Suspense>
  )
}