import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://smb1ecl.loopie.fr'),
  title: 'SMB1 Engine Combined Leaderboard',
  description: 'Search and compare the most prolific speedrunners across the Super Mario Bros. engine family.',
  openGraph: {
    title: 'SMB1 Engine Combined Leaderboard',
    description: 'Search, filter, and compare the most prolific speedrunners across the Super Mario Bros. engine family.',
    url: 'https://smb1ecl.loopie.fr',
    siteName: 'SMB1 Engine Combined Leaderboard',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'SMB1 Engine Combined Leaderboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SMB1 Engine Combined Leaderboard',
    description: 'Search, filter, and compare the most prolific SMB1 engine speedrunners.',
    images: ['/og.png'],
  },
  icons: {
    icon: [{ url: '/mario-logo.webp', type: 'image/webp' }],
    shortcut: '/mario-logo.webp',
    apple: '/mario-logo.webp',
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
