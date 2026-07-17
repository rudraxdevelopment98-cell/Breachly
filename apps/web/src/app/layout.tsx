import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/lib/queryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'aegis — exposure dashboard',
  description:
    'Zero-knowledge personal data OS: exposure monitoring, passwords, and documents.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
