'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2 } from 'lucide-react'

type KurirRow = { id: number; nama: string; harga: number }

export default function KurirPage() {
  const router = useRouter()
  // Guard admin
  const [checked, setChecked] = useState(false)
  const [allow, setAllow] = useState(false)
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

  // State data & UI
  const [kurirs, setKurirs] = useState<KurirRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [selectedName, setSelectedName] = useState('')

  const [form, setForm] = useState({ nama: '', harga: '' as string | number })
  const [errors, setErrors] = useState({ nama: '', harga: '' })

  function formatPrice(n: number) {
    return `Rp ${Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
  }

  async function loadKurirs() {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
      const res = await fetch('http://127.0.0.1:8000/api/kurirs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json().catch(() => [])
      setKurirs(Array.isArray(data) ? data : [])
    } catch {
      setKurirs([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (allow) loadKurirs() }, [allow])

  const validate = () => {
    const e = { nama: '', harga: '' }
    if (!form.nama) e.nama = 'Nama kurir wajib diisi'
    if (form.harga === '' || isNaN(Number(form.harga))) e.harga = 'Harga wajib angka'
    setErrors(e)
    return !e.nama && !e.harga
  }

  const openAdd = () => {
    setForm({ nama: '', harga: '' })
    setErrors({ nama: '', harga: '' })
    setEditIndex(null)
    setShowModal(true)
  }

  const openEdit = (index: number) => {
    const k = kurirs[index]
    setEditIndex(index)
    setForm({ nama: k.nama, harga: String(k.harga) })
    setErrors({ nama: '', harga: '' })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
    try {
      if (editIndex === null) {
        const res = await fetch('http://127.0.0.1:8000/api/kurirs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ nama: form.nama, harga: Number(form.harga) }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(j?.message || 'Gagal menambah kurir')
      } else {
        const id = kurirs[editIndex].id
        const res = await fetch(`http://127.0.0.1:8000/api/kurirs/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ nama: form.nama, harga: Number(form.harga) }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(j?.message || 'Gagal memperbarui kurir')
      }
      await loadKurirs()
      setShowModal(false)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menyimpan')
      setTimeout(() => setErrorMsg(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  const openDelete = (index: number) => {
    setEditIndex(index)
    setSelectedName(kurirs[index].nama)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (editIndex === null) { setShowDeleteModal(false); return }
    const id = kurirs[editIndex].id
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/kurirs/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error('Gagal menghapus kurir')
      setKurirs(prev => prev.filter((_, i) => i !== editIndex))
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menghapus')
      setTimeout(() => setErrorMsg(''), 2500)
    } finally {
      setShowDeleteModal(false)
    }
  }

  // Early return setelah semua hooks terdefinisi
  if (!checked || !allow) return null

  return (
    <div className="text-black pl-15">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manajemen Kurir</h1>
          <p className="text-gray-500 text-sm">Kelola kurir pengiriman untuk toko Anda</p>
        </div>
        <button onClick={openAdd} className="mt-4 sm:mt-0 px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
          <Plus className="inline-block mr-2" size={16} /> Tambah Kurir
        </button>
      </div>

      {errorMsg && <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded">{errorMsg}</div>}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
            <tr className="text-xs uppercase tracking-wide text-gray-600">
              <th className="p-3 text-left w-12">No</th>
              <th className="p-3 text-left min-w-[220px]">Kurir</th>
              <th className="p-3 text-left w-40">Harga</th>
              <th className="p-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {kurirs.map((k, i) => (
              <tr key={k.id} className="border-b last:border-none odd:bg-white even:bg-gray-50 hover:bg-gray-100/70 transition-colors">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{k.nama}</td>
                <td className="p-3">{formatPrice(Number(k.harga || 0))}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(i)} className="p-2 rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition" title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => openDelete(i)} className="p-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition" title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && kurirs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-4">Belum ada data kurir</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="p-4 text-sm text-gray-500">Memuat kurir...</div>}
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editIndex !== null ? 'Edit Kurir' : 'Tambah Kurir'}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama Kurir</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm(s => ({ ...s, nama: e.target.value }))}
                  className={`w-full p-2 border rounded-lg ${errors.nama ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nama kurir"
                />
                {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Harga</label>
                <input
                  type="number"
                  value={form.harga}
                  onChange={(e) => setForm(s => ({ ...s, harga: e.target.value }))}
                  className={`w-full p-2 border rounded-lg ${errors.harga ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="0"
                />
                {errors.harga && <p className="text-red-500 text-xs mt-1">{errors.harga}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border">Batal</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-2">Hapus Kurir</h2>
            <p className="text-gray-600 mb-4">
              Yakin ingin menghapus kurir <span className="font-semibold text-red-600">"{selectedName}"</span>?
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg">Tidak</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Iya</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
