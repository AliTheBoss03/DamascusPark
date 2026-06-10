/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // react-leaflet ships ESM; transpile it for the Next bundler.
  transpilePackages: ["react-leaflet", "@react-leaflet/core"],
};

module.exports = nextConfig;
