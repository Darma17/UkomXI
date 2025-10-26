'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export default function CheckoutSuccessPage() {
  return (
    <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
            <p className="text-gray-600 mb-6">
            Terima kasih telah melakukan pembayaran. Pesanan kamu sedang diproses.
            </p>

            <p className="text-sm text-gray-400 mb-6">Status pesanan berhasil diperbarui.</p>

            <div className="flex justify-center gap-3">
            <Link href="/" className="inline-block">
                <button className="px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition">
                Kembali ke Beranda
                </button>
            </Link>

            {/* <Link href="/page/orders" className="inline-block">
                <button className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition">
                Lihat Pesanan
                </button>
            </Link> */}
            </div>
        </div>
        </div>
        <Footer />
    </>
  )
}
