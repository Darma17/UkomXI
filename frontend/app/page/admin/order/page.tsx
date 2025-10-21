"use client"
import React from "react"

interface Order {
  id: number
  customerName: string
  orderCode: string
  totalPrice: number
  status: "Pending" | "Diproses" | "Selesai" | "Dibatalkan"
  date: string
}

export default function Orders() {
  const orders: Order[] = [
    {
      id: 1,
      customerName: "John Doe",
      orderCode: "ORD-20251001",
      totalPrice: 250000,
      status: "Pending",
      date: "2025-10-01",
    },
    {
      id: 2,
      customerName: "Jane Smith",
      orderCode: "ORD-20251002",
      totalPrice: 375000,
      status: "Diproses",
      date: "2025-10-02",
    },
    {
      id: 3,
      customerName: "Michael Johnson",
      orderCode: "ORD-20251003",
      totalPrice: 420000,
      status: "Selesai",
      date: "2025-10-03",
    },
    {
      id: 4,
      customerName: "Sarah Williams",
      orderCode: "ORD-20251004",
      totalPrice: 195000,
      status: "Dibatalkan",
      date: "2025-10-04",
    },
  ]

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700"
      case "Diproses":
        return "bg-blue-100 text-blue-700"
      case "Selesai":
        return "bg-green-100 text-green-700"
      case "Dibatalkan":
        return "bg-red-100 text-red-700"
      default:
        return ""
    }
  }

  return (
    <div className="p-6 space-y-6 pl-15">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Daftar Orders</h1>
        <p className="text-gray-500 text-sm">
          Lihat semua daftar order di toko anda
        </p>
      </div>

      {/* Tabel Orders */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">Nama Pelanggan</th>
              <th className="p-3 text-left">Order Code</th>
              <th className="p-3 text-left">Total Price</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 border-b last:border-none transition"
              >
                <td className="p-3">{index + 1}</td>
                <td className="p-3 font-medium">{order.customerName}</td>
                <td className="p-3">{order.orderCode}</td>
                <td className="p-3">
                  Rp {order.totalPrice.toLocaleString("id-ID")}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-3">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
