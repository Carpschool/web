import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Providers from '@/components/Providers';
import './globals.css';
export const metadata: Metadata = { title: 'Carpschool', description: 'Carpool with verified students from your own school.', manifest: '/manifest.webmanifest', icons: { icon: [{ url: '/favicon.ico' }, { url: '/icons/icon-light-192.png', media: '(prefers-color-scheme: light)' }, { url: '/icons/icon-dark-192.png', media: '(prefers-color-scheme: dark)' }], apple: '/apple-touch-icon.png' } };
export const viewport: Viewport = { themeColor: '#F5F7FA', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: '#17243A', colorText: '#17243A', colorTextSecondary: '#4A5468', colorBackground: '#FFFFFF', borderRadius: '14px', fontFamily: 'var(--font-body)' }, elements: { card: { boxShadow: '0 1px 0 rgba(19,32,59,.08), 0 20px 50px -24px rgba(19,32,59,.35)', border: '1px solid rgba(19,32,59,.1)' }, formButtonPrimary: { borderRadius: '999px', textTransform: 'none', fontWeight: 700 }, headerTitle: { fontFamily: 'var(--font-display)', fontWeight: 750 } } }}>
      <html lang="en">
        <head><meta charSet="utf-8" /></head><body><Providers>{children}</Providers></body>
      </html>
    </ClerkProvider>
  );
}
