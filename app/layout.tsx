import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { t } from '@/lib/i18n';
import './globals.css';

const themeInitScript = `
(function () {
  try {
    var raw = localStorage.getItem('vault-theme');
    var theme = 'dark';
    if (raw) {
      var data = JSON.parse(raw);
      if (data && data.state && data.state.theme) theme = data.state.theme;
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

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
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${dmSans.variable} ${fraunces.variable} antialiased`}>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
