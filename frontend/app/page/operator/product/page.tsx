'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import api from '../../../api/api'

type BookRow = {
  id: number
  title: string
  price: number
  stock: number
  cover_image?: string | null
  category?: { id: number; name: string } | null
  category_id?: number | null
  author?: string
  publisher?: string
  publish_year?: number | string | null
  description?: string | null
  created_at?: string | null
}
type Category = { id: number; name: string }

type FormState = {
  title: string
  author: string
  publisher: string
  publish_year: string | number
  price: string | number
  stock: string | number
  category_id: string | number
  description: string
}

export default function OperatorProduct() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [allow, setAllow] = useState(false)

  // Guard operator: operatorToken atau authToken dengan role operator
  useEffect(() => {
    const operatorToken = localStorage.getItem('operatorToken')
    if (operatorToken) { setAllow(true); setChecked(true); return }
    const token = localStorage.getItem('authToken')
    if (!token) { router.replace('/page/login-operator'); return }
    api.get('/user')
      .then(r => r?.data ?? null)
      .then(u => { if (u?.role === 'operator') setAllow(true); else router.replace('/page/login-operator') })
      .catch(() => router.replace('/page/login-operator'))
      .finally(() => setChecked(true))
  }, [router])

  const [products, setProducts] = useState<BookRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const [bRes, cRes] = await Promise.all([
        api.get('/books'),
        api.get('/categories'),
      ])
      setProducts(Array.isArray(bRes.data) ? bRes.data : [])
      setCategories(Array.isArray(cRes.data) ? cRes.data : [])
    } catch {
      setProducts([]); setCategories([])
    } finally { setLoading(false) }
  }
  useEffect(() => { if (allow) loadData() }, [allow])

  // search/sort/category
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState<string>('')

  const visible = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim()
    let list = q ? products.filter(p => (p.title||'').toLowerCase().includes(q)) : [...products]
    if (filterCategoryId) {
      const cid = Number(filterCategoryId)
      list = list.filter(p => Number(p.category?.id ?? p.category_id ?? 0) === cid)
    }
    switch (sortBy) {
      case 'price-low': list.sort((a,b)=>Number(a.price)-Number(b.price)); break
      case 'price-high': list.sort((a,b)=>Number(b.price)-Number(a.price)); break
      case 'stock-high': list.sort((a,b)=>Number(b.stock)-Number(a.stock)); break
      case 'stock-low': list.sort((a,b)=>Number(a.stock)-Number(b.stock)); break
      case 'newest': list.sort((a,b)=>(new Date(b.created_at||0).getTime())-(new Date(a.created_at||0).getTime())); break
      case 'oldest': list.sort((a,b)=>(new Date(a.created_at||0).getTime())-(new Date(b.created_at||0).getTime())); break
    }
    return list
  }, [products, searchQuery, filterCategoryId, sortBy])

  // Add Product modal (operator boleh menambah)
  const [showAddModal, setShowAddModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File|null>(null)
  const [preview, setPreview] = useState<string>('')            // selalu string -> hindari union null
  const [form, setForm] = useState<FormState>({
    title:'', author:'', publisher:'', publish_year:'', price:'', stock:'', category_id:'', description:''
  })
  const [saving, setSaving] = useState(false)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) {
      setPendingFile(null)
      setPreview('')
      return
    }
    setPendingFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function saveAdd() {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title || '')
      fd.append('author', form.author || '')
      fd.append('publisher', form.publisher || '')
      if (form.publish_year) fd.append('publish_year', String(form.publish_year))
      if (form.description) fd.append('description', form.description)
      fd.append('price', String(Number(form.price || 0)))
      fd.append('stock', String(Number(form.stock || 0)))
      if (form.category_id) fd.append('category_id', String(form.category_id))
      fd.append('is_highlight', '0')
      if (pendingFile) fd.append('cover_image', pendingFile)

      await api.post('/books', fd) // Content-Type otomatis oleh Axios
      await loadData()
      setShowAddModal(false)
      setPendingFile(null)
      setPreview('')
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menyimpan')
      setTimeout(() => setErrorMsg(''), 2000)
    } finally {
      setSaving(false)
    }
  }

  // Add Stock modal
  const [stockModal, setStockModal] = useState<{id:number; title:string} | null>(null)
  const [amount, setAmount] = useState<number>(1)
  async function submitAddStock() {
    if (!stockModal) return
    try {
      await api.post(`/books/${stockModal.id}/add-stock`, { amount })
      await loadData()
      setStockModal(null)
      setAmount(1)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menambah stok')
      setTimeout(() => setErrorMsg(''), 2000)
    }
  }

  if (!checked || !allow) return null

  return (
    <div className="text-black bg-white p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Produk (Operator)</h1>
          <p className="text-gray-500 text-sm">Lihat dan tambahkan produk, serta tambah stok.</p>
        </div>
        <button onClick={()=>{ setForm({ title:'', author:'', publisher:'', publish_year:'', price:'', stock:'', category_id:'', description:'' }); setPendingFile(null); setPreview(''); setShowAddModal(true) }} className="mt-4 sm:mt-0 px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
          + Tambah Produk
        </button>
      </div>

      {errorMsg && <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded">{errorMsg}</div>}

      {/* Control bar */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-1/2">
          <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Cari judul produk..." className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="w-full sm:w-1/2 flex gap-3">
          <select value={filterCategoryId} onChange={(e)=>setFilterCategoryId(e.target.value)} className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black">
            <option value="">Semua Kategori</option>
            {categories.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
          <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black">
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
              <th className="p-3 text-left w-44">Category</th>
              <th className="p-3 text-center w-40">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p, i)=>(
              <motion.tr key={p.id} className="border-b last:border-none odd:bg-white even:bg-gray-50">
                <td className="p-3">{i+1}</td>
                <td className="p-3">
                  <div className="w-[54px] h-[72px] rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                    <Image src={p.cover_image ? `http://localhost:8000/storage/${p.cover_image}` : '/images/dummyImage.jpg'} alt={p.title} width={54} height={72} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="p-3">{p.title}</td>
                <td className="p-3 text-center">{p.stock}</td>
                <td className="p-3 text-right">Rp {Number(p.price||0).toLocaleString('id-ID')}</td>
                <td className="p-3">{p.category?.name || '-'}</td>
                <td className="p-3 text-center">
                  <button onClick={()=>setStockModal({ id:p.id, title:p.title })} className="px-3 py-1.5 rounded-md border border-blue-600 text-blue-700 hover:bg-blue-50">
                    Tambah Stok
                  </button>
                </td>
              </motion.tr>
            ))}
            {!loading && visible.length===0 && (
              <tr><td colSpan={7} className="text-center text-gray-500 py-4">Tidak ada produk</td></tr>
            )}
          </tbody>
        </table>
        {loading && <div className="p-4 text-sm text-gray-500">Memuat produk...</div>}
      </div>

      {/* Modal Tambah Produk */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-lg overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Tambah Produk</h2>
                <button onClick={()=>setShowAddModal(false)}>✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="border p-2 rounded-md" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
                <input className="border p-2 rounded-md" placeholder="Author" value={form.author} onChange={e=>setForm({...form, author:e.target.value})}/>
                <input className="border p-2 rounded-md" placeholder="Publisher" value={form.publisher} onChange={e=>setForm({...form, publisher:e.target.value})}/>
                <input className="border p-2 rounded-md" placeholder="Tahun Publish" type="number" value={form.publish_year} onChange={e=>setForm({...form, publish_year:e.target.value})}/>
                <input className="border p-2 rounded-md" placeholder="Harga" type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>
                <input className="border p-2 rounded-md" placeholder="Stock" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})}/>
                <select className="border p-2 rounded-md" value={form.category_id} onChange={e=>setForm({...form, category_id:e.target.value})}>
                  <option value="">Pilih Kategori</option>
                  {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="border-2 border-dashed rounded-md p-4 text-center col-span-1 sm:col-span-2">
                  {preview ? (
                    <div className="flex flex-col items-center">
                      <Image src={preview} alt="Preview" width={160} height={220} className="rounded-md mb-3 object-cover" />
                      <label className="text-blue-600 underline cursor-pointer">
                        Ganti Gambar
                        <input type="file" accept="image/*" onChange={onFileChange} className="hidden"/>
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-blue-600">
                      Klik untuk Upload Gambar
                      <input type="file" accept="image/*" onChange={onFileChange} className="hidden"/>
                    </label>
                  )}
                </div>
                <textarea className="border p-2 rounded-md col-span-1 sm:col-span-2 min-h-[100px]" placeholder="Deskripsi" value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={()=>setShowAddModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Batal</button>
                <button onClick={saveAdd} disabled={saving} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Tambah Stok */}
      <AnimatePresence>
        {stockModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} className="bg-white p-6 rounded-xl w-full max-w-sm shadow-lg">
              <h3 className="text-lg font-semibold mb-3">Tambah Stok</h3>
              <p className="text-sm text-gray-600 mb-3">Produk: <b>{stockModal.title}</b></p>
              <input type="number" min={1} value={amount} onChange={e=>setAmount(Math.max(1, Number(e.target.value||1)))} className="w-full border p-2 rounded-md mb-4"/>
              <div className="flex justify-end gap-2">
                <button onClick={()=>setStockModal(null)} className="px-4 py-2 border rounded-lg">Batal</button>
                <button onClick={submitAddStock} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tambah</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
