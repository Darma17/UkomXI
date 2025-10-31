'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Home, Package, Users, BarChart3, User, ChartColumnStacked, ClipboardList, LogOut } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

export default function Sidebar() {
  const [hovered, setHovered] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { icon: <Home size={22} />, label: 'Dashboard', path: '/page/admin/dashboard' },
    { icon: <ChartColumnStacked size={22} />, label: 'Category', path: '/page/admin/category' },
    { icon: <Package size={22} />, label: 'Product', path: '/page/admin/product' },
    { icon: <User size={22} />, label: 'Akun', path: '/page/admin/akun' },
    { icon: <Users size={22} />, label: 'Detail Akun', path: '/page/admin/detail-akun' },
    { icon: <ClipboardList size={22} />, label: 'Orders', path: '/page/admin/order' },
  ]

  // Fungsi navigasi
  const handleNavigation = (path: string) => {
    router.push(path)
  }

  // Logout admin: revoke token (jika ada) lalu hapus adminToken dan arahkan ke login-admin
  const handleAdminLogout = async () => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
      if (adminToken) {
        try {
          await fetch('http://127.0.0.1:8000/api/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
          })
        } catch {
          // ignore network/logout errors
        }
        localStorage.removeItem('adminToken')
      }
    } finally {
      router.replace('/page/login-admin')
    }
  }

  return (
    <motion.div
      initial={{ width: 64 }}
      animate={{ width: hovered ? 190 : 64 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed top-0 left-0 h-screen flex flex-col items-center bg-black text-white py-4 z-50"
    > 
      {/* Logo */}
      <div className="flex items-center justify-center mb-10">
        <div className="text-xl font-bold">⚙️</div>
        {hovered && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-2 font-semibold">
            Admin
          </motion.span>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-6 w-full">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path) // 🔹 Deteksi aktif otomatis

          return (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleNavigation(item.path)}
              className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-all ${
                isActive ? 'bg-white text-black' : 'hover:bg-white/10 text-white'
              }`}
            >
              <div>{item.icon}</div>
              {hovered && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium">
                  {item.label}
                </motion.span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Logout button at bottom */}
      <div className="mt-auto w-full px-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          onClick={handleAdminLogout}
          className="flex items-center gap-3 mx-2 mb-4 px-4 py-2 cursor-pointer transition-all hover:bg-white/10 text-white"
        >
          <LogOut size={22} />
          {hovered && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium">
              Logout
            </motion.span>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
