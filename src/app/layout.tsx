import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://agentpick.dev'),
  title: 'AgentPick — The runtime layer for agent tools',
  description:
    'One API. Every tool. AI routing. Auto-fallback. Route your agent through 26 verified APIs with smart routing and auto-fallback.',
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'AgentPick — The runtime layer for agent tools',
    description: 'One API. Every tool. AI routing. Auto-fallback. Route your agent through 26 verified APIs with smart routing and auto-fallback.',
    type: 'website',
    url: 'https://agentpick.dev',
    images: [{ url: '/api/og?v=2', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentPick — The runtime layer for agent tools',
    description: 'One API. Every tool. AI routing. Auto-fallback. Route your agent through 26 verified APIs with smart routing and auto-fallback.',
    images: ['/api/og?v=2'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      <Analytics /><SpeedInsights /></body>
    </html>
  );
}
