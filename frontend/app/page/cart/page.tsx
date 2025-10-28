'use client'

import React, { useState, useEffect } from 'react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import api from '../../api/api'        // NEW: axios instance
import { Trash2 } from 'lucide-react' // NEW: trash icon
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function Cart() {
  const router = useRouter()

  // If user logged-in we load cart from backend; otherwise fallback sample
  const [cartItems, setCartItems] = useState<any[]>([]) 
  const [cartTotal, setCartTotal] = useState<number | null>(null) // total_price from DB (if available)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // NEW: checkout state
  const [checkoutProcessing, setCheckoutProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // NEW: alamat tujuan (data dari /api/addresses/me)
  type Address = {
    id: number
    nama_alamat: string
    nama_penerima: string
    no_telp: string
    alamat_lengkap: string
    provinsi: string
    kabupaten: string
    kecamatan: string
  }
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addrLoading, setAddrLoading] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)

  // sample fallback (used if not authenticated)
  const sampleFallback = [
    {
      id: 1,
      cart_item_id: null,
      book_id: 1,
      title: 'Nike Air Max 270',
      author: 'Nike',
      cover_image: '',
      quantity: 1,
      price: 2150000,
    },
    {
      id: 2,
      cart_item_id: null,
      book_id: 2,
      title: 'Nike Dunk Low Retro',
      author: 'Nike',
      cover_image: '',
      quantity: 1,
      price: 1899000,
    },
  ]

  // load cart from backend (if authenticated) else use fallback
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        if (typeof window === 'undefined') return
        const token = localStorage.getItem('authToken')
        if (!token) {
          // not logged in -> fallback
          if (mounted) {
            setCartItems(sampleFallback)
            setCartTotal(null)
            setLoading(false)
          }
          return
        }

        // get current authenticated user (use /user)
        const userRes = await api.get('/user')
        const user = userRes.data

        // get carts list (CartController@index returns carts with items.book)
        const cartsRes = await api.get('/carts')
        const carts: any[] = cartsRes.data || []

        // find cart for current user
        const myCart = carts.find(c => Number(c.user_id) === Number(user.id))

        if (!myCart) {
          // no cart yet
          if (mounted) {
            setCartItems([])
            setCartTotal(0)
            setLoading(false)
          }
          return
        }

        // map items for UI (ensure fields exist)
        const items = (myCart.items || []).map((it: any) => ({
          id: it.book_id, // fallback id
          cart_item_id: it.id, // cart_items id
          book_id: it.book_id,
          title: it.book?.title || it.book_id,
          author: it.book?.author || '',
          cover_image: it.book?.cover_image || null,
          quantity: Number(it.quantity || 0),
          price: Number(it.price || 0),
        }))

        if (mounted) {
          setCartItems(items)
          setCartTotal(Number(myCart.total_price || 0))
        }
      } catch (err) {
        console.error(err)
        if (mounted) {
          setError('Gagal memuat keranjang')
          // fallback
          setCartItems(sampleFallback)
          setCartTotal(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  // calculate subtotal client-side as fallback if cartTotal not provided
  const localTotal = cartItems.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0)
  const displayedTotal = cartTotal !== null ? cartTotal : localTotal

  // update quantity (calls backend when possible)
  const handleQuantityChange = async (cartItemIdOrIndex: number | null, newQty: number, itemIdx: number) => {
    const item = cartItems[itemIdx]
    if (!item) return

    // If newQty <= 0 treat as remove
    if (newQty <= 0) {
      await handleRemove(item.cart_item_id ?? null, itemIdx)
      return
    }

    const qty = newQty

    // guard: if this item is already updating, ignore further clicks
    const updatingKey = item.cart_item_id ?? -(itemIdx + 1)
    if (updatingId === updatingKey) return

    // save previous to revert on failure
    const previousItems = [...cartItems]

    // optimistic update
    const newItems = cartItems.map((it, i) => i === itemIdx ? { ...it, quantity: qty } : it)
    setCartItems(newItems)

    // prepare updating marker: use cart_item_id if present, otherwise negative index
    setUpdatingId(updatingKey)

    try {
      if (item.cart_item_id) {
        await api.put(`/cart-items/${item.cart_item_id}`, { quantity: qty, price: item.price })
      } else {
        // local-only item — update only client-side (no server)
        // nothing to do server-side
      }

      // refresh cart from server if authenticated
      try {
        const cartsRes = await api.get('/carts')
        const carts: any[] = cartsRes.data || []
        const userRes = await api.get('/user')
        const user = userRes.data
        const myCart = carts.find(c => Number(c.user_id) === Number(user.id))
        if (myCart) {
          const freshItems = (myCart.items || []).map((it: any) => ({
            id: it.book_id,
            cart_item_id: it.id,
            book_id: it.book_id,
            title: it.book?.title || it.book_id,
            author: it.book?.author || '',
            cover_image: it.book?.cover_image || null,
            quantity: Number(it.quantity || 0),
            price: Number(it.price || 0),
          }))
          setCartItems(freshItems)
          setCartTotal(Number(myCart.total_price || 0))
        } else {
          // no server cart — keep optimistic client state
          setCartTotal(null)
        }
      } catch (e) {
        // network / not authenticated — keep optimistic
      }

      // notify navbar to refresh badge immediately
      window.dispatchEvent(new Event('authChanged'))
    } catch (err) {
      console.error('Update quantity failed', err)
      // revert
      setCartItems(previousItems)
    } finally {
      setUpdatingId(null)
    }
  }
 
   // remove item
   const handleRemove = async (cartItemIdOrIndex: number | null, itemIdx: number) => {
     const item = cartItems[itemIdx]
     if (!item) return
 
     // if has cart_item_id call delete endpoint
     if (item.cart_item_id) {
       const updatingKey = item.cart_item_id
       if (updatingId === updatingKey) return
       setUpdatingId(updatingKey)
       try {
         await api.delete(`/cart-items/${item.cart_item_id}`)
         // refresh cart from backend
         const cartsRes = await api.get('/carts')
         const carts: any[] = cartsRes.data || []
         const userRes = await api.get('/user')
         const user = userRes.data
         const myCart = carts.find(c => Number(c.user_id) === Number(user.id))
         if (myCart) {
           const items = (myCart.items || []).map((it: any) => ({
             id: it.book_id,
             cart_item_id: it.id,
             book_id: it.book_id,
             title: it.book?.title || it.book_id,
             author: it.book?.author || '',
             cover_image: it.book?.cover_image || null,
             quantity: Number(it.quantity || 0),
             price: Number(it.price || 0),
           }))
           setCartItems(items)
           setCartTotal(Number(myCart.total_price || 0))
         } else {
           setCartItems([])
           setCartTotal(0)
         }
         // notify navbar to refresh badge immediately
         window.dispatchEvent(new Event('authChanged'))
       } catch (err) {
         console.error('Failed to remove item', err)
       } finally {
         setUpdatingId(null)
       }
     } else {
       // local fallback (no server)
       const newItems = cartItems.filter((_, i) => i !== itemIdx)
       setCartItems(newItems)
       setCartTotal(null)
     }
   }

   // NEW: handle checkout via backend + Midtrans Snap (sandbox)
   async function handleCheckout() {
     // no-op if cart empty
     if (!cartItems || cartItems.length === 0) return
     // validasi alamat tujuan
     if (!selectedAddress) {
       setCheckoutError('Pilih alamat tujuan terlebih dahulu.')
       return
     }
     // prevent double submit
     if (checkoutProcessing) return

     setCheckoutProcessing(true)
     setCheckoutError(null)

     try {
       // Send items/total to backend to create transaction and return snap token / redirect url
       const payload = {
         items: cartItems.map(it => ({
           book_id: it.book_id,
           title: it.title,
           price: it.price,
           quantity: it.quantity,
         })),
         total: displayedTotal,
         shipping_address: selectedAddress, // opsional: kirim ke backend
       }
       const res = await api.post('/checkout/midtrans', payload)
       const data = res.data || {}

       // Prefer snap token (popup). If missing but redirect_url present, open in a popup window.
       const snapToken = data.snap_token || data.token
       const redirectUrl = data.redirect_url || null

       if (!snapToken && !redirectUrl) {
         setCheckoutError('Metode pembayaran tidak tersedia. Silakan coba lagi.')
         return
       }

       // If no snap token but redirect URL provided -> open popup (avoid forcing full-page redirect)
       if (!snapToken && redirectUrl) {
         const w = 720
         const h = 820
         const left = Math.round((window.screen.width - w) / 2)
         const top = Math.round((window.screen.height - h) / 2)
         const popup = window.open(redirectUrl, 'midtrans_payment', `width=${w},height=${h},left=${left},top=${top},resizable=yes`)
         if (!popup) {
           // popup blocked -> fallback to redirect in same tab
           window.location.href = redirectUrl
           return
         }
         popup.focus()
         // poll popup closing to refresh cart / badge
         const t = setInterval(() => {
           try {
             if (popup.closed) {
               clearInterval(t)
               // notify navbar to refresh badge/totals
               window.dispatchEvent(new Event('authChanged'))
             }
           } catch {
             // ignore cross-origin access while open
           }
         }, 800)
         return
       }

       // load Midtrans Snap JS (sandbox)
       await new Promise<void>((resolve) => {
         if (document.getElementById('midtrans-script')) return resolve()
         const s = document.createElement('script')
         s.id = 'midtrans-script'
         s.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
         // NOTE: data-client-key disarankan diset via backend atau env; ganti berikut dengan client key Anda
         s.setAttribute('data-client-key', 'SB-Mid-client-QtHaZJBSvU5kcXqR')
         s.onload = () => resolve()
         document.body.appendChild(s)
       })
 
       // At this point snapToken exists -> open Snap popup
       // @ts-ignore
       if (window.snap && typeof window.snap.pay === 'function') {
         // @ts-ignore
         window.snap.pay(snapToken, {
           onSuccess: async function (result: any) {
             console.log('Midtrans success', result)
             try {
               // send order creation request to backend (authenticated)
               const payload = {
                 items: cartItems.map(it => ({
                   book_id: it.book_id,
                   quantity: it.quantity,
                   price: it.price
                 })),
                 total: displayedTotal,
                 midtrans_result: result,
                 midtrans_order_id: result?.order_id || result?.transaction_details?.order_id || null
               }
               await api.post('/checkout/complete', payload)
               // notify navbar and redirect to success page
               window.dispatchEvent(new Event('authChanged'))
               window.location.href = '/page/checkout-success'
             } catch (e) {
               console.error('Failed to finalize order', e)
               setCheckoutError('Pembayaran diterima tetapi gagal menyelesaikan pesanan. Silakan hubungi admin.')
             }
           },
           onPending: async function (result: any) {
             console.log('Midtrans pending', result)
             try {
               const payload = {
                 items: cartItems.map(it => ({
                   book_id: it.book_id,
                   quantity: it.quantity,
                   price: it.price
                 })),
                 total: displayedTotal,
                 midtrans_result: result,
                 midtrans_order_id: result?.order_id || result?.transaction_details?.order_id || null
               }
               await api.post('/checkout/complete', payload)
               window.dispatchEvent(new Event('authChanged'))
               window.location.href = '/page/checkout-pending'
             } catch (e) {
               console.error('Failed to finalize pending order', e)
               setCheckoutError('Pembayaran pending, tetapi gagal menyelesaikan pesanan. Silakan hubungi admin.')
             }
           },
           onError: function (err: any) {
             console.error('Midtrans error', err)
             setCheckoutError('Pembayaran gagal. Coba lagi.')
           },
           onClose: function () {
             // user closed popup -> refresh badge/totals just in case
             window.dispatchEvent(new Event('authChanged'))
           }
         })
       } else {
         setCheckoutError('Gagal memuat gateway pembayaran')
       }
 
     } catch (err) {
       console.error('Checkout error', err)
       // extract backend message when available
       let msg = 'Gagal memulai pembayaran'
       if (axios.isAxiosError(err)) {
         const data = err.response?.data
         console.error('Midtrans/backend error body:', data)
         msg = data?.message || (data?.detail ? String(data.detail) : err.message) || msg
       } else if (err instanceof Error) {
         msg = err.message
       }
       setCheckoutError(msg)
     } finally {
       setCheckoutProcessing(false)
     }
   }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">Memuat keranjang...</div>
        <Footer />
      </>
    )
  }

  // NEW: helper to shorten long titles to first 2 words
  const shortTitle = (title: string | undefined | null) => {
    if (!title) return ""
    const parts = title.trim().split(/\s+/)
    if (parts.length <= 2) return title
    return parts.slice(0, 2).join(" ") + "..."
  }

  async function openAddressSelector() {
    setCheckoutError(null)
    setAddressModalOpen(true)
    setAddrLoading(true)
    try {
      const res = await api.get('/addresses/me')
      setAddresses(Array.isArray(res.data) ? res.data : [])
    } catch {
      setAddresses([])
    } finally {
      setAddrLoading(false)
    }
  }

  function chooseAddress(a: Address) {
    setSelectedAddress(a)
    setAddressModalOpen(false)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen text-black bg-gray-50 flex justify-center py-20 px-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* === LEFT: CART ITEMS === */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold mb-6">Keranjang Anda</h1>

            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-10">Keranjang masih kosong</p>
            ) : (
              <div className="space-y-6">
                {cartItems.map((item, idx) => (
                  <div key={item.cart_item_id ?? item.id} className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 pb-6">
                     {/* IMAGE - left */}
                     <div className="w-full sm:w-36 flex-shrink-0 flex items-center justify-center">
                       <img
                         src={ item.cover_image ? `http://127.0.0.1:8000/storage/${item.cover_image}` : '/images/dummyImage.jpg' }
                         alt={item.title}
                         className="w-28 h-36 object-cover rounded-md bg-gray-100"
                       />
                     </div>
 
                     {/* Middle: book info */}
                     <div className="flex-1 flex flex-col justify-between">
                       <div>
                         <h2 className="font-semibold text-lg line-clamp-2">{item.title}</h2>
                         <p className="text-gray-500 text-sm mt-1 line-clamp-1">Author: {item.author}</p>
                         <p className="text-gray-800 font-semibold mt-2">Rp {Number(item.price).toLocaleString('id-ID')}</p>
                       </div>
                     </div>
 
                     {/* Right: Quantity control + delete icon */}
                     <div className="flex flex-col items-end justify-between">
                       <div className="flex items-center gap-3">
                         <span className="text-sm text-gray-600">Quantity:</span>
                         <div className="flex items-center gap-2 border border-gray-300 rounded-md overflow-hidden">
                          <button
                            onClick={() => handleQuantityChange(item.cart_item_id ?? null, item.quantity - 1, idx)}
                            className={`px-3 py-1 text-lg hover:bg-gray-100 ${updatingId === (item.cart_item_id ?? -(idx+1)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                            disabled={updatingId === (item.cart_item_id ?? -(idx+1))}
                          >−</button>
                          <span className="px-4 py-1 min-w-[48px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.cart_item_id ?? null, item.quantity + 1, idx)}
                            className={`px-3 py-1 text-lg hover:bg-gray-100 ${updatingId === (item.cart_item_id ?? -(idx+1)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                            disabled={updatingId === (item.cart_item_id ?? -(idx+1))}
                          >+</button>
                         </div>
                       </div>
 
                       <div className="mt-3">
                        <button
                          onClick={() => handleRemove(item.cart_item_id ?? null, idx)}
                          className={`p-2 rounded-full hover:bg-gray-100 text-gray-600 ${updatingId === (item.cart_item_id ?? -(idx+1)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                          aria-label="Hapus item"
                          disabled={updatingId === (item.cart_item_id ?? -(idx+1))}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </div>

          {/* === RIGHT: ADDRESS + ORDER SUMMARY === */}
          <div className="flex flex-col">
            {/* Alamat Tujuan */}
            <div className="bg-white rounded-xl shadow-sm p-6 h-fit mb-6">
              <h2 className="text-xl font-bold mb-4">Alamat Tujuan</h2>
              {selectedAddress ? (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-gray-800 space-y-1">
                      <div className="font-semibold text-black">{selectedAddress.nama_alamat}</div>
                      <div>{selectedAddress.nama_penerima} ({selectedAddress.no_telp})</div>
                      <div>{selectedAddress.provinsi}, {selectedAddress.kabupaten}, {selectedAddress.kecamatan}</div>
                      <div>{selectedAddress.alamat_lengkap}</div>
                    </div>
                    <button
                      onClick={openAddressSelector}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ganti
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={openAddressSelector}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 text-sm"
                >
                  Pilih alamat tujuan
                </button>
              )}
              {!selectedAddress && checkoutError && (
                <div className="text-sm text-red-600 mt-2">{checkoutError}</div>
              )}
            </div>

            {/* Ringkasan Pesanan */}
            <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
              <h2 className="text-xl font-bold mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-3 mb-4">
                {cartItems.map((it) => (
                  <div key={it.cart_item_id ?? it.id} className="flex justify-between text-sm text-gray-700">
                    <span>{shortTitle(it.title)} x {it.quantity}</span>
                    <span>Rp {(Number(it.price) * Number(it.quantity)).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between font-semibold">
                <span>Total</span>
                <span>Rp {Number(displayedTotal || 0).toLocaleString('id-ID')}</span>
              </div>
              <div>
                {checkoutError && (
                  <div className="text-sm text-red-600 mt-3">{checkoutError}</div>
                )}
                <button
                  onClick={handleCheckout}
                  disabled={!cartItems.length || checkoutProcessing || !selectedAddress}
                  className={`w-full mt-6 py-3 rounded-md font-semibold transition ${
                    !cartItems.length || checkoutProcessing || !selectedAddress
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-900'
                  }`}
                >
                  {checkoutProcessing ? 'Memproses...' : 'Lanjut ke Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pilih Alamat */}
      {addressModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-[90%] max-w-lg max-h-[80vh] p-4 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-black">Pilih Alamat</h3>
              <button onClick={() => setAddressModalOpen(false)} className="text-gray-600 hover:text-black">
                Tutup
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {addrLoading ? (
                <div className="text-sm text-gray-500 p-4">Memuat alamat...</div>
              ) : addresses.length === 0 ? (
                <div className="text-sm text-gray-500 p-4">
                  Tambahkan alamat dahulu di profile Anda.
                </div>
              ) : (
                addresses.map((a) => (
                  <div key={a.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start gap-3">
                      <div className="text-sm text-gray-800 space-y-1">
                        <div className="font-semibold text-black">{a.nama_alamat}</div>
                        <div>{a.nama_penerima} ({a.no_telp})</div>
                        <div>{a.provinsi}, {a.kabupaten}, {a.kecamatan}</div>
                        <div>{a.alamat_lengkap}</div>
                      </div>
                      <button
                        onClick={() => chooseAddress(a)}
                        className="px-3 py-1.5 text-sm bg-black text-white rounded-md hover:bg-gray-800"
                      >
                        Pilih
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  )
}
