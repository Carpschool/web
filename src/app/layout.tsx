import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Providers from '@/components/Providers';
import './globals.css';
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
export const metadata: Metadata = { title: 'Carpschool', description: 'Carpool with verified students from your own school.' };
export const viewport: Viewport = { themeColor: '#F5F0E6', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: '#13203B', colorText: '#13203B', colorTextSecondary: '#4A5468', colorBackground: '#FFFDF8', borderRadius: '14px', fontFamily: 'var(--font-body)' }, elements: { card: { boxShadow: '0 1px 0 rgba(19,32,59,.08), 0 20px 50px -24px rgba(19,32,59,.35)', border: '1px solid rgba(19,32,59,.1)' }, formButtonPrimary: { borderRadius: '999px', textTransform: 'none', fontWeight: 700 }, headerTitle: { fontFamily: 'var(--font-display)', fontWeight: 750 } } }}>
      <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <body><Providers>{children}</Providers></body>
      </html>
    </ClerkProvider>
  );
}
