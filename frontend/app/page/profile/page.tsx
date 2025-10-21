'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Pencil } from 'lucide-react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'riwayat' | 'alamat'>('riwayat')
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false)
  const [name, setName] = useState('Damore Velnava')
  const [tempName, setTempName] = useState(name)


  const [isHovering, setIsHovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("/profile.jpg");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setIsModalOpen(false);
    }
  };

  const [address, setAddress] = useState({
    street: 'Jl. Mawar No. 123',
    city: 'Bandung',
    province: 'Jawa Barat',
    postalCode: '40123',
  })
  const [tempAddress, setTempAddress] = useState(address)

  const orderHistory = [
    {
      id: 1,
      date: '12 September 2025',
      items: [
        { id: 1, name: 'Buku React Modern', price: 85000, qty: 1, image: '/books/react.jpg' },
        { id: 2, name: 'Buku Tailwind CSS', price: 65000, qty: 2, image: '/books/tailwind.jpg' },
      ],
    },
    {
      id: 2,
      date: '3 Oktober 2025',
      items: [
        { id: 1, name: 'Buku Next.js Lanjutan', price: 95000, qty: 1, image: '/books/nextjs.jpg' },
      ],
    },
    {
      id: 3,
      date: '17 Oktober 2025',
      items: [
        { id: 1, name: 'Buku Next.js Lanjutan', price: 95000, qty: 1, image: '/books/nextjs.jpg' },
      ],
    },
  ]

  return (
    <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4">
            <div className="flex flex-col items-center">
                {/* Foto profil dengan hover effect */}
                <div
                    className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 mb-4 group cursor-pointer"
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

                        <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-600 mb-4 cursor-pointer"
                        />

                        <div className="flex justify-center gap-3">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                        >
                            Simpan
                        </button>
                        </div>
                    </div>
                    </div>
                )}
                </div>

        {/* Email */}
        <p className="text-black text-sm mb-1">damore@example.com</p>

        {/* Nama + Edit */}
        <div className="flex items-center space-x-2 mb-6">
            <h2 className="text-xl text-black font-semibold">{name}</h2>
            <button
            onClick={() => setIsEditNameOpen(true)}
            className="p-1 hover:bg-gray-200 rounded-full transition"
            >
            <Pencil size={18} className="text-gray-700" />
            </button>
        </div>

        {/* Navigasi Tabs */}
        <div className="flex space-x-10 border-b border-gray-300 mb-6">
            <button
            className={`pb-2 font-medium ${
                activeTab === 'riwayat'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
            onClick={() => setActiveTab('riwayat')}
            >
            Riwayat Belanja
            </button>
            <button
            className={`pb-2 font-medium ${
                activeTab === 'alamat'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
            onClick={() => setActiveTab('alamat')}
            >
            Alamat Pengguna
            </button>
        </div>

        {/* Konten Tab */}
        <div className="w-full max-w-2xl">
            {activeTab === 'riwayat' ? (
            <div
                className="space-y-6 max-h-[400px] overflow-y-auto pr-2"
                style={{ scrollbarWidth: 'thin' }}
            >
                {orderHistory.map((order) => (
                <div
                    key={order.id}
                    className="bg-white p-4 rounded-xl shadow-md border"
                >
                    <p className="text-sm text-black mb-3">
                    Tanggal Belanja:{' '}
                    <span className="font-medium text-black">{order.date}</span>
                    </p>
                    <div className="space-y-3">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                            <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-black">{item.name}</p>
                            <p className="text-black text-sm">
                            Rp {item.price.toLocaleString('id-ID')} × {item.qty}
                            </p>
                        </div>
                        <p className="font-semibold text-black">
                            Rp {(item.price * item.qty).toLocaleString('id-ID')}
                        </p>
                        </div>
                    ))}
                    </div>
                </div>
                ))}
            </div>
            ) : (
            <div className="bg-white p-6 rounded-xl shadow-md border relative">
                {/* Header alamat + tombol edit */}
                <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-black">Alamat Pengguna</h3>
                <button
                    onClick={() => {
                    setTempAddress(address)
                    setIsEditAddressOpen(true)
                    }}
                    className="p-2 hover:bg-gray-200 rounded-full transition"
                >
                    <Pencil size={18} className="text-gray-700" />
                </button>
                </div>
                <p className='text-black'>{address.street}</p>
                <p className='text-black'>
                {address.city}, {address.province}
                </p>
                <p className='text-black'>Kode Pos: {address.postalCode}</p>
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
                />
                <div className="flex justify-end space-x-3">
                <button
                    onClick={() => setIsEditNameOpen(false)}
                    className="text-gray-500 hover:text-black"
                >
                    Batal
                </button>
                <button
                    onClick={() => {
                    setName(tempName)
                    setIsEditNameOpen(false)
                    }}
                    className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700"
                >
                    Simpan
                </button>
                </div>
            </div>
            </div>
        )}

        {/* Modal Edit Alamat */}
        {isEditAddressOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
                <h3 className="text-lg font-semibold mb-3 text-black">Ubah Alamat</h3>

                <div className="space-y-3 mb-4">
                <input
                    type="text"
                    placeholder="Jalan"
                    value={tempAddress.street}
                    onChange={(e) => setTempAddress({ ...tempAddress, street: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-black"
                />
                <input
                    type="text"
                    placeholder="Kota"
                    value={tempAddress.city}
                    onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-black"
                />
                <input
                    type="text"
                    placeholder="Provinsi"
                    value={tempAddress.province}
                    onChange={(e) => setTempAddress({ ...tempAddress, province: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-black"
                />
                <input
                    type="text"
                    placeholder="Kode Pos"
                    value={tempAddress.postalCode}
                    onChange={(e) => setTempAddress({ ...tempAddress, postalCode: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-black focus:ring-black"
                />
                </div>

                <div className="flex justify-end space-x-3">
                <button
                    onClick={() => setIsEditAddressOpen(false)}
                    className="text-gray-500 hover:text-black"
                >
                    Batal
                </button>
                <button
                    onClick={() => {
                    setAddress(tempAddress)
                    setIsEditAddressOpen(false)
                    }}
                    className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700"
                >
                    Simpan
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
