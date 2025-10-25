'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewPassword() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailParam = searchParams?.get('email') || ''
    const resetToken = searchParams?.get('reset_token') || ''

    const [password, setPassword] = useState('')
    const [conPass, setConPass] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // optionally focus input on mount
    useEffect(() => {
        const el = document.getElementById('otp-input')
        if (el) (el as HTMLInputElement).focus()
    }, [])

    // New: auto-hide notification after 4 seconds
    useEffect(() => {
        if (!errorMsg) return
        const id = setTimeout(() => setErrorMsg(''), 3000)
        return () => clearTimeout(id)
    }, [errorMsg])

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        setErrorMsg('')
        setLoading(true)

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
                setLoading(false)
                return
            }

            // success -> redirect to SignIn with success flag
            router.push('/page/sigin?reset=1')
        } catch (err) {
            setErrorMsg('Password tidak sama, coba lagi')
        } finally {
            setLoading(false)
        }
    }

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

            {errorMsg && (
                <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
                    <div className="bg-red-600 text-white px-6 py-2 rounded shadow-md animate-slideDown">
                        {errorMsg}
                    </div>
                </div>
            )}
            {/* 🔹 Form Verifikasi */}
            <div className="relative z-10 bg-black/40 backdrop-blur-md p-8 rounded-2xl w-96 max-w-full text-center shadow-xl border border-gray-700">
                <h1 className="text-white text-2xl font-semibold mb-2">
                    Ganti Password
                </h1>
                <p className="text-gray-300 text-sm mb-6">
                    Ganti Password anda dengan yang baru
                </p>

                <form onSubmit={handleReset}>
                    <input
                        id="otp-input"
                        type="password"
                        placeholder="Masukkan Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white mb-4 border border-white"
                    />
                    <input
                        id="otp-input"
                        type="password"
                        placeholder="Konfirmasi Password"
                        value={conPass}
                        onChange={(e) => setConPass(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white mb-4 border border-white"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60"
                    >
                        {loading ? 'Loading...' : 'Ubah'}
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
