import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#D4AF37',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'ASTRA — Know Yourself. Beyond Predictions.',
  description:
    'A premium AI experience inspired by Vedic astrology. Understand your birth chart, explore cosmic patterns, and gain meaningful self-insight through modern AI.',
  keywords: [
    'astrology',
    'Vedic astrology',
    'birth chart',
    'AI astrology',
    'self-reflection',
    'nakshatra',
    'dasha',
  ],
  authors: [{ name: 'ASTRA' }],
  creator: 'ASTRA',
  metadataBase: new URL('https://astra.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://astra.app',
    title: 'ASTRA — Know Yourself. Beyond Predictions.',
    description:
      'Understand your birth chart and explore cosmic patterns through modern AI. Premium self-reflection, not predictions.',
    siteName: 'ASTRA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASTRA — Know Yourself. Beyond Predictions.',
    description:
      'Understand your birth chart and explore cosmic patterns through modern AI.',
    creator: '@astra_app',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <body>
          {/* Skip to main content — keyboard accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-[#D4AF37] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black focus:outline-none"
          >
            Skip to main content
          </a>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
