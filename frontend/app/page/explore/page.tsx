'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import api from '../../api/api'
import { ShoppingCart } from 'lucide-react'

// ...existing interfaces...
interface Book {
  id: number
  title: string
  author: string
  price: number
  stock: number
  cover_image: string | null
  created_at?: string | null;
  category?: { id: number; name: string } | null;
}

// NEW: Category interface
interface Category {
  id: number;
  name: string;
}

export default function ExplorePage() {
  // replaced dummy data with backend fetch
  const [allProducts, setAllProducts] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // NEW: categories state
  const [categories, setCategories] = useState<Category[]>([])

  // === Pagination logic ===
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // === Filter & Sort state ===
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortBy, setSortBy] = useState('')

  // === Filter states ===
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 })
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [cartClicked, setCartClicked] = useState<Record<number, boolean>>({})

  // Fetch books from backend using api.js
  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.get('/books')
      .then((res) => {
        if (!mounted) return
        // backend returns array of books; adapt fields if needed
        setAllProducts(res.data || [])
      })
      .catch((err) => {
        console.error(err)
        if (mounted) setError('Gagal memuat buku')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  // Fetch categories for filter (once)
  useEffect(() => {
    let mounted = true
    api.get('/categories')
      .then(res => {
        if (!mounted) return
        setCategories(res.data || [])
      })
      .catch(err => {
        console.error('Failed to load categories', err)
      })
    return () => { mounted = false }
  }, [])

  // Apply filters and sorting to allProducts
  const getFilteredSortedProducts = () => {
    let list = [...allProducts]

    // filter by selected categories (if any)
    if (selectedCategories.length > 0) {
      list = list.filter(book => {
        const catName = book.category?.name || ''
        return selectedCategories.includes(catName)
      })
    }

    // filter by price range
    list = list.filter(book => {
      const price = Number(book.price) || 0
      return price >= (priceRange.min || 0) && price <= (priceRange.max || Number.MAX_SAFE_INTEGER)
    })

    // sort
    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price-high':
        list.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'newest':
        list.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0
          const db = b.created_at ? new Date(b.created_at).getTime() : 0
          return db - da
        })
        break
      case 'oldest':
        list.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0
          const db = b.created_at ? new Date(b.created_at).getTime() : 0
          return da - db
        })
        break
    }

    return list
  }

  const sortedProducts = getFilteredSortedProducts()
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage)

  const handleSortSelect = (value: string) => {
    setSortBy(value)
    setSortOpen(false)
  }

  const clearSort = () => {
    setSortBy('')
  }

  const getSortLabel = () => {
    switch (sortBy) {
      case 'price-low': return 'Harga Termurah'
      case 'price-high': return 'Harga Termahal'
      case 'newest': return 'Baru Ditambahkan'
      case 'oldest': return 'Lama Ditambahkan'
      default: return 'Sort By'
    }
  }

  const handleCartClick = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.preventDefault()
    e.stopPropagation()
    setCartClicked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Apply filters action (from UI button)
  const applyFilters = () => {
    setCurrentPage(1)
    setFilterOpen(false)
    // filtered list is computed on render (no extra action required)
  }
  
  // toggle category selection
  const toggleCategory = (name: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(name)) return prev.filter(x => x !== name)
      return [...prev, name]
    })
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">Memuat...</div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        <div className="px-6 py-10 mt-10">
          {/* === HEADER === */}
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between mb-10">
            <div>
              <h1 className="text-3xl text-black font-semibold mb-2">Jelajahi BukuKu</h1>
              <p className="text-gray-500">Cari BukuMu di BukuKu</p>
            </div>

            {/* === FILTER & SORT BUTTONS === */}
            <div className="flex gap-4 mt-4 md:mt-0">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-100 transition"
              >
                <span className="text-black">Show Filters</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="black"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6h9.75m-9.75 6h9.75m-9.75 6H21m-9 0l-3.75-3.75m0 0L4.5 18m3.75-3.75L4.5 10.5m3.75 3.75L12 10.5"
                  />
                </svg>
              </button>

              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-100 transition"
                >
                  <span className="text-black">{getSortLabel()}</span>
                </button>

                {/* Sort Dropdown */}
                {sortOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => handleSortSelect('price-low')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Harga Termurah
                      </button>
                      <button
                        onClick={() => handleSortSelect('price-high')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Harga Termahal
                      </button>
                      <button
                        onClick={() => handleSortSelect('newest')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Baru Ditambahkan
                      </button>
                      <button
                        onClick={() => handleSortSelect('oldest')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Lama Ditambahkan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* === MAIN CONTENT WITH FILTER === */}
          <div className="max-w-6xl mx-auto flex gap-6">
            {/* === FILTER SIDEBAR === */}
            <div className={`transition-all duration-300 ${filterOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
              {filterOpen && (
                <div className="sticky top-4 border border-gray-200 rounded-lg p-6 bg-white">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-black">Filters</h3>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="text-gray-500 hover:text-black"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Kategori (dari backend) */}
                  <div className="mb-6">
                    <h4 className="font-medium text-black mb-3">Kategori</h4>
                    <div className="space-y-2 max-h-56 overflow-auto pr-2">
                      {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={selectedCategories.includes(cat.name)}
                            onChange={() => toggleCategory(cat.name)}
                          />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Harga */}
                  <div className="mb-6">
                    <h4 className="font-medium text-black mb-3">Rentang Harga</h4>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full border text-black focus:border-black border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full border text-black focus:border-black border-gray-300 rounded-md px-3 py-2 text-sm"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={applyFilters}
                      className="flex-1 bg-black text-white py-2 rounded-md hover:bg-gray-800 transition"
                    >
                      Filter
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategories([])
                        setPriceRange({ min: 0, max: 1000000 })
                        setCurrentPage(1)
                      }}
                      className="flex-1 border border-gray-300 text-black py-2 rounded-md hover:bg-gray-100 transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* === GRID PRODUK === */}
            <div className={`flex-1 transition-all duration-300 ${filterOpen ? 'ml-0' : ''}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {currentProducts.map((book) => (
                  <Link
                    key={book.id}
                    href={`/page/detail-buku?id=${book.id}`}
                    className="flex flex-col cursor-pointer group bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden"
                    onMouseEnter={() => setHoveredId(book.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="relative w-full h-80 bg-gray-100">
                      <Image
                        src={book.cover_image ? `http://localhost:8000/storage/${book.cover_image}` : '/images/dummyImage.jpg'}
                        alt={book.title}
                        fill
                        className="object-contain p-4"
                      />

                      {book.stock > 0 && hoveredId === book.id && (
                        <button
                          onClick={(e) => handleCartClick(e, book.id)}
                          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10"
                        >
                          <ShoppingCart size={18} className={`${cartClicked[book.id] ? 'fill-black text-black' : 'text-gray-700'} transition-all`} />
                        </button>
                      )}

                      {book.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-red-200 text-red-700 font-bold px-4 py-1 text-sm rounded-md shadow-md opacity-90">
                            Stok Habis
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-base font-semibold line-clamp-2 min-h-[3rem] text-black">{book.title}</h3>
                      <p className="text-gray-600 text-xs line-clamp-1 mt-1">{book.author}</p>
                      <p className="text-black font-bold mt-3">
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

              {/* === PAGINATION === */}
              <div className="flex justify-center mt-12 gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md border ${currentPage === 1 ? 'text-gray-400 border-gray-300 cursor-not-allowed' : 'text-black border-black hover:bg-black hover:text-white transition'}`}
                >
                  Prev
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-md border ${currentPage === i + 1 ? 'bg-black text-white border-black' : 'text-gray-700 border-gray-300 hover:bg-black hover:text-white transition'}`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md border ${currentPage === totalPages ? 'text-gray-400 border-gray-300 cursor-not-allowed' : 'text-black border-black hover:bg-black hover:text-white transition'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}