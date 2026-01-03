import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'A11yScan - Web Accessibility Validator',
  description:
    'Audit your web URLs for WCAG 2.1/2.2 accessibility compliance. Identify and fix barriers for users with visual, motor, and cognitive impairments.',
  keywords: ['accessibility', 'a11y', 'WCAG', 'validator', 'audit'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

