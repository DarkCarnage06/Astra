/**
 * lib/api.ts
 *
 * Centralized API helper for constructing ASTRA backend URLs.
 * Sanitizes bases and paths to eliminate double-slashes and verifies env vars.
 */

// Validate client-side accessible variables on the browser/server.
const isProd = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

if (isProd) {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error(
      'BUILD FAILURE: NEXT_PUBLIC_API_URL is not set. ' +
      'Add NEXT_PUBLIC_API_URL=https://astra-backend-m33g.onrender.com to Vercel environment variables.'
    );
  } else if (
    process.env.NEXT_PUBLIC_API_URL.includes('localhost') ||
    process.env.NEXT_PUBLIC_API_URL.includes('127.0.0.1')
  ) {
    throw new Error(
      `BUILD FAILURE: NEXT_PUBLIC_API_URL points to localhost in production: ` +
      `"${process.env.NEXT_PUBLIC_API_URL}". ` +
      `Set it to https://astra-backend-m33g.onrender.com in Vercel environment variables.`
    );
  }
}

// Clean and sanitize the API base
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const API_BASE = rawApiUrl.replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  // Ensure no double slashes in paths like "http://api.domain//api/chart"
  const url = `${API_BASE}${sanitizedPath}`;
  // Replace double slashes after the protocol (http:// or https://)
  return url.replace(/([^:]\/)\/+/g, '$1');
};

/**
 * Server-only environment variable auditor.
 * Call this in API routes to guarantee required keys are present, well-formed, and secure.
 */
export function verifyServerEnv() {
  if (typeof window !== 'undefined') return; // Do not execute in browser

  const missing: string[] = [];

  const required = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'OPENROUTER_API_KEY',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(`CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate formatting
  const apiVal = process.env.NEXT_PUBLIC_API_URL || '';
  if (isProd && (!apiVal || apiVal.includes('localhost') || apiVal.includes('127.0.0.1'))) {
    throw new Error(`CRITICAL: NEXT_PUBLIC_API_URL is invalid in production: "${apiVal}"`);
  }

  // Check for malformed URL schemes (e.g. double slashes in database protocol or clerk publishable key spacing)
  const dbVal = process.env.DATABASE_URL || '';
  if (dbVal.includes(' ') || !dbVal.startsWith('postgres')) {
    throw new Error('CRITICAL: DATABASE_URL appears to be malformed.');
  }
}
