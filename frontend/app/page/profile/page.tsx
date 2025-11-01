'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Pencil, LogOut, Trash, Heart, ShoppingCart } from 'lucide-react'
import Link from "next/link"
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useRouter } from 'next/navigation'

export default function Profile() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'riwayat' | 'alamat' | 'favorit'>('riwayat')
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false)
  const [name, setName] = useState('')
  const [tempName, setTempName] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState<number | null>(null)

  const [isHovering, setIsHovering] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState("/images/profile.png") // fallback
  // state untuk ganti foto
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [savingName, setSavingName] = useState(false)
  const [savingImage, setSavingImage] = useState(false)
  const [addrSaving, setAddrSaving] = useState(false)
  const [addrDeleting, setAddrDeleting] = useState(false)
  const busy = savingName || savingImage || addrSaving || addrDeleting

  const [uploadError, setUploadError] = useState<string>('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setPendingFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  // Fetch user data on mount
  useEffect(() => {
    async function loadUser() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!token) return
      try {
        const res = await fetch('http://127.0.0.1:8000/api/user', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) return
        const u = await res.json()
        setUserId(u?.id ?? null)
        setName(u?.name ?? '')
        setTempName(u?.name ?? '')
        setEmail(u?.email ?? '')
        // profile_image bisa berisi path relatif (mis: profile/abc.jpg) atau null
        const imgPath = u?.profile_image
        if (imgPath) {
          // jika sudah berisi URL penuh, pakai langsung; jika tidak, prefiks /storage
          const full = String(imgPath).startsWith('http')
            ? String(imgPath)
            : `http://127.0.0.1:8000/storage/${imgPath}`
          setSelectedImage(full)
        } else {
          setSelectedImage('/images/profile.png')
        }
      } catch {
        // ignore
      }
    }
    loadUser()
  }, [])

  // Simpan nama ke server
  async function saveName() {
    if (!userId) return
    const token = localStorage.getItem('authToken') || ''
    setSavingName(true)
    try {
      const fd = new FormData()
      fd.append('name', tempName)
      const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })
      if (res.ok) {
        setName(tempName)
        setIsEditNameOpen(false)
      }
    } catch {
      // ignore
    } finally {
      setSavingName(false)
    }
  }

  // Upload foto profil setelah user klik OK pada modal
  async function saveProfileImage() {
    if (!pendingFile) { setIsModalOpen(false); return }
    const token = localStorage.getItem('authToken') || ''
    setSavingImage(true)
    try {
      const fd = new FormData()
      fd.append('profile_image', pendingFile)
      const res = await fetch(`http://127.0.0.1:8000/api/user/profile-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })

      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const imgPath = data?.profile_image
        const full = imgPath
          ? (String(imgPath).startsWith('http') ? String(imgPath) : `http://127.0.0.1:8000/storage/${imgPath}`)
          : '/images/profile.png'
        setSelectedImage(full)
        setUploadError('')
      } else {
        setUploadError(data?.message || 'Gagal mengunggah foto profil')
      }
    } catch {
      setUploadError('Gagal mengunggah foto profil (network)')
    } finally {
      // tutup modal & bersihkan preview
      setIsModalOpen(false)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setPendingFile(null)
      setSavingImage(false)
    }
  }

  // Fetch semua alamat milik user login
  async function fetchAddresses() {
    const token = localStorage.getItem('authToken') || ''
    if (!token) return
    setAddrLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/addresses/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAddresses(Array.isArray(data) ? data : [])
      }
    } catch {
      // ignore
    } finally {
      setAddrLoading(false)
    }
  }

  // Tipe Order dan OrderItem untuk riwayat pesanan
  type OrderItemT = {
    id: number
    book_id: number
    quantity: number
    price: number
    book?: { title?: string; author?: string | null; cover_image?: string | null }
  }
  type OrderT = {
    id: number
    user_id: number
    order_code: string
    total_price: number
    status: string
    created_at?: string
    items?: OrderItemT[]
    complete?: number | boolean
    kurir?: { id: number; nama: string; harga: number } | null
  }
  // Tipe minimal buku untuk tab Favorit
  type FavBook = {
    id: number
    title: string
    author?: string | null
    price: number
    stock?: number | null
    cover_image?: string | null
  }

  const [orders, setOrders] = useState<OrderT[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string>('')

  // Loader riwayat pesanan user
  async function fetchOrders() {
    const token = localStorage.getItem('authToken') || ''
    setOrdersLoading(true)
    setOrdersError('')
    try {
      const res = await fetch('http://127.0.0.1:8000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setOrders([])
        setOrdersError('Gagal memuat riwayat pesanan')
        return
      }
      const data: any[] = await res.json()
      const list: OrderT[] = Array.isArray(data) ? data : []
      const mine = userId ? list.filter(o => Number(o.user_id) === Number(userId)) : list
      // urutkan terbaru dulu
      const sorted = [...mine].sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      })
      setOrders(sorted)
    } catch {
      setOrders([])
      setOrdersError('Gagal memuat riwayat pesanan')
    } finally {
      setOrdersLoading(false)
    }
  }

  // Helper format tanggal Indonesia
  function formatIdDate(dt?: string) {
    if (!dt) return '-'
    try {
      return new Date(dt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch {
      return dt
    }
  }

  // Muat alamat ketika tab "alamat" dipilih pertama kali
  useEffect(() => {
    if (activeTab === 'alamat') {
      fetchAddresses()
    }
  }, [activeTab])

  // Muat riwayat ketika tab "riwayat" dibuka dan userId sudah ada
  useEffect(() => {
    if (activeTab === 'riwayat' && userId) {
      fetchOrders()
    }
  }, [activeTab, userId])

  // Muat favorit ketika tab "favorit" dipilih
  useEffect(() => {
    if (activeTab === 'favorit') {
      fetchFavorites()
    }
  }, [activeTab])

  // Tipe dan state alamat
  interface Address {
    id: number
    nama_alamat: string
    nama_penerima: string
    no_telp: string
    alamat_lengkap: string
    provinsi: string
    kabupaten: string
    kecamatan: string
  }
  const emptyAddr = {
    nama_alamat: '',
    nama_penerima: '',
    no_telp: '',
    alamat_lengkap: '',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
  }
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const [addrForm, setAddrForm] = useState<typeof emptyAddr>(emptyAddr)

  // State modal hapus alamat
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null)

  // Wilayah Indonesia (EMSIFA)
  type Option = { id: string; name: string }
  const [provinces, setProvinces] = useState<Option[]>([])
  const [regencies, setRegencies] = useState<Option[]>([])
  const [districts, setDistricts] = useState<Option[]>([])
  const [loadingProv, setLoadingProv] = useState(false)
  const [loadingKab, setLoadingKab] = useState(false)
  const [loadingKec, setLoadingKec] = useState(false)
  const [selectedProvId, setSelectedProvId] = useState<string>('')
  const [selectedKabId, setSelectedKabId] = useState<string>('')
  const [selectedKecId, setSelectedKecId] = useState<string>('')
  // Prefill nama wilayah pada mode edit (cocokkan by name saat list loaded)
  const [prefillProvName, setPrefillProvName] = useState<string | null>(null)
  const [prefillKabName, setPrefillKabName] = useState<string | null>(null)
  const [prefillKecName, setPrefillKecName] = useState<string | null>(null)
  const WIL_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api'

  async function loadProvinces() {
    if (provinces.length > 0) return
    setLoadingProv(true)
    try {
      const res = await fetch(`${WIL_BASE}/provinces.json`)
      const data = await res.json()
      setProvinces((data || []).map((x: any) => ({ id: String(x.id), name: String(x.name) })))
    } catch {
      setProvinces([])
    } finally {
      setLoadingProv(false)
    }
  }
  async function loadRegencies(provId: string) {
    if (!provId) { setRegencies([]); return }
    setLoadingKab(true)
    try {
      const res = await fetch(`${WIL_BASE}/regencies/${provId}.json`)
      const data = await res.json()
      setRegencies((data || []).map((x: any) => ({ id: String(x.id), name: String(x.name) })))
    } catch {
      setRegencies([])
    } finally {
      setLoadingKab(false)
    }
  }
  async function loadDistricts(kabId: string) {
    if (!kabId) { setDistricts([]); return }
    setLoadingKec(true)
    try {
      const res = await fetch(`${WIL_BASE}/districts/${kabId}.json`)
      const data = await res.json()
      setDistricts((data || []).map((x: any) => ({ id: String(x.id), name: String(x.name) })))
    } catch {
      setDistricts([])
    } finally {
      setLoadingKec(false)
    }
  }

  // Buka modal tambah alamat
  function openAddAddress() {
    setEditingAddressId(null)
    setAddrForm(emptyAddr)
    // reset dropdown & load provinsi
    setSelectedProvId(''); setSelectedKabId(''); setSelectedKecId('')
    setRegencies([]); setDistricts([])
    setPrefillProvName(null); setPrefillKabName(null); setPrefillKecName(null)
    loadProvinces()
    setIsEditAddressOpen(true)
  }

  // Buka modal edit alamat
  function openEditAddress(a: Address) {
    setEditingAddressId(a.id)
    setAddrForm({
      nama_alamat: a.nama_alamat || '',
      nama_penerima: a.nama_penerima || '',
      no_telp: a.no_telp || '',
      alamat_lengkap: a.alamat_lengkap || '',
      provinsi: a.provinsi || '',
      kabupaten: a.kabupaten || '',
      kecamatan: a.kecamatan || '',
    })
    // reset & prefill by name
    setSelectedProvId(''); setSelectedKabId(''); setSelectedKecId('')
    setRegencies([]); setDistricts([])
    setPrefillProvName(a.provinsi || null)
    setPrefillKabName(a.kabupaten || null)
    setPrefillKecName(a.kecamatan || null)
    loadProvinces()
    setIsEditAddressOpen(true)
  }

  // Buka modal hapus alamat
  function openDeleteAddress(a: Address) {
    setDeleteTarget(a)
    setIsDeleteModalOpen(true)
  }

  // Tutup modal hapus
  function closeDeleteModal() {
    setIsDeleteModalOpen(false)
    setDeleteTarget(null)
  }

  // Submit tambah/edit alamat
  async function submitAddressForm(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const token = localStorage.getItem('authToken') || ''
    if (!token) return
    setAddrSaving(true)
    try {
      const method = editingAddressId ? 'PUT' : 'POST'
      const url = editingAddressId
        ? `http://127.0.0.1:8000/api/addresses/${editingAddressId}`
        : 'http://127.0.0.1:8000/api/addresses'
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addrForm),
      })
      if (res.ok) {
        await fetchAddresses()
        setIsEditAddressOpen(false)
        setEditingAddressId(null)
        setAddrForm(emptyAddr)
      }
    } catch {
      // ignore
    } finally {
      setAddrSaving(false)
    }
  }

  // Konfirmasi hapus alamat (modal)
  async function confirmDeleteAddress() {
    if (!deleteTarget) return
    const token = localStorage.getItem('authToken') || ''
    if (!token) return
    setAddrDeleting(true)
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/addresses/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setAddresses(prev => prev.filter(a => a.id !== deleteTarget.id))
        closeDeleteModal()
      }
    } catch {
      // ignore
    } finally {
      setAddrDeleting(false)
    }
  }

  // Logout dari halaman profil
  async function handleLogout() {
    const token = localStorage.getItem('authToken')
    try {
      if (token) {
        await fetch('http://127.0.0.1:8000/api/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch {
      // ignore error
    } finally {
      localStorage.removeItem('authToken')
      window.dispatchEvent(new Event('authChanged'))
      router.push('/')
    }
  }

  // State untuk review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewRating, setReviewRating] = useState<number>(0)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [selectedReview, setSelectedReview] = useState<{ orderId: number; itemId: number; bookId: number; reviewId?: number | null } | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)

  function openReviewModal(orderId: number, itemId: number, bookId: number) {
    setSelectedReview({ orderId, itemId, bookId, reviewId: null })
    setReviewRating(0)
    setReviewComment('')
    setReviewModalOpen(true)
  }
  function closeReviewModal() {
    setReviewModalOpen(false)
    setSelectedReview(null)
    setReviewRating(0)
    setReviewComment('')
  }

  // Buka modal edit review: fetch review user untuk buku tsb lalu prefill
  async function openEditReview(orderId: number, itemId: number, bookId: number) {
    const token = localStorage.getItem('authToken') || ''
    setReviewLoading(true)
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/reviews?user_id=${userId}&book_id=${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const rev = await res.json()
        setSelectedReview({ orderId, itemId, bookId, reviewId: rev?.id ?? null })
        setReviewRating(Number(rev?.rating ?? 0))
        setReviewComment(String(rev?.comment ?? ''))
        setReviewModalOpen(true)
      } else {
        // fallback: buka modal tanpa prefill jika tidak ada
        setSelectedReview({ orderId, itemId, bookId, reviewId: null })
        setReviewRating(0)
        setReviewComment('')
        setReviewModalOpen(true)
      }
    } catch {
      // fallback open kosong
      setSelectedReview({ orderId, itemId, bookId, reviewId: null })
      setReviewRating(0)
      setReviewComment('')
      setReviewModalOpen(true)
    } finally {
      setReviewLoading(false)
    }
  }

  async function submitReview() {
    if (!selectedReview || !userId || reviewRating < 1) return
    const token = localStorage.getItem('authToken') || ''
    setReviewSaving(true)
    try {
      if (selectedReview.reviewId) {
        // Edit review
        await fetch(`http://127.0.0.1:8000/api/reviews/${selectedReview.reviewId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: reviewRating,
            comment: reviewComment || null,
          }),
        })
      } else {
        // Buat review baru
        await fetch('http://127.0.0.1:8000/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            book_id: selectedReview.bookId,
            rating: reviewRating,
            comment: reviewComment || null,
          }),
        })
        // Tandai item sudah direview
        await fetch(`http://127.0.0.1:8000/api/order-items/${selectedReview.itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_review: 1 }),
        })
      }
       // 3) Update UI lokal
       setOrders(prev => prev.map(o => {
         if (o.id !== selectedReview.orderId) return o
         return {
           ...o,
           items: (o.items || []).map(it => it.id === selectedReview.itemId ? { ...it, /* @ts-ignore */ is_review: 1 } : it)
         }
       }))
       closeReviewModal()
     } catch {
       // optional: tampilkan error
     } finally {
       setReviewSaving(false)
     }
  }

  // Konfirmasi pesanan diterima (set complete = 1)
  const [completingOrderId, setCompletingOrderId] = useState<number | null>(null)
  async function confirmOrderReceived(orderId: number) {
    const token = localStorage.getItem('authToken') || ''
    if (!token) return
    setCompletingOrderId(orderId)
    try {
      await fetch(`http://127.0.0.1:8000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ complete: 1 }),
      })
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, complete: 1 } : o))
    } catch {
      // ignore
    } finally {
      setCompletingOrderId(null)
    }
  }

  // Ambil semua buku favorit milik user login
  async function fetchFavorites() {
    const token = localStorage.getItem('authToken') || ''
    if (!token) return
    setFavLoading(true)
    setFavError('')
    try {
      const res = await fetch('http://127.0.0.1:8000/api/favorits', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setFavBooks([])
        setFavError('Gagal memuat favorit')
        return
      }
      const items = await res.json()
      const books: FavBook[] = (Array.isArray(items) ? items : [])
        .map((it: any) => it?.book)
        .filter((b: any) => !!b)
      setFavBooks(books)
    } catch {
      setFavBooks([])
      setFavError('Gagal memuat favorit')
    } finally {
      setFavLoading(false)
    }
  }

  // Hapus dari favorit berdasarkan bookId, lalu perbarui UI lokal
  async function toggleFavorite(bookId: number) {
    const token = localStorage.getItem('authToken') || ''
    if (!token) return
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/favorits/by-book/${bookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setFavBooks(prev => prev.filter(b => Number(b.id) !== Number(bookId)))
      }
    } catch {
      // ignore
    }
  }

  // Tambah ke cart dari grid Favorit
  async function handleFavCartClick(bookId: number) {
    const token = localStorage.getItem('authToken') || ''
    if (!token) return
    setCartAdding(true)
    try {
      await fetch('http://127.0.0.1:8000/api/cart/add-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ book_id: bookId, quantity: 1 }),
      })
      setCartSuccessMsg('Berhasil ditambahkan ke keranjang')
      window.dispatchEvent(new Event('authChanged'))
      setTimeout(() => setCartSuccessMsg(''), 2000)
    } catch {
      // ignore
    } finally {
      setCartAdding(false)
    }
  }

  // State Favorit
  const [favBooks, setFavBooks] = useState<FavBook[]>([])
  const [favLoading, setFavLoading] = useState(false)
  const [favError, setFavError] = useState<string>('')
  const [hoveredFavId, setHoveredFavId] = useState<number | null>(null)
  const [cartAdding, setCartAdding] = useState(false)
  const [cartSuccessMsg, setCartSuccessMsg] = useState('')

  return (
    <>
      <Navbar />
      {/* Toast sukses tambah cart (Favorit) */}
      {cartSuccessMsg && (
        <div className="fixed left-1/2 -translate-x-1/2 top-6 z-50">
          <div className="bg-green-600 text-white px-6 py-2 rounded">{cartSuccessMsg}</div>
        </div>
      )}
      {uploadError && (
        <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
          <div className="bg-red-600 text-white text-sm font-semibold py-3 px-4 rounded-lg shadow-md">
            {uploadError}
          </div>
        </div>
      )}
      {/* Global busy overlay: blokir klik + cursor not-allowed */}
      {busy && (
        <div className="fixed inset-0 z-[100] bg-transparent cursor-not-allowed" style={{ pointerEvents: 'auto' }} />
      )}
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4">
        {/* Container relatif untuk tombol logout di kanan-atas */}
        <div className="w-full max-w-2xl relative">
          <button
            onClick={handleLogout}
            className={`absolute right-0 top-1 flex items-center gap-1 text-red-600 text-sm hover:underline cursor-pointer ${busy ? 'cursor-not-allowed opacity-70' : ''}`}
            disabled={busy}
          >
            <LogOut size={16} /> Keluar
          </button>

          <div className="flex flex-col items-center">
            {/* Foto profil dengan hover effect */}
            <div
              className={`relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 mb-4 group ${busy ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => setIsModalOpen(true)}
            >
              <Image src={selectedImage} alt="Profile" fill className="object-cover" />

              {/* Overlay saat hover */}
              {isHovering && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Pencil className="text-white w-8 h-8" />
              </div>
              )}
            </div>

            {/* Modal upload foto */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-lg w-80 text-center">
                    <h2 className="text-lg font-semibold mb-4 text-black">Ganti Foto Profil</h2>

                    {/* Preview bulat */}
                    <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border">
                      <img
                        src={previewUrl || selectedImage}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={`block w-full text-sm text-gray-600 mb-4 ${busy ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      disabled={busy}
                    />

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          // batalkan perubahan
                          if (previewUrl) URL.revokeObjectURL(previewUrl)
                          setPreviewUrl(null)
                          setPendingFile(null)
                          setIsModalOpen(false)
                        }}
                        className={`px-4 py-2 text-gray-600 bg-gray-300 rounded-md hover:bg-gray-400 transition ${busy ? 'cursor-not-allowed opacity-70' : ''}`}
                        disabled={busy}
                      >
                        Batal
                      </button>
                      <button
                        onClick={saveProfileImage}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${(!pendingFile || busy) ? 'cursor-not-allowed opacity-70' : ''}`}
                        disabled={!pendingFile || busy}
                      >
                        Simpan
                      </button>
                    </div>
                </div>
                </div>
            )}
            </div>
        </div>

        {/* Email dari DB */}
        <p className="text-black text-sm mb-1">{email || ''}</p>

        {/* Nama + Edit */}
        <div className="flex items-center space-x-2 mb-6">
          <h2 className="text-xl text-black font-semibold">{name}</h2>
          <button
           onClick={() => setIsEditNameOpen(true)}
           className={`p-1 hover:bg-gray-200 rounded-full transition ${busy ? 'cursor-not-allowed opacity-70' : ''}`}
           disabled={busy}
           >
           <Pencil size={18} className="text-gray-700" />
           </button>
        </div>

        {/* Navigasi Tabs */}
        <div className="flex space-x-10 border-b border-gray-300 mb-6">
          <button
            className={`pb-2 font-medium ${activeTab === 'riwayat' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
            onClick={() => setActiveTab('riwayat')}
          >
            Riwayat Pesanan
          </button>
          <button
            className={`pb-2 font-medium ${activeTab === 'favorit' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
            onClick={() => setActiveTab('favorit')}
          >
            Favorit
          </button>
          <button
            className={`pb-2 font-medium ${activeTab === 'alamat' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
            onClick={() => setActiveTab('alamat')}
          >
            Alamat Pengguna
          </button>
        </div>

        {/* Konten Tab */}
        <div className="w-full max-w-2xl">
         {activeTab === 'riwayat' ? (
  <div className="space-y-6 max-h-[460px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
    {ordersLoading ? (
      <div className="text-sm text-gray-500">Memuat riwayat pesanan...</div>
    ) : ordersError ? (
      <div className="text-sm text-red-600">{ordersError}</div>
    ) : orders.length === 0 ? (
      <div className="text-sm text-gray-500">Belum ada pesanan.</div>
    ) : (
      orders.map((order) => (
        <div key={order.id} className="bg-white p-4 rounded-xl shadow-md border">
          {/* Header: kiri = Kode Pesanan, kanan = Tanggal Belanja */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-black">
              Kode Pesanan:{' '}
              <span className="font-semibold text-black">{order.order_code}</span>
            </p>
            <p className="text-sm text-black">
              Tanggal Belanja:{' '}
              <span className="font-medium text-black">{formatIdDate(order.created_at)}</span>
            </p>
          </div>

          <div className="space-y-3">
            {(order.items || []).map((it) => {
              const img = it.book?.cover_image
                ? `http://127.0.0.1:8000/storage/${it.book.cover_image}`
                : '/images/dummyImage.jpg'
              const title = it.book?.title || `#${it.book_id}`
              const author = it.book?.author || ''
              const alreadyReviewed = (it as any)?.is_review === 1 || (it as any)?.is_review === true

              return (
                <div key={it.id} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <Image src={img} alt={title} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-black">{title}</p>
                    {author ? <p className="text-xs text-gray-500">by {author}</p> : null}
                    <p className="text-black text-sm">
                      Rp {Number(it.price).toLocaleString('id-ID')} × {it.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-black">
                      Rp {(Number(it.price) * Number(it.quantity)).toLocaleString('id-ID')}
                    </p>
                    {order.status === 'selesai' && (
                      alreadyReviewed ? (
                        <button
                          onClick={() => openEditReview(order.id, it.id, it.book_id)}
                          className="px-3 py-1 border border-green-600 text-green-600 rounded-md text-xs hover:bg-green-50"
                        >
                          Edit Review
                        </button>
                      ) : (
                        // Tampilkan "Kasih Review" hanya jika pesanan sudah dikonfirmasi diterima
                        order.complete ? (
                          <button
                            onClick={() => openReviewModal(order.id, it.id, it.book_id)}
                            className="px-3 py-1 border border-green-600 text-green-600 rounded-md text-xs hover:bg-green-50"
                          >
                            Review
                          </button>
                        ) : null
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Kurir: kiri nama, kanan harga (di atas Status dan Total) */}
          <div className="mt-3 text-sm flex items-center justify-between">
            <div className="text-gray-600">
              Kurir:{' '}
              <span className="font-medium text-black">{order.kurir?.nama ?? '-'}</span>
            </div>
            <div className="text-black font-medium">
              {order.kurir
                ? `Rp ${Number(order.kurir.harga).toLocaleString('id-ID')}`
                : 'Rp 0'}
            </div>
          </div>

          {/* Footer: kiri = Status (+ konfirmasi), kanan = Total */}
          <div className="mt-4 pt-3 border-t text-sm flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold text-black capitalize">{order.status}</span>
              {order.status === 'selesai' && (
                <>
                  {order.complete ? (
                    <span className="text-green-700">| Paket sudah diterima</span>
                  ) : (
                    <>
                      <span className="text-gray-600">| Paket anda sudah sampai?</span>
                      <button
                        onClick={() => confirmOrderReceived(order.id)}
                        className="px-3 py-1 rounded-md border border-green-600 text-green-600 text-xs hover:bg-green-50"
                        disabled={completingOrderId === order.id}
                      >
                        {completingOrderId === order.id ? 'Menyimpan...' : 'Sudah'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="text-black font-semibold">
              Total: Rp {Number(order.total_price).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      ))
    )}
  </div>
) : activeTab === 'favorit' ? (
  <div className="bg-white p-4 rounded-xl shadow-md border">
    <h3 className="font-semibold text-lg text-black mb-4">Buku Favorit</h3>
    {favLoading ? (
      <div className="text-sm text-gray-500">Memuat favorit...</div>
    ) : favError ? (
      <div className="text-sm text-red-600">{favError}</div>
    ) : favBooks.length === 0 ? (
      <div className="text-sm text-gray-500">Belum ada favorit.</div>
    ) : (
      <div className="max-h-[520px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {favBooks.map((b) => (
            <Link
              key={b.id}
              href={`/page/detail-buku?id=${b.id}`}
              className="flex flex-col cursor-pointer group bg-white rounded-xl border shadow-sm hover:shadow-md overflow-hidden"
              onMouseEnter={() => setHoveredFavId(b.id)}
              onMouseLeave={() => setHoveredFavId(null)}
            >
              <div className="relative w-full h-56 bg-gray-100">
                <Image
                  src={b.cover_image ? `http://127.0.0.1:8000/storage/${b.cover_image}` : '/images/dummyImage.jpg'}
                  alt={b.title}
                  fill
                  className="object-contain p-4"
                />
                {hoveredFavId === b.id && (
                  <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                    {/* Heart: filled -> hapus favorit */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(b.id) }}
                      className="bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                      title="Hapus Favorit"
                    >
                      <Heart size={18} className="text-red-500 fill-red-500" />
                    </button>
                    {(b.stock ?? 1) > 0 && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFavCartClick(b.id) }}
                        className="bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                        title="Tambah ke Keranjang"
                        disabled={cartAdding}
                      >
                        <ShoppingCart size={18} className="text-gray-700" />
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
              <div className="p-3">
                <div className="text-sm font-semibold line-clamp-2 min-h-[2.6rem] text-black">{b.title}</div>
                {b.author ? <div className="text-xs text-gray-600 line-clamp-1 mt-1">by {b.author}</div> : null}
                <div className="text-black font-bold mt-2">
                  Rp {Number(b.price).toLocaleString('id-ID')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )}
  </div>
) : (
            <div className="bg-white p-6 rounded-xl shadow-md border relative">
              {/* Header alamat + tombol tambah */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-black">Alamat Pengguna</h3>
                <button
                  onClick={openAddAddress}
                  className="px-3 py-1.5 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition"
                  disabled={busy}
                >
                  Tambah Alamat
                </button>
              </div>

              {/* List alamat (scrollable) */}
              {addrLoading ? (
                <div className="text-sm text-gray-500">Memuat alamat...</div>
              ) : addresses.length === 0 ? (
                <div className="text-sm text-gray-500">Belum ada alamat.</div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  {addresses.map((a) => (
                    <div key={a.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-black">{a.nama_alamat}</div>
                          <div className="text-sm text-gray-700 mt-1">
                            <div>Nama Penerima: <span className="text-black">{a.nama_penerima}</span></div>
                            <div>No. Telp: <span className="text-black">{a.no_telp}</span></div>
                            <div>Provinsi: <span className="text-black">{a.provinsi}</span></div>
                            <div>Kabupaten: <span className="text-black">{a.kabupaten}</span></div>
                            <div>Kecamatan: <span className="text-black">{a.kecamatan}</span></div>
                            <div>Alamat Lengkap: <span className="text-black">{a.alamat_lengkap}</span></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditAddress(a)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                            title="Edit"
                            disabled={busy}
                          >
                            <Pencil size={18} className="text-gray-700" />
                          </button>
                          <button
                            onClick={() => openDeleteAddress(a)}
                            className="p-2 hover:bg-red-50 rounded-full"
                            title="Hapus"
                            disabled={busy}
                          >
                            <Trash size={18} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
        </div>

        {/* Modal Edit Nama */}
        {isEditNameOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-80 shadow-lg">
                <h3 className="text-lg font-semibold mb-3 text-black">Ubah Nama</h3>
                <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 text-black focus:ring-black"
                disabled={busy}
                />
                <div className="flex justify-end space-x-3">
                <button
                    onClick={() => setIsEditNameOpen(false)}
                    className={`text-gray-500 hover:text-black ${busy ? 'cursor-not-allowed opacity-70' : ''}`}
                    disabled={busy}
                >
                    Batal
                </button>
                <button
                    onClick={saveName}
                    className={`bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 ${busy ? 'cursor-not-allowed opacity-70' : ''}`}
                    disabled={busy}
                >
                    Simpan
                </button>
                </div>
            </div>
            </div>
        )}

        {/* Modal Edit Alamat (reuse untuk tambah & edit) */}
        {isEditAddressOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-black">
                {editingAddressId ? 'Ubah Alamat' : 'Tambah Alamat'}
              </h3>
              <form onSubmit={submitAddressForm} className="space-y-3 mb-2">
                <input
                  type="text"
                  placeholder="Nama Alamat (contoh: Rumah, Kantor)"
                  value={addrForm.nama_alamat}
                  onChange={(e) => setAddrForm({ ...addrForm, nama_alamat: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-black"
                  required
                />
                <input
                  type="text"
                  placeholder="Nama Penerima"
                  value={addrForm.nama_penerima}
                  onChange={(e) => setAddrForm({ ...addrForm, nama_penerima: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-black"
                  required
                />
                <input
                  type="text"
                  placeholder="No. Telp"
                  value={addrForm.no_telp}
                  onChange={(e) => setAddrForm({ ...addrForm, no_telp: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-black"
                  required
                />
                {/* Dropdown Provinsi */}
                <div>
                  <select
                    value={selectedProvId}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedProvId(val)
                      const opt = provinces.find(p => p.id === val)
                      setAddrForm(prev => ({ ...prev, provinsi: opt?.name || '', kabupaten: '', kecamatan: '' }))
                      setSelectedKabId(''); setSelectedKecId('')
                      setRegencies([]); setDistricts([])
                      if (val) loadRegencies(val)
                    }}
                    className="w-full border rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
                    onFocus={() => loadProvinces()}
                    required
                  >
                    <option value="">{loadingProv ? 'Memuat...' : 'Pilih Provinsi'}</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                {/* Dropdown Kabupaten/Kota */}
                <div>
                  <select
                    value={selectedKabId}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedKabId(val)
                      const opt = regencies.find(k => k.id === val)
                      setAddrForm(prev => ({ ...prev, kabupaten: opt?.name || '', kecamatan: '' }))
                      setSelectedKecId('')
                      setDistricts([])
                      if (val) loadDistricts(val)
                    }}
                    disabled={!selectedProvId}
                    className="w-full border rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
                    required
                  >
                    <option value="">{!selectedProvId ? 'Pilih Provinsi dulu' : (loadingKab ? 'Memuat...' : 'Pilih Kabupaten/Kota')}</option>
                    {regencies.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
                {/* Dropdown Kecamatan */}
                <div>
                  <select
                    value={selectedKecId}
                    onChange={(e) => {
                      const val = e.target.value
                      setSelectedKecId(val)
                      const opt = districts.find(k => k.id === val)
                      setAddrForm(prev => ({ ...prev, kecamatan: opt?.name || '' }))
                    }}
                    disabled={!selectedKabId}
                    className="w-full border rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
                    required
                  >
                    <option value="">{!selectedKabId ? 'Pilih Kabupaten dulu' : (loadingKec ? 'Memuat...' : 'Pilih Kecamatan')}</option>
                    {districts.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </div>
                <textarea
                  placeholder="Alamat Lengkap"
                  value={addrForm.alamat_lengkap}
                  onChange={(e) => setAddrForm({ ...addrForm, alamat_lengkap: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-black min-h-[80px]"
                  required
                />
              </form>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditAddressOpen(false)
                    setEditingAddressId(null)
                    setAddrForm(emptyAddr)
                   // reset dropdown saat tutup
                   setSelectedProvId(''); setSelectedKabId(''); setSelectedKecId('')
                   setRegencies([]); setDistricts([])
                  }}
                  className="text-gray-500 hover:text-black"
                  disabled={addrSaving}
                >
                  Batal
                </button>
                <button
                  onClick={(e) => submitAddressForm(e as any)}
                  className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 disabled:opacity-70"
                  disabled={addrSaving}
                >
                  {addrSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
         )}

        {/* Modal Konfirmasi Hapus Alamat */}
        {isDeleteModalOpen && deleteTarget && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-[420px] max-w-[90%] shadow-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash className="text-red-600" size={18} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-black">Hapus Alamat?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Anda yakin ingin menghapus alamat <span className="font-medium text-black">"{deleteTarget.nama_alamat}"</span>?
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                  disabled={addrDeleting}
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeleteAddress}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-70"
                  disabled={addrDeleting}
                >
                  {addrDeleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Review */}
        {reviewModalOpen && selectedReview && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl w-[90%] max-w-md p-5 shadow-xl">
              <h3 className="text-lg font-semibold text-black mb-3">
                {selectedReview?.reviewId ? 'Edit Review' : 'Kasih Review'}
              </h3>
              {reviewLoading && <div className="text-sm text-gray-500 mb-2">Memuat review...</div>}
              <div className="flex items-center gap-2 mb-3">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="text-2xl"
                    aria-label={`Beri ${star} bintang`}
                  >
                    <span className={star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Tulis komentar (opsional)"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full border rounded-md px-3 py-2 min-h-[90px] text-black focus:outline-none focus:ring-2 focus:ring-black"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={closeReviewModal} className="px-4 py-2 border border-gray-700 text-gray-700 rounded-md">Batal</button>
                <button
                  onClick={submitReview}
                  disabled={reviewSaving || reviewRating < 1}
                  className={`px-4 py-2 rounded-md text-white ${reviewSaving || reviewRating < 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-900'}`}
                >
                  {reviewSaving ? 'Menyimpan...' : (selectedReview?.reviewId ? 'Simpan Perubahan' : 'Kirim')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
