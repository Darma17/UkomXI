'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import api from '../../api/api'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingCart } from 'lucide-react'
import axios from 'axios'

interface Book {
  id: number
  title: string
  author: string
  price: number
  cover_image?: string | null
  stock?: number
}

function SearchInner() {
  const searchParams = useSearchParams()
  const q = searchParams?.get('query') || ''
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [error, setError] = useState('')
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [favoriteSet, setFavoriteSet] = useState<Set<number>>(new Set())
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [cartClicked, setCartClicked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!q) {
          setBooks([])
          return
        }
        const res = await api.get(`/books?q=${encodeURIComponent(q)}`)
        if (!mounted) return
        setBooks(res.data || [])
      } catch (e) {
        console.error(e)
        if (mounted) setError('Gagal memuat hasil pencarian')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [q])

  // Load favorites for authenticated user
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

  const handleCartClick = async (e: React.MouseEvent<HTMLButtonElement>, bookId: number) => {
    e.preventDefault()
    e.stopPropagation()
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) {
      setShowLoginModal(true)
      return
    }
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

  const toggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>, bookId: number) => {
    e.preventDefault()
    e.stopPropagation()
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) {
      setShowLoginModal(true)
      return
    }
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
              <button onClick={() => setShowLoginModal(false)} className="px-4 py-2 border rounded-md border-gray-800 text-gray-800">Batal</button>
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

      <div className="min-h-screen text-black bg-white pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-2xl font-semibold mb-3">Hasil Pencarian {q ? `untuk “${q}”` : ''}</h1>
          {loading && <div className="py-8 text-center">Memuat...</div>}
          {!loading && error && <div className="py-8 text-center text-red-600">{error}</div>}
          {!loading && !q && (
            <div className="py-12 text-center text-gray-600">Ketik sesuatu di search untuk mencari produk.</div>
          )}
          {!loading && q && books.length === 0 && (
            <div className="py-12 text-center text-gray-600">Tidak ada produk yang cocok.</div>
          )}

          {!loading && books.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-6">
              {books.map(b => (
                <Link
                  key={b.id}
                  href={`/page/detail-buku?id=${b.id}`}
                  className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition"
                  onMouseEnter={() => setHoveredId(b.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="relative w-full h-56 bg-gray-100">
                    <Image
                      src={b.cover_image ? `http://localhost:8000/storage/${b.cover_image}` : '/images/dummyImage.jpg'}
                      alt={b.title}
                      fill
                      className="object-contain p-4"
                    />
                    {hoveredId === b.id && (
                      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                        <button
                          onClick={(e) => toggleFavorite(e, b.id)}
                          className="bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                          title={favoriteSet.has(b.id) ? 'Hapus Favorit' : 'Tambah Favorit'}
                        >
                          <Heart size={18} className={favoriteSet.has(b.id) ? 'text-red-500 fill-red-500' : 'text-gray-700'} />
                        </button>
                        {(b.stock ?? 1) > 0 && (
                          <button
                            onClick={(e) => handleCartClick(e, b.id)}
                            className="bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                            title="Tambah ke Keranjang"
                          >
                            <ShoppingCart size={18} className={`${cartClicked[b.id] ? 'fill-black text-black' : 'text-gray-700'} transition-all`} />
                          </button>
                        )}
                      </div>
                    )}
                    {(b.stock ?? 1) === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-200 text-red-700 font-bold px-4 py-1 text-sm rounded-md shadow-md opacity-90">
                          Stok Habis
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold line-clamp-2">{b.title}</h3>
                    <p className="text-gray-600 text-xs mt-1">{b.author}</p>
                    <p className="text-black font-bold mt-3">
                      Rp {Number(b.price).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <SearchInner />
    </Suspense>
  )
}
