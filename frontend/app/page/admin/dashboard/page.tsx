'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Package, BarChart3, Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const salesData = [
    { month: 'Jan', sales: 400 },
    { month: 'Feb', sales: 600 },
    { month: 'Mar', sales: 800 },
    { month: 'Apr', sales: 700 },
    { month: 'May', sales: 900 },
    { month: 'Jun', sales: 1000 },
  ]

  return (
    <div className='pl-15'>
      <h1 className="text-2xl text-black text-center font-semibold mb-6">
        Selamat Datang di Dashboard Admin
      </h1>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <motion.div whileHover={{ scale: 1.05 }} className="bg-white shadow-md rounded-xl flex flex-col items-center justify-center py-6">
          <div className="text-blue-600 mb-2"><Package size={28} /></div>
          <p className="text-gray-500 text-sm">Total Produk</p>
          <h3 className="text-xl text-black font-bold">120</h3>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} className="bg-white shadow-md rounded-xl flex flex-col items-center justify-center py-6">
          <div className="text-green-600 mb-2"><BarChart3 size={28} /></div>
          <p className="text-gray-500 text-sm">Total Penjualan</p>
          <h3 className="text-xl text-black font-bold">350</h3>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} className="bg-white shadow-md rounded-xl flex flex-col items-center justify-center py-6">
          <div className="text-yellow-500 mb-2"><Users size={28} /></div>
          <p className="text-gray-500 text-sm">Pelanggan Aktif</p>
          <h3 className="text-xl text-black font-bold">75</h3>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-lg text-black font-semibold mb-4">Grafik Penjualan</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
