/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'app.cryptiomt.com']
    }
  }
  // Remove or comment out the output: 'standalone' line if it exists
};

export default nextConfig;