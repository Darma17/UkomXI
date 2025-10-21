'use client'

import React, { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [activePage, setActivePage] = useState('Dashboard')

  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}
