/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint in build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Server configuration
  server: {
    port: 80,
    host: '0.0.0.0',
  },

  // Enable standalone output
  output: 'standalone',

  // Experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['app.cryptiomt.com', 'localhost:3000']
    },
    // Add other experimental features if needed
  },

  // Asset prefix if needed
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://app.cryptiomt.com' : '',

  // Enable compression
  compress: true,

  // Enable strict mode
  reactStrictMode: true,

  // Configure images domains if you're using next/image
  images: {
    domains: [],
    // Enable remote patterns if needed
    // remotePatterns: [],
  },

  // Configure redirects if needed
  async redirects() {
    return []
  },

  // Configure headers if needed
  async headers() {
    return []
  },
};

export default nextConfig;