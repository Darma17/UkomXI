'use client'

import React, { useState } from 'react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, Linkedin, Github, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [info, setInfo] = useState<string>('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInfo('')
    setSending(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setInfo(data?.message || 'Gagal mengirim pesan')
        return
      }
      setInfo('Pesan terkirim. Terima kasih!')
      setName(''); setEmail(''); setSubject(''); setMessage('')
    } catch {
      setInfo('Gagal mengirim pesan (network)')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <section className="max-w-6xl mx-auto px-6 pt-28 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* LEFT: Intro + socials */}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-bold text-black">Hubungi Kami</h1>
              <p className="text-gray-600 mt-3 leading-relaxed">
                Punya pertanyaan, saran, atau butuh bantuan? Tim BukuKu siap membantu.
                Kirimkan pesan melalui formulir atau hubungi kami lewat media sosial di bawah ini.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-black mt-0.5" />
                  <div>
                    <div className="font-semibold text-black">Email</div>
                    <div className="text-gray-600">bukuku.real@gmail.com</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-black mt-0.5" />
                  <div>
                    <div className="font-semibold text-black">Telepon</div>
                    <div className="text-gray-600">+62-xxx-xxxx-xxx</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-black mt-0.5" />
                  <div>
                    <div className="font-semibold text-black">Alamat</div>
                    <div className="text-gray-600">BukuKu HQ, Indonesia</div>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <div className="text-sm font-semibold text-black mb-3">Media Sosial</div>
                <div className="flex flex-wrap gap-3">
                  <a href="https://www.facebook.com" className="p-2 rounded-full border border-gray-300 hover:bg-gray-100" aria-label="Facebook">
                    <Facebook className="w-5 h-5 text-gray-800" />
                  </a>
                  <a href="https://www.instagram.com" className="p-2 rounded-full border border-gray-300 hover:bg-gray-100" aria-label="Instagram">
                    <Instagram className="w-5 h-5 text-gray-800" />
                  </a>
                  <a href="https://x.com" className="p-2 rounded-full border border-gray-300 hover:bg-gray-100" aria-label="Twitter">
                    <Twitter className="w-5 h-5 text-gray-800" />
                  </a>
                  <a href="https://youtube.com" className="p-2 rounded-full border border-gray-300 hover:bg-gray-100" aria-label="YouTube">
                    <Youtube className="w-5 h-5 text-gray-800" />
                  </a>
                  <a href="https://www.linkedin.com" className="p-2 rounded-full border border-gray-300 hover:bg-gray-100" aria-label="LinkedIn">
                    <Linkedin className="w-5 h-5 text-gray-800" />
                  </a>
                  <a href="https://github.com" className="p-2 rounded-full border border-gray-300 hover:bg-gray-100" aria-label="GitHub">
                    <Github className="w-5 h-5 text-gray-800" />
                  </a>
                  <a href="https://wa.me/628xxxxxxxxxx" className="p-2 rounded-full border border-gray-300 hover:bg-gray-100" aria-label="WhatsApp">
                    <MessageCircle className="w-5 h-5 text-gray-800" />
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT: Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
              <h2 className="text-xl font-semibold text-black mb-5">Kirim Pesan</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Nama</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Subjek</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Judul pesan"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pesan</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tulis pesan Anda di sini..."
                    rows={6}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2 rounded-md bg-black text-white font-semibold hover:bg-gray-900 transition disabled:opacity-60"
                    title="Kirim pesan"
                  >
                    {sending ? 'Loading...' : 'Kirim'}
                  </button>
                </div>

                {info && <span className="text-sm text-gray-700 bg-green-200 px-4 py-1 rounded-full shadow-sm">{info}</span>}
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
