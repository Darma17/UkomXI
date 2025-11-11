'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReCAPTCHA from 'react-google-recaptcha'

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [captchaValue, setCaptchaValue] = useState<string>('')

  useEffect(() => {
    if (!errorMsg) return
    const id = setTimeout(() => setErrorMsg(''), 2500)
    return () => clearTimeout(id)
  }, [errorMsg])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    if (!captchaValue) {
      setErrorMsg('Silakan verifikasi captcha terlebih dahulu')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken: captchaValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(data.message || 'Gagal masuk admin')
        return
      }
      // Backend hanya mengirim OTP -> arahkan ke verifikasi OTP untuk admin
      router.push(`/page/otp?email=${encodeURIComponent(email)}&purpose=admin`)
    } catch {
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

      {/* Error toast */}
      {errorMsg && (
        <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
          <div className="bg-red-600 text-white px-6 py-2 rounded shadow-md">{errorMsg}</div>
        </div>
      )}

      {/* === FORM CONTAINER === */}
      <div className="relative z-10 backdrop-blur-xl bg-black/40 border border-white/20 text-white rounded-2xl shadow-2xl p-10 w-full max-w-md flex flex-col items-center space-y-6">
        {/* === LOGO === */}
        <img
          src="/images/logoPutih.png"
          alt="Logo"
          className="w-26 h-26 object-contain mb-2"
        />

        {/* === TITLE === */}
        <h2 className="text-4xl font-bold mb-4 tracking-wide">Masuk Admin</h2>

        {/* === FORM === */}
        <form className="w-full flex flex-col space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Masukkan Email Admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Masukkan Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey="6LcdwggsAAAAAIA8kcX7FrkAXRspjzrv94ycga52"
              onChange={(v) => setCaptchaValue(v ?? '')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !captchaValue}
            className="w-full py-2 cursor-pointer bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
