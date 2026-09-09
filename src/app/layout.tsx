import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Carpschool - Decentralized Campus Ridesharing',
  description: 'Community-driven, non-commercial ridesharing tailored for schools and universities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k'}
    >
      <html lang="en">
        <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
