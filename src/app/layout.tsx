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
    <ClerkProvider appearance={{ variables: { colorPrimary: '#13203B', borderRadius: '12px', fontFamily: 'var(--font-body)' } }}>
      <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <body><Providers>{children}</Providers></body>
      </html>
    </ClerkProvider>
  );
}
