'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, X } from 'lucide-react'

export default function Akun() {
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: '' })
  const [errors, setErrors] = useState({ name: '', email: '', password: '', role: '' }) // ⬅️ tambahan
  const [accounts, setAccounts] = useState([
    { name: 'Admin Utama', email: 'admin@example.com', password: '123456', role: 'admin' },
    { name: 'Budi', email: 'budi@example.com', password: 'abcdef', role: 'customer' },
  ])

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', password: '', role: '' })
    setErrors({ name: '', email: '', password: '', role: '' })
    setEditIndex(null)
    setShowModal(true)
  }

  const handleSave = () => {
    const newErrors = { name: '', email: '', password: '', role: '' }
    let hasError = false

    if (!formData.name) {
      newErrors.name = 'Nama wajib diisi'
      hasError = true
    }
    if (!formData.email) {
      newErrors.email = 'Email wajib diisi'
      hasError = true
    }
    if (!formData.password) {
      newErrors.password = 'Password wajib diisi'
      hasError = true
    }
    if (!formData.role) {
      newErrors.role = 'Role wajib dipilih'
      hasError = true
    }

    setErrors(newErrors)
    if (hasError) return

    if (editIndex !== null) {
      const updated = [...accounts]
      updated[editIndex] = formData
      setAccounts(updated)
    } else {
      setAccounts([...accounts, formData])
    }
    setShowModal(false)
  }

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setFormData(accounts[index])
    setErrors({ name: '', email: '', password: '', role: '' })
    setShowModal(true)
  }

  const handleDelete = (name: string, index: number) => {
    setSelectedName(name)
    setEditIndex(index)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    setAccounts(accounts.filter((_, i) => i !== editIndex))
    setShowDeleteModal(false)
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

      {/* Table */}
      <table className="w-full border-collapse bg-white shadow-md rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">No</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Nama</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Password</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
            <th className="px-4 py-3 text-center text-sm font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc, i) => (
            <tr key={i} className="border-b last:border-none hover:bg-gray-50 transition">
              <td className="px-4 py-3 text-sm">{i + 1}</td>
              <td className="px-4 py-3 text-sm">{acc.name}</td>
              <td className="px-4 py-3 text-sm">{acc.email}</td>
              <td className="px-4 py-3 text-sm">{acc.password}</td>
              <td className="px-4 py-3 text-sm capitalize">{acc.role}</td>
              <td className="px-4 py-3 text-center flex justify-center gap-2">
                <button onClick={() => handleEdit(i)} className="text-blue-600 hover:text-blue-700">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(acc.name, i)} className="text-red-600 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white p-6 rounded-xl w-[90%] max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {editIndex !== null ? 'Edit Akun' : 'Tambah Akun'}
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <X />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Nama"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border p-2 rounded-md w-full"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border p-2 rounded-md w-full"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="border p-2 rounded-md w-full"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="border p-2 rounded-md w-full"
                  >
                    <option value="">Pilih Role</option>
                    <option value="admin">Admin</option>
                    <option value="customer">Customer</option>
                  </select>
                  {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Hapus (tidak diubah) */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white p-6 rounded-xl w-[90%] max-w-sm text-center"
            >
              <h2 className="text-lg font-semibold mb-3">Hapus</h2>
              <p className="text-gray-600 mb-5">
                Yakin ingin menghapus akun <span className="font-semibold">{selectedName}</span>?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Tidak
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
