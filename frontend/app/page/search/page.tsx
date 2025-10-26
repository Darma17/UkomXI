'use client'

import React, { useEffect, useState } from 'react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import api from '../../api/api'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Book {
  id: number
  title: string
  author: string
  price: number
  cover_image?: string | null
  stock?: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams?.get('query') || ''

  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [error, setError] = useState('')

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

  return (
    <>
      <Navbar />
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
                <Link key={b.id} href={`/page/detail-buku?id=${b.id}`} className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                  <div className="relative w-full h-56 bg-gray-100">
                    <Image
                      src={b.cover_image ? `http://localhost:8000/storage/${b.cover_image}` : '/images/dummyImage.jpg'}
                      alt={b.title}
                      fill
                      className="object-contain p-4"
                    />
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
