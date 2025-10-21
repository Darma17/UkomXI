'use client'

import React, { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'

interface DetailAkunType {
  id: number
  email: string
  phone: string
  address: string
  city: string
  province: string
  postalCode: string
  image?: string
}

export default function DetailAkun() {
  const [details, setDetails] = useState<DetailAkunType[]>([
    {
      id: 1,
      email: 'budi@mail.com',
      phone: '08123456789',
      address: 'Jl. Merdeka No.1',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40111',
      image: '',
    },
  ])

  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const [formData, setFormData] = useState<Omit<DetailAkunType, 'id'>>({
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    image: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setErrorMessage('')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setFormData({ ...formData, image: imageUrl })
    }
  }

  const handleSave = () => {
    // validasi
    if (
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.province ||
      !formData.postalCode
    ) {
      setErrorMessage('Semua field wajib diisi!')
      return
    }

    if (editIndex !== null) {
      const updated = [...details]
      updated[editIndex] = { id: updated[editIndex].id, ...formData }
      setDetails(updated)
    } else {
      const newDetail = { id: details.length + 1, ...formData }
      setDetails([...details, newDetail])
    }

    setShowModal(false)
    setEditIndex(null)
    setFormData({
      email: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      image: '',
    })
  }

  const handleEdit = (index: number) => {
    const selected = details[index]
    setFormData({
      email: selected.email,
      phone: selected.phone,
      address: selected.address,
      city: selected.city,
      province: selected.province,
      postalCode: selected.postalCode,
      image: selected.image,
    })
    setEditIndex(index)
    setShowModal(true)
  }

  const handleDelete = () => {
    if (deleteIndex !== null) {
      const updated = details.filter((_, i) => i !== deleteIndex)
      setDetails(updated)
    }
    setShowDeleteModal(false)
  }

  return (
    <div className="text-black pl-15">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Detail Akun</h1>
          <p className="text-gray-500">Kelola semua detail akun di toko anda</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true)
            setEditIndex(null)
            setFormData({
              email: '',
              phone: '',
              address: '',
              city: '',
              province: '',
              postalCode: '',
              image: '',
            })
            setErrorMessage('')
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          <Plus size={18} /> Tambah Detail Akun
        </button>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 pt-10">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3">No</th>
              <th className="p-3">Foto</th>
              <th className="p-3">Email</th>
              <th className="p-3">Nomor Telepon</th>
              <th className="p-3">Alamat Rumah</th>
              <th className="p-3">Kota</th>
              <th className="p-3">Provinsi</th>
              <th className="p-3">Kode Pos</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className='bg-white'>
            {details.map((item, index) => (
              <tr key={item.id} className="border-b relative group last:border-none hover:bg-gray-50 transition">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                      ?
                    </div>
                  )}
                </td>
                <td className="p-3">{item.email}</td>
                <td className="p-3">{item.phone}</td>
                <td className="p-3">{item.address}</td>
                <td className="p-3">{item.city}</td>
                <td className="p-3">{item.province}</td>
                <td className="p-3">{item.postalCode}</td>
                <td className="p-3 flex gap-3">
                  <button onClick={() => handleEdit(index)} className="p-2 text-blue-600 hover:text-blue-800">
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteIndex(index)
                      setShowDeleteModal(true)
                    }}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editIndex !== null ? 'Edit Detail Akun' : 'Tambah Detail Akun'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block font-medium">Email Akun</label>
                <select
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">-- Pilih Email --</option>
                  <option value="budi@mail.com">budi@mail.com</option>
                  <option value="ani@mail.com">ani@mail.com</option>
                </select>
              </div>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nomor Telepon"
                className="w-full border rounded-md p-2"
              />
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Alamat Rumah"
                className="w-full border rounded-md p-2"
              />
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Kota"
                className="w-full border rounded-md p-2"
              />
              <input
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="Provinsi"
                className="w-full border rounded-md p-2"
              />
              <input
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="Kode Pos"
                className="w-full border rounded-md p-2"
              />
              <div>
                <label className="block font-medium mb-2">Foto Profile</label>
                <div 
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="border-2 border-dashed border-blue-500 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  {formData.image ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={formData.image} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                      <p className="text-sm text-gray-600">Klik untuk mengganti gambar</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-blue-500 font-medium">Klik untuk Upload Gambar</p>
                    </div>
                  )}
                </div>
                <input 
                  id="file-input"
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {errorMessage && (
                <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded-md">
                Batal
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {showDeleteModal && deleteIndex !== null && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-lg text-center">
            <h3 className="text-xl font-semibold text-red-600">Hapus</h3>
            <p className="text-gray-600 mt-2">Yakin ingin menghapus?</p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >
                Tidak
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md">
                Iya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
