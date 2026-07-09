import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://astra.app'),
  title: {
    default: 'ASTRA — Know Yourself. Beyond Predictions.',
    template: '%s — ASTRA',
  },
  description:
    'A premium AI Vedic astrology experience. Generate your birth chart, explore planetary positions, dasha timelines, compatibility analysis, and receive personalized cosmic guidance.',
  keywords: ['vedic astrology', 'birth chart', 'kundali', 'jyotish', 'horoscope', 'dasha', 'nakshatra'],
  authors: [{ name: 'ASTRA' }],
  openGraph: {
    title: 'ASTRA — Know Yourself. Beyond Predictions.',
    description: 'Premium AI Vedic astrology. Birth charts, planetary insights, compatibility and more.',
    url: 'https://astra.app',
    siteName: 'ASTRA',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ASTRA — Vedic Astrology AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASTRA — Know Yourself. Beyond Predictions.',
    description: 'Premium AI Vedic astrology. Birth charts, planetary insights, compatibility and more.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
