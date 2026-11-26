import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

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
  '/manifest.json',
  '/auth-unavailable',
]);

const isSignInRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
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
const clerkProxy = clerkMiddleware(
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

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
    return clerkProxy(request, event);
  }

  if (isPublicRoute(request) && !isSignInRoute(request)) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'auth_unavailable', message: 'Sign-in is currently unavailable.' }, { status: 503 });
  }
  return NextResponse.redirect(new URL('/auth-unavailable', request.url));
}

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
