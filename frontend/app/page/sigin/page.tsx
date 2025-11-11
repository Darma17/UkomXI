'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import axios from "axios"
import { Eye, EyeOff } from "lucide-react"
import ReCAPTCHA from "react-google-recaptcha"

function SignInInner() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [errorMsg, setErrorMsg] = useState('')
	const [successMsg, setSuccessMsg] = useState('')
	const [captchaValue, setCaptchaValue] = useState<string>("")

	// Auto-hide error
	useEffect(() => {
		if (!errorMsg) return
		const id = setTimeout(() => setErrorMsg(''), 2000)
		return () => clearTimeout(id)
	}, [errorMsg])

	// Show success after redirect
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

		// ✅ Pastikan captcha sudah diisi
		if (!captchaValue) {
			setErrorMsg('Silakan verifikasi captcha terlebih dahulu')
			return
		}

		setLoading(true)
		try {
			// Verifikasi captcha ke backend (opsional, disarankan)
			// Anda bisa kirim juga ke backend bersamaan dengan login data
			const res = await fetch('http://127.0.0.1:8000/api/login/customer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, captchaToken: captchaValue }),
			})

			const data = await res.json().catch(() => ({}))

			if (!res.ok) {
				setErrorMsg(data.message || 'Gagal Masuk')
				setLoading(false)
				return
			}

			router.push(`/page/otp?email=${encodeURIComponent(email)}`)
		} catch {
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

			{/* Success Notification */}
			{successMsg && (
				<div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
					<div className="bg-green-600 text-white px-6 py-2 rounded shadow-md animate-slideDown">{successMsg}</div>
				</div>
			)}

			{/* Error Notification */}
			{errorMsg && (
				<div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
					<div className="bg-red-600 text-white px-6 py-2 rounded shadow-md animate-slideDown">
						{errorMsg}
					</div>
				</div>
			)}

			{/* === FORM CONTAINER === */}
			<div className="relative z-10 backdrop-blur-xl bg-black/40 border border-white/20 text-white rounded-2xl shadow-2xl p-10 w-full max-w-md flex flex-col items-center space-y-6">
				<img src="/images/logoPutih.png" alt="Logo" className="w-26 h-26 object-contain mb-2" />
				<h2 className="text-4xl font-bold mb-4 tracking-wide">Masuk</h2>

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

					{/* === PASSWORD INPUT DENGAN ICON MATA === */}
					<div className="relative">
						<label className="block text-sm font-medium mb-1">Password</label>
						<input
							type={showPassword ? "text" : "password"}
							placeholder="Masukkan Password Anda"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
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

					<div className="flex justify-start">
						<a href="/page/forgot-password" className="text-blue-400 text-sm hover:underline">
							Lupa Password?
						</a>
					</div>
					{/* === reCAPTCHA === */}
					<div className="flex justify-center mt-3">
						<ReCAPTCHA
							sitekey="6LcdwggsAAAAAIA8kcX7FrkAXRspjzrv94ycga52" // test key
							onChange={(value: string | null) => setCaptchaValue(value ?? "")}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 transition disabled:opacity-60"
					>
						{loading ? 'Loading...' : 'Masuk'}
					</button>


					<div className="my-3 text-center text-sm text-gray-500">OR</div>

					<GoogleOAuthProvider clientId="764774487773-iikq8ssu0drtdijjha7n0139r8j27cpc.apps.googleusercontent.com">
						<GoogleLogin
							onSuccess={async (credentialResponse) => {
								try {
									const token = credentialResponse.credential
									const res = await axios.post("http://127.0.0.1:8000/api/google-login", { token })

									if (res.status === 200) {
										localStorage.setItem("authToken", res.data.token)
										window.dispatchEvent(new Event("authChanged"))
										router.push("/")
									} else {
										setErrorMsg("Gagal login dengan Google atau akun Google belum terdaftar")
									}
								} catch (err) {
									console.error(err)
									setErrorMsg("Gagal login dengan Google atau akun Google belum terdaftar")
								}
							}}
							onError={() => setErrorMsg("Login Google gagal")}
						/>
					</GoogleOAuthProvider>
				</form>

				<p className="text-sm text-gray-300 mt-2">
					Belum Punya Akun?{' '}
					<a href="/page/create-account" className="text-white font-medium hover:underline">
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

export default function SignIn() {
	return (
		<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
			<SignInInner />
		</Suspense>
	)
}
