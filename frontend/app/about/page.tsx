import Image from 'next/image'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* Hero - Fullscreen Video */}
      <section className="relative h-screen w-full text-white overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/images/video1.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex items-center justify-center">
          <div className="grid grid-cols-1 gap-10 items-center justify-items-center">
            <div className="text-center max-w-2xl">
              <Image
                src="/images/logoPutih.png"
                alt="BukuKu Logo"
                width={250}
                height={250}
                className="mx-auto"
              />
              {/* <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                BukuKu
              </h1> */}
              <p className="mt-4 text-gray-200 text-lg">
                Toko online buku modern yang menghadirkan pengalaman belanja buku nyaman, cepat, dan terpercaya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-white text-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2">
              <h2 className="text-2xl md:text-3xl font-bold">Tentang BukuKu</h2>
              <p className="mt-4 leading-7 text-gray-700">
                BukuKu lahir dari semangat untuk memudahkan siapa pun menemukan buku yang tepat.
                Dengan antarmuka modern dan sistem belanja yang sederhana, kami ingin menghadirkan pengalaman membaca yang
                menyenangkan untuk semua kalangan.
              </p>
              <p className="mt-3 leading-7 text-gray-700">
                Kami bekerja sama dengan berbagai penerbit dan distributor resmi untuk memastikan produk yang Anda
                terima adalah original. Proses pesanan otomatis, notifikasi status pesanan yang jelas, hingga dukungan
                pembayaran online Midtrans memudahkan Anda berbelanja kapan saja.
              </p>
              <p className="mt-3 leading-7 text-gray-700">
                Katalog kami diperbarui berkala dengan kurasi kategori populer: Komik & Novel, Agama, Fiksi, Pendidikan,
                dan Pengembangan Diri. Setiap buku memiliki halaman detail lengkap, ulasan pengguna asli, serta metrik penjualan.
              </p>
            </div>
            <div className="md:col-span-1">
              <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-3">Mengapa BukuKu?</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Koleksi lengkap lintas kategori</li>
                  <li>• Pembayaran aman via Midtrans</li>
                  <li>• Ulasan asli dari pembeli</li>
                  <li>• Pelacakan status pesanan</li>
                  <li>• UI modern, clean, dan cepat</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div className="rounded-xl bg-gray-50 p-5 text-center border border-gray-200">
              <div className="text-3xl font-extrabold text-black">5K+</div>
              <div className="text-xs text-gray-500 mt-1">Judul Buku</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-5 text-center border border-gray-200">
              <div className="text-3xl font-extrabold text-black">10K+</div>
              <div className="text-xs text-gray-500 mt-1">Pembeli Puas</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-5 text-center border border-gray-200">
              <div className="text-3xl font-extrabold text-black">100%</div>
              <div className="text-xs text-gray-500 mt-1">Produk Original</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-5 text-center border border-gray-200">
              <div className="text-3xl font-extrabold text-black">24/7</div>
              <div className="text-xs text-gray-500 mt-1">Belanja Kapan Saja</div>
            </div>
          </div>

          {/* Values */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold text-black">Kualitas & Keaslian</h4>
              <p className="text-sm text-gray-600 mt-2">
                Setiap buku bersumber dari penerbit dan distributor resmi. Kami menjaga kualitas konten dan fisik buku yang Anda terima.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold text-black">Pengalaman Modern</h4>
              <p className="text-sm text-gray-600 mt-2">
                Antarmuka yang bersih, navigasi jelas, dan proses checkout sederhana. Semua dirancang agar nyaman digunakan.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-6">
              <h4 className="font-semibold text-black">Komunitas Pembaca</h4>
              <p className="text-sm text-gray-600 mt-2">
                Ulasan dari pembeli membantu Anda memilih buku terbaik. Bagikan pengalaman baca Anda untuk pembaca lain.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-2xl bg-gray-900 text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">Mulai Jelajahi Buku Favorit Anda</h3>
              <p className="text-gray-300 mt-2">Temukan bacaan baru dari berbagai kategori di BukuKu.</p>
            </div>
            <a
              href="/page/explore"
              className="mt-5 md:mt-0 inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-2 font-semibold hover:bg-gray-100 transition"
            >
              Jelajahi Sekarang
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
