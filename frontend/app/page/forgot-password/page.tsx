'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ForgotPassword() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // auto-hide
    useEffect(() => {
        if (!errorMsg) return
        const id = setTimeout(() => setErrorMsg(''), 3000)
        return () => clearTimeout(id)
    }, [errorMsg])

    async function handleRequestOtp(e: React.FormEvent) {
        e.preventDefault()
        setErrorMsg('')
        setLoading(true)

        try {
            const res = await fetch('http://127.0.0.1:8000/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                setErrorMsg(data.message || 'Gagal mengirim OTP')
                setLoading(false)
                return
            }

            // success: redirect to OTP page for reset purpose
            router.push(`/page/otp?email=${encodeURIComponent(email)}&purpose=reset`)
        } catch (err) {
            setErrorMsg('Network error, try again')
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
                    Masukkan Email
                </h1>
                <p className="text-gray-300 text-sm mb-6">
                    Masukkan Email anda untuk menerima OTP
                </p>

                <form onSubmit={handleRequestOtp}>
                    <input
                        id="email-input"
                        type="email"
                        placeholder="Masukkan Email anda"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white mb-4 border border-white"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60"
                    >
                        {loading ? 'Loading...' : 'Lanjut'}
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
