'use client'

import React from 'react'

export default function Page() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 🔹 Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/images/video1.mp4" // ubah sesuai path video kamu
        autoPlay
        loop
        muted
      ></video>

      {/* 🔹 Overlay hitam transparan */}

      {/* 🔹 Form Verifikasi */}
      <div className="relative z-10 bg-black bg-opacity-40 backdrop-blur-md p-8 rounded-2xl w-96 max-w-full text-center shadow-xl border border-gray-700">
        <h1 className="text-white text-2xl font-semibold mb-2">
          Verifikasi OTP
        </h1>
        <p className="text-gray-300 text-sm mb-6">
          Cek email anda dan masukkan kode OTP
        </p>

        <form>
          <input
            type="text"
            placeholder="Masukkan kode OTP"
            className="w-full px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white mb-4 border border-white"
          />
          <button
            type="submit"
            className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition"
          >
            Verifikasi
          </button>
        </form>
      </div>
    </div>
  )
}
