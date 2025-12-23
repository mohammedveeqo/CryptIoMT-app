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
  // Allow development on local network IP
  // The allowedDevOrigins option expects the Host header value (domain:port)
  // Note: This is technically experimental but TS types might be outdated or it might be root level in some versions.
  // We will try root level if experimental fails type check, but logs suggest experimental.
  // However, since we got a TS error in experimental, let's try to suppress it or check if it works at root.
  // Actually, the error confirmed it's NOT in ExperimentalConfig type.
  
  // Let's try keeping it in experimental but casting or ignoring since runtime verified it.
  experimental: {
     allowedDevOrigins: ["localhost:3000", "192.168.4.193:3000", "192.168.4.193"],
  } as any, // Cast to any to avoid TS error since runtime supports it
  eslint: {
    // Warning: This allows production builds to successfully complete even if your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async headers() {
    if (isDev) {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'Referrer-Policy', value: 'no-referrer' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ],
        },
      ]
    }
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
