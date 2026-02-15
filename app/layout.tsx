/**
 * Root layout for the entire application
 * Provides global providers, metadata, and base structure
 */

import type { Metadata, Viewport } from 'next';
import { QueryProvider } from '@/lib/providers/query-provider';
import { NotificationProvider } from '@/lib/providers/notification-provider';
import { PWAProvider } from '@/lib/providers/pwa-provider';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants/app';
import './globals.css';

/**
 * Application metadata for SEO and PWA
 */
export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/favicon.ico' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
};

/**
 * Viewport configuration for responsive design
 * Updated for iOS Safari compatibility and accessibility (WCAG AA)
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility (WCAG AA requirement)
  userScalable: true, // Enable pinch-to-zoom
  viewportFit: 'cover', // Respect safe area insets on notched devices (iPhone X+)
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout component
 * 
 * @param props - Component props
 * @returns Layout wrapper
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ErrorBoundary>
          <QueryProvider>
            <NotificationProvider>
              <PWAProvider>
              {children}
              </PWAProvider>
            </NotificationProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
