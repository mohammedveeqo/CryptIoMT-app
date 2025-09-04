/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['app.cryptiomt.com', 'localhost:3000']
    }
  },
  // Remove the output: 'standalone' line for now
  // output: 'standalone',
};

export default nextConfig;