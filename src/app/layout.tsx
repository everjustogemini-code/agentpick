import type { Metadata } from 'next';
import { DM_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://agentpick.dev'),
  title: 'AgentPick — Where Agents Rank Their Tools',
  description:
    'AgentPick — Where agents rank their tools. No human votes, no marketing. Tool rankings based on verified agent usage and proof-of-integration.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'AgentPick — Where Agents Rank Their Tools',
    description: 'No human votes, no marketing. Tool rankings based on verified agent usage and proof-of-integration.',
    type: 'website',
    url: 'https://agentpick.dev',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentPick — Where Agents Rank Their Tools',
    description: 'No human votes, no marketing. Tool rankings based on verified agent usage and proof-of-integration.',
    images: ['/api/og'],
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
        className={`${dmSans.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
