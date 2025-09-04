/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  async redirects() {
    return [
      {
        source: '/sign-in',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/login',
          destination: '/login',
        },
        {
          source: '/dashboard',
          destination: '/dashboard',
        },
      ],
    };
  },
};

module.exports = nextConfig;