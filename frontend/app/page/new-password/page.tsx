'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react' // 👈 pastikan lucide-react sudah terinstall

function NewPasswordInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailParam = searchParams?.get('email') || ''
    const resetToken = searchParams?.get('reset_token') || ''

    const [password, setPassword] = useState('')
    const [conPass, setConPass] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConPass, setShowConPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Fokus ke input pertama saat load
    useEffect(() => {
        const el = document.getElementById('password-input')
        el?.focus()
    }, [])

    // Sembunyikan notifikasi otomatis
    useEffect(() => {
        if (!errorMsg) return
        const id = setTimeout(() => setErrorMsg(''), 3000)
        return () => clearTimeout(id)
    }, [errorMsg])

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        setErrorMsg('')
        setLoading(true)

        // validasi password baru: huruf/angka saja dan minimal 8
        const PASS_REGEX = /^[A-Za-z0-9]{8,}$/
        if (!PASS_REGEX.test(password)) {
            setErrorMsg('Password harus huruf/angka saja dan minimal 8 karakter')
            setLoading(false)
            return
        }

        if (password !== conPass) {
            setErrorMsg('Password dan konfirmasi tidak sama!')
            setLoading(false)
            return
        }

        try {
            const res = await fetch('http://127.0.0.1:8000/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailParam,
                    reset_token: resetToken,
                    password,
                    password_confirmation: conPass,
                }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                setErrorMsg(data.message || 'Gagal mengganti password')
                return
            }

            router.push('/page/sigin?reset=1')
        } catch (err) {
            console.error(err)
            setErrorMsg('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* 🔹 Background Video */}
            <video
                className="absolute inset-0 w-full h-full object-cover"
                src="/images/video1.mp4"
                autoPlay
                loop
                muted
            ></video>

            {/* 🔹 Notifikasi Error */}
            {errorMsg && (
                <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
                    <div className="bg-red-600 text-white px-6 py-2 rounded shadow-md animate-slideDown">
                        {errorMsg}
                    </div>
                </div>
            )}

            {/* 🔹 Form Reset Password */}
            <div className="relative z-10 bg-black/40 backdrop-blur-md p-8 rounded-2xl w-96 max-w-full text-center shadow-xl border border-gray-700">
                <h1 className="text-white text-2xl font-semibold mb-2">Ganti Password</h1>
                <p className="text-gray-300 text-sm mb-6">Masukkan password baru kamu</p>

                <form onSubmit={handleReset} className="space-y-4">
                    {/* Input Password */}
                    <div className="relative">
                        <input
                            id="password-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password Baru (huruf/angka, ≥8)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-md text-white bg-transparent border border-white focus:outline-none focus:ring-2 focus:ring-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Input Konfirmasi Password */}
                    <div className="relative">
                        <input
                            type={showConPass ? 'text' : 'password'}
                            placeholder="Konfirmasi Password"
                            value={conPass}
                            onChange={(e) => setConPass(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-md text-white bg-transparent border border-white focus:outline-none focus:ring-2 focus:ring-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConPass((p) => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
                        >
                            {showConPass ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Tombol Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60"
                    >
                        {loading ? 'Loading...' : 'Ubah Password'}
                    </button>
                </form>
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

// Wrapper dengan Suspense
export default function NewPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
            <NewPasswordInner />
        </Suspense>
    )
}
