import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { t } from '@/lib/i18n';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-dm' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });

export const metadata: Metadata = {
  title: t('meta.title'),
  description: t('meta.description'),
  openGraph: {
    title: t('meta.ogTitle'),
    description: t('meta.ogDescription'),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${fraunces.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
