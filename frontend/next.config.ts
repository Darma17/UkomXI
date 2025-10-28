import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.duniailkom.com",
      },
      {
        protocol: "http",
        hostname: "localhost", // bisa tambahkan domain lain di sini
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1", // bisa tambahkan domain lain di sini
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "ebooks.gramedia.com",
      },
      {
        protocol: "https",
        hostname: "image.gramedia.net",
      },
    ],
  },
};

export default nextConfig;
