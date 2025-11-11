'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function OtpInner() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const emailParam = searchParams?.get('email') || ''
	const purpose = searchParams?.get('purpose') || 'login' // 'reset' or 'login'

	const [otp, setOtp] = useState('')
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

	async function handleVerify(e: React.FormEvent) {
		e.preventDefault()
		setErrorMsg('')
		setLoading(true)

		try {
			if (purpose === 'reset') {
				const res = await fetch('http://127.0.0.1:8000/api/verify-reset-otp', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: emailParam, otp }),
				})
				const data = await res.json().catch(() => ({}))
				if (!res.ok) {
					setErrorMsg(data.message || 'Gagal Verifikasi OTP')
					setLoading(false)
					return
				}
				// redirect to new-password with reset token
				const token = data.reset_token
				router.push(`/page/new-password?email=${encodeURIComponent(emailParam)}&reset_token=${encodeURIComponent(token)}`)
			} else if (purpose === 'register') {
				const res = await fetch('http://127.0.0.1:8000/api/register/verify', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: emailParam, otp }),
				})
				const data = await res.json().catch(() => ({}))
				if (!res.ok) {
					setErrorMsg(data.message || 'Gagal Verifikasi OTP')
					setLoading(false)
					return
				}

				// If backend returned token -> auto-login client
				if (data.token) {
					localStorage.setItem('authToken', data.token)
					window.dispatchEvent(new Event('authChanged'))
					router.push('/')
					return
				}

				// fallback: redirect to signin
				router.push('/page/sigin?register=1')
			} else {
				// login (customer atau admin)
				const res = await fetch('http://127.0.0.1:8000/api/verify-otp', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: emailParam, otp, device_name: 'web' }),
				})
				const data = await res.json().catch(() => ({}))

				if (!res.ok) {
					setErrorMsg(data.message || 'Gagal Verivikasi OTP')
					setLoading(false)
					return
				}

				const token = data.token
				if (!token) {
					setErrorMsg('Token tidak ditemukan')
					setLoading(false)
					return
				}

				// Admin: hanya simpan adminToken (tanpa authToken)
				if (purpose === 'admin') {
					localStorage.setItem('adminToken', token)
					router.push('/page/admin/dashboard')
				} else if (purpose === 'operator') {
					localStorage.setItem('operatorToken', token)
					router.push('/page/operator/product')
				} else {
					localStorage.setItem('authToken', token)
					window.dispatchEvent(new Event('authChanged'))
					router.push('/')
				}
			}
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
					Verifikasi OTP
				</h1>
				<p className="text-gray-300 text-sm mb-6">
					Cek email anda dan masukkan kode OTP
				</p>

				<form onSubmit={handleVerify}>
					<input
						id="otp-input"
						type="text"
						placeholder="Masukkan kode OTP"
						value={otp}
						onChange={(e) => setOtp(e.target.value)}
						required
						className="w-full text-center px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white mb-4 border border-white"
					/>
					<button
						type="submit"
						disabled={loading}
						className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60"
					>
						{loading ? 'Loading...' : 'Verifikasi'}
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

export default function OtpPage() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
			<OtpInner />
		</Suspense>
	)
}
