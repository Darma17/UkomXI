'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export default function ExplorePage() {
  // === Contoh data produk ===
  const allProducts = Array.from({ length: 40 }).map((_, i) => ({
    id: i + 1,
    name: `Buku Inspiratif ${i + 1}`,
    category: "Literatur & Edukasi",
    price: 35000 + i * 5000,
    priceFormatted: (35000 + i * 5000).toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
    }),
    image: `/images/product${(i % 5) + 1}.jpg`,
    addedDate: new Date(2024, 0, i + 1)
  }))

  // === Pagination logic ===
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // === Filter & Sort state ===
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [sortBy, setSortBy] = useState('')

  // === Filter states ===
  const [selectedCategories, setSelectedCategories] = useState([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 })

  // === Sort products ===
  const getSortedProducts = () => {
    let sorted = [...allProducts]
    
    switch(sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        sorted.sort((a, b) => b.addedDate.getTime() - a.addedDate.getTime())
        break
      case 'oldest':
        sorted.sort((a, b) => a.addedDate.getTime() - b.addedDate.getTime())
        break
    }
    
    return sorted
  }

  const sortedProducts = getSortedProducts()
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
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
    switch(sortBy) {
      case 'price-low': return 'Harga Termurah'
      case 'price-high': return 'Harga Termahal'
      case 'newest': return 'Baru Ditambahkan'
      case 'oldest': return 'Lama Ditambahkan'
      default: return 'Sort By'
    }
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
                  {sortBy ? (
                    <svg
                      onClick={(e) => {
                        e.stopPropagation()
                        clearSort()
                      }}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="black"
                      className="w-4 h-4 hover:text-red-500"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
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
                        d="M19.5 8.25L12 15.75 4.5 8.25"
                      />
                    </svg>
                  )}
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

                  {/* Kategori */}
                  <div className="mb-6">
                    <h4 className="font-medium text-black mb-3">Kategori</h4>
                    <div className="space-y-2">
                      {['Literatur & Edukasi', 'Fiksi', 'Non-Fiksi', 'Komik'].map((cat) => (
                        <label key={cat} className="flex items-center text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" className="mr-2" />
                          {cat}
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
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full border text-black focus:border-black border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <button className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition">
                    Terapkan Filter
                  </button>
                </div>
              )}
            </div>

            {/* === GRID PRODUK === */}
            <div className={`flex-1 transition-all duration-300 ${filterOpen ? 'ml-0' : ''}`}>
              <div className={`grid grid-cols-1 ${filterOpen ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-8`}>
                {currentProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/page/detail-buku`}
                    className="flex flex-col cursor-pointer group"
                  >
                    <div className="relative w-full h-80 bg-gray-100 rounded-xl overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <h3 className="mt-3 text-sm text-gray-800 font-medium">{item.category}</h3>
                    <p className="text-base text-black font-semibold">{item.name}</p>
                    <p className="text-gray-600 text-sm">{item.priceFormatted}</p>
                  </Link>
                ))}
              </div>

              {/* === PAGINATION === */}
              <div className="flex justify-center mt-12 gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md border ${
                    currentPage === 1
                      ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'text-black border-black hover:bg-black hover:text-white transition'
                  }`}
                >
                  Prev
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-md border ${
                      currentPage === i + 1
                        ? 'bg-black text-white border-black'
                        : 'text-gray-700 border-gray-300 hover:bg-black hover:text-white transition'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md border ${
                    currentPage === totalPages
                      ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'text-black border-black hover:bg-black hover:text-white transition'
                  }`}
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