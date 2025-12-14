import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production'

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' https: ${isDev ? "'unsafe-eval'" : ""}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' ws: http: https:",
  "frame-src 'self' https:",
  "worker-src 'self' blob:",
  "frame-ancestors 'self'",
].join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
};

export default nextConfig;
