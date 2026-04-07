import React from 'react';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Geist_Mono } from 'next/font/google';
import './globals.css';

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

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element => {
  return (
    <html
      lang='en'
      className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className='min-h-full flex flex-col'>{children}</body>
    </html>
  );
};

export default RootLayout;
