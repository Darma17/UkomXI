'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { motion } from 'framer-motion'

export default function CheckoutSuccessPage() {
  const [confetti, setConfetti] = useState<Array<{ left: number; delay: number; duration: number; size: number; color: string; rotate: number }>>([])
  useEffect(() => {
    const colors = ['#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#6366f1', '#eab308']
    const arr = Array.from({ length: 36 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 4 + Math.random() * 3,
      size: 6 + Math.random() * 10,
      color: colors[i % colors.length],
      rotate: Math.random() * 360
    }))
    setConfetti(arr)
  }, [])

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-gray-50 flex items-center justify-center px-4 overflow-hidden">
        {/* Animated gradient background */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-green-200 via-teal-200 to-indigo-200 blur-3xl opacity-50 animate-floatSlow" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-indigo-200 via-fuchsia-200 to-rose-200 blur-3xl opacity-50 animate-floatSlowRev" />

        {/* Confetti */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((c, idx) => (
            <span
              key={idx}
              className="absolute block rounded-sm animate-confetti"
              style={{
                left: `${c.left}%`,
                width: c.size,
                height: c.size * 0.4,
                background: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                transform: `rotate(${c.rotate}deg)`
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative max-w-lg w-full"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.05 }}
            className="relative w-full bg-white rounded-2xl shadow-xl p-10 text-center ring-1 ring-black/5"
          >
            {/* Glow pulse behind icon */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2"
            >
              <div className="w-28 h-28 rounded-full bg-green-200/40 blur-2xl" />
            </motion.div>

            {/* Icon pop */}
            <motion.div
              initial={{ scale: 0.6, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6 shadow-inner"
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>

            {/* Texts */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2"
            >
              Pembayaran Berhasil!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="text-gray-600 mb-6"
            >
              Terima kasih telah melakukan pembayaran. Pesanan kamu sedang diproses.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="flex justify-center gap-3"
            >
              <Link href="/" className="inline-block">
                <button className="px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition shadow-md hover:shadow-lg">
                  Kembali ke Beranda
                </button>
              </Link>
              <Link href="/page/profile" className="inline-block">
                <button className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition">
                Lihat Pesanan
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
        }
        .animate-confetti {
          animation-name: confetti;
          animation-timing-function: linear;
          animation-iteration-count: 1;
        }
        @keyframes floatSlow {
          0% { transform: translateY(0px) translateX(0px) }
          50% { transform: translateY(20px) translateX(10px) }
          100% { transform: translateY(0px) translateX(0px) }
        }
        .animate-floatSlow { animation: floatSlow 12s ease-in-out infinite; }
        .animate-floatSlowRev { animation: floatSlow 14s ease-in-out infinite reverse; }
      `}</style>
    </>
  )
}
