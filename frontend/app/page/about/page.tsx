import React from 'react'
import { redirect } from 'next/navigation'

export default function page () {
  redirect('/about')

  return (
    <div>About Us</div>
  )
}
