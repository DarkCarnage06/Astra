import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/geocode(.*)',
  '/api/health(.*)',
  '/api/panchang(.*)',
  '/api/payment/webhook(.*)',
  '/robots.txt',
  '/sitemap.xml',
]);

/**
 * Clerk middleware for Next.js 16 (proxy.ts).
 *
 * - Protects non-public routes
 * - Serves Clerk Frontend API via /__clerk (dashboard proxy must stay enabled)
 * - Injects a Clerk-compatible CSP that also allows Razorpay, fonts, and the ASTRA API
 *
 * Do NOT set a separate Content-Security-Policy in next.config — browsers enforce
 * every CSP header, so a second incomplete policy would still block Clerk UI.
 */
export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  },
  {
    frontendApiProxy: {
      enabled: true,
    },
    contentSecurityPolicy: {
      directives: {
        'script-src': [
          'https://checkout.razorpay.com',
          'https://api.razorpay.com',
        ],
        'connect-src': [
          'https://astra-backend-m33g.onrender.com',
          'https://api.openrouter.ai',
          'https://openrouter.ai',
          'https://*.neon.tech',
          'https://api.razorpay.com',
          'https://*.clerk.accounts.dev',
          'https://*.clerk.com',
          'wss://*.clerk.com',
        ],
        'img-src': [
          'data:',
          'blob:',
          'https://*.clerk.com',
          'https://*.gravatar.com',
          'https://img.clerk.com',
        ],
        'font-src': ['https://fonts.gstatic.com'],
        'style-src': ['https://fonts.googleapis.com'],
        'frame-src': [
          'https://api.razorpay.com',
          'https://checkout.razorpay.com',
        ],
      },
    },
  },
);

export const config = {
  matcher: [
    // Skip Next static assets. NOTE: this also skips paths ending in .js —
    // including Clerk's proxied clerk.browser.js — so /__clerk must be listed
    // separately below or the SignIn UI never loads (npm assets 404 as HTML).
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    // Must run for ALL Clerk proxy paths, including /__clerk/npm/**/*.js
    '/__clerk/(.*)',
  ],
};
