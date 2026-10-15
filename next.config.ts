import type { NextConfig } from 'next';

/**
 * Security headers live here.
 * Content-Security-Policy is intentionally NOT set here — it is injected by
 * clerkMiddleware({ contentSecurityPolicy }) in proxy.ts so Clerk's Frontend
 * API, scripts, workers, and challenge frames are allowed automatically.
 * A second incomplete CSP header would still block the SignIn UI in browsers.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
