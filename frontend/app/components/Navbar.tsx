"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // added useRouter
import { Menu, X, ShoppingCart, User, Search } from "lucide-react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import axios from "axios";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // NEW: track authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // NEW: cart count state
  const [cartCount, setCartCount] = useState(0);

  // NEW: user profile and profile-menu state
  const [profile, setProfile] = useState<{ name?: string; email?: string; profile_image?: string } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // NEW: reusable fetchCartCount so we can call it from handlers
  const fetchCartCount = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/cart/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartCount(res?.data?.count || 0);
    } catch (err) {
      setCartCount(0);
    }
  };

  const pathname = usePathname();
  const router = useRouter(); // router for redirect

  // New: popup login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState("");

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

  // New: auto-hide login popup error after 4s
  useEffect(() => {
    if (!loginErrorMsg) return;
    const id = setTimeout(() => setLoginErrorMsg(""), 4000);
    return () => clearTimeout(id);
  }, [loginErrorMsg]);

  // New: handle popup login submit (behavior same as SignIn)
  async function handlePopupLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErrorMsg("");
    setLoginLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoginErrorMsg(data.message || "Gagal masuk");
        setLoginLoading(false);
        return;
      }

      // success -> redirect to OTP page with email query and close popup
      setShowLogin(false);
      router.push(`/page/otp?email=${encodeURIComponent(loginEmail)}`);
    } catch (err) {
      setLoginErrorMsg("Network error, coba lagi");
    } finally {
      setLoginLoading(false);
    }
  }

  // Check auth token on mount and listen for changes (login/logout)
  useEffect(() => {
    const check = () => {
      const tokenExists = !!localStorage.getItem("authToken");
      setIsAuthenticated(tokenExists);
      return tokenExists;
    };

    const loadProfile = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setProfile(null);
        return;
      }
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res?.data || null);
      } catch (err) {
        setProfile(null);
      }
    };

    const tokenExists = check();
    if (tokenExists) {
      fetchCartCount();
      loadProfile();
    }

    // handle storage (other tabs) and custom event (same tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "authToken") {
        const nowAuth = !!e.newValue;
        setIsAuthenticated(nowAuth);
        if (nowAuth) {
          fetchCartCount();
          loadProfile();
        } else {
          setCartCount(0);
          setProfile(null);
        }
      }
    };
    const onAuthChanged = () => {
      const nowAuth = !!localStorage.getItem("authToken");
      setIsAuthenticated(nowAuth);
      if (nowAuth) {
        fetchCartCount();
        loadProfile();
      } else {
        setCartCount(0);
        setProfile(null);
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChanged", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChanged", onAuthChanged);
    };
  }, []);

  // Optional: refresh cart count after login via this tab (e.g. after Google login)
  useEffect(() => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    // fetch latest when isAuthenticated toggles true
    const load = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/cart/count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartCount(res?.data?.count || 0);
      } catch {
        setCartCount(0);
      }
    };
    load();
  }, [isAuthenticated]);

  // NEW: logout handler
  const handleLogout = async () => {
    const token = localStorage.getItem("authToken");
    try {
      if (token) {
        await axios.post("http://127.0.0.1:8000/api/logout", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // ignore errors but still clear client state
    } finally {
      localStorage.removeItem("authToken");
      setIsAuthenticated(false);
      setProfile(null);
      setCartCount(0);
      window.dispatchEvent(new Event("authChanged"));
      router.push("/");
    }
  };

  // === Style tergantung state ===
  const iconColor = scrolled ? "text-gray-800" : "text-white";
  const navbarBg = scrolled ? "bg-white shadow-md" : "bg-transparent";
  const textColor = scrolled ? "text-gray-800" : "text-white";
  const sidebarBg = scrolled ? "bg-white text-gray-800" : "bg-gray-900 text-white";
  const sidebarBorder = scrolled ? "border-gray-200" : "border-gray-700";
  const image = scrolled ? "/images/logo.png" : "/images/logoPutih.png";

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
                    src={image}
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
                  {/* show badge only when authenticated AND cartCount > 0 */}
                  {isAuthenticated && cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* === User Icon + Profile Dropdown when authenticated === */}
                {isAuthenticated ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setShowProfileMenu(true)}
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <User className={`w-6 h-6 ${iconColor} cursor-pointer`} />

                    {showProfileMenu && (
                      <div className="absolute right-0 mt-1 w-56 bg-white text-gray-800 rounded-xl shadow-lg border border-gray-200 p-4 z-50">
                        {/* avatar */}
                        <div className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 mb-3">
                            <img
                              src={
                                profile && profile.profile_image
                                  ? `http://127.0.0.1:8000/storage/profile/${profile.profile_image}`
                                  : "/images/profile.png"
                              }
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-lg font-semibold text-gray-900">{profile?.name || ''}</div>
                          <div className="text-sm text-gray-500 mb-3">{profile?.email || ''}</div>

                          <button
                            onClick={handleLogout}
                            className="mt-1 w-full border border-red-500 text-red-500 py-2 rounded-md hover:bg-red-500 hover:text-white transition"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // If not logged in: keep hover popup behavior
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
                        {/* Top notification for popup errors */}
                        {loginErrorMsg && (
                          <div className="fixed left-1/2 transform -translate-x-1/2 top-4 z-50">
                            <div className="bg-red-600 text-white px-6 py-2 rounded shadow-md animate-fadeIn">
                              {loginErrorMsg}
                            </div>
                          </div>
                        )}

                        <h2 className="text-lg font-semibold mb-4 text-center">MASUK</h2>

                        {/* Changed: form is now controlled and submits via handlePopupLogin */}
                        <form className="space-y-4" onSubmit={handlePopupLogin}>
                          <div>
                            <label className="text-sm font-medium">Alamat Email</label>
                            <input
                              type="email"
                              placeholder="Masukkan Email Anda"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Password</label>
                            <input
                              type="password"
                              placeholder="Masukkan Password Anda"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <Link href="/page/forgot-password" className="text-blue-600 hover:underline">
                              Lupa Password?
                            </Link>
                          </div>

                          <button
                            type="submit"
                            className="cursor-pointer w-full bg-black text-white py-2 rounded-md font-medium hover:bg-gray-800 transition disabled:opacity-60"
                            disabled={loginLoading}
                          >
                            {loginLoading ? "Loading..." : "MASUK"}
                          </button>
                        </form>

                        <div className="my-4 text-center text-sm text-gray-500">OR</div>

                        {/* === TOMBOL GOOGLE LOGIN === */}
                        <GoogleOAuthProvider clientId="764774487773-iikq8ssu0drtdijjha7n0139r8j27cpc.apps.googleusercontent.com">
                          <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                              try {
                                const token = credentialResponse.credential
                                const res = await axios.post("http://127.0.0.1:8000/api/google-login", { token })
                                if (res.status === 200) {
                                  // Simpan token dari Laravel
                                  localStorage.setItem("authToken", res.data.token)
                                  // Immediately update navbar state and cart badge (no refresh needed)
                                  setIsAuthenticated(true)
                                  await fetchCartCount()
                                  // notify other listeners/tabs
                                  window.dispatchEvent(new Event("authChanged"))
                                  setShowLogin(false)
                                  router.push("/") // arahkan ke halaman utama
                                } else {
                                  setLoginErrorMsg("Gagal login dengan Google atau akun Google belum terdaftar")
                                }
                              } catch (err) {
                                console.error(err)
                                setLoginErrorMsg("Gagal login dengan Google atau akun Google belum terdaftar")
                              }
                            }}
                            onError={() => setLoginErrorMsg("Login Google gagal")}
                          />
                        </GoogleOAuthProvider>

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
                )}

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
