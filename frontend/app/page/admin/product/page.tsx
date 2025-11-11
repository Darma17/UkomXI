'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Komponen judul dengan tooltip jika terpotong
function ClampedTitle({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const truncated = el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth
      setIsTruncated(truncated)
    }
    // ukur setelah render & saat resize
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [text])

  return (
    <div className="relative">
      <div
        ref={ref}
        className="max-w-[320px] text-gray-900 leading-snug line-clamp-2"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        title={isTruncated ? text : undefined} // fallback native tooltip
      >
        {text}
      </div>
      {isTruncated && show && (
        <div className="absolute z-20 left-0 top-full mt-1 bg-black text-white text-xs rounded px-2 py-1 shadow-md max-w-[420px]">
          {text}
        </div>
      )}
    </div>
  )
}

export default function AdminProduct() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [allow, setAllow] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  type BookRow = {
    id: number
    title: string
    price: number
    modal_price?: number | null
    stock: number
    cover_image?: string | null
    category?: { id: number; name: string } | null
    author?: string
    publisher?: string
    publish_year?: number | string | null
    is_highlight?: boolean
    description?: string | null
    category_id?: number | null
    created_at?: string | null
  }
  const [products, setProducts] = useState<BookRow[]>([])
  type Category = { id: number; name: string }
  const [categories, setCategories] = useState<Category[]>([])

  // Search & Sort (admin) — diletakkan SEBELUM early return agar urutan Hooks konsisten
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('') // '', price-low, price-high, stock-high, stock-low, newest, oldest
  const [filterCategoryId, setFilterCategoryId] = useState<string>('') // '' = semua kategori

  const visibleProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim()
    let list = q
      ? products.filter(p => (p.title || '').toLowerCase().includes(q))
      : [...products]
    // filter by category if selected
    if (filterCategoryId) {
      const cid = Number(filterCategoryId)
      list = list.filter(p => Number(p.category?.id ?? p.category_id ?? 0) === cid)
    }
    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
        break
      case 'price-high':
        list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
        break
      case 'stock-high':
        list.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
        break
      case 'stock-low':
        list.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
        break
      case 'newest':
        list.sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0
          return tb - ta
        })
        break
      case 'oldest':
        list.sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0
          return ta - tb
        })
        break
    }
    return list
  }, [products, searchQuery, sortBy, filterCategoryId])

  const handleImageChange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      setPendingFile(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const openAddModal = () => {
    setSelectedProduct({
      title: '',
      author: '',
      publisher: '',
      price: 0,
      modal_price: 0,
      publish_year: '',
      stock: 0,
      category_id: categories[0]?.id ?? null,
      is_highlight: false,
      description: '',
    })
    setPreviewImage(null)
    setPendingFile(null)
    setIsModalOpen(true)
  }

  const openEditModal = (product: any) => {
    setSelectedProduct({
      ...product,
      category_id: product?.category?.id ?? null,
    })
    setPreviewImage(product.cover_image ? `http://localhost:8000/storage/${product.cover_image}` : null)
    setPendingFile(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (product: any) => {
    setSelectedProduct(product)
    setIsDeleteOpen(true)
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(price);
  }

  // Guard admin (adminToken atau authToken role admin)
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (adminToken) { setAllow(true); setChecked(true); return }
    const token = localStorage.getItem('authToken')
    if (!token) { router.replace('/page/login-admin'); return }
    fetch('http://127.0.0.1:8000/api/user', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => { if (u?.role === 'admin') setAllow(true); else router.replace('/page/login-admin') })
      .catch(() => router.replace('/page/login-admin'))
      .finally(() => setChecked(true))
  }, [router])

  // Load books from backend (with category)
  async function loadBooks() {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
      const res = await fetch('http://127.0.0.1:8000/api/books', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json().catch(() => [])
      if (Array.isArray(data)) setProducts(data)
      else setProducts([])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }
  // PENTING: panggil hook ini sebelum early return; guard dengan allow
  useEffect(() => {
    if (!allow) return
    loadBooks()
    // load categories
    ;(async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
        const res = await fetch('http://127.0.0.1:8000/api/categories', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const data = await res.json().catch(() => [])
        setCategories(Array.isArray(data) ? data : [])
      } catch {
        setCategories([])
      }
    })()
  }, [allow])

  // Early return ditaruh SETELAH semua hooks terdefinisi
  if (!checked || !allow) return null

  // Save (Edit minimal fields)
  async function handleSaveEdit() {
    if (!selectedProduct) { setIsModalOpen(false); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
      if (selectedProduct?.id) {
        // EDIT: kirim JSON (tanpa upload gambar)
        const payload = {
          title: selectedProduct.title,
          author: selectedProduct.author || '',
          publisher: selectedProduct.publisher || '',
          publish_year: selectedProduct.publish_year || null,
          price: Number(selectedProduct.price || 0),
          modal_price: selectedProduct.modal_price === null ? null : Number(selectedProduct.modal_price || 0),
          stock: Number(selectedProduct.stock || 0),
          category_id: selectedProduct.category_id || null,
          is_highlight: !!selectedProduct.is_highlight,
          description: selectedProduct.description || null,
        }
        const res = await fetch(`http://127.0.0.1:8000/api/books/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Gagal menyimpan perubahan')
      } else {
        // ADD: gunakan FormData (dukung cover_image)
        const fd = new FormData()
        fd.append('title', selectedProduct.title || '')
        fd.append('author', selectedProduct.author || '')
        fd.append('publisher', selectedProduct.publisher || '')
        if (selectedProduct.publish_year) fd.append('publish_year', String(selectedProduct.publish_year))
        if (selectedProduct.description) fd.append('description', selectedProduct.description)
        fd.append('price', String(Number(selectedProduct.price || 0)))
        if (selectedProduct.modal_price !== undefined && selectedProduct.modal_price !== null) {
          fd.append('modal_price', String(Number(selectedProduct.modal_price || 0)))
        }
        fd.append('stock', String(Number(selectedProduct.stock || 0)))
        if (selectedProduct.category_id) fd.append('category_id', String(selectedProduct.category_id))
        fd.append('is_highlight', selectedProduct.is_highlight ? '1' : '0')
        if (pendingFile) fd.append('cover_image', pendingFile)

        const res = await fetch('http://127.0.0.1:8000/api/books', {
          method: 'POST',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: fd
        })
        if (!res.ok) throw new Error('Gagal menambah produk')
      }
      await loadBooks()
      // beri tahu halaman lain untuk refresh data
      window.dispatchEvent(new Event('booksChanged'))
      setIsModalOpen(false)
      setPendingFile(null)
      setPreviewImage(null)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menyimpan')
      setTimeout(() => setErrorMsg(''), 2000)
    } finally {
      setSaving(false)
    }
  }

  // Confirm delete
  async function confirmDelete() {
    if (!selectedProduct) { setIsDeleteOpen(false); return }
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
      const res = await fetch(`http://127.0.0.1:8000/api/books/${selectedProduct.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error('Gagal menghapus')
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id))
      window.dispatchEvent(new Event('booksChanged'))
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menghapus')
      setTimeout(() => setErrorMsg(''), 2000)
    } finally {
      setIsDeleteOpen(false)
    }
  }

  return (
    <div className="text-black pl-15">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manajemen Produk</h1>
          <p className="text-gray-500 text-sm">Kelola semua produk yang tersedia di toko Anda.</p>
        </div>
        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          + Tambah Produk
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded">{errorMsg}</div>
      )}

      {/* Control bar: Search (kiri) + Category & Sort (kanan) */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul produk..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <div className="w-full sm:w-1/2 flex gap-3">
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">Urutkan</option>
            <option value="price-low">Harga Termurah</option>
            <option value="price-high">Harga Termahal</option>
            <option value="stock-high">Stock Terbanyak</option>
            <option value="stock-low">Stock Terdikit</option>
            <option value="newest">Baru Ditambahkan</option>
            <option value="oldest">Lama Ditambahkan</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
            <tr className="text-xs uppercase tracking-wide text-gray-600">
              <th className="p-3 text-left w-12">No</th>
              <th className="p-3 text-left w-[86px]">Gambar</th>
              <th className="p-3 text-left min-w-[220px]">Title</th>
              <th className="p-3 text-center w-20">Stock</th>
              <th className="p-3 text-right w-40">Price</th>
              <th className="p-3 text-right w-40">Modal Price</th>
              <th className="p-3 text-left w-44">Category</th>
              <th className="p-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
           <tbody>
            {visibleProducts.map((p, index) => (
              <motion.tr
                key={p.id}
                className="relative group border-b last:border-none odd:bg-white even:bg-gray-50 hover:bg-gray-100/70 transition-colors"
              >
                <td className="p-3 align-middle text-gray-700">{index + 1}</td>
                <td className="p-3 align-middle">
                  <div className="w-[54px] h-[72px] rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                    <Image
                      src={p.cover_image ? `http://localhost:8000/storage/${p.cover_image}` : '/images/dummyImage.jpg'}
                      alt={p.title}
                      width={54}
                      height={72}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="p-3 align-middle">
                  <ClampedTitle text={p.title} />
                </td>
                <td className="p-3 align-middle text-center text-gray-800">{p.stock}</td>
                <td className="p-3 align-middle text-right font-medium text-gray-900">
                  {formatPrice(Number(p.price || 0))}
                </td>
                <td className="p-3 align-middle text-right text-gray-700">
                  {formatPrice(Number(p.modal_price || 0))}
                </td>
                <td className="p-3 align-middle">
                  {p.category?.name ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {p.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3 align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(p)}
                      className="p-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
           </tbody>
         </table>
        {loading && <div className="p-4 text-sm text-gray-500">Memuat produk...</div>}
       </div>

      {/* ===================== MODAL ADD / EDIT ===================== */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-xl font-semibold mb-4">
                {selectedProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h2>

              {/* Form lengkap */}
              <div className="space-y-4">
                {/* 1) Title full width */}
                <input
                  className="w-full p-2 border rounded-md"
                  placeholder="Title"
                  value={selectedProduct?.title || ''}
                  onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, title: e.target.value }))}
                />

                {/* 2) Author & Publisher */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    className="w-full p-2 border rounded-md"
                    placeholder="Author"
                    value={selectedProduct?.author || ''}
                    onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, author: e.target.value }))}
                  />
                  <input
                    className="w-full p-2 border rounded-md"
                    placeholder="Publisher"
                    value={selectedProduct?.publisher || ''}
                    onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, publisher: e.target.value }))}
                  />
                </div>

                {/* 3) Harga jual (price) & Harga modal (modal_price) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    className="w-full p-2 border rounded-md"
                    placeholder="Harga Jual"
                    type="number"
                    value={selectedProduct?.price ?? ''}
                    onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, price: e.target.value }))}
                  />
                  <input
                    className="w-full p-2 border rounded-md"
                    placeholder="Harga Modal"
                    type="number"
                    value={selectedProduct?.modal_price ?? ''}
                    onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, modal_price: e.target.value }))}
                  />
                </div>

                {/* 4) Publish year & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    className="w-full p-2 border rounded-md"
                    placeholder="Tahun Publish"
                    type="number"
                    value={selectedProduct?.publish_year ?? ''}
                    onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, publish_year: e.target.value }))}
                  />
                  <input
                    className="w-full p-2 border rounded-md"
                    placeholder="Stock"
                    type="number"
                    value={selectedProduct?.stock ?? ''}
                    onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, stock: e.target.value }))}
                  />
                </div>

                {/* 5) Category & is_highlight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedProduct?.category_id ?? ''}
                    onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, category_id: Number(e.target.value || 0) || null }))}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedProduct?.is_highlight ? 'true' : 'false'}
                    onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, is_highlight: e.target.value === 'true' }))}
                  >
                    <option value="false">Highlight: False</option>
                    <option value="true">Highlight: True</option>
                  </select>
                </div>

                {/* 6) Description */}
                <textarea
                  className="w-full p-2 border rounded-md min-h-[120px]"
                  placeholder="Description"
                  value={selectedProduct?.description || ''}
                  onChange={(e) => setSelectedProduct((sp: any) => ({ ...sp, description: e.target.value }))}
                />

                {/* 7) Upload Image dashed box */}
                <div className="border-2 border-dashed rounded-md p-4 text-center">
                  {previewImage ? (
                    <div className="flex flex-col items-center">
                      <Image
                        src={previewImage}
                        alt="Preview"
                        width={160}
                        height={220}
                        className="rounded-md mb-3 object-cover"
                      />
                      <label className="text-blue-600 underline cursor-pointer">
                        Ganti Gambar
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-blue-600">
                      Klik untuk Upload Gambar
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                   setPendingFile(null)
                   setPreviewImage(null)
                    setIsModalOpen(false)
                  }}
                  className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== MODAL DELETE ===================== */}
      <AnimatePresence>
        {isDeleteOpen && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center"
            >
              <h2 className="text-lg font-semibold mb-3">Hapus Produk</h2>
              <p className="text-gray-600 mb-4">
                Yakin ingin menghapus <b>{selectedProduct.title}</b>?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Tidak
                </button>
                <button
                  onClick={confirmDelete}
                   className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Iya
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
