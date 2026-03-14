import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? "https://irufano.github.io"
      : "http://localhost:3000",
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  reactStrictMode: true,
};

export default nextConfig;
