'use client'

import React from 'react'

export default function CreateAccount() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* === BACKGROUND VIDEO === */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/images/video1.mp4" // ubah sesuai path video kamu
        autoPlay
        loop
        muted
      ></video>

      {/* === OVERLAY GELAP === */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* === FORM CONTAINER (Glass Effect) === */}
      <div className="relative z-10 backdrop-blur-xl bg-black/40 border border-white/20 text-white rounded-2xl shadow-2xl p-10 w-full max-w-md flex flex-col items-center space-y-6">
        {/* === LOGO === */}
        <img
          src="/images/logoPutih.png"
          alt="Logo"
          className="w-26 h-26 object-contain mb-2"
        />

        {/* === TITLE === */}
        <h2 className="text-4xl font-bold mb-4 tracking-wide">Buat Akun</h2>

        {/* === FORM === */}
        <form className="w-full flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama</label>
            <input
              type="text"
              placeholder="Masukkan Nama Anda"
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Masukkan Email Anda"
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Masukkan Password Anda"
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Konfirmasi Password</label>
            <input
              type="password"
              placeholder="Konfirmasi Password Anda"
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          {/* === BUTTON === */}
          <button
            type="submit"
            className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition"
          >
            Buat Akun
          </button>
        </form>

        {/* === SIGN IN LINK === */}
        <p className="text-sm text-gray-300">
          Sudah Punya Akun?{' '}
          <a href="/page/sigin" className="text-white font-medium hover:underline">
            Masuk
          </a>
        </p>
      </div>
    </div>
  )
}
