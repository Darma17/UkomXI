"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye } from "lucide-react"

type Address = {
  id: number
  nama_penerima: string
  no_telp: string
  alamat_lengkap: string
  provinsi: string
  kabupaten: string
  kecamatan: string
}

type Book = {
  id: number
  title: string
  cover_image?: string | null
  price?: number
}

type OrderItem = {
  id: number
  book_id: number
  quantity: number
  price: number
  book?: Book | null
}

type Kurir = { id: number; nama: string; harga: number }

type Order = {
  id: number
  order_code: string
  total_price: number
  status?: string
  complete?: boolean
  address_id?: number | null
  address?: Address | null
  kurir?: Kurir | null
  items: OrderItem[]
}

// Daftar status yang valid (typed, non-undefined)
const STATUS_LIST = ["proses","dibayar","dikemas","diantar","selesai","cancelled"] as const
type Status = typeof STATUS_LIST[number]

export default function Orders() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [allow, setAllow] = useState(false)

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken")
    if (adminToken) {
      setAllow(true)
      setChecked(true)
      return
    }
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.replace("/page/login-admin")
      return
    }
    fetch("http://127.0.0.1:8000/api/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u?.role === "admin") setAllow(true)
        else router.replace("/page/login-admin")
      })
      .catch(() => router.replace("/page/login-admin"))
      .finally(() => setChecked(true))
  }, [router])

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState<Order | null>(null)
  const [showWaitModal, setShowWaitModal] = useState(false)

  function formatPrice(n: number) {
    return `Rp ${Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`
  }

  async function updateOrderStatus(order: Order, newStatus: Status) {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("adminToken") || ""
      const res = await fetch(`http://127.0.0.1:8000/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Gagal mengubah status")
      const updated: Order = await res.json()
      // Selesai -> tampilkan modal tunggu jika complete masih false
      if (newStatus === "selesai" && !updated.complete) {
        setShowWaitModal(true)
      }
      // perbarui state orders
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))
      // jika sedang lihat detail order yang sama, sinkronkan juga
      setSelected((sel) => (sel && sel.id === updated.id ? { ...sel, ...updated } as Order : sel))
    } catch (e) {
      setErr((e as any)?.message || "Gagal mengubah status")
      setTimeout(() => setErr(""), 2000)
    }
  }

  async function loadOrders() {
    setLoading(true)
    setErr("")
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("adminToken") || ""
      const res = await fetch("http://127.0.0.1:8000/api/orders", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Gagal memuat orders")
      const data = await res.json().catch(() => [])
      setOrders(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setErr(e?.message || "Gagal memuat orders")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (allow) loadOrders()
  }, [allow])

  if (!checked || !allow) return null

  return (
    <div className="p-6 space-y-6 pl-15">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Daftar Orders</h1>
        <p className="text-gray-500 text-sm">Lihat semua daftar order di toko anda</p>
      </div>

      {err && <div className="px-4 py-2 bg-red-100 text-red-700 rounded">{err}</div>}

      {/* Tabel Orders (desain seragam admin) */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60">
            <tr className="text-xs uppercase tracking-wide text-gray-600">
              <th className="p-3 text-left w-12">No</th>
              <th className="p-3 text-left min-w-[200px]">Order Code</th>
              <th className="p-3 text-left w-40">Total Price</th>
              <th className="p-3 text-center w-40">Detail</th>
              <th className="p-3 text-center min-w-[360px]">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id} className="hover:bg-gray-100/70 border-b last:border-none transition-colors">
                <td className="p-3">{i + 1}</td>
                <td className="p-3 font-medium text-gray-900">{o.order_code}</td>
                <td className="p-3">{formatPrice(Number(o.total_price || 0))}</td>
                <td className="p-3">
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setSelected(o)
                        setShowDetail(true)
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 cursor-pointer text-blue-700 hover:bg-blue-100 transition"
                      title="Lihat"
                    >
                      <Eye size={16} /> <span className="text-xs font-medium">Lihat</span>
                    </button>
                  </div>
                </td>
                <td className="p-3">
                  <div className="relative">
                    <div className="flex flex-wrap gap-2">
                      {STATUS_LIST.map((s: Status) => {
                        const isActive = o.status === s
                        const isDoneFilled = s === "selesai" && o.status === "selesai" && !!o.complete
                        const isCancelled = s === "cancelled"
                        // base style
                        let cls = "px-3 py-1.5 rounded-full text-xs border transition select-none"
                        if (isCancelled) {
                          cls += isActive ? " border-red-600 bg-red-600 text-white" : " border-red-500 text-red-600 hover:bg-red-50"
                        } else if (isDoneFilled) {
                          cls += " border-green-600 bg-green-600 text-white"
                        } else if (s === "selesai") {
                          cls += " border-green-600 text-green-700 hover:bg-green-50"
                        } else {
                          cls += isActive ? " border-blue-600 text-blue-700 bg-blue-50" : " border-gray-300 text-gray-700 hover:bg-gray-50"
                        }
                        const label = s.charAt(0).toUpperCase() + s.slice(1)
                        return (
                          <button
                            key={s}
                            onClick={() => {
                              if (o.status === s) return
                              updateOrderStatus(o, s)
                            }}
                            className={cls}
                            title={label}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    {/* Overlay saat menunggu konfirmasi customer */}
                    {o.status === "selesai" && !o.complete && (
                      <div className="absolute inset-0 rounded-md bg-black/50 flex items-center justify-center pointer-events-auto">
                        <span className="text-white text-xs font-semibold">Masih Menunggu Konfirmasi</span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-4">
                  Belum ada data order
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="p-4 text-sm text-gray-500">Memuat orders...</div>}
      </div>

      {/* Modal Detail Order */}
      {showDetail && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mt-16 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Detail Order</h2>
              <p className="text-sm text-gray-600 mt-1">
                Order Code:{" "}
                <span className="font-medium text-gray-900">{selected.order_code}</span>
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Address */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Alamat Pengiriman</h3>
                {selected.address ? (
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>
                      {selected.address.nama_penerima}{" "}
                      <span className="text-gray-500">({selected.address.no_telp})</span>
                    </div>
                    <div className="text-gray-700">
                      {selected.address.provinsi}, {selected.address.kabupaten}, {selected.address.kecamatan}
                    </div>
                    <div className="text-gray-700">{selected.address.alamat_lengkap}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Alamat tidak tersedia</div>
                )}
              </div>

              {/* Items */}
              <div className="rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b">
                  <h3 className="text-sm font-semibold text-gray-800">Item Dibeli</h3>
                </div>
                <div className="divide-y">
                  {selected.items?.map((it) => {
                    const title = it.book?.title || "Tanpa Judul"
                    const cover = it.book?.cover_image
                      ? `http://localhost:8000/storage/${it.book.cover_image}`
                      : "/images/dummyImage.jpg"
                    const price = Number(it.price || 0)
                    const qty = Number(it.quantity || 0)
                    const subtotal = price * qty
                    return (
                      <div key={it.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-[54px] h-[72px] rounded-md overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                            <Image
                              src={cover}
                              alt={title}
                              width={54}
                              height={72}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 leading-snug line-clamp-2">{title}</div>
                            <div className="mt-1 text-sm text-gray-700 flex items-center gap-2">
                              <span>{formatPrice(price)}</span>
                              <span className="text-gray-400">×</span>
                              <span>{qty}</span>
                            </div>
                          </div>
                          <div className="text-right text-gray-900 font-medium">{formatPrice(subtotal)}</div>
                        </div>
                      </div>
                    )
                  })}
                  {(!selected.items || selected.items.length === 0) && (
                    <div className="p-4 text-sm text-gray-500">Tidak ada item.</div>
                  )}
                </div>
              </div>

              {/* Kurir */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-800">
                    Kurir:{" "}
                    <span className="font-medium">{selected.kurir?.nama || "-"}</span>
                  </div>
                  <div className="text-gray-900 font-medium">
                    {selected.kurir ? formatPrice(Number(selected.kurir.harga || 0)) : formatPrice(0)}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between px-1">
                <div className="text-gray-800 font-medium">Total</div>
                <div className="text-gray-900 font-semibold">{formatPrice(Number(selected.total_price || 0))}</div>
              </div>

              {/* Button Tutup */}
              <button
                onClick={() => setShowDetail(false)}
                className="w-full mt-2 border border-gray-900 text-gray-800 rounded-md py-2.5 hover:bg-black hover:text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tunggu Konfirmasi Customer */}
      {showWaitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Menunggu Konfirmasi Customer</h3>
            <p className="text-gray-600">
              Tunggu customer mengkonfirmasi pesanan ini. Status akan otomatis menjadi “Selesai” setelah customer mengkonfirmasi.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowWaitModal(false)}
                className="w-full border border-gray-900 rounded-md py-2.5 hover:bg-black hover:text-white transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
