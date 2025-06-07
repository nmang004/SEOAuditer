import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import ClientLayout from './client-layout';

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://seo-director.com'),
  title: 'SEO Director - Premium SEO Analysis Dashboard',
  description: 'A powerful SEO analysis tool to help you direct your SEO strategy with comprehensive website audits, competitor analysis, and performance tracking.',
  keywords: 'SEO, search engine optimization, competitor analysis, website ranking, SEO audit, performance tracking, mobile optimization',
  applicationName: 'SEO Director',
  authors: [{ name: 'SEO Director Team' }],
  generator: 'Next.js',
  category: 'Business',
  classification: 'SEO Tools',
  creator: 'SEO Director',
  publisher: 'SEO Director',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'SEO Director',
    title: 'SEO Director - Premium SEO Analysis Dashboard',
    description: 'A powerful SEO analysis tool to help you direct your SEO strategy',
    url: 'https://seo-director.com',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SEO Director SEO Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Director - Premium SEO Analysis Dashboard',
    description: 'A powerful SEO analysis tool to help you direct your SEO strategy',
    images: ['/images/twitter-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SEO Director',
    startupImage: [
      {
        url: '/images/apple-splash-2048-2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/images/apple-splash-1668-2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/images/apple-splash-1536-2048.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/images/apple-splash-1125-2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/images/apple-splash-1242-2688.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
      },
      {
        url: '/images/apple-splash-750-1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
      {
        url: '/images/apple-splash-828-1792.png',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SEO Director" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />

        {/* Preload critical resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        
        {/* Resource hints */}
        <link rel="dns-prefetch" href="//localhost:4000" />
        <link rel="preconnect" href="http://localhost:4000" crossOrigin="anonymous" />

        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="origin-when-cross-origin" />
      </head>
      <body 
        className={`${inter.variable} ${jetBrainsMono.variable} font-sans antialiased touch-manipulation`}
        style={{ 
          /* Disable pull-to-refresh on mobile browsers */
          overscrollBehavior: 'none',
          /* Improve scroll performance on mobile */
          WebkitOverflowScrolling: 'touch',
          /* Prevent selection highlighting on touch */
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
