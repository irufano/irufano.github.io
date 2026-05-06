import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve("."),
  },
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
