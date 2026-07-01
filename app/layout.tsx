import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASTRA — Know Yourself. Beyond Predictions.',
  description: 'A premium AI experience inspired by Vedic astrology and modern cosmic interfaces.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
