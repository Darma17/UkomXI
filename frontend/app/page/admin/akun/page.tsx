'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

type UserRow = {
  id: number
  name: string
  email: string
  role: 'admin' | 'customer' | 'operator'
  profile_image?: string | null
  tempat_lahir?: string | null
  tanggal_lahir?: string | null
}

export default function Akun() {
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

  // Data & UI state
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '' as '' | 'admin' | 'customer' | 'operator', 
    tempat_lahir: '', tanggal_lahir: '' 
  })
  const [errors, setErrors] = useState({ name: '', email: '', password: '', role: '', 
    tempat_lahir: '', tanggal_lahir: '' 
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const today = new Date()
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
  const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate())
  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  function calcAge(dateStr: string): number | null {
    if (!dateStr) return null
    const dob = new Date(dateStr)
    if (isNaN(dob.getTime())) return null
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age
  }

  // Load users
  async function loadUsers() {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
      const res = await fetch('http://127.0.0.1:8000/api/users', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const data = await res.json().catch(() => [])
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (allow) loadUsers() }, [allow])

  // Early return setelah semua hooks terdefinisi
  if (!checked || !allow) return null

  // Handlers
  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', password: '', role: '', 
     tempat_lahir: '', tanggal_lahir: '' 
    })
    setErrors({ name: '', email: '', password: '', role: '', 
     tempat_lahir: '', tanggal_lahir: '' 
    })
    setEditIndex(null)
    setPreviewImage(null)
    setPendingFile(null)
    setShowModal(true)
  }

  const handleEdit = (index: number) => {
    const u = users[index]
    setEditIndex(index)
    setFormData({ name: u.name, email: u.email, password: '', role: u.role as 'admin'|'customer'|'operator', 
     tempat_lahir: u.tempat_lahir || '', tanggal_lahir: u.tanggal_lahir ? String(u.tanggal_lahir).slice(0,10) : '' 
    })
    setErrors({ name: '', email: '', password: '', role: '', 
     tempat_lahir: '', tanggal_lahir: '' 
    })
    setPreviewImage(u.profile_image ? `http://localhost:8000/storage/${u.profile_image}` : null)
    setPendingFile(null)
    setShowModal(true)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPendingFile(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const validate = () => {
    const err = { name: '', email: '', password: '', role: '', 
     tempat_lahir: '', tanggal_lahir: '' 
    }
    if (!formData.name) err.name = 'Nama wajib diisi'
    if (!formData.email) err.email = 'Email wajib diisi'
    if (editIndex === null && !formData.password) err.password = 'Password wajib diisi' // password hanya wajib saat tambah
    if (!formData.role) err.role = 'Role wajib dipilih'
    if (formData.tanggal_lahir) {
      const age = calcAge(formData.tanggal_lahir)
      if (age === null || age < 15 || age > 100) err.tanggal_lahir = 'Umur harus 15–100 tahun'
    }
    // tempat_lahir optional: isi boleh kosong
    setErrors(err)
    return !err.name && !err.email && !err.password && !err.role && 
     !err.tanggal_lahir
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
    try {
      if (editIndex === null) {
        // Create user
        const res = await fetch('http://127.0.0.1:8000/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ 
            name: formData.name, email: formData.email, password: formData.password, role: formData.role,
           tempat_lahir: formData.tempat_lahir || null,
           tanggal_lahir: formData.tanggal_lahir || null
          }),
        })
        const created = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(created?.message || 'Gagal menambah akun')
        // Upload image jika ada
        if (pendingFile && created?.id) {
          const fd = new FormData()
          fd.append('_method', 'PUT')
          fd.append('profile_image', pendingFile)
          await fetch(`http://127.0.0.1:8000/api/users/${created.id}`, {
            method: 'POST',
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: fd,
          })
        }
      } else {
        // Update user (tanpa ubah password via endpoint ini)
        const id = users[editIndex].id
        const fd = new FormData()
        fd.append('_method', 'PUT')
        fd.append('name', formData.name)
        fd.append('email', formData.email)
        fd.append('role', formData.role)
        fd.append('tempat_lahir', formData.tempat_lahir || '')
        fd.append('tanggal_lahir', formData.tanggal_lahir || '')
        if (pendingFile) fd.append('profile_image', pendingFile)
        const res = await fetch(`http://127.0.0.1:8000/api/users/${id}`, {
          method: 'POST',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: fd,
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.message || 'Gagal memperbarui akun')
        }
      }
      await loadUsers()
      setShowModal(false)
      setPendingFile(null)
      setPreviewImage(null)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menyimpan akun')
      setTimeout(() => setErrorMsg(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (name: string, index: number) => {
    setSelectedName(name)
    setEditIndex(index)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      if (editIndex === null) { setShowDeleteModal(false); return }
      const id = users[editIndex].id
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
      const res = await fetch(`http://127.0.0.1:8000/api/users/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Gagal menghapus akun')
      setUsers(prev => prev.filter((_, i) => i !== editIndex))
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menghapus akun')
      setTimeout(() => setErrorMsg(''), 2500)
    } finally {
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="text-black min-h-screen pl-15">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Manajemen Akun</h1>
          <p className="text-gray-500 text-sm">Kelola semua akun di toko Anda</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="mt-4 sm:mt-0 px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          + Tambah Akun
        </button>
      </div>

      {errorMsg && <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded">{errorMsg}</div>}

      {/* Tabel (clean-modern) */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
            <tr className="text-xs uppercase tracking-wide text-gray-600">
              <th className="p-3 text-left w-12">No</th>
              <th className="p-3 text-left w-16">Foto</th>
              <th className="p-3 text-left min-w-[160px]">Nama</th>
              <th className="p-3 text-left min-w-[180px]">Email</th>
              <th className="p-3 text-left min-w-[140px]">Tempat Lahir</th>
              <th className="p-3 text-left min-w-[150px]">Tanggal Lahir</th>
              <th className="p-3 text-left w-32">Role</th>
              <th className="p-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className="border-b last:border-none odd:bg-white even:bg-gray-50 hover:bg-gray-100/70 transition-colors">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={u.profile_image ? `http://localhost:8000/storage/${u.profile_image}` : '/images/profile.png'}
                      alt={u.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </td>
                <td className="p-3">{u.name}</td>
                <td className="p-3 break-all">{u.email}</td>
                <td className="p-3">{u.tempat_lahir || '-'}</td>
                <td className="p-3">
                  {u.tanggal_lahir
                    ? (() => {
                        const d = new Date(u.tanggal_lahir)
                        if (isNaN(d.getTime())) return '-'
                        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                      })()
                    : '-'}
                </td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(i)} className="p-2 rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition" title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(u.name, i)} className="p-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition" title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-4">Belum ada data akun</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="p-4 text-sm text-gray-500">Memuat akun...</div>}
      </div>

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-6 rounded-xl w-full max-w-2xl shadow-lg overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{editIndex !== null ? 'Edit Akun' : 'Tambah Akun'}</h2>
                <button onClick={() => setShowModal(false)}><X /></button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <input
                    type="text"
                    placeholder="Nama"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`border p-2 rounded-md w-full ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`border p-2 rounded-md w-full ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password (only required on add) */}
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`border p-2 rounded-md w-full ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Role */}
                <div>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'customer' | 'operator' })}
                    className={`border p-2 rounded-md w-full ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Pilih Role</option>
                    <option value="admin">Admin</option>
                    <option value="customer">Customer</option>
                    <option value="operator">Operator</option>
                  </select>
                  {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                </div>

                {/* Tempat Lahir */}
                <div>
                  <input
                    type="text"
                    placeholder="Tempat Lahir (opsional)"
                    value={formData.tempat_lahir}
                    onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                    className="border p-2 rounded-md w-full"
                  />
                  {errors.tempat_lahir && <p className="text-red-500 text-xs mt-1">{errors.tempat_lahir}</p>}
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <input
                    type="date"
                    value={formData.tanggal_lahir}
                    min={fmtDate(minDate)}
                    max={fmtDate(maxDate)}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    className={`border p-2 rounded-md w-full ${errors.tanggal_lahir ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.tanggal_lahir && <p className="text-red-500 text-xs mt-1">{errors.tanggal_lahir}</p>}
                </div>

                {/* Upload Image dashed box (seperti product) */}
                <div className="border-2 border-dashed rounded-md p-4 text-center">
                  {previewImage ? (
                    <div className="flex flex-col items-center">
                      <img src={previewImage} alt="Preview" className="rounded-md mb-3 w-40 h-40 object-cover" />
                      <label className="text-blue-600 underline cursor-pointer">
                        Ganti Gambar
                        <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-blue-600">
                      Klik untuk Upload Gambar
                      <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Batal</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-60">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Hapus */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="bg-white p-6 rounded-xl w-[90%] max-w-sm text-center">
              <h2 className="text-lg font-semibold mb-3">Hapus</h2>
              <p className="text-gray-600 mb-5">Yakin ingin menghapus akun <span className="font-semibold">{selectedName}</span>?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Tidak</button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Iya</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
