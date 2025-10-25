'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateAccount() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!errorMsg) return
    const id = setTimeout(() => setErrorMsg(''), 3500)
    return () => clearTimeout(id)
  }, [errorMsg])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    if (password !== passwordConfirm) {
      setErrorMsg('Password dan konfirmasi tidak cocok')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/register/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, password_confirmation: passwordConfirm }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErrorMsg(data.message || 'Gagal mendaftar')
        setLoading(false)
        return
      }

      // success: go to OTP page for registration confirmation
      router.push(`/page/otp?email=${encodeURIComponent(email)}&purpose=register`)
    } catch (err) {
      setErrorMsg('Network error, coba lagi')
    } finally {
      setLoading(false)
    }
  }

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

      {errorMsg && (
        <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
          <div className="bg-red-600 text-white px-6 py-2 rounded shadow-md animate-slideDown">{errorMsg}</div>
        </div>
      )}

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
        <form className="w-full flex flex-col space-y-4" onSubmit={handleRegister}>
          <div>
            <label className="block text-sm font-medium mb-1">Nama</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              placeholder="Masukkan Nama Anda"
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="Masukkan Email Anda"
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              placeholder="Masukkan Password Anda"
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Konfirmasi Password</label>
            <input
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              type="password"
              required
              placeholder="Konfirmasi Password Anda"
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          {/* === BUTTON === */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Buat Akun'}
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
