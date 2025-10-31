"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";
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
  if (!checked || !allow) return null

  const [categories, setCategories] = useState<CategoryData[]>(
    [
      { name: "Elektronik", description: "Produk gadget dan alat elektronik" },
      { name: "Fashion", description: "Pakaian dan aksesoris terkini" },
      { name: "Makanan", description: "Makanan ringan dan berat" },
    ]
  );

  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<CategoryData>({
    name: "",
    description: "",
  });
  const [formError, setFormError] = useState<FormError>({});
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

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

  // ✅ Simpan data baru / edit
  const handleSave = () => {
    const errors: FormError = {};
    if (!formData.name) errors.name = "Nama kategori wajib diisi";
    if (!formData.description) errors.description = "Deskripsi wajib diisi";
    setFormError(errors);

    if (Object.keys(errors).length > 0) return;

    if (editIndex !== null) {
      const updated = [...categories];
      updated[editIndex] = formData;
      setCategories(updated);
    } else {
      setCategories([...categories, formData]);
    }

    setShowModal(false);
  };

  // ✅ Hapus data
  const handleDelete = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      setCategories(categories.filter((_, i) => i !== deleteIndex));
    }
    setShowDeleteModal(false);
  };

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

      {/* Tabel */}
      <div className="overflow-x-auto pt-10">
        <table className="min-w-full border border-gray-100 rounded-lg overflow-hidden">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="p-3 border-b">No</th>
              <th className="p-3 border-b">Nama</th>
              <th className="p-3 border-b">Deskripsi</th>
              <th className="p-3 border-b text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, index) => (
              <tr key={index} className="border-b last:border-none bg-gray-50 hover:bg-gray-100 transition-colors">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{cat.name}</td>
                <td className="p-3">{cat.description}</td>
                <td className="p-3 text-center space-x-3">
                  <button
                    onClick={() => handleOpenModal(cat, index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-500 py-4">
                  Belum ada data kategori
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
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
                  className={`w-full p-2 border rounded-lg ${
                    formError.name ? "border-red-500" : "border-gray-300"
                  }`}
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
                  className={`w-full p-2 border rounded-lg ${
                    formError.description
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
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
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-2">Hapus Category</h2>
            <p className="text-gray-600 mb-4">
              Yakin ingin menghapus{" "}
              <span className="font-semibold text-red-600">
                {deleteIndex !== null ? categories[deleteIndex].name : ""}
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
