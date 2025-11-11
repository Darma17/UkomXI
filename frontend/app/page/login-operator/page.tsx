'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReCAPTCHA from 'react-google-recaptcha'

export default function LoginOperator() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!errorMsg) return
    const id = setTimeout(() => setErrorMsg(''), 2500)
    return () => clearTimeout(id)
  }, [errorMsg])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    if (!captcha) { setErrorMsg('Silakan verifikasi captcha terlebih dahulu'); return }
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/login/operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken: captcha }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(data?.message || 'Gagal masuk operator')
        return
      }
      router.push(`/page/otp?email=${encodeURIComponent(email)}&purpose=operator`)
    } catch {
      setErrorMsg('Network error, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <video className="absolute inset-0 w-full h-full object-cover" src="/images/video1.mp4" autoPlay loop muted />
      <div className="absolute inset-0 bg-black/70" />
      {errorMsg && (
        <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
          <div className="bg-red-600 text-white px-6 py-2 rounded shadow-md">{errorMsg}</div>
        </div>
      )}
      <div className="relative z-10 backdrop-blur-xl bg-black/40 border border-white/20 text-white rounded-2xl shadow-2xl p-10 w-full max-w-md flex flex-col items-center space-y-6">
        <img src="/images/logoPutih.png" alt="Logo" className="w-26 h-26 object-contain mb-2" />
        <h2 className="text-3xl font-bold">Masuk Operator</h2>
        <form className="w-full flex flex-col space-y-4" onSubmit={handleSubmit}>
          <input className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 focus:outline-none" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 focus:outline-none" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <div className="flex justify-center">
            <ReCAPTCHA sitekey="6LcdwggsAAAAAIA8kcX7FrkAXRspjzrv94ycga52" onChange={(v)=>setCaptcha(v??'')} />
          </div>
          <button type="submit" disabled={loading || !captcha} className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60">
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
