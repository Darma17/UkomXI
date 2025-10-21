'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function AdminProduct() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Dummy data
  const [products, setProducts] = useState([
    {
      id: 1,
      title: 'Buku Pemrograman Dasar',
      author: 'Andi Setiawan',
      publisher: 'TechPress',
      year: 2023,
      price: 85000,
      stock: 12,
      description: 'Belajar dasar pemrograman dari nol.',
      highlight: true,
      category: 'Teknologi',
      image: '/book-sample.jpg',
    },
  ])

  const handleImageChange = (e: any) => {
    const file = e.target.files[0]
    if (file) setPreviewImage(URL.createObjectURL(file))
  }

  const openAddModal = () => {
    setSelectedProduct(null)
    setPreviewImage(null)
    setIsModalOpen(true)
  }

  const openEditModal = (product: any) => {
    setSelectedProduct(product)
    setPreviewImage(product.image)
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
          + Tambah Akun
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">Gambar</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Author</th>
              <th className="p-3 text-left">Publisher</th>
              <th className="p-3 text-left">Publish Year</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Highlight</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, index) => (
              <motion.tr
                key={p.id}
                className="border-b relative group last:border-none hover:bg-gray-50 transition"
              >
                <td className="p-3">{index + 1}</td>
                <td className="p-3">
                  <Image src={p.image} alt={p.title} width={50} height={70} className="rounded-md" />
                </td>
                <td className="p-3">{p.title}</td>
                <td className="p-3">{p.author}</td>
                <td className="p-3">{p.publisher}</td>
                <td className="p-3">{p.year}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">{p.description}</td>
                <td className="p-3">{p.highlight ? 'True' : 'False'}</td>
                <td className="p-3">{p.category}</td>
                {/* Action buttons appear on hover */}
                <td className="p-3 text-center">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-md text-blue-500 hover:text-blue-700 cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(p)}
                      className="p-2 rounded-md text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
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
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-xl font-semibold mb-4">
                {selectedProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h2>

              {/* Form */}
              <div className="space-y-3">
                <select className="w-full p-2 border rounded-md">
                  <option value="">Pilih Kategori</option>
                  <option value="Teknologi">Teknologi</option>
                  <option value="Novel">Novel</option>
                </select>
                <input className="w-full p-2 border rounded-md" placeholder="Title" />
                <input className="w-full p-2 border rounded-md" placeholder="Author" />
                <input className="w-full p-2 border rounded-md" placeholder="Publisher" />
                <input className="w-full p-2 border rounded-md" placeholder="Tahun Publish" />
                <textarea className="w-full p-2 border rounded-md" placeholder="Description"></textarea>
                <input className="w-full p-2 border rounded-md" placeholder="Price" />
                <input className="w-full p-2 border rounded-md" placeholder="Stock" />
                <select className="w-full p-2 border rounded-md">
                  <option value="false">Highlight: False</option>
                  <option value="true">Highlight: True</option>
                </select>

                {/* Upload Image */}
                <div className="border-2 border-dashed rounded-md p-4 text-center">
                  {previewImage ? (
                    <div className="flex flex-col items-center">
                      <Image
                        src={previewImage}
                        alt="Preview"
                        width={150}
                        height={200}
                        className="rounded-md mb-3"
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Simpan
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
                  onClick={() => {
                    setProducts(products.filter(p => p.id !== selectedProduct.id))
                    setIsDeleteOpen(false)
                  }}
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
