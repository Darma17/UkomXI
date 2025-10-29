'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import api from '../../../api/api'

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

  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <>
      <Navbar />
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
                      className="flex flex-col bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transition"
                    >
                      <div className="relative w-full h-64 bg-gray-100">
                        <Image
                          src={book.cover_image ? `http://localhost:8000/storage/${book.cover_image}` : '/images/dummyImage.jpg'}
                          alt={book.title}
                          fill
                          className="object-contain p-4"
                        />
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
