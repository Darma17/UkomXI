"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // ✅ Tambahan penting
import { Menu, X, ShoppingCart, User, Search } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const pathname = usePathname(); // ✅ deteksi halaman aktif

  useEffect(() => {
    // Hanya aktifkan efek scroll di halaman Home
    if (pathname === "/") {
      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      // Di halaman lain, selalu mode scrolled (putih)
      setScrolled(true);
    }
  }, [pathname]);

  // === Style tergantung state ===
  const iconColor = scrolled ? "text-gray-800" : "text-white";
  const navbarBg = scrolled ? "bg-white shadow-md" : "bg-transparent";
  const textColor = scrolled ? "text-gray-800" : "text-white";
  const sidebarBg = scrolled ? "bg-white text-gray-800" : "bg-gray-900 text-white";
  const sidebarBorder = scrolled ? "border-gray-200" : "border-gray-700";

  return (
    <>
      {/* === NAVBAR === */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${navbarBg}`}
      >
        <div className="flex items-center justify-between px-6 py-4 relative">
          {/* === SEARCH MODE === */}
          {searchMode ? (
            <div className="flex justify-center items-center w-full">
              <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 w-[50%] max-w-xl shadow-md">
                <Search className="w-5 h-5 text-gray-600 mr-3" />
                <input
                  type="text"
                  placeholder="Cari buku..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-800 text-sm"
                  autoFocus
                />
                <button onClick={() => setSearchMode(false)} className="cursor-pointer">
                  <X className="w-5 h-5 text-gray-700 hover:text-red-500 transition" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* === LEFT: Burger === */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`cursor-pointer focus:outline-none transition-transform duration-300 ${iconColor} ${
                  isOpen ? "rotate-90" : "rotate-0"
                }`}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* === CENTER: Logo === */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Link href="/" className="flex items-center justify-center">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="h-10 w-10 object-contain transition-transform duration-300 hover:scale-105"
                  />
                </Link>
              </div>

              {/* === RIGHT: Icons === */}
              <div className="flex items-center space-x-6 ml-auto relative">
                {/* === Cart Icon === */}
                <Link href="/page/cart" className="relative group">
                  <ShoppingCart
                    className={`w-6 h-6 transition-all duration-300 ${iconColor} group-hover:scale-110`}
                  />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 rounded-full">
                    3
                  </span>
                </Link>

                {/* === User Icon + Popup === */}
                <div
                  className="relative group"
                  onMouseEnter={() => setShowLogin(true)}
                  onMouseLeave={() => setShowLogin(false)}
                >
                  <User
                    className={`w-6 h-6 transition-all duration-300 ${iconColor} group-hover:scale-110 cursor-pointer`}
                  />

                  {showLogin && (
                  <div className="absolute right-0 mt-1 w-80 bg-white text-gray-800 rounded-xl shadow-lg border border-gray-200 p-6 z-50 animate-fadeIn">
                    <h2 className="text-lg font-semibold mb-4 text-center">MASUK</h2>
                    <form className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Alamat Email</label>
                        <input
                          type="email"
                          placeholder="Masukkan Email Anda"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Password</label>
                        <input
                          type="password"
                          placeholder="Masukkan Password Anda"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <Link href="#" className="text-blue-600 hover:underline">
                          Lupa Password?
                        </Link>
                      </div>
                      <Link href={""}>
                        <button
                          type="submit"
                          className="cursor-pointer w-full bg-black text-white py-2 rounded-md font-medium hover:bg-gray-800 transition"
                        >
                          MASUK
                        </button>
                      </Link>
                    </form>

                    <div className="my-4 text-center text-sm text-gray-500">OR</div>

                    {/* === TOMBOL GOOGLE LOGIN === */}
                    <button
                      type="button"
                      className="w-full flex items-center justify-center border border-gray-400 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition gap-2"
                    >
                      <img
                        src="https://www.svgrepo.com/show/355037/google.svg"
                        alt="Google Icon"
                        className="w-5 h-5"
                      />
                      Masuk dengan Google
                    </button>

                    {/* === TEKS BUAT AKUN === */}
                    <div className="text-center mt-4 text-sm text-gray-500">
                      Belum Punya Akun?{" "}
                      <Link
                        href="../page/create-account"
                        className="text-black font-medium hover:underline"
                      >
                        Buat Akun
                      </Link>
                    </div>
                  </div>
                )}

                </div>

                {/* === Search Icon === */}
                <button
                  onClick={() => setSearchMode(true)}
                  className="group focus:outline-none cursor-pointer"
                >
                  <Search
                    className={`w-6 h-6 transition-all duration-300 ${iconColor} group-hover:scale-110`}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* === SIDEBAR === */}
      <div
        className={`fixed top-0 left-0 h-full w-64 ${sidebarBg} border-r ${sidebarBorder} shadow-xl transform transition-all duration-500 ease-in-out z-50 ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
      >
        <div className={`flex justify-between items-center px-6 py-4 border-b ${sidebarBorder}`}>
          <span className="font-bold text-lg">Menu</span>
          <button className="hover:text-blue-400 transition" onClick={() => setIsOpen(false)}>
            <X className="cursor-pointer w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col p-6 space-y-5">
          {[
            { href: "/", label: "Beranda" },
            { href: "/page/explore", label: "Jelajahi" },
            // { href: "/signin", label: "Kategori" },
            { href: "/page/about", label: "Tentang Kami" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-medium text-lg transition-colors ${
                scrolled ? "hover:text-blue-600" : "hover:text-blue-300"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* === OVERLAY === */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
}
