import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Geist_Mono } from 'next/font/google';
import './globals.css';

import { QueryProvider } from '@/shared/components/query-provider';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-heading',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SavageAI',
  description: 'AI assistants that tell you what they really think.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className='min-h-full flex flex-col'>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
