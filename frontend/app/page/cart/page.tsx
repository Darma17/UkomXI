'use client'

import React, { useState } from 'react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export default function Cart() {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Nike Air Max 270',
      image:
        'https://static.nike.com/a/images/t_PDP_864_v1/f_auto,q_auto:eco/6f3aabc1-8b4a-4b28-a274-66f4fddcf15a/air-max-270-mens-shoes-KkLcGR.png',
      size: '42',
      quantity: 1,
      price: 2150000,
    },
    {
      id: 2,
      name: 'Nike Dunk Low Retro',
      image:
        'https://static.nike.com/a/images/t_PDP_864_v1/f_auto,q_auto:eco/8d5f1d4a-1c1e-4693-b6b7-932b7ed3e772/dunk-low-retro-mens-shoes-5FQWGR.png',
      size: '43',
      quantity: 1,
      price: 1899000,
    },
  ])

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleRemove = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  const handleQuantityChange = (id: number, qty: number) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
      )
    )
  }

  return (
    <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex justify-center py-20 px-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* === LEFT: CART ITEMS === */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold mb-6">Keranjang Anda</h1>

            {cartItems.length === 0 ? (
                <p className="text-gray-500 text-center py-10">Keranjang masih kosong</p>
            ) : (
                <div className="space-y-6">
                {cartItems.map((item) => (
                    <div
                    key={item.id}
                    className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 pb-6"
                    >
                    <img
                        src={item.image}
                        alt={item.name}
                        className="w-32 h-32 object-contain bg-gray-100 rounded-lg"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                        <div>
                        <h2 className="font-semibold text-lg">{item.name}</h2>
                        <p className="text-gray-500 text-sm mt-1">Ukuran: {item.size}</p>
                        <p className="text-gray-800 font-semibold mt-2">
                            Rp {item.price.toLocaleString('id-ID')}
                        </p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                            <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="px-2 py-1 border rounded-md text-lg hover:bg-gray-100"
                            >
                            -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="px-2 py-1 border rounded-md text-lg hover:bg-gray-100"
                            >
                            +
                            </button>
                        </div>

                        <button
                            onClick={() => handleRemove(item.id)}
                            className="text-red-500 text-sm hover:underline"
                        >
                            Hapus
                        </button>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
            </div>

            {/* === RIGHT: ORDER SUMMARY === */}
            <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Ringkasan Pesanan</h2>

            <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>Ongkir</span>
                <span>Rp 25.000</span>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between font-semibold">
                <span>Total</span>
                <span>Rp {(totalPrice + 25000).toLocaleString('id-ID')}</span>
            </div>

            <button className="w-full mt-6 py-3 bg-black text-white rounded-md font-semibold hover:bg-gray-900 transition">
                Lanjut ke Pembayaran
            </button>
            </div>
        </div>
        </div>
        <Footer />
    </>
  )
}
