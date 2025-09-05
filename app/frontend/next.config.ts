/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['app.cryptiomt.com', 'localhost:3000']
    }
  },
  // Add these settings
  server: {
    port: 80,
    host: '0.0.0.0'
  },
  // Uncomment this as it might be needed for production
  output: 'standalone',
};

export default nextConfig;