'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, BarChart3, Users, TrendingUp, DollarSign, Banknote } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [allow, setAllow] = useState(false)

  // Stats state
  const [statsLoading, setStatsLoading] = useState(false)
  const [stats, setStats] = useState({
    keuntungan: 0,
    omset: 0,
    totalModal: 0,
    produkTerjual: 0,
    pelangganAktif: 0,
  })
  // Grafik: total penjualan per bulan (tahun berjalan)
  const [chartData, setChartData] = useState<{ month: string; total: number }[]>([])

  useEffect(() => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
    if (adminToken) { setAllow(true); setChecked(true); return }
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) { router.replace('/page/login-admin'); return }
    fetch('http://127.0.0.1:8000/api/user', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (u && String(u.role || '') === 'admin') setAllow(true)
        else router.replace('/page/login-admin')
      })
      .catch(() => router.replace('/page/login-admin'))
      .finally(() => setChecked(true))
  }, [router])

  // Helper format Rupiah
  function rp(n: number) {
    return `Rp ${Number(n || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
  }

  // Muat statistik setelah akses admin diizinkan
  useEffect(() => {
    if (!allow) return
    const load = async () => {
      setStatsLoading(true)
      try {
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('authToken') || localStorage.getItem('adminToken'))
          : null
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

        // Ambil semua order (sudah include items.book dari backend)
        const ordersRes = await fetch('http://127.0.0.1:8000/api/orders', { headers })
        const orders: any[] = ordersRes.ok ? await ordersRes.json() : []
        const validStatuses = new Set(['dibayar', 'dikemas', 'diantar', 'selesai'])
        let keuntungan = 0
        let produkTerjual = 0
        // Hitung total per bulan dari orders.total_price (tahun berjalan)
        const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
        const monthlyTotals = Array(12).fill(0)
        const thisYear = new Date().getFullYear()

        for (const o of Array.isArray(orders) ? orders : []) {
          if (!validStatuses.has(String(o.status || '').toLowerCase())) continue
          // akumulasi chart
          if (o.created_at) {
            const dt = new Date(o.created_at)
            if (!isNaN(dt.getTime()) && dt.getFullYear() === thisYear) {
              monthlyTotals[dt.getMonth()] += Number(o.total_price || 0)
            }
          }
          for (const it of Array.isArray(o.items) ? o.items : []) {
            const qty = Number(it.quantity || 0)
            const price = Number(it.price || 0)
            const modal = Number(it.book?.modal_price || 0)
            keuntungan += (price - modal) * qty
            produkTerjual += qty
          }
        }
        setChartData(MONTHS.map((m, i) => ({ month: m, total: monthlyTotals[i] })))

        // 2) Ambil semua buku (untuk Omset & Total Modal)
        const booksRes = await fetch('http://127.0.0.1:8000/api/books', { headers })
        const books: any[] = booksRes.ok ? await booksRes.json() : []
        const omset = (Array.isArray(books) ? books : []).reduce((sum, b) => sum + Number(b?.price || 0), 0)
        const totalModal = (Array.isArray(books) ? books : []).reduce((sum, b) => sum + Number(b?.modal_price || 0), 0)

        // 3) Ambil pengguna (pelanggan aktif)
        const usersRes = await fetch('http://127.0.0.1:8000/api/users', { headers })
        const users: any[] = usersRes.ok ? await usersRes.json() : []
        const pelangganAktif = (Array.isArray(users) ? users : []).filter(u => String(u.role || '') === 'customer').length

        setStats({ keuntungan, omset, totalModal, produkTerjual, pelangganAktif })
      } catch {
        // keep defaults (0)
      } finally {
        setStatsLoading(false)
      }
    }
    load()
  }, [allow])

  if (!checked || !allow) return null

  return (
    <div className='pl-15'>
      <h1 className="text-2xl text-black text-center font-semibold mb-6">
        Selamat Datang di Dashboard Admin
      </h1>

      {/* Cards (5 statistik) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
        <motion.div whileHover={{ scale: 1.03 }} className="bg-white shadow-md rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-2">
            <TrendingUp size={20} />
          </div>
          <div className="text-gray-700 text-sm">Keuntungan</div>
          <div className="text-xl text-black font-bold mt-1">{statsLoading ? '-' : rp(stats.keuntungan)}</div>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className="bg-white shadow-md rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
            <DollarSign size={20} />
          </div>
          <div className="text-gray-700 text-sm">Omset</div>
          <div className="text-xl text-black font-bold mt-1">{statsLoading ? '-' : rp(stats.omset)}</div>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className="bg-white shadow-md rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
            <Banknote size={20} />
          </div>
          <div className="text-gray-700 text-sm">Total Modal</div>
          <div className="text-xl text-black font-bold mt-1">{statsLoading ? '-' : rp(stats.totalModal)}</div>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className="bg-white shadow-md rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center mb-2">
            <Package size={20} />
          </div>
          <div className="text-gray-700 text-sm">Produk Terjual</div>
          <div className="text-xl text-black font-bold mt-1">{statsLoading ? '-' : Number(stats.produkTerjual).toLocaleString('id-ID')}</div>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} className="bg-white shadow-md rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
            <Users size={20} />
          </div>
          <div className="text-gray-700 text-sm">Pelanggan Aktif</div>
          <div className="text-xl text-black font-bold mt-1">{statsLoading ? '-' : Number(stats.pelangganAktif).toLocaleString('id-ID')}</div>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-lg text-black font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" size={20} />
          Grafik Penjualan
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            // beri ruang di kiri agar label YAxis tidak terpotong
            margin={{ left: 24, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            {/* width memperbesar area label, tickMargin beri jarak dari axis */}
            <YAxis
              width={90}
              tickMargin={8}
              tickFormatter={(v) => Number(v).toLocaleString('id-ID')}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = Number(payload[0].value || 0)
                  return (
                    <div className="bg-white/90 border border-gray-200 rounded-md p-2 shadow-sm text-sm">
                      <div className="font-medium">{label}</div>
                      <div className="text-gray-700">Penjualan: {rp(val)}</div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
