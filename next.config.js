/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are enabled by default in Next.js 14
  // No need for experimental.serverActions configuration

  // Enable static export for Capacitor/Mobile app
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true
  },

  // Trailing slash for better compatibility
  trailingSlash: true
}

module.exports = nextConfig