import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import { LenisProvider } from '@/components/LenisProvider';
import "maplibre-gl/dist/maplibre-gl.css";

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

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RouteWise | School Transportation & Fleet Optimization Platform',
  description:
    'High-performance autonomous routing, live student telemetry, and multi-tier bell schedule optimization for modern school districts.',
  keywords: [
    'school bus route optimization',
    'student transportation software',
    'fleet telemetry',
    'district bus routing',
    'real-time ridership sync',
  ],
  authors: [{ name: 'RouteWise Technologies' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0C10',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable} dark`}
    >
      <body className="bg-bg-grid text-text-primary antialiased selection:bg-signal-cyan selection:text-bg-grid min-h-screen">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
