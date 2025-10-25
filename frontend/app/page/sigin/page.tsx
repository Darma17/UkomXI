'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SignIn() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [errorMsg, setErrorMsg] = useState('')
	const [successMsg, setSuccessMsg] = useState('')

	// New: auto-hide notification after 4 seconds
	useEffect(() => {
		if (!errorMsg) return
		const id = setTimeout(() => setErrorMsg(''), 2000)
		return () => clearTimeout(id)
	}, [errorMsg])
	// show success message if redirected from reset or register flow
	useEffect(() => {
		if (searchParams?.get('reset') === '1' || searchParams?.get('register') === '1') {
			setSuccessMsg('Silahkan Login')
			const id = setTimeout(() => setSuccessMsg(''), 3000)
			return () => clearTimeout(id)
		}
	}, [searchParams])

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setErrorMsg('')
		setLoading(true)

		try {
			const res = await fetch('http://127.0.0.1:8000/api/login/customer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})

			const data = await res.json().catch(() => ({}))

			if (!res.ok) {
				setErrorMsg(data.message || 'Gagal Masuk')
				setLoading(false)
				return
			}

			// success -> redirect to OTP page with email query
			router.push(`/page/otp?email=${encodeURIComponent(email)}`)
		} catch (err) {
			setErrorMsg("Terjadi Kesalahan, coba lagi")
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

			<div className="absolute inset-0 bg-black/70"></div>

			{/* Success green notification */}
			{successMsg && (
				<div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
					<div className="bg-green-600 text-white px-6 py-2 rounded shadow-md animate-slideDown">{successMsg}</div>
				</div>
			)}

			{/* Notification (slide down) */}
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
				<h2 className="text-4xl font-bold mb-4 tracking-wide">Masuk</h2>

				{/* Form */}
				<form className="w-full flex flex-col space-y-4" onSubmit={handleSubmit}>
					<div>
						<label className="block text-sm font-medium mb-1">Email</label>
						<input
							type="email"
							placeholder="Masukkan Email Anda"
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
							placeholder="Masukkan Password Anda"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50"
						/>
					</div>

					<div className="flex justify-start">
						<a href="/page/forgot-password" className="text-blue-400 text-sm hover:underline">
							Lupa Password?
						</a>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60"
					>
						{loading ? 'Loading...' : 'Masuk'}
					</button>

					<div className="my-4 text-center text-sm text-gray-500">OR</div>

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
