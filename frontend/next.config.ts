import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Proxy para o backend Go — evita CORS sem precisar recompilar o backend.
  // O frontend chama /proxy/* e o Next.js encaminha ao backend.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    return [
      {
        source: "/proxy/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
