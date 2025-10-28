'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react' // 👁️ ikon untuk show/hide password
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

export default function CreateAccount() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!errorMsg) return
    const id = setTimeout(() => setErrorMsg(''), 3500)
    return () => clearTimeout(id)
  }, [errorMsg])

  // Helper: decode JWT id_token payload (browser only)
  function decodeJwtPayload(token: string | undefined | null) {
    if (!token) return null
    try {
      const parts = token.split('.')
      if (parts.length < 2) return null
      const payload = parts[1]
      // atob for browser base64 decode (replace URL-safe chars)
      const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const json = decodeURIComponent(
        Array.prototype
          .map.call(atob(b64), function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          })
          .join('')
      )
      return JSON.parse(json)
    } catch {
      return null
    }
  }

  // Google Sign-In handler: request backend to send register OTP
  async function handleGoogleSuccess(credentialResponse: any) {
    setErrorMsg('')
    setLoading(true)
    try {
      const idToken = credentialResponse?.credential
      const payload = decodeJwtPayload(idToken)
      const gname = payload?.name || ''
      const gemail = payload?.email || ''
      const gpic = payload?.picture || null

      if (!gemail) {
        setErrorMsg('Gagal mengambil email dari Google')
        setLoading(false)
        return
      }

      // create random password (will be hashed server-side and not exposed)
      const randomPass =
        Math.random().toString(36).slice(2, 12) +
        Math.random().toString(36).slice(2, 6)

      const res = await fetch('http://127.0.0.1:8000/api/register/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gname || gemail.split('@')[0],
          email: gemail,
          password: randomPass,
          password_confirmation: randomPass,
          profile_image: gpic,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(data.message || 'Gagal memulai pendaftaran dengan Google')
        setLoading(false)
        return
      }

      // success -> go to OTP page for register
      router.push(`/page/otp?email=${encodeURIComponent(gemail)}&purpose=register`)
    } catch (err) {
      console.error(err)
      setErrorMsg('Network error, coba lagi')
    } finally {
      setLoading(false)
    }
  }

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
        src="/images/video1.mp4"
        autoPlay
        loop
        muted
      ></video>

      {/* === OVERLAY GELAP === */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* === ERROR NOTIFICATION === */}
      {errorMsg && (
        <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
          <div className="bg-red-600 text-white px-6 py-2 rounded shadow-md animate-slideDown">
            {errorMsg}
          </div>
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
        <h2 className="text-4xl font-bold mb-4 tracking-wide">Buat Akun</h2>

        {/* === FORM === */}
        <form
          className="w-full flex flex-col space-y-4"
          onSubmit={handleRegister}
        >
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

          {/* === PASSWORD DENGAN ICON MATA === */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Masukkan Password Anda"
              className="w-full px-4 py-2 pr-10 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-300 hover:text-white transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* === BUTTON === */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Buat Akun'}
          </button>

          <div className="text-center text-sm text-gray-500">OR</div>
          {/* === GOOGLE SIGN IN === */}
          <div className="w-full max-w-md">
            <GoogleOAuthProvider clientId="764774487773-iikq8ssu0drtdijjha7n0139r8j27cpc.apps.googleusercontent.com">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMsg('Login Google gagal')}
              />
            </GoogleOAuthProvider>
          </div>
        </form>


        {/* === SIGN IN LINK === */}
        <p className="text-sm text-gray-300">
          Sudah Punya Akun?{' '}
          <a
            href="/page/sigin"
            className="text-white font-medium hover:underline"
          >
            Masuk
          </a>
        </p>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-16px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 220ms ease-out;
        }
      `}</style>
    </div>
  )
}
