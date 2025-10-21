'use client'

import React from 'react'
import Link from 'next/link'

export default function SignIn() {
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

      {/* === FORM CONTAINER === */}
      <div className="relative z-10 backdrop-blur-xl bg-black/40 border border-white/20 text-white rounded-2xl shadow-2xl p-10 w-full max-w-md flex flex-col items-center space-y-6">
        {/* === LOGO === */}
        <img
          src="/images/logoPutih.png"
          alt="Logo"
          className="w-26 h-26 object-contain mb-2"
        />

        {/* === TITLE === */}
        <h2 className="text-4xl font-bold mb-4 tracking-wide">Masuk</h2>

        {/* === FORM === */}
        <form className="w-full flex flex-col space-y-4">
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

          {/* === LUPA PASSWORD === */}
          <div className="flex justify-start">
            <a href="#" className="text-blue-400 text-sm hover:underline">
              Lupa Password?
            </a>
          </div>

          {/* === BUTTON MASUK === */}
          <Link href={"/page/admin/dashboard"}>
            <button
                type="submit"
                className="w-full py-2 cursor-pointer bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition"
            >
                Masuk
            </button>
          </Link>

          <div className="my-4 text-center text-sm text-gray-500">OR</div>

          {/* === TOMBOL GOOGLE === */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-white/40 py-2 rounded-md font-medium hover:bg-white/10 transition"
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google Icon"
              className="w-5 h-5"
            />
            Masuk dengan Google
          </button>
        </form>

        {/* === CREATE ACCOUNT LINK === */}
        <p className="text-sm text-gray-300 mt-2">
          Belum Punya Akun?{' '}
          <a
            href="/page/create-account"
            className="text-white font-medium hover:underline"
          >
            Buat Akun
          </a>
        </p>
      </div>
    </div>
  )
}
