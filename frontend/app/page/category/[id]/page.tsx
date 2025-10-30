'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import api from '../../../api/api'
import { Heart, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

type Category = {
  id: number
  name: string
  description?: string | null
}

type Book = {
  id: number
  title: string
  author: string
  price: number
  stock?: number
  cover_image?: string | null
  category?: { id: number; name: string } | null
}

export default function CategoryPage() {
  const params = useParams<{ id: string }>()
  const catId = Number(params?.id)
  const router = useRouter()

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // UI states untuk hover + favorite + cart feedback
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [favoriteSet, setFavoriteSet] = useState<Set<number>>(new Set())
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [cartClicked, setCartClicked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!catId) { setError('Kategori tidak ditemukan'); setLoading(false); return }

    let mounted = true
    setLoading(true)

    Promise.all([
      api.get(`/categories/${catId}`),
      api.get('/books'),
    ])
      .then(([catRes, booksRes]) => {
        if (!mounted) return
        setCategory(catRes.data || null)
        const all: Book[] = booksRes.data || []
        const filtered = all.filter(b => Number(b?.category?.id) === catId)
        setProducts(filtered)
      })
      .catch(() => {
        if (!mounted) {
          return
        }
        setError('Gagal memuat kategori')
        setCategory(null)
        setProducts([])
      })
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [catId])

  // Ambil daftar favorit user
  useEffect(() => {
    const loadFavs = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!token) { setFavoriteSet(new Set()); return }
      try {
        const res = await api.get('/favorits')
        const ids = new Set<number>((res.data || []).map((f: any) => Number(f.book_id ?? f.book?.id)))
        setFavoriteSet(ids)
      } catch {
        setFavoriteSet(new Set())
      }
    }
    loadFavs()
    const onAuthChanged = () => loadFavs()
    window.addEventListener('authChanged', onAuthChanged)
    return () => window.removeEventListener('authChanged', onAuthChanged)
  }, [])

  // Toggle favorit untuk sebuah buku
  const toggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>, bookId: number) => {
    e.preventDefault()
    e.stopPropagation()
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) { setShowLoginModal(true); return }
    try {
      if (favoriteSet.has(bookId)) {
        await api.delete(`/favorits/by-book/${bookId}`)
        setFavoriteSet(prev => {
          const next = new Set(prev); next.delete(bookId); return next
        })
      } else {
        await api.post('/favorits', { book_id: bookId })
        setFavoriteSet(prev => new Set(prev).add(bookId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Tambah ke keranjang dari grid kategori
  const handleCartClick = async (e: React.MouseEvent<HTMLButtonElement>, bookId: number) => {
    e.preventDefault()
    e.stopPropagation()
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) { setShowLoginModal(true); return }
    try {
      await api.post('/cart/add-item', { book_id: bookId, quantity: 1 })
      setSuccessMsg('Berhasil ditambahkan ke keranjang')
      window.dispatchEvent(new Event('authChanged'))
      setCartClicked(prev => ({ ...prev, [bookId]: true }))
      setTimeout(() => setSuccessMsg(''), 2000)
    } catch (err) {
      console.error(err)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setShowLoginModal(true)
      }
    }
  }

  return (
    <>
      <Navbar />
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowLoginModal(false)} />
          <div className="relative bg-white rounded-xl p-6 w-[90%] max-w-md z-60 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center text-xl font-bold mb-4">X</div>
            <p className="text-gray-800 mb-4">Untuk menambahkan ke keranjang, silakan login terlebih dahulu.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { setShowLoginModal(false); router.push('/page/sigin') }} className="px-4 py-2 bg-black text-white rounded-md">OK</button>
              <button onClick={() => setShowLoginModal(false)} className="px-4 py-2 border rounded-md">Batal</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast sukses add to cart */}
      {successMsg && (
        <div className="fixed left-1/2 -translate-x-1/2 top-6 z-50">
          <div className="bg-green-600 text-white px-6 py-2 rounded">{successMsg}</div>
        </div>
      )}

      <div className="min-h-screen bg-white text-gray-900 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {loading ? (
            <div className="py-20 text-center">Memuat...</div>
          ) : error ? (
            <div className="py-20 text-center text-red-600">{error}</div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold text-black mb-2">
                {category?.name || `Kategori #${catId}`}
              </h1>
              <p className="text-gray-600 mb-8">
                {category?.description || 'Tidak ada deskripsi untuk kategori ini.'}
              </p>

              {products.length === 0 ? (
                <div className="text-sm text-gray-500">Belum ada produk pada kategori ini.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {products.map((book) => (
                    <Link
                      key={book.id}
                      href={`/page/detail-buku?id=${book.id}`}
                      className="flex flex-col bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transition cursor-pointer group"
                      onMouseEnter={() => setHoveredId(book.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <div className="relative w-full h-64 bg-gray-100">
                        <Image
                          src={book.cover_image ? `http://localhost:8000/storage/${book.cover_image}` : '/images/dummyImage.jpg'}
                          alt={book.title}
                          fill
                          className="object-contain p-4"
                        />
                        {hoveredId === book.id && (
                          <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                            <button
                              onClick={(e) => toggleFavorite(e, book.id)}
                              className="bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                              title={favoriteSet.has(book.id) ? 'Hapus Favorit' : 'Tambah Favorit'}
                            >
                              <Heart size={18} className={favoriteSet.has(book.id) ? 'text-red-500 fill-red-500' : 'text-gray-700'} />
                            </button>
                            {(book.stock ?? 1) > 0 && (
                              <button
                                onClick={(e) => handleCartClick(e, book.id)}
                                className="bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                                title="Tambah ke Keranjang"
                              >
                                <ShoppingCart size={18} className={`${cartClicked[book.id] ? 'fill-black text-black' : 'text-gray-700'} transition-all`} />
                              </button>
                            )}
                          </div>
                        )}
                        {(book.stock ?? 1) === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-red-200 text-red-700 font-bold px-4 py-1 text-sm rounded-md shadow-md opacity-90">
                              Stok Habis
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-semibold line-clamp-2 min-h-[2.4rem] text-black">{book.title}</h3>
                        <p className="text-gray-600 text-xs line-clamp-1 mt-1">{book.author}</p>
                        <p className="text-black font-bold mt-3">
                          Rp {Number(book.price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
