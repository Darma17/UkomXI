"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { Pencil, Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'


interface CategoryData {
  name: string;
  description: string;
}

interface FormError {
  name?: string;
  description?: string;
}

type CategoryRow = { id: number; name: string; description: string }

export default function Category() {
  const router = useRouter()
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

  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<CategoryData>({
    name: "",
    description: "",
  });
  const [formError, setFormError] = useState<FormError>({});
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  async function loadCategories() {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
      const res = await fetch('http://127.0.0.1:8000/api/categories', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json().catch(() => [])
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (allow) loadCategories() }, [allow])

  // ✅ Buka modal tambah/edit
  const handleOpenModal = (item?: CategoryData, index?: number) => {
    if (item && index !== undefined) {
      setFormData(item);
      setEditIndex(index);
    } else {
      setFormData({ name: "", description: "" });
      setEditIndex(null);
    }
    setFormError({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError({});
  };

  // ✅ Input handler
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Simpan (POST/PUT ke backend)
  const handleSave = async () => {
    const errors: FormError = {};
    if (!formData.name) errors.name = "Nama kategori wajib diisi";
    if (!formData.description) errors.description = "Deskripsi wajib diisi";
    setFormError(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true)
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
      if (editIndex !== null) {
        const id = categories[editIndex]?.id
        const res = await fetch(`http://127.0.0.1:8000/api/categories/${id}`, {
          method: 'PUT', headers, body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Gagal memperbarui kategori')
      } else {
        const res = await fetch('http://127.0.0.1:8000/api/categories', {
          method: 'POST', headers, body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Gagal menambah kategori')
      }
      await loadCategories()
      setShowModal(false)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menyimpan kategori')
      setTimeout(() => setErrorMsg(''), 2500)
    } finally {
      setSaving(false)
    }
  };

  // ✅ Hapus data
  const handleDelete = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) { setShowDeleteModal(false); return }
    try {
      const id = categories[deleteIndex]?.id
      const token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || ''
      const res = await fetch(`http://127.0.0.1:8000/api/categories/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) throw new Error('Gagal menghapus kategori')
      setCategories(prev => prev.filter((_, i) => i !== deleteIndex))
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal menghapus kategori')
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Category</h1>
          <p className="text-gray-500 text-sm">
            Kelola semua kategori di toko anda
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-black hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus /> Tambah Category
        </button>
      </div>

      {errorMsg && <div className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded">{errorMsg}</div>}

      {/* Tabel (desain mengikuti halaman Product) */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm mt-10">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
            <tr className="text-xs uppercase tracking-wide text-gray-600">
              <th className="p-3 text-left w-12">No</th>
              <th className="p-3 text-left min-w-[220px]">Nama</th>
              <th className="p-3 text-left">Deskripsi</th>
              <th className="p-3 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, index) => (
              <tr key={cat.id} className="border-b last:border-none odd:bg-white even:bg-gray-50 hover:bg-gray-100/70 transition-colors">
                <td className="p-3 align-middle text-gray-700">{index + 1}</td>
                <td className="p-3 align-middle text-gray-900 font-medium">{cat.name}</td>
                <td className="p-3 align-middle text-gray-700">{cat.description}</td>
                <td className="p-3 align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenModal({ name: cat.name, description: cat.description }, index)}
                      className="p-2 rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-4">Belum ada data kategori</td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="p-4 text-sm text-gray-500">Memuat kategori...</div>}
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editIndex !== null ? "Edit Category" : "Tambah Category"}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama Category
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg ${formError.name ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Nama"
                />
                {formError.name && (
                  <p className="text-red-500 text-xs mt-1">{formError.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-lg ${formError.description ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Deskripsi singkat"
                />
                {formError.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {formError.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg border"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Hapus Category</h2>
            <p className="text-gray-600 mb-4">
              Yakin ingin menghapus{" "}
              <span className="font-semibold text-red-600">
                {deleteIndex !== null ? categories[deleteIndex]?.name : ""}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Tidak
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Iya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
