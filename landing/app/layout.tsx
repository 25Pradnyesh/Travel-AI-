import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#070d12',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://vamo.travel'),
  title: 'VAMO — Drop a reel. Find the place.',
  description:
    'AI destination detection for travel reels. Drop an Instagram Reel link to identify landmarks, explore historical weather normals, and build verified travel dossiers.',
  keywords: [
    'travel ai',
    'instagram reel travel',
    'landmark recognition',
    'destination detection',
    'travel dossier',
    'open-meteo travel',
    'vamo',
  ],
  authors: [{ name: 'VAMO Project' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'VAMO — Drop a reel. Find the place.',
    description:
      'AI destination detection for travel reels. Drop an Instagram Reel link to identify landmarks, explore historical weather normals, and build verified travel dossiers.',
    url: '/',
    siteName: 'VAMO',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'VAMO — Drop a reel. Find the place. AI destination detection for travel reels.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VAMO — Drop a reel. Find the place.',
    description:
      'AI destination detection for travel reels. Drop an Instagram Reel link to identify landmarks, explore weather normals, and build verified dossiers.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#070d12] text-[#fbf4e3] antialiased min-h-screen selection:bg-[#a6dcf8]/30 selection:text-[#fbf4e3]">
        {children}
      </body>
    </html>
  );
}
