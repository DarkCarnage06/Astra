/**
 * lib/api.ts
 *
 * Centralized API helper for constructing ASTRA backend URLs.
 * Sanitizes bases and paths to eliminate double-slashes and verifies env vars.
 */

if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn('BUILD_WARNING: NEXT_PUBLIC_API_URL environment variable is missing. API calls may fail.');
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${sanitizedPath}`;
};
