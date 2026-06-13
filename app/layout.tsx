import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-dm' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });

export const metadata: Metadata = {
  title: 'Personal Document Vault',
  description: 'Your personal archive for documents, files and photos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${fraunces.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
